# Recursing Bash Demo

A fully interactive delivery optimization simulator built with React, TypeScript, Vite, and Tailwind CSS. Demonstrates state management, algorithm toggles, real-time metrics, and route visualization to optimize last-mile package delivery.

## Table of Contents

- Motivation  
- Features  
- Tech Stack  

- Demo  
- Getting Started  
  - Prerequisites  
  - Installation  
  - Running Locally  
  - Building for Production  
- Usage  
- Metrics and Strategies  
- Future Improvements  
- Contributing  
- License  
- Contact

## Motivation

This project is a showcase of my ability to design and build a real-world simulation tool for dynamic last-mile logistics—an area of keen interest at Amazon. It simulates how different package-loading strategies affect delivery efficiency, giving instant visual and quantitative feedback.

## Features

- Dynamic Package Queue  
  Automatically fetches (or mocks) packages with delivery windows, sizes, weights, and priorities.

- Multiple Optimization Strategies  
  Toggle between “deadline-first” and other strategies to compare performance.

- Interactive Van Loader  
  Drag-and-drop packages into vans, respecting capacity constraints.

- Real-time Metrics Panel  
  Displays average ETA, van fill percentage, missed deadlines, total distance, and more.

- Route Simulation  
  Visualizes each van’s delivery path on a simplified district map, with start/end at warehouse.

- Responsive UI  
  Built with Tailwind CSS for a clean, mobile-friendly layout.

## Tech Stack

- Framework: React 18 + TypeScript  
- Bundler: Vite  
- Styling: Tailwind CSS  
- State Management: React Context API  
- Package Manager: pnpm  
- Testing: (placeholder for unit/e2e test integration)  
- CI/CD: GitHub Actions (can be extended)

### Prerequisites

- Node.js v18 or higher  
- pnpm (or switch to npm/yarn)

  

### Installation

```bash
git clone https://github.com/MathioLucas/recursing-bash1.git
cd recursing-bash1
pnpm install

### Demo
<img width="1677" alt="Screenshot 2025-04-30 at 4 15 17 PM" src="https://github.com/user-attachments/assets/3d302719-b07f-4d51-b6f6-940aaa050ad4" />


### Usage Usage
Click “Load Packages” and “Load Vans” to simulate delivery data (fallback to mock data available).

Use the strategy toggle to change package assignment priorities.

Drag packages into vans to assign deliveries. Vans have capacity limits.

Monitor the metrics panel for key performance indicators.

Click “Optimize” to simulate the route and see van paths on the map.

### Metrics and Strategies
Metrics


Metric	Description
Average Delivery ETA	Mean time until all deliveries complete
Van Fill Percentage	Ratio of used vs. total van capacity
Missed Deadlines	Packages delivered after their time window
Total Distance	Sum of all van route distances
Strategies

deadline-first: Prioritizes packages that are closer to their delivery window end time.

Additional strategies can be added (e.g., weight-prioritized, distance-minimizing, etc.).

### Future Improvements
Integrate a real map API (e.g., Amazon Location Service, Mapbox, or Google Maps).

Implement smarter routing algorithms (e.g., genetic algorithm, A*).

Add persistent state management (e.g., IndexedDB or backend DB).

Introduce authentication for team-based simulations.

Add unit and end-to-end testing (Jest + Playwright).

Setup CI pipeline for automated builds and test coverage.

### Contributing
Contributions, ideas, and improvements are welcome!
To contribute:

Fork the repository

Create a feature branch

Submit a pull request with detailed explanation

Contact
Mathio Luca
Email: luca.mathio1@gmail.com
GitHub: https://github.com/MathioLucas




