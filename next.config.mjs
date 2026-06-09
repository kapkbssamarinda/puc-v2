/** @type {import('next').NextConfig} */

// Set GITHUB_PAGES=true when deploying to GitHub Pages
// e.g.: GITHUB_PAGES=true npm run build
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const repoName = 'puc-calculator'  // Ganti sesuai nama repo GitHub

const nextConfig = {
  // Static export — aktifkan saat deploy ke GitHub Pages atau hosting statis lain
  ...(isGitHubPages ? {
    output: 'export',
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
  } : {}),

  images: {
    // Diperlukan saat output: 'export'
    unoptimized: true,
  },

  // Trailing slash untuk kompatibilitas GitHub Pages
  trailingSlash: isGitHubPages,
}

export default nextConfig
