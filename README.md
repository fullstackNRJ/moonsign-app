# moonsign-app — Hono starter

Minimal Hono (Node) starter for `moonsign-app`.

Prerequisites
- Node.js 18+ (for `node:http` `serve` API)

Install

```bash
npm install
```

Run (built JS)

```bash
npm run build
npm start
# open http://localhost:3000
```

Dev (TypeScript - `tsc` only)

Open two terminals for a simple development workflow:

Terminal A (continuous compile):

```bash
npm run dev
```

Terminal B (run built output):

```bash
npm run build
npm start
# or run with Node's file watcher: node --watch dist/index.js
```

Notes
- Do NOT run `node src/index.ts` directly — Node doesn't run TypeScript files.
- The dev script uses `tsc -w` to continuously compile TS into `dist/`.

Endpoints
- GET / → JSON greeting
- GET /health → plain "ok"
