const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check if user already exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User with that email or username already exists.' });
        }

        // Create new user
        user = new User({ username, email, password, role });
        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET
        );

        res.status(201).json({ message: 'User registered successfully', token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
        );

        res.status(200).json({ message: 'Logged in successfully', token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// Logout (client-side) - Token invalidation happens on the client by deleting the token.
// For server-side logout, you'd typically implement a token blacklist, but for simplicity,
// we'll keep it client-side. The route below is just for API structure if needed.
exports.logout = (req, res) => {
    // In a stateless JWT system, logout is typically handled client-side by deleting the token.
    // If you need server-side token invalidation for single-use tokens or revoke functionality,
    // you would implement a token blacklist here.
    res.status(200).json({ message: 'Logged out successfully (please delete token from client).' });
};