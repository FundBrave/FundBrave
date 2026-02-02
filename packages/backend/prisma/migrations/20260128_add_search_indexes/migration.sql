-- Add PostgreSQL full-text search indexes for optimized search performance
-- This migration adds GIN indexes for tsvector full-text search

-- ==================== FULL-TEXT SEARCH INDEXES ====================

-- Add search vector column to Fundraiser table and create index
-- Note: We use a generated column approach for automatic updates
ALTER TABLE "fundraisers" ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'B')
  ) STORED;

-- Create GIN index on search vector for fast full-text search
CREATE INDEX IF NOT EXISTS "fundraisers_search_vector_idx" ON "fundraisers" USING GIN ("search_vector");

-- Add search vector column to User table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("username", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("displayName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("bio", '')), 'B')
  ) STORED;

-- Create GIN index on user search vector
CREATE INDEX IF NOT EXISTS "users_search_vector_idx" ON "users" USING GIN ("search_vector");

-- Add search vector column to Post table
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce("content", ''))
  ) STORED;

-- Create GIN index on post search vector
CREATE INDEX IF NOT EXISTS "posts_search_vector_idx" ON "posts" USING GIN ("search_vector");

-- ==================== PERFORMANCE INDEXES ====================

-- Index for fundraiser category filtering (GIN for array)
CREATE INDEX IF NOT EXISTS "fundraisers_categories_idx" ON "fundraisers" USING GIN ("categories");

-- Index for hashtag lookups
CREATE INDEX IF NOT EXISTS "hashtags_tag_lower_idx" ON "hashtags" (lower("tag"));

-- Index for trending score lookups
CREATE INDEX IF NOT EXISTS "trending_type_score_idx" ON "trending" ("type", "score" DESC);

-- ==================== SEARCH ANALYTICS TABLE ====================

-- Create table to track search queries for analytics and suggestions
CREATE TABLE IF NOT EXISTS "search_queries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "query" TEXT NOT NULL,
  "normalized_query" TEXT NOT NULL,
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "results_count" INTEGER NOT NULL DEFAULT 0,
  "clicked_result_id" TEXT,
  "clicked_result_type" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "search_type" TEXT DEFAULT 'all',
  "filters" JSONB,
  "execution_time_ms" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for popular query analysis
CREATE INDEX IF NOT EXISTS "search_queries_normalized_idx" ON "search_queries" ("normalized_query");
CREATE INDEX IF NOT EXISTS "search_queries_created_at_idx" ON "search_queries" ("created_at");
CREATE INDEX IF NOT EXISTS "search_queries_user_idx" ON "search_queries" ("user_id");

-- ==================== SEARCH SUGGESTIONS TABLE ====================

-- Table to store popular search suggestions
CREATE TABLE IF NOT EXISTS "search_suggestions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "term" TEXT NOT NULL UNIQUE,
  "search_count" INTEGER NOT NULL DEFAULT 0,
  "click_through_rate" REAL DEFAULT 0,
  "last_searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for suggestion lookups
CREATE INDEX IF NOT EXISTS "search_suggestions_term_idx" ON "search_suggestions" ("term");
CREATE INDEX IF NOT EXISTS "search_suggestions_count_idx" ON "search_suggestions" ("search_count" DESC);

-- Create trigram extension for fuzzy matching (if not exists)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS "fundraisers_name_trgm_idx" ON "fundraisers" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "users_username_trgm_idx" ON "users" USING GIN ("username" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "users_displayName_trgm_idx" ON "users" USING GIN ("displayName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "hashtags_tag_trgm_idx" ON "hashtags" USING GIN ("tag" gin_trgm_ops);
