import React from "react";
import logo from "../assets/logo.svg"; // Assuming you have or want an Amazon-style logo

const Header: React.FC = () => {
  return (
    <header className="bg-amazon-blue shadow-md mb-6">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Amazon Logistics Simulator" className="h-8" />
            <h1 className="text-2xl font-bold text-white">
              Amazon Logistics Simulator
            </h1>
          </div>
          <div className="text-sm text-amazon-orange font-medium">
            Optimizing delivery workflows
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
