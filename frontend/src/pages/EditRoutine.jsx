import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTINE_CATEGORIES } from "../utils/categoryMeta";
import { API_BASE_URL } from "../config/api";
import "./EditRoutine.css";

function EditRoutine() {
  const navigate = useNavigate();
  const { routineId } = useParams();

  // =========================
  // BASIC ROUTINE DATA
  // =========================
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("lifestyle");
  const [frequency, setFrequency] = useState("daily");

  // =========================
  // SCHEDULE DATA
  // =========================
  const [weekdays, setWeekdays] = useState([]);
  const [monthDates, setMonthDates] = useState([]);
  const [specificDates, setSpecificDates] = useState([]);

  const [newMonthDate, setNewMonthDate] = useState("");
  const [newSpecificDate, setNewSpecificDate] = useState("");

  // =========================
  // TASK DATA
  // =========================
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // =========================
  // =========================
  // FETCH ROUTINE DATA
  // =========================
  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        let routine = null;

        // Try single routine endpoint first
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/routines/${routineId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            routine = data.routine;
          }
        } catch (e) {
          console.warn("Single routine fetch failed, trying all routines fallback", e);
        }

        // Fallback to all routines endpoint if needed
        if (!routine) {
          const allResponse = await fetch(
            `${API_BASE_URL}/api/routines/all`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const allData = await allResponse.json();
          if (allResponse.ok && Array.isArray(allData.routines)) {
            routine = allData.routines.find((r) => r._id === routineId);
          }
        }

        if (!routine) {
          alert("Routine not found");
          navigate("/my-routines");
          return;
        }

        // Basic information
        setTitle(routine.title || "");
        setDescription(routine.description || "");
        setCategory(routine.category || "lifestyle");
        setFrequency(routine.frequency || "daily");

        // Schedule information
        setWeekdays(routine.weekdays || []);
        setMonthDates(routine.monthDates || []);
        setSpecificDates(routine.specificDates || []);

        // Tasks
        setTasks(
          (routine.tasks || []).map((task) => ({
            _id: task._id,
            title: task.title,
            completedDates: task.completedDates || [],
          }))
        );
      } catch (error) {
        console.error("Error loading routine:", error);
        alert("Something went wrong while loading the routine.");
      } finally {
        setLoading(false);
      }
    };

    if (routineId) {
      fetchRoutine();
    }
  }, [routineId, navigate]);

  // =========================
  // WEEKDAY FUNCTIONS
  // =========================
  const toggleWeekday = (day) => {
    if (weekdays.includes(day)) {
      setWeekdays(
        weekdays.filter((item) => item !== day)
      );
    } else {
      setWeekdays([...weekdays, day]);
    }
  };

  // =========================
  // MONTH DATE FUNCTIONS
  // =========================
  const addMonthDate = () => {
    const dateNumber = Number(newMonthDate);

    if (
      !dateNumber ||
      dateNumber < 1 ||
      dateNumber > 31
    ) {
      alert("Please enter a date between 1 and 31");
      return;
    }

    if (!monthDates.includes(dateNumber)) {
      setMonthDates(
        [...monthDates, dateNumber].sort((a, b) => a - b)
      );
    }

    setNewMonthDate("");
  };

  const removeMonthDate = (date) => {
    setMonthDates(
      monthDates.filter((item) => item !== date)
    );
  };

  // =========================
  // SPECIFIC DATE FUNCTIONS
  // =========================
  const addSpecificDate = () => {
    if (!newSpecificDate) {
      alert("Please select a date");
      return;
    }

    if (!specificDates.includes(newSpecificDate)) {
      setSpecificDates(
        [...specificDates, newSpecificDate].sort()
      );
    }

    setNewSpecificDate("");
  };

  const removeSpecificDate = (date) => {
    setSpecificDates(
      specificDates.filter((item) => item !== date)
    );
  };

  // =========================
  // TASK FUNCTIONS
  // =========================
  const handleTaskChange = (index, value) => {
    const updatedTasks = [...tasks];

    updatedTasks[index].title = value;

    setTasks(updatedTasks);
  };

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        title: "",
        completedDates: [],
      },
    ]);
  };

  const removeTask = (index) => {
    setTasks(
      tasks.filter((_, i) => i !== index)
    );
  };

  // =========================
  // SAVE ROUTINE
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a routine title");
      return;
    }

    // Weekly validation
    if (
      frequency === "weekly" &&
      weekdays.length === 0
    ) {
      alert("Please select at least one weekday");
      return;
    }

    // Monthly validation
    if (
      frequency === "monthly" &&
      monthDates.length === 0
    ) {
      alert("Please add at least one date of the month");
      return;
    }

    // Specific dates validation
    if (
      frequency === "specific" &&
      specificDates.length === 0
    ) {
      alert("Please add at least one specific date");
      return;
    }

    const validTasks = tasks.filter(
      (task) => task.title && task.title.trim()
    );

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/routines/${routineId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            title,
            description,
            category,
            frequency,
            weekdays,
            monthDates,
            specificDates,
            tasks: validTasks,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update routine");
        return;
      }

      alert("Routine updated successfully! 🎉");

      navigate("/my-routines");
    } catch (error) {
      console.error("Error updating routine:", error);

      alert("Something went wrong while updating the routine.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="edit-routine-page">
        <div className="edit-routine-container">
          <p>Loading routine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-routine-page">
      <div className="edit-routine-container">

        {/* BACK BUTTON */}
        <button
          className="back-btn"
          onClick={() => navigate("/my-routines")}
        >
          ← Back to My Routines
        </button>

        <div className="edit-form-card">
          <h1>Edit Routine</h1>

          <p className="edit-subtitle">
            Update your routine and schedule.
          </p>

          <form onSubmit={handleSubmit}>

            {/* TITLE */}
            <div className="form-group">
              <label>Routine Title</label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Routine title"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="form-group">
              <label>Description</label>

              <textarea
                rows="3"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe your routine..."
              />
            </div>

            {/* CATEGORY SELECTOR */}
            <div className="form-group">
              <label>Category</label>
              <div className="category-pill-selector">
                {ROUTINE_CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    className={`category-pill-btn ${category === cat.id ? "active" : ""}`}
                    onClick={() => setCategory(cat.id)}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* FREQUENCY */}
            <div className="form-group">
              <label>Schedule Type</label>

              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value)
                }
              >
                <option value="daily">Daily</option>

                <option value="weekly">
                  Weekly
                </option>

                <option value="monthly">
                  Monthly
                </option>

                <option value="specific">
                  Specific Dates
                </option>
              </select>
            </div>

            {/* WEEKLY */}
            {frequency === "weekly" && (
              <div className="schedule-section">
                <label>Select Days</label>

                <div className="weekday-container">
                  {days.map((day) => (
                    <button
                      type="button"
                      key={day}
                      className={`weekday-btn ${
                        weekdays.includes(day)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => toggleWeekday(day)}
                    >
                      {day.charAt(0).toUpperCase() +
                        day.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MONTHLY */}
            {frequency === "monthly" && (
              <div className="schedule-section">
                <label>Select Dates of Month</label>

                <div className="date-input-row">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Example: 1"
                    value={newMonthDate}
                    onChange={(e) =>
                      setNewMonthDate(e.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="schedule-add-btn"
                    onClick={addMonthDate}
                  >
                    Add
                  </button>
                </div>

                <div className="selected-dates">
                  {monthDates.map((date) => (
                    <span
                      className="date-tag"
                      key={date}
                    >
                      {date}

                      <button
                        type="button"
                        onClick={() =>
                          removeMonthDate(date)
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SPECIFIC DATES */}
            {frequency === "specific" && (
              <div className="schedule-section">
                <label>Select Specific Dates</label>

                <div className="date-input-row">
                  <input
                    type="date"
                    value={newSpecificDate}
                    onChange={(e) =>
                      setNewSpecificDate(e.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="schedule-add-btn"
                    onClick={addSpecificDate}
                  >
                    Add
                  </button>
                </div>

                <div className="selected-dates">
                  {specificDates.map((date) => (
                    <span
                      className="date-tag"
                      key={date}
                    >
                      {date}

                      <button
                        type="button"
                        onClick={() =>
                          removeSpecificDate(date)
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* TASKS */}
            <div className="tasks-section">

              <div className="tasks-header">
                <h2>Tasks</h2>

                <button
                  type="button"
                  className="add-task-btn"
                  onClick={addTask}
                >
                  + Add Task
                </button>
              </div>

              {tasks.length === 0 && (
                <p className="no-tasks-text">
                  No tasks yet. Add one to get started.
                </p>
              )}

              {tasks.map((task, index) => (
                <div
                  className="task-input-row"
                  key={task._id || index}
                >
                  <input
                    type="text"
                    value={task.title}
                    placeholder={`Task ${index + 1}`}
                    onChange={(e) =>
                      handleTaskChange(
                        index,
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="remove-task-btn"
                    onClick={() => removeTask(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="edit-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={() =>
                  navigate("/my-routines")
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-routine-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default EditRoutine;