import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { triggerAchievementUnlock } from "../utils/confetti";
import { API_BASE_URL } from "../config/api";
import "./Achievements.css";

function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH ACHIEVEMENTS
  // =========================

  const fetchAchievements = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/achievements`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          data.message || "Failed to load achievements"
        );
        return;
      }

      const achList = data.achievements || [];
      setAchievements(achList);
      setStats(data.stats || null);

      if (achList.some((a) => a.unlocked)) {
        setTimeout(() => triggerAchievementUnlock(), 300);
      }
    } catch (error) {
      console.error(
        "Error loading achievements:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  // =========================
  // STATISTICS
  // =========================

  const unlockedCount = achievements.filter(
    (achievement) => achievement.unlocked
  ).length;

  const totalAchievements = achievements.length;

  const completionPercentage =
    totalAchievements === 0
      ? 0
      : Math.round(
          (unlockedCount / totalAchievements) * 100
        );

  return (
    <div className="achievements-page">

      {/* ================= SIDEBAR ================= */}

      <Sidebar />

      {/* ================= MAIN ================= */}

      <main className="achievements-main">

        {/* HEADER */}

        <div className="achievements-header">
          <div>
            <h1>🏆 Achievements</h1>

            <p>
              Track your milestones and celebrate your consistency.
            </p>
          </div>
        </div>

        {loading ? (

          <div className="achievements-loading">
            Loading achievements...
          </div>

        ) : (

          <>
            {/* ================= OVERVIEW ================= */}

            <section className="achievement-overview">

              <div className="achievement-overview-card">

                <div className="overview-icon">🏆</div>

                <div>
                  <p>Achievements Unlocked</p>

                  <h2>
                    {unlockedCount} / {totalAchievements}
                  </h2>
                </div>

              </div>

              <div className="achievement-overview-card">

                <div className="overview-icon">📈</div>

                <div>
                  <p>Completion Progress</p>

                  <h2>{completionPercentage}%</h2>
                </div>

              </div>

              <div className="achievement-overview-card">

                <div className="overview-icon">🔥</div>

                <div>
                  <p>Current Streak</p>

                  <h2>
                    {stats?.currentStreak || 0} Days
                  </h2>
                </div>

              </div>

              <div className="achievement-overview-card">

                <div className="overview-icon">✅</div>

                <div>
                  <p>Tasks Completed</p>

                  <h2>
                    {stats?.totalCompletedTasks || 0}
                  </h2>
                </div>

              </div>

            </section>

            {/* ================= OVERALL PROGRESS ================= */}

            <section className="achievement-progress-card">

              <div className="achievement-progress-header">

                <div>
                  <h2>Overall Progress</h2>

                  <p>
                    Unlock achievements by staying consistent.
                  </p>
                </div>

                <strong>
                  {completionPercentage}%
                </strong>

              </div>

              <div className="achievement-progress-bar">

                <div
                  className="achievement-progress-fill"
                  style={{
                    width: `${completionPercentage}%`,
                  }}
                ></div>

              </div>

            </section>

            {/* ================= ACHIEVEMENTS ================= */}

            <section className="achievements-section">

              <div className="achievements-section-header">

                <div>
                  <h2>Your Achievements</h2>

                  <p>
                    Complete goals to unlock new milestones.
                  </p>
                </div>

              </div>

              <div className="achievement-grid">

                {achievements.map((achievement) => {

                  const progressPercentage =
                    achievement.target === 0
                      ? 0
                      : Math.round(
                          (achievement.progress /
                            achievement.target) *
                            100
                        );

                  return (

                    <div
                      className={`achievement-card ${
                        achievement.unlocked
                          ? "achievement-unlocked"
                          : "achievement-locked"
                      }`}
                      key={achievement.id}
                    >

                      {/* ICON */}

                      <div className="achievement-icon">

                        {achievement.unlocked
                          ? achievement.icon
                          : "🔒"}

                      </div>

                      {/* CONTENT */}

                      <div className="achievement-content">

                        <div className="achievement-title-row">

                          <h3>
                            {achievement.title}
                          </h3>

                          {achievement.unlocked && (
                            <span className="unlocked-badge">
                              Unlocked
                            </span>
                          )}

                        </div>

                        <p>
                          {achievement.description}
                        </p>

                        {/* PROGRESS */}

                        <div className="achievement-card-progress">

                          <div className="achievement-card-progress-info">

                            <span>Progress</span>

                            <strong>
                              {achievement.progress} /{" "}
                              {achievement.target}
                            </strong>

                          </div>

                          <div className="achievement-card-progress-bar">

                            <div
                              className="achievement-card-progress-fill"
                              style={{
                                width: `${Math.min(
                                  progressPercentage,
                                  100
                                )}%`,
                              }}
                            ></div>

                          </div>

                        </div>

                      </div>

                    </div>

                  );
                })}

              </div>

            </section>

          </>

        )}

      </main>
    </div>
  );
}

export default Achievements;