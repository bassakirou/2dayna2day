import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        accent: {
          red: "#DF0A14",
        },
        neutral: {
          dark: "#1A1A2E",
          light: "#F7F7F7",
        },
        body: "#2D2D2D",
        om: "#FF6600",
        momo: "#FFCC00",
      },
      fontFamily: {
        heading: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
