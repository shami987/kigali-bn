// controllers/distributionControllers.js
const Distribution = require("../models/Distribution");
const Laptop = require("../models/Laptop"); // Make sure to import your Laptop model here!

// @desc    Get all distribution records
// @route   GET /api/distributions
// @access  Private
exports.getAllDistributions = async (req, res) => {
    try {
        const distributions = await Distribution.find({}).populate('laptop');
        res.status(200).json(distributions);
    } catch (err) {
        console.error('Error fetching distributions:', err);
        res.status(500).json({ message: 'Server error while fetching distribution records.' });
    }
};

// @desc    Get a single distribution record by ID
// @route   GET /api/distributions/:id
// @access  Private
exports.getDistributionById = async (req, res) => {
    try {
        const distribution = await Distribution.findById(req.params.id).populate('laptop');
        if (!distribution) {
            return res.status(404).json({ message: "Distribution record not found." });
        }
        res.status(200).json(distribution);
    } catch (err) {
        console.error('Error fetching single distribution:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all active (not returned) distribution records
// @route   GET /api/distributions/active
// @access  Private
exports.getActiveDistributions = async (req, res) => {
    try {
        const activeDistributions = await Distribution.find({ returnedDate: null }).populate('laptop');
        res.status(200).json(activeDistributions);
    } catch (err) {
        console.error('Error fetching active distributions:', err);
        res.status(500).json({ message: 'Server error while fetching active distribution records.' });
    }
};

// @desc    Get all returned distribution records
// @route   GET /api/distributions/returned
// @access  Private
exports.getReturnedDistributions = async (req, res) => {
    try {
        const returnedDistributions = await Distribution.find({ returnedDate: { $ne: null } }).populate('laptop');
        res.status(200).json(returnedDistributions);
    } catch (err) {
        console.error('Error fetching returned distributions:', err);
        res.status(500).json({ message: 'Server error while fetching returned distribution records.' });
    }
};

// @desc    Create a new distribution record
// @route   POST /api/distributions
// @access  Private (e.g., Admin/Manager)
exports.createDistribution = async (req, res) => {
    const { laptop: laptopId, userName, userEmail, userPhoneNumber, userPosition } = req.body;

    try {
        // 1. Check if laptop exists and is not currently distributed
        const laptop = await Laptop.findById(laptopId);
        if (!laptop) {
            return res.status(404).json({ message: 'Laptop not found.' });
        }
        if (laptop.isDistributed) { // Assuming 'isDistributed' field on Laptop model
            return res.status(400).json({ message: 'Laptop is already actively distributed.' });
        }

        // 2. Create the new distribution record
        const newDistribution = new Distribution({
            laptop: laptopId,
            userName,
            userEmail,
            userPhoneNumber,
            userPosition,
            assignedDate: new Date() // Explicitly set for clarity, though schema default works
        });

        const distribution = await newDistribution.save();

        // 3. Update laptop status
        laptop.isDistributed = true; // Set laptop as distributed
        await laptop.save();

        res.status(201).json({ message: 'Laptop successfully distributed.', distribution });

    } catch (err) {
        console.error('Error creating distribution:', err);
        // Handle Mongoose validation errors or duplicate key errors from partial index
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        if (err.code === 11000) { // Duplicate key error (from partial unique index)
            return res.status(400).json({ message: 'This laptop is already actively distributed. Please return it first.' });
        }
        res.status(500).json({ message: 'Server error while creating distribution record.' });
    }
};


// @desc    Mark an active distribution record as returned
// @route   PUT /api/distributions/:id/return OR /api/laptops/:laptopId/return
// @access  Private (e.g., Admin/Manager)
exports.returnDistributedLaptop = async (req, res) => {
    const { id } = req.params; // This 'id' should be the _id of the Distribution record
    const { returnedReason } = req.body;

    try {
        // Find the active distribution record by its _id and ensure it hasn't been returned yet
        const distribution = await Distribution.findOneAndUpdate(
            { _id: id, returnedDate: null }, // Find by ID AND ensure it's an active distribution
            {
                returnedDate: new Date(),
                returnedReason: returnedReason || 'No reason provided'
            },
            { new: true } // Return the updated document
        ).populate('laptop');

        if (!distribution) {
            // This means either the distribution ID was not found, or it was already returned
            return res.status(404).json({ message: "Active distribution record not found or already returned." });
        }

        // Now, update the corresponding Laptop's status
        const laptop = await Laptop.findById(distribution.laptop._id);
        if (laptop) {
            laptop.isDistributed = false; // Mark laptop as not distributed
            await laptop.save();
        } else {
            console.warn(`Laptop with ID ${distribution.laptop._id} not found for returned distribution ${id}`);
        }

        res.status(200).json({ message: 'Laptop successfully returned.', distribution });

    } catch (err) {
        console.error('Error returning laptop:', err);
        res.status(500).json({ message: 'Server error while returning laptop.' });
    }
};

// You might also add update/delete for distribution records if needed,
// but usually, they are managed via laptop's distribute/return actions.