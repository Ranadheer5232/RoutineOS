import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Sidebar from "../components/Sidebar";
import { triggerFullCelebration } from "../utils/confetti";
import { ROUTINE_CATEGORIES, getCategoryMeta } from "../utils/categoryMeta";
import { API_BASE_URL } from "../config/api";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [routines, setRoutines] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return (
      "Notification" in window &&
      Notification.permission === "granted" &&
      localStorage.getItem("routineOS_notifications") === "true"
    );
  });
  const [notificationMsg, setNotificationMsg] = useState("");

  const [analytics, setAnalytics] = useState({
    today: {
      completed: 0,
      total: 0,
      percentage: 0,
    },
    totalCompletedTasks: 0,
    totalRoutines: 0,
    weeklyData: [],
  });

  // =========================
  // NOTIFICATION HANDLERS
  // =========================
  const toggleNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Browser notifications are not supported in this browser.");
      return;
    }

    if (Notification.permission === "granted") {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      localStorage.setItem("routineOS_notifications", newState);
      if (newState) {
        new Notification("RoutineOS Reminders Active 🔔", {
          body: "You'll receive reminders for scheduled routine tasks.",
          icon: "/favicon.ico",
        });
      }
      return;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        localStorage.setItem("routineOS_notifications", "true");
        new Notification("RoutineOS Reminders Active 🔔", {
          body: "Notifications enabled! We'll help you keep your daily streak.",
          icon: "/favicon.ico",
        });
      }
    } else {
      alert(
        "Notifications are blocked in browser settings. Please allow notifications for this site."
      );
    }
  };

  const triggerManualReminder = () => {
    const remaining =
      (analytics.today?.total || 0) - (analytics.today?.completed || 0);

    if (remaining <= 0) {
      setNotificationMsg("🎉 All tasks for today are completed! Great job!");
      setTimeout(() => setNotificationMsg(""), 4000);
      return;
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("RoutineOS Due Task Reminder ⏰", {
        body: `You have ${remaining} routine task${
          remaining > 1 ? "s" : ""
        } remaining for today. Keep your streak alive!`,
        icon: "/favicon.ico",
      });
    }

    setNotificationMsg(
      `🔔 Reminder: You have ${remaining} task${
        remaining > 1 ? "s" : ""
      } remaining today!`
    );
    setTimeout(() => setNotificationMsg(""), 4000);
  };

  // =========================
  // FETCH ROUTINES
  // =========================

  const fetchRoutines = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/routines`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message || "Failed to fetch routines");
        return;
      }

      setRoutines(data.routines || []);
    } catch (error) {
      console.error("Error fetching routines:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH STREAK
  // =========================

  const fetchStreak = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/routines/streak`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message || "Failed to fetch streak");
        return;
      }

      setCurrentStreak(data.currentStreak || 0);
    } catch (error) {
      console.error("Error fetching streak:", error);
    }
  };

  // =========================
  // FETCH ANALYTICS
  // =========================

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/routines/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message || "Failed to fetch analytics");
        return;
      }

      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  // =========================
  // TOGGLE TASK
  // =========================

  const toggleTask = async (routineId, taskId) => {
    try {
      const token = localStorage.getItem("token");

      const now = new Date();

      const todayDate = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const response = await fetch(
        `${API_BASE_URL}/api/routines/${routineId}/tasks/${taskId}/toggle`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            date: todayDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update task");
        return;
      }

      setRoutines((previousRoutines) => {
        const updated = previousRoutines.map((routine) => {
          if (routine._id !== routineId) return routine;

          return {
            ...routine,

            tasks: routine.tasks.map((task) => {
              if (task._id !== taskId) return task;

              return {
                ...task,
                completed: !task.completed,
              };
            }),
          };
        });

        // Check if 100% completed
        const total = updated.reduce((sum, r) => sum + (r.tasks?.length || 0), 0);
        const completed = updated.reduce(
          (sum, r) => sum + (r.tasks || []).filter((t) => t.completed).length,
          0
        );

        if (total > 0 && completed === total) {
          triggerFullCelebration();
          setNotificationMsg("🎉 AMAZING! You completed 100% of your routines today! 🌟");
          setTimeout(() => setNotificationMsg(""), 5000);
        }

        return updated;
      });

      fetchStreak();
      fetchAnalytics();
    } catch (error) {
      console.error("Error updating task:", error);

      alert("Something went wrong while updating the task.");
    }
  };

  // =========================
  // DELETE ROUTINE
  // =========================

  const deleteRoutine = async (routineId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this entire routine? This action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/routines/${routineId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete routine");
        return;
      }

      alert("Routine deleted successfully 🗑️");

      fetchRoutines();
      fetchAnalytics();
      fetchStreak();
    } catch (error) {
      console.error("Error deleting routine:", error);

      alert("Something went wrong while deleting the routine.");
    }
  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    fetchRoutines();
    fetchStreak();
    fetchAnalytics();
  }, []);

  // =========================
  // DATE
  // =========================

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // =========================
  // ANALYTICS VALUES
  // =========================

  const completedTasks = analytics.today?.completed || 0;

  const totalTasks = analytics.today?.total || 0;

  const progressPercentage = analytics.today?.percentage || 0;

  // =========================
  // MOTIVATIONAL MESSAGE
  // =========================

  let motivationalMessage = "";

  if (totalTasks === 0) {
    motivationalMessage =
      "Start building better habits by creating your first routine!";
  } else if (progressPercentage === 0) {
    motivationalMessage =
      "Your journey starts now. Complete your first task! 💪";
  } else if (progressPercentage < 50) {
    motivationalMessage =
      "Great start! Keep going — consistency builds success. 🔥";
  } else if (progressPercentage < 100) {
    motivationalMessage =
      "You're doing amazing! You're more than halfway there! 🚀";
  } else {
    motivationalMessage =
      "Amazing! You've completed all your tasks for today! 🎉";
  }

  // =========================
  // WEEKLY BAR COLOR
  // =========================

  const getWeeklyBarColor = (percentage) => {
    if (percentage === 0) return "#d1d5db";

    if (percentage < 50) return "#f59e0b";

    if (percentage < 100) return "#2563eb";

    return "#16a34a";
  };

  return (
    <div className="dashboard">

      {/* ================= SIDEBAR ================= */}

      <Sidebar />

      {/* ================= MAIN ================= */}

      <main className="dashboard-main">

        {/* ================= HEADER ================= */}

        <header className="dashboard-header">

          <div>
            <p className="date-text">{today}</p>

            <h1>
              Good to see you, {user?.name || "User"} 👋
            </h1>

            <p className="welcome-text">
              {motivationalMessage}
            </p>
          </div>

          <div className="header-actions">
            <button
              className={`notification-toggle-btn ${
                notificationsEnabled ? "active" : ""
              }`}
              onClick={toggleNotifications}
              title="Toggle Browser Reminders"
            >
              {notificationsEnabled ? "🔔 Reminders On" : "🔕 Enable Reminders"}
            </button>

            <button
              className="add-routine-button"
              onClick={() => navigate("/add-routine")}
            >
              + Add Routine
            </button>
          </div>

        </header>

        {/* NOTIFICATION FEEDBACK TOAST */}
        {notificationMsg && (
          <div className="dashboard-toast-banner">
            {notificationMsg}
          </div>
        )}

        {/* SMART DUE-TASKS REMINDER BANNER */}
        {totalTasks > 0 && totalTasks > completedTasks && (
          <section className="reminder-alert-card">
            <div className="reminder-alert-left">
              <span className="reminder-bell-icon">🔔</span>
              <div>
                <h4>
                  {totalTasks - completedTasks} task
                  {totalTasks - completedTasks !== 1 ? "s" : ""} remaining today
                </h4>
                <p>Stay focused and keep your consistency streak going strong!</p>
              </div>
            </div>

            <button
              className="reminder-action-btn"
              onClick={triggerManualReminder}
            >
              ⏰ Remind Me
            </button>
          </section>
        )}

        {/* ================= STATISTICS ================= */}

        <section className="stats-container">

          <div className="stat-card">

            <span className="stat-icon">📋</span>

            <div>
              <p>Total Routines</p>

              <h2>{analytics.totalRoutines}</h2>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">📝</span>

            <div>
              <p>Today's Tasks</p>

              <h2>{totalTasks}</h2>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">✅</span>

            <div>
              <p>Completed Today</p>

              <h2>
                {completedTasks}/{totalTasks}
              </h2>
            </div>

          </div>

          <div className="stat-card">

            <span className="stat-icon">🔥</span>

            <div>
              <p>Current Streak</p>

              <h2>
                {currentStreak}{" "}
                {currentStreak === 1 ? "Day" : "Days"}
              </h2>
            </div>

          </div>

        </section>

        {/* ================= DAILY PROGRESS ================= */}

        {totalTasks > 0 && (

          <section className="daily-progress-card">

            <div className="daily-progress-header">

              <div>

                <h2>Today's Progress</h2>

                <p>{motivationalMessage}</p>

              </div>

              <div className="progress-percentage">
                {progressPercentage}%
              </div>

            </div>

            <div className="dashboard-progress-bar">

              <div
                className="dashboard-progress-fill"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />

            </div>

            <div className="progress-details">

              <span>
                {completedTasks} completed
              </span>

              <span>
                {totalTasks - completedTasks} remaining
              </span>

            </div>

          </section>

        )}

        {/* ================= WEEKLY ANALYTICS ================= */}

        <section className="weekly-analytics">

          <div className="weekly-analytics-header">

            <h2>📊 Weekly Progress</h2>

            <p>
              Your completion progress over the last 7 days.
            </p>

          </div>

          <div className="weekly-chart">

            {analytics.weeklyData?.map((day) => {

              const date = new Date(
                `${day.date}T00:00:00`
              );

              const dayName =
                date.toLocaleDateString("en-US", {
                  weekday: "short",
                });

              const barColor = getWeeklyBarColor(
                day.percentage
              );

              return (

                <div
                  className="weekly-day"
                  key={day.date}
                >

                  <div className="weekly-percentage">
                    {day.percentage}%
                  </div>

                  <div className="weekly-bar-container">

                    <div
                      className="weekly-bar"
                      style={{
                        height:
                          day.percentage === 0
                            ? "4px"
                            : `${day.percentage}%`,

                        backgroundColor: barColor,
                      }}
                    />

                  </div>

                  <div className="weekly-day-label">
                    {dayName}
                  </div>

                  <div className="weekly-task-count">
                    {day.completed}/{day.total}
                  </div>

                </div>

              );
            })}

          </div>

        </section>

        {/* ================= TODAY'S ROUTINES ================= */}

        <section className="routines-section">

          <div className="section-header">

            <div>

              <h2>Today's Routines</h2>

              <p>
                Stay consistent and complete your scheduled goals.
              </p>

            </div>

          </div>

          {/* CATEGORY FILTER PILLS */}
          <div className="dashboard-category-filters">
            <button
              type="button"
              className={`cat-filter-pill ${selectedCategory === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              🌟 All ({routines.length})
            </button>
            {ROUTINE_CATEGORIES.map((cat) => {
              const count = routines.filter((r) => (r.category || "lifestyle") === cat.id).length;
              if (count === 0 && selectedCategory !== cat.id) return null;
              return (
                <button
                  type="button"
                  key={cat.id}
                  className={`cat-filter-pill ${selectedCategory === cat.id ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.icon} {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* ================= LOADING ================= */}

          {loading ? (

            <div className="empty-routines">

              <p>Loading routines...</p>

            </div>

          ) : routines.length === 0 ? (

            /* ================= EMPTY ================= */

            <div className="empty-routines">

              <div className="empty-icon">
                📅
              </div>

              <h3>
                No routines scheduled today
              </h3>

              <p>
                You don't have any routines scheduled for today.
              </p>

              <button
                className="empty-add-button"
                onClick={() => navigate("/add-routine")}
              >
                + Create Routine
              </button>

            </div>

          ) : routines.filter((r) => selectedCategory === "all" || (r.category || "lifestyle") === selectedCategory).length === 0 ? (
            <div className="empty-routines">
              <div className="empty-icon">🔍</div>
              <h3>No routines in this category</h3>
              <p>You don't have any routines matching the selected category today.</p>
              <button
                className="empty-add-button"
                onClick={() => setSelectedCategory("all")}
              >
                Show All Routines
              </button>
            </div>
          ) : (

            /* ================= ROUTINES ================= */

            <div className="routine-list">

              {routines
                .filter((r) => selectedCategory === "all" || (r.category || "lifestyle") === selectedCategory)
                .map((routine) => {
                  const catMeta = getCategoryMeta(routine.category);
                  return (

                <div
                  className="routine-card"
                  key={routine._id}
                >

                  <div className="routine-card-header">

                    <div className="routine-title-box">
                      <h3>{routine.title}</h3>
                      <span className="routine-category-badge">
                        {catMeta.icon} {catMeta.name}
                      </span>
                    </div>

                    <div className="routine-actions">

                      <button
                        className="edit-routine-button"
                        onClick={() =>
                          navigate(
                            `/edit-routine/${routine._id}`
                          )
                        }
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="delete-routine-button"
                        onClick={() =>
                          deleteRoutine(routine._id)
                        }
                      >
                        🗑️ Delete
                      </button>

                    </div>

                  </div>

                  {routine.description && (

                    <p>
                      {routine.description}
                    </p>

                  )}

                  <div className="routine-frequency">
                    🔄 {routine.frequency}
                  </div>

                  {routine.tasks &&
                    routine.tasks.length > 0 && (

                      <div className="routine-tasks">

                        <h4>Tasks</h4>

                        {routine.tasks.map((task) => (

                          <div
                            className={`task-item ${
                              task.completed
                                ? "completed-task"
                                : ""
                            }`}
                            key={task._id}
                          >

                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() =>
                                toggleTask(
                                  routine._id,
                                  task._id
                                )
                              }
                            />

                            <span>
                              {task.title}
                            </span>

                          </div>

                        ))}

                      </div>

                    )}

                </div>
                  );
                })}

            </div>

          )}

        </section>

      </main>
    </div>
  );
}

export default Dashboard;