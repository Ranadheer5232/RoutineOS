import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTINE_CATEGORIES } from "../utils/categoryMeta";
import { ROUTINE_TEMPLATES } from "../data/routineTemplates";
import { API_BASE_URL } from "../config/api";
import "./AddRoutine.css";

const AddRoutine = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("lifestyle");
  const [frequency, setFrequency] = useState("daily");

  const [weekdays, setWeekdays] = useState([]);
  const [monthDates, setMonthDates] = useState([]);
  const [specificDates, setSpecificDates] = useState([]);

  const [newMonthDate, setNewMonthDate] = useState("");
  const [newSpecificDate, setNewSpecificDate] = useState("");

  const [tasks, setTasks] = useState([{ title: "" }]);
  const [loading, setLoading] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

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
  // APPLY TEMPLATE
  // =========================
  const applyTemplate = (template) => {
    setTitle(template.title);
    setDescription(template.description || "");
    setCategory(template.category || "lifestyle");
    setFrequency(template.frequency || "daily");
    setWeekdays(template.weekdays || []);
    setMonthDates(template.monthDates || []);
    setSpecificDates(template.specificDates || []);
    setTasks(template.tasks?.length ? template.tasks.map((t) => ({ title: t.title })) : [{ title: "" }]);
    setShowTemplatesModal(false);
  };

  // =========================
  // WEEKDAY SELECTION
  // =========================
  const toggleWeekday = (day) => {
    if (weekdays.includes(day)) {
      setWeekdays(weekdays.filter((item) => item !== day));
    } else {
      setWeekdays([...weekdays, day]);
    }
  };

  // =========================
  // MONTH DATE SELECTION
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
      setMonthDates([...monthDates, dateNumber].sort((a, b) => a - b));
    }

    setNewMonthDate("");
  };

  const removeMonthDate = (date) => {
    setMonthDates(
      monthDates.filter((item) => item !== date)
    );
  };

  // =========================
  // SPECIFIC DATE SELECTION
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
    setTasks([...tasks, { title: "" }]);
  };

  const removeTask = (index) => {
    if (tasks.length === 1) return;

    setTasks(tasks.filter((_, i) => i !== index));
  };

  // =========================
  // CREATE ROUTINE
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a routine title");
      return;
    }

    // Validate weekly schedule
    if (frequency === "weekly" && weekdays.length === 0) {
      alert("Please select at least one weekday");
      return;
    }

    // Validate monthly schedule
    if (
      frequency === "monthly" &&
      monthDates.length === 0
    ) {
      alert("Please add at least one date of the month");
      return;
    }

    // Validate specific dates
    if (
      frequency === "specific" &&
      specificDates.length === 0
    ) {
      alert("Please add at least one specific date");
      return;
    }

    const validTasks = tasks.filter(
      (task) => task.title.trim() !== ""
    );

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/routines`,
        {
          method: "POST",
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
        alert(
          data.message || "Failed to create routine"
        );
        return;
      }

      alert("Routine created successfully! 🎉");

      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating routine:", error);

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-routine-page">
      <div className="add-routine-container">

        <div className="add-top-actions">
          <button
            className="back-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>

          <button
            type="button"
            className="browse-templates-btn"
            onClick={() => setShowTemplatesModal(true)}
          >
            ✨ Browse Pre-Made Templates
          </button>
        </div>

        <div className="form-card">
          <h1>Create New Routine</h1>

          <p>
            Build a routine, organize with categories, and stay consistent with your goals.
          </p>

          <form onSubmit={handleSubmit}>

            {/* ROUTINE TITLE */}
            <div className="form-group">
              <label>Routine Title</label>

              <input
                type="text"
                placeholder="Example: Morning Workout"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
              />
            </div>

            {/* DESCRIPTION */}
            <div className="form-group">
              <label>Description</label>

              <textarea
                placeholder="Describe your routine..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows="3"
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
              <label>Frequency</label>

              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value)
                }
              >
                <option value="daily">
                  Daily (Every day)
                </option>
                <option value="weekly">
                  Weekly (Selected days of week)
                </option>
                <option value="monthly">
                  Monthly (Specific days of month)
                </option>
                <option value="specific">
                  Specific Dates
                </option>
              </select>
            </div>

            {/* WEEKDAYS */}
            {frequency === "weekly" && (
              <div className="schedule-section">
                <label>Select Days of the Week</label>

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
                      onClick={() =>
                        toggleWeekday(day)
                      }
                    >
                      {day.slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MONTHLY DATES */}
            {frequency === "monthly" && (
              <div className="schedule-section">
                <label>
                  Add Days of the Month (1-31)
                </label>

                <div className="date-input-row">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Enter day number (e.g. 15)"
                    value={newMonthDate}
                    onChange={(e) =>
                      setNewMonthDate(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="schedule-add-btn"
                    onClick={addMonthDate}
                  >
                    + Add Day
                  </button>
                </div>

                <div className="selected-dates">
                  {monthDates.map((date) => (
                    <span
                      key={date}
                      className="date-tag"
                    >
                      Day {date}
                      <button
                        type="button"
                        onClick={() =>
                          removeMonthDate(date)
                        }
                      >
                        ✕
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
                      setNewSpecificDate(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="schedule-add-btn"
                    onClick={addSpecificDate}
                  >
                    + Add Date
                  </button>
                </div>

                <div className="selected-dates">
                  {specificDates.map((date) => (
                    <span
                      key={date}
                      className="date-tag"
                    >
                      {date}
                      <button
                        type="button"
                        onClick={() =>
                          removeSpecificDate(date)
                        }
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* TASKS */}
            <div className="tasks-section">
              <div className="tasks-header">
                <h2>Routine Tasks</h2>

                <button
                  type="button"
                  className="add-task-btn"
                  onClick={addTask}
                >
                  + Add Task
                </button>
              </div>

              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="task-input-row"
                >
                  <input
                    type="text"
                    placeholder={`Task ${index + 1}`}
                    value={task.title}
                    onChange={(e) =>
                      handleTaskChange(
                        index,
                        e.target.value
                      )
                    }
                  />

                  {tasks.length > 1 && (
                    <button
                      type="button"
                      className="remove-task-btn"
                      onClick={() =>
                        removeTask(index)
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="create-routine-btn"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create Routine"}
            </button>

          </form>
        </div>
      </div>

      {/* TEMPLATES MODAL */}
      {showTemplatesModal && (
        <div className="templates-modal-backdrop" onClick={() => setShowTemplatesModal(false)}>
          <div className="templates-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="templates-modal-header">
              <div>
                <h2>✨ Routine Templates Library</h2>
                <p>Choose a proven routine to load directly into your new routine.</p>
              </div>
              <button
                type="button"
                className="templates-close-btn"
                onClick={() => setShowTemplatesModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="templates-grid">
              {ROUTINE_TEMPLATES.map((tmpl) => (
                <div className="template-card" key={tmpl.id}>
                  <div className="template-card-top">
                    <h3>{tmpl.title}</h3>
                    <span className="template-freq-tag">🔄 {tmpl.frequency}</span>
                  </div>
                  <p className="template-desc">{tmpl.description}</p>
                  <div className="template-tasks-preview">
                    <strong>Tasks ({tmpl.tasks.length}):</strong>
                    <ul>
                      {tmpl.tasks.slice(0, 3).map((t, idx) => (
                        <li key={idx}>{t.title}</li>
                      ))}
                      {tmpl.tasks.length > 3 && (
                        <li className="more-tasks">+{tmpl.tasks.length - 3} more tasks</li>
                      )}
                    </ul>
                  </div>
                  <button
                    type="button"
                    className="use-template-btn"
                    onClick={() => applyTemplate(tmpl)}
                  >
                    ⚡ Use This Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddRoutine;