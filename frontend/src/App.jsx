import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AddRoutine from "./pages/AddRoutine";
import EditRoutine from "./pages/EditRoutine";
import History from "./pages/History";
import MyRoutines from "./pages/MyRoutines";
import Analytics from "./pages/Analytics";
import Achievements from "./pages/Achievements";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* My Routines */}
        <Route
          path="/my-routines"
          element={
            <ProtectedRoute>
              <MyRoutines />
            </ProtectedRoute>
          }
        />

        {/* Add Routine */}
        <Route
          path="/add-routine"
          element={
            <ProtectedRoute>
              <AddRoutine />
            </ProtectedRoute>
          }
        />

        {/* Edit Routine */}
        <Route
          path="/edit-routine/:routineId"
          element={
            <ProtectedRoute>
              <EditRoutine />
            </ProtectedRoute>
          }
        />

        {/* History */}
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        {/* Analytics */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
  path="/achievements"
  element={
    <ProtectedRoute>
      <Achievements />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;