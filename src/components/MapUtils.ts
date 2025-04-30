import { DeliveryPoint, Coordinates } from "./RouteSimulation";

/**
 * Calculate Euclidean distance between two points
 */
export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
};

/**
 * Calculate Manhattan distance between two points (more realistic for city routes)
 */
export const calculateManhattanDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  return Math.abs(point2.x - point1.x) + Math.abs(point2.y - point1.y);
};

/**
 * Optimize route using nearest neighbor algorithm with customizable distance calculation
 * @param stops List of delivery points to optimize
 * @param useEuclidean Whether to use Euclidean (true) or Manhattan (false) distance
 * @returns Optimized route sequence
 */
export const optimizeRoute = (
  stops: DeliveryPoint[],
  useEuclidean: boolean = true
): DeliveryPoint[] => {
  // Handle edge cases
  if (stops.length <= 2) return stops;

  const result: DeliveryPoint[] = [];
  const unvisited = [...stops];

  // Extract warehouse as starting point
  const warehouseIndex = unvisited.findIndex(
    (stop) => stop.districtId === "Warehouse"
  );
  let current: DeliveryPoint;

  if (warehouseIndex >= 0) {
    current = unvisited.splice(warehouseIndex, 1)[0];
  } else {
    current = unvisited.shift()!;
  }

  // Start route from warehouse or first point
  result.push(current);

  // Select distance calculation method
  const distanceFunc = useEuclidean
    ? calculateDistance
    : calculateManhattanDistance;

  // Greedily visit nearest unvisited point
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const distance = distanceFunc(
        current.coordinates,
        unvisited[i].coordinates
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    // Visit the nearest stop
    current = unvisited[nearestIndex];
    result.push(current);
    unvisited.splice(nearestIndex, 1);
  }

  // End route back at warehouse if warehouse exists in original stops
  const warehouse = stops.find((stop) => stop.districtId === "Warehouse");
  if (
    warehouse &&
    result[0].districtId === "Warehouse" &&
    result[0] !== result[result.length - 1]
  ) {
    result.push(warehouse);
  }

  return result;
};

/**
 * Optimize route using 2-opt local search algorithm for improvement
 * Helps eliminate route crossings
 */
export const optimize2Opt = (stops: DeliveryPoint[]): DeliveryPoint[] => {
  if (stops.length <= 3) return stops;

  // Clone stops to avoid mutating input
  let bestRoute = [...stops];
  let improved = true;
  let iterations = 0;
  const maxIterations = 100; // Prevent infinite loops

  // Continue until no improvements are found or max iterations reached
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    const currentDistance = calculateRouteDistance(bestRoute);

    // Try swapping each possible pair of edges
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        // Create new route with 2-opt swap
        const newRoute = [...bestRoute];
        // Reverse the segment between i and j
        const segment = newRoute.slice(i, j + 1).reverse();
        newRoute.splice(i, segment.length, ...segment);

        const newDistance = calculateRouteDistance(newRoute);

        // If improvement found, update best route
        if (newDistance < currentDistance) {
          bestRoute = newRoute;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return bestRoute;
};

/**
 * Calculate total distance of a route
 */
export const calculateRouteDistance = (route: DeliveryPoint[]): number => {
  let totalDistance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += calculateDistance(
      route[i].coordinates,
      route[i + 1].coordinates
    );
  }

  return totalDistance;
};

/**
 * Calculate estimated delivery time for a route (in minutes)
 * Assumes average speed and time per stop
 */
export const calculateRouteTime = (route: DeliveryPoint[]): number => {
  if (route.length <= 1) return 0;

  const AVERAGE_SPEED = 30; // km/h
  const TIME_PER_STOP = 5; // minutes
  const SCALE_FACTOR = 0.1; // Conversion factor from pixel distance to km

  // Calculate travel time based on distance
  const totalDistance = calculateRouteDistance(route) * SCALE_FACTOR;
  const travelTimeHours = totalDistance / AVERAGE_SPEED;
  const travelTimeMinutes = travelTimeHours * 60;

  // Add stop time for each delivery (excluding warehouse)
  const deliveryStops = route.filter(
    (stop) => stop.districtId !== "Warehouse"
  ).length;
  const stopTimeMinutes = deliveryStops * TIME_PER_STOP;

  return Math.round(travelTimeMinutes + stopTimeMinutes);
};

/**
 * Generate a balanced distribution of stops across multiple vans
 * @param stops All delivery points to distribute
 * @param vanCount Number of vans available
 * @returns Array of stop arrays, one per van
 */
export const balanceRoutes = (
  stops: DeliveryPoint[],
  vanCount: number
): DeliveryPoint[][] => {
  if (vanCount <= 1) return [stops];

  // Find warehouse (should be common starting point)
  const warehouseIndex = stops.findIndex(
    (stop) => stop.districtId === "Warehouse"
  );
  const warehouse = warehouseIndex >= 0 ? stops[warehouseIndex] : null;

  // Remove warehouse from stops for clustering
  const deliveryStops = warehouse
    ? stops.filter((stop) => stop.districtId !== "Warehouse")
    : [...stops];

  // Group stops by district for better distribution
  const districtGroups: { [key: string]: DeliveryPoint[] } = {};

  deliveryStops.forEach((stop) => {
    if (!districtGroups[stop.districtId]) {
      districtGroups[stop.districtId] = [];
    }
    districtGroups[stop.districtId].push(stop);
  });

  // Sort districts by number of stops (descending)
  const sortedDistricts = Object.keys(districtGroups).sort(
    (a, b) => districtGroups[b].length - districtGroups[a].length
  );

  // Initialize routes
  const routes: DeliveryPoint[][] = Array(vanCount)
    .fill(null)
    .map(() => (warehouse ? [warehouse] : []));

  // Distribute districts to balance load
  let routeIndex = 0;

  sortedDistricts.forEach((district) => {
    const stopsInDistrict = districtGroups[district];

    // Find route with fewest stops
    routeIndex = routes.indexOf(
      routes.reduce(
        (min, curr) => (curr.length < min.length ? curr : min),
        routes[0]
      )
    );

    // Add all stops from this district to the selected route
    routes[routeIndex].push(...stopsInDistrict);

    // Cycle to next van for next district
    routeIndex = (routeIndex + 1) % vanCount;
  });

  // Optimize each route
  return routes.map((route) => optimizeRoute(route));
};

export default {
  calculateDistance,
  calculateManhattanDistance,
  optimizeRoute,
  optimize2Opt,
  calculateRouteDistance,
  calculateRouteTime,
  balanceRoutes,
};
