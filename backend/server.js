import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// 🧩 Import routes
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://webdev-finals-draft.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());


app.use("/api/users", userRoutes);   // handles /api/users/register and /api/users/login
app.use("/api/events", eventRoutes); // handles /api/events/
app.use("/api/feedback", feedbackRoutes); // handles /api/feedback/


app.get("/", (req, res) => res.send("✅ Backend is connected!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
