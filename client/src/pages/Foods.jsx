import React, { useState, useEffect } from 'react';

function Foods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });

  const fetchFoods = () => {
    fetch('/api/foods')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setFoods(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('/api/foods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })
      .then(res => res.json())
      .then(newFood => {
        setFoods([...foods, newFood]);
        setForm({ name: '', calories: '', protein: '', carbs: '', fat: '' }); // Clear form
      })
      .catch(error => {
        // Handle error, e.g., show an error message
        console.error('Error adding food:', error);
      });
  };

  return (
    <div>
      <h1>Foods Tracking</h1>
      
      <h2>Add a New Food</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleInputChange} required />
        <input type="number" name="calories" placeholder="Calories" value={form.calories} onChange={handleInputChange} required />
        <input type="number" name="protein" placeholder="Protein (g)" value={form.protein} onChange={handleInputChange} required />
        <input type="number" name="carbs" placeholder="Carbs (g)" value={form.carbs} onChange={handleInputChange} required />
        <input type="number" name="fat" placeholder="Fat (g)" value={form.fat} onChange={handleInputChange} required />
        <button type="submit">Add Food</button>
      </form>

      <h2>Food List</h2>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <ul>
        {foods.map((food) => (
          <li key={food.id}>
            {food.name} - Calories: {food.calories}, Protein: {food.protein}g, Carbs: {food.carbs}g, Fat: {food.fat}g
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Foods;
