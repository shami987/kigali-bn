// This is the entry point of your application, where you set up Express, connect to MongoDB, and integrate your routes.
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const laptopRoutes = require('./routes/laptopRoutes');
const authRoutes = require('./routes/authRoutes'); // NEW: Import auth routes
const { protect, authorize } = require('./middleware/authMiddleware'); // NEW: Import auth middleware
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET; // Ensure JWT_SECRET is loaded from .env;
const distributionRoutes = require('./routes/distributionRoutes');



// Check if JWT_SECRET is defined
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env file.');
    process.exit(1);
}

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));



// Basic route for testing
app.get('/', (req, res) => {
    res.send('Welcome to Laptop Management API!');
});

// Auth routes (no protection needed for register and login)
app.use('/api/auth', authRoutes);
app.use('/api/laptops', protect, laptopRoutes); // All laptop routes now require authentication
app.use('/api/distributions', protect, distributionRoutes);



// Start the server
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});