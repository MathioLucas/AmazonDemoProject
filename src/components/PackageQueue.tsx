// src/components/PackageQueue.tsx
import React from "react";
import { useAppContext } from "../context/AppContext";
import { Package, Van } from "src/types.ts";

const PackageQueue: React.FC = () => {
  const { queuedPackages, vans, assignPackageToVan, loading } = useAppContext();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const calculateVolume = (pkg: Package) => {
    return pkg.size.width * pkg.size.height * pkg.size.depth;
  };

  const handleAssignPackage = (packageId: string, vanId: string) => {
    assignPackageToVan(packageId, vanId);
  };

  return (
    <div className="amazon-card p-4">
      <div className="amazon-card-header">
        Package Queue ({queuedPackages.length})
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : queuedPackages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No packages in queue
        </div>
      ) : (
        <div className="overflow-y-auto max-h-96">
          {queuedPackages.map((pkg: Package) => (
            <div
              key={pkg.id}
              className="mb-3 p-3 border border-gray-200 rounded-md hover:bg-amazon-lightgray transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">{pkg.id}</div>
                <div className="amazon-badge bg-blue-100 text-blue-800">
                  Priority: {pkg.priority}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-1">
                <span className="font-medium">To:</span>{" "}
                {pkg.destination.address}
              </div>

              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Window:</span>{" "}
                {formatTime(pkg.deliveryWindow.start)} -{" "}
                {formatTime(pkg.deliveryWindow.end)}
              </div>

              <div className="flex justify-between text-xs text-gray-500 mb-3">
                <div>Weight: {pkg.weight} kg</div>
                <div>Volume: {(calculateVolume(pkg) / 1000).toFixed(1)} L</div>
              </div>

              <div className="flex flex-wrap gap-2">
                {vans.map((van: Van) => (
                  <button
                    key={van.id}
                    onClick={() => handleAssignPackage(pkg.id, van.id)}
                    className="amazon-button-secondary text-xs px-2 py-1"
                  >
                    Assign to {van.route.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PackageQueue;
