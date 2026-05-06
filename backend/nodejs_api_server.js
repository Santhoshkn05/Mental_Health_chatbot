require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
const SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// ---------------- EMAIL SETUP ----------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

let otpStore = {};

// ---------------- LOGGING ----------------
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ---------------- DATABASE ----------------
const db = new sqlite3.Database('./mindease.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id TEXT,
    role TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ---------------- AUTH ----------------
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ---------------- REGISTER ----------------
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
    [name, email, hashedPassword],
    (err) => {
      if (err) return res.status(400).json({ error: "Email exists" });
      res.json({ message: "User registered" });
    });
});

// ---------------- LOGIN ----------------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '1d' });

    res.json({
      token,
      name: user.name,
      email: user.email
    });
  });
});

// ---------------- CHAT API (MAIN) ----------------
app.post('/api/chats', authenticateToken, async (req, res) => {
  const { session_id, message } = req.body;

  if (!message) return res.status(400).json({ error: "Message empty" });

  try {
    // Save user message
    db.run(`INSERT INTO chats (user_id, session_id, role, message) VALUES (?, ?, ?, ?)`,
      [req.user.id, session_id, 'user', message]);

    // FIX #3: Fetch conversation history
    const conversationHistory = await new Promise((resolve, reject) => {
      db.all(
        `SELECT role, message FROM chats WHERE user_id = ? AND session_id = ? ORDER BY timestamp ASC LIMIT 10`,
        [req.user.id, session_id],
        (err, rows) => {
          if (err) reject(err);
          else {
            const history = (rows || []).map(row => ({
              role: row.role === 'bot' ? 'assistant' : 'user',
              text: row.message
            }));
            resolve(history);
          }
        }
      );
    });

    // Call Flask AI with conversation history
    const aiResponse = await axios.post('http://127.0.0.1:5001/chat', {
      message: message,
      history: conversationHistory  // FIX #3: Pass history
    });

    const botReply = aiResponse.data.response;

    console.log("DEBUG: Flask AI Response Structure:", JSON.stringify(aiResponse.data, null, 2));
    
    const analysis = {
      intent: aiResponse.data.analysis?.intent,
      emotion: aiResponse.data.analysis?.emotion,
      risk: aiResponse.data.analysis?.risk?.label || 'low_risk',
      score: aiResponse.data.analysis?.risk?.score || 0.0
    };
    
    console.log("DEBUG: Extracted Analysis:", analysis);

    // Check if response was rejected (validation_applied: true and rejected: true)
    const isRejected = aiResponse.data?.validation_applied === true && aiResponse.data?.rejected === true;
    
    // Determine risk level and status
    let riskLevel, status, emotion;
    
    if (isRejected) {
      // For rejected responses, show "unrelated" intent and emotion
      riskLevel = 'low_risk';
      riskScore = 0.0;
      status = 'rejected';
      emotion = 'unrelated';
    } else {
      // For normal responses, use AI analysis
      riskLevel = analysis.risk || 'low_risk';
      riskScore = analysis.score || 0.0;
      status = riskLevel === 'high_risk' && riskScore > 0.6 ? 'critical' : 'normal';
      emotion = analysis.emotion;
    }
    
    // Save bot reply with correct analysis
    console.log("DEBUG: Database insertion values:", {
      user_id: req.user.id,
      session_id: session_id,
      role: 'bot',
      message: botReply.substring(0, 50) + '...',
      emotion: emotion,
      risk_level: riskLevel,
      risk_score: riskScore,
      status: status
    });

    db.run(`INSERT INTO chats (user_id, session_id, role, message, emotion, risk_level, risk_score, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, session_id, 'bot', botReply, analysis.emotion, riskLevel, riskScore, status], function(err) {

        if (err) {
          console.error("DEBUG: Database error:", err);
          return res.status(500).json({ error: "DB error" });
        }

        console.log("DEBUG: Database insertion successful, ID:", this.lastID);

        res.json({
          id: this.lastID,
          role: 'bot',
          message: botReply,
          analysis: analysis,
          timestamp: new Date().toISOString()
        });
      });

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ error: "AI service unavailable" });
  }
});

// ---------------- GET CHAT HISTORY ----------------
app.get('/api/chats', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM chats WHERE user_id = ? ORDER BY timestamp ASC`,
    [req.user.id],
    (err, rows) => {
      res.json(rows);
    });
});

// ---------------- DELETE SESSION ----------------
app.delete('/api/chats/:sessionId', authenticateToken, (req, res) => {
  db.run(`DELETE FROM chats WHERE user_id = ? AND session_id = ?`,
    [req.user.id, req.params.sessionId],
    () => res.json({ message: "Deleted" })
  );
});

// ---------------- DELETE ACCOUNT ----------------
app.delete('/api/delete-account', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // First delete all user's chat history
  db.run(`DELETE FROM chats WHERE user_id = ?`, [userId], (err) => {
    if (err) {
      console.error('Error deleting chat history:', err);
      return res.status(500).json({ error: "Failed to delete chat history" });
    }
    
    // Then delete the user account
    db.run(`DELETE FROM users WHERE id = ?`, [userId], (err) => {
      if (err) {
        console.error('Error deleting user account:', err);
        return res.status(500).json({ error: "Failed to delete account" });
      }
      
      res.json({ message: "Account deleted successfully" });
    });
  });
});

