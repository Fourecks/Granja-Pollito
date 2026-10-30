import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({ plugins: [react()], build: { sourcemap: false, rollupOptions: { input: { main: resolve(__dirname, 'index.html'), hudProposal: resolve(__dirname, 'hud-proposal.html') }, output: { manualChunks: { phaser: ['phaser'] } } } } });
