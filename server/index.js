const express = require('express');
const db = require('./db');

const app = express();
const port = 3001;

app.use(express.json());

// Helper to determine the acting user ID
// Defaults to user 1 (Alex - Testing Account) for backwards compatibility
function getUserId(req) {
  if (req.headers['x-user-id']) {
    const parsed = parseInt(req.headers['x-user-id'], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (req.query.user_id) {
    const parsed = parseInt(req.query.user_id, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 1;
}

// Return user object without sensitive password
function safeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

app.get('/', (req, res) => {
  res.send('Hello from the LiftApp backend (SQL powered with profiles)!');
});

// ==========================================
// 0. AUTH & PROFILE ENDPOINTS
// ==========================================

// Get all profiles for easy switcher
app.get('/api/auth/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, display_name, is_test_account, calorie_goal, protein_goal, weight_goal
      FROM users
      ORDER BY is_test_account DESC, id ASC
    `).all();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// Register a new profile
app.post('/api/auth/register', (req, res) => {
  try {
    const {
      username,
      password,
      display_name,
      calorie_goal,
      protein_goal,
      carbs_goal,
      fat_goal,
      weight_goal,
    } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const name = display_name && display_name.trim() ? display_name.trim() : username.trim();
    const cGoal = Number(calorie_goal) || 2200;
    const pGoal = Number(protein_goal) || 160;
    const carbsGoal = Number(carbs_goal) || 220;
    const fGoal = Number(fat_goal) || 70;
    const wGoal = Number(weight_goal) || 175;

    const stmt = db.prepare(`
      INSERT INTO users (username, display_name, password, calorie_goal, protein_goal, carbs_goal, fat_goal, weight_goal, is_test_account)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);
    const info = stmt.run(cleanUsername, name, password, cGoal, pGoal, carbsGoal, fGoal, wGoal);
    const newUserId = info.lastInsertRowid;

    // Clone starter food library items for the new user
    const starterFoods = [
      { name: 'Chicken Breast (Cooked)', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving_unit: '100g' },
      { name: 'Brown Rice (Cooked)', calories: 216, protein: 5, carbs: 45, fat: 1.8, serving_unit: '1 cup' },
      { name: 'Rolled Oats', calories: 150, protein: 5, carbs: 27, fat: 2.5, serving_unit: '40g (1/2 cup)' },
      { name: 'Whey Protein Powder', calories: 120, protein: 24, carbs: 2, fat: 1.5, serving_unit: '1 scoop (30g)' },
      { name: 'Whole Eggs (Large)', calories: 140, protein: 12, carbs: 1, fat: 10, serving_unit: '2 large eggs' },
      { name: 'Peanut Butter', calories: 190, protein: 8, carbs: 7, fat: 16, serving_unit: '2 tbsp (32g)' },
      { name: 'Greek Yogurt 0%', calories: 100, protein: 18, carbs: 6, fat: 0, serving_unit: '1 cup (170g)' },
      { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, serving_unit: '1 medium' },
    ];
    const insertFood = db.prepare(`
      INSERT INTO foods (user_id, name, calories, protein, carbs, fat, serving_unit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    starterFoods.forEach((f) => {
      insertFood.run(newUserId, f.name, f.calories, f.protein, f.carbs, f.fat, f.serving_unit);
    });

    // Ensure default starter lift movements exist
    const starterLifts = ['Barbell Bench Press', 'Barbell Back Squat', 'Conventional Deadlift', 'Overhead Press (OHP)'];
    const insertLift = db.prepare('INSERT OR IGNORE INTO lifts (name) VALUES (?)');
    starterLifts.forEach((liftName) => {
      insertLift.run(liftName);
    });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(newUserId);
    res.status(201).json({ user: safeUser(user), token: String(user.id) });
  } catch (err) {
    console.error('Error in registration:', err);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// Log into existing profile
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ user: safeUser(user), token: String(user.id) });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Instant 1-click login as Testing Account
app.post('/api/auth/test-login', (req, res) => {
  try {
    let testUser = db.prepare('SELECT * FROM users WHERE is_test_account = 1 OR username = ?').get('testuser');
    if (!testUser) {
      testUser = db.prepare('SELECT * FROM users WHERE id = 1').get();
    }
    if (!testUser) {
      return res.status(404).json({ error: 'Testing account not found' });
    }
    res.json({ user: safeUser(testUser), token: String(testUser.id) });
  } catch (err) {
    console.error('Error logging in as test account:', err);
    res.status(500).json({ error: 'Failed to login as test account' });
  }
});

// Get current profile
app.get('/api/auth/me', (req, res) => {
  try {
    const userId = getUserId(req);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(safeUser(user));
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update profile goals
app.put('/api/auth/profile', (req, res) => {
  try {
    const userId = getUserId(req);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const display_name = req.body.display_name !== undefined ? req.body.display_name.trim() : user.display_name;
    const calorie_goal = req.body.calorie_goal !== undefined ? Number(req.body.calorie_goal) : user.calorie_goal;
    const protein_goal = req.body.protein_goal !== undefined ? Number(req.body.protein_goal) : user.protein_goal;
    const carbs_goal = req.body.carbs_goal !== undefined ? Number(req.body.carbs_goal) : user.carbs_goal;
    const fat_goal = req.body.fat_goal !== undefined ? Number(req.body.fat_goal) : user.fat_goal;
    const weight_goal = req.body.weight_goal !== undefined ? Number(req.body.weight_goal) : user.weight_goal;

    db.prepare(`
      UPDATE users
      SET display_name = ?, calorie_goal = ?, protein_goal = ?, carbs_goal = ?, fat_goal = ?, weight_goal = ?
      WHERE id = ?
    `).run(display_name, calorie_goal, protein_goal, carbs_goal, fat_goal, weight_goal, userId);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json(safeUser(updated));
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==========================================
// 1. FOOD LIBRARY (KNOWN MEALS) ENDPOINTS
// ==========================================

// Get foods for the active user
app.get('/api/foods', (req, res) => {
  try {
    const userId = getUserId(req);
    const query = req.query.q;
    let stmt;
    if (query) {
      stmt = db.prepare(`
        SELECT * FROM foods 
        WHERE user_id = ? AND name LIKE ? 
        ORDER BY name ASC
      `);
      const rows = stmt.all(userId, `%${query}%`);
      return res.json(rows);
    }
    stmt = db.prepare('SELECT * FROM foods WHERE user_id = ? ORDER BY name ASC');
    const rows = stmt.all(userId);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching foods:', err);
    res.status(500).json({ error: 'Failed to fetch foods' });
  }
});

// Get a single food by ID
app.get('/api/foods/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM foods WHERE id = ?');
    const food = stmt.get(req.params.id);
    if (!food) {
      return res.status(404).json({ error: 'Food not found' });
    }
    res.json(food);
  } catch (err) {
    console.error('Error fetching food:', err);
    res.status(500).json({ error: 'Failed to fetch food' });
  }
});

// Add a new food template to library
app.post('/api/foods', (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, calories, protein, carbs, fat, serving_unit } = req.body;
    if (!name || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
      return res.status(400).json({ error: 'Name, calories, protein, carbs, and fat are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO foods (user_id, name, calories, protein, carbs, fat, serving_unit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      userId,
      name.trim(),
      Number(calories),
      Number(protein),
      Number(carbs),
      Number(fat),
      serving_unit ? serving_unit.trim() : 'serving'
    );

    const newFood = db.prepare('SELECT * FROM foods WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newFood);
  } catch (err) {
    console.error('Error adding food:', err);
    res.status(500).json({ error: 'Failed to add food' });
  }
});

// Update a food template in library
app.put('/api/foods/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Food not found' });
    }

    const name = req.body.name !== undefined ? req.body.name : existing.name;
    const calories = req.body.calories !== undefined ? Number(req.body.calories) : existing.calories;
    const protein = req.body.protein !== undefined ? Number(req.body.protein) : existing.protein;
    const carbs = req.body.carbs !== undefined ? Number(req.body.carbs) : existing.carbs;
    const fat = req.body.fat !== undefined ? Number(req.body.fat) : existing.fat;
    const serving_unit = req.body.serving_unit !== undefined ? req.body.serving_unit : existing.serving_unit;

    const stmt = db.prepare(`
      UPDATE foods
      SET name = ?, calories = ?, protein = ?, carbs = ?, fat = ?, serving_unit = ?
      WHERE id = ?
    `);
    stmt.run(name, calories, protein, carbs, fat, serving_unit, req.params.id);

    const updated = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Error updating food:', err);
    res.status(500).json({ error: 'Failed to update food' });
  }
});

// Delete a food from library
app.delete('/api/foods/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM foods WHERE id = ?');
    const info = stmt.run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Food not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting food:', err);
    res.status(500).json({ error: 'Failed to delete food' });
  }
});

// ==========================================
// 2. DAILY FOOD LOG ENDPOINTS
// ==========================================

// Get daily log entries and macro totals for a specific date (YYYY-MM-DD)
app.get('/api/logs', (req, res) => {
  try {
    const userId = getUserId(req);
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const entriesStmt = db.prepare(`
      SELECT * FROM daily_food_logs
      WHERE user_id = ? AND date = ?
      ORDER BY id ASC
    `);
    const entries = entriesStmt.all(userId, date);

    const totalsStmt = db.prepare(`
      SELECT 
        COALESCE(ROUND(SUM(calories), 1), 0) as totalCalories,
        COALESCE(ROUND(SUM(protein), 1), 0) as totalProtein,
        COALESCE(ROUND(SUM(carbs), 1), 0) as totalCarbs,
        COALESCE(ROUND(SUM(fat), 1), 0) as totalFat
      FROM daily_food_logs
      WHERE user_id = ? AND date = ?
    `);
    const totals = totalsStmt.get(userId, date);

    res.json({
      date,
      entries,
      totals,
    });
  } catch (err) {
    console.error('Error fetching food logs:', err);
    res.status(500).json({ error: 'Failed to fetch food logs' });
  }
});

// Add a meal entry to the daily log
app.post('/api/logs', (req, res) => {
  try {
    const userId = getUserId(req);
    const { food_id, date, servings, name, calories, protein, carbs, fat } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const numServings = servings !== undefined && Number(servings) > 0 ? Number(servings) : 1;

    let logName = name;
    let logCalories = calories;
    let logProtein = protein;
    let logCarbs = carbs;
    let logFat = fat;
    let foodRefId = null;

    if (food_id) {
      const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(food_id);
      if (!food) {
        return res.status(404).json({ error: 'Referenced food not found in library' });
      }
      foodRefId = food.id;
      logName = name || food.name;
      logCalories = Number((food.calories * numServings).toFixed(1));
      logProtein = Number((food.protein * numServings).toFixed(1));
      logCarbs = Number((food.carbs * numServings).toFixed(1));
      logFat = Number((food.fat * numServings).toFixed(1));
    } else {
      if (!name || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
        return res.status(400).json({ error: 'Custom meal requires name, calories, protein, carbs, and fat' });
      }
      logCalories = Number((Number(calories) * numServings).toFixed(1));
      logProtein = Number((Number(protein) * numServings).toFixed(1));
      logCarbs = Number((Number(carbs) * numServings).toFixed(1));
      logFat = Number((Number(fat) * numServings).toFixed(1));
    }

    const stmt = db.prepare(`
      INSERT INTO daily_food_logs (user_id, food_id, date, name, servings, calories, protein, carbs, fat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(userId, foodRefId, targetDate, logName, numServings, logCalories, logProtein, logCarbs, logFat);

    const newLog = db.prepare('SELECT * FROM daily_food_logs WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newLog);
  } catch (err) {
    console.error('Error logging food:', err);
    res.status(500).json({ error: 'Failed to log food' });
  }
});

// Delete an entry from daily food log
app.delete('/api/logs/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM daily_food_logs WHERE id = ?');
    const info = stmt.run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Log entry not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting log entry:', err);
    res.status(500).json({ error: 'Failed to delete log entry' });
  }
});

// ==========================================
// 3. NUTRITION ANALYTICS & STATS ENDPOINTS
// ==========================================

app.get('/api/logs/stats', (req, res) => {
  try {
    const userId = getUserId(req);
    const now = new Date();
    const defaultEnd = now.toISOString().split('T')[0];
    const defaultStartObj = new Date();
    defaultStartObj.setDate(now.getDate() - 30);
    const defaultStart = defaultStartObj.toISOString().split('T')[0];

    const startDate = req.query.startDate || defaultStart;
    const endDate = req.query.endDate || defaultEnd;

    const stmt = db.prepare(`
      SELECT 
        date,
        ROUND(SUM(calories), 1) as totalCalories,
        ROUND(SUM(protein), 1) as totalProtein,
        ROUND(SUM(carbs), 1) as totalCarbs,
        ROUND(SUM(fat), 1) as totalFat,
        COUNT(*) as mealCount
      FROM daily_food_logs
      WHERE user_id = ? AND date >= ? AND date <= ?
      GROUP BY date
      ORDER BY date ASC
    `);
    const days = stmt.all(userId, startDate, endDate);

    let averages = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (days.length > 0) {
      const sum = days.reduce(
        (acc, d) => ({
          calories: acc.calories + d.totalCalories,
          protein: acc.protein + d.totalProtein,
          carbs: acc.carbs + d.totalCarbs,
          fat: acc.fat + d.totalFat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      averages = {
        calories: Math.round(sum.calories / days.length),
        protein: Math.round(sum.protein / days.length),
        carbs: Math.round(sum.carbs / days.length),
        fat: Math.round(sum.fat / days.length),
      };
    }

    res.json({
      startDate,
      endDate,
      totalLoggedDays: days.length,
      days,
      averages,
    });
  } catch (err) {
    console.error('Error fetching nutrition stats:', err);
    res.status(500).json({ error: 'Failed to fetch nutrition stats' });
  }
});

// ==========================================
// 4. STRENGTH TRAINING (LIFTS) ENDPOINTS
// ==========================================

// Get all lift movements with user-specific PR and last entry stats
app.get('/api/lifts', (req, res) => {
  try {
    const userId = getUserId(req);
    const lifts = db.prepare('SELECT * FROM lifts ORDER BY name ASC').all();
    const statsStmt = db.prepare(`
      SELECT 
        MAX(weight) as pr,
        COUNT(*) as totalEntries,
        (SELECT weight FROM lift_progress WHERE lift_id = ? AND user_id = ? ORDER BY date DESC, id DESC LIMIT 1) as lastWeight,
        (SELECT reps FROM lift_progress WHERE lift_id = ? AND user_id = ? ORDER BY date DESC, id DESC LIMIT 1) as lastReps,
        (SELECT sets FROM lift_progress WHERE lift_id = ? AND user_id = ? ORDER BY date DESC, id DESC LIMIT 1) as lastSets,
        (SELECT date FROM lift_progress WHERE lift_id = ? AND user_id = ? ORDER BY date DESC, id DESC LIMIT 1) as lastDate
      FROM lift_progress
      WHERE lift_id = ? AND user_id = ?
    `);

    const enriched = lifts.map((lift) => {
      const stats = statsStmt.get(
        lift.id, userId,
        lift.id, userId,
        lift.id, userId,
        lift.id, userId,
        lift.id, userId
      );
      return {
        ...lift,
        pr: stats ? stats.pr || 0 : 0,
        totalEntries: stats ? stats.totalEntries || 0 : 0,
        lastWeight: stats ? stats.lastWeight : null,
        lastReps: stats ? stats.lastReps : null,
        lastSets: stats ? stats.lastSets : null,
        lastDate: stats ? stats.lastDate : null,
      };
    });
    res.json(enriched);
  } catch (err) {
    console.error('Error fetching lifts:', err);
    res.status(500).json({ error: 'Failed to fetch lifts' });
  }
});

// Add a new lift movement
app.post('/api/lifts', (req, res) => {
  try {
    const userId = getUserId(req);
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Lift name is required' });
    }

    const trimmedName = name.trim();
    let lift = db.prepare('SELECT * FROM lifts WHERE LOWER(name) = LOWER(?)').get(trimmedName);
    if (!lift) {
      const stmt = db.prepare('INSERT INTO lifts (name) VALUES (?)');
      const info = stmt.run(trimmedName);
      lift = db.prepare('SELECT * FROM lifts WHERE id = ?').get(info.lastInsertRowid);
    }
    res.status(201).json({
      ...lift,
      pr: 0,
      totalEntries: 0,
      lastWeight: null,
      lastReps: null,
      lastSets: null,
      lastDate: null,
    });
  } catch (err) {
    console.error('Error adding lift:', err);
    res.status(500).json({ error: 'Failed to add lift' });
  }
});

// Delete a lift movement
app.delete('/api/lifts/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM lifts WHERE id = ?');
    const info = stmt.run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Lift not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting lift:', err);
    res.status(500).json({ error: 'Failed to delete lift' });
  }
});

