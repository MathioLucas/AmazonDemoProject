import {
  calculateVolume,
  cmToLiters,
  calculateETA,
} from "src/utils/helpers.ts";
import {
  calculateDistance,
  calculateCenterPoint,
  clusterCoordinates,
  calculateRoute,
  calculateRouteDistance,
  estimateFuelConsumption,
  estimateTravelTime,
  Coordinate,
} from "src/utils/geospatialUtils.ts";
import {
  OptimizationStrategy,
  Package,
  Van,
  VanAssignment,
  PerformanceMetrics,
} from "src/types.ts";

/**
 * Main optimization function that delegates to specific strategy implementations
 */
export const optimizeLoading = (
  strategy: OptimizationStrategy,
  packages: Package[],
  vans: Van[]
): {
  vanAssignments: VanAssignment[];
  performanceMetrics: PerformanceMetrics;
} => {
  switch (strategy) {
    case "deadline-first":
      return optimizeDeadlineFirst(packages, vans);
    case "route-optimization":
      return optimizeRouteEfficiency(packages, vans);
    case "fill-rate-balancing":
      return optimizeFillRateBalancing(packages, vans);
    default:
      throw new Error(`Unknown optimization strategy: ${strategy}`);
  }
};

/**
 * Deadline-First optimization strategy
 * Prioritizes packages with earliest delivery deadlines
 */
const optimizeDeadlineFirst = (packages: Package[], vans: Van[]) => {
  console.log("Running deadline-first optimization...");

  // Sort packages by deadline (ascending)
  const sortedPackages = [...packages].sort(
    (a, b) =>
      new Date(a.deliveryDeadline).getTime() -
      new Date(b.deliveryDeadline).getTime()
  );

  // Initialize van assignments
  const vanAssignments = vans.map((van) => ({
    van,
    packages: [],
    volumeUsed: 0,
    weightUsed: 0,
    route: [] as Coordinate[],
    estimatedTravelTime: 0,
    estimatedDistance: 0,
    priority: 0,
  }));

  // Group packages by urgency (high, medium, low)
  const now = new Date();
  const urgentPackages = sortedPackages.filter(
    (pkg) => calculateETA(now, pkg.deliveryDeadline) <= 60 // Within 1 hour
  );
  const standardPackages = sortedPackages.filter((pkg) => {
    const eta = calculateETA(now, pkg.deliveryDeadline);
    return eta > 60 && eta <= 180; // 1-3 hours
  });
  const nonUrgentPackages = sortedPackages.filter(
    (pkg) => calculateETA(now, pkg.deliveryDeadline) > 180 // Over 3 hours
  );

  // Process packages by urgency level
  [urgentPackages, standardPackages, nonUrgentPackages].forEach(
    (pkgGroup, priorityLevel) => {
      pkgGroup.forEach((pkg) => {
        // Find best van with available capacity
        let bestVanIndex = -1;
        let bestVanScore = -Infinity;

        vanAssignments.forEach((assignment, index) => {
          const van = assignment.van;
          const pkgVolume = cmToLiters(
            calculateVolume(pkg.width, pkg.weight, pkg.depth)
          );

          // Check if van has capacity
          if (assignment.volumeUsed + pkgVolume <= van.capacity) {
            // Score based on remaining capacity (prefer vans with less remaining capacity)
            // But prioritize vans that already have packages of the same priority
            let score = -1 * (van.capacity - assignment.volumeUsed);
            if (
              assignment.priority === priorityLevel &&
              assignment.packages.length > 0
            ) {
              score += 1000; // Strongly prefer vans with same priority packages
            }

            if (score > bestVanScore) {
              bestVanScore = score;
              bestVanIndex = index;
            }
          }
        });

        // Assign package to best van if found
        if (bestVanIndex !== -1) {
          const assignment = vanAssignments[bestVanIndex];
          const pkgVolume = cmToLiters(
            calculateVolume(pkg.width, pkg.height, pkg.depth)
          );

          assignment.packages.push(pkg);
          assignment.volumeUsed += pkgVolume;
          assignment.weightUsed += pkg.weight;

          // Update priority if this is the first package
          if (assignment.packages.length === 1) {
            assignment.priority = priorityLevel;
          }
        }
      });
    }
  );

  // Calculate routes and metrics for each van
  vanAssignments.forEach((assignment) => {
    if (assignment.packages.length > 0) {
      // Generate a route for the packages
      const coordinates = assignment.packages.map((pkg) => pkg.coordinates);
      const depot = { lat: 40.7128, lng: -74.006 }; // Example depot location

      assignment.route = [depot, ...calculateRoute(depot, coordinates), depot];
      assignment.estimatedDistance = calculateRouteDistance(assignment.route);

      // Calculate travel time based on distance
      let travelTime = 0;
      for (let i = 0; i < assignment.route.length - 1; i++) {
        travelTime += estimateTravelTime(
          assignment.route[i],
          assignment.route[i + 1]
        );
      }
      assignment.estimatedTravelTime = travelTime;
    }
  });

  // Calculate performance metrics
  const performanceMetrics = calculateDeadlineMetrics(vanAssignments, packages);

  return {
    vanAssignments,
    performanceMetrics,
  };
};

