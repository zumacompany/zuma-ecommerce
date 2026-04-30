-- Migration to add missing database indexes for performance
-- Run this migration after running the main schema.sql

-- Analytics events table indexes (frequently queried by date and event name)
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_event_name_idx ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS analytics_events_session_id_idx ON public.analytics_events(session_id);

-- Add limit to analytics queries if not using pagination
-- This comment is a reminder to add pagination to dashboard analytics queries
