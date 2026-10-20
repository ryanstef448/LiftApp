const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'liftapp.db');
const db = new Database(dbPath);

// Enable WAL mode for performance and enforce foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name TEXT NOT NULL,
    password TEXT NOT NULL,
    calorie_goal INTEGER DEFAULT 2400,
    protein_goal INTEGER DEFAULT 180,
    carbs_goal INTEGER DEFAULT 240,
    fat_goal INTEGER DEFAULT 75,
    weight_goal REAL DEFAULT 180.0,
    is_test_account INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    name TEXT NOT NULL,
    calories REAL NOT NULL,
    protein REAL NOT NULL,
    carbs REAL NOT NULL,
    fat REAL NOT NULL,
    serving_unit TEXT DEFAULT 'serving',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_food_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    food_id INTEGER,
    date TEXT NOT NULL, -- Format: YYYY-MM-DD
    name TEXT NOT NULL,
    servings REAL NOT NULL DEFAULT 1.0,
    calories REAL NOT NULL,
    protein REAL NOT NULL,
    carbs REAL NOT NULL,
    fat REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (food_id) REFERENCES foods (id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS lifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, user_id)
  );

  CREATE TABLE IF NOT EXISTS lift_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    lift_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER,
    sets INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lift_id) REFERENCES lifts (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS weights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    date TEXT NOT NULL,
    weight REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Helper to ensure column exists if upgrading an existing db
const ensureColumn = (table, column, definition) => {
  try {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = columns.some((c) => c.name === column);
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  } catch (err) {
    console.error(`Could not add column ${column} to ${table}:`, err.message);
  }
};

ensureColumn('foods', 'user_id', 'INTEGER DEFAULT 1');
ensureColumn('daily_food_logs', 'user_id', 'INTEGER DEFAULT 1');
ensureColumn('lifts', 'user_id', 'INTEGER DEFAULT 1');
ensureColumn('lift_progress', 'user_id', 'INTEGER DEFAULT 1');
ensureColumn('weights', 'user_id', 'INTEGER DEFAULT 1');

// Seed default/testing account and sample data
const seedTestingAccount = () => {
  const existingTestUser = db.prepare('SELECT * FROM users WHERE username = ?').get('testuser');
  let testUserId;

  if (!existingTestUser) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, display_name, password, calorie_goal, protein_goal, carbs_goal, fat_goal, weight_goal, is_test_account)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const info = insertUser.run(
      'testuser',
      'Alex (Testing Account)',
      'password123',
      2400,
      180,
      240,
      75,
      180.0
    );
    testUserId = info.lastInsertRowid;
  } else {
    testUserId = existingTestUser.id;
  }

  // Seed Foods Library for testuser if empty
  const foodCount = db.prepare('SELECT COUNT(*) as count FROM foods WHERE user_id = ?').get(testUserId).count;
  if (foodCount === 0) {
    const defaultFoods = [
      { name: 'Chicken Breast (Cooked)', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving_unit: '100g' },
      { name: 'Brown Rice (Cooked)', calories: 216, protein: 5, carbs: 45, fat: 1.8, serving_unit: '1 cup' },
      { name: 'Rolled Oats', calories: 150, protein: 5, carbs: 27, fat: 2.5, serving_unit: '40g (1/2 cup)' },
      { name: 'Whey Protein Powder', calories: 120, protein: 24, carbs: 2, fat: 1.5, serving_unit: '1 scoop (30g)' },
      { name: 'Whole Eggs (Large)', calories: 140, protein: 12, carbs: 1, fat: 10, serving_unit: '2 large eggs' },
      { name: 'Peanut Butter', calories: 190, protein: 8, carbs: 7, fat: 16, serving_unit: '2 tbsp (32g)' },
      { name: 'Sweet Potato (Baked)', calories: 130, protein: 2, carbs: 30, fat: 0.2, serving_unit: '1 medium (150g)' },
      { name: 'Atlantic Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, serving_unit: '100g' },
      { name: 'Greek Yogurt 0%', calories: 100, protein: 18, carbs: 6, fat: 0, serving_unit: '1 cup (170g)' },
      { name: 'Olive Oil', calories: 120, protein: 0, carbs: 0, fat: 14, serving_unit: '1 tbsp (14ml)' },
      { name: 'Broccoli (Steamed)', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, serving_unit: '1 cup (150g)' },
      { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, serving_unit: '1 medium' },
    ];

    const insertFood = db.prepare(`
      INSERT INTO foods (user_id, name, calories, protein, carbs, fat, serving_unit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertFoodsTx = db.transaction((foods) => {
      for (const f of foods) {
        insertFood.run(testUserId, f.name, f.calories, f.protein, f.carbs, f.fat, f.serving_unit);
      }
    });
    insertFoodsTx(defaultFoods);
  }

  // Seed Daily Logs for past 7 days if empty
  const logCount = db.prepare('SELECT COUNT(*) as count FROM daily_food_logs WHERE user_id = ?').get(testUserId).count;
  if (logCount === 0) {
    const today = new Date();
    const insertLog = db.prepare(`
      INSERT INTO daily_food_logs (user_id, food_id, date, name, servings, calories, protein, carbs, fat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertLogsTx = db.transaction(() => {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        // Breakfast
        insertLog.run(testUserId, null, dateStr, 'Oatmeal & Whey Protein', 1, 390, 34, 45, 6);
        // Lunch
        insertLog.run(testUserId, null, dateStr, 'Chicken Breast & Brown Rice', 1, 620, 58, 65, 8);
        // Snack
        insertLog.run(testUserId, null, dateStr, 'Greek Yogurt with Banana & Peanut Butter', 1, 395, 27, 40, 16);
        // Dinner
        insertLog.run(testUserId, null, dateStr, 'Grilled Salmon & Sweet Potato', 1, 710, 52, 55, 24);
      }
    });
    insertLogsTx();
  }

  // Seed Lifts and Progress for testuser if empty
  const liftCount = db.prepare('SELECT COUNT(*) as count FROM lifts WHERE user_id = ?').get(testUserId).count;
  if (liftCount === 0) {
    const liftsData = [
      {
        name: 'Barbell Bench Press',
        progress: [
          { daysAgo: 28, weight: 185, reps: 5, sets: 3, notes: 'Solid bar path, warm up felt good' },
          { daysAgo: 21, weight: 190, reps: 5, sets: 3, notes: 'Clean paused reps' },
          { daysAgo: 14, weight: 195, reps: 4, sets: 3, notes: 'Heavy, needed tight arch' },
          { daysAgo: 7, weight: 200, reps: 4, sets: 3, notes: 'Felt very strong' },
          { daysAgo: 1, weight: 205, reps: 3, sets: 3, notes: 'New PR! Target 225 next month' },
        ],
      },
      {
        name: 'Barbell Back Squat',
        progress: [
          { daysAgo: 26, weight: 225, reps: 5, sets: 3, notes: 'Hit good depth' },
          { daysAgo: 19, weight: 235, reps: 5, sets: 3, notes: 'Knees tracking well' },
          { daysAgo: 12, weight: 245, reps: 5, sets: 3, notes: 'Belt on, very stable' },
          { daysAgo: 5, weight: 255, reps: 4, sets: 3, notes: 'Heavy grinder on 4th rep' },
        ],
      },
      {
        name: 'Conventional Deadlift',
        progress: [
          { daysAgo: 25, weight: 295, reps: 5, sets: 2, notes: 'Speed off the floor' },
          { daysAgo: 18, weight: 315, reps: 5, sets: 2, notes: '3 plates feeling routine' },
          { daysAgo: 11, weight: 335, reps: 3, sets: 2, notes: 'Hook grip locked in' },
          { daysAgo: 3, weight: 350, reps: 3, sets: 1, notes: 'Personal record! Back straight' },
        ],
      },
      {
        name: 'Overhead Press (OHP)',
        progress: [
          { daysAgo: 24, weight: 115, reps: 5, sets: 3, notes: 'Squeeze glutes at top' },
          { daysAgo: 17, weight: 120, reps: 5, sets: 3, notes: 'Good lockout' },
          { daysAgo: 10, weight: 125, reps: 4, sets: 3, notes: 'Stalled on 5th rep' },
          { daysAgo: 2, weight: 130, reps: 4, sets: 3, notes: 'Strict form, no leg drive' },
        ],
      },
      {
        name: 'Barbell Bent-Over Row',
        progress: [
          { daysAgo: 23, weight: 155, reps: 8, sets: 3, notes: 'Focus on lats' },
          { daysAgo: 16, weight: 165, reps: 8, sets: 3, notes: 'Controlled negative' },
          { daysAgo: 9, weight: 175, reps: 6, sets: 3, notes: 'Heavy pull' },
          { daysAgo: 2, weight: 185, reps: 6, sets: 3, notes: 'Solid pump' },
        ],
      },
    ];

    const insertLift = db.prepare('INSERT OR IGNORE INTO lifts (name) VALUES (?)');
    const insertProg = db.prepare(`
      INSERT INTO lift_progress (user_id, lift_id, date, weight, reps, sets, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertLiftsTx = db.transaction(() => {
      for (const l of liftsData) {
        insertLift.run(l.name);
        const lift = db.prepare('SELECT id FROM lifts WHERE name = ?').get(l.name);
        const liftId = lift.id;
        for (const p of l.progress) {
          const d = new Date();
          d.setDate(today.getDate() - p.daysAgo);
          const dateStr = d.toISOString().split('T')[0];
          insertProg.run(testUserId, liftId, dateStr, p.weight, p.reps, p.sets, p.notes);
        }
      }
    });
    insertLiftsTx();
  }

  // Seed Weights for past 4 weeks if empty
  const weightCount = db.prepare('SELECT COUNT(*) as count FROM weights WHERE user_id = ?').get(testUserId).count;
  if (weightCount === 0) {
    const weightEntries = [
      { daysAgo: 28, weight: 186.5, notes: 'Starting weight check-in' },
      { daysAgo: 24, weight: 185.8, notes: 'Water weight dropping' },
      { daysAgo: 20, weight: 185.1, notes: 'Consistent tracking' },
      { daysAgo: 16, weight: 184.4, notes: 'Cardio added post workout' },
      { daysAgo: 12, weight: 183.7, notes: 'Feeling leaner' },
      { daysAgo: 8, weight: 182.9, notes: 'Macro adherence 100%' },
      { daysAgo: 4, weight: 182.2, notes: 'Strength holding steady' },
      { daysAgo: 1, weight: 181.5, notes: 'Almost at 180 target goal!' },
    ];

    const insertWeight = db.prepare(`
      INSERT INTO weights (user_id, date, weight, notes)
      VALUES (?, ?, ?, ?)
    `);

    const insertWeightsTx = db.transaction(() => {
      const today = new Date();
      for (const w of weightEntries) {
        const d = new Date();
        d.setDate(today.getDate() - w.daysAgo);
        const dateStr = d.toISOString().split('T')[0];
        insertWeight.run(testUserId, dateStr, w.weight, w.notes);
      }
    });
    insertWeightsTx();
  }
};

seedTestingAccount();

module.exports = db;
