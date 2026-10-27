import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
var stdin_default = defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src")
      },
      dedupe: ["react", "react-dom"]
    },
    server: {
      port: 3e3
    }
  };
});
export {
  stdin_default as default
};