/**
 * Route Optimization strategy
 * Groups packages by delivery location to minimize travel distance
 */
const optimizeRouteEfficiency = (packages: Package[], vans: Van[]) => {
  console.log("Running route-optimization strategy...");

  // Group packages by location
  const packagePoints = packages.map((pkg) => ({
    id: pkg.id,
    coord: pkg.coordinates,
    package: pkg,
  }));

  // Create clusters of nearby delivery locations
  const clusters = clusterCoordinates(packagePoints, 3);

  // Initialize van assignments
  const vanAssignments = vans.map((van) => ({
    van,
    packages: [],
    volumeUsed: 0,
    weightUsed: 0,
    route: [] as Coordinate[],
    estimatedTravelTime: 0,
    estimatedDistance: 0,
    clusters: [] as number[],
  }));

  // Assign clusters to vans
  clusters.forEach((cluster, clusterIndex) => {
    // Calculate total volume and weight of this cluster
    const clusterVolume = cluster.reduce((sum, point) => {
      const pkg = point.package;
      return (
        sum + cmToLiters(calculateVolume(pkg.width, pkg.height, pkg.depth))
      );
    }, 0);

    const clusterWeight = cluster.reduce((sum, point) => {
      return sum + point.package.weight;
    }, 0);

    // Find best van with available capacity
    let bestVanIndex = -1;
    let bestScore = -Infinity;

    vanAssignments.forEach((assignment, vanIndex) => {
      // Check if van has capacity
      if (
        assignment.volumeUsed + clusterVolume <= assignment.van.capacity &&
        assignment.weightUsed + clusterWeight <= assignment.van.maxWeight
      ) {
        // Score based on current route proximity to this cluster
        let score = -1 * assignment.volumeUsed; // Base score favors fuller vans

        if (assignment.clusters.length > 0) {
          // If van already has clusters, calculate proximity bonus
          const existingClusters = assignment.clusters.map(
            (idx) => clusters[idx]
          );
          const existingPoints = existingClusters.flat();
          const existingCenter = calculateCenterPoint(
            existingPoints.map((p) => p.coord)
          );
          const clusterCenter = calculateCenterPoint(
            cluster.map((p) => p.coord)
          );

          const proximityScore =
            100 -
            Math.min(100, calculateDistance(existingCenter, clusterCenter) * 5);
          score += proximityScore;
        }

        if (score > bestScore) {
          bestScore = score;
          bestVanIndex = vanIndex;
        }
      }
    });

    // Assign cluster to best van if found
    if (bestVanIndex !== -1) {
      const assignment = vanAssignments[bestVanIndex];

      // Add all packages from this cluster
      cluster.forEach((point) => {
        const pkg = point.package;
        assignment.packages.push(pkg);
        assignment.volumeUsed += cmToLiters(
          calculateVolume(pkg.width, pkg.height, pkg.depth)
        );
        assignment.weightUsed += pkg.weight;
      });

      assignment.clusters.push(clusterIndex);
    }
  });

  // Calculate optimal routes for each van
  const depot = { lat: 40.7128, lng: -74.006 }; // Example depot location

  vanAssignments.forEach((assignment) => {
    if (assignment.packages.length > 0) {
      // Get coordinates for all packages
      const coordinates = assignment.packages.map((pkg) => pkg.coordinates);

      // Calculate optimal route
      assignment.route = [depot, ...calculateRoute(depot, coordinates), depot];
      assignment.estimatedDistance = calculateRouteDistance(assignment.route);

      // Calculate estimated travel time
      let travelTime = 0;
      for (let i = 0; i < assignment.route.length - 1; i++) {
        travelTime += estimateTravelTime(
          assignment.route[i],
          assignment.route[i + 1]
        );
      }
      assignment.estimatedTravelTime = travelTime;
    }
  });

  // Calculate performance metrics
  const performanceMetrics = calculateRouteMetrics(vanAssignments, packages);

  return {
    vanAssignments,
    performanceMetrics,
  };
};

