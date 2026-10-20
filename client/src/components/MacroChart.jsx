import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function CalorieChart({ days }) {
  const labels = days.map((d) => {
    // Format YYYY-MM-DD to M/D
    const parts = d.date.split('-');
    return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
  });

  const data = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Daily Calories (kcal)',
        data: days.map((d) => d.totalCalories),
        backgroundColor: 'rgba(54, 162, 235, 0.65)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Calorie Intake Over Time',
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.parsed.y} kcal`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Calories (kcal)',
        },
      },
    },
  };

  return (
    <div style={{ height: '320px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export function MacroTrendChart({ days }) {
  const labels = days.map((d) => {
    const parts = d.date.split('-');
    return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Protein (g)',
        data: days.map((d) => d.totalProtein),
        borderColor: '#e63946',
        backgroundColor: 'rgba(230, 57, 70, 0.1)',
        tension: 0.2,
        fill: false,
      },
      {
        label: 'Carbs (g)',
        data: days.map((d) => d.totalCarbs),
        borderColor: '#2a9d8f',
        backgroundColor: 'rgba(42, 157, 143, 0.1)',
        tension: 0.2,
        fill: false,
      },
      {
        label: 'Fat (g)',
        data: days.map((d) => d.totalFat),
        borderColor: '#e76f51',
        backgroundColor: 'rgba(231, 111, 81, 0.1)',
        tension: 0.2,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Macronutrients Trend (Protein, Carbs, Fat)',
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y}g`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Grams (g)',
        },
      },
    },
  };

  return (
    <div style={{ height: '320px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
}
