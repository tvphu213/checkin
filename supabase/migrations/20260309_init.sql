-- Bảng events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cost INTEGER,
  type TEXT CHECK (type IN ('one-time', 'recurring')),
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bảng attendances
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  name TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  checked_in_at TIMESTAMP DEFAULT NOW(),
  has_paid BOOLEAN DEFAULT FALSE
);

-- Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can only see their own events'
  ) THEN
    CREATE POLICY "Users can only see their own events" ON events
      FOR ALL USING (auth.uid() = owner_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'attendances' AND policyname = 'Anyone can read attendances'
  ) THEN
    CREATE POLICY "Anyone can read attendances" ON attendances
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'attendances' AND policyname = 'Anyone can insert attendances'
  ) THEN
    CREATE POLICY "Anyone can insert attendances" ON attendances
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'attendances' AND policyname = 'Only event owners can update payment status'
  ) THEN
    CREATE POLICY "Only event owners can update payment status" ON attendances
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM events
          WHERE events.id = attendances.event_id
          AND events.owner_id = auth.uid()
        )
      );
  END IF;
END $$;
