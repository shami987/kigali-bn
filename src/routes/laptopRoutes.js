// This file defines the API endpoints for your laptop operations.
const express = require('express');
const router = express.Router();
const laptopController = require('../controllers/laptopController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Import authorization middleware

// NOTE: The 'protect' middleware is applied in app.js for all /api/laptops routes.
// You can add 'authorize' here for specific role-based access.

// Create a new laptop (e.g., only 'admin' or 'it_staff' can create)
router.post('/', authorize('admin', 'it_staff'), laptopController.createLaptop);

// Get all laptops (e.g., all authenticated users can view)
router.get('/', laptopController.getAllLaptops); // Protect is already in app.js

// Get a single laptop by ID (e.g., all authenticated users can view)
router.get('/:id', laptopController.getLaptopById);

// Update a laptop by ID (e.g., only 'admin' or 'it_staff' can update)
router.put('/:id', authorize('admin', 'it_staff'), laptopController.updateLaptop);

// Delete a laptop by ID (e.g., only 'admin' can delete)
router.delete('/:id', authorize('admin'), laptopController.deleteLaptop);

// Distribute a laptop to a user (e.g., only 'it_staff' or 'admin' can distribute)
router.post('/distribute', authorize('admin', 'it_staff'), laptopController.distributeLaptop);

// Return a laptop from a user (e.g., only 'it_staff' or 'admin' can return)
router.post('/return', authorize('admin', 'it_staff'), laptopController.returnLaptop);

module.exports = router;