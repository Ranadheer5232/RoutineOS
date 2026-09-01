import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { exportRoutinesToCSV, exportRoutinesToJSON } from "../utils/exportData";
import { API_BASE_URL } from "../config/api";
import "./Analytics.css";

function Analytics() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [allRoutines, setAllRoutines] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("weekly"); // "weekly" | "monthly"
  const [exportToast, setExportToast] = useState("");

  // =========================
  // FETCH ANALYTICS
  // =========================
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [analyticsResponse, streakResponse, routinesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/routines/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/api/routines/streak`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/api/routines/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const analyticsData = await analyticsResponse.json();
      const streakData = await streakResponse.json();
      const routinesData = await routinesResponse.json();

      if (!analyticsResponse.ok) {
        console.error(analyticsData.message || "Failed to load analytics");
        return;
      }

      setAnalytics(analyticsData);
      setAllRoutines(routinesData.routines || []);

      if (streakResponse.ok) {
        setStreak(
          streakData.currentStreak !== undefined
            ? streakData.currentStreak
            : analyticsData.currentStreak || 0
        );
      } else if (analyticsData.currentStreak !== undefined) {
        setStreak(analyticsData.currentStreak);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // =========================
  // SAFE DATA ACCESS
  // =========================
  const today = analytics?.today || {
    completed: 0,
    total: 0,
    percentage: 0,
  };

  const weeklyData = analytics?.weeklyData || [];
  const monthlyData = analytics?.monthlyData || [];
  const activeChartData = timeframe === "weekly" ? weeklyData : monthlyData;

  const totalCompletedTasks = analytics?.totalCompletedTasks || 0;
  const totalRoutines = analytics?.totalRoutines || 0;
  const routineStats = analytics?.routineStats || [];
  const dayOfWeekStats = analytics?.dayOfWeekStats || [];

  // =========================
  // CALCULATIONS FOR ACTIVE TIMEFRAME
  // =========================
  const totalPeriodTasks = activeChartData.reduce(
    (total, day) => total + day.total,
    0
  );

  const totalPeriodCompleted = activeChartData.reduce(
    (total, day) => total + day.completed,
    0
  );

  const periodPercentage =
    totalPeriodTasks === 0
      ? 0
      : Math.round((totalPeriodCompleted / totalPeriodTasks) * 100);

  const daysWithTasks = activeChartData.filter((day) => day.total > 0);

  const bestDay =
    daysWithTasks.length > 0
      ? daysWithTasks.reduce((best, day) =>
          day.percentage > best.percentage ? day : best
        )
      : null;

  // Find best day of week
  const validDayOfWeekStats = dayOfWeekStats.filter((d) => d.total > 0);
  const bestDayOfWeek =
    validDayOfWeekStats.length > 0
      ? validDayOfWeekStats.reduce((best, d) =>
          d.percentage > best.percentage ? d : best
        )
      : null;

  // =========================
  // FORMAT HELPERS
  // =========================
  const formatDayName = (dateString) => {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
    });
  };

  const formatShortDate = (dateString) => {
    const d = new Date(`${dateString}T00:00:00`);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // =========================
  // DYNAMIC INSIGHTS
  // =========================
  let insightIcon = "🔥";
  let insightTitle = "Building Momentum!";
  let insightMessage = "Consistent daily routines lead to life-changing results.";

  if (periodPercentage >= 90 && totalPeriodTasks > 0) {
    insightIcon = "🏆";
    insightTitle = "Master of Consistency!";
    insightMessage = `Outstanding performance! You completed ${periodPercentage}% of your routines in the selected period.`;
  } else if (periodPercentage >= 70) {
    insightIcon = "🚀";
    insightTitle = "Great Consistency!";
    insightMessage = `You're on track with a solid ${periodPercentage}% completion rate. Keep the momentum going!`;
  } else if (periodPercentage >= 40) {
    insightIcon = "💪";
    insightTitle = "Making Steady Progress";
    insightMessage = `You've completed ${totalPeriodCompleted} tasks. Focusing on small daily wins will raise your completion rate.`;
  } else if (totalPeriodTasks === 0) {
    insightIcon = "📅";
    insightTitle = "Ready to Start!";
    insightMessage = "Create routines and complete tasks to unlock your detailed analytics.";
  }

  const getBarColor = (percentage) => {
    if (percentage === 100) return "#16a34a"; // green
    if (percentage >= 70) return "#2563eb"; // blue
    if (percentage >= 40) return "#f59e0b"; // yellow
    if (percentage > 0) return "#f97316"; // orange
    return "#e5e7eb"; // gray
  };

  return (
    <div className="analytics-page">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="analytics-main">
        {/* HEADER */}
        <div className="analytics-header">
          <div>
            <h1>📈 Analytics & Insights</h1>
            <p>Track your consistency, analyze trends, and view detailed progress.</p>
          </div>
        </div>

        {loading ? (
          <div className="analytics-loading">
            <p>Loading analytics and metrics...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW METRICS */}
            <section className="analytics-section">
              <div className="section-title">
                <h2>Performance Overview</h2>
                <p>High-level summary of your routine activity.</p>
              </div>

              <div className="analytics-stats">
                <div className="analytics-stat-card">
                  <span className="stat-card-emoji">🎯</span>
                  <div>
                    <p>Today's Progress</p>
                    <h2>
                      {today.percentage}% ({today.completed}/{today.total})
                    </h2>
                  </div>
                </div>

                <div className="analytics-stat-card">
                  <span className="stat-card-emoji">🔥</span>
                  <div>
                    <p>Current Streak</p>
                    <h2>{streak} {streak === 1 ? "Day" : "Days"}</h2>
                  </div>
                </div>

                <div className="analytics-stat-card">
                  <span className="stat-card-emoji">✅</span>
                  <div>
                    <p>Total Completed Tasks</p>
                    <h2>{totalCompletedTasks}</h2>
                  </div>
                </div>

                <div className="analytics-stat-card">
                  <span className="stat-card-emoji">📋</span>
                  <div>
                    <p>Active Routines</p>
                    <h2>{totalRoutines}</h2>
                  </div>
                </div>
              </div>
            </section>

            {/* PERFORMANCE INSIGHT */}
            <section className="analytics-insight-card">
              <div className="analytics-insight-icon">{insightIcon}</div>
              <div>
                <h3>{insightTitle}</h3>
                <p>{insightMessage}</p>
              </div>
            </section>

            {/* PROGRESS CHART (WEEKLY / MONTHLY) */}
            <section className="analytics-card progress-chart-card">
              <div className="chart-card-header">
                <div>
                  <h2>Completion Progress Chart</h2>
                  <p>
                    {timeframe === "weekly"
                      ? "Past 7 days daily completion rates"
                      : "Past 30 days daily completion rates"}
                  </p>
                </div>

                {/* TIMEFRAME SELECTOR */}
                <div className="timeframe-toggle">
                  <button
                    className={`timeframe-btn ${
                      timeframe === "weekly" ? "active" : ""
                    }`}
                    onClick={() => setTimeframe("weekly")}
                  >
                    Last 7 Days
                  </button>
                  <button
                    className={`timeframe-btn ${
                      timeframe === "monthly" ? "active" : ""
                    }`}
                    onClick={() => setTimeframe("monthly")}
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>

              {/* TIMEFRAME SUMMARY PILLS */}
              <div className="timeframe-stats-pills">
                <div className="stat-pill">
                  <span>Period Completion:</span>
                  <strong>{periodPercentage}%</strong>
                </div>
                <div className="stat-pill">
                  <span>Tasks Completed:</span>
                  <strong>
                    {totalPeriodCompleted} / {totalPeriodTasks}
                  </strong>
                </div>
                {bestDay && (
                  <div className="stat-pill">
                    <span>Best Day:</span>
                    <strong>
                      {formatShortDate(bestDay.date)} ({bestDay.percentage}%)
                    </strong>
                  </div>
                )}
                {bestDayOfWeek && (
                  <div className="stat-pill">
                    <span>Peak Weekday:</span>
                    <strong>
                      {bestDayOfWeek.day} ({bestDayOfWeek.percentage}%)
                    </strong>
                  </div>
                )}
              </div>

              {/* BAR CHART */}
              <div className="chart-container">
                <div className="chart-bars-wrapper">
                  {activeChartData.map((day) => {
                    const barColor = getBarColor(day.percentage);
                    return (
                      <div className="chart-col" key={day.date}>
                        <span className="chart-percent-label">
                          {day.percentage}%
                        </span>

                        <div className="chart-bar-slot">
                          <div
                            className="chart-bar-fill"
                            style={{
                              height:
                                day.percentage === 0
                                  ? "4px"
                                  : `${Math.max(day.percentage, 6)}%`,
                              backgroundColor: barColor,
                            }}
                            title={`${day.date}: ${day.completed}/${day.total} tasks (${day.percentage}%)`}
                          />
                        </div>

                        <span className="chart-date-label">
                          {timeframe === "weekly"
                            ? formatDayName(day.date)
                            : formatShortDate(day.date)}
                        </span>

                        <span className="chart-task-count">
                          {day.completed}/{day.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* DAY OF WEEK ANALYSIS & ROUTINE BREAKDOWN */}
            <div className="analytics-grid-two">
              {/* DAY OF WEEK CONSISTENCY */}
              <section className="analytics-card">
                <div className="card-header-simple">
                  <h2>📅 Day-of-Week Consistency</h2>
                  <p>Average completion rate by day of week over the past 30 days.</p>
                </div>

                <div className="day-of-week-list">
                  {dayOfWeekStats.map((item) => (
                    <div className="dow-row" key={item.day}>
                      <div className="dow-label">
                        <strong>{item.day}</strong>
                        <span>
                          {item.completed}/{item.total} tasks
                        </span>
                      </div>

                      <div className="dow-bar-track">
                        <div
                          className="dow-bar-fill"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: getBarColor(item.percentage),
                          }}
                        />
                      </div>

                      <span className="dow-percent">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ROUTINE-BY-ROUTINE BREAKDOWN */}
              <section className="analytics-card">
                <div className="card-header-simple">
                  <h2>📋 Routine Breakdown</h2>
                  <p>Performance breakdown for each routine.</p>
                </div>

                {routineStats.length === 0 ? (
                  <div className="empty-subtext">
                    <p>No routines found to analyze.</p>
                  </div>
                ) : (
                  <div className="routine-breakdown-list">
                    {routineStats.map((routine) => (
                      <div className="routine-breakdown-item" key={routine._id}>
                        <div className="routine-item-top">
                          <div>
                            <h4>{routine.title}</h4>
                            <span className="routine-item-freq">
                              🔄 {routine.frequency} • {routine.tasksCount} task
                              {routine.tasksCount !== 1 ? "s" : ""}
                            </span>
                          </div>

                          <div className="routine-item-rate">
                            <strong>{routine.completionRate}%</strong>
                            <span>completed</span>
                          </div>
                        </div>

                        <div className="routine-item-bar-track">
                          <div
                            className="routine-item-bar-fill"
                            style={{
                              width: `${routine.completionRate}%`,
                              backgroundColor: getBarColor(
                                routine.completionRate
                              ),
                            }}
                          />
                        </div>

                        <div className="routine-item-footer">
                          <span>
                            {routine.completedTaskInstances} of{" "}
                            {routine.totalTaskInstances} tasks completed
                          </span>
                          <span>
                            {routine.scheduledDaysCount} scheduled days
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* =========================
               DATA EXPORT SECTION
            ========================= */}
            <section className="analytics-card export-data-card">
              <div className="export-card-left">
                <div className="export-icon">📥</div>
                <div>
                  <h2>Export & Backup Routine Data</h2>
                  <p>
                    Download your full habit and routine completion history for spreadsheet analysis or backup.
                  </p>
                </div>
              </div>

              <div className="export-card-actions">
                <button
                  type="button"
                  className="export-btn csv-btn"
                  onClick={() => {
                    exportRoutinesToCSV(allRoutines, analytics);
                    setExportToast("📊 CSV file downloaded successfully!");
                    setTimeout(() => setExportToast(""), 4000);
                  }}
                >
                  📊 Download CSV Spreadsheet
                </button>

                <button
                  type="button"
                  className="export-btn json-btn"
                  onClick={() => {
                    exportRoutinesToJSON(allRoutines, analytics);
                    setExportToast("💾 JSON backup downloaded successfully!");
                    setTimeout(() => setExportToast(""), 4000);
                  }}
                >
                  💾 Download JSON Backup
                </button>
              </div>

              {exportToast && (
                <div className="export-toast-msg">
                  {exportToast}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Analytics;