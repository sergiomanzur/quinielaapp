import express from 'express';
import AWS from 'aws-sdk';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Print loaded environment variables to help debug
console.log('Environment variables loaded:');  
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Validate required environment variables are set
const checkRequiredEnvVars = () => {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_BUCKET_NAME'
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

// Run the check before configuring S3
const envVarsOk = checkRequiredEnvVars();
if (!envVarsOk) {
  console.warn('⚠️ Continuing with missing environment variables - S3 operations will likely fail');
}

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Better console output for debugging S3 operations
const logS3Operation = (operation, bucket, key, success, error = null) => {
  const statusEmoji = success ? '✅' : '❌';
  console.log(`${statusEmoji} S3 ${operation}: ${bucket}/${key} - ${success ? 'Success' : 'Failed'}`);
  if (error) console.error(`S3 Error Details: ${error.code || ''} - ${error.message}`);
};

// Configure AWS SDK with explicit logging of credentials status
const configureS3 = () => {
  try {
    // Log environment variables (redacted for security)
    console.log('AWS Configuration:');
    console.log(`- Region: ${process.env.AWS_REGION || 'NOT SET'}`);
    console.log(`- Bucket: ${process.env.AWS_BUCKET_NAME || 'NOT SET'}`);
    console.log(`- Access Key: ${process.env.AWS_ACCESS_KEY_ID ? '***' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'NOT SET'}`);
    console.log(`- Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? '******' : 'NOT SET'}`);
    
    return new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  } catch (error) {
    console.error('Failed to configure S3 client:', error);
    throw error;
  }
};

const s3 = configureS3();
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const QUINIELA_DATA_KEY = 'quiniela-data.json';
const USERS_DATA_KEY = 'users-data.json';

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

// Helper function to get data from S3 with better error handling
const getDataFromS3 = async (key) => {
  try {
    console.log(`Getting data from S3: ${BUCKET_NAME}/${key}`);
    const params = { Bucket: BUCKET_NAME, Key: key };
    const data = await s3.getObject(params).promise();
    const parsed = JSON.parse(data.Body.toString('utf-8'));
    logS3Operation('GET', BUCKET_NAME, key, true);
    return parsed;
  } catch (error) {
    logS3Operation('GET', BUCKET_NAME, key, false, error);
    if (error.code === 'NoSuchKey') {
      console.log(`No data found for key: ${key}, will initialize with empty array`);
      return [];
    }
    throw error; // Re-throw other errors for proper handling upstream
  }
};

// Helper function to save data to S3 with better error handling
const saveDataToS3 = async (key, data) => {
  try {
    console.log(`Saving data to S3: ${BUCKET_NAME}/${key} (${JSON.stringify(data).length} bytes)`);
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    };
    await s3.putObject(params).promise();
    logS3Operation('PUT', BUCKET_NAME, key, true);
    return true;
  } catch (error) {
    logS3Operation('PUT', BUCKET_NAME, key, false, error);
    throw error; // Re-throw for proper handling
  }
};

// Helper function to check if an object exists in S3
const checkS3ObjectExists = async (key) => {
  try {
    console.log(`Checking if object exists: ${BUCKET_NAME}/${key}`);
    await s3.headObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    logS3Operation('HEAD', BUCKET_NAME, key, true);
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      logS3Operation('HEAD', BUCKET_NAME, key, false, { code: 'NotFound', message: 'Object not found' });
      return false;
    }
    logS3Operation('HEAD', BUCKET_NAME, key, false, error);
    throw error;
  }
};

// Test S3 connectivity
const testS3Connection = async () => {
  try {
    console.log('Testing S3 connectivity...');
    await s3.listBuckets().promise();
    console.log('✅ S3 connection successful!');
    return true;
  } catch (error) {
    console.error('❌ S3 connection test failed:', error.message);
    return false;
  }
};

