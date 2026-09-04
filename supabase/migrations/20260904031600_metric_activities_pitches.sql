-- Metric Pitches Table
CREATE TABLE metric_pitches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE metric_pitches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own metric pitches"
    ON metric_pitches
    FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_metric_pitches_user_id ON metric_pitches(user_id);

CREATE TRIGGER trg_metric_pitches_updated_at
BEFORE UPDATE ON metric_pitches
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updated_at);

-- Add pitch_id to metric_leads
ALTER TABLE metric_leads ADD COLUMN pitch_id UUID REFERENCES metric_pitches(id) ON DELETE SET NULL;
CREATE INDEX idx_metric_leads_pitch_id ON metric_leads(pitch_id);

-- Metric Activities Table
CREATE TABLE metric_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES metric_leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL, 
    outcome TEXT, 
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE metric_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own metric activities"
    ON metric_activities
    FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_metric_activities_user_id ON metric_activities(user_id);
CREATE INDEX idx_metric_activities_lead_id ON metric_activities(lead_id);