/**
 * Fill Rate Balancing strategy
 * Maximizes van space utilization by balancing load across all vans
 */
const optimizeFillRateBalancing = (packages: Package[], vans: Van[]) => {
  console.log("Running fill-rate-balancing strategy...");

  // Calculate volume for each package and sort by volume (largest first)
  const packageData = packages
    .map((pkg) => {
      const volume = cmToLiters(
        calculateVolume(pkg.width, pkg.height, pkg.depth)
      );
      return {
        package: pkg,
        volume,
        volumeDensity: volume / pkg.weight,
      };
    })
    .sort((a, b) => b.volume - a.volume);

  // Initialize van assignments
  const vanAssignments = vans.map((van) => ({
    van,
    packages: [],
    volumeUsed: 0,
    weightUsed: 0,
    route: [] as Coordinate[],
    estimatedTravelTime: 0,
    estimatedDistance: 0,
    fillRate: 0,
  }));

  // First pass: assign largest packages using best-fit decreasing algorithm
  packageData.forEach((pkgData) => {
    const pkg = pkgData.package;

    // Find van with best fit (minimize wasted space)
    let bestVanIndex = -1;
    let minRemainingSpace = Infinity;

    vanAssignments.forEach((assignment, index) => {
      const remainingSpace = assignment.van.capacity - assignment.volumeUsed;

      // Check if package fits and find best fit
      if (
        pkgData.volume <= remainingSpace &&
        remainingSpace < minRemainingSpace
      ) {
        minRemainingSpace = remainingSpace;
        bestVanIndex = index;
      }
    });

    // If no van found with best-fit, use the one with most available space
    if (bestVanIndex === -1) {
      let maxSpace = -1;

      vanAssignments.forEach((assignment, index) => {
        const remainingSpace = assignment.van.capacity - assignment.volumeUsed;

        if (pkgData.volume <= remainingSpace && remainingSpace > maxSpace) {
          maxSpace = remainingSpace;
          bestVanIndex = index;
        }
      });
    }

    // Assign package to best van if found
    if (bestVanIndex !== -1) {
      const assignment = vanAssignments[bestVanIndex];

      assignment.packages.push(pkg);
      assignment.volumeUsed += pkgData.volume;
      assignment.weightUsed += pkg.weight;
      assignment.fillRate =
        (assignment.volumeUsed / assignment.van.capacity) * 100;
    }
  });

  // Second pass: balance fill rates by moving packages between vans
  let balancingIterations = 0;
  const maxIterations = 10;
  let improved = true;

  while (improved && balancingIterations < maxIterations) {
    improved = false;
    balancingIterations++;

    // Calculate average fill rate
    const totalFillRate = vanAssignments.reduce(
      (sum, a) => sum + a.fillRate,
      0
    );
    const avgFillRate = totalFillRate / vanAssignments.length;

    // Find most and least filled vans
    vanAssignments.sort((a, b) => b.fillRate - a.fillRate);

    const mostFilled = vanAssignments[0];
    const leastFilled = vanAssignments[vanAssignments.length - 1];

    // Try to move packages from most filled to least filled
    if (mostFilled.fillRate - leastFilled.fillRate > 15) {
      // Only balance if difference is significant
      // Find candidate packages to move (try smaller packages first)
      const candidatePackages = [...mostFilled.packages]
        .map((pkg) => {
          const volume = cmToLiters(
            calculateVolume(pkg.width, pkg.height, pkg.depth)
          );
          return { pkg, volume };
        })
        .sort((a, b) => a.volume - b.volume);

      // Try to find a package that improves balance
      for (const candidate of candidatePackages) {
        const pkg = candidate.pkg;
        const volume = candidate.volume;

        // Check if moving this package improves balance
        if (leastFilled.volumeUsed + volume <= leastFilled.van.capacity) {
          const newMostFilledRate =
            ((mostFilled.volumeUsed - volume) / mostFilled.van.capacity) * 100;
          const newLeastFilledRate =
            ((leastFilled.volumeUsed + volume) / leastFilled.van.capacity) *
            100;

          const currentDiff =
            Math.abs(mostFilled.fillRate - avgFillRate) +
            Math.abs(leastFilled.fillRate - avgFillRate);
          const newDiff =
            Math.abs(newMostFilledRate - avgFillRate) +
            Math.abs(newLeastFilledRate - avgFillRate);

          if (newDiff < currentDiff) {
            // Move package
            const pkgIndex = mostFilled.packages.findIndex(
              (p) => p.id === pkg.id
            );
            if (pkgIndex !== -1) {
              // Remove from most filled
              mostFilled.packages.splice(pkgIndex, 1);
              mostFilled.volumeUsed -= volume;
              mostFilled.weightUsed -= pkg.weight;
              mostFilled.fillRate =
                (mostFilled.volumeUsed / mostFilled.van.capacity) * 100;

              // Add to least filled
              leastFilled.packages.push(pkg);
              leastFilled.volumeUsed += volume;
              leastFilled.weightUsed += pkg.weight;
              leastFilled.fillRate =
                (leastFilled.volumeUsed / leastFilled.van.capacity) * 100;

              improved = true;
              break;
            }
          }
        }
      }
    }
  }

  // Calculate routes and metrics
  const depot = { lat: 40.7128, lng: -74.006 }; // Example depot location

  vanAssignments.forEach((assignment) => {
    if (assignment.packages.length > 0) {
      // Get coordinates for all packages
      const coordinates = assignment.packages.map((pkg) => pkg.coordinates);

      // Calculate route (less optimized for this strategy)
      assignment.route = [depot, ...coordinates, depot];
      assignment.estimatedDistance = calculateRouteDistance(assignment.route);

      // Calculate estimated travel time
      let travelTime = 0;
      for (let i = 0; i < assignment.route.length - 1; i++) {
        travelTime += estimateTravelTime(
          assignment.route[i],
          assignment.route[i + 1]
        );
      }
      assignment.estimatedTravelTime = travelTime;
    }
  });

  // Calculate performance metrics
  const performanceMetrics = calculateFillRateMetrics(vanAssignments, packages);

  return {
    vanAssignments,
    performanceMetrics,
  };
};

