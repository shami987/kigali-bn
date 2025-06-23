const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Logout route (optional, primarily client-side token deletion)
router.post('/logout', protect, authController.logout); // Example of a protected logout if needed

module.exports = router;