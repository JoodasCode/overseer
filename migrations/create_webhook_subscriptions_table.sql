-- Create webhook_subscriptions table
-- This table stores webhook subscription information for integrated services
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(50) NOT NULL,
  user_id VARCHAR(255),
  team_id VARCHAR(255),
  resource_id VARCHAR(255),
  subscription_id VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  events JSONB,
  token TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Add constraints
  CONSTRAINT webhook_subscriptions_provider_subscription_id_key UNIQUE (provider, subscription_id)
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS webhook_subscriptions_provider_idx ON webhook_subscriptions (provider);
CREATE INDEX IF NOT EXISTS webhook_subscriptions_user_id_idx ON webhook_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS webhook_subscriptions_team_id_idx ON webhook_subscriptions (team_id);
CREATE INDEX IF NOT EXISTS webhook_subscriptions_status_idx ON webhook_subscriptions (status);

-- Add a trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhook_subscriptions_updated_at
BEFORE UPDATE ON webhook_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_webhook_subscriptions_updated_at();

-- Comments
COMMENT ON TABLE webhook_subscriptions IS 'Stores webhook subscription information for integrated services';
COMMENT ON COLUMN webhook_subscriptions.provider IS 'Service provider (slack, gmail, asana, etc.)';
COMMENT ON COLUMN webhook_subscriptions.user_id IS 'User ID associated with the subscription';
COMMENT ON COLUMN webhook_subscriptions.team_id IS 'Team/workspace ID for team-based services';
COMMENT ON COLUMN webhook_subscriptions.resource_id IS 'Resource ID being watched (e.g., Asana project ID)';
COMMENT ON COLUMN webhook_subscriptions.subscription_id IS 'Provider-specific subscription identifier';
COMMENT ON COLUMN webhook_subscriptions.endpoint IS 'Webhook endpoint URL';
COMMENT ON COLUMN webhook_subscriptions.events IS 'List of events being subscribed to';
COMMENT ON COLUMN webhook_subscriptions.token IS 'Access token for webhook management (encrypted)';
COMMENT ON COLUMN webhook_subscriptions.status IS 'Subscription status (active, inactive, error)';
COMMENT ON COLUMN webhook_subscriptions.expires_at IS 'Expiration date for the subscription (if applicable)';
