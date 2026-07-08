import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      colors: {
        primary: {
          DEFAULT: "#1B2A4A",
          50: "#E8EBF2",
          100: "#C5CCDE",
          200: "#9EAAC7",
          300: "#7788B0",
          400: "#576EA0",
          500: "#3A5590",
          600: "#2E4578",
          700: "#1B2A4A",
          800: "#131F37",
          900: "#0B1224",
        },
        secondary: {
          DEFAULT: "#2563EB",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        accent: {
          DEFAULT: "#D4A843",
          50: "#FDF8EC",
          100: "#FAEFD0",
          200: "#F5DC9D",
          300: "#EFC96A",
          400: "#E8B94B",
          500: "#D4A843",
          600: "#B88A2A",
          700: "#9A6F1F",
          800: "#7B5618",
          900: "#5C3F10",
        },
        surface: "#F8FAFC",
        muted: "#64748B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
