// src/App.tsx
import React from "react";
import { AppProvider } from "./context/AppContext";
import Header from "./components/Header";
import PackageQueue from "./components/PackageQueue";
import VanLoader from "./components/VanLoader";
import StrategyToggle from "./components/StrategyToggle";
import MetricsPanel from "./components/MetricsPanel";
import RouteSimulation from "./components/RouteSimulation"; // ✅ Import added

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-100">
        <Header />

        {/* Main App Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Controls */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <StrategyToggle />
                <MetricsPanel />
              </div>
            </div>

            {/* Middle Panel: Package Queue */}
            <div className="lg:col-span-1">
              <PackageQueue />
            </div>

            {/* Right Panel: Van Loader */}
            <div className="lg:col-span-1 space-y-6"> {/* ✅ Space added for stacking */}
              <VanLoader />
              <RouteSimulation /> {/* ✅ Component added */}
            </div>
          </div>
        </main>

        {/* Optional Extra Pages (e.g. About) */}
        {/* <About /> */}
        {/* <Home /> */}
      </div>
    </AppProvider>
  );
};

export default App;
