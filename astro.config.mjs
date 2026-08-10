// @ts-nocheck
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server", // 1. 静的アセットではなく「サーバー」であることをCloudflareに伝える
  adapter: cloudflare({
    provisioning: false,
    defaultPrerender: false, // 👈 これを追加！事前生成のバグを回避します
  }),

  // 👇 ここから追加
  vite: {
    ssr: {
      external: ["cloudflare:workers", /^cloudflare:/],
    },
  },
  // 👆 ここまで
});
