import { defineConfig } from "vite"
import { extname, relative, resolve } from "path"
import { fileURLToPath } from "node:url"
import { glob } from "glob"
import react from "@vitejs/plugin-react-swc"
import dts from "vite-plugin-dts"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "docs") {
    return {
      build: { outDir: "docs" },
      base: "/react-basic-contenteditable/",
    }
  }
  if (mode === "production") {
    return {
      plugins: [react(), dts({ include: ["lib"] })],
      build: {
        lib: {
          entry: resolve(__dirname, "lib/main.ts"),
          formats: ["es"],
        },
        rollupOptions: {
          external: ["react", "react/jsx-runtime", "react-dom"],
          input: Object.fromEntries(
            glob.sync("lib/**/*.{ts,tsx}").map((file) => [
              relative(
                "lib",
                file.slice(0, file.length - extname(file).length)
              ),
              fileURLToPath(new URL(file, import.meta.url)),
            ])
          ),
          output: {
            assetFileNames: (assetInfo) => {
              const assetName = assetInfo.name?.split(".").at(0)
              return `${assetName === "style" ? "index" : "[name]"}[extname]`
            },
            entryFileNames: "[name].js",
          },
        },
      },
    }
  }
  return {}
})
