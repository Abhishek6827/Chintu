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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(200%)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
