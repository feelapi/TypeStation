/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { defineConfig, loadEnv, searchForWorkspaceRoot } from "vite";
import envCompatible from "vite-plugin-env-compatible";
import browserslistToEsbuild from "browserslist-to-esbuild";
import viteInspect from "vite-plugin-inspect";
import { externalGlobalPlugin } from "esbuild-plugin-external-global";
import copy from "rollup-plugin-copy";
import ignore from "rollup-plugin-ignore";
import rollupVisualizer from "rollup-plugin-visualizer";
import { webpackStats } from "rollup-plugin-webpack-stats";
import * as packageJson from "./package.json";
import path from "path";

const mode = process.env.NODE_ENV === "development" ? "development" : "production";

// array of public directories static assets from dependencies to copy
const assets = Object.keys(packageJson.dependencies)
  .map((pkgName) => {
    try {
      // gets dependency path and replaces everything after /lib/ with /lib/public/* to get static assets
      let pkg = require.resolve(pkgName).replace(/([\/\\]lib[\/\\]).*/, "$1public/*");
      // use relative path with forward slashes
      return path.relative(process.cwd(), pkg).replace(/\\/g, '/');
    } catch { return undefined }
  })
  // ignores all invalid paths, including dependencies that don't contain a lib/ directory
  .filter((path) => path?.endsWith('lib/public/*'));
assets.push("./public/*");

// https://vitejs.dev/config/
export default defineConfig(() => {
  // This changes the output dir from dist to build
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return {
    debug: mode === "development",
    server: {
      open: false, // don't open browser
      port: 3000,
      strictPort: true, // exit if port is already in use
      fs: {
        // give Vite access to files in itwinjs-core root directory
        allow: [searchForWorkspaceRoot(process.cwd())],
      },
    },
    envPrefix: "IMJS_",
    publicDir: ".static-assets",
    build: {
      outDir: "./lib",
      sourcemap: "inline", // append to the resulting output file
      minify: false, // disable compaction of source code
      target: browserslistToEsbuild(), // for browserslist in package.json
      commonjsOptions: {
        // plugin to convert CommonJS modules to ES6, so they can be included in bundle
        include: [
          /core\/electron/, // prevent error in ElectronApp
          /node_modules/, // prevent errors for modules
          /core\/frontend/, // prevent errors with require in IModelApp
        ],
        transformMixedEsModules: true // transforms require statements
      },
      rollupOptions: {
        input: "./index.html",
        // run `rushx build --stats` to view stats
        plugins: [
          ...(process.env.OUTPUT_STATS !== undefined ? [
            rollupVisualizer({
              open: true,
              filename: "stats.html",
              template: "treemap",
              sourcemap: true,
            }),
            webpackStats(), // needs to be the last plugin
          ] : []),
        ],
      },
    },
    plugins: [
      ignore(["electron"]), // equivalent to webpack externals
      // copy static assets to .static-assets folder
      copy({
        targets: [
          {
            src: assets,
            dest: ".static-assets",
            rename: (_name, _extension, fullPath) => {
              // rename files to name of file without directory path
              const regex = new RegExp("(public(?:\\\\|/))(.*)");
              return regex.exec(fullPath)![2];
            },
          },
        ],
        verbose: true,
        overwrite: true,
        copyOnce: true, // only during initial build or on change
      }),
      // open http://localhost:3000/__inspect/ to debug vite plugins
      ...(mode === "development" ? [viteInspect({ build: true })] : []),
      envCompatible({
        prefix: "IMJS_",
      }),
    ],
    define: {
      "process.env" : process.env // injects process.env into the frontend
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [
          externalGlobalPlugin({
            // allow global `window` object to access electron as external global
            electron: "window['electron']",
          }),
        ],
      },
      // overoptimized dependencies in the same monorepo (vite converts all cjs to esm)
      include: [
        "@itwin/core-common", // for opening iModel error
        "@itwin/core-frontend", // file in repository uses require (cjs)
      ],
    },
  };
});
