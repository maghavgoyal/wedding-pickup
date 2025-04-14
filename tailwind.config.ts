import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        wedding: {
          50: "#FFF5F7",
          100: "#FFF1F2",
          200: "#FFD9E4",
          300: "#FFA3C0",
          400: "#FF6B9E",
          500: "#F43F7A", // Primary wedding color
          600: "#D12A65",
          700: "#A91E50",
          800: "#81173C",
          900: "#5C1029",
        },
        lavender: {
          50: "#F8F7FF",
          100: "#F3F1FF",
          200: "#E4DFFF",
          300: "#C8BFFF",
          400: "#A99EFF",
          500: "#8A7EF8", // Secondary color
          600: "#6B5ED8",
          700: "#5247B8",
          800: "#3D3590",
          900: "#2A2468",
        },
        mint: {
          50: "#F2FFF9",
          100: "#EDFFF9",
          200: "#D0FFF0",
          300: "#A3FFE0",
          400: "#5DFFC9",
          500: "#17EBAA", // Accent color
          600: "#0CC792",
          700: "#0A9E74",
          800: "#077558",
          900: "#054C39",
        },
        gold: {
          50: "#FFFBF0",
          100: "#FFF6E0",
          200: "#FFEDC2",
          300: "#FFE0A3",
          400: "#FFD485",
          500: "#FFC966", // Gold accent
          600: "#FFBA47",
          700: "#FF9800",
          800: "#E68A00",
          900: "#CC7A00",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-gentle": "pulse-gentle 3s infinite ease-in-out",
        float: "float 3s infinite ease-in-out",
        shimmer: "shimmer 2s infinite linear",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-out": "fade-out 0.5s ease-out forwards",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "wedding-gradient": "linear-gradient(135deg, #F43F7A 0%, #8A7EF8 100%)",
        "gold-gradient": "linear-gradient(135deg, #FFC966 0%, #FF9800 100%)",
        "mint-gradient": "linear-gradient(135deg, #17EBAA 0%, #0A9E74 100%)",
        "card-gradient": "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6))",
        shimmer: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0, 0, 0, 0.05)",
        glow: "0 0 15px rgba(244, 63, 122, 0.3)",
        "glow-lavender": "0 0 15px rgba(138, 126, 248, 0.3)",
        "glow-mint": "0 0 15px rgba(23, 235, 170, 0.3)",
        "glow-gold": "0 0 15px rgba(255, 201, 102, 0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