/**
 * Calculate performance metrics for Deadline-First strategy
 */
const calculateDeadlineMetrics = (
  vanAssignments: VanAssignment[],
  allPackages: Package[]
): PerformanceMetrics => {
  const now = new Date();
  const assignedPackages = vanAssignments.flatMap((a) => a.packages);

  // Basic metrics
  const totalPackages = assignedPackages.length;
  const totalDistance = vanAssignments.reduce(
    (sum, a) => sum + a.estimatedDistance,
    0
  );
  const totalVolume = vanAssignments.reduce((sum, a) => sum + a.volumeUsed, 0);
  const totalVanCapacity = vanAssignments.reduce(
    (sum, a) => sum + a.van.capacity,
    0
  );

  // Strategy-specific metrics
  let totalMinutesToDeadline = 0;
  let packagesOnTime = 0;
  let urgentPackagesDelivered = 0;

  assignedPackages.forEach((pkg) => {
    const eta = calculateETA(now, pkg.deliveryDeadline);
    totalMinutesToDeadline += eta;

    // Estimate delivery time
    const van = vanAssignments.find((a) =>
      a.packages.some((p) => p.id === pkg.id)
    );
    if (van) {
      // Simple estimation: package will be delivered after travel time
      const deliveryTime = now.getTime() + van.estimatedTravelTime * 60 * 1000;
      const deadlineTime = new Date(pkg.deliveryDeadline).getTime();

      if (deliveryTime <= deadlineTime) {
        packagesOnTime++;
      }

      // Count urgent packages (deadline within 1 hour)
      if (eta <= 60) {
        urgentPackagesDelivered++;
      }
    }
  });

  const unassignedPackages = allPackages.length - assignedPackages.length;
  const averageTimeToDeadline = totalMinutesToDeadline / totalPackages;
  const onTimeDeliveryRate = (packagesOnTime / totalPackages) * 100;
  const averageFillRate = (totalVolume / totalVanCapacity) * 100;

  return {
    totalPackagesDelivered: totalPackages,
    unassignedPackages,
    totalDistance,
    averageFillRate,
    onTimeDeliveryRate,
    totalTime: vanAssignments.reduce(
      (sum, a) => sum + a.estimatedTravelTime,
      0
    ),
    vanUtilization:
      (vanAssignments.filter((a) => a.packages.length > 0).length /
        vanAssignments.length) *
      100,
    // Strategy-specific metrics
    averageTimeToDeadline,
    urgentPackageRatio: (urgentPackagesDelivered / totalPackages) * 100,
    earlyDeliveryBonus: Math.max(
      0,
      (packagesOnTime / totalPackages) * 100 - 80
    ), // Bonus for delivering packages early
    strategyType: "deadline-first" as OptimizationStrategy,
  };
};

