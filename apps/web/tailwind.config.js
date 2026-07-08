/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "canvas-white": "#ffffff",
        "ghost-gray": "#f2f2f2",
        "subtle-ash": "#e5e5e5",
        "midtone-gray": "#737373",
        "rich-black": "#0a0a0a",
        "deep-black": "#000000",
        "callout-red": "#c22b10",
        "success-green": "#10c22b",
      },
      borderColor: {
        DEFAULT: "#e5e5e5",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite linear",
        "spin-slow": "spin 8s linear infinite",
        "music-bar": "music-bar 0.6s ease-in-out infinite",
      },
      boxShadow: {
        "2xs-soft": "0 1px 2px 0 rgb(0 0 0 / 0.02)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "music-bar": {
          "0%, 100%": { height: "40%" },
          "50%": { height: "100%" },
        },
      },
    },
  },
  plugins: [],
};
