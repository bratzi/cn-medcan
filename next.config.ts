import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./db/**"],
  },
};

export default nextConfig;

// Bindings (D1, IMAGES, …) auch in `next dev` verfügbar machen.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
