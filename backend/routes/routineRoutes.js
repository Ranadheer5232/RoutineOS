const express = require("express");

const router = express.Router();

const {
  createRoutine,
  getMyRoutines,
  getAllMyRoutines,
  getRoutineById,
  getCurrentStreak,
  getAnalytics,
  toggleTaskCompletion,
  addTask,
  deleteTask,
  deleteRoutine,
  updateRoutine,
} = require("../controllers/routineController");

const protect = require("../middleware/authMiddleware");

// =========================
// CREATE ROUTINE
// =========================
router.post("/", protect, createRoutine);

// =========================
// GET DASHBOARD ROUTINES
// =========================
router.get("/", protect, getMyRoutines);

// =========================
// GET ALL ROUTINES
// =========================
router.get("/all", protect, getAllMyRoutines);

// =========================
// GET CURRENT STREAK
// =========================
router.get("/streak", protect, getCurrentStreak);

// =========================
// GET ANALYTICS
// =========================
router.get("/analytics", protect, getAnalytics);

// =========================
// GET SINGLE ROUTINE
// =========================
router.get("/:routineId", protect, getRoutineById);

// =========================
// ADD TASK TO ROUTINE
// =========================
router.post("/:routineId/tasks", protect, addTask);

// =========================
// DELETE TASK
// =========================
router.delete(
  "/:routineId/tasks/:taskId",
  protect,
  deleteTask
);

// =========================
// DELETE ENTIRE ROUTINE
// =========================
router.delete("/:routineId", protect, deleteRoutine);

// =========================
// TOGGLE TASK COMPLETION
// =========================
router.patch(
  "/:routineId/tasks/:taskId/toggle",
  protect,
  toggleTaskCompletion
);

// =========================
// UPDATE ENTIRE ROUTINE
// =========================
router.put("/:routineId", protect, updateRoutine);

module.exports = router;