const Routine = require("../models/Routine");

// =========================
// GET LOCAL DATE STRING
// =========================
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =========================
// GET COMPLETION KEY
// =========================
const getCompletionKey = (dateString) => {
  return dateString;
};

// =========================
// CHECK IF ROUTINE IS
// SCHEDULED FOR A DATE
// =========================
const isRoutineScheduledForDate = (routine, dateString) => {
  const date = new Date(`${dateString}T00:00:00`);

  // DAILY
  if (routine.frequency === "daily") {
    return true;
  }

  // WEEKLY
  if (routine.frequency === "weekly") {
    const weekdays = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const dayName = weekdays[date.getDay()];

    return (routine.weekdays || []).includes(dayName);
  }

  // MONTHLY
  if (routine.frequency === "monthly") {
    const dayOfMonth = date.getDate();

    return (routine.monthDates || []).includes(dayOfMonth);
  }

  // SPECIFIC DATE
  if (routine.frequency === "specific") {
    return (routine.specificDates || []).includes(dateString);
  }

  return false;
};

// =========================
// CREATE ROUTINE
// =========================
const createRoutine = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      frequency,
      tasks,
      weekdays,
      monthDates,
      specificDates,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Routine title is required",
      });
    }

    const routine = await Routine.create({
      user: req.user._id,

      title: title.trim(),
      description: description || "",
      category: category || "lifestyle",

      frequency: frequency || "daily",

      weekdays: Array.isArray(weekdays)
        ? weekdays
        : [],

      monthDates: Array.isArray(monthDates)
        ? monthDates
        : [],

      specificDates: Array.isArray(specificDates)
        ? specificDates
        : [],

      tasks: Array.isArray(tasks)
        ? tasks.filter(
            (task) => task.title && task.title.trim()
          )
        : [],
    });

    res.status(201).json({
      message: "Routine created successfully",
      routine,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// GET MY ROUTINES
// ONLY ROUTINES ACTIVE
// ON SELECTED DATE
// =========================
const getMyRoutines = async (req, res) => {
  try {
    const { date } = req.query;

    const selectedDate =
      date || getLocalDateString();

    // Get all routines
    const allRoutines = await Routine.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    // Only routines scheduled for selected date
    const scheduledRoutines = allRoutines.filter(
      (routine) =>
        isRoutineScheduledForDate(
          routine,
          selectedDate
        )
    );

    // Format routines
    const formattedRoutines =
      scheduledRoutines.map((routine) => ({
        _id: routine._id,
        title: routine.title,
        description: routine.description,
        frequency: routine.frequency,
        weekdays: routine.weekdays || [],
        monthDates: routine.monthDates || [],
        specificDates:
          routine.specificDates || [],
        createdAt: routine.createdAt,

        tasks: routine.tasks.map((task) => ({
          _id: task._id,
          title: task.title,

          completedDates:
            task.completedDates || [],

          completed:
            (task.completedDates || []).includes(
              selectedDate
            ),
        })),
      }));

    // =========================
    // CALCULATE CURRENT STREAK
    // =========================

    const allTasks = allRoutines.flatMap(
      (routine) =>
        routine.tasks.map((task) => ({
          ...task.toObject(),
          routine,
          routineCreatedAt: routine.createdAt,
        }))
    );

    const isDayFullyCompleted = (
      dateString
    ) => {
      const tasksForThatDay =
        allTasks.filter((task) => {
          const createdDate =
            getLocalDateString(
              new Date(task.routineCreatedAt)
            );

          // Routine did not exist yet
          if (createdDate > dateString) {
            return false;
          }

          // Only count routines scheduled
          // for this particular date
          return isRoutineScheduledForDate(
            task.routine,
            dateString
          );
        });

      // No scheduled tasks
      if (tasksForThatDay.length === 0) {
        return false;
      }

      // Every scheduled task
      // must be completed
      return tasksForThatDay.every((task) =>
        (task.completedDates || []).includes(
          dateString
        )
      );
    };

    let currentStreak = 0;

    const today = new Date();
    const todayString =
      getLocalDateString(today);

    let startDate = new Date(today);

    // If today isn't complete,
    // start checking yesterday
    if (!isDayFullyCompleted(todayString)) {
      startDate.setDate(
        startDate.getDate() - 1
      );
    }

    while (true) {
      const dateString =
        getLocalDateString(startDate);

      if (isDayFullyCompleted(dateString)) {
        currentStreak++;
      } else {
        break;
      }

      startDate.setDate(
        startDate.getDate() - 1
      );
    }

    res.status(200).json({
      date: selectedDate,
      count: formattedRoutines.length,
      currentStreak,
      routines: formattedRoutines,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// TOGGLE TASK COMPLETION
// =========================
const toggleTaskCompletion = async (
  req,
  res
) => {
  try {
    const { routineId, taskId } =
      req.params;

    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    const routine = await Routine.findOne({
      _id: routineId,
      user: req.user._id,
    });

    if (!routine) {
      return res.status(404).json({
        message: "Routine not found",
      });
    }

    // Prevent completion on dates
    // where routine isn't scheduled
    if (
      !isRoutineScheduledForDate(
        routine,
        date
      )
    ) {
      return res.status(400).json({
        message:
          "This routine is not scheduled for this date",
      });
    }

    const task = routine.tasks.id(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const completionKey =
      getCompletionKey(date);

    const dateIndex =
      task.completedDates.indexOf(
        completionKey
      );

    if (dateIndex === -1) {
      // Complete task
      task.completedDates.push(
        completionKey
      );
    } else {
      // Uncomplete task
      task.completedDates.splice(
        dateIndex,
        1
      );
    }

    await routine.save();

    res.status(200).json({
      message:
        "Task completion updated successfully",

      completed:
        task.completedDates.includes(
          completionKey
        ),

      task,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// ADD TASK
// =========================
const addTask = async (req, res) => {
  try {
    const { routineId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    const routine = await Routine.findOne({
      _id: routineId,
      user: req.user._id,
    });

    if (!routine) {
      return res.status(404).json({
        message: "Routine not found",
      });
    }

    routine.tasks.push({
      title: title.trim(),
      completedDates: [],
    });

    await routine.save();

    const newTask =
      routine.tasks[
        routine.tasks.length - 1
      ];

    res.status(201).json({
      message: "Task added successfully",
      task: newTask,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// DELETE TASK
// =========================
const deleteTask = async (req, res) => {
  try {
    const { routineId, taskId } =
      req.params;

    const routine = await Routine.findOne({
      _id: routineId,
      user: req.user._id,
    });

    if (!routine) {
      return res.status(404).json({
        message: "Routine not found",
      });
    }

    const task = routine.tasks.id(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.deleteOne();

    await routine.save();

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// DELETE ROUTINE
// =========================
const deleteRoutine = async (req, res) => {
  try {
    const { routineId } = req.params;

    const routine =
      await Routine.findOneAndDelete({
        _id: routineId,
        user: req.user._id,
      });

    if (!routine) {
      return res.status(404).json({
        message: "Routine not found",
      });
    }

    res.status(200).json({
      message: "Routine deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// UPDATE ROUTINE
// =========================
const updateRoutine = async (req, res) => {
  try {
    const { routineId } = req.params;

    const {
      title,
      description,
      category,
      frequency,
      weekdays,
      monthDates,
      specificDates,
      tasks,
    } = req.body;

    const routine = await Routine.findOne({
      _id: routineId,
      user: req.user._id,
    });

    if (!routine) {
      return res.status(404).json({
        message: "Routine not found",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Routine title is required",
      });
    }

    // Basic information
    routine.title = title.trim();
    routine.description =
      description || "";

    if (category) {
      routine.category = category;
    }

    routine.frequency =
      frequency || routine.frequency;

    // Schedule
    routine.weekdays =
      Array.isArray(weekdays)
        ? weekdays
        : [];

    routine.monthDates =
      Array.isArray(monthDates)
        ? monthDates
        : [];

    routine.specificDates =
      Array.isArray(specificDates)
        ? specificDates
        : [];

    // Preserve task IDs
    // and completion history
    if (Array.isArray(tasks)) {
      routine.tasks = tasks
        .filter(
          (task) =>
            task.title &&
            task.title.trim()
        )
        .map((task) => ({
          ...(task._id && {
            _id: task._id,
          }),

          title: task.title.trim(),

          completedDates:
            task.completedDates || [],
        }));
    }

    await routine.save();

    res.status(200).json({
      message:
        "Routine updated successfully",
      routine,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// GET ALL MY ROUTINES
// =========================
const getAllMyRoutines = async (
  req,
  res
) => {
  try {
    const routines = await Routine.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      count: routines.length,
      routines,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// GET CURRENT STREAK
// =========================
const getCurrentStreak = async (
  req,
  res
) => {
  try {
    const routines = await Routine.find({
      user: req.user._id,
    });

    // Keep routine information
    // with every task
    const allTasks = routines.flatMap(
      (routine) =>
        routine.tasks.map((task) => ({
          ...task.toObject(),
          routine,
          routineCreatedAt:
            routine.createdAt,
        }))
    );

    // Check if all scheduled tasks
    // were completed on a date
    const isDayFullyCompleted = (
      dateString
    ) => {
      const tasksForThatDay =
        allTasks.filter((task) => {
          const createdDate =
            getLocalDateString(
              new Date(
                task.routineCreatedAt
              )
            );

          // Routine didn't exist yet
          if (createdDate > dateString) {
            return false;
          }

          // Only consider routines
          // scheduled for this date
          return isRoutineScheduledForDate(
            task.routine,
            dateString
          );
        });

      if (tasksForThatDay.length === 0) {
        return false;
      }

      return tasksForThatDay.every(
        (task) =>
          (
            task.completedDates || []
          ).includes(dateString)
      );
    };

    let currentStreak = 0;

    const today = new Date();
    const todayString =
      getLocalDateString(today);

    let startDate = new Date(today);

    // If today isn't fully completed,
    // begin checking from yesterday
    if (!isDayFullyCompleted(todayString)) {
      startDate.setDate(
        startDate.getDate() - 1
      );
    }

    while (true) {
      const dateString =
        getLocalDateString(startDate);

      if (
        isDayFullyCompleted(dateString)
      ) {
        currentStreak++;
      } else {
        break;
      }

      startDate.setDate(
        startDate.getDate() - 1
      );
    }

    res.status(200).json({
      currentStreak,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// GET ROUTINE BY ID
// =========================
const getRoutineById = async (req, res) => {
  try {
    const { routineId } = req.params;

    const routine = await Routine.findOne({
      _id: routineId,
      user: req.user._id,
    });

    if (!routine) {
      return res.status(404).json({
        message: "Routine not found",
      });
    }

    res.status(200).json({
      routine,
    });
  } catch (error) {
    console.error("Get routine error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================
// GET ANALYTICS
// =========================
const getAnalytics = async (req, res) => {
  try {
    const routines = await Routine.find({
      user: req.user._id,
    });

    const today = new Date();
    const todayString = getLocalDateString(today);

    // =========================
    // TODAY'S ANALYTICS
    // =========================
    const todayTasks = routines.flatMap((routine) => {
      if (!isRoutineScheduledForDate(routine, todayString)) {
        return [];
      }

      const createdDate = getLocalDateString(
        new Date(routine.createdAt)
      );

      if (createdDate > todayString) {
        return [];
      }

      return routine.tasks;
    });

    const todayTotal = todayTasks.length;

    const todayCompleted = todayTasks.filter((task) =>
      (task.completedDates || []).includes(todayString)
    ).length;

    const todayCompletion =
      todayTotal === 0
        ? 0
        : Math.round((todayCompleted / todayTotal) * 100);

    // =========================
    // TOTAL COMPLETED TASKS
    // =========================
    const totalCompletedTasks = routines.reduce(
      (total, routine) => {
        return (
          total +
          routine.tasks.reduce((taskTotal, task) => {
            return (
              taskTotal +
              (task.completedDates || []).length
            );
          }, 0)
        );
      },
      0
    );

    // =========================
    // HELPER FOR DATE RANGE
    // =========================
    const computeDataForDays = (daysCount) => {
      const resultData = [];

      for (let i = daysCount - 1; i >= 0; i--) {
        const currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() - i);

        const dateString = getLocalDateString(currentDate);

        let total = 0;
        let completed = 0;

        routines.forEach((routine) => {
          const createdDate = getLocalDateString(
            new Date(routine.createdAt)
          );

          if (createdDate > dateString) {
            return;
          }

          if (!isRoutineScheduledForDate(routine, dateString)) {
            return;
          }

          routine.tasks.forEach((task) => {
            total++;

            if ((task.completedDates || []).includes(dateString)) {
              completed++;
            }
          });
        });

        resultData.push({
          date: dateString,
          completed,
          total,
          percentage:
            total === 0
              ? 0
              : Math.round((completed / total) * 100),
        });
      }

      return resultData;
    };

    // Last 7 days (Weekly)
    const weeklyData = computeDataForDays(7);

    // Last 30 days (Monthly)
    const monthlyData = computeDataForDays(30);

    // =========================
    // DAY OF WEEK STATS
    // =========================
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    const dayCompleted = [0, 0, 0, 0, 0, 0, 0];

    monthlyData.forEach((dayItem) => {
      const d = new Date(`${dayItem.date}T00:00:00`);
      const dayIdx = d.getDay();
      dayTotals[dayIdx] += dayItem.total;
      dayCompleted[dayIdx] += dayItem.completed;
    });

    const dayOfWeekStats = dayNames.map((name, idx) => {
      const tot = dayTotals[idx];
      const comp = dayCompleted[idx];
      return {
        day: name,
        total: tot,
        completed: comp,
        percentage: tot === 0 ? 0 : Math.round((comp / tot) * 100),
      };
    });

    // =========================
    // ROUTINE PERFORMANCE STATS
    // =========================
    const routineStats = routines.map((routine) => {
      let routineScheduledDays = 0;
      let routineTotalTasks = 0;
      let routineCompletedTasks = 0;

      monthlyData.forEach((dayItem) => {
        const createdDate = getLocalDateString(new Date(routine.createdAt));
        if (createdDate > dayItem.date) return;
        if (!isRoutineScheduledForDate(routine, dayItem.date)) return;

        routineScheduledDays++;
        routine.tasks.forEach((task) => {
          routineTotalTasks++;
          if ((task.completedDates || []).includes(dayItem.date)) {
            routineCompletedTasks++;
          }
        });
      });

      const completionRate =
        routineTotalTasks === 0
          ? 0
          : Math.round((routineCompletedTasks / routineTotalTasks) * 100);

      return {
        _id: routine._id,
        title: routine.title,
        frequency: routine.frequency,
        tasksCount: routine.tasks.length,
        scheduledDaysCount: routineScheduledDays,
        totalTaskInstances: routineTotalTasks,
        completedTaskInstances: routineCompletedTasks,
        completionRate,
      };
    });

    // =========================
    // CURRENT STREAK
    // =========================
    const allTasks = routines.flatMap((routine) =>
      routine.tasks.map((task) => ({
        ...task.toObject(),
        routine,
        routineCreatedAt: routine.createdAt,
      }))
    );

    const isDayFullyCompleted = (dateString) => {
      const tasksForThatDay = allTasks.filter((task) => {
        const createdDate = getLocalDateString(
          new Date(task.routineCreatedAt)
        );

        if (createdDate > dateString) return false;
        return isRoutineScheduledForDate(task.routine, dateString);
      });

      if (tasksForThatDay.length === 0) return false;

      return tasksForThatDay.every((task) =>
        (task.completedDates || []).includes(dateString)
      );
    };

    let currentStreak = 0;
    let streakStartDate = new Date(today);

    if (!isDayFullyCompleted(todayString)) {
      streakStartDate.setDate(streakStartDate.getDate() - 1);
    }

    while (true) {
      const dateString = getLocalDateString(streakStartDate);
      if (isDayFullyCompleted(dateString)) {
        currentStreak++;
      } else {
        break;
      }
      streakStartDate.setDate(streakStartDate.getDate() - 1);
    }

    // =========================
    // RESPONSE
    // =========================
    res.status(200).json({
      today: {
        completed: todayCompleted,
        total: todayTotal,
        percentage: todayCompletion,
      },
      currentStreak,
      totalCompletedTasks,
      totalRoutines: routines.length,
      weeklyData,
      monthlyData,
      dayOfWeekStats,
      routineStats,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      message: "Failed to load analytics",
    });
  }
};

// =========================
// EXPORTS
// =========================
module.exports = {
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
};