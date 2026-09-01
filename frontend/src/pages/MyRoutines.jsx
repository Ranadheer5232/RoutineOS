import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyRoutines.css";
import Sidebar from "../components/Sidebar";
import { ROUTINE_CATEGORIES, getCategoryMeta } from "../utils/categoryMeta";
import { API_BASE_URL } from "../config/api";

function MyRoutines() {
  const navigate = useNavigate();

  const [routines, setRoutines] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH ALL ROUTINES
  // =========================

  const fetchRoutines = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/routines/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message || "Failed to load routines");
        return;
      }

      setRoutines(data.routines || []);
    } catch (error) {
      console.error("Error loading routines:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  // =========================
  // DELETE ROUTINE
  // =========================

  const handleDelete = async (routineId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this routine?"
    );

    if (!confirmed) return;

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

      setRoutines((previousRoutines) =>
        previousRoutines.filter(
          (routine) => routine._id !== routineId
        )
      );
    } catch (error) {
      console.error("Error deleting routine:", error);
      alert("Something went wrong while deleting the routine.");
    }
  };

  // =========================
  // FORMAT SCHEDULE
  // =========================

  const getScheduleText = (routine) => {
    if (routine.frequency === "daily") {
      return "Every day";
    }

    if (routine.frequency === "weekly") {
      if (!routine.weekdays || routine.weekdays.length === 0) {
        return "Weekly";
      }

      return routine.weekdays
        .map(
          (day) =>
            day.charAt(0).toUpperCase() + day.slice(1)
        )
        .join(", ");
    }

    if (routine.frequency === "monthly") {
      if (!routine.monthDates || routine.monthDates.length === 0) {
        return "Monthly";
      }

      return `Every month on: ${routine.monthDates.join(", ")}`;
    }

    if (routine.frequency === "specific") {
      if (
        !routine.specificDates ||
        routine.specificDates.length === 0
      ) {
        return "Specific dates";
      }

      return `${routine.specificDates.length} specific date${
        routine.specificDates.length > 1 ? "s" : ""
      }`;
    }

    return routine.frequency;
  };

  return (
    <div className="my-routines-page">

      {/* ================= SIDEBAR ================= */}

      <Sidebar />

      {/* ================= MAIN CONTENT ================= */}

      <main className="my-routines-main">

        {/* ================= HEADER ================= */}

        <div className="my-routines-header">

          <div>
            <h1>📋 My Routines</h1>

            <p>
              Manage all your routines in one place.
            </p>
          </div>

          <button
            className="my-routines-add-btn"
            onClick={() => navigate("/add-routine")}
          >
            + Add Routine
          </button>

        </div>

        {/* CATEGORY FILTER TABS */}
        {routines.length > 0 && (
          <div className="my-routines-category-tabs">
            <button
              type="button"
              className={`cat-tab-btn ${selectedCategory === "all" ? "active" : ""}`}
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
                  className={`cat-tab-btn ${selectedCategory === cat.id ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.icon} {cat.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* ================= LOADING ================= */}

        {loading ? (

          <div className="my-routines-loading">
            Loading your routines...
          </div>

        ) : routines.length === 0 ? (

          /* ================= EMPTY STATE ================= */

          <div className="my-routines-empty">

            <div className="my-routines-empty-icon">
              📋
            </div>

            <h2>No routines yet</h2>

            <p>
              Create your first routine and start building
              better habits.
            </p>

            <button
              className="my-routines-add-btn"
              onClick={() => navigate("/add-routine")}
            >
              + Create Your First Routine
            </button>

          </div>

        ) : routines.filter((r) => selectedCategory === "all" || (r.category || "lifestyle") === selectedCategory).length === 0 ? (
          <div className="my-routines-empty">
            <div className="my-routines-empty-icon">🔍</div>
            <h2>No routines found</h2>
            <p>No routines in this category. Click below to view all routines.</p>
            <button
              className="my-routines-add-btn"
              onClick={() => setSelectedCategory("all")}
            >
              Show All Routines
            </button>
          </div>
        ) : (

          /* ================= ROUTINE LIST ================= */

          <div className="my-routines-list">

            {routines
              .filter((r) => selectedCategory === "all" || (r.category || "lifestyle") === selectedCategory)
              .map((routine) => {
                const catMeta = getCategoryMeta(routine.category);
                return (

              <div
                className="my-routine-card"
                key={routine._id}
              >

                <div className="my-routine-card-top">

                  <div>

                    <div className="my-routine-title-row">
                      <h2>{routine.title}</h2>
                      <span className="my-routine-cat-badge">
                        {catMeta.icon} {catMeta.name}
                      </span>
                    </div>

                    {routine.description && (
                      <p className="my-routine-description">
                        {routine.description}
                      </p>
                    )}

                  </div>

                  <span className="my-routine-frequency">
                    {routine.frequency}
                  </span>

                </div>

                {/* SCHEDULE */}

                <div className="my-routine-schedule">
                  📅 {getScheduleText(routine)}
                </div>

                {/* TASK COUNT */}

                <div className="my-routine-task-count">
                  ✅ {routine.tasks?.length || 0} Task
                  {(routine.tasks?.length || 0) !== 1
                    ? "s"
                    : ""}
                </div>

                {/* ACTIONS */}

                <div className="my-routine-actions">

                  <button
                    className="my-routine-edit-btn"
                    onClick={() =>
                      navigate(`/edit-routine/${routine._id}`)
                    }
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="my-routine-delete-btn"
                    onClick={() =>
                      handleDelete(routine._id)
                    }
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>

            );
          })}

          </div>
        )}

      </main>

    </div>
  );
}

export default MyRoutines;