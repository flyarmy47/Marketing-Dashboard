# Ad Dashboard MVP Blueprint
**Project:** Unified Advertising Analytics Dashboard
**Version:** 1.0
**Date:** 2026-03-30

---

## Overview

A multi-tenant SaaS dashboard that consolidates advertising data from Google Ads, Meta, Reddit, and YouTube into a single interface. Users connect ad accounts via OAuth, configure metric tiles, and get hourly-refreshed performance data.

---

## Core Metrics (Per Platform)

| Metric | Description |
|---|---|
| ROI | Return on ad spend |
| CPA | Cost per acquisition |
| Impressions | Total ad impressions |
| CTR | Click-through rate |
| Clicks | Total clicks |
| Total Budget | Configured campaign budget |
| Budget Spent | Amount spent to date |
| Conversions | Total conversion events |
| CPM | Cost per 1,000 impressions |
| Reach | Unique users reached |
| Frequency | Avg impressions per user |
| Video Views | YouTube/Meta only |

All metrics toggleable per user via settings panel.

---

## Supported Platforms

### Phase 1 (MVP Launch)
- **Google Ads** -- Google Ads API v14+
- **Meta Ads** -- Meta Marketing API v18+

### Phase 2
- **YouTube Ads** -- via Google Ads API (Video campaigns)
- **Reddit Ads** -- Reddit Ads API

### Phase 3+
- LinkedIn, TikTok, X, Microsoft/Bing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend/API | Express.js (Node.js) |
| Database | PostgreSQL (Railway) |
| ORM | Prisma |
| Auth | Custom JWT (bcrypt + jsonwebtoken) |
| Ad Platform Auth | OAuth 2.0 per platform |
| Hosting | Railway |
| Scheduling | Railway Cron Jobs |

---

## Architecture

### Frontend (React + Tailwind)
- `src/pages/` -- Login, Signup, Dashboard, Connections, Settings, OAuthCallback
- `src/components/` -- Layout, MetricTile, MetricGrid, TileConfigurator, DateRangePicker, ConnectionCard, PlatformBadge, LoadingSpinner, ProtectedRoute
- `src/hooks/` -- useDashboard (metrics + tile config), useConnections (OAuth connections)
- `src/context/` -- AuthContext with JWT auth (localStorage token)
- `src/lib/` -- API fetch wrapper with Bearer token

### Backend (Express.js)
- `server/routes/auth.js` -- Signup, login, session verification (JWT)
- `server/routes/oauth.js` -- Google Ads + Meta Ads OAuth flows
- `server/routes/connections.js` -- List and delete ad platform connections
- `server/routes/dashboard.js` -- Aggregated metrics with computed fields (CTR, CPA, CPM, ROI, Frequency)
- `server/routes/settings.js` -- Tenant management
- `server/routes/refresh.js` -- Platform data ingestion trigger
- `server/middleware/auth.js` -- JWT verification middleware

### Database (Railway Postgres + Prisma)
- 6 models: User, Tenant, TenantUser, Connection, Metric, DashboardConfig
- Application-level authorization via JWT middleware
- Computed metrics (CTR, CPA, CPM, ROI, Frequency) calculated at query time

### Key Design Decisions
- **Railway over Supabase.** Single platform for database + hosting + cron.
- **Custom JWT auth.** bcrypt for password hashing, jsonwebtoken for sessions stored in localStorage.
- **Prisma ORM.** Type-safe database access with migrations.
- **Express serves both API and static frontend.** Single Railway service, Vite builds to `dist/`.
- **Computed metrics live in the API.** CTR, CPA, CPM, ROI, and Frequency calculated at query time.
- **One row per connection per day.** UNIQUE(connection_id, date) enables upsert on refresh.
