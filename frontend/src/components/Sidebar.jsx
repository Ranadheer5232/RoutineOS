import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  const navItems = [
    {
      name: "Dashboard",
      icon: "📊",
      path: "/dashboard",
    },
    {
      name: "My Routines",
      icon: "📋",
      path: "/my-routines",
    },
    {
      name: "Analytics",
      icon: "📈",
      path: "/analytics",
    },
    {
      name: "Add Routine",
      icon: "➕",
      path: "/add-routine",
    },
    {
      name: "History",
      icon: "📅",
      path: "/history",
    },
    {
      name: "Achievements",
      icon: "🏆",
      path: "/achievements",
    },
  ];

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div
        className="sidebar-logo"
        onClick={() => navigate("/dashboard")}
      >
        <div className="sidebar-logo-icon">✓</div>

        <h2>RoutineOS</h2>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${
              location.pathname === item.path ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            <span>{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      {/* BOTTOM ACTIONS */}
      <div className="sidebar-bottom">
        <button
          className="theme-toggle"
          onClick={toggleDarkMode}
          title={
            darkMode
              ? "Switch to Light Mode"
              : "Switch to Dark Mode"
          }
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;