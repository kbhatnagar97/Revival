import React from 'react';
import './ConsistencyRing.scss';

interface ConsistencyRingProps {
  percentage: number;
  color: string;
  lightenedColor: string;
}

const ConsistencyRing: React.FC<ConsistencyRingProps> = ({
  percentage,
  color,
  lightenedColor,
}) => {
  // Use the original larger sizing for better visual impact
  const { svg: svgSize, stroke: strokeWidth } = { svg: 220, stroke: 32 };
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const clampedPercentage = Math.max(0, Math.min(percentage, 100));

  const progressOffset = circumference * (1 - clampedPercentage / 100);

  const gradientId = `consistencyGradient-${color.replace('#', '')}-large`;

  return (
    <div className='consistency-ring-container consistency-ring-container--large'>
      <svg
        width='100%'
        height='100%'
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className='consistency-ring'
      >
        <defs>
          <linearGradient id={gradientId} x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor={lightenedColor} />
            <stop offset='100%' stopColor={color} />
          </linearGradient>
        </defs>

        <circle
          className='consistency-ring__background'
          stroke='#eae6e1'
          strokeWidth={strokeWidth}
          r={radius}
          cx={svgSize / 2}
          cy={svgSize / 2}
        />

        <circle
          className='consistency-ring__progress'
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={progressOffset}
          r={radius}
          cx={svgSize / 2}
          cy={svgSize / 2}
          transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
        />

        <text
          x='50%'
          y='50%'
          textAnchor='middle'
          dominantBaseline='central'
          className='consistency-ring__text-svg'
        >
          {Math.round(percentage)}%
        </text>
      </svg>
    </div>
  );
};

export default ConsistencyRing;
