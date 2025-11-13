import express from "express";
import { query } from "../utils/huggingface.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { task } = req.body;

    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }

    // calling the query function - DeepSeek model
    const aiResponse = await query({
      messages: [
        {
          role: "system",
          content:
            "Return ONLY a JSON object with 2-4 relevant fields for scheduling/executing this task. ALLOWED KEYS ONLY: 'tm' (time needed), 'bt' (best time), 'pre' (prerequisites), 'nrg' (energy level), 'rem' (reminder), 'loc' (location), 'tl' (tools). Values must be concise strings. Example: {\"tm\":\"30 minutes\",\"bt\":\"Morning\",\"nrg\":\"High\"}. NO other keys allowed. NO explanation text. ONLY the JSON object.",
        },
        {
          role: "user",
          content: `Generate metadata JSON for: "${task}"`,
        },
      ],
      model: "deepseek-ai/DeepSeek-V3:novita",
      max_tokens: 100,
      temperature: 0.3,
    });

    // tm   = time needed
    // bt   = best time
    // pre  = prerequisites
    // nrg  = energy level
    // rem  = reminder
    // loc  = location
    // tl   = tools

    // parse the AI's response
    let aiMessage = aiResponse.choices?.[0]?.message?.content;

    if (typeof aiMessage !== "string") {
      console.error("AI response missing or invalid:", aiResponse);
      aiMessage = '{"tm":"30 minutes","rem":"Check task details"}'; // fallback
    } else {
      // strip markdown code blocks if present
      aiMessage = aiMessage
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    }

    // strip markdown code blocks if present
    aiMessage = aiMessage
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    console.log("Cleaned AI Response:", aiMessage);

    let taskContext;
    const allowedKeys = ["tm", "bt", "pre", "nrg", "rem", "loc", "tl"];

    try {
      taskContext = JSON.parse(aiMessage);

      // validate only allowed keys are present
      const keys = Object.keys(taskContext);
      const invalidKeys = keys.filter((key) => !allowedKeys.includes(key));

      if (invalidKeys.length > 0) {
        invalidKeys.forEach((key) => delete taskContext[key]);
      }

      // ensure to  have at least 2 fields
      if (Object.keys(taskContext).length < 2) {
        throw new Error("Insufficient context fields");
      }
    } catch (e) {
      // fallback
      console.error("JSON parsing error:", e.message);
      taskContext = {
        tm: "30 minutes",
        rem: "Check task details",
      };
    }

    res.json({
      original_task: task,
      task_context: taskContext,
      success: true,
    });
  } catch (error) {
    console.error("Clarification error:", error);
    res.status(500).json({
      error: "Failed to clarify task",
      details: error.message,
    });
  }
});

export default router;
