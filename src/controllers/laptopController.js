// This file will contain the functions for each CRUD operation.

const Laptop = require("../models/Laptop");
const Distribution = require("../models/Distribution");  // IMPORTANT CHANGE: Import Distribution model

// Create a new laptop
exports.createLaptop = async (req, res) => {
  try {
    const newLaptop = new Laptop(req.body);
    const savedLaptop = await newLaptop.save();
    res.status(201).json(savedLaptop);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all laptops
// We'll populate the 'assignedTo' field to get full distribution details
exports.getAllLaptops = async (req, res) => {
  try {
    // IMPORTANT CHANGE: Populate 'assignedTo' which now refers to 'Distribution'
    const laptops = await Laptop.find().populate("assignedTo");
    res.status(200).json(laptops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single laptop by ID
// Also populate 'assignedTo' for single laptop view
exports.getLaptopById = async (req, res) => {
  try {
    // IMPORTANT CHANGE: Populate 'assignedTo'
    const laptop = await Laptop.findById(req.params.id).populate("assignedTo");
    if (!laptop) {
      return res.status(404).json({ message: "Laptop not found" });
    }
    res.status(200).json(laptop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a laptop by ID
exports.updateLaptop = async (req, res) => {
  try {
    const updatedLaptop = await Laptop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate("assignedTo");
    if (!updatedLaptop) {
      return res.status(404).json({ message: "Laptop not found" });
    }
    res.status(200).json(updatedLaptop);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a laptop by ID
// IMPORTANT: When deleting a laptop, also handle its associated distribution record if it exists
exports.deleteLaptop = async (req, res) => {
  try {
    const laptopId = req.params.id;
    const deletedLaptop = await Laptop.findByIdAndDelete(laptopId);

    if (!deletedLaptop) {
      return res.status(404).json({ message: "Laptop not found" });
    }

    // IMPORTANT CHANGE: If the laptop was assigned, also delete its current distribution record
    if (deletedLaptop.assignedTo) {
      await Distribution.findByIdAndDelete(deletedLaptop.assignedTo);
    }

    res.status(200).json({ message: "Laptop deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Distribute a laptop to a user
exports.distributeLaptop = async (req, res) => {
  const { laptopId, userName, userEmail, userPhoneNumber, userPosition } =
    req.body;

  // Basic validation
  if (!laptopId || !userName || !userPosition) {
    return res
      .status(400)
      .json({
        message:
          "Laptop ID, user name, email, and position are required for distribution.",
      });
  }

  try {
    // 1. Find the laptop
    const laptop = await Laptop.findById(laptopId); // Ensure no .lean() here if you want to use laptop.save() later
    if (!laptop) {
      return res.status(404).json({ message: "Laptop not found." });
    }

    // 2. Check if the laptop is already distributed
    // We now check if assignedTo exists AND its returnedDate is null (meaning it's active)
    if (laptop.distributedStatus === true && laptop.assignedTo) {
      // Fetch the current active distribution to provide more context in the error
      const activeDistribution = await Distribution.findById(laptop.assignedTo);
      // Only return error if the activeDistribution exists and hasn't been returned
      if (activeDistribution && !activeDistribution.returnedDate) {
        return res.status(400).json({
          message: `Laptop is already distributed to ${activeDistribution.userName} (${activeDistribution.userEmail}).`,
        });
      }
    }

    // 3. Create a new Distribution record for this assignment
    const newDistribution = new Distribution({
      laptop: laptopId, // Link to the laptop
      userName,
      userEmail,
      userPhoneNumber,
      userPosition,
      assignedDate: new Date(), // Set assignment date
    });
    const savedDistribution = await newDistribution.save();

    // 4. Update the laptop's distribution status and assignedTo reference using findOneAndUpdate
    // This is generally more robust for direct field updates.
    const updatedLaptop = await Laptop.findOneAndUpdate(
      { _id: laptopId }, // Query for the laptop
      {
        distributedStatus: true,
        assignedTo: savedDistribution._id, // Link laptop to this new distribution record
      },
      { new: true, runValidators: true } // Return the updated document, run schema validators
    ).populate("assignedTo"); // Populate immediately after update for the response

    if (!updatedLaptop) {
        // This case should ideally not happen if Laptop.findById succeeded above
        return res.status(500).json({ message: "Failed to update laptop after distribution." });
    }

    res.status(200).json({
      message: "Laptop distributed successfully!",
      laptop: updatedLaptop,
    });
  } catch (err) {
    console.error('Error in distributeLaptop:', err); // Use console.error for errors
    // Handle validation errors (e.g., invalid email format from Distribution schema)
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    // Handle duplicate key error (e.g., trying to assign a laptop that's already in an active distribution record)
    if (err.code === 11000) {
      // MongoDB duplicate key error code
      return res
        .status(400)
        .json({
          message:
            "This laptop is already part of an active distribution record (serial number conflict).",
        });
    }
    res.status(500).json({ message: err.message });
  }
};

// Return a laptop from a user
exports.returnLaptop = async (req, res) => {
  const { laptopId, returnedReason } = req.body; //Get laptopId and returnedReason

  if (!laptopId) {
    return res
      .status(400)
      .json({ message: "Laptop ID is required to return a laptop." });
  }

  try {
    // 1. Find the laptop
    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res.status(404).json({ message: "Laptop not found." });
    }

    // 2. Check if the laptop is currently distributed
    if (laptop.distributedStatus === false || !laptop.assignedTo) {
      return res
        .status(400)
        .json({ message: "Laptop is not currently distributed." });
    }

    // 3. Find the active distribution record and mark it as returned
    // IMPORTANT CHANGE: Update the associated Distribution record by setting 'returnedDate'
    const activeDistribution = await Distribution.findById(laptop.assignedTo);

    if (!activeDistribution || activeDistribution.returnedDate !== null) {
      return res
        .status(400)
        .json({
          message:
            "No active distribution record found for this laptop or it was already returned.",
        });
    }

    activeDistribution.returnedDate = new Date();
    activeDistribution.returnedReason = returnedReason || null; //set the returned reason
    activeDistribution.returnedStatus = true; //set returned status to true
    await activeDistribution.save();

    // 4. Update the laptop's status and clear its assignedTo reference
    laptop.distributedStatus = false;
    laptop.assignedTo = null; // Remove the link to the distribution record
    await laptop.save();

    res.status(200).json({
      message: "Laptop returned successfully!",
      laptop: laptop, // Respond with the updated laptop (without assignedTo populated)
      returnedDistribution: activeDistribution // Optionally, include the updated distribution record
    });
  } catch (err) {
    console.error('Error returning laptop:', err); // Log the error for debugging
    res.status(500).json({ message: err.message });
  }
};
