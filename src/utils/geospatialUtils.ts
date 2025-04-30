/**
 * Utility functions for location-based calculations in the logistics simulator
 */

/**
 * Represents a 2D coordinate with latitude and longitude
 */
export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Calculates the distance between two coordinates using the Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  coord1: Coordinate,
  coord2: Coordinate
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Converts degrees to radians
 * @param value Angle in degrees
 * @returns Angle in radians
 */
const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

/**
 * Calculates the center point of multiple coordinates
 * @param coordinates Array of coordinates
 * @returns Center coordinate
 */
export const calculateCenterPoint = (coordinates: Coordinate[]): Coordinate => {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sumLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
  const sumLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0);

  return {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length,
  };
};

/**
 * Organizes coordinates into clusters based on proximity
 * @param coordinates Array of coordinates with identifiers
 * @param maxDistance Maximum distance (km) to consider as same cluster
 * @returns Array of coordinate clusters
 */
export const clusterCoordinates = (
  coordinates: Array<{ id: string; coord: Coordinate }>,
  maxDistance: number = 5
): Array<Array<{ id: string; coord: Coordinate }>> => {
  const clusters: Array<Array<{ id: string; coord: Coordinate }>> = [];

  // Simple clustering algorithm
  coordinates.forEach((point) => {
    // Try to find a cluster this point belongs to
    let foundCluster = false;

    for (const cluster of clusters) {
      const clusterCenter = calculateCenterPoint(cluster.map((p) => p.coord));

      if (calculateDistance(point.coord, clusterCenter) <= maxDistance) {
        cluster.push(point);
        foundCluster = true;
        break;
      }
    }

    // If no suitable cluster found, create a new one
    if (!foundCluster) {
      clusters.push([point]);
    }
  });

  return clusters;
};

/**
 * Calculates the most efficient route through a set of coordinates (simplified)
 * @param startCoord Starting coordinate
 * @param coordinates Array of coordinates to visit
 * @returns Ordered array of coordinates for the route
 */
export const calculateRoute = (
  startCoord: Coordinate,
  coordinates: Coordinate[]
): Coordinate[] => {
  // This is a simplified greedy algorithm for route calculation
  // For a real system, you'd want a proper TSP solution

  if (coordinates.length === 0) return [];

  const route: Coordinate[] = [startCoord];
  const unvisited = [...coordinates];

  while (unvisited.length > 0) {
    const lastPoint = route[route.length - 1];

    // Find the closest unvisited point
    let closestIndex = 0;
    let minDistance = calculateDistance(lastPoint, unvisited[0]);

    for (let i = 1; i < unvisited.length; i++) {
      const dist = calculateDistance(lastPoint, unvisited[i]);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    // Add closest point to route
    route.push(unvisited[closestIndex]);

    // Remove from unvisited
    unvisited.splice(closestIndex, 1);
  }

  return route;
};

/**
 * Estimates travel time between coordinates based on distance
 * @param coord1 Starting coordinate
 * @param coord2 Ending coordinate
 * @param avgSpeedKmh Average speed in km/h (default: 30)
 * @returns Estimated travel time in minutes
 */
export const estimateTravelTime = (
  coord1: Coordinate,
  coord2: Coordinate,
  avgSpeedKmh: number = 30
): number => {
  const distance = calculateDistance(coord1, coord2);
  const timeHours = distance / avgSpeedKmh;
  return timeHours * 60; // Convert to minutes
};

/**
 * Calculates total route distance
 * @param coordinates Ordered array of coordinates in the route
 * @returns Total distance in kilometers
 */
export const calculateRouteDistance = (coordinates: Coordinate[]): number => {
  if (coordinates.length <= 1) return 0;

  let totalDistance = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
  }

  return totalDistance;
};

/**
 * Estimates fuel consumption based on distance and vehicle type
 * @param distanceKm Distance in kilometers
 * @param vanSize Size of the van ('small', 'medium', 'large')
 * @returns Estimated fuel consumption in liters
 */
export const estimateFuelConsumption = (
  distanceKm: number,
  vanSize: "small" | "medium" | "large"
): number => {
  // Average consumption rates in liters per 100km
  const consumptionRates = {
    small: 8,
    medium: 10,
    large: 14,
  };

  return (distanceKm * consumptionRates[vanSize]) / 100;
};
