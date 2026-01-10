-- FundBrave AI Service Database Initialization
-- Creates tables for conversation memory and analytics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Conversation Memory Tables
-- ===========================================

-- Conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500),
    messages JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity ON ai_conversations(last_activity_at);

-- ===========================================
-- Usage Tracking Tables
-- ===========================================

-- Usage records table
CREATE TABLE IF NOT EXISTS ai_usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation VARCHAR(100) NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    model VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    latency_ms DECIMAL(10, 2) DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for usage records
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON ai_usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_operation ON ai_usage_records(operation);
CREATE INDEX IF NOT EXISTS idx_usage_records_created_at ON ai_usage_records(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_records_model ON ai_usage_records(model);

-- Daily usage summary view
CREATE OR REPLACE VIEW ai_daily_usage AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(cost) as total_cost,
    AVG(latency_ms) as avg_latency_ms,
    COUNT(DISTINCT user_id) as unique_users
FROM ai_usage_records
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ===========================================
-- A/B Testing Tables
-- ===========================================

-- Experiments table
CREATE TABLE IF NOT EXISTS ai_experiments (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    variants JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    target_sample_size INTEGER DEFAULT 1000,
    target_feature VARCHAR(100) DEFAULT 'default',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Experiment assignments table
CREATE TABLE IF NOT EXISTS ai_experiment_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id VARCHAR(100) NOT NULL REFERENCES ai_experiments(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(experiment_id, user_id)
);

-- Experiment conversions table
CREATE TABLE IF NOT EXISTS ai_experiment_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id VARCHAR(100) NOT NULL REFERENCES ai_experiments(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    value DECIMAL(10, 4) DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for experiments
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment ON ai_experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_user ON ai_experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_conversions_experiment ON ai_experiment_conversions(experiment_id);

-- ===========================================
-- Moderation Tables
-- ===========================================

-- Moderation logs table
CREATE TABLE IF NOT EXISTS ai_moderation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id VARCHAR(255),
    content_type VARCHAR(50) NOT NULL,
    content_preview VARCHAR(500),
    is_appropriate BOOLEAN NOT NULL,
    action VARCHAR(50) NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL,
    flags JSONB NOT NULL DEFAULT '[]',
    details JSONB NOT NULL DEFAULT '{}',
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for moderation
CREATE INDEX IF NOT EXISTS idx_moderation_content_id ON ai_moderation_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_content_type ON ai_moderation_logs(content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_action ON ai_moderation_logs(action);
CREATE INDEX IF NOT EXISTS idx_moderation_created_at ON ai_moderation_logs(created_at);

-- ===========================================
-- Fraud Detection Tables
-- ===========================================

-- Fraud analysis logs table
CREATE TABLE IF NOT EXISTS ai_fraud_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id VARCHAR(255) NOT NULL,
    is_suspicious BOOLEAN NOT NULL,
    risk_score DECIMAL(5, 4) NOT NULL,
    indicators JSONB NOT NULL DEFAULT '[]',
    recommendations JSONB NOT NULL DEFAULT '[]',
    details JSONB NOT NULL DEFAULT '{}',
    reviewed_by VARCHAR(255),
    review_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for fraud logs
CREATE INDEX IF NOT EXISTS idx_fraud_campaign_id ON ai_fraud_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fraud_is_suspicious ON ai_fraud_logs(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_fraud_risk_score ON ai_fraud_logs(risk_score);
CREATE INDEX IF NOT EXISTS idx_fraud_created_at ON ai_fraud_logs(created_at);

-- ===========================================
-- Training Jobs Tables
-- ===========================================

-- Training jobs table
CREATE TABLE IF NOT EXISTS ai_training_jobs (
    id VARCHAR(100) PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    dataset_path VARCHAR(500) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    progress JSONB DEFAULT '{}',
    result JSONB,
    error TEXT,
    adapter_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for training jobs
CREATE INDEX IF NOT EXISTS idx_training_status ON ai_training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_training_created_at ON ai_training_jobs(created_at);

-- ===========================================
-- Safety Logs Tables
-- ===========================================

-- Safety check logs table
CREATE TABLE IF NOT EXISTS ai_safety_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_hash VARCHAR(64) NOT NULL,
    check_type VARCHAR(20) NOT NULL, -- 'input' or 'output'
    is_safe BOOLEAN NOT NULL,
    action VARCHAR(50) NOT NULL,
    risk_score DECIMAL(5, 4) NOT NULL,
    violations JSONB NOT NULL DEFAULT '[]',
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for safety logs
CREATE INDEX IF NOT EXISTS idx_safety_content_hash ON ai_safety_logs(content_hash);
CREATE INDEX IF NOT EXISTS idx_safety_is_safe ON ai_safety_logs(is_safe);
CREATE INDEX IF NOT EXISTS idx_safety_action ON ai_safety_logs(action);
CREATE INDEX IF NOT EXISTS idx_safety_created_at ON ai_safety_logs(created_at);

-- ===========================================
-- Functions
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for conversations updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON ai_conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Grants
-- ===========================================

-- Grant permissions (adjust as needed for your setup)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fundbrave;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fundbrave;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO fundbrave;
