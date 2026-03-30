-- Tenants (organizations)
CREATE TABLE tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Users belong to tenants
CREATE TABLE tenant_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role        TEXT DEFAULT 'owner',
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, user_id)
);

-- OAuth connections per tenant per platform
CREATE TABLE connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    platform        TEXT NOT NULL CHECK (platform IN ('google_ads', 'meta_ads')),
    access_token    TEXT NOT NULL,
    refresh_token   TEXT,
    token_expires_at TIMESTAMPTZ,
    account_id      TEXT,
    account_name    TEXT,
    last_synced_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, platform)
);

-- Daily metrics per connection per date
CREATE TABLE metrics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    connection_id   UUID REFERENCES connections(id) ON DELETE CASCADE NOT NULL,
    platform        TEXT NOT NULL,
    date            DATE NOT NULL,
    impressions     BIGINT DEFAULT 0,
    clicks          BIGINT DEFAULT 0,
    spend           NUMERIC(12,2) DEFAULT 0,
    conversions     BIGINT DEFAULT 0,
    reach           BIGINT DEFAULT 0,
    video_views     BIGINT DEFAULT 0,
    budget          NUMERIC(12,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(connection_id, date)
);

-- Dashboard tile config per tenant
CREATE TABLE dashboard_configs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
    tile_config JSONB NOT NULL DEFAULT '["impressions","clicks","spend","conversions","ctr","cpa","roi"]',
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_metrics_tenant_date ON metrics(tenant_id, date);
CREATE INDEX idx_metrics_connection_date ON metrics(connection_id, date);
CREATE INDEX idx_connections_tenant ON connections(tenant_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);

-- Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;

-- Tenant read: users can see their own tenant
CREATE POLICY tenant_read ON tenants FOR SELECT USING (
    id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
);

-- Tenant users: users see their own memberships
CREATE POLICY tenant_users_read ON tenant_users FOR SELECT USING (user_id = auth.uid());
CREATE POLICY tenant_users_insert ON tenant_users FOR INSERT WITH CHECK (user_id = auth.uid());

-- Connections: scoped to tenant membership
CREATE POLICY connections_select ON connections FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
);
CREATE POLICY connections_insert ON connections FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
);
CREATE POLICY connections_delete ON connections FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
);

-- Metrics: read-only for tenant members (writes happen via service role)
CREATE POLICY metrics_select ON metrics FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
);

-- Dashboard configs: full access for tenant members
CREATE POLICY dashboard_configs_all ON dashboard_configs FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
);
