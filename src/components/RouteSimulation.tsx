import React, { useMemo } from "react";
import { useAppContext } from "../context/AppContext";

// Types
export interface Coordinates {
  x: number;
  y: number;
}

export interface DeliveryPoint {
  packageId: string;
  districtId: string;
  coordinates: Coordinates;
}

export interface VanRoute {
  vanId: string;
  stops: DeliveryPoint[];
  color: string;
}

interface RouteSimulationProps {
  width?: number;
  height?: number;
}

// District map configuration
const DISTRICTS = {
  "District A": { x: 100, y: 100 },
  "District B": { x: 200, y: 150 },
  "District C": { x: 300, y: 100 },
  "District D": { x: 150, y: 250 },
  "District E": { x: 250, y: 300 },
  "District F": { x: 350, y: 250 },
  Warehouse: { x: 225, y: 200 },
};

// Define district radius for visualization
const DISTRICT_RADIUS = 30;
const WAREHOUSE_RADIUS = 15;

// Safely generate a position near a district center
const getDistrictPosition = (
  districtId: string,
  index: number
): Coordinates => {
  // Fallback to warehouse if district not found
  const basePosition = DISTRICTS[districtId] || DISTRICTS["Warehouse"];

  // If it's warehouse, just return the center position
  if (districtId === "Warehouse") {
    return { ...basePosition };
  }

  // Create a spiral pattern around the district center
  // This ensures points are distributed nicely around each district
  const angle = (index * 137.5) % 360; // Golden angle for nice distribution
  const radius = 5 + (index % 3) * 10; // Varying distances from center

  // Convert polar to cartesian coordinates
  const offsetX = radius * Math.cos((angle * Math.PI) / 180);
  const offsetY = radius * Math.sin((angle * Math.PI) / 180);

  // Add small random jitter
  const jitterX = Math.random() * 6 - 3;
  const jitterY = Math.random() * 6 - 3;

  return {
    x: basePosition.x + offsetX + jitterX,
    y: basePosition.y + offsetY + jitterY,
  };
};

