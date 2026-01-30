-- Create interviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS interviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id BIGINT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  level VARCHAR(20) NOT NULL,
  transcript TEXT NOT NULL,
  technical_score INT,
  communication_score INT,
  alignment_score INT,
  overall_score INT,
  feedback TEXT,
  suggestions TEXT[],
  question_breakdown JSONB,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_resume_id ON interviews(resume_id);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at);

-- Enable Row Level Security
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can create their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can update their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can delete their own interviews" ON interviews;

-- Create RLS policies
CREATE POLICY "Users can view their own interviews" ON interviews
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interviews" ON interviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews" ON interviews
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interviews" ON interviews
FOR DELETE USING (auth.uid() = user_id);
