-- Migration: Add client_capture_id for idempotent captures
-- Created: 2026-02-06
-- Purpose: Support retry-safe swing capture uploads from mobile

-- Add client_capture_id column to swing_capture
-- This is a client-generated UUID that enables idempotent capture creation
ALTER TABLE swing_capture
ADD COLUMN IF NOT EXISTS client_capture_id UUID NOT NULL DEFAULT gen_random_uuid();

-- Create unique index to prevent duplicate captures from retries
-- A user cannot have two captures with the same client_capture_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_swing_capture_client_id
ON swing_capture (user_id, client_capture_id);

-- Add comment for documentation
COMMENT ON COLUMN swing_capture.client_capture_id IS 
'Client-generated UUID for idempotent capture creation. Prevents duplicate captures from retries.';

-- Ensure pose_data column exists on swing_frame for storing full landmarks
ALTER TABLE swing_frame
ADD COLUMN IF NOT EXISTS pose_data JSONB;

COMMENT ON COLUMN swing_frame.pose_data IS 
'Full pose landmark data (SwingFrameArtifactV1) including 33 landmarks per frame.';

-- Ensure unique constraint on swing_analysis.capture_id for idempotent analysis
-- This prevents duplicate analysis runs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'swing_analysis_capture_id_key'
  ) THEN
    ALTER TABLE swing_analysis
    ADD CONSTRAINT swing_analysis_capture_id_key UNIQUE (capture_id);
  END IF;
END $$;

COMMENT ON CONSTRAINT swing_analysis_capture_id_key ON swing_analysis IS 
'Ensures only one analysis per capture (idempotent analysis trigger).';

-- Create index on client_capture_id for fast lookups during retry checks
CREATE INDEX IF NOT EXISTS idx_swing_capture_client_id_lookup
ON swing_capture (client_capture_id);
