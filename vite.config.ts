import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// Plugin to inject meta tag and lang attribute into index.html
const injectMetaTag = () => {
  return {
    name: 'inject-meta-tag',
    transformIndexHtml(html: string) {
      return html
        .replace(
          /<head>/,
          `<head>\n<meta http-equiv="Content-Language" content="de">`
        )
        .replace(
          /<html lang="en">/,
          `<html lang="de">`
        );
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite(), react(), injectMetaTag()],
  base: process.env.NODE_ENV === "production" ? "/billManager/" : "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
