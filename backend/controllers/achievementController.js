const Routine = require("../models/Routine");

// =========================
// HELPER: LOCAL DATE
// =========================

const getLocalDateString = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =========================
// CHECK IF ROUTINE IS
// SCHEDULED FOR A DATE
// =========================

const isRoutineScheduledForDate = (
  routine,
  dateString
) => {
  const date = new Date(`${dateString}T00:00:00`);

  const weekday = date
    .toLocaleDateString("en-US", {
      weekday: "long",
    })
    .toLowerCase();

  const dayOfMonth = date.getDate();

  switch (routine.frequency) {
    case "daily":
      return true;

    case "weekly":
      return (
        routine.weekdays || []
      ).includes(weekday);

    case "monthly":
      return (
        routine.monthDates || []
      ).includes(dayOfMonth);

    case "specific":
      return (
        routine.specificDates || []
      ).includes(dateString);

    default:
      return false;
  }
};

// =========================
// CALCULATE CURRENT STREAK
// =========================

const calculateCurrentStreak = (routines) => {
  let streak = 0;

  const today = new Date();

  // Check today first
  for (let i = 0; i < 3650; i++) {
    const currentDate = new Date(today);

    currentDate.setDate(
      currentDate.getDate() - i
    );

    const dateString =
      getLocalDateString(currentDate);

    let totalTasks = 0;
    let completedTasks = 0;

    routines.forEach((routine) => {
      const createdDate = getLocalDateString(
        new Date(routine.createdAt)
      );

      // Routine didn't exist yet
      if (createdDate > dateString) {
        return;
      }

      // Not scheduled on this date
      if (
        !isRoutineScheduledForDate(
          routine,
          dateString
        )
      ) {
        return;
      }

      routine.tasks.forEach((task) => {
        totalTasks++;

        if (
          (task.completedDates || []).includes(
            dateString
          )
        ) {
          completedTasks++;
        }
      });
    });

    // No routines scheduled
    if (totalTasks === 0) {
      if (i === 0) {
        continue;
      }

      continue;
    }

    // Perfect day
    if (completedTasks === totalTasks) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

// =========================
// GET USER ACHIEVEMENTS
// =========================

const getAchievements = async (req, res) => {
  try {
    const routines = await Routine.find({
      user: req.user._id,
    });

    // =========================
    // TOTAL COMPLETED TASKS
    // =========================

    let totalCompletedTasks = 0;

    routines.forEach((routine) => {
      routine.tasks.forEach((task) => {
        totalCompletedTasks += (
          task.completedDates || []
        ).length;
      });
    });

    // =========================
    // CHECK PERFECT DAY
    // =========================

    let hasPerfectDay = false;

    const today = new Date();

    for (let i = 0; i < 3650; i++) {
      const currentDate = new Date(today);

      currentDate.setDate(
        currentDate.getDate() - i
      );

      const dateString =
        getLocalDateString(currentDate);

      let totalTasks = 0;
      let completedTasks = 0;

      routines.forEach((routine) => {
        const createdDate = getLocalDateString(
          new Date(routine.createdAt)
        );

        if (createdDate > dateString) {
          return;
        }

        if (
          !isRoutineScheduledForDate(
            routine,
            dateString
          )
        ) {
          return;
        }

        routine.tasks.forEach((task) => {
          totalTasks++;

          if (
            (task.completedDates || []).includes(
              dateString
            )
          ) {
            completedTasks++;
          }
        });
      });

      if (
        totalTasks > 0 &&
        completedTasks === totalTasks
      ) {
        hasPerfectDay = true;
        break;
      }
    }

    // =========================
    // CURRENT STREAK
    // =========================

    const currentStreak =
      calculateCurrentStreak(routines);

    // =========================
    // ACHIEVEMENTS
    // =========================

    const achievements = [
      {
        id: "first-step",
        title: "First Step",
        description:
          "Complete your first task.",
        icon: "⭐",
        unlocked: totalCompletedTasks >= 1,
        progress: Math.min(
          totalCompletedTasks,
          1
        ),
        target: 1,
      },

      {
        id: "perfect-day",
        title: "Perfect Day",
        description:
          "Complete all scheduled tasks in a single day.",
        icon: "💯",
        unlocked: hasPerfectDay,
        progress: hasPerfectDay ? 1 : 0,
        target: 1,
      },

      {
        id: "7-day-streak",
        title: "7 Day Streak",
        description:
          "Maintain a streak for 7 consecutive perfect days.",
        icon: "🔥",
        unlocked: currentStreak >= 7,
        progress: Math.min(currentStreak, 7),
        target: 7,
      },

      {
        id: "30-day-streak",
        title: "Consistency Master",
        description:
          "Maintain a streak for 30 consecutive perfect days.",
        icon: "🏆",
        unlocked: currentStreak >= 30,
        progress: Math.min(currentStreak, 30),
        target: 30,
      },

      {
        id: "task-crusher",
        title: "Task Crusher",
        description:
          "Complete 100 tasks.",
        icon: "🎯",
        unlocked: totalCompletedTasks >= 100,
        progress: Math.min(
          totalCompletedTasks,
          100
        ),
        target: 100,
      },
    ];

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      achievements,

      stats: {
        totalCompletedTasks,
        currentStreak,
        hasPerfectDay,
      },
    });
  } catch (error) {
    console.error(
      "Achievement error:",
      error
    );

    res.status(500).json({
      message: "Failed to load achievements",
    });
  }
};

module.exports = {
  getAchievements,
};