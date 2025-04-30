// src/components/Navbar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
  const { pathname } = useLocation();

  const linkClass = (path: string) =>
    `px-4 py-2 rounded-md font-medium ${
      pathname === path
        ? "bg-yellow-400 text-gray-900"
        : "text-white hover:bg-yellow-500 hover:text-gray-900"
    }`;

  return (
    <nav className="bg-gray-900 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center max-w-6xl">
        <Link to="/" className="text-yellow-400 font-bold text-xl">
          🚚 Amazon Logistics Simulator
        </Link>
        <div className="space-x-2">
          <Link to="/" className={linkClass("/")}>
            Dashboard
          </Link>
          <Link to="/about" className={linkClass("/about")}>
            About
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
