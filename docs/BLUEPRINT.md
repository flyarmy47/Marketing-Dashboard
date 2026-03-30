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
- **Google Ads** — Google Ads API v14+
- **Meta Ads** — Meta Marketing API v18+

### Phase 2
- **YouTube Ads** — via Google Ads API (Video campaigns)
- **Reddit Ads** — Reddit Ads API

### Phase 3+
- LinkedIn, TikTok, X, Microsoft/Bing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend/API | Netlify Functions (Node.js) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Ad Platform Auth | OAuth 2.0 per platform |
| Credential Storage | Supabase (encrypted + RLS) |
| Hosting | Netlify |
| Scheduling | Netlify Scheduled Functions (hourly cron) |

---

## Architecture

### Frontend (React + Tailwind)
- `src/pages/` — Login, Signup, Dashboard, Connections, Settings, OAuthCallback
- `src/components/` — Layout, MetricTile, MetricGrid, TileConfigurator, DateRangePicker, ConnectionCard, PlatformBadge, LoadingSpinner, ProtectedRoute
- `src/hooks/` — useDashboard (metrics + tile config), useConnections (OAuth connections)
- `src/context/` — AuthContext with Supabase auth
- `src/lib/` — Supabase client singleton, API fetch wrapper

### Backend (Netlify Functions)
- `auth-session.js` — Shared JWT verification + tenant resolution
- `oauth-google-ads-start/callback.js` — Google Ads OAuth flow
- `oauth-meta-ads-start/callback.js` — Meta Ads OAuth flow
- `connections-list.js` / `connections-delete.js` — CRUD for connections
- `dashboard-metrics.js` — Aggregates metrics with computed fields (CTR, CPA, CPM, ROI, Frequency)
- `dashboard-config.js` — GET/PUT tile configuration
- `refresh-google.js` / `refresh-meta.js` — Platform-specific data ingestion
- `scheduled-refresh.js` — Hourly cron job for all active connections

### Database (Supabase)
- 5 tables: tenants, tenant_users, connections, metrics, dashboard_configs
- Full RLS policies for multi-tenant isolation
- Computed metrics (CTR, CPA, CPM, ROI, Frequency) calculated at query time

### Key Design Decisions
- **Computed metrics live in the API, not the database.** CTR, CPA, CPM, ROI, and Frequency are calculated at query time from raw stored columns.
- **OAuth callbacks are server-side redirects.** Token exchange happens in Netlify Functions where secrets live.
- **`auth-session.js` is a shared module.** Exports `verifySession` imported by all authenticated functions.
- **One row per connection per day in `metrics`.** UNIQUE(connection_id, date) constraint enables upsert on hourly refresh.
- **Tile config is JSONB.** Simple ordered array of metric keys stored per tenant.
