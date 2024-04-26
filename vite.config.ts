import { defineConfig } from "vite"
import { extname, relative, resolve } from "path"
import { fileURLToPath } from "node:url"
import glob from "glob"
import react from "@vitejs/plugin-react-swc"
import dts from "vite-plugin-dts"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "docs") {
    return {
      // plugins: [react(), dts({ exclude: ["lib"] })],
      build: { outDir: "docs" },
      /* build: {
        rollupOptions: {
          external: ["react", "react/jsx-runtime"],
          input: resolve(__dirname, "index.html"),
          output: {
            dir: resolve(__dirname, "docs"),
            // assetFileNames: '[name][extname]',
            assetFileNames: (assetInfo) => {
              const assetName = assetInfo.name?.split(".").at(0)
              return `${assetName === "style" ? "index" : "[name]"}[extname]`
            },
            entryFileNames: "[name].js",
          },
        },
      },*/
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
          external: ["react", "react/jsx-runtime"],
          input: Object.fromEntries(
            // https://rollupjs.org/configuration-options/#input
            glob.sync("lib/**/*.{ts,tsx}").map((file) => [
              // 1. The name of the entry point
              // lib/nested/foo.js becomes nested/foo
              relative(
                "lib",
                file.slice(0, file.length - extname(file).length)
              ),
              // 2. The absolute path to the entry file
              // lib/nested/foo.ts becomes /project/lib/nested/foo.ts
              fileURLToPath(new URL(file, import.meta.url)),
            ])
          ),
          output: {
            // assetFileNames: '[name][extname]',
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
