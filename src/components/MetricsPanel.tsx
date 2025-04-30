import React from "react";
import { useAppContext } from "../context/AppContext";

const MetricsPanel: React.FC = () => {
  const { metrics } = useAppContext();

  // Add some guards to prevent errors with undefined values
  const safeMetrics = {
    averageDeliveryETA: metrics?.averageDeliveryETA || 0,
    vanFillPercentage: metrics?.vanFillPercentage || 0,
    missedDeadlines: metrics?.missedDeadlines || 0,
    totalPackagesLoaded: metrics?.totalPackagesLoaded || 0,
    totalPackagesQueued: metrics?.totalPackagesQueued || 0,
    totalDistance: metrics?.totalDistance || 0,
  };

  const getVanFillColor = (percentage: number) => {
    if (percentage < 50) return "text-red-500";
    if (percentage < 80) return "text-yellow-500";
    return "text-green-500";
  };

  const getMissedDeadlinesColor = (count: number) => {
    if (count === 0) return "text-green-500";
    if (count < 3) return "text-yellow-500";
    return "text-red-500";
  };

  const getDistanceColor = (distance: number) => {
    if (distance < 50) return "text-green-500";
    if (distance < 100) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-500 mb-1">Average Delivery ETA</div>
          <div className="text-2xl font-bold">
            {safeMetrics.averageDeliveryETA} min
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-500 mb-1">Van Fill Rate</div>
          <div
            className={`text-2xl font-bold ${getVanFillColor(
              safeMetrics.vanFillPercentage
            )}`}
          >
            {safeMetrics.vanFillPercentage}%
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-500 mb-1">Missed Deadlines</div>
          <div
            className={`text-2xl font-bold ${getMissedDeadlinesColor(
              safeMetrics.missedDeadlines
            )}`}
          >
            {safeMetrics.missedDeadlines}
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-500 mb-1">Packages Status</div>
          <div className="text-lg">
            <span className="font-bold">{safeMetrics.totalPackagesLoaded}</span>
            <span className="text-gray-500"> loaded, </span>
            <span className="font-bold">{safeMetrics.totalPackagesQueued}</span>
            <span className="text-gray-500"> queued</span>
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-500 mb-1">
            Est. Distance Traveled
          </div>
          <div
            className={`text-2xl font-bold ${getDistanceColor(
              safeMetrics.totalDistance
            )}`}
          >
            {safeMetrics.totalDistance} km
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
