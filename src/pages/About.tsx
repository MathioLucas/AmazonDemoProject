// src/pages/About.tsx
import React from "react";
import Header from "../components/Header";

const About: React.FC = () => {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Header />
      <h1 className="text-2xl font-bold mb-4">About This Simulator</h1>
      <p className="text-gray-700 mb-4">
        This logistics simulator mimics Amazon’s last-mile delivery van loading
        strategies. It demonstrates how optimization strategies such as
        deadline-first, route-clustering, and fill-rate balancing can affect van
        utilization and delivery efficiency.
      </p>
      <p className="text-gray-600">
        Built as a demo project using React, Tailwind CSS, and a
        serverless-style mock backend.
      </p>
    </div>
  );
};

export default About;
