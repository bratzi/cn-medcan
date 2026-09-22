import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

// Bindings (IMAGES, Secrets, ...) auch in `next dev` verfuegbar machen.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
