import { Request, Response } from "express";
import { Package, Van, OptimizationStrategy, Metrics } from "../types";
import {
  calculateVolume,
  calculateETA,
  calculateFillPercentage,
} from "../utils/helpers";

export const handlePrioritize = (req: Request, res: Response) => {
  const { packages, vans, strategy } = req.body;

  if (!packages || !vans || !strategy) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // Log for debugging
  console.log(`Received optimization request with strategy: ${strategy}`);
  console.log(`Packages: ${packages.length}, Vans: ${vans.length}`);

  // Simulate API delay
  setTimeout(() => {
    const result = optimizeLoading(packages, vans, strategy);
    res.status(200).json(result);
  }, 1000);
};

const optimizeLoading = (
  pkgs: Package[],
  vanList: Van[],
  strategy: OptimizationStrategy
) => {
  // Create deep copies to avoid mutations
  const updatedVans = JSON.parse(JSON.stringify(vanList)) as Van[];
  let sortedPackages: Package[] = [...pkgs];

  // Initialize vans
  updatedVans.forEach((van) => {
    van.packages = [];
    van.currentLoad = { weight: 0, volume: 0, packageCount: 0 };
  });

  // Skip optimization if no packages
  if (sortedPackages.length === 0) {
    return {
      vans: updatedVans,
      metrics: createEmptyMetrics(),
      unassignedPackages: [],
    };
  }

  console.log(`Optimizing with strategy: ${strategy}`);

  // ---- STRATEGY-BASED SORTING ---- //
  if (strategy === "deadline-first") {
    sortedPackages.sort(
      (a, b) =>
        new Date(a.deliveryWindow.end).getTime() -
        new Date(b.deliveryWindow.end).getTime()
    );
    console.log("Sorted packages by deadline");
  } else if (strategy === "route-optimization") {
    // Improved area extraction for grouping
    const packagesByArea: Record<string, Package[]> = {};

    sortedPackages.forEach((pkg) => {
      // Extract city name from address - assuming format like "123 Main St, Seattle, WA"
      const addressParts = pkg.destination.address.split(",");
      // Get the city part (usually the second-to-last part)
      const cityIndex = Math.max(0, addressParts.length - 2);
      const areaCode = addressParts[cityIndex]?.trim() || "Unknown";
      
      if (!packagesByArea[areaCode]) packagesByArea[areaCode] = [];
      packagesByArea[areaCode].push(pkg);
      
      console.log(`Package ${pkg.id} assigned to area: ${areaCode}`);
    });

    sortedPackages = [];

    // Group packages by area then sort by priority within each area
    Object.keys(packagesByArea).forEach((area) => {
      console.log(`Processing area: ${area} with ${packagesByArea[area].length} packages`);
      const areaPackages = packagesByArea[area].sort(
        (a, b) => b.priority - a.priority
      );
      sortedPackages.push(...areaPackages);
    });
  } else if (strategy === "fill-rate-balancing") {
    // Sort by volume (largest first) for better space utilization
    sortedPackages.sort((a, b) => {
      const volA = calculateVolume(a.size.width, a.size.height, a.size.depth);
      const volB = calculateVolume(b.size.width, b.size.height, b.size.depth);
      return volB - volA;
    });
    console.log("Sorted packages by volume");
  }

  // ---- PACKAGE ASSIGNMENT TO VANS ---- //
  sortedPackages.forEach((pkg) => {
    const pkgVolume = calculateVolume(
      pkg.size.width,
      pkg.size.height,
      pkg.size.depth
    );

    let targetVan: Van | null = null;

    if (strategy === "deadline-first") {
      // For deadline-first, choose van with fewest packages
      targetVan = updatedVans.reduce((best, current) => {
        const canFitWeight = current.currentLoad.weight + pkg.weight <= current.capacity.weight;
        const canFitVolume = current.currentLoad.volume + pkgVolume <= current.capacity.volume;
        
        if (!canFitWeight || !canFitVolume) return best;
        if (!best) return current;
        
        return current.packages.length < best.packages.length ? current : best;
      }, null as Van | null);
      
    } else if (strategy === "route-optimization") {
      // For route optimization, match package area with van route name
      const addressParts = pkg.destination.address.split(",");
      const cityIndex = Math.max(0, addressParts.length - 2);
      const area = addressParts[cityIndex]?.trim() || "";
      
      console.log(`Finding van match for package area: ${area}`);
      
      // First try: match by area name
      const areaMatchVans = updatedVans.filter(van => {
        const vanNameLower = van.route.name.toLowerCase();
        const areaLower = area.toLowerCase();
        const isMatch = vanNameLower.includes(areaLower) || 
                        areaLower.includes(vanNameLower.replace(" route", ""));
        
        const canFitWeight = van.currentLoad.weight + pkg.weight <= van.capacity.weight;
        const canFitVolume = van.currentLoad.volume + pkgVolume <= van.capacity.volume;
        
        return isMatch && canFitWeight && canFitVolume;
      });
      
      if (areaMatchVans.length > 0) {
        // If we have area matches, pick the one with most available space
        targetVan = areaMatchVans.reduce((best, current) => {
          if (!best) return current;
          
          const bestRemaining = best.capacity.volume - best.currentLoad.volume;
          const currentRemaining = current.capacity.volume - current.currentLoad.volume;
          return currentRemaining > bestRemaining ? current : best;
        }, null as Van | null);
        
        console.log(`Found van match by area: ${targetVan?.route.name}`);
      } else {
        // No area match, use any van with capacity
        targetVan = updatedVans.reduce((best, current) => {
          const canFitWeight = current.currentLoad.weight + pkg.weight <= current.capacity.weight;
          const canFitVolume = current.currentLoad.volume + pkgVolume <= current.capacity.volume;
          
          if (!canFitWeight || !canFitVolume) return best;
          if (!best) return current;
          
          const bestRemaining = best.capacity.volume - best.currentLoad.volume;
          const currentRemaining = current.capacity.volume - current.currentLoad.volume;
          return currentRemaining > bestRemaining ? current : best;
        }, null as Van | null);
        
        console.log(`No area match found, using van: ${targetVan?.route.name}`);
      }
      
    } else if (strategy === "fill-rate-balancing") {
      // For fill rate balancing, evenly distribute load
      // First find vans with available capacity
      const availableVans = updatedVans.filter(van => 
        van.currentLoad.weight + pkg.weight <= van.capacity.weight &&
        van.currentLoad.volume + pkgVolume <= van.capacity.volume
      );
      
      if (availableVans.length > 0) {
        // Find van with lowest current fill percentage
        targetVan = availableVans.reduce((best, current) => {
          if (!best) return current;
          
          const bestFillPct = best.currentLoad.volume / best.capacity.volume;
          const currentFillPct = current.currentLoad.volume / current.capacity.volume;
          
          return currentFillPct < bestFillPct ? current : best;
        }, null as Van | null);
      }
    }

    if (targetVan) {
      targetVan.packages.push(pkg);
      targetVan.currentLoad.weight += pkg.weight;
      targetVan.currentLoad.volume += pkgVolume;
      targetVan.currentLoad.packageCount += 1;
      console.log(`Assigned package ${pkg.id} to van ${targetVan.id} (${targetVan.route.name})`);
    } else {
      console.log(`Could not assign package ${pkg.id} to any van`);
    }
  });

  // ---- METRICS ---- //
  const now = new Date();
  const assignedPackages = updatedVans.flatMap((van) => van.packages);
  const totalAssigned = assignedPackages.length;

  const avgETA =
    assignedPackages.reduce((sum, pkg) => {
      return sum + calculateETA(now, pkg.deliveryWindow.end);
    }, 0) / (totalAssigned || 1);

  const totalVanCapacity = updatedVans.reduce(
    (sum, van) => sum + van.capacity.volume,
    0
  );
  const totalVanUsed = updatedVans.reduce(
    (sum, van) => sum + van.currentLoad.volume,
    0
  );
  const fillPercentage = calculateFillPercentage(
    totalVanUsed,
    totalVanCapacity
  );

  const cutoffTime = now.getTime() + 3600000; // 1 hour from now (in milliseconds)
  const remainingPackages = pkgs.filter(
    (p) => !assignedPackages.some((ap) => ap.id === p.id)
  );
  const missedDeadlines = remainingPackages.filter(
    (p) => new Date(p.deliveryWindow.end).getTime() < cutoffTime
  ).length;

  const updatedMetrics: Metrics = {
    averageDeliveryETA: Math.round(avgETA),
    vanFillPercentage: Math.round(fillPercentage),
    missedDeadlines,
    totalPackagesLoaded: totalAssigned,
    totalPackagesQueued: pkgs.length - totalAssigned,
    totalDistance: 0
  };

  console.log(`Optimization complete. Metrics:`, updatedMetrics);

  return {
    vans: updatedVans,
    metrics: updatedMetrics,
    unassignedPackages: remainingPackages,
  };
};

const createEmptyMetrics = (): Metrics => {
  return {
    averageDeliveryETA: 0,
    vanFillPercentage: 0,
    missedDeadlines: 0,
    totalPackagesLoaded: 0,
    totalPackagesQueued: 0,
  };
};