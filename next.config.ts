import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF 解析仅在 Route Handler 内执行。将其保留为 Node 运行时依赖，
  // 避免 Turbopack 尝试把原生 canvas 绑定编入服务端 chunk。
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;
