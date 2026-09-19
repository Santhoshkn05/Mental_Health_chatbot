const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mindease',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0
});

async function initializeDatabase() {
  pool.getConnection()
    .then(connection => {
      console.log('MySQL connected successfully');
      connection.release();
    })
    .catch(err => {
      console.error('MySQL connection failed:', err.message);
      console.error('Ensure MySQL server is running and credentials are correct');
    });

  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_expires_at DATETIME
      )
    `);

    // Migrate existing installations that created the users table before
    // verification fields were introduced.
    const [userColumns] = await pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
      [process.env.DB_NAME || 'mindease']
    );
    const existingUserColumns = new Set(
      userColumns.map(({ COLUMN_NAME }) => COLUMN_NAME)
    );
    const verificationColumns = {
      email_verified: 'BOOLEAN NOT NULL DEFAULT FALSE',
      verification_token: 'VARCHAR(255)',
      verification_expires_at: 'DATETIME'
    };

    for (const [column, definition] of Object.entries(verificationColumns)) {
      if (!existingUserColumns.has(column)) {
        await pool.execute(`ALTER TABLE users ADD COLUMN ${column} ${definition}`);
      }
    }

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        session_id VARCHAR(255),
        role VARCHAR(50),
        message TEXT,
        emotion VARCHAR(50),
        risk_level VARCHAR(50),
        risk_score FLOAT,
        status VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database tables:', err.message);
  }
}

module.exports = {
  pool,
  initializeDatabase
};
