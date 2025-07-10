import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useHabits } from './hooks/useHabits';
import * as FaIcons from 'react-icons/fa';
import { FiTrendingUp, FiTrendingDown, FiCheckSquare, FiAward, FiZap } from 'react-icons/fi';
import './HabitDetail.scss';
import HabitCalendar from './components/HabitCalendar';
import HabitFormModal from './components/HabitFormModal';
import HabitCard from './components/HabitCard';
import ConsistencyRing from './components/ConsistencyRing';
import Tooltip from '../../common/components/Tooltip'; 
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend,
  PointElement,
  type ScriptableContext,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, ChartJSTooltip, Legend);

type TimeRange = 'week' | 'month' | 'all';
type OutletContextType = { isSidebarOpen: boolean };

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateStreaks = (completionData: { [date: string]: number } = {}, goal: number, scheduledDays: number[]) => {
  if (Object.keys(completionData).length === 0) return { current: 0, best: 0 };
  const completedDates = Object.entries(completionData)
    .filter(([, count]) => count >= goal)
    .map(([date]) => new Date(date + 'T00:00:00'))
    .sort((a, b) => b.getTime() - a.getTime());

  if (completedDates.length === 0) return { current: 0, best: 0 };

  let currentStreak = 0;
  const checkDate = new Date();
  while (true) {
    const dayOfWeek = checkDate.getDay();
    const dateString = getLocalDateString(checkDate);
    if (scheduledDays.includes(dayOfWeek)) {
      const wasCompleted = completedDates.some(d => getLocalDateString(d) === dateString);
      if (wasCompleted) {
        currentStreak++;
      } else {
        const today = new Date();
        if (getLocalDateString(checkDate) !== getLocalDateString(today)) break;
      }
    }
    checkDate.setDate(checkDate.getDate() - 1);
    if (completedDates.length > 0) {
      const timeSinceLastCompletion = new Date().getTime() - completedDates[0].getTime();
      const daysSinceLastCompletion = timeSinceLastCompletion / (1000 * 3600 * 24);
      if (currentStreak === 0 && daysSinceLastCompletion > 1.5) break;
    }
    if (currentStreak > 3650) break;
  }

  let bestStreak = 0;
  if (completedDates.length > 0) {
    bestStreak = 1;
    let tempStreak = 1;
    for (let i = 0; i < completedDates.length - 1; i++) {
      let gapIsClean = true;
      const dateInGap = new Date(completedDates[i+1]);
      dateInGap.setDate(dateInGap.getDate() + 1);
      const gapEndDate = completedDates[i];
      while (dateInGap < gapEndDate) {
        if (scheduledDays.includes(dateInGap.getDay())) {
          gapIsClean = false;
          break;
        }
        dateInGap.setDate(dateInGap.getDate() + 1);
      }
      if (gapIsClean) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);
  }

  return { current: currentStreak, best: bestStreak };
};

const calculateCumulativeStats = (completionData: { [date: string]: number } = {}, goal: number, scheduledDays: number[]) => {
    const dates = Object.keys(completionData).sort();
    if (dates.length === 0) return { debt: 0, surplus: 0 };
  
    let cumulativeDebt = 0;
    let cumulativeSurplus = 0;
  
    const startDate = new Date(dates[0] + 'T00:00:00');
    const today = new Date();
    today.setHours(23, 59, 59, 999);
  
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      if (scheduledDays.includes(d.getDay())) {
        const dateString = getLocalDateString(d);
        const count = completionData[dateString] || 0;
        const dailyDifference = count - goal;
  
        if (dailyDifference > 0) {
          const usedToPayDebt = Math.min(cumulativeDebt, dailyDifference);
          cumulativeDebt -= usedToPayDebt;
          cumulativeSurplus += (dailyDifference - usedToPayDebt);
        } else if (dailyDifference < 0) {
          const deficit = Math.abs(dailyDifference);
          const usedFromSurplus = Math.min(cumulativeSurplus, deficit);
          cumulativeSurplus -= usedFromSurplus;
          cumulativeDebt += (deficit - usedFromSurplus);
        }
      }
    }
  
    return { debt: cumulativeDebt, surplus: cumulativeSurplus };
};

