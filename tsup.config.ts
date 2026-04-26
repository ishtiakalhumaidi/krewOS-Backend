/// <reference types="node" />
import { defineConfig } from "tsup";
import { cp } from "fs/promises"; 

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"], // Keep this as ESM
  target: "esnext",
  outDir: "dist",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  banner: {
    js: `
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    `,
  },
  onSuccess: async () => {
    try {
      // Copies the templates into the exact folder structure Vercel expects
      await cp("src/app/templates", "dist/app/templates", { recursive: true });
      console.log("✅ EJS Templates successfully copied to dist/app/templates");
    } catch (error) {
      console.error("❌ Failed to copy templates:", error);
    }
  },
});