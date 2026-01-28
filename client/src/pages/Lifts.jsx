import React, { useState, useEffect } from 'react';

function Lifts() {
  const [lifts, setLifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/lifts')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setLifts(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>Lifting Movements Tracking</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <ul>
        {lifts.map((lift) => (
          <li key={lift.id}>{lift.name}</li>
        ))}
      </ul>
      {/* UI for adding new lift entries will go here */}
    </div>
  );
}

export default Lifts;