export const RouteSimulation: React.FC<RouteSimulationProps> = ({
  width = 500,
  height = 400,
}) => {
  const { vanRoutes } = useAppContext();

  // Process routes to ensure proper distribution
  const enhancedRoutes = useMemo(() => {
    if (!vanRoutes.length) return [];

    return vanRoutes.map((route) => {
      // Keep track of delivery counts per district for positioning
      const districtCounts: Record<string, number> = {};

      // Always start with warehouse
      const warehousePoint = {
        packageId: "warehouse-start",
        districtId: "Warehouse",
        coordinates: { ...DISTRICTS["Warehouse"] },
      };

      // Process each stop to distribute properly
      const processedStops = [warehousePoint];

      route.stops.forEach((stop) => {
        if (stop.districtId === "Warehouse") return;

        // Track how many stops we've placed in this district
        districtCounts[stop.districtId] =
          (districtCounts[stop.districtId] || 0) + 1;
        const count = districtCounts[stop.districtId];

        // Get a properly positioned coordinate for this district stop
        const coordinates = getDistrictPosition(stop.districtId, count);

        processedStops.push({
          packageId: stop.packageId,
          districtId: stop.districtId,
          coordinates,
        });
      });

      // End back at warehouse
      processedStops.push({
        packageId: "warehouse-end",
        districtId: "Warehouse",
        coordinates: { ...DISTRICTS["Warehouse"] },
      });

      return {
        ...route,
        stops: processedStops,
      };
    });
  }, [vanRoutes]);

  // No routes to display
  if (!vanRoutes.length) {
    return (
      <div
        className="flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50 p-4 w-full"
        style={{ height }}
      >
        <p className="text-gray-500 text-center">
          No routes to display. Run optimization to see delivery routes.
        </p>
      </div>
    );
  }

  // Calculate statistics
  const totalPackages = enhancedRoutes.reduce(
    (total, route) =>
      total +
      route.stops.filter((stop) => stop.districtId !== "Warehouse").length,
    0
  );

  const coveredDistricts = new Set(
    enhancedRoutes
      .flatMap((route) => route.stops.map((stop) => stop.districtId))
      .filter((id) => id !== "Warehouse")
  ).size;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50 w-full relative shadow-sm">
      <div className="p-3 border-b border-gray-300 bg-white flex justify-between items-center">
        <h3 className="font-medium text-gray-800">Delivery Route Simulation</h3>
        <div className="flex gap-4">
          {enhancedRoutes.map((route) => (
            <div key={route.vanId} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: route.color }}
              ></div>
              <span className="font-medium">{route.vanId}</span>
              <span className="text-gray-500 text-xs">
                ({route.stops.length - 2} stops)
              </span>
            </div>
          ))}
        </div>
      </div>

      <svg
        width={width}
        height={height}
        viewBox="0 0 450 400"
        className="w-full"
      >
        {/* Draw grid background */}
        <defs>
          <pattern
            id="smallGrid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="rgba(226, 232, 240, 0.5)"
              strokeWidth="0.5"
            />
          </pattern>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <rect width="50" height="50" fill="url(#smallGrid)" />
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(226, 232, 240, 1)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Draw district zones */}
        {Object.entries(DISTRICTS)
          .filter(([district]) => district !== "Warehouse")
          .map(([district, coords]) => (
            <circle
              key={`zone-${district}`}
              cx={coords.x}
              cy={coords.y}
              r={DISTRICT_RADIUS}
              className="fill-gray-100 opacity-30 stroke-gray-200"
              strokeWidth="1"
            />
          ))}

        {/* Draw routes for each van */}
        {enhancedRoutes.map((route) => (
          <g key={route.vanId}>
            {/* Draw route lines */}
            <polyline
              points={route.stops
                .map((stop) => `${stop.coordinates.x},${stop.coordinates.y}`)
                .join(" ")}
              className="fill-none"
              strokeWidth="2"
              style={{ stroke: route.color }}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6,3"
            />

            {/* Draw direction arrows along routes */}
            {route.stops.slice(0, -1).map((stop, i) => {
              const nextStop = route.stops[i + 1];
              const dx = nextStop.coordinates.x - stop.coordinates.x;
              const dy = nextStop.coordinates.y - stop.coordinates.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              // Only show arrows for longer segments
              if (distance < 30) return null;

              // Calculate midpoint and angle
              const midX = (stop.coordinates.x + nextStop.coordinates.x) / 2;
              const midY = (stop.coordinates.y + nextStop.coordinates.y) / 2;
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);

              return (
                <g
                  key={`arrow-${i}`}
                  transform={`translate(${midX}, ${midY}) rotate(${angle})`}
                >
                  <polygon
                    points="0,-4 8,0 0,4"
                    style={{ fill: route.color }}
                    className="stroke-white"
                    strokeWidth="0.5"
                  />
                </g>
              );
            })}

            {/* Draw stop points (excluding warehouse) */}
            {route.stops
              .filter((stop) => stop.districtId !== "Warehouse")
              .map((stop, i) => (
                <g key={`${stop.packageId}-${i}`}>
                  <circle
                    cx={stop.coordinates.x}
                    cy={stop.coordinates.y}
                    r={4}
                    className="stroke-white"
                    strokeWidth="1"
                    style={{ fill: route.color }}
                  />
                  <circle
                    cx={stop.coordinates.x}
                    cy={stop.coordinates.y}
                    r={8}
                    className="stroke-white fill-transparent"
                    style={{ stroke: route.color }}
                    opacity="0.3"
                  >
                    <animate
                      attributeName="r"
                      from="4"
                      to="10"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.5"
                      to="0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              ))}
          </g>
        ))}

        {/* District labels and markers */}
        {Object.entries(DISTRICTS).map(([district, coords]) => (
          <g key={district}>
            <circle
              cx={coords.x}
              cy={coords.y}
              r={district === "Warehouse" ? WAREHOUSE_RADIUS : 6}
              className={
                district === "Warehouse"
                  ? "fill-gray-800 stroke-white"
                  : "fill-gray-200 stroke-gray-400"
              }
              strokeWidth="1.5"
            />
            <text
              x={coords.x}
              y={coords.y - 12}
              className="text-xs font-medium fill-gray-700 text-center"
              textAnchor="middle"
            >
              {district}
            </text>
          </g>
        ))}

        {/* Warehouse special marker */}
        <g>
          <circle
            cx={DISTRICTS["Warehouse"].x}
            cy={DISTRICTS["Warehouse"].y}
            r={WAREHOUSE_RADIUS}
            className="fill-gray-800 stroke-white"
            strokeWidth="2"
          />
          <text
            x={DISTRICTS["Warehouse"].x}
            y={DISTRICTS["Warehouse"].y + 3}
            className="text-xs font-bold fill-white text-center"
            textAnchor="middle"
          >
            W
          </text>
        </g>
      </svg>

      <div className="p-3 border-t border-gray-300 bg-white text-sm flex justify-between items-center">
        <span className="text-gray-500">
          Simulated routes — distances not to scale
        </span>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-700">Total packages:</span>
            <span className="text-gray-600">{totalPackages}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-700">
              Districts covered:
            </span>
            <span className="text-gray-600">{coveredDistricts}/6</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-700">Vans deployed:</span>
            <span className="text-gray-600">{enhancedRoutes.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteSimulation;
