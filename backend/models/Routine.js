const mongoose = require("mongoose");

const routineSchema = new mongoose.Schema(
  {
    // Which user owns this routine
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Example: Diet, Gym, Study
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional description
    description: {
      type: String,
      default: "",
    },

    // Category (fitness, work, learning, mindfulness, lifestyle, finance, other)
    category: {
      type: String,
      enum: ["fitness", "work", "learning", "mindfulness", "lifestyle", "finance", "other"],
      default: "lifestyle",
    },

    // Daily, Weekly, or Monthly
    // Schedule type
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "specific"],
      default: "daily",
    },

// For weekly routines
// Example: ["monday", "wednesday", "friday"]
weekdays: {
  type: [String],
  default: [],
},

// For monthly routines
// Example: [1, 15, 30]
monthDates: {
  type: [Number],
  default: [],
},

// For specific-date routines
// Example: ["2026-09-05", "2026-09-20"]
specificDates: {
  type: [String],
  default: [],
},

    // Tasks inside the routine
    tasks: [
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    completedDates: {
      type: [String],
      default: [],
    },
  },
],
  },
  {
    timestamps: true,
  }
);

const Routine = mongoose.model("Routine", routineSchema);

module.exports = Routine;