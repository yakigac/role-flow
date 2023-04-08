import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES // この行を追加
    ? "role-flow" // この行を追加
    : "./", // この行を追加
  plugins: [react()],
});
