const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 5000;
const JWT_SECRET = 'dawamu_secret_2026';

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./dawamu.db');

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT
  )`);

  // Students table (no gender)
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_no TEXT,
    name TEXT,
    grade TEXT,
    parent_phone TEXT
  )`);

  // Insert users
  const users = [
    { email: 'admin@dawamu.com', password: 'admin123', name: 'Admin User', role: 'admin' },
    { email: 'teacher@dawamu.com', password: 'teacher123', name: 'Teacher User', role: 'teacher' },
    { email: 'parent@dawamu.com', password: 'parent123', name: 'Parent User', role: 'parent' }
  ];

  users.forEach(user => {
    db.get("SELECT * FROM users WHERE email = ?", [user.email], (err, row) => {
      if (!row) {
        const hashed = bcrypt.hashSync(user.password, 10);
        db.run("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)", 
          [user.email, hashed, user.name, user.role]);
        console.log(`✅ Created ${user.role} user: ${user.email}`);
      }
    });
  });

  // Insert sample students (all boys)
  const students = [
    { id: "DAW/2024/001", name: "James Mwangi", grade: "Grade 8", parent: "+254712345678" },
    { id: "DAW/2024/002", name: "Brian Otieno", grade: "Grade 8", parent: "+254723456789" },
    { id: "DAW/2024/003", name: "Alex Kimani", grade: "Form 3", parent: "+254734567890" },
    { id: "DAW/2024/004", name: "Michael Omondi", grade: "Grade 7", parent: "+254745678901" },
    { id: "DAW/2024/005", name: "Samuel Kiprop", grade: "Grade 8", parent: "+254756789012" }
  ];

  students.forEach(s => {
    db.get("SELECT * FROM students WHERE admission_no = ?", [s.id], (err, row) => {
      if (!row) {
        db.run("INSERT INTO students (admission_no, name, grade, parent_phone) VALUES (?, ?, ?, ?)",
          [s.id, s.name, s.grade, s.parent]);
      }
    });
  });
});

// Login API
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) return res.json({ success: false, message: 'User not found' });
    if (bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
      res.json({ success: true, token, user: { name: user.name, email: user.email, role: user.role } });
    } else {
      res.json({ success: false, message: 'Wrong password' });
    }
  });
});

// Get students
app.get('/api/students', (req, res) => {
  db.all("SELECT * FROM students", (err, rows) => {
    res.json(rows || []);
  });
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
