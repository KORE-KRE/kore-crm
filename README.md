# KORE CRM

This is the KORE (Kingstons Operations & Real Estate) prototype, packaged as a
real, runnable React project instead of a browser-only artifact.

Everything still runs in-memory — refreshing the page resets the data, and
there's no real login yet. That's the next phase (see the guide in chat).

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

## Build for deployment

```bash
npm run build
```

This produces a `dist/` folder of static files, ready to upload to any static
host (Vercel, Netlify, etc).