// Ensure data files exist in S3 with explicit error handling and retries
const ensureDataFiles = async (retryCount = 3) => {
  try {
    console.log(`Checking S3 bucket ${BUCKET_NAME} for required data files...`);
    
    // Test connection first
    const connected = await testS3Connection();
    if (!connected) {
      throw new Error('Failed to connect to S3');
    }
    
    // Ensure quiniela data exists
    let quinielaExists = false;
    try {
      quinielaExists = await checkS3ObjectExists(QUINIELA_DATA_KEY);
    } catch (error) {
      console.error(`Error checking quiniela data: ${error.message}`);
    }
    
    if (!quinielaExists) {
      console.log(`Creating empty quiniela data in S3: ${QUINIELA_DATA_KEY}`);
      await saveDataToS3(QUINIELA_DATA_KEY, []);
      console.log('✅ Quiniela data initialized successfully');
    }
    
    // Ensure users data exists
    let usersData = [];
    let usersExists = false;
    let needToSaveUsers = false;
    
    try {
      usersExists = await checkS3ObjectExists(USERS_DATA_KEY);
    } catch (error) {
      console.error(`Error checking users data: ${error.message}`);
    }
    
    if (usersExists) {
      console.log(`Users data exists in S3: ${USERS_DATA_KEY}`);
      try {
        usersData = await getDataFromS3(USERS_DATA_KEY);
      } catch (error) {
        console.error(`Error getting users data: ${error.message}`);
        // If we can't read the file, we'll create a new one
        usersExists = false;
        needToSaveUsers = true;
      }
    } else {
      console.log(`Users data not found in S3, will create: ${USERS_DATA_KEY}`);
      needToSaveUsers = true;
    }
    
    // Ensure default admin users exist
    const admin1Exists = usersData.some(user => user.email === DEFAULT_ADMIN.email);
    if (!admin1Exists) {
      console.log('Adding default admin user 1');
      usersData.push(DEFAULT_ADMIN);
      needToSaveUsers = true;
    }
    
    const admin2Exists = usersData.some(user => user.email === DEFAULT_ADMIN_2.email);
    if (!admin2Exists) {
      console.log('Adding default admin user 2');
      usersData.push(DEFAULT_ADMIN_2);
      needToSaveUsers = true;
    }
    
    if (needToSaveUsers) {
      console.log(`Saving users data to S3: ${USERS_DATA_KEY}`);
      await saveDataToS3(USERS_DATA_KEY, usersData);
      console.log('✅ User data saved successfully');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error ensuring data files exist in S3: ${error.message}`);
    
    if (retryCount > 0) {
      console.log(`Retrying... (${retryCount} attempts left)`);
      return await ensureDataFiles(retryCount - 1);
    }
    
    throw error;
  }
};

// Initialize S3 data before starting server, with better startup handling
(async () => {
  let initializationSuccess = false;
  
  try {
    console.log('Starting server with S3 data initialization...');
    initializationSuccess = await ensureDataFiles();
    
    if (initializationSuccess) {
      console.log('🚀 S3 data initialization successful!');
    } else {
      console.error('⚠️ Failed to initialize all S3 data, but continuing with server startup');
    }
  } catch (error) {
    console.error('❌ Critical failure initializing S3 data:', error);
    console.error('Server will start but may have limited functionality');
  }
  
  // Start server even if initialization failed
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Using S3 bucket: ${BUCKET_NAME}`);
    console.log(`Quiniela data at: ${QUINIELA_DATA_KEY}`);
    console.log(`Users data at: ${USERS_DATA_KEY}`);
    console.log(`S3 initialization status: ${initializationSuccess ? '✅ Success' : '⚠️ Warning: Some operations may fail'}`);
  });
})();

// API endpoints for quiniela data
app.get('/api/quinielas', async (req, res) => {
  try {
    const data = await getDataFromS3(QUINIELA_DATA_KEY);
    res.json(data);
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
    await saveDataToS3(QUINIELA_DATA_KEY, quinielas);
    res.json({ success: true });
  } catch (error) {
    console.error('Error writing quiniela data:', error);
    res.status(500).json({ error: 'Failed to write quiniela data', details: error.message });
  }
});

// API endpoints for user data
app.get('/api/users', async (req, res) => {
  try {
    const data = await getDataFromS3(USERS_DATA_KEY);
    res.json(data);
  } catch (error) {
    console.error('Error reading users data:', error);
    res.status(500).json({ error: 'Failed to read users data', details: error.message });
  }
});

// Get user by ID endpoint
app.get('/api/users/:id', async (req, res) => {
  try {
    const users = await getDataFromS3(USERS_DATA_KEY);
    const user = users.find(u => u.id === req.params.id);
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
    const users = await getDataFromS3(USERS_DATA_KEY);
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user fields but preserve sensitive data like password
    users[userIndex] = {
      ...users[userIndex],
      name: name || users[userIndex].name,
      email: email || users[userIndex].email,
      role: role || users[userIndex].role,
    };
    
    await saveDataToS3(USERS_DATA_KEY, users);
    
    const { password, ...updatedUser } = users[userIndex];
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// Delete user endpoint
app.delete('/api/users/:id', async (req, res) => {
  try {
    const users = await getDataFromS3(USERS_DATA_KEY);
    const updatedUsers = users.filter(u => u.id !== req.params.id);
    
    if (users.length === updatedUsers.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await saveDataToS3(USERS_DATA_KEY, updatedUsers);
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
    
    let users = [];
    try {
      users = await getDataFromS3(USERS_DATA_KEY);
    } catch (err) {
      console.error('Error reading users for registration, creating new users array', err);
      // Continue with empty array if file doesn't exist
    }
    
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    const newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name,
      email,
      password,
      role: 'user',
    };
    
    users.push(newUser);
    await saveDataToS3(USERS_DATA_KEY, users);
    
    // Don't send the password back to client
    const { password: _, ...safeUser } = newUser;
    res.json({ success: true, user: safeUser });
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
    
    let users = [];
    try {
      users = await getDataFromS3(USERS_DATA_KEY);
    } catch (err) {
      console.error('Error reading users for login', err);
      return res.status(500).json({ error: 'Failed to read users data' });
    }
    
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Health check endpoint with S3 status
app.get('/api/health', async (req, res) => {
  let s3Status = 'unknown';
  try {
    await testS3Connection();
    s3Status = 'connected';
  } catch (err) {
    s3Status = 'error';
  }
  
  res.json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV, 
    nodeVersion: process.version,
    s3: {
      status: s3Status,
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION,
    }
  });
});

export default app;
