-- Metric Leads Table for Outreach Tracking

CREATE TABLE metric_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    contact_name TEXT,
    contact_role TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    has_website BOOLEAN DEFAULT false,
    website_quality TEXT,
    location TEXT,
    industry TEXT,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'NEW',
    priority TEXT,
    pitch TEXT,
    pitch_variant TEXT,
    next_action TEXT,
    next_follow_up TIMESTAMPTZ,
    last_contacted TIMESTAMPTZ,
    notes TEXT,
    deal_value NUMERIC(12, 2),
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE metric_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own metric leads"
    ON metric_leads
    FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_metric_leads_user_id ON metric_leads(user_id);
CREATE INDEX idx_metric_leads_status ON metric_leads(status);

-- Function to automatically update the updated_at timestamp
CREATE TRIGGER trg_metric_leads_updated_at
BEFORE UPDATE ON metric_leads
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updated_at);
