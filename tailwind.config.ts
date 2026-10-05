import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de Blancos y Azules con acentos Carmesí
        "white-pure": "#FFFFFF",
        "white-soft": "#F8FAFB",
        "white-blue": "#F1F5F9",
        "slate-100": "#E2E8F0",
        "slate-200": "#CBD5E1",

        "blue-50": "#EFF6FF",
        "blue-100": "#DBEAFE",
        "blue-300": "#93C5FD",
        "blue-500": "#3B82F6",
        "blue-600": "#2563EB",
        "blue-700": "#1D4ED8",
        "blue-900": "#1E3A8A",
        "blue-950": "#0F172A",

        "crimson-50": "#FFF1F2",
        "crimson-100": "#FFE4E6",
        "crimson-400": "#FB7185",
        "crimson-500": "#F43F5E",
        "crimson-600": "#E11D48",
        "crimson-700": "#BE123C",

        // Variables semánticas para consistencia
        background: "var(--white-blue)",
        foreground: "var(--blue-950)",
      },
      fontFamily: {
        display: ["Inter", "-apple-system", "sans-serif"],
        body: ["Inter", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      fontSize: {
        "xs": "0.75rem",    // 12px
        "sm": "0.875rem",  // 14px
        "base": "1rem",      // 16px
        "lg": "1.125rem",   // 18px
        "xl": "1.25rem",    // 20px
        "2xl": "1.5rem",    // 24px
        "3xl": "1.875rem",  // 30px
        "4xl": "2.25rem",   // 36px
      },
      boxShadow: {
        'neumorphic-sm': '4px 4px 8px #CBD5E1, -4px -4px 8px #FFFFFF',
        'neumorphic-sm-inset': 'inset 4px 4px 8px #CBD5E1, inset -4px -4px 8px #FFFFFF',
        'neumorphic': '8px 8px 16px #CBD5E1, -8px -8px 16px #FFFFFF',
        'neumorphic-inset': 'inset 8px 8px 16px #CBD5E1, inset -8px -8px 16px #FFFFFF',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'interactive': '0 12px 24px -10px rgba(37, 99, 235, 0.2)', // Sombra para hover
      },
      keyframes: {
        'gradient-bg': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px 5px rgba(225, 29, 72, 0.3)' },
          '50%': { boxShadow: '0 0 25px 10px rgba(225, 29, 72, 0.5)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'gradient-bg': 'gradient-bg 15s ease infinite',
        'pulse-glow': 'pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)",
        "gradient-accent": "linear-gradient(135deg, #3B82F6 0%, #E11D48 100%)",
        "gradient-soft": "linear-gradient(180deg, #F8FAFB 0%, #EFF6FF 100%)",
      }
    },
  },
  plugins: [],
};
export default config;