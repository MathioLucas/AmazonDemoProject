// Reusable smaller types
export type Coordinates = {
  lat: number;
  lng: number;
};

export type DeliveryWindow = {
  start: string; // ISO date string
  end: string; // ISO date string
};

export type Size = {
  width: number; // in cm
  height: number;
  depth: number;
};

export type PackageStatus =
  | "queued"
  | "assigned"
  | "loaded"
  | "in-transit"
  | "delivered";

// Main types
export interface Package {
  [x: string]: string;
  district: string;
  deliveryDeadline: string | number | Date;
  id: string;
  destination: {
    address: string;
    coordinates: Coordinates;
  };
  deliveryWindow: DeliveryWindow;
  weight: number; // in kg
  size: Size;
  priority: number; // 1-10, 10 being highest
  status: PackageStatus;
  volume: number; // Volume calculated from size (width * height * depth)
}

export interface Van {
  id: string;
  capacity: {
    weight: number; // max weight in kg
    volume: number; // max volume in cubic cm
  };
  currentLoad: {
    weight: number;
    volume: number;
    packageCount: number;
  };
  route: {
    distanceKm: number;
    name: string;
    areaCode: string;
  };
  packages: Package[];
}

export type OptimizationStrategy =
  | "deadline-first"
  | "route-optimization"
  | "fill-rate-balancing";

export interface Metrics {
  averageDeliveryETA: number; // in minutes
  vanFillPercentage: number; // 0-100
  missedDeadlines: number;
  totalPackagesLoaded: number;
  totalPackagesQueued: number;
  totalDistance: number;
}

export interface AppState {
  packages: Package[];
  vans: Van[];
  queuedPackages: Package[];
  currentStrategy: OptimizationStrategy;
  metrics: Metrics;
  loading: boolean;
}
// Add this to src/types.ts (or wherever your types are defined)

import { VanRoute } from "./components/RouteSimulation";

// Update your AppContextType interface
export interface AppContextType {
  packages: Package[];
  vans: Van[];
  queuedPackages: Package[];
  currentStrategy: OptimizationStrategy;
  metrics: Metrics;
  loading: boolean;
  vanRoutes: VanRoute[]; // Add this new property
  fetchPackages: () => Promise<void>;
  fetchVans: () => Promise<void>;
  optimizeLoading: (strategy: OptimizationStrategy) => Promise<void>;
  assignPackageToVan: (packageId: string, vanId: string) => void;
  unassignPackage: (packageId: string) => void;
  resetMetrics: () => void;
}

export interface VanAssignment {
  packageId: string;
  vanId: string;
  assignedAt: string; // Timestamp or ISO date string
}

export interface PerformanceMetrics {
  totalDistanceTraveled: number; // in km
  totalPackagesDelivered: number;
  averageLoadPercentage: number; // 0-100%
  averageDeliveryTime: number; // in minutes
}

export interface AppContextType extends AppState {
  fetchPackages: () => Promise<void>;
  fetchVans: () => Promise<void>;
  optimizeLoading: (strategy: OptimizationStrategy) => Promise<void>;
  assignPackageToVan: (packageId: string, vanId: string) => void;
  unassignPackage: (packageId: string) => void;
}