// Get progress history for a specific lift for the active user
app.get('/api/lifts/:id/progress', (req, res) => {
  try {
    const userId = getUserId(req);
    const lift = db.prepare('SELECT * FROM lifts WHERE id = ?').get(req.params.id);
    if (!lift) {
      return res.status(404).json({ error: 'Lift not found' });
    }
    const progress = db
      .prepare('SELECT * FROM lift_progress WHERE lift_id = ? AND user_id = ? ORDER BY date ASC, id ASC')
      .all(req.params.id, userId);
    res.json(progress);
  } catch (err) {
    console.error('Error fetching lift progress:', err);
    res.status(500).json({ error: 'Failed to fetch lift progress' });
  }
});

// Add a progress entry for a lift
app.post('/api/lifts/:id/entry', (req, res) => {
  try {
    const lift = db.prepare('SELECT * FROM lifts WHERE id = ?').get(req.params.id);
    if (!lift) {
      return res.status(404).json({ error: 'Lift not found' });
    }
    const userId = getUserId(req);
    const { weight, reps, sets, notes, date } = req.body;
    const entryDate = date || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO lift_progress (user_id, lift_id, date, weight, reps, sets, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      userId,
      req.params.id,
      entryDate,
      Number(weight) || 0,
      Number(reps) || 0,
      Number(sets) || 0,
      notes || null
    );
    const newEntry = db.prepare('SELECT * FROM lift_progress WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newEntry);
  } catch (err) {
    console.error('Error adding lift entry:', err);
    res.status(500).json({ error: 'Failed to add lift entry' });
  }
});

// Delete a progress entry from a lift
app.delete('/api/lifts/:id/entry/:entryId', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM lift_progress WHERE id = ? AND lift_id = ?');
    const info = stmt.run(req.params.entryId, req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting lift entry:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// ==========================================
// 5. BODY WEIGHT ENDPOINTS
// ==========================================

app.get('/api/weights', (req, res) => {
  try {
    const userId = getUserId(req);
    const weights = db.prepare('SELECT * FROM weights WHERE user_id = ? ORDER BY date ASC, id ASC').all(userId);
    res.json(weights);
  } catch (err) {
    console.error('Error fetching weights:', err);
    res.status(500).json({ error: 'Failed to fetch weights' });
  }
});

app.post('/api/weights', (req, res) => {
  try {
    const userId = getUserId(req);
    const { weight, notes, date } = req.body;
    if (weight === undefined || isNaN(Number(weight))) {
      return res.status(400).json({ error: 'Valid weight is required' });
    }
    const entryDate = date || new Date().toISOString().split('T')[0];
    const stmt = db.prepare('INSERT INTO weights (user_id, date, weight, notes) VALUES (?, ?, ?, ?)');
    const info = stmt.run(userId, entryDate, Number(weight), notes ? notes.trim() : null);
    const newWeight = db.prepare('SELECT * FROM weights WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newWeight);
  } catch (err) {
    console.error('Error adding weight:', err);
    res.status(500).json({ error: 'Failed to add weight' });
  }
});

app.delete('/api/weights/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM weights WHERE id = ?');
    const info = stmt.run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Weight record not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting weight:', err);
    res.status(500).json({ error: 'Failed to delete weight' });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`LiftApp Server running at http://localhost:${port}`);
  });
}

module.exports = app;
