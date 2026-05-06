const sqlite3 = require('sqlite3').verbose();

// Connect to database
const db = new sqlite3.Database('./mindease.db');

console.log('🔄 Starting database migration for admin monitoring...');

// Migration function
const migrateDatabase = () => {
  db.serialize(() => {
    // Check if columns already exist
    db.all("PRAGMA table_info(chats)", (err, columns) => {
      if (err) {
        console.error('Error checking table columns:', err);
        process.exit(1);
      }

      const existingColumns = columns.map(col => col.name);
      console.log('📋 Existing columns:', existingColumns);

      // Add new columns if they don't exist
      const migrations = [
        {
          column: 'response',
          type: 'TEXT',
          description: 'AI response to user message'
        },
        {
          column: 'emotion',
          type: 'TEXT',
          description: 'Detected emotion from AI analysis'
        },
        {
          column: 'risk_level',
          type: 'TEXT',
          description: 'Risk level: low_risk or high_risk'
        },
        {
          column: 'risk_score',
          type: 'REAL',
          description: 'Risk score from AI analysis (0.0 to 1.0)'
        },
        {
          column: 'status',
          type: 'TEXT DEFAULT "pending"',
          description: 'Status: pending, critical, normal, reviewed'
        }
      ];

      migrations.forEach(migration => {
        if (!existingColumns.includes(migration.column)) {
          const sql = `ALTER TABLE chats ADD COLUMN ${migration.column} ${migration.type}`;
          
          db.run(sql, (err) => {
            if (err) {
              console.error(`❌ Error adding column ${migration.column}:`, err);
            } else {
              console.log(`✅ Added column: ${migration.column} - ${migration.description}`);
            }
          });
        } else {
          console.log(`⏭️  Column ${migration.column} already exists`);
        }
      });

      // Create admin users table for authentication
      db.run(`CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('❌ Error creating admin_users table:', err);
        } else {
          console.log('✅ Admin users table created/verified');
          
          // Insert default admin user
          const bcrypt = require('bcryptjs');
          const hashedPassword = bcrypt.hashSync('admin123', 10);
          
          db.run(`INSERT OR IGNORE INTO admin_users (username, password) VALUES (?, ?)`,
            ['admin', hashedPassword],
            (err) => {
              if (err) {
                console.error('❌ Error creating admin user:', err);
              } else {
                console.log('✅ Default admin user created (username: admin, password: admin123)');
              }
            }
          );
        }
      });

      // Verify the final table structure
      setTimeout(() => {
        console.log('\n📊 Final table structure:');
        db.all("PRAGMA table_info(chats)", (err, finalColumns) => {
          if (err) {
            console.error('❌ Error verifying final structure:', err);
          } else {
            finalColumns.forEach(col => {
              console.log(`   - ${col.name}: ${col.type} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
            });
          }
          
          console.log('\n🎉 Database migration completed successfully!');
          console.log('📝 New columns added: response, emotion, risk_level, risk_score, status');
          console.log('👤 Admin table created with default user: admin/admin123');
          
          db.close();
        });
      }, 2000);
    });
  });
};

// Run migration
migrateDatabase();
