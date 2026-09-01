import { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL } from "../config/api";
import "./History.css";

function History() {
  // =========================
  // DATE HELPERS
  // =========================
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayString = getLocalDateString(new Date());

  const getYesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  };

  const [selectedDate, setSelectedDate] = useState(todayString);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [dayRoutines, setDayRoutines] = useState([]);
  const [allRoutines, setAllRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH ALL ROUTINES (FOR CALENDAR DOTS)
  // =========================
  const fetchAllRoutines = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/routines/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setAllRoutines(data.routines || []);
      }
    } catch (error) {
      console.error("Error loading all routines:", error);
    }
  };

  // =========================
  // FETCH DAY ROUTINES
  // =========================
  const fetchHistoryForDate = async (date) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/routines?date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        console.error(data.message || "Failed to load history");
        setDayRoutines([]);
        return;
      }

      setDayRoutines(data.routines || []);
    } catch (error) {
      console.error("Error loading history:", error);
      setDayRoutines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRoutines();
  }, []);

  useEffect(() => {
    fetchHistoryForDate(selectedDate);
  }, [selectedDate]);

  // =========================
  // CALENDAR COMPUTATIONS
  // =========================
  const isRoutineScheduledForDate = (routine, dateString) => {
    const date = new Date(`${dateString}T00:00:00`);
    if (routine.frequency === "daily") return true;

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

    if (routine.frequency === "monthly") {
      const dayOfMonth = date.getDate();
      return (routine.monthDates || []).includes(dayOfMonth);
    }

    if (routine.frequency === "specific") {
      return (routine.specificDates || []).includes(dateString);
    }

    return false;
  };

  // Map of dateString -> { total, completed, status: 'none' | 'partial' | 'complete' }
  const calendarDayStatusMap = useMemo(() => {
    const map = {};
    if (!allRoutines.length) return map;

    // Generate dates for current month view
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      let totalTasks = 0;
      let completedTasks = 0;

      allRoutines.forEach((routine) => {
        const createdDate = getLocalDateString(new Date(routine.createdAt));
        if (createdDate > dateStr) return;
        if (!isRoutineScheduledForDate(routine, dateStr)) return;

        routine.tasks.forEach((task) => {
          totalTasks++;
          if ((task.completedDates || []).includes(dateStr)) {
            completedTasks++;
          }
        });
      });

      if (totalTasks === 0) {
        map[dateStr] = { total: 0, completed: 0, status: "none" };
      } else if (completedTasks === totalTasks) {
        map[dateStr] = { total: totalTasks, completed: completedTasks, status: "complete" };
      } else if (completedTasks > 0) {
        map[dateStr] = { total: totalTasks, completed: completedTasks, status: "partial" };
      } else {
        map[dateStr] = { total: totalTasks, completed: 0, status: "missed" };
      }
    }

    return map;
  }, [allRoutines, currentMonthDate]);

  // =========================
  // DATE NAVIGATION
  // =========================
  const changeDateByDays = (days) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    const newDateStr = getLocalDateString(d);

    if (newDateStr > todayString) return;

    setSelectedDate(newDateStr);
    setCurrentMonthDate(d);
  };

  const changeMonth = (months) => {
    const newMonth = new Date(currentMonthDate);
    newMonth.setMonth(newMonth.getMonth() + months);
    setCurrentMonthDate(newMonth);
  };

  const goToToday = () => {
    setSelectedDate(todayString);
    setCurrentMonthDate(new Date());
  };

  const goToYesterday = () => {
    const y = getYesterdayDate();
    setSelectedDate(y);
    setCurrentMonthDate(new Date(`${y}T00:00:00`));
  };

  // =========================
  // CALCULATE STATISTICS FOR SELECTED DAY
  // =========================
  const totalTasks = dayRoutines.reduce((total, routine) => {
    return total + (routine.tasks?.length || 0);
  }, 0);

  const completedTasks = dayRoutines.reduce((total, routine) => {
    return (
      total + (routine.tasks || []).filter((task) => task.completed).length
    );
  }, 0);

  const completionPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Result Card Message
  let resultClass = "history-result-empty";
  let resultIcon = "📅";
  let resultTitle = "No routines scheduled";
  let resultMessage = "There were no routines scheduled for this date.";

  if (totalTasks > 0) {
    if (completionPercentage === 100) {
      resultClass = "history-result-excellent";
      resultIcon = "🎉";
      resultTitle = "Perfect Day!";
      resultMessage =
        "Outstanding! Every task scheduled for this day was completed.";
    } else if (completionPercentage >= 50) {
      resultClass = "history-result-good";
      resultIcon = "💪";
      resultTitle = "Good Progress!";
      resultMessage = `You completed ${completedTasks} of ${totalTasks} tasks on this day.`;
    } else {
      resultClass = "history-result-low";
      resultIcon = "🔥";
      resultTitle = "Incomplete Day";
      resultMessage = `Completed ${completedTasks} of ${totalTasks} tasks. Every effort counts toward your long-term habits.`;
    }
  }

  // Progress Bar Class
  let progressClass = "progress-low";
  if (completionPercentage === 100) {
    progressClass = "progress-complete";
  } else if (completionPercentage >= 50) {
    progressClass = "progress-medium";
  }

  const formattedDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const isToday = selectedDate === todayString;
  const isYesterday = selectedDate === getYesterdayDate();

  // =========================
  // CALENDAR GRID BUILDER
  // =========================
  const calendarGrid = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, dateStr: null });
    }

    // Month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      const statusInfo = calendarDayStatusMap[dateStr] || { status: "none" };

      cells.push({
        day,
        dateStr,
        status: statusInfo.status,
        isFuture: dateStr > todayString,
        isSelected: dateStr === selectedDate,
        isCurrentDay: dateStr === todayString,
      });
    }

    return cells;
  }, [currentMonthDate, calendarDayStatusMap, selectedDate, todayString]);

  const monthName = currentMonthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="history-page">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="history-main">
        {/* HEADER */}
        <div className="history-header">
          <h1>📅 Completion History & Calendar</h1>
          <p>
            Browse your past routine records, review completed tasks, and track consistency.
          </p>
        </div>

        {/* TOP SECTION: CALENDAR TRACKER & DATE CONTROLS */}
        <div className="history-top-grid">
          {/* MONTH CALENDAR CARD */}
          <section className="history-card calendar-tracker-card">
            <div className="calendar-header">
              <h3>{monthName}</h3>
              <div className="calendar-nav-buttons">
                <button
                  type="button"
                  className="cal-nav-btn"
                  onClick={() => changeMonth(-1)}
                  title="Previous Month"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="cal-nav-btn today-cal-btn"
                  onClick={goToToday}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="cal-nav-btn"
                  onClick={() => changeMonth(1)}
                  title="Next Month"
                >
                  →
                </button>
              </div>
            </div>

            {/* WEEKDAY HEADERS */}
            <div className="calendar-weekdays">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* CALENDAR DAYS GRID */}
            <div className="calendar-grid">
              {calendarGrid.map((cell, idx) => {
                if (!cell.day) {
                  return <div className="calendar-cell empty" key={`empty-${idx}`} />;
                }

                return (
                  <button
                    type="button"
                    key={cell.dateStr}
                    disabled={cell.isFuture}
                    className={`calendar-cell ${
                      cell.isSelected ? "selected" : ""
                    } ${cell.isCurrentDay ? "today" : ""} ${
                      cell.isFuture ? "future" : ""
                    }`}
                    onClick={() => setSelectedDate(cell.dateStr)}
                  >
                    <span className="cal-day-number">{cell.day}</span>
                    {cell.status !== "none" && !cell.isFuture && (
                      <span className={`cal-dot dot-${cell.status}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* CALENDAR LEGEND */}
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="cal-dot dot-complete" />
                <span>100% Completed</span>
              </div>
              <div className="legend-item">
                <span className="cal-dot dot-partial" />
                <span>Partial</span>
              </div>
              <div className="legend-item">
                <span className="cal-dot dot-missed" />
                <span>Missed</span>
              </div>
            </div>
          </section>

          {/* DATE PICKER & QUICK NAV CARD */}
          <section className="history-card date-quick-card">
            <div className="date-card-title">
              <h3>Selected Date</h3>
              <p className="selected-date-text">{formattedDate}</p>
            </div>

            <div className="date-input-wrapper">
              <label>Jump to Date:</label>
              <input
                className="date-input-field"
                type="date"
                value={selectedDate}
                max={todayString}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setCurrentMonthDate(new Date(`${e.target.value}T00:00:00`));
                  }
                }}
              />
            </div>

            {/* QUICK BUTTONS */}
            <div className="date-quick-actions">
              <button
                type="button"
                className="date-nav-btn"
                onClick={() => changeDateByDays(-1)}
              >
                ← Previous Day
              </button>

              <button
                type="button"
                className={`quick-pill-btn ${isYesterday ? "active" : ""}`}
                onClick={goToYesterday}
              >
                Yesterday
              </button>

              <button
                type="button"
                className={`quick-pill-btn ${isToday ? "active" : ""}`}
                onClick={goToToday}
              >
                Today
              </button>

              <button
                type="button"
                className="date-nav-btn"
                onClick={() => changeDateByDays(1)}
                disabled={isToday}
              >
                Next Day →
              </button>
            </div>

            {/* DAY STATS SUMMARY */}
            <div className="day-stats-pill-grid">
              <div className="day-stat-box">
                <span>Total Tasks</span>
                <strong>{totalTasks}</strong>
              </div>
              <div className="day-stat-box">
                <span>Completed</span>
                <strong>{completedTasks}</strong>
              </div>
              <div className="day-stat-box">
                <span>Completion</span>
                <strong>{completionPercentage}%</strong>
              </div>
            </div>
          </section>
        </div>

        {/* STATUS RESULT MESSAGE BANNER */}
        <section className={`history-result-card ${resultClass}`}>
          <div className="history-result-icon">{resultIcon}</div>
          <div>
            <h3>{resultTitle}</h3>
            <p>{resultMessage}</p>
          </div>
        </section>

        {/* DAILY PROGRESS BAR */}
        {totalTasks > 0 && (
          <section className="history-card progress-summary-card">
            <div className="progress-summary-header">
              <span>Day Completion Rate</span>
              <strong>
                {completedTasks} / {totalTasks} Tasks ({completionPercentage}%)
              </strong>
            </div>

            <div className="progress-bar-track">
              <div
                className={`progress-bar-fill ${progressClass}`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </section>
        )}

        {/* ROUTINES & TASK BREAKDOWN */}
        <section className="history-routines-section">
          <div className="section-title-row">
            <h2>Routines on {formattedDate}</h2>
          </div>

          {loading ? (
            <div className="history-loading-card">
              <p>Loading history records...</p>
            </div>
          ) : dayRoutines.length === 0 ? (
            <div className="history-empty-card">
              <div className="empty-emoji">📅</div>
              <h3>No routines scheduled</h3>
              <p>You did not have any routines scheduled for this date.</p>
            </div>
          ) : (
            <div className="history-routine-grid">
              {dayRoutines.map((routine) => (
                <div className="history-routine-item-card" key={routine._id}>
                  <div className="history-item-header">
                    <div>
                      <h3>{routine.title}</h3>
                      {routine.description && <p>{routine.description}</p>}
                    </div>
                    <span className="history-freq-pill">
                      🔄 {routine.frequency}
                    </span>
                  </div>

                  {/* TASKS LIST */}
                  <div className="history-tasks-list">
                    {(routine.tasks || []).map((task) => (
                      <div
                        className={`history-task-row ${
                          task.completed ? "task-done" : "task-missed"
                        }`}
                        key={task._id}
                      >
                        <span className="task-status-icon">
                          {task.completed ? "✓" : "○"}
                        </span>
                        <span className="task-title-text">{task.title}</span>
                        <span className="task-badge">
                          {task.completed ? "Completed" : "Missed"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default History;