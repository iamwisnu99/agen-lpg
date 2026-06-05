-- Migration for Profile Preferences

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_notif BOOLEAN DEFAULT true;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS browser_notif BOOLEAN DEFAULT false;

-- Table to log when the last expiry check ran so we don't spam emails
CREATE TABLE IF NOT EXISTS cron_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name TEXT NOT NULL,
    last_run TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial log record if not exists
INSERT INTO cron_logs (job_name, last_run)
SELECT 'expiry_check', '1970-01-01 00:00:00+00'
WHERE NOT EXISTS (
    SELECT 1 FROM cron_logs WHERE job_name = 'expiry_check'
);
