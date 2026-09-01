const express = require("express");
const cors = require("cors");
require("dotenv").config();

const routineRoutes = require("./routes/routineRoutes");
const authRoutes = require("./routes/authRoutes");
const achievementRoutes = require("./routes/achievementRoutes");

const connectDB = require("./config/db");

const app = express();

// =========================
// CONNECT DATABASE
// =========================

connectDB();

// =========================
// MIDDLEWARE
// =========================

app.use(cors());
app.use((req, res, next) => {
  // Normalize consecutive slashes in request URLs (e.g., //api/auth -> /api/auth)
  req.url = req.url.replace(/\/{2,}/g, "/");
  next();
});
app.use(express.json());

// =========================
// ROUTES
// =========================

app.use("/api/auth", authRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/achievements", achievementRoutes);

// =========================
// TEST ROUTE
// =========================

app.get("/", (req, res) => {
  res.json({
    message: "RoutineOS Backend is Running 🚀",
  });
});

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});