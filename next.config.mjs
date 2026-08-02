/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // pdf-lib's standard-font metrics ship as a deflate-compressed binary
    // string. Bundling the package re-encodes that string and corrupts it, so
    // every PDF that draws text dies with "invalid distance too far back" in
    // production while working fine under plain node. Leaving it external keeps
    // the module bytes intact.
    serverComponentsExternalPackages: ["pdf-lib", "@pdf-lib/standard-fonts"],
  },
};

export default nextConfig;
