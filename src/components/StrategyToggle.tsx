import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { OptimizationStrategy } from "src/types";

const StrategyToggle: React.FC = () => {
  const { currentStrategy, optimizeLoading, loading, fetchPackages, fetchVans } = useAppContext();
  
  // Use local state to manage selection
  const [localStrategy, setLocalStrategy] = useState<OptimizationStrategy>(currentStrategy);
  
  // Keep local state in sync with context
  useEffect(() => {
    setLocalStrategy(currentStrategy);
  }, [currentStrategy]);

  const strategies: {
    id: OptimizationStrategy;
    name: string;
    description: string;
  }[] = [
    {
      id: "deadline-first",
      name: "Deadline First",
      description: "Prioritizes packages with the earliest delivery deadline",
    },
    {
      id: "route-optimization",
      name: "Route Optimization",
      description:
        "Groups packages by delivery location to minimize travel distance",
    },
    {
      id: "fill-rate-balancing",
      name: "Fill Rate Balancing",
      description:
        "Maximizes van space utilization by balancing load across all vans",
    },
  ];

  // Reset packages when changing strategy
  const handleStrategySelection = (strategy: OptimizationStrategy) => {
    if (!loading) {
      console.log(`Selected strategy: ${strategy}`);
      setLocalStrategy(strategy);
      
      // If this isn't the first selection and the strategy changed
      if (currentStrategy !== strategy && currentStrategy !== "") {
        // Reset the packages to initial state
        fetchPackages();
        fetchVans();
      }
    }
  };

  // Run optimization with the locally selected strategy
  const handleRunOptimization = () => {
    if (!loading) {
      console.log(`Running optimization with strategy: ${localStrategy}`);
      optimizeLoading(localStrategy);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 font-amazon border border-amazon-gray">
      <h2 className="text-xl font-bold text-amazon-blue mb-5">
        Loading Strategy
      </h2>

      <div className="space-y-4">
        {strategies.map((strategy) => {
          // Use local state for UI rendering
          const selected = localStrategy === strategy.id;
          return (
            <div
              key={strategy.id}
              className={`p-4 border rounded-md cursor-pointer transition-all duration-200 ${
                selected
                  ? "bg-amazon-yellow/60 border-amazon-orange shadow-sm"
                  : "bg-white hover:bg-amazon-lightgray border-gray-300"
              }`}
              onClick={() => handleStrategySelection(strategy.id)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`strategy-${strategy.id}`}
                  name="strategy"
                  value={strategy.id}
                  checked={selected}
                  onChange={() => handleStrategySelection(strategy.id)}
                  className="hidden"
                />
                <span
                  className={`w-4 h-4 mr-3 rounded-full border-2 ${
                    selected
                      ? "bg-amazon-orange border-amazon-orange"
                      : "border-gray-400"
                  }`}
                />
                <h3 className="font-semibold text-sm">{strategy.name}</h3>
              </div>
              <p className="text-xs text-gray-600 mt-1 ml-7">
                {strategy.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          className="w-full bg-amazon-orange hover:bg-yellow-500 text-white py-2 px-4 rounded-md font-semibold transition disabled:bg-yellow-300 disabled:cursor-not-allowed"
          onClick={handleRunOptimization}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
              Optimizing...
            </span>
          ) : (
            "Run Optimization"
          )}
        </button>
      </div>
    </div>
  );
};

export default StrategyToggle;