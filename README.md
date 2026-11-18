# Secure Notes Web

Frontend for the [Secure Notes API](https://github.com/siamkarim/secure-notes-api). It is intentionally plain: the task is about the backend, so this app only exists to exercise every endpoint.

- **Stack:** React, TypeScript, Vite, React Router. No UI library and no starter template; every file is written by hand.
- **Live site:** https://secure-notes-web-three.vercel.app

## Run it locally

Start the API first (see its README), then:

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server forwards `/api/*` to `http://localhost:4000`. To use another backend, copy `.env.example` to `.env` and change `VITE_API_PROXY_TARGET`.

## Pages

| Page | Who | API used |
|---|---|---|
| Log in / Register | guests | `POST /auth/login`, `POST /auth/register` |
| Notes | everyone | `GET/POST /notes`, `PATCH/DELETE /notes/:id` |
| Posts | everyone | `POST /posts`, `GET /users/:id/posts` (the `$lookup` aggregation) |
| Interests | everyone | `GET /users/by-interest` (the grouping aggregation) |
| Profile | everyone | `GET/PATCH /users/me` |
| Users | admin | `GET/POST /admin/users`, `PATCH/DELETE /admin/users/:id` |
| All notes | admin | `GET /admin/notes` |

Every list has a "Load more" button that sends the `nextCursor` from the previous page.

## How authentication works here

- The **access token is kept in memory only**, never in `localStorage`, so there is nothing persistent for an injected script to steal.
- The **refresh token is an `httpOnly` cookie** set by the API; JavaScript cannot read it.
- On page load the app calls `POST /api/auth/refresh` to get a new access token from that cookie.
- When a request returns 401, the client refreshes once and repeats the request ([`src/api/client.ts`](src/api/client.ts)). Parallel requests share a single refresh call.
- Hiding admin pages in the UI is only for convenience. The API checks the role on every request.

## Why `/api` is proxied

Frontend and backend are on different domains (Vercel and Render). Browsers increasingly block cookies sent across sites, and a cross-site cookie would need the weaker `SameSite=None`.

Instead, the browser only ever talks to the frontend's own origin, and `/api/*` is forwarded to the backend:

- in development by the Vite proxy ([`vite.config.ts`](vite.config.ts)),
- in production by a Vercel rewrite ([`vercel.json`](vercel.json)).

The refresh cookie is therefore first-party and can be `SameSite=Strict`.

## Deployment (Vercel)

1. Put the real backend URL in `vercel.json` (the `destination` of the `/api/:path*` rewrite).
2. Import the repo in Vercel. Framework preset: Vite. Build command `npm run build`, output directory `dist`.
3. Add the Vercel URL to `CORS_ORIGINS` on the backend.
