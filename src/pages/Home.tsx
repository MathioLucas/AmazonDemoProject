// src/pages/Home.tsx
import React from "react";
import Header from "../components/Header";
import PackageQueue from "../components/PackageQueue";
import VanLoader from "../components/VanLoader";
import StrategyToggle from "../components/StrategyToggle";
import MetricsPanel from "../components/MetricsPanel";
import { AppProvider } from "../context/AppContext";

const Home: React.FC = () => {
  return (
    <AppProvider>
      <div className="container mx-auto p-4 max-w-6xl">
        <Header />

        <div className="mt-6">
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">
            Load Optimization Strategy
          </h2>
          <StrategyToggle />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-50 p-4 rounded-2xl shadow">
            <PackageQueue />
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl shadow">
            <VanLoader />
          </div>
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-2xl shadow">
          <MetricsPanel />
        </div>
      </div>
    </AppProvider>
  );
};

export default Home;
