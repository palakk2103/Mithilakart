// TEMPORARY (E2E only, deleted after the run): base config with the API proxied
// to the isolated test backend on :5055.
import base from './vite.config.js';

const target = 'http://127.0.0.1:5055';
const proxy = {
  '/api/v1': { target, changeOrigin: true },
  '/uploads': { target, changeOrigin: true },
  '/socket.io': { target, changeOrigin: true, ws: true },
};

export default {
  ...base,
  server: { ...base.server, port: 3055, strictPort: true, proxy },
  preview: { port: 3056, strictPort: true, proxy },
};
