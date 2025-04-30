// src/api/vans.ts
import { Request, Response } from "express";
import { mockVans } from "../data/mockData";

export const handleGetVans = (_req: Request, res: Response) => {
  // Simulate API delay
  setTimeout(() => {
    res.status(200).json(mockVans);
  }, 500);
};
