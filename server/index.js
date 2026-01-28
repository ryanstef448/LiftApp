const express = require('express');
const app = express();
const port = 3001; // You can choose any port

app.use(express.json());

const fs = require('fs');

app.get('/', (req, res) => {
  res.send('Hello from the LiftApp backend!');
});

// We will add our API routes here
app.get('/api/foods', (req, res) => {
  fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading database');
      return;
    }
    const db = JSON.parse(data);
    res.json(db.foods);
  });
});

app.post('/api/foods', (req, res) => {
  fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading database');
      return;
    }
    const db = JSON.parse(data);
    const newFood = req.body;
    newFood.id = db.foods.length > 0 ? Math.max(...db.foods.map(f => f.id)) + 1 : 1;
    db.foods.push(newFood);
    fs.writeFile('db.json', JSON.stringify(db, null, 2), (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error writing to database');
        return;
      }
      res.status(201).json(newFood);
    });
  });
});

app.get('/api/foods/:id', (req, res) => {
  fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading database');
      return;
    }
    const db = JSON.parse(data);
    const food = db.foods.find(f => f.id === parseInt(req.params.id));
    if (!food) {
      return res.status(404).send('Food not found');
    }
    res.json(food);
  });
});

app.put('/api/foods/:id', (req, res) => {
  fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading database');
      return;
    }
    const db = JSON.parse(data);
    const foodIndex = db.foods.findIndex(f => f.id === parseInt(req.params.id));
    if (foodIndex === -1) {
      return res.status(404).send('Food not found');
    }
    const updatedFood = { ...db.foods[foodIndex], ...req.body };
    db.foods[foodIndex] = updatedFood;
    fs.writeFile('db.json', JSON.stringify(db, null, 2), (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error writing to database');
        return;
      }
      res.json(updatedFood);
    });
  });
});

app.delete('/api/foods/:id', (req, res) => {
  fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading database');
      return;
    }
    const db = JSON.parse(data);
    const foodIndex = db.foods.findIndex(f => f.id === parseInt(req.params.id));
    if (foodIndex === -1) {
      return res.status(404).send('Food not found');
    }
    db.foods.splice(foodIndex, 1);
    fs.writeFile('db.json', JSON.stringify(db, null, 2), (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error writing to database');
        return;
      }
      res.status(204).send();
    });
  });
});

// Strength Training Tracking
app.get('/api/lifts', (req, res) => {
  fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading database');
      return;
    }
    const db = JSON.parse(data);
    res.json(db.lifts);
  });
});

app.post('/api/lifts', (req, res) => {
  fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading database');
      return;
    }
    const db = JSON.parse(data);
    const newLift = req.body;
    newLift.id = db.lifts.length > 0 ? Math.max(...db.lifts.map(l => l.id)) + 1 : 1;
    newLift.progress = [];
    db.lifts.push(newLift);
    fs.writeFile('db.json', JSON.stringify(db, null, 2), (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error writing to database');
        return;
      }
      res.status(201).json(newLift);
    });
  });
});

app.get('/api/lifts/:id/progress', (req, res) => {
  fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading database');
      return;
    }
    const db = JSON.parse(data);
    const lift = db.lifts.find(l => l.id === parseInt(req.params.id));
    if (!lift) {
      return res.status(404).send('Lift not found');
    }
    res.json(lift.progress);
  });
});

app.post('/api/lifts/:id/entry', (req, res) => {
  fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading database');
      return;
    }
    const db = JSON.parse(data);
    const liftIndex = db.lifts.findIndex(l => l.id === parseInt(req.params.id));
    if (liftIndex === -1) {
      return res.status(404).send('Lift not found');
    }
    const newEntry = req.body;
    newEntry.id = db.lifts[liftIndex].progress.length > 0 ? Math.max(...db.lifts[liftIndex].progress.map(p => p.id)) + 1 : 1;
    newEntry.date = new Date().toISOString();
    db.lifts[liftIndex].progress.push(newEntry);
    fs.writeFile('db.json', JSON.stringify(db, null, 2), (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error writing to database');
        return;
      }
      res.status(201).json(newEntry);
    });
  });
});

// Weight Tracking
app.get('/api/weights', (req, res) => {
  fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading database');
      return;
    }
    const db = JSON.parse(data);
    res.json(db.weights);
  });
});

app.post('/api/weights', (req, res) => {
  fs.readFile('db.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading database');
      return;
    }
    const db = JSON.parse(data);
    const newWeightEntry = req.body;
    newWeightEntry.id = db.weights.length > 0 ? Math.max(...db.weights.map(w => w.id)) + 1 : 1;
    newWeightEntry.date = new Date().toISOString();
    db.weights.push(newWeightEntry);
    fs.writeFile('db.json', JSON.stringify(db, null, 2), (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error writing to database');
        return;
      }
      res.status(201).json(newWeightEntry);
    });
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

module.exports = app;
