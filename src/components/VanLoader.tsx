// src/components/VanLoader.tsx
import React from "react";
import { useAppContext } from "../context/AppContext";
import { Van, Package } from "../types";

const VanLoader: React.FC = () => {
  const { vans, unassignPackage, loading } = useAppContext();

  const calculateFillPercentage = (van: Van) => {
    return Math.round((van.currentLoad.volume / van.capacity.volume) * 100);
  };

  const calculateWeightPercentage = (van: Van) => {
    return Math.round((van.currentLoad.weight / van.capacity.weight) * 100);
  };

  const getPackageSize = (pkg: Package) => {
    const volume = pkg.size.width * pkg.size.height * pkg.size.depth;
    // Determine relative size for visualization (small, medium, large)
    if (volume < 5000) return "small";
    if (volume < 25000) return "medium";
    return "large";
  };

  const getPackageColor = (pkg: Package) => {
    // Color based on priority (red for high, yellow for medium, green for low)
    if (pkg.priority >= 8) return "bg-red-400";
    if (pkg.priority >= 5) return "bg-yellow-400";
    return "bg-green-400";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Van Loading Status</h2>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : vans.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No vans available</div>
      ) : (
        <div className="space-y-6">
          {vans.map((van: Van) => (
            <div key={van.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">{van.route.name}</h3>
                <div className="text-sm text-gray-500">ID: {van.id}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <div className="mb-1 font-medium">Volume Usage</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${calculateFillPercentage(van)}%` }}
                    ></div>
                  </div>
                  <div className="mt-1">
                    {van.currentLoad.volume.toLocaleString()} /{" "}
                    {van.capacity.volume.toLocaleString()} cm³ (
                    {calculateFillPercentage(van)}%)
                  </div>
                </div>

                <div>
                  <div className="mb-1 font-medium">Weight Usage</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${calculateWeightPercentage(van)}%` }}
                    ></div>
                  </div>
                  <div className="mt-1">
                    {van.currentLoad.weight.toFixed(1)} / {van.capacity.weight}{" "}
                    kg ({calculateWeightPercentage(van)}%)
                  </div>
                </div>
              </div>

              <div className="mb-2 font-medium text-sm">
                Packages ({van.packages.length})
              </div>

              {van.packages.length === 0 ? (
                <div className="text-gray-500 text-sm italic">
                  No packages loaded
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2 pt-2 pb-1 px-2 bg-gray-50 rounded-md">
                  {van.packages.map((pkg: Package, index: number) => (
                    <div
                      key={pkg.id}
                      className={`${getPackageColor(
                        pkg
                      )} p-2 rounded cursor-pointer transition transform hover:scale-105`}
                      onClick={() => unassignPackage(pkg.id)}
                      title={`${pkg.id} - ${pkg.destination.address}\nClick to unassign`}
                    >
                      <div
                        className={`
                        flex justify-center items-center 
                        ${
                          getPackageSize(pkg) === "small"
                            ? "h-8"
                            : getPackageSize(pkg) === "medium"
                            ? "h-12"
                            : "h-16"
                        }
                        text-white text-xs font-bold
                      `}
                      >
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VanLoader;
