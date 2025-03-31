export default {
  server: {
    port: 8080
  },
  base: '/tesla-escape-game/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          if (/\.(mp3|png|jpeg|jpg|gif|svg)$/.test(assetInfo.name)) {
            // Preserve the original path structure
            return assetInfo.name;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    // Ensure all assets are included in the build
    copyPublicDir: true
  },
  // Add public directory configuration
  publicDir: 'assets'
}