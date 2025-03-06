import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '../../quiniela-data.json');

// Middleware to parse JSON with increased limit
app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
const ensureDataFile = async () => {
  try {
    const dataDir = path.dirname(DATA_FILE);
    await fs.ensureDir(dataDir);
    
    if (!(await fs.pathExists(DATA_FILE))) {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error ensuring data file exists:', error);
  }
};

ensureDataFile();

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

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../../dist')));

// For all other routes, serve the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data file location: ${DATA_FILE}`);
});
