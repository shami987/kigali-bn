// This file defines the schema for your Laptop model.

const mongoose = require('mongoose');

const laptopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    serialNumber: {
        type: String,
        required: true,
        unique: true, // Ensure serial numbers are unique
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: String,
        required: true,
        trim: true
    },

    distributedStatus: {
        type: Boolean,
        default: false // Default to false (not distributed)
    },
    // IMPORTANT CHANGE: 'assignedTo' now references a 'Distribution' document
    // This 'Distribution' document represents the *current active assignment*
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distribution', // Now references the active Distribution record
        default: null // Null if not currently assigned
    },
    origin: {
        type: String,
        required: true,
        enum: ['donation', 'purchased'],
        trim: true
    }
}, {
    timestamps: true // Adds `createdAt` and `updatedAt` fields
});

const Laptop = mongoose.model('Laptop', laptopSchema);

module.exports = Laptop;