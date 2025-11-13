import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// route modules
import categorizeRouter from "./backend/routes/categorize.js";
import clarifyRouter from "./backend/routes/clarify.js";
import motivateRouter from "./backend/routes/motivate.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "PomoTask Backend is running!", status: "healthy" });
});

// use route modules
app.use("/api/categorize", categorizeRouter);
app.use("/api/clarify", clarifyRouter);
app.use("/api/motivate", motivateRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

//Serve the built frontend
app.use(express.static(path.join(__dirname, "client", "dist")));

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

export default app;