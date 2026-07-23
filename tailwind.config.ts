import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        meadow: "#2a9d8f",
        clay: "#e76f51",
        wheat: "#f4a261",
        paper: "#f8fafc"
      }
    }
  },
  plugins: []
};

export default config;

