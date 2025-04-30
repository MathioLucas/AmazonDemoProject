// src/api/index.ts
import { Request, Response } from "express";
import { handleGetPackages } from "./packages";
import { handleGetVans } from "./vans";
import { handlePrioritize } from "./prioritize";

// Route handler for /api/packages
export const packagesHandler = (req: Request, res: Response) => {
  return handleGetPackages(req, res);
};

// Route handler for /api/vans
export const vansHandler = (req: Request, res: Response) => {
  return handleGetVans(req, res);
};

// Route handler for /api/prioritize
export const prioritizeHandler = (req: Request, res: Response) => {
  return handlePrioritize(req, res);
};
