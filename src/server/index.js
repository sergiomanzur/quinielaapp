import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Determine if we're in Vercel or local environment
const isVercel = process.env.VERCEL === '1';
const BASE_PATH = isVercel ? '/tmp' : path.join(__dirname, '../..');
const DATA_FILE = path.join(BASE_PATH, 'quiniela-data.json');
const USERS_FILE = path.join(BASE_PATH, 'users-data.json');

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

// Middleware to parse JSON with increased limit
app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
const ensureDataFiles = async () => {
  try {
    const dataDir = path.dirname(DATA_FILE);
    await fs.ensureDir(dataDir);
    
    if (!(await fs.pathExists(DATA_FILE))) {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
    }
    
    if (!(await fs.pathExists(USERS_FILE))) {
      // Initialize with default admin users
      await fs.writeFile(USERS_FILE, JSON.stringify([DEFAULT_ADMIN, DEFAULT_ADMIN_2], null, 2));
    } else {
      // Check if admins exist, add if not
      const usersData = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(usersData);
      let updated = false;
      
      const admin1Exists = users.some(user => user.email === DEFAULT_ADMIN.email);
      if (!admin1Exists) {
        users.push(DEFAULT_ADMIN);
        updated = true;
        console.log('Default admin user 1 added');
      }
      
      const admin2Exists = users.some(user => user.email === DEFAULT_ADMIN_2.email);
      if (!admin2Exists) {
        users.push(DEFAULT_ADMIN_2);
        updated = true;
        console.log('Default admin user 2 added');
      }
      
      if (updated) {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      }
    }
  } catch (error) {
    console.error('Error ensuring data files exist:', error);
  }
};

ensureDataFiles();

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API endpoints for quiniela data
app.get('/api/quinielas', async (req, res) => {
  try {
    if (await fs.pathExists(DATA_FILE)) {
      const data = await fs.readFile(DATA_FILE, 'utf8');
      res.json(JSON.parse(data));
    } else {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading quiniela data:', error);
    res.status(500).json({ error: 'Failed to read quiniela data', details: error.message });
  }
});

app.post('/api/quinielas', async (req, res) => {
  try {
    console.log('Received POST request to save quinielas');
    const quinielas = req.body;
    
    if (!Array.isArray(quinielas)) {
      return res.status(400).json({ error: 'Invalid data format. Expected an array.' });
    }
    
    console.log(`Saving ${quinielas.length} quinielas`);
    await fs.ensureDir(path.dirname(DATA_FILE));
    await fs.writeFile(DATA_FILE, JSON.stringify(quinielas, null, 2));
    console.log('Quinielas saved successfully');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error writing quiniela data:', error);
    res.status(500).json({ error: 'Failed to write quiniela data', details: error.message });
  }
});

// API endpoints for user data
app.get('/api/users', async (req, res) => {
  try {
    if (await fs.pathExists(USERS_FILE)) {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      res.json(JSON.parse(data));
    } else {
      await fs.writeFile(USERS_FILE, JSON.stringify([DEFAULT_ADMIN, DEFAULT_ADMIN_2], null, 2));
      res.json([DEFAULT_ADMIN, DEFAULT_ADMIN_2]);
    }
  } catch (error) {
    console.error('Error reading users data:', error);
    res.status(500).json({ error: 'Failed to read users data', details: error.message });
  }
});

// Login endpoint
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const usersData = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(usersData);
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Don't send the password back to the client
      const { password, ...userWithoutPassword } = user;
      return res.json({ success: true, user: userWithoutPassword });
    } else {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Register endpoint
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    const usersData = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(usersData);
    
    // Check if email already exists
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Create new user with generated ID
    const newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name,
      email,
      password,
      role: 'user'
    };
    
    users.push(newUser);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    
    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Only serve static files in local development
if (!isVercel) {
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, '../../dist')));

  // For all other routes, serve the index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
}

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Data file location: ${DATA_FILE}`);
    console.log(`Users file location: ${USERS_FILE}`);
  });
}

// Export for Vercel serverless function
export default app;

console.error('⚠️ DEPRECATED: This server file is no longer used.');
console.error('⚠️ Please use api/index.js instead.');
console.error('⚠️ Update your package.json scripts to use "node api/index.js"');
process.exit(1); // Exit with error code
