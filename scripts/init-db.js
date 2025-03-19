import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database initialization queries
const dbInitQueries = {
  createUsersTable: `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL,
      role ENUM('user', 'admin') DEFAULT 'user'
    )
  `,
  createQuinielasTable: `
    CREATE TABLE IF NOT EXISTS quinielas (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      created_by VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `,
  createMatchesTable: `
    CREATE TABLE IF NOT EXISTS matches (
      id VARCHAR(36) PRIMARY KEY,
      quiniela_id VARCHAR(36) NOT NULL,
      home_team VARCHAR(100) NOT NULL,
      away_team VARCHAR(100) NOT NULL,
      match_date DATETIME NOT NULL,
      home_score INT,
      away_score INT,
      FOREIGN KEY (quiniela_id) REFERENCES quinielas(id) ON DELETE CASCADE
    )
  `,
  createParticipantsTable: `
    CREATE TABLE IF NOT EXISTS participants (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      quiniela_id VARCHAR(36) NOT NULL,
      points INT DEFAULT 0,
      UNIQUE KEY user_quiniela (user_id, quiniela_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (quiniela_id) REFERENCES quinielas(id) ON DELETE CASCADE
    )
  `,
  createPredictionsTable: `
    CREATE TABLE IF NOT EXISTS predictions (
      id VARCHAR(36) PRIMARY KEY,
      participant_id VARCHAR(36) NOT NULL,
      match_id VARCHAR(36) NOT NULL,
      home_score INT NOT NULL,
      away_score INT NOT NULL,
      UNIQUE KEY participant_match (participant_id, match_id),
      FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    )
  `
};

// Default admin users
const DEFAULT_ADMINS = [
  {
    id: "admin123",
    name: "Sergio Manzur Jr",
    email: "sergiom2010@gmail.com",
    password: "abc0123abc",
    role: "admin"
  },
  {
    id: "admin456",
    name: "Sergio Manzur Sr",
    email: "sergiomanzur1@gmail.com",
    password: "abc0123abc", 
    role: "admin"  
  }
];

async function initDatabase() {
  console.log('Starting database initialization...');
  
  // Check environment variables
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE', 'DB_PORT'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please create a .env file with these variables.');
    process.exit(1);
  }
  
  // Create connection pool
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || '25060', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  try {
    // Test connection
    console.log('Testing database connection...');
    const connection = await pool.getConnection();
    console.log('✅ Connected to database successfully');
    connection.release();
    
    // Create tables
    console.log('Creating database tables...');
    for (const [tableName, query] of Object.entries(dbInitQueries)) {
      console.log(`- Creating ${tableName.replace('create', '').replace('Table', '')} table if not exists`);
      await pool.query(query);
    }
    console.log('✅ Database tables created or already exist');
    
    // Insert default admins if they don't exist
    console.log('Checking for default admin users...');
    for (const admin of DEFAULT_ADMINS) {
      const [existingAdmin] = await pool.query('SELECT * FROM users WHERE email = ?', [admin.email]);
      
      if (existingAdmin.length === 0) {
        console.log(`- Creating admin user: ${admin.name} (${admin.email})`);
        await pool.query(
          'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
          [admin.id, admin.name, admin.email, admin.password, admin.role]
        );
      } else {
        console.log(`- Admin user already exists: ${admin.name} (${admin.email})`);
      }
    }
    console.log('✅ Default admin users are set up');
    
    console.log('🎉 Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run initialization
initDatabase();
