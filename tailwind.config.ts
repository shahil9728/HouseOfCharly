import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#14100E", 2: "#1E1815", 3: "#2C2320" },
        cream: { DEFAULT: "#FAF7F2", 2: "#F2ECE3" },
        line: "#E4DACB",
        amber: { DEFAULT: "#B4741F", light: "#C98A34", soft: "#F6EADA" },
        leaf: { DEFAULT: "#3F7A4B", soft: "#EAF2EA" },
        brick: "#9E3B2C",
        txt: "#241D19",
        muted: "#6E625A",
        faint: "#9A8D83"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