const calculateCompletionRate = (
  completionData: { [date: string]: number } = {}, 
  goal: number, 
  scheduledDays: number[],
  daysToGoBack?: number
): number => {
    const today = new Date();
    let firstLogDate: Date;

    if (daysToGoBack) {
        firstLogDate = new Date();
        firstLogDate.setDate(today.getDate() - (daysToGoBack - 1));
    } else {
        const allDates = Object.keys(completionData);
        if (allDates.length === 0) return scheduledDays.length > 0 ? 0 : 100;
        firstLogDate = new Date(allDates.sort()[0] + 'T00:00:00');
    }
  
    let totalScheduledDays = 0;
    for (let d = new Date(firstLogDate); d <= today; d.setDate(d.getDate() + 1)) {
      if (scheduledDays.includes(d.getDay())) {
        totalScheduledDays++;
      }
    }
  
    if (totalScheduledDays === 0) return 100;
  
    const completedOnScheduledDays = Object.entries(completionData)
        .filter(([date, count]) => {
            const d = new Date(date + 'T00:00:00');
            return d >= firstLogDate && scheduledDays.includes(d.getDay()) && count >= goal;
        }).length;

    return (completedOnScheduledDays / totalScheduledDays) * 100;
};

const calculateSurplusRate = (completionData: { [date: string]: number } = {}, goal: number): number => {
    const completedEntries = Object.values(completionData).filter(count => count >= goal);
    if (completedEntries.length === 0) return 0;
    const surplusEntries = completedEntries.filter(count => count > goal).length;
    return (surplusEntries / completedEntries.length) * 100;
};

const lightenColor = (hex: string, percent: number) => {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    r = Math.min(255, r + (255 - r) * (percent / 100));
    g = Math.min(255, g + (255 - g) * (percent / 100));
    b = Math.min(255, b + (255 - b) * (percent / 100));
    const toHex = (c: number) => `0${Math.round(c).toString(16)}`.slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};


const HabitDetail = () => {
  const { habitId } = useParams<{ habitId: string }>();
  const { habits, getHabitById } = useHabits();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const { isSidebarOpen } = useOutletContext<OutletContextType>();
  const chartRef = useRef<ChartJS<'bar'>>(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const timeoutId = setTimeout(() => { chart.resize(); }, 310);
      return () => clearTimeout(timeoutId);
    }
  }, [isSidebarOpen]);

  const mainHabit = habitId ? getHabitById(habitId) : undefined;

  const habitsForSelectedDate = useMemo(() => {
    const dayIndex = selectedDate.getDay();
    const dateString = getLocalDateString(selectedDate);
    return habits
      .filter((habit) => habit.days.includes(dayIndex))
      .map((habit) => ({
        ...habit,
        count: habit.completionData?.[dateString] || 0,
      }));
  }, [habits, selectedDate]);
  
  const chartConfig = useMemo(() => {
    if (!mainHabit) return null;

    const labels: string[] = [];
    const counts: number[] = [];
    const goals: number[] = [];

    const today = new Date();
    let startDate = new Date();

    switch(timeRange) {
        case 'week':
            startDate.setDate(today.getDate() - 6);
            break;
        case 'month':
            startDate.setDate(today.getDate() - 29);
            break;
        case 'all':
            { const allDates = Object.keys(mainHabit.completionData).sort();
            startDate = allDates.length > 0 ? new Date(allDates[0] + "T00:00:00") : today;
            break; }
    }
    
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const labelFormat: Intl.DateTimeFormatOptions = timeRange === 'all' && (today.getTime() - startDate.getTime()) > 90 * 24 * 60 * 60 * 1000 
            ? { month: 'short', year: '2-digit' } 
            : { month: 'short', day: 'numeric' };
        labels.push(d.toLocaleDateString('en-US', labelFormat));
        const dateString = getLocalDateString(d);
        counts.push(mainHabit.completionData[dateString] || 0);
        goals.push(mainHabit.goal);
    }
    
    const data = {
        labels,
        datasets: [
            {
                type: 'bar' as const,
                label: 'Daily Count',
                data: counts,
                backgroundColor: (context: ScriptableContext<"bar">) => {
                    if (!context.chart.chartArea) return;
                    const { ctx, chartArea: {top, bottom} } = context.chart;
                    const gradient = ctx.createLinearGradient(0, bottom, 0, top);
                    gradient.addColorStop(0, `${mainHabit.color}99`);
                    gradient.addColorStop(1, `${mainHabit.color}ff`);
                    return gradient;
                },
                borderColor: mainHabit.color,
                borderRadius: 4,
                order: 2,
            },
            {
                type: 'line' as const,
                label: 'Goal',
                data: goals,
                borderColor: '#a39189',
                backgroundColor: '#a39189',
                borderWidth: 2,
                pointRadius: 0,
                borderDash: [5, 5],
                order: 1,
            }
        ]
    };
    
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 0, minRotation: 0, color: '#a39189' },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#eae6e1', borderDash: [3, 3] },
            ticks: { color: '#a39189', precision: 0 },
          }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#442b22',
                titleColor: '#fbfaf8',
                bodyColor: '#eae6e1',
                padding: 10,
                cornerRadius: 8,
                displayColors: false,
            }
        },
    };

    return { options, data };
  }, [mainHabit, timeRange]);

  if (!mainHabit) {
    return (
      <div className="habit-detail--not-found">
        <h2>Habit Not Found</h2>
        <p>This habit may have been deleted.</p>
        <button onClick={() => navigate('/habit-tracker')} className="back-btn"> <FaIcons.FaArrowLeft /> All Habits </button>
      </div>
    );
  }

  const { current: currentStreak, best: bestStreak } = calculateStreaks(mainHabit.completionData, mainHabit.goal, mainHabit.days);
  const totalCompletions = Object.values(mainHabit.completionData).filter((c) => c >= mainHabit.goal).length;
  const { debt: liveDebt, surplus: liveSurplus } = calculateCumulativeStats(mainHabit.completionData, mainHabit.goal, mainHabit.days);
  const netBalance = liveSurplus - liveDebt;
  const debtPercentage = mainHabit.goal > 0 ? Math.round((liveDebt / mainHabit.goal) * 100) : 0;
  const surplusPercentage = mainHabit.goal > 0 ? Math.round((liveSurplus / mainHabit.goal) * 100) : 0;
  
  const allTimeConsistency = calculateCompletionRate(mainHabit.completionData, mainHabit.goal, mainHabit.days);
  const weeklyFocus = calculateCompletionRate(mainHabit.completionData, mainHabit.goal, mainHabit.days, 7);
  const surplusRate = calculateSurplusRate(mainHabit.completionData, mainHabit.goal);

  const selectedDayHabit = habitsForSelectedDate.find(h => h.id === mainHabit.id);
  const selectedDayProgress = selectedDayHabit && mainHabit.goal > 0 
    ? (selectedDayHabit.count / mainHabit.goal) * 100 
    : 0;

  const formatNetBalance = (balance: number): string => {
    if (balance > 0) return `+${balance}`;
    return String(balance);
  };

  const handleDateSelect = (date: Date) => { setSelectedDate(date); };
  const handleOpenEditModal = () => { setIsModalOpen(true); };

  return (
    <>
      <div className="habit-detail">
        <div className="detail-header">
          <button onClick={() => navigate('/habit-tracker')} className="back-btn"> <FaIcons.FaArrowLeft /> All Habits </button>
          <div className="habit-title">
            <div className="habit-icon" style={{ backgroundColor: mainHabit.color }}> {(FaIcons as any)[mainHabit.icon]()} </div>
            <h1>{mainHabit.name}</h1>
            <button className="detail-edit-btn" onClick={handleOpenEditModal}> <FaIcons.FaPen /> Edit </button>
          </div>
        </div>

        <div className="detail-layout">
          <div className="detail-sidebar">
            <div className="calendar-container">
              <h3 className="container-title">Select a Date</h3>
              <HabitCalendar habits={habits} selectedDate={selectedDate} onDateSelect={handleDateSelect} />
            </div>
            <div className="daily-log-container">
              <h3 className="container-title"> Daily Log for {selectedDate.toLocaleDateString('en-us', { month: 'long', day: 'numeric' })} </h3>
              {habitsForSelectedDate.length > 0 ? (
                habitsForSelectedDate.map((habit) => (
                  <HabitCard key={habit.id} habit={habit} selectedDate={selectedDate} onEdit={() => {}} isSortable={false} isEditable={false} />
                ))
              ) : ( <p>No habits scheduled for this day.</p> )}
            </div>
          </div>
          <div className="detail-main-content">
            <div className="stats-container">
              <h3 className="container-title">
                All-Time Statistics
                <Tooltip content="Metrics calculated since your very first entry for this habit." />
              </h3>
              <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-card__icon icon--gold"><FiZap /></div>
                    <div className="stat-card__content">
                        <div className="stat-value">{currentStreak}</div>
                        <div className="stat-label">
                            Current Streak
                            <Tooltip content="Consecutive scheduled days completed, up to today." />
                        </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__icon icon--gold"><FiAward /></div>
                    <div className="stat-card__content">
                        <div className="stat-value">{bestStreak}</div>
                        <div className="stat-label">
                            Best Streak
                            <Tooltip content="The longest-ever streak of consecutive completions." />
                        </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__icon icon--neutral"><FiCheckSquare /></div>
                    <div className="stat-card__content">
                        <div className="stat-value">{totalCompletions}</div>
                        <div className="stat-label">
                            Completions
                            <Tooltip content="Total number of times the daily goal has been met." />
                        </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__icon icon--green"><FiTrendingUp /></div>
                    <div className="stat-card__content">
                        <div className="stat-value stat-value--surplus">{surplusPercentage}%</div>
                        <div className="stat-label">
                            Surplus
                             <Tooltip content="Percentage of goal accumulated from extra completions." />
                        </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__icon icon--red"><FiTrendingDown /></div>
                    <div className="stat-card__content">
                        <div className="stat-value stat-value--debt">{debtPercentage}%</div>
                        <div className="stat-label">
                            Debt
                            <Tooltip content="Percentage of goal owed from missed completions." />
                        </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className={`stat-card__icon ${netBalance > 0 ? 'icon--green' : netBalance < 0 ? 'icon--red' : 'icon--neutral'}`}>
                        <FaIcons.FaBalanceScale />
                    </div>
                    <div className="stat-card__content">
                        <div className={`stat-value ${netBalance > 0 ? 'stat-value--surplus' : netBalance < 0 ? 'stat-value--debt' : ''}`}>
                            {formatNetBalance(netBalance)}
                        </div>
                        <div className="stat-label">
                            Net Balance
                            <Tooltip content="Your total surplus completions minus total debt." />
                        </div>
                    </div>
                  </div>
              </div>
            </div>
            <div className="chart-container">
                <div className="chart-header">
                    <h3 className="container-title">Performance</h3>
                    <div className="time-range-tabs">
                        <button className={`time-range-tab ${timeRange === 'week' ? 'active' : ''}`} onClick={() => setTimeRange('week')}>7D</button>
                        <button className={`time-range-tab ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>30D</button>
                        <button className={`time-range-tab ${timeRange === 'all' ? 'active' : ''}`} onClick={() => setTimeRange('all')}>All</button>
                    </div>
                </div>
                {chartConfig && chartConfig.data.labels.length > 0 ? (
                  <div className="chart-wrapper">
                      <Chart ref={chartRef} type="bar" options={chartConfig.options as any} data={chartConfig.data} />
                  </div>
                ) : (
                  <p>No data to display for this habit yet.</p>
                )}
            </div>
            <div className="consistency-container">
              <h3 className="container-title">Insight Cluster</h3>
              <div className="consistency-cluster">
                  <div className="consistency-pod">
                    <h4 className="pod-title">
                        All-Time Consistency
                        <Tooltip content="Your overall success rate since you started tracking." />
                    </h4>
                    <ConsistencyRing percentage={allTimeConsistency} color={mainHabit.color} lightenedColor={lightenColor(mainHabit.color, 40)} />
                  </div>
                  <div className="consistency-pod">
                    <h4 className="pod-title">
                        7-Day Focus
                        <Tooltip content="Your success rate over the last week." />
                    </h4>
                    <ConsistencyRing percentage={weeklyFocus} color={mainHabit.color} lightenedColor={lightenColor(mainHabit.color, 40)} />
                  </div>
                  <div className="consistency-pod">
                    <h4 className="pod-title">
                        Surplus Rate
                        <Tooltip content="Of the days you met your goal, the percentage of time you went above and beyond." />
                    </h4>
                    <ConsistencyRing percentage={surplusRate} color={mainHabit.color} lightenedColor={lightenColor(mainHabit.color, 40)} />
                  </div>
                  <div className="consistency-pod">
                    <h4 className="pod-title">
                        Daily Snapshot
                        <Tooltip content="Progress for the currently selected date on the calendar." />
                    </h4>
                    <ConsistencyRing percentage={selectedDayProgress} color={mainHabit.color} lightenedColor={lightenColor(mainHabit.color, 40)} />
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && <HabitFormModal habitToEdit={mainHabit} onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default HabitDetail;