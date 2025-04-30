// pages/api/vans.ts
import { NextApiRequest, NextApiResponse } from "next";
import { handleGetVans } from "../../src/api/vans";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper content type
  res.setHeader("Content-Type", "application/json");

  // Call your existing handler
  handleGetVans(req as any, res as any);
}