/**
 * Calculate performance metrics for Route Optimization strategy
 */
const calculateRouteMetrics = (
  vanAssignments: VanAssignment[],
  allPackages: Package[]
): PerformanceMetrics => {
  const now = new Date();
  const assignedPackages = vanAssignments.flatMap((a) => a.packages);

  // Basic metrics
  const totalPackages = assignedPackages.length;
  const totalDistance = vanAssignments.reduce(
    (sum, a) => sum + a.estimatedDistance,
    0
  );
  const totalVolume = vanAssignments.reduce((sum, a) => sum + a.volumeUsed, 0);
  const totalVanCapacity = vanAssignments.reduce(
    (sum, a) => sum + a.van.capacity,
    0
  );

  // Calculate on-time deliveries
  let packagesOnTime = 0;

  assignedPackages.forEach((pkg) => {
    // Estimate delivery time
    const van = vanAssignments.find((a) =>
      a.packages.some((p) => p.id === pkg.id)
    );
    if (van) {
      // Simple estimation: package will be delivered after travel time
      const deliveryTime = now.getTime() + van.estimatedTravelTime * 60 * 1000;
      const deadlineTime = new Date(pkg.deliveryDeadline).getTime();

      if (deliveryTime <= deadlineTime) {
        packagesOnTime++;
      }
    }
  });

  // Calculate fuel consumption
  const totalFuelConsumption = vanAssignments.reduce((sum, a) => {
    return (
      sum +
      estimateFuelConsumption(
        a.estimatedDistance,
        a.van.capacity < 1000
          ? "small"
          : a.van.capacity < 2000
          ? "medium"
          : "large"
      )
    );
  }, 0);

  // Estimate standard fuel consumption (without route optimization)
  const standardDistance = totalDistance * 1.3; // Assume 30% more distance without optimization
  const standardFuelConsumption = vanAssignments.reduce((sum, a) => {
    return (
      sum +
      estimateFuelConsumption(
        a.estimatedDistance * 1.3,
        a.van.capacity < 1000
          ? "small"
          : a.van.capacity < 2000
          ? "medium"
          : "large"
      )
    );
  }, 0);

  const fuelSavingsPercentage =
    ((standardFuelConsumption - totalFuelConsumption) /
      standardFuelConsumption) *
    100;
  const averageDistancePerPackage = totalDistance / totalPackages;
  const unassignedPackages = allPackages.length - assignedPackages.length;
  const averageFillRate = (totalVolume / totalVanCapacity) * 100;
  const onTimeDeliveryRate = (packagesOnTime / totalPackages) * 100;

  return {
    totalPackagesDelivered: totalPackages,
    unassignedPackages,
    totalDistance,
    averageFillRate,
    onTimeDeliveryRate,
    totalTime: vanAssignments.reduce(
      (sum, a) => sum + a.estimatedTravelTime,
      0
    ),
    vanUtilization:
      (vanAssignments.filter((a) => a.packages.length > 0).length /
        vanAssignments.length) *
      100,
    // Strategy-specific metrics
    routeEfficiencyScore: 100 - (totalDistance / standardDistance) * 100,
    averageDistancePerPackage,
    fuelSavingsPercentage,
    fuelConsumption: totalFuelConsumption,
    strategyType: "route-optimization" as OptimizationStrategy,
  };
};

