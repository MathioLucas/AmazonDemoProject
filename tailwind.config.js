module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        amazon: {
          blue: "#232F3E", // Amazon dark blue (header)
          navy: "#131921", // Amazon navy (footer)
          orange: "#FF9900", // Amazon orange (primary)
          yellow: "#FEBD69", // Amazon yellow (search bar)
          green: "#008300", // Success green
          gray: "#DADADA", // Light gray
          lightgray: "#F5F5F5", // Background gray
        },
      },
      fontFamily: {
        amazon: ["Amazon Ember", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
