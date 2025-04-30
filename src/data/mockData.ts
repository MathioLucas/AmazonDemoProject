import { Package, Van, Metrics } from "src/types";

const baseTime = Date.now();

function generateMockPackage(id: number): Package {
  const offset = id * 600000; // stagger by 10 min
  return {
    id: `pkg-${id.toString().padStart(3, "0")}`,
    destination: {
      address: `${100 + id} Mock St, City #${id % 5}, WA`,
      coordinates: {
        lat: 47.6 + (id % 10) * 0.01,
        lng: -122.3 - (id % 5) * 0.01,
      },
    },
    deliveryWindow: {
      start: new Date(baseTime + 1800000 + offset).toISOString(),
      end: new Date(baseTime + 5400000 + offset).toISOString(),
    },
    weight: +(1 + (id % 10) * 0.5).toFixed(1),
    size: {
      width: 20 + (id % 10),
      height: 15 + (id % 10),
      depth: 10 + (id % 10),
    },
    priority: (id % 10) + 1,
    status: "queued",
  };
}

export const mockPackages: Package[] = Array.from({ length: 50 }, (_, i) =>
  generateMockPackage(i + 1)
);

export const mockVans: Van[] = [
  {
    id: "van-001",
    capacity: {
      weight: 200,
      volume: 3000000,
    },
    currentLoad: {
      weight: 0,
      volume: 0,
      packageCount: 0,
    },
    route: {
      name: "Seattle Downtown Route",
      areaCode: "SEA-DT",
      distanceKm: 0
    },
    packages: [],
  },
  {
    id: "van-002",
    capacity: {
      weight: 250,
      volume: 3500000,
    },
    currentLoad: {
      weight: 0,
      volume: 0,
      packageCount: 0,
    },
    route: {
      name: "Bellevue Route",
      areaCode: "BEL",
      distanceKm: 0
    },
    packages: [],
  },
  {
    id: "van-003",
    capacity: {
      weight: 150,
      volume: 2500000,
    },
    currentLoad: {
      weight: 0,
      volume: 0,
      packageCount: 0,
    },
    route: {
      name: "Redmond/Kirkland Route",
      areaCode: "RED-KIR",
      distanceKm: 0
    },
    packages: [],
  },
];

export const initialMetrics: Metrics = {
  averageDeliveryETA: 0,
  vanFillPercentage: 0,
  missedDeadlines: 0,
  totalPackagesLoaded: 0,
  totalPackagesQueued: mockPackages.length,
  totalDistance: 0,
};
