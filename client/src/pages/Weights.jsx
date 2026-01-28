import React, { useState, useEffect } from 'react';
import ChartComponent from '../components/ChartComponent';

function Weights() {
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/weights')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setWeights(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const chartData = {
    labels: weights.map(w => new Date(w.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Weight (kg)',
        data: weights.map(w => w.weight),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Weight Progress',
      },
    },
  };

  return (
    <div>
      <h1>Weight Tracking</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <p>Here is your weight progress over time:</p>
      <div style={{ width: '80%', margin: 'auto' }}>
        <ChartComponent data={chartData} options={chartOptions} />
      </div>
      {/* Additional UI for adding new weight entries will go here */}
    </div>
  );
}

export default Weights;
