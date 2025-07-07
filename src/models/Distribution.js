// model/Distribution.js
const mongoose = require('mongoose');

const distributionSchema = new mongoose.Schema({
    // Reference to the Laptop being distributed.
    // 'unique: true' should NOT be here if you want to allow re-distribution
    // and keep a history of distributions.
    laptop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Laptop',
        required: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    userEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Please fill a valid email address']
    },
    userPhoneNumber: {
        type: String,
        trim: true
    },
    userPosition: {
        type: String,
        trim: true
    },
    assignedDate: {
        type: Date,
        default: Date.now // Automatically sets the date of assignment
    },
    returnedDate: {
        type: Date,
        default: null // Will be set when the laptop is returned
    },
    returnedReason: {
        type: String,
        trim: true,
        default: null
    },
    returnedStatus: {
        type: Boolean,
        default: false //Default to false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// IMPORTANT: Add this partial unique index
// This ensures that the 'laptop' field is unique ONLY for documents
// where 'returnedDate' is null (i.e., currently active distributions).
distributionSchema.index(
    { laptop: 1 }, // Index on the 'laptop' field (ascending order)
    {
        unique: true,
        partialFilterExpression: { returnedDate: { $eq: null } }
    }
);

const Distribution = mongoose.model('Distribution', distributionSchema);

module.exports = Distribution;
