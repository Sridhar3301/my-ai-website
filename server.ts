import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("vitality.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT 'User',
    coins INTEGER DEFAULT 0,
    buddy_name TEXT,
    buddy_contact TEXT,
    last_advisor_consult TEXT,
    streak INTEGER DEFAULT 0,
    last_active_date TEXT,
    age INTEGER,
    weight REAL,
    height REAL,
    health_goals TEXT,
    medical_conditions TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    score INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS mood_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    rating INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fitness_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    steps INTEGER,
    duration INTEGER,
    calories INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    frequency TEXT,
    time TEXT,
    last_taken DATETIME,
    snoozed_until TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS buddy_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial user if not exists
const user = db.prepare("SELECT * FROM users WHERE id = 1").get();
if (!user) {
  db.prepare("INSERT INTO users (id, name, coins, buddy_name, buddy_contact) VALUES (1, 'Alex', 100, 'Sarah', 'sarah@example.com')").run();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/user", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = 1").get();
    res.json(user);
  });

  app.post("/api/user/update", (req, res) => {
    try {
      const { name, age, weight, height, health_goals, buddy_name, buddy_contact, medical_conditions } = req.body;
      db.prepare(`
        UPDATE users 
        SET name = ?, age = ?, weight = ?, height = ?, health_goals = ?, buddy_name = ?, buddy_contact = ?, medical_conditions = ?
        WHERE id = 1
      `).run(name, age, weight, height, health_goals, buddy_name, buddy_contact, JSON.stringify(medical_conditions));
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const updateStreak = (userId: number) => {
    const user = db.prepare("SELECT last_active_date, streak FROM users WHERE id = ?").get(userId);
    const today = new Date().toISOString().split('T')[0];
    
    if (user.last_active_date === today) return;

    let newStreak = 1;
    if (user.last_active_date) {
      const lastDate = new Date(user.last_active_date);
      const diffTime = Math.abs(new Date(today).getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak = user.streak + 1;
      }
    }

    db.prepare("UPDATE users SET streak = ?, last_active_date = ? WHERE id = ?").run(newStreak, today, userId);
  };

  app.get("/api/mood/history", (req, res) => {
    const history = db.prepare("SELECT * FROM mood_logs WHERE user_id = 1 ORDER BY created_at DESC LIMIT 30").all();
    res.json(history);
  });

  app.post("/api/mood", (req, res) => {
    try {
      const { rating, notes } = req.body;
      db.prepare("INSERT INTO mood_logs (user_id, rating, notes) VALUES (1, ?, ?)").run(rating, notes);
      updateStreak(1);
      
      // Check for 3 consecutive low moods (rating <= 2)
      const recentMoods = db.prepare("SELECT rating FROM mood_logs WHERE user_id = 1 ORDER BY created_at DESC LIMIT 3").all();
      if (recentMoods.length === 3 && recentMoods.every((m: any) => m.rating <= 2)) {
        db.prepare("INSERT INTO buddy_alerts (user_id) VALUES (1)").run();
        return res.json({ success: true, alertTriggered: true });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error logging mood:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/fitness/history", (req, res) => {
    const history = db.prepare("SELECT * FROM fitness_logs WHERE user_id = 1 ORDER BY created_at DESC LIMIT 30").all();
    res.json(history);
  });

  app.post("/api/fitness", (req, res) => {
    try {
      const { steps, duration, calories } = req.body;
      const stepsNum = parseInt(steps) || 0;
      const durationNum = parseInt(duration) || 0;
      const caloriesNum = parseInt(calories) || 0;
      
      db.prepare("INSERT INTO fitness_logs (user_id, steps, duration, calories) VALUES (1, ?, ?, ?)").run(stepsNum, durationNum, caloriesNum);
      updateStreak(1);
      
      let coinsAdded = 0;
      // Reward coins for 5k steps
      if (stepsNum >= 5000) {
        coinsAdded += 10;
      }
      
      // Extra 100 coins for every 100k steps (cumulative)
      const result = db.prepare("SELECT SUM(steps) as total FROM fitness_logs WHERE user_id = 1").get();
      const totalSteps = Number(result.total) || 0;
      const previousTotal = totalSteps - stepsNum;
      
      const currentMilestones = Math.floor(totalSteps / 100000);
      const previousMilestones = Math.floor(previousTotal / 100000);
      const extraCoins = (currentMilestones - previousMilestones) * 100;
      
      if (extraCoins > 0) {
        coinsAdded += extraCoins;
      }

      if (coinsAdded > 0) {
        db.prepare("UPDATE users SET coins = coins + ? WHERE id = 1").run(coinsAdded);
      }
      
      console.log(`Steps: ${stepsNum}, Total: ${totalSteps}, Coins Added: ${coinsAdded}`);
      res.json({ success: true, coinsAdded });
    } catch (error) {
      console.error("Error logging fitness:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/medications", (req, res) => {
    const meds = db.prepare("SELECT * FROM medications WHERE user_id = 1").all();
    res.json(meds);
  });

  app.post("/api/medications", (req, res) => {
    try {
      const { name, frequency, time } = req.body;
      db.prepare("INSERT INTO medications (user_id, name, frequency, time) VALUES (1, ?, ?, ?)").run(name, frequency, time);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding medication:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/medications/take", (req, res) => {
    const { id } = req.body;
    db.prepare("UPDATE medications SET last_taken = CURRENT_TIMESTAMP, snoozed_until = NULL WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/medications/snooze", (req, res) => {
    const { id, until } = req.body;
    db.prepare("UPDATE medications SET snoozed_until = ? WHERE id = ?").run(until, id);
    res.json({ success: true });
  });

  app.delete("/api/medications/:id", (req, res) => {
    const { id } = req.params;
    console.log(`Deleting medication with ID: ${id}`);
    try {
      // Ensure ID is treated as a number if possible
      const medId = parseInt(id);
      const result = db.prepare("DELETE FROM medications WHERE id = ? AND user_id = 1").run(medId);
      console.log(`Delete result for ID ${medId}:`, result);
      res.json({ success: true, deleted: result.changes > 0 });
    } catch (error) {
      console.error("Error deleting medication:", error);
      res.status(500).json({ error: "Failed to delete medication" });
    }
  });

  app.put("/api/medications/:id", (req, res) => {
    const { name, frequency, time } = req.body;
    db.prepare("UPDATE medications SET name = ?, frequency = ?, time = ? WHERE id = ? AND user_id = 1").run(name, frequency, time, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/friends", (req, res) => {
    const friends = db.prepare("SELECT * FROM friends WHERE user_id = 1").all();
    res.json(friends);
  });

  app.post("/api/friends", (req, res) => {
    const { name } = req.body;
    db.prepare("INSERT INTO friends (user_id, name, score) VALUES (1, ?, ?)").run(name, Math.floor(Math.random() * 100));
    res.json({ success: true });
  });

  app.delete("/api/friends/:id", (req, res) => {
    db.prepare("DELETE FROM friends WHERE id = ? AND user_id = 1").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/leaderboard", (req, res) => {
    const user = db.prepare("SELECT name, coins FROM users WHERE id = 1").get();
    const friends = db.prepare("SELECT name, score as points FROM friends WHERE user_id = 1").all();
    
    const leaderboard = [
      { name: `${user.name} (You)`, points: user.coins },
      ...friends
    ].sort((a, b) => b.points - a.points);
    res.json(leaderboard);
  });

  app.post("/api/buddy/respond", (req, res) => {
    // Friend responds to alert
    db.prepare("UPDATE users SET coins = coins + 5 WHERE id = 1").run();
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
