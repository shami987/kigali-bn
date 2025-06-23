// routes/distributionRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllDistributions,
    getDistributionById,
    getActiveDistributions,
    getReturnedDistributions,
    createDistribution, // Import new create function
    returnDistributedLaptop // Import new return function
} = require('../controllers/distributionControllers');

// You would typically have authentication/authorization middleware applied here
// For example: const { protect, authorize } = require('../middleware/authMiddleware');

// Get all distribution records
router.get('/', getAllDistributions);

// Get all active (not returned) distribution records
router.get('/active', getActiveDistributions);

// Get all returned distribution records
router.get('/returned', getReturnedDistributions);

// Get a single distribution record by ID
router.get('/:id', getDistributionById);

router.post('/', createDistribution); // Apply protect/authorize middleware as needed in app.js or here

router.put('/:id/return', returnDistributedLaptop); // Apply protect/authorize middleware as needed

module.exports = router;