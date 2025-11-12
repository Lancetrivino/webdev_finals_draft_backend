import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ✅ Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ✅ Keep JSON parser for regular API requests
app.use(express.json({ limit: "10mb" }));

// ❌ REMOVED: express.urlencoded() - conflicts with multer
// Multer will handle multipart/form-data parsing instead

// ✅ Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/feedback", feedbackRoutes);

app.get("/", (req, res) => res.send("✅ Backend is connected!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));