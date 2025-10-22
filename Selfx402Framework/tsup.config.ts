import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "networks/index": "src/networks/index.ts",
    "wallets/index": "src/wallets/index.ts",
    "core/index": "src/core/index.ts",
    "self/index": "src/self/index.ts",
    "middleware/index": "src/middleware/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  outDir: "dist",
  external: ["express", "cors"],
});
