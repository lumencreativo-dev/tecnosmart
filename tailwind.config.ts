import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // TecnoSmart Brand Palette
        brand: {
          red:     "#c9242b",
          black:   "#111111",
          gray:    "#6e6e6e",
          navy:    "#05235b",
          light:   "#d9d9d9",
          surface: "#f8fafc",
        },
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
