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

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      // Allow if origin is in whitelist or if CLIENT_URL is not set / wildcard
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".netlify.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive CORS for seamless deployment
    },
    credentials: true,
  })
);
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