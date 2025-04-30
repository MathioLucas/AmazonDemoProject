// pages/api/prioritize.ts
import { NextApiRequest, NextApiResponse } from "next";
import { handlePrioritize } from "../../src/api/prioritize";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Set proper content type
  res.setHeader("Content-Type", "application/json");

  // Call your existing handler
  handlePrioritize(req as any, res as any);
}
