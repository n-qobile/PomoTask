import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// route modules
import categorizeRouter from "./routes/categorize.js";
import clarifyRouter from "./routes/clarify.js";
import motivateRouter from "./routes/motivate.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);

    // Allow Azure Static Web Apps domains
    if (origin.includes('azurestaticapps.net')) return callback(null, true);

    // Allow your specific Azure domain
    if (origin === 'https://calm-cliff-0b992cc03.3.azurestaticapps.net/') return callback(null, true);

    // Reject other origins
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
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
