import { defineConfig } from "mygo-cli";

export default defineConfig({
  name: "highgarden",
  identifier: "com.ns2kracy.highgarden",
  version: "0.1.0",
  // `mygo dev` runs devCommand and loads devUrl; `mygo build` runs
  // buildCommand and embeds frontendDist into the app.
  devUrl: "http://localhost:5173",
  devCommand: "bun run dev:web",
  buildCommand: "bun run build:web",
  frontendDist: "dist",
  bindings: "src/mygo.ts",
  out: "build",
  updates: {
    publicKey: "q8bsuEeDoPZ/VKvvrausrVN3Cj2pXyYuRVIIdcvsR68=",
    github: "ns2kracy/highgarden",
  },
});
