import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables from .env file
dotenv.config();

// Print loaded environment variables to help debug
console.log('Environment variables loaded:');  
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Validate required environment variables are set
const checkRequiredEnvVars = () => {
  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_DATABASE',
    'DB_PORT'
  ];

  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('Please ensure .env file exists and contains these variables');
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  return true;
};

// Run the check before configuring database
const envVarsOk = checkRequiredEnvVars();
if (!envVarsOk) {
  console.warn('⚠️ Continuing with missing environment variables - Database operations will likely fail');
}

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Default admin users
const DEFAULT_ADMIN = {
  id: "admin123",
  name: "Sergio Manzur Jr",
  email: "sergiom2010@gmail.com",
  password: "abc0123abc",
  role: "admin"
};

const DEFAULT_ADMIN_2 = {
  id: "admin456",
  name: "Sergio Manzur Sr",
  email: "sergiomanzur1@gmail.com",
  password: "abc0123abc", 
  role: "admin"  
};

// Database connection pool
let pool;

// Database table initialization queries
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

// Initialize database connection
const initializeDatabase = async () => {
  try {
    console.log('Initializing database connection...');
    
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: parseInt(process.env.DB_PORT || '25060', 10),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful!');
    connection.release();
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Create database tables if they don't exist
const initializeTables = async () => {
  try {
    console.log('Checking and creating database tables if needed...');
    
    // Create tables in sequence to respect foreign key constraints
    for (const [tableName, query] of Object.entries(dbInitQueries)) {
      console.log(`Creating table if not exists: ${tableName.replace('create', '').replace('Table', '')}`);
      await pool.query(query);
    }
    
    console.log('✅ Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database tables:', error.message);
    return false;
  }
};

// Create default admin users if they don't exist
const createDefaultAdmins = async () => {
  try {
    console.log('Checking for default admin users...');
    
    // Check if admin1 exists
    const [admin1Results] = await pool.query('SELECT * FROM users WHERE email = ?', [DEFAULT_ADMIN.email]);
    if (admin1Results.length === 0) {
      console.log('Creating default admin user 1...');
      await pool.query(
        'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [DEFAULT_ADMIN.id, DEFAULT_ADMIN.name, DEFAULT_ADMIN.email, DEFAULT_ADMIN.password, DEFAULT_ADMIN.role]
      );
    }
    
    // Check if admin2 exists
    const [admin2Results] = await pool.query('SELECT * FROM users WHERE email = ?', [DEFAULT_ADMIN_2.email]);
    if (admin2Results.length === 0) {
      console.log('Creating default admin user 2...');
      await pool.query(
        'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [DEFAULT_ADMIN_2.id, DEFAULT_ADMIN_2.name, DEFAULT_ADMIN_2.email, DEFAULT_ADMIN_2.password, DEFAULT_ADMIN_2.role]
      );
    }
    
    console.log('✅ Default admin users are set up');
    return true;
  } catch (error) {
    console.error('❌ Error creating default admin users:', error.message);
    return false;
  }
};

// Generate a unique ID (helper function)
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper function to format ISO datetime to MySQL datetime format
const formatDateForMySQL = (isoDate) => {
  const date = new Date(isoDate);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Initialize database, tables, and default data before starting server
(async () => {
  try {
    console.log('Starting server with database initialization...');
    
    // Initialize database connection
    const dbConnected = await initializeDatabase();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Initialize tables
    const tablesInitialized = await initializeTables();
    if (!tablesInitialized) {
      throw new Error('Failed to initialize database tables');
    }
    
    // Create default admin users
    const adminsCreated = await createDefaultAdmins();
    if (!adminsCreated) {
      console.warn('⚠️ Warning: Could not create default admin users');
    }
    
    console.log('🚀 Database initialization complete!');
    
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Database: ${process.env.DB_DATABASE} at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    });
  } catch (error) {
    console.error('❌ Critical failure initializing database:', error);
    console.error('Server will not start due to database initialization failure');
    process.exit(1);
  }
})();

// API endpoints for quiniela data
app.get('/api/quinielas', async (req, res) => {
  try {
    // Get all quinielas with basic info
    const [quinielas] = await pool.query(`
      SELECT id, name, created_by as createdBy, created_at as createdAt
      FROM quinielas
    `);
    
    // Fetch matches for all quinielas
    for (const quiniela of quinielas) {
      // Get matches
      const [matches] = await pool.query(`
        SELECT 
          id, 
          home_team as homeTeam, 
          away_team as awayTeam, 
          match_date as date, 
          home_score as homeScore, 
          away_score as awayScore
        FROM matches 
        WHERE quiniela_id = ?
      `, [quiniela.id]);
      
      // Get participants
      const [participants] = await pool.query(`
        SELECT p.id, p.user_id as userId, p.points
        FROM participants p
        WHERE p.quiniela_id = ?
      `, [quiniela.id]);
      
      // Get predictions for each participant
      for (const participant of participants) {
        const [predictions] = await pool.query(`
          SELECT 
            match_id as matchId, 
            home_score as homeScore, 
            away_score as awayScore
          FROM predictions 
          WHERE participant_id = ?
        `, [participant.id]);
        
        participant.predictions = predictions;
      }
      
      // Attach matches and participants to quiniela
      quiniela.matches = matches;
      quiniela.participants = participants;
    }
    
    res.json(quinielas);
  } catch (error) {
    console.error('Error reading quiniela data:', error);
    res.status(500).json({ error: 'Failed to read quiniela data', details: error.message });
  }
});

app.post('/api/quinielas', async (req, res) => {
  try {
    const quinielas = req.body;
    if (!Array.isArray(quinielas)) {
      return res.status(400).json({ error: 'Invalid data format. Expected an array.' });
    }
    
    // Begin transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // First, delete all existing quinielas, matches, participants and predictions
      await connection.query('DELETE FROM predictions');
      await connection.query('DELETE FROM participants');
      await connection.query('DELETE FROM matches');
      await connection.query('DELETE FROM quinielas');
      
      // Then insert all quinielas and their related data
      for (const quiniela of quinielas) {
        // Insert quiniela
        await connection.query(
          'INSERT INTO quinielas (id, name, created_by, created_at) VALUES (?, ?, ?, ?)',
          [quiniela.id, quiniela.name, quiniela.createdBy, formatDateForMySQL(quiniela.createdAt)]
        );
        
        // Insert matches
        if (quiniela.matches && quiniela.matches.length > 0) {
          for (const match of quiniela.matches) {
            await connection.query(
              `INSERT INTO matches 
               (id, quiniela_id, home_team, away_team, match_date, home_score, away_score) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                match.id, 
                quiniela.id, 
                match.homeTeam, 
                match.awayTeam, 
                formatDateForMySQL(match.date), 
                match.homeScore, 
                match.awayScore
              ]
            );
          }
        }
        
        // Insert participants and their predictions
        if (quiniela.participants && quiniela.participants.length > 0) {
          for (const participant of quiniela.participants) {
            // Create participant ID if not exists
            const participantId = participant.id || generateId();
            
            // Insert participant
            await connection.query(
              'INSERT INTO participants (id, user_id, quiniela_id, points) VALUES (?, ?, ?, ?)',
              [participantId, participant.userId, quiniela.id, participant.points || 0]
            );
            
            // Insert predictions
            if (participant.predictions && participant.predictions.length > 0) {
              for (const prediction of participant.predictions) {
                await connection.query(
                  `INSERT INTO predictions 
                   (id, participant_id, match_id, home_score, away_score) 
                   VALUES (?, ?, ?, ?, ?)`,
                  [
                    generateId(), 
                    participantId, 
                    prediction.matchId, 
                    prediction.homeScore, 
                    prediction.awayScore
                  ]
                );
              }
            }
          }
        }
      }
      
      // Commit transaction
      await connection.commit();
      res.json({ success: true });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error writing quiniela data:', error);
    res.status(500).json({ error: 'Failed to write quiniela data', details: error.message });
  }
});

// Add a new endpoint to specifically update match results
app.put('/api/matches/:id/result', async (req, res) => {
  try {
    const matchId = req.params.id;
    const { homeScore, awayScore } = req.body;
    
    // Validate input
    if (homeScore === undefined || awayScore === undefined) {
      return res.status(400).json({ error: 'Home score and away score are required' });
    }
    
    // Update match result in the database
    await pool.query(
      'UPDATE matches SET home_score = ?, away_score = ? WHERE id = ?',
      [homeScore, awayScore, matchId]
    );
    
    // Get the updated match to return
    const [matches] = await pool.query(
      `SELECT 
        id, 
        home_team as homeTeam, 
        away_team as awayTeam, 
        match_date as date, 
        home_score as homeScore, 
        away_score as awayScore
      FROM matches 
      WHERE id = ?`,
      [matchId]
    );
    
    if (matches.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Find all predictions for this match and recalculate points
    await updatePointsForMatch(matchId);
    
    res.json({ success: true, match: matches[0] });
  } catch (error) {
    console.error('Error updating match result:', error);
    res.status(500).json({ error: 'Failed to update match result', details: error.message });
  }
});

// Helper function to update points for all participants after a match result change
const updatePointsForMatch = async (matchId) => {
  try {
    // Get the match details
    const [matches] = await pool.query(
      'SELECT id, home_score, away_score FROM matches WHERE id = ?',
      [matchId]
    );
    
    if (matches.length === 0 || matches[0].home_score === null || matches[0].away_score === null) {
      return; // Match not found or scores not set
    }
    
    const match = matches[0];
    
    // Get all predictions for this match
    const [predictions] = await pool.query(
      `SELECT 
        p.id,
        p.participant_id,
        p.home_score,
        p.away_score
      FROM predictions p
      WHERE p.match_id = ?`,
      [matchId]
    );
    
    // For each prediction, calculate points
    for (const prediction of predictions) {
      let points = 0;
      
      // Exact score match = 4 points
      if (prediction.home_score === match.home_score && prediction.away_score === match.away_score) {
        points = 4;
      } else {
        // Calculate result type
        const matchResult = match.home_score > match.away_score ? 'H' : 
                           match.home_score < match.away_score ? 'A' : 'D';
        const predictionResult = prediction.home_score > prediction.away_score ? 'H' : 
                                prediction.home_score < prediction.away_score ? 'A' : 'D';
        
        // Match on result type
        if (matchResult === predictionResult) {
          if (matchResult === 'H') points = 1;      // Home win
          else if (matchResult === 'D') points = 2; // Draw
          else if (matchResult === 'A') points = 3; // Away win
        }
      }
      
      // Update points for this prediction (if we had a predictions_points table)
      // For now, we'll need to update the participant's total points
    }
    
    // Update total points for all participants in this quiniela
    await recalculateParticipantPoints();
  } catch (error) {
    console.error('Error updating points for match:', error);
  }
};

// Helper function to recalculate points for all participants
const recalculateParticipantPoints = async () => {
  try {
    // Get all participants
    const [participants] = await pool.query('SELECT id, quiniela_id FROM participants');
    
    // For each participant, recalculate total points
    for (const participant of participants) {
      let totalPoints = 0;
      
      // Get all predictions for this participant
      const [predictions] = await pool.query(
        `SELECT 
          p.id,
          p.match_id,
          p.home_score as predHomeScore,
          p.away_score as predAwayScore,
          m.home_score as matchHomeScore,
          m.away_score as matchAwayScore
        FROM predictions p
        JOIN matches m ON p.match_id = m.id
        WHERE p.participant_id = ? AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL`,
        [participant.id]
      );
      
      // Calculate points for each prediction
      for (const prediction of predictions) {
        // Exact score match = 4 points
        if (prediction.predHomeScore === prediction.matchHomeScore && 
            prediction.predAwayScore === prediction.matchAwayScore) {
          totalPoints += 4;
        } else {
          // Calculate result type
          const matchResult = prediction.matchHomeScore > prediction.matchAwayScore ? 'H' : 
                             prediction.matchHomeScore < prediction.matchAwayScore ? 'A' : 'D';
          const predictionResult = prediction.predHomeScore > prediction.predAwayScore ? 'H' : 
                                  prediction.predHomeScore < prediction.predAwayScore ? 'A' : 'D';
          
          // Match on result type
          if (matchResult === predictionResult) {
            if (matchResult === 'H') totalPoints += 1;      // Home win
            else if (matchResult === 'D') totalPoints += 2; // Draw
            else if (matchResult === 'A') totalPoints += 3; // Away win
          }
        }
      }
      
      // Update participant's total points
      await pool.query(
        'UPDATE participants SET points = ? WHERE id = ?',
        [totalPoints, participant.id]
      );
    }
  } catch (error) {
    console.error('Error recalculating participant points:', error);
  }
};

// API endpoints for user data
app.get('/api/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role FROM users');
    res.json(users);
  } catch (error) {
    console.error('Error reading users data:', error);
    res.status(500).json({ error: 'Failed to read users data', details: error.message });
  }
});

// Get user by ID endpoint
app.get('/api/users/:id', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.params.id]);
    
    if (users.length > 0) {
      res.json(users[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error reading user data:', error);
    res.status(500).json({ error: 'Failed to read user data', details: error.message });
  }
});

// Update user endpoint
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user
    await pool.query(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
      [name || users[0].name, email || users[0].email, role || users[0].role, req.params.id]
    );
    
    // Get updated user
    const [updatedUsers] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ success: true, user: updatedUsers[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// Delete user endpoint
app.delete('/api/users/:id', async (req, res) => {
  try {
    // Check if user exists
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

// Register endpoint
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if email already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Create new user
    const userId = generateId();
    await pool.query(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, password, 'user']
    );
    
    // Get the created user (without password)
    const [newUsers] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({ success: true, user: newUsers[0] });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login endpoint
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user with matching email and password
    const [users] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    
    if (users.length > 0) {
      res.json({ success: true, user: users[0] });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Health check endpoint with database status
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }
  
  res.json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV, 
    nodeVersion: process.version,
    database: {
      status: dbStatus,
      name: process.env.DB_DATABASE,
      host: process.env.DB_HOST
    }
  });
});

export default app;
