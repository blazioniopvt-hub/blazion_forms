-- ============================================
-- Blazion Forms — PostgreSQL Init Script
-- Creates extensions and optimizes settings
-- ============================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Fuzzy text search for form search

-- Performance settings (will be overridden by postgresql.conf in production)
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log slow queries > 1s
