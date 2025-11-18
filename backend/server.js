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
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'localhost',
      'azurestaticapps.net',
      'elasticbeanstalk.com', 
    ];

    if (allowedOrigins.some(domain => origin.includes(domain))) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
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
