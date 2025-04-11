// index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Configure CORS
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Basic route - placing this before other routes
app.get('/', (req, res) => {
  res.status(200).json({ message: "Server working perfectly!" });
});

// Connect Database
connectDB();

// Instagram Routes
app.use('/api/instagram', require('./routes/instagramRoutes'));

const PORT = process.env.PORT || 5000;
// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

