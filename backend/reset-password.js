const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./dawamu.db');

// Hash the password
const hashedPassword = bcrypt.hashSync('admin123', 10);

// Update admin password
db.run(
  "UPDATE users SET password = ? WHERE email = ?",
  [hashedPassword, 'admin@dawamu.com'],
  function(err) {
    if (err) {
      console.error('❌ Error updating password:', err.message);
    } else {
      console.log('✅ Admin password reset successfully!');
      console.log('📧 Email: admin@dawamu.com');
      console.log('🔑 Password: admin123');
    }
    
    // Verify the update
    db.get(
      "SELECT id, email, password FROM users WHERE email='admin@dawamu.com'",
      (err, row) => {
        if (err) {
          console.error('Error verifying:', err.message);
        } else {
          console.log('\n📋 Updated admin record:');
          console.log('ID:', row.id);
          console.log('Email:', row.email);
          console.log('Password hash:', row.password.substring(0, 30) + '...');
        }
        db.close();
      }
    );
  }
);
