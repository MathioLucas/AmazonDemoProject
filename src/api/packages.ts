// src/api/packages.ts
import { Request, Response } from "express";
import { mockPackages } from "../data/mockData";

export const handleGetPackages = (_req: Request, res: Response) => {
  // Simulate API delay
  setTimeout(() => {
    res.status(200).json(mockPackages);
  }, 500);
};