/**
 * Calculate performance metrics for Fill Rate Balancing strategy
 */
const calculateFillRateMetrics = (
  vanAssignments: VanAssignment[],
  allPackages: Package[]
): PerformanceMetrics => {
  const now = new Date();
  const assignedPackages = vanAssignments.flatMap((a) => a.packages);

  // Basic metrics
  const totalPackages = assignedPackages.length;
  const totalDistance = vanAssignments.reduce(
    (sum, a) => sum + a.estimatedDistance,
    0
  );
  const totalVolume = vanAssignments.reduce((sum, a) => sum + a.volumeUsed, 0);
  const totalVanCapacity = vanAssignments.reduce(
    (sum, a) => sum + a.van.capacity,
    0
  );

  // Calculate on-time deliveries
  let packagesOnTime = 0;

  assignedPackages.forEach((pkg) => {
    // Estimate delivery time
    const van = vanAssignments.find((a) =>
      a.packages.some((p) => p.id === pkg.id)
    );
    if (van) {
      // Simple estimation: package will be delivered after travel time
      const deliveryTime = now.getTime() + van.estimatedTravelTime * 60 * 1000;
      const deadlineTime = new Date(pkg.deliveryDeadline).getTime();

      if (deliveryTime <= deadlineTime) {
        packagesOnTime++;
      }
    }
  });

  // Calculate van fill rates
  const vanFillRates = vanAssignments.map((a) => a.fillRate);
  const averageFillRate = (totalVolume / totalVanCapacity) * 100;

  // Calculate fill rate variance (lower is better)
  let fillRateVariance = 0;
  if (vanAssignments.length > 1) {
    const sumSquaredDifferences = vanFillRates.reduce((sum, rate) => {
      return sum + Math.pow(rate - averageFillRate, 2);
    }, 0);
    fillRateVariance = sumSquaredDifferences / vanAssignments.length;
  }

  // Calculate fill rate distribution score (higher is better)
  const fillRateBalanceScore =
    100 - Math.min(100, Math.sqrt(fillRateVariance) * 2);

  // Calculate wasted space
  const totalWastedSpace = totalVanCapacity - totalVolume;
  const wastedSpaceRatio = (totalWastedSpace / totalVanCapacity) * 100;

  // Calculate loading efficiency
  const packingDensity = totalVolume / totalPackages;

  // Calculate standard metrics
  const unassignedPackages = allPackages.length - assignedPackages.length;
  const onTimeDeliveryRate = (packagesOnTime / totalPackages) * 100;

  return {
    totalPackagesDelivered: totalPackages,
    unassignedPackages,
    totalDistance,
    averageFillRate,
    onTimeDeliveryRate,
    totalTime: vanAssignments.reduce(
      (sum, a) => sum + a.estimatedTravelTime,
      0
    ),
    vanUtilization:
      (vanAssignments.filter((a) => a.packages.length > 0).length /
        vanAssignments.length) *
      100,
    // Strategy-specific metrics
    fillRateBalanceScore,
    fillRateVariance,
    wastedSpaceRatio,
    packingDensity,
    loadDistributionIndex: Math.max(
      0,
      100 - (unassignedPackages / allPackages.length) * 100
    ),
    strategyType: "fill-rate-balancing" as OptimizationStrategy,
  };
};
