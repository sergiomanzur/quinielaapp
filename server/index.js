const express = require('express');
const cors = require('cors');
const app = express();

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:5174', // Reemplaza con el origen de tu aplicación frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Define the /users route
app.get('/users', (req, res) => {
  // Replace with your logic to fetch users
  res.json([
    { id: 1, name: 'User One' },
    { id: 2, name: 'User Two' },
  ]);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
