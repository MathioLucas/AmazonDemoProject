// pages/api/packages.ts
import { NextApiRequest, NextApiResponse } from "next";
import { handleGetPackages } from "../../src/api/packages";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper content type
  res.setHeader("Content-Type", "application/json");

  // Call your existing handler
  handleGetPackages(req as any, res as any);
}
