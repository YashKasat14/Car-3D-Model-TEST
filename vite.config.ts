import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

/**
 * High-Performance Asset Compression Plugin
 * Generates both Gzip (.gz) and Brotli (.br) pre-compressed versions of all production assets
 * with maximum compression levels for instant loading and minimal bandwidth transfer.
 */
function preCompressionPlugin(): Plugin {
  return {
    name: 'vite-plugin-pre-compression',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) return;

      let compressedCount = 0;
      let totalOriginalBytes = 0;
      let totalGzipBytes = 0;
      let totalBrotliBytes = 0;

      const compressFile = (filePath: string) => {
        const ext = path.extname(filePath).toLowerCase();
        if (!['.js', '.css', '.html', '.svg', '.json'].includes(ext)) return;
        if (filePath.endsWith('.gz') || filePath.endsWith('.br')) return;

        const content = fs.readFileSync(filePath);
        if (content.length < 256) return; // Skip negligible files

        totalOriginalBytes += content.length;

        // 1. Gzip compression (Level 9: Maximum compression ratio)
        const gzipped = zlib.gzipSync(content, { level: 9 });
        fs.writeFileSync(`${filePath}.gz`, gzipped);
        totalGzipBytes += gzipped.length;

        // 2. Brotli compression (Quality 11: Ultra-dense compression)
        const brotli = zlib.brotliCompressSync(content, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: content.length,
          }
        });
        fs.writeFileSync(`${filePath}.br`, brotli);
        totalBrotliBytes += brotli.length;

        compressedCount++;
        const rel = path.relative(distDir, filePath).replace(/\\/g, '/');
        const origKb = (content.length / 1024).toFixed(1);
        const gzKb = (gzipped.length / 1024).toFixed(1);
        const brKb = (brotli.length / 1024).toFixed(1);
        const savings = (100 - (brotli.length / content.length) * 100).toFixed(1);
        console.log(`[Compressed] ${rel.padEnd(35)} ${origKb} kB -> Gz: ${gzKb} kB | Br: ${brKb} kB (-${savings}%)`);
      };

      const scanDir = (dir: string) => {
        const entries = fs.readdirSync(dir);
        for (const item of entries) {
          const fullPath = path.join(dir, item);
          if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
          } else {
            compressFile(fullPath);
          }
        }
      };

      console.log('\n--- COMPRESSING PRODUCTION ASSETS (GZIP + BROTLI) ---');
      scanDir(distDir);
      const totalOrigKb = (totalOriginalBytes / 1024).toFixed(1);
      const totalGzKb = (totalGzipBytes / 1024).toFixed(1);
      const totalBrKb = (totalBrotliBytes / 1024).toFixed(1);
      const overallSavings = (100 - (totalBrotliBytes / totalOriginalBytes) * 100).toFixed(1);
      console.log(`--- TOTAL: ${compressedCount} files | ${totalOrigKb} kB -> Gz: ${totalGzKb} kB | Br: ${totalBrKb} kB (-${overallSavings}% total reduction) ---\n`);
    },
    configurePreviewServer(server) {
      // Serve pre-compressed .br or .gz files during `vite preview`
      server.middlewares.use((req, res, next) => {
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const url = req.url ? req.url.split('?')[0] : '';
        const distDir = path.resolve(__dirname, 'dist');
        const candidatePath = path.join(distDir, url === '/' ? 'index.html' : url);

        if (fs.existsSync(candidatePath) && !fs.statSync(candidatePath).isDirectory()) {
          const brPath = `${candidatePath}.br`;
          const gzPath = `${candidatePath}.gz`;

          if (acceptEncoding.includes('br') && fs.existsSync(brPath)) {
            res.setHeader('Content-Encoding', 'br');
            res.setHeader('Vary', 'Accept-Encoding');
            const ext = path.extname(candidatePath).toLowerCase();
            if (ext === '.js') res.setHeader('Content-Type', 'application/javascript');
            if (ext === '.css') res.setHeader('Content-Type', 'text/css');
            if (ext === '.html') res.setHeader('Content-Type', 'text/html');
            if (ext === '.svg') res.setHeader('Content-Type', 'image/svg+xml');
            res.end(fs.readFileSync(brPath));
            return;
          } else if (acceptEncoding.includes('gzip') && fs.existsSync(gzPath)) {
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Vary', 'Accept-Encoding');
            const ext = path.extname(candidatePath).toLowerCase();
            if (ext === '.js') res.setHeader('Content-Type', 'application/javascript');
            if (ext === '.css') res.setHeader('Content-Type', 'text/css');
            if (ext === '.html') res.setHeader('Content-Type', 'text/html');
            if (ext === '.svg') res.setHeader('Content-Type', 'image/svg+xml');
            res.end(fs.readFileSync(gzPath));
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    preCompressionPlugin()
  ],
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: [
        '**/public/models/**',
        '**/*.glb',
        '**/*.gltf',
        '**/*.blend',
        '**/*.bin'
      ]
    }
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
});
