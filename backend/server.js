const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'dawamu_secret_2026';

app.use(cors());
app.use(express.json());

// Database
const db = new sqlite3.Database('./dawamu.db');

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jasontania64@gmail.com',
    pass: 'qlsm jrsb yoxq fftp'
  }
});

// ===== EMAIL FUNCTIONS =====

async function sendEmail(to, subject, htmlContent, emailType = 'announcement') {
  try {
    const mailOptions = {
      from: '"Dawamu School" <jasontania64@gmail.com>',
      to: to,
      subject: subject,
      html: htmlContent
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    db.run(
      `INSERT INTO email_logs (parent_email, subject, type, status, sent_at) 
       VALUES (?, ?, ?, 'sent', datetime('now'))`,
      [to, subject, emailType]
    );
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    db.run(
      `INSERT INTO email_logs (parent_email, subject, type, status, sent_at) 
       VALUES (?, ?, ?, 'failed', datetime('now'))`,
      [to, subject, emailType]
    );
    return { success: false, error: error.message };
  }
}

// ===== EMAIL TEMPLATES =====

function getFeeReminderTemplate(studentName, amount, dueDate) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: #8DB600; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🏫 DAWAMU SCHOOL</h1>
        <p style="color: white; margin: 5px 0;">Transforming Boys Into Leaders</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #8DB600;">💰 Fee Payment Reminder</h2>
        <p>Dear Parent/Guardian,</p>
        <p>This is a reminder that the school fees for <strong>${studentName}</strong> are due.</p>
        <div style="background: #F0F5E6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount Due:</strong> KSh ${amount.toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        <p>Please ensure payment is made on time to avoid penalties.</p>
        <p style="margin-top: 20px;">Payment can be made via M-Pesa Paybill: <strong>123456</strong></p>
        <p>Account: <strong>DAWAMU + Student ID</strong></p>
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Dawamu School | Transforming Boys Into Leaders</p>
        <p style="color: #666; font-size: 12px;">📞 Contact: +254 700 000000 | 📧 info@dawamu.com</p>
      </div>
    </div>
  `;
}

function getAttendanceAlertTemplate(studentName, date, status) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: #8DB600; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🏫 DAWAMU SCHOOL</h1>
        <p style="color: white; margin: 5px 0;">Transforming Boys Into Leaders</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #8DB600;">✅ Attendance Alert</h2>
        <p>Dear Parent/Guardian,</p>
        <p>We are writing to inform you about your child's attendance status.</p>
        <div style="background: ${status === 'Absent' ? '#fee' : '#F0F5E6'}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${status === 'Absent' ? '#f44336' : '#4caf50'};">
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Status:</strong> <span style="color: ${status === 'Absent' ? '#f44336' : '#4caf50'}; font-weight: bold;">${status}</span></p>
        </div>
        ${status === 'Absent' ? `
          <p>We kindly request you to ensure regular attendance.</p>
          <p>If your child was sick or had a valid reason, please inform the school.</p>
        ` : `
          <p>We are pleased to see your child's good attendance record.</p>
          <p>Keep up the good work!</p>
        `}
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Dawamu School | Transforming Boys Into Leaders</p>
        <p style="color: #666; font-size: 12px;">📞 Contact: +254 700 000000 | 📧 info@dawamu.com</p>
      </div>
    </div>
  `;
}

function getExamResultTemplate(studentName, subject, marks, grade) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: #8DB600; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🏫 DAWAMU SCHOOL</h1>
        <p style="color: white; margin: 5px 0;">Transforming Boys Into Leaders</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #8DB600;">📝 Exam Results Notification</h2>
        <p>Dear Parent/Guardian,</p>
        <p>Your child's exam results are now available.</p>
        <div style="background: #F0F5E6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Marks:</strong> ${marks}%</p>
          <p><strong>Grade:</strong> <span style="color: #8DB600; font-weight: bold;">${grade}</span></p>
        </div>
        <p>Please review the results and discuss with your child.</p>
        <p>For any questions, please contact the school administration.</p>
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Dawamu School | Transforming Boys Into Leaders</p>
        <p style="color: #666; font-size: 12px;">📞 Contact: +254 700 000000 | 📧 info@dawamu.com</p>
      </div>
    </div>
  `;
}

function getAnnouncementTemplate(title, message) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: #8DB600; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🏫 DAWAMU SCHOOL</h1>
        <p style="color: white; margin: 5px 0;">Transforming Boys Into Leaders</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #8DB600;">📢 ${title}</h2>
        <p style="color: #333;">${message}</p>
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Dawamu School | Transforming Boys Into Leaders</p>
        <p style="color: #666; font-size: 12px;">📞 Contact: +254 700 000000 | 📧 info@dawamu.com</p>
      </div>
    </div>
  `;
}