// ---------------- FORGOT PASSWORD ----------------
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  console.log(`[DEBUG] Checking if email exists: ${email}`);
  
  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT email, name FROM users WHERE email = ?`,
        [email],
        (err, user) => {
          if (err) {
            console.error(`[DB ERROR] ${err}`);
            reject(err);
          } else {
            resolve(user);
          }
        }
      );
    });

    console.log(`[DEBUG] Database query result:`, user);

    if (!user) {
      return res.status(400).json({
        error: "This email is not registered in our system."
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, timestamp: Date.now() };

    // Expire OTP after 10 minutes
    setTimeout(() => {
      delete otpStore[email];
    }, 10 * 60 * 1000);

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'MindEase Password Reset Code',
      text: `Your password reset code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Reset code sent to your email" });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }

  const storedData = otpStore[email];
  
  if (!storedData) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  if (storedData.otp !== otp) {
    return res.status(400).json({ error: "Invalid code" });
  }

  // Check if OTP expired (10 minutes)
  if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
    delete otpStore[email];
    return res.status(400).json({ error: "Code expired" });
  }

  // Mark OTP as verified
  storedData.verified = true;
  res.json({ message: "OTP verified successfully" });
});

// ---------------- RESET PASSWORD ----------------
app.post('/api/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "All fields required" });
  }

  const storedData = otpStore[email];
  
  if (!storedData || !storedData.verified) {
    return res.status(400).json({ error: "OTP not verified" });
  }

  if (storedData.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password in database
  db.run(`UPDATE users SET password = ? WHERE email = ?`, 
    [hashedPassword, email], 
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      // Clean up OTP
      delete otpStore[email];
      
      res.json({ message: "Password updated successfully" });
    }
  );
});

// ---------------- ADMIN AUTHENTICATION ----------------
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, admin) => {
    if (err) return res.sendStatus(403);
    req.admin = admin;
    next();
  });
};

// ---------------- ADMIN LOGIN ----------------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM admin_users WHERE username = ?`, [username], (err, admin) => {
    if (err || !admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    bcrypt.compare(password, admin.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: admin.id, username: admin.username }, SECRET, { expiresIn: '24h' });
      res.json({
        token,
        username: admin.username,
        message: "Admin login successful"
      });
    });
  });
});

// ---------------- ADMIN DASHBOARD ----------------
app.get('/api/admin/logs', authenticateAdmin, (req, res) => {
  db.all(`
    SELECT 
      bot.id,
      bot.user_id,
      user_msg.message as user_message,
      bot.message as ai_response,
      bot.emotion,
      bot.risk_level,
      bot.risk_score,
      bot.status,
      bot.timestamp,
      u.name as user_name
    FROM chats bot
    LEFT JOIN users u ON bot.user_id = u.id
    LEFT JOIN chats user_msg ON bot.session_id = user_msg.session_id 
      AND user_msg.role = 'user'
      AND user_msg.timestamp = (
        SELECT MAX(timestamp) 
        FROM chats 
        WHERE session_id = bot.session_id 
        AND role = 'user' 
        AND timestamp < bot.timestamp
      )
    WHERE bot.role = 'bot'
    ORDER BY bot.timestamp DESC
  `, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    
    res.json({
      logs: rows || [],
      total: rows.length
    });
  });
});

// ---------------- ADMIN STATUS UPDATE ----------------
app.post('/api/admin/update-status', authenticateAdmin, (req, res) => {
  const { chat_id, status } = req.body;

  if (!chat_id || !status) {
    return res.status(400).json({ error: "Missing chat_id or status" });
  }

  const validStatuses = ['pending', 'critical', 'normal', 'reviewed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.run(`UPDATE chats SET status = ? WHERE id = ?`, [status, chat_id], function(err) {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "Chat not found" });
    }
    
    res.json({
      message: "Status updated successfully",
      chat_id: chat_id,
      new_status: status
    });
  });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
