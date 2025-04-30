// src/context/AppContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import {
  AppContextType,
  Package,
  Van,
  OptimizationStrategy,
  Metrics,
  PackageStatus,
} from "src/types";
import { mockPackages, mockVans, initialMetrics } from "src/data/mockData";
import { DeliveryPoint, VanRoute } from "../components/RouteSimulation";
import { optimizeRoute } from "../components/MapUtils";

// Create context with default values
const AppContext = createContext<AppContextType>({
  packages: [],
  vans: [],
  queuedPackages: [],
  currentStrategy: "deadline-first",
  metrics: initialMetrics,
  loading: false,
  vanRoutes: [], // Add vanRoutes to default context
  fetchPackages: async () => {},
  fetchVans: async () => {},
  optimizeLoading: async () => {},
  assignPackageToVan: () => {},
  unassignPackage: () => {},
  resetMetrics: () => {},
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [vans, setVans] = useState<Van[]>([]);
  const [queuedPackages, setQueuedPackages] = useState<Package[]>([]);
  const [currentStrategy, setCurrentStrategy] =
    useState<OptimizationStrategy>("deadline-first");
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [loading, setLoading] = useState(false);
  const [vanRoutes, setVanRoutes] = useState<VanRoute[]>([]); // Add vanRoutes state

  // Define van colors for consistent route display
  const VAN_COLORS = [
    "#3498db", // Blue
    "#e74c3c", // Red
    "#2ecc71", // Green
    "#f39c12", // Orange
    "#9b59b6", // Purple
    "#1abc9c", // Teal
  ];

  // District coordinates mapping for visualization
  const DISTRICT_COORDINATES: Record<string, { x: number; y: number }> = {
    "District A": { x: 100, y: 100 },
    "District B": { x: 200, y: 150 },
    "District C": { x: 300, y: 100 },
    "District D": { x: 150, y: 250 },
    "District E": { x: 250, y: 300 },
    "District F": { x: 350, y: 250 },
    Warehouse: { x: 225, y: 200 },
  };

  // Generate a slightly random point within district area
  const getRandomPointInDistrict = (
    district: string
  ): { x: number; y: number } => {
    const baseCoords =
      DISTRICT_COORDINATES[district] || DISTRICT_COORDINATES["Warehouse"];
    return {
      x: baseCoords.x + (Math.random() * 40 - 20),
      y: baseCoords.y + (Math.random() * 40 - 20),
    };
  };

  // New function to generate routes based on van assignments
  const generateVanRoutes = (
    updatedVans: Van[],
    updatedPackages?: Package[]
  ) => {
    const newRoutes: VanRoute[] = updatedVans.map((van, index) => {
      // Create delivery points from assigned packages
      const stops: DeliveryPoint[] = van.packages.map((pkg) => {
        return {
          packageId: pkg.id,
          districtId: pkg.district || "Unknown", // Use district from package
          coordinates: getRandomPointInDistrict(pkg.district || "Unknown"),
        };
      });

      // Add warehouse as first and last stop
      const routeWithWarehouse = [
        {
          packageId: "warehouse-start",
          districtId: "Warehouse",
          coordinates: DISTRICT_COORDINATES["Warehouse"],
        },
        ...stops,
        {
          packageId: "warehouse-end",
          districtId: "Warehouse",
          coordinates: DISTRICT_COORDINATES["Warehouse"],
        },
      ];

      return {
        vanId: van.id,
        stops: routeWithWarehouse,
        color: VAN_COLORS[index % VAN_COLORS.length],
      };
    });

    setVanRoutes(newRoutes);
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      // First check if API endpoint exists and returns valid JSON
      const response = await fetch("/api/packages");

      // Check if response is valid
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      // Try to parse as JSON - will throw if not valid JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API didn't return JSON");
      }

      const data = await response.json();
      setPackages(data);
      updateQueuedPackages(data);
    } catch (error) {
      console.log("Using mock package data due to API error:", error);
      // Use mock data instead of logging the error
      setPackages(mockPackages);
      updateQueuedPackages(mockPackages);
    } finally {
      setLoading(false);
    }
  };

  const fetchVans = async () => {
    setLoading(true);
    try {
      // First check if API endpoint exists and returns valid JSON
      const response = await fetch("/api/vans");

      // Check if response is valid
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      // Try to parse as JSON - will throw if not valid JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API didn't return JSON");
      }

      const data = await response.json();
      setVans(data);
    } catch (error) {
      console.log("Using mock van data due to API error:", error);
      // Use mock data instead of logging the error
      setVans(mockVans);
    } finally {
      setLoading(false);
    }
  };

  // Add this new reset metrics function
  const resetMetrics = () => {
    setMetrics({
      averageDeliveryETA: 0,
      vanFillPercentage: 0,
      missedDeadlines: 0,
      totalPackagesLoaded: 0,
      totalPackagesQueued: 0,
      totalDistance: 0,
    });
    // Also reset routes when metrics are reset
    setVanRoutes([]);
  };

  const optimizeLoading = async (strategy: OptimizationStrategy) => {
    setLoading(true);
    setCurrentStrategy(strategy);
    resetMetrics(); // Reset metrics when changing strategy

    console.log(`Starting optimization with strategy: ${strategy}`);
    console.log(`Queued packages: ${queuedPackages.length}`);
    console.log(`Vans: ${vans.length}`);

    try {
      // Ensure we're sending proper data
      if (queuedPackages.length === 0) {
        console.log("No packages to optimize, skipping API call");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packages: queuedPackages,
          vans,
          strategy,
        }),
      });

      // Check if response is valid
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      // Try to parse as JSON - will throw if not valid JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API didn't return JSON");
      }

      const data = await response.json();
      console.log("Optimization response received:", data);

      setVans(data.vans);

      const updatedPackages: Package[] = packages.map((pkg) => {
        const vanWithPackage = data.vans.find((van: Van) =>
          van.packages.some((p: Package) => p.id === pkg.id)
        );
        if (vanWithPackage) {
          return { ...pkg, status: "assigned" as PackageStatus };
        }
        return pkg;
      });

      setPackages(updatedPackages);
      updateQueuedPackages(updatedPackages);

      // If the API doesn't return totalDistance, add it
      if (!data.metrics.totalDistance) {
        data.metrics.totalDistance = calculateDistance(data.vans);
      }

      setMetrics(data.metrics);

      // Generate route visualization data after optimization
      generateVanRoutes(data.vans, updatedPackages);
    } catch (error) {
      console.log("Falling back to mock optimization:", error);

      const mockOptimized = mockOptimizeLoading(queuedPackages, vans, strategy);
      setVans(mockOptimized.vans);

      const updatedPackages: Package[] = packages.map((pkg) => {
        const vanWithPackage = mockOptimized.vans.find((van) =>
          van.packages.some((p) => p.id === pkg.id)
        );
        if (vanWithPackage) {
          return { ...pkg, status: "assigned" as PackageStatus };
        }
        return pkg;
      });

      setPackages(updatedPackages);
      updateQueuedPackages(updatedPackages);
      setMetrics(mockOptimized.metrics);

      // Generate route visualization data after mock optimization
      generateVanRoutes(mockOptimized.vans, updatedPackages);
    } finally {
      setLoading(false);
    }
  };

  const assignPackageToVan = (packageId: string, vanId: string) => {
    const packageToAssign = packages.find((p) => p.id === packageId);
    if (!packageToAssign) return;

    const updatedVans = vans.map((van) => {
      if (van.id === vanId) {
        const volume =
          packageToAssign.size.width *
          packageToAssign.size.height *
          packageToAssign.size.depth;

        return {
          ...van,
          packages: [...van.packages, packageToAssign],
          currentLoad: {
            weight: van.currentLoad.weight + packageToAssign.weight,
            volume: van.currentLoad.volume + volume,
            packageCount: van.currentLoad.packageCount + 1,
          },
        };
      }
      return van;
    });

    setVans(updatedVans);

    const updatedPackages = packages.map((pkg) =>
      pkg.id === packageId
        ? { ...pkg, status: "assigned" as PackageStatus }
        : pkg
    );

    setPackages(updatedPackages);
    updateQueuedPackages(updatedPackages);
    updateMetrics(updatedPackages, updatedVans);

    // Update routes after manual assignment
    generateVanRoutes(updatedVans, updatedPackages);
  };

  const unassignPackage = (packageId: string) => {
    const packageToUnassign = packages.find((p) => p.id === packageId);
    if (!packageToUnassign) return;

    const vanWithPackage = vans.find((van) =>
      van.packages.some((p) => p.id === packageId)
    );
    if (!vanWithPackage) return;

    const updatedVans = vans.map((van) => {
      if (van.id === vanWithPackage.id) {
        const volume =
          packageToUnassign.size.width *
          packageToUnassign.size.height *
          packageToUnassign.size.depth;

        return {
          ...van,
          packages: van.packages.filter((p) => p.id !== packageId),
          currentLoad: {
            weight: van.currentLoad.weight - packageToUnassign.weight,
            volume: van.currentLoad.volume - volume,
            packageCount: van.currentLoad.packageCount - 1,
          },
        };
      }
      return van;
    });

    setVans(updatedVans);

    const updatedPackages = packages.map((pkg) =>
      pkg.id === packageId ? { ...pkg, status: "queued" as PackageStatus } : pkg
    );

    setPackages(updatedPackages);
    updateQueuedPackages(updatedPackages);
    updateMetrics(updatedPackages, updatedVans);

    // Update routes after manual unassignment
    generateVanRoutes(updatedVans, updatedPackages);
  };

  const updateQueuedPackages = (allPackages: Package[]) => {
    const queued = allPackages.filter((pkg) => pkg.status === "queued");
    setQueuedPackages(queued);
    setMetrics((prev) => ({
      ...prev,
      totalPackagesQueued: queued.length,
    }));
  };

  // Helper function to calculate distance for vans
  const calculateDistance = (updatedVans: Van[]): number => {
    let totalDistance = 0;
    updatedVans.forEach((van) => {
      if (van.packages.length > 0) {
        // Use route distance if available
        if (van.route && van.route.distanceKm) {
          totalDistance += van.route.distanceKm;
        } else {
          // Estimate 5km per package as fallback
          totalDistance += van.packages.length * 5;
        }
      }
    });
    return Math.round(totalDistance);
  };

  const updateMetrics = (updatedPackages: Package[], updatedVans: Van[]) => {
    const now = Date.now();
    const assigned = updatedPackages.filter((p) => p.status === "assigned");
    const totalAssigned = assigned.length;
    const totalQueued = updatedPackages.length - totalAssigned;

    const avgETA =
      assigned.reduce((sum, pkg) => {
        const end = new Date(pkg.deliveryWindow.end).getTime();
        return sum + (end - now) / 60000;
      }, 0) / (totalAssigned || 1);

    const totalCapacity = updatedVans.reduce(
      (sum, v) => sum + v.capacity.volume,
      0
    );
    const usedVolume = updatedVans.reduce(
      (sum, v) => sum + v.currentLoad.volume,
      0
    );
    const fill = (usedVolume / totalCapacity) * 100;

    // Improved missed deadlines calculation
    const missed = updatedPackages.filter(
      (p) =>
        p.status === "queued" && new Date(p.deliveryWindow.end).getTime() < now // Only count actual missed deadlines
    ).length;

    // Calculate the total distance
    const totalDistance = calculateDistance(updatedVans);

    setMetrics({
      averageDeliveryETA: Math.round(avgETA),
      vanFillPercentage: Math.round(fill),
      missedDeadlines: missed,
      totalPackagesLoaded: totalAssigned,
      totalPackagesQueued: totalQueued,
      totalDistance: totalDistance, // Add the total distance
    });
  };

  const mockOptimizeLoading = (
    pkgs: Package[],
    vanList: Van[],
    strategy: OptimizationStrategy
  ) => {
    const updatedVans = JSON.parse(JSON.stringify(vanList)) as Van[];
    let sorted = [...pkgs];

    // Clear vans to start fresh
    updatedVans.forEach((van) => {
      van.packages = [];
      van.currentLoad = { weight: 0, volume: 0, packageCount: 0 };
    });

    console.log(`Mock optimization with strategy: ${strategy}`);

    // Skip if no packages
    if (sorted.length === 0) {
      return {
        vans: updatedVans,
        metrics: {
          averageDeliveryETA: 0,
          vanFillPercentage: 0,
          missedDeadlines: 0,
          totalPackagesLoaded: 0,
          totalPackagesQueued: 0,
          totalDistance: 0, // Add totalDistance to empty metrics
        },
      };
    }

    // Sort packages according to strategy
    if (strategy === "deadline-first") {
      sorted.sort(
        (a, b) =>
          new Date(a.deliveryWindow.end).getTime() -
          new Date(b.deliveryWindow.end).getTime()
      );
    } else if (strategy === "route-optimization") {
      // Improved area extraction
      const grouped: Record<string, Package[]> = {};
      sorted.forEach((pkg) => {
        // Extract city from address
        const addressParts = pkg.destination.address.split(",");
        const cityIndex = Math.max(0, addressParts.length - 2);
        const area = addressParts[cityIndex]?.trim() || "Warehouse";

        if (!grouped[area]) grouped[area] = [];
        grouped[area].push(pkg);

        console.log(`Package ${pkg.id} assigned to area: ${area}`);
      });

      // Flatten areas back to a single array
      sorted = Object.values(grouped).flat();
    } else if (strategy === "fill-rate-balancing") {
      // Sort by volume (largest first)
      sorted.sort((a, b) => {
        const va = a.size.width * a.size.height * a.size.depth;
        const vb = b.size.width * b.size.height * b.size.depth;
        return vb - va;
      });
    }

    // Assign packages to vans based on strategy
    sorted.forEach((pkg) => {
      const pkgVolume = pkg.size.width * pkg.size.height * pkg.size.depth;
      let targetVan: Van | null = null;

      if (strategy === "deadline-first") {
        // Choose van with fewest packages
        targetVan = updatedVans.reduce((best, current) => {
          const canFitWeight =
            current.currentLoad.weight + pkg.weight <= current.capacity.weight;
          const canFitVolume =
            current.currentLoad.volume + pkgVolume <= current.capacity.volume;

          if (!canFitWeight || !canFitVolume) return best;
          if (!best) return current;

          return current.packages.length < best.packages.length
            ? current
            : best;
        }, null as Van | null);
      } else if (strategy === "route-optimization") {
        // Try to match package area to van route name
        const addressParts = pkg.destination.address.split(",");
        const cityIndex = Math.max(0, addressParts.length - 2);
        const area = addressParts[cityIndex]?.trim() || "";

        console.log(`Finding van match for area: ${area}`);

        // First try direct area matching
        const areaMatchVans = updatedVans.filter((van) => {
          const vanRouteLower = van.route.name.toLowerCase();
          const areaLower = area.toLowerCase();
          const isMatch =
            vanRouteLower.includes(areaLower) ||
            areaLower.includes(vanRouteLower.replace(" route", ""));

          const canFitWeight =
            van.currentLoad.weight + pkg.weight <= van.capacity.weight;
          const canFitVolume =
            van.currentLoad.volume + pkgVolume <= van.capacity.volume;

          return isMatch && canFitWeight && canFitVolume;
        });

        if (areaMatchVans.length > 0) {
          // If we have area matches, pick the one with most available space
          targetVan = areaMatchVans.reduce((best, current) => {
            if (!best) return current;

            const bestRemaining =
              best.capacity.volume - best.currentLoad.volume;
            const currentRemaining =
              current.capacity.volume - current.currentLoad.volume;
            return currentRemaining > bestRemaining ? current : best;
          }, null as Van | null);

          console.log(`Found van match by area: ${targetVan?.route.name}`);
        } else {
          // No area match, use any van with capacity
          targetVan = updatedVans.reduce((best, current) => {
            const canFitWeight =
              current.currentLoad.weight + pkg.weight <=
              current.capacity.weight;
            const canFitVolume =
              current.currentLoad.volume + pkgVolume <= current.capacity.volume;

            if (!canFitWeight || !canFitVolume) return best;
            if (!best) return current;

            const bestRemaining =
              best.capacity.volume - best.currentLoad.volume;
            const currentRemaining =
              current.capacity.volume - current.currentLoad.volume;
            return currentRemaining > bestRemaining ? current : best;
          }, null as Van | null);
        }
      } else if (strategy === "fill-rate-balancing") {
        // Find vans with capacity
        const availableVans = updatedVans.filter(
          (van) =>
            van.currentLoad.weight + pkg.weight <= van.capacity.weight &&
            van.currentLoad.volume + pkgVolume <= van.capacity.volume
        );

        if (availableVans.length > 0) {
          // Find van with lowest current fill percentage
          targetVan = availableVans.reduce((best, current) => {
            if (!best) return current;

            const bestFillPct = best.currentLoad.volume / best.capacity.volume;
            const currentFillPct =
              current.currentLoad.volume / current.capacity.volume;

            return currentFillPct < bestFillPct ? current : best;
          }, null as Van | null);
        }
      }

      if (targetVan) {
        targetVan.packages.push(pkg);
        targetVan.currentLoad.weight += pkg.weight;
        targetVan.currentLoad.volume += pkgVolume;
        targetVan.currentLoad.packageCount += 1;
        console.log(`Assigned package ${pkg.id} to van ${targetVan.id}`);
      } else {
        console.log(`Could not assign package ${pkg.id} to any van`);
      }
    });

    // Calculate metrics after assignment
    const assigned = updatedVans.flatMap((v) => v.packages);
    const now = Date.now();

    const avgETA =
      assigned.reduce((sum, p) => {
        const end = new Date(p.deliveryWindow.end).getTime();
        return sum + (end - now) / 60000;
      }, 0) / (assigned.length || 1);

    const totalCapacity = updatedVans.reduce(
      (sum, v) => sum + v.capacity.volume,
      0
    );
    const usedVolume = updatedVans.reduce(
      (sum, v) => sum + v.currentLoad.volume,
      0
    );
    const fill = (usedVolume / totalCapacity) * 100;

    const missed = pkgs.filter(
      (p) =>
        !assigned.some((ap) => ap.id === p.id) &&
        new Date(p.deliveryWindow.end).getTime() < now // Only count already missed deadlines
    ).length;

    // Calculate distance for the metrics
    const totalDistance = calculateDistance(updatedVans);

    const metrics: Metrics = {
      averageDeliveryETA: Math.round(avgETA),
      vanFillPercentage: Math.round(fill),
      missedDeadlines: missed,
      totalPackagesLoaded: assigned.length,
      totalPackagesQueued: pkgs.length - assigned.length,
      totalDistance: totalDistance, // Add the calculated distance
    };

    console.log("Mock optimization complete, metrics:", metrics);

    return { vans: updatedVans, metrics };
  };

  useEffect(() => {
    fetchPackages();
    fetchVans();
  }, []);

  return (
    <AppContext.Provider
      value={{
        packages,
        vans,
        queuedPackages,
        currentStrategy,
        metrics,
        loading,
        vanRoutes, // Add vanRoutes to context value
        fetchPackages,
        fetchVans,
        optimizeLoading,
        assignPackageToVan,
        unassignPackage,
        resetMetrics,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