// ===== API ENDPOINTS =====

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

// ===== GET ALL STUDENTS =====
app.get('/api/all-students', (req, res) => {
  db.all("SELECT id, name, grade FROM students", (err, rows) => {
    if (err) {
      return res.json({ success: false, message: err.message });
    }
    res.json(rows);
  });
});

// ===== GET STUDENTS WITH PARENT EMAILS =====
app.get('/api/students-with-emails', (req, res) => {
  db.all("SELECT name, grade, parent_email FROM students WHERE parent_email IS NOT NULL AND parent_email != ''", (err, rows) => {
    if (err) {
      return res.json({ success: false, message: err.message });
    }
    res.json(rows);
  });
});

// ===== GET ALL PARENT ACCOUNTS =====
app.get('/api/parent-accounts', (req, res) => {
  db.all(`
    SELECT pa.*, 
           GROUP_CONCAT(s.name) as children_names
    FROM parent_accounts pa
    LEFT JOIN parent_student_links psl ON pa.id = psl.parent_id
    LEFT JOIN students s ON psl.student_id = s.id
    GROUP BY pa.id
  `, (err, rows) => {
    if (err) {
      return res.json({ success: false, message: err.message });
    }
    res.json(rows);
  });
});

// ===== CREATE PARENT ACCOUNT =====
app.post('/api/create-parent', (req, res) => {
  const { email, password, full_name, phone, student_ids } = req.body;
  
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.json({ success: false, message: err.message });
    
    db.run(
      "INSERT INTO parent_accounts (email, password, full_name, phone) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, full_name, phone],
      function(err) {
        if (err) return res.json({ success: false, message: err.message });
        
        const parentId = this.lastID;
        
        if (student_ids && student_ids.length > 0) {
          const stmt = db.prepare("INSERT INTO parent_student_links (parent_id, student_id) VALUES (?, ?)");
          student_ids.forEach(studentId => {
            stmt.run(parentId, studentId);
          });
          stmt.finalize();
        }
        
        res.json({ 
          success: true, 
          message: 'Parent account created successfully',
          parentId: parentId
        });
      }
    );
  });
});

// ===== DELETE PARENT ACCOUNT =====
app.delete('/api/parent-accounts/:id', (req, res) => {
  const parentId = req.params.id;
  
  db.run("DELETE FROM parent_student_links WHERE parent_id = ?", [parentId], (err) => {
    if (err) {
      return res.json({ success: false, message: err.message });
    }
    
    db.run("DELETE FROM parent_accounts WHERE id = ?", [parentId], (err) => {
      if (err) {
        return res.json({ success: false, message: err.message });
      }
      res.json({ success: true, message: 'Parent account deleted successfully' });
    });
  });
});

// ===== PARENT LOGIN =====
app.post('/api/parent-login', (req, res) => {
  const { email, password } = req.body;
  console.log('Parent login attempt:', email);
  
  db.get("SELECT * FROM parent_accounts WHERE email = ?", [email], (err, parent) => {
    if (err || !parent) {
      console.log('Parent not found:', email);
      return res.json({ success: false, message: 'User not found' });
    }
    
    console.log('Parent found:', parent.email);
    
    bcrypt.compare(password, parent.password, (err, result) => {
      if (err || !result) {
        console.log('Invalid password for:', email);
        return res.json({ success: false, message: 'Invalid password' });
      }
      
      console.log('Login successful for:', email);
      
      const token = jwt.sign({ 
        id: parent.id, 
        role: 'parent',
        email: parent.email,
        name: parent.full_name
      }, JWT_SECRET);
      
      res.json({
        success: true,
        token: token,
        user: {
          id: parent.id,
          name: parent.full_name,
          email: parent.email,
          role: 'parent'
        }
      });
    });
  });
});

// ===== GET PARENT'S CHILDREN =====
app.get('/api/parent-children', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.json({ success: false, message: 'No token provided' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.json({ success: false, message: 'Invalid token' });
    
    const parentId = decoded.id;
    
    db.all(`
      SELECT s.*, ps.relationship 
      FROM students s
      JOIN parent_student_links ps ON s.id = ps.student_id
      WHERE ps.parent_id = ?
    `, [parentId], (err, students) => {
      if (err) return res.json({ success: false, message: err.message });
      res.json({ success: true, students });
    });
  });
});

// ===== GET STUDENT DETAILS WITH RESULTS =====
app.get('/api/student-details/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  
  db.get("SELECT * FROM students WHERE id = ?", [studentId], (err, student) => {
    if (err || !student) {
      return res.json({ success: false, message: 'Student not found' });
    }
    
    db.all("SELECT * FROM results WHERE student_id = ?", [studentId], (err, results) => {
      if (err) return res.json({ success: false, message: err.message });
      res.json({ success: true, student, results });
    });
  });
});

// ===== SEND TO SPECIFIC STUDENT'S PARENT =====
app.post('/api/send-to-parent', (req, res) => {
  const { studentName, subject, message, emailType, amount, dueDate, date, status, examSubject, marks } = req.body;
  
  db.get("SELECT * FROM students WHERE name = ?", [studentName], async (err, student) => {
    if (err || !student) {
      return res.json({ success: false, message: 'Student not found' });
    }
    if (!student.parent_email) {
      return res.json({ success: false, message: 'No parent email found for this student' });
    }
    
    let html = '';
    let emailSubject = subject;
    
    if (emailType === 'fee') {
      html = getFeeReminderTemplate(student.name, amount || 15000, dueDate || '2026-07-30');
      emailSubject = 'Fee Payment Reminder - Dawamu School';
    } else if (emailType === 'attendance') {
      html = getAttendanceAlertTemplate(student.name, date || new Date().toISOString().split('T')[0], status || 'Absent');
      emailSubject = 'Attendance Alert - Dawamu School';
    } else if (emailType === 'exam') {
      const grade = marks >= 80 ? 'A' : marks >= 70 ? 'B' : marks >= 60 ? 'C' : marks >= 50 ? 'D' : 'E';
      html = getExamResultTemplate(student.name, examSubject || 'Subject', marks || 0, grade);
      emailSubject = 'Exam Results - Dawamu School';
    } else {
      html = getAnnouncementTemplate(subject, message);
      emailSubject = subject + ' - Dawamu School';
    }
    
    const result = await sendEmail(student.parent_email, emailSubject, html, emailType);
    
    if (result.success) {
      res.json({ success: true, message: 'Email sent successfully to ' + student.parent_email });
    } else {
      res.json({ success: false, message: result.error });
    }
  });
});

// ===== EMAIL API ENDPOINTS =====

// Send announcement to all parents
app.post('/api/send-announcement', (req, res) => {
  const { title, message } = req.body;
  
  db.all("SELECT DISTINCT parent_email FROM students WHERE parent_email IS NOT NULL", async (err, parents) => {
    if (err) return res.json({ success: false, message: err.message });
    
    const emails = parents.map(p => p.parent_email);
    const html = getAnnouncementTemplate(title, message);
    
    let sent = 0, failed = 0;
    for (let email of emails) {
      const result = await sendEmail(email, `📢 ${title} - Dawamu School`, html, 'announcement');
      if (result.success) sent++; else failed++;
    }
    
    res.json({ success: true, sent, failed, total: emails.length });
  });
});

// ===== EMAIL STATISTICS =====
app.get('/api/email-stats', (req, res) => {
  db.get(`
    SELECT 
      COUNT(*) as total_sent,
      SUM(CASE WHEN date(sent_at) = date('now') THEN 1 ELSE 0 END) as sent_today,
      COUNT(DISTINCT parent_email) as total_parents,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM email_logs
  `, (err, stats) => {
    if (err) {
      return res.json({ success: false, message: err.message });
    }
    res.json(stats || { total_sent: 0, sent_today: 0, total_parents: 0, successful: 0, failed: 0 });
  });
});

// ===== GET EMAIL HISTORY =====
app.get('/api/email-history', (req, res) => {
  db.all(`
    SELECT 
      id,
      parent_email,
      subject,
      type,
      status,
      datetime(sent_at) as sent_at
    FROM email_logs 
    ORDER BY sent_at DESC 
    LIMIT 50
  `, (err, rows) => {
    if (err) {
      return res.json({ success: false, message: err.message });
    }
    res.json(rows || []);
  });
});

// Get attendance logs
app.get('/api/attendance-logs', (req, res) => {
  db.all("SELECT * FROM attendance_log ORDER BY date DESC LIMIT 50", (err, rows) => {
    if (err) return res.json({ success: false, message: err.message });
    res.json(rows);
  });
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
