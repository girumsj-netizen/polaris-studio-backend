# Polaris Studio â€” Backend API

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3001) |
| `FRONTEND_URL` | Production frontend URL (e.g. Vercel/Netlify) |
| `FRONTEND_URL_LOCAL` | Local dev frontend URL (e.g. localhost:4321) |

## Deploy to Render

1. Push this `backend/` folder to a GitHub repo
2. Create a new **Web Service** on Render
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add env vars in Render dashboard (especially `FRONTEND_URL`)

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/contact` | Submit contact form |
