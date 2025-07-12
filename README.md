# 🌟 React Revival: A Collection of Practice Projects

> A repository of small, focused applications built to practice and solidify modern front-end concepts using React and other modern tools.

## ✨ Live Demo

Explore the deployed projects here:

**[🚀 https://revival-beta.vercel.app/](https://revival-beta.vercel.app/)**

---

## 🚀 Projects Included

### 1. 🎯 Habit Tracker

![Habit Tracker Demo](public/images/habit-tracker.gif)

The Habit Tracker is a comprehensive tool designed to help users build, track, and analyze their daily habits with advanced analytics and a beautiful, responsive interface.

**Key Features:**

- **Dashboard Overview:**

  - See all your habits scheduled for today in a clean, prioritized list.
  - Drag-and-drop to reorder habits using an intuitive interface powered by Dnd-kit.
  - Instantly mark habits as complete, and see your progress update in real time.

- **Detailed Habit View:**

  - Dive into any habit to see a rich breakdown of your performance.
  - **Streaks:** Track your current and best streaks, calculated based on your schedule and completions.
  - **Completion Rate:** Visualize your consistency over time, with breakdowns for week, month, and all-time.
  - **Debt & Surplus:** See if you’re ahead or behind on your goals, with a running tally of surplus and debt days.
  - **Calendar Heatmap:** Get a bird’s-eye view of your habit completion history with a color-coded calendar.
  - **Charts & Analytics:** Interactive charts (powered by Chart.js) show your progress, trends, and patterns.
  - **Consistency Ring:** Instantly see your overall consistency as a percentage, visualized in a ring chart.

- **Habit Management:**

  - Add, edit, or delete habits with a user-friendly modal form.
  - Customize habit icons, colors, and schedules.

- **Responsive & Accessible:**
  - Fully responsive layout for mobile, tablet, and desktop.
  - Accessible design with semantic HTML, keyboard navigation, and ARIA labels.

**Concepts & Technologies Practiced:**

- **React Context & Custom Hooks:** Centralized state management for habits, with custom hooks for business logic and data manipulation.
- **Dnd-kit:** Advanced drag-and-drop for reordering habits, with keyboard and pointer support.
- **Chart.js:** Dynamic data visualization for analytics and progress tracking.
- **SCSS Modules:** Modular, maintainable, and responsive styles with theming and animation.
- **Component Architecture:** Highly reusable, composable components for UI and logic.
- **Accessibility:** Focus on inclusive design and usability.

---

---

### 2. 📊 Gaussian Visualizer

![Gaussian Visualizer Demo](public/images/gaussian-tracker.gif)

The Gaussian Visualizer is an interactive educational tool for exploring normal (Gaussian) distributions and process capability metrics, ideal for students, engineers, and data enthusiasts.

**Key Features:**

- **Live Distribution Chart:**

  - Adjust the mean, standard deviation, and specification limits (LSL/USL) to see the normal curve update instantly.
  - Visualize the impact of changes on the shape and spread of the distribution.

- **Process Capability Metrics:**

  - Instantly calculate and display Pp, Ppk, and PPM (defects per million) as you adjust parameters.
  - See how process centering and spread affect capability indices.

- **Educational Tooltips:**

  - Hover over controls and metrics to get clear, concise explanations of statistical concepts.
  - Learn the formulas and significance of each metric in context.

- **Modern, Responsive UI:**
  - Clean, accessible design that works on all devices.
  - Modular controls and chart components for easy extension.

**Concepts & Technologies Practiced:**

- **React State & Effects:** Real-time updates and calculations based on user input.
- **Chart.js & Plugins:** Advanced charting, annotation, and interactivity.
- **Vega-statistics:** Statistical calculations for normal distributions and capability indices.
- **Component Design:** Modular, reusable, and maintainable UI components.
- **Educational UX:** Focus on clarity, learning, and user empowerment.

---

## 🛠️ Local Development

To run these projects on your own machine:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kbhatnagar97/Revival.git
    ```
2.  **Navigate to the directory:**
    ```bash
    cd Revival
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Start the development server:**
    ```bash
    npm run dev
    ```

---

## 🎯 Tech Stack

- **Frontend:** React 18, TypeScript, SCSS
- **State Management:** React Context + Custom Hooks
- **UI/UX:** Drag & Drop (dnd-kit), Responsive Design
- **Charts:** Chart.js, Vega-statistics
- **Build Tool:** Vite
- **Deployment:** Vercel

---

## 🚀 Features Overview

| Feature                   | Habit Tracker                               | Gaussian Visualizer                        |
| ------------------------- | ------------------------------------------- | ------------------------------------------ |
| 📊 **Data Visualization** | Charts, Calendar Heatmap, Consistency Rings | Interactive Bell Curves, Real-time Metrics |
| 🎨 **UI/UX**              | Drag & Drop, Responsive, Dark/Light themes  | Educational Tooltips, Clean Controls       |
| 📱 **Accessibility**      | Keyboard Navigation, ARIA labels            | Screen Reader Support, Clear Typography    |
| ⚡ **Performance**        | Optimized Re-renders, Lazy Loading          | Real-time Calculations, Smooth Animations  |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs or suggest features
- Submit pull requests
- Improve documentation
- Share feedback

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
