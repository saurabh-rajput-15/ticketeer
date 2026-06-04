-- Supabase SQL Schema for Ticketeer
-- Copy and paste this into the Supabase SQL Editor to set up your tables.

-- 1. Create the events table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  "bannerUrl" TEXT,
  "organizerName" TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the ticket_types table
CREATE TABLE IF NOT EXISTS ticket_types (
  id TEXT PRIMARY KEY,
  "eventId" TEXT REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  availability INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  "eventId" TEXT REFERENCES events(id) ON DELETE CASCADE,
  "ticketTypeId" TEXT REFERENCES ticket_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  "paymentStatus" TEXT NOT NULL,
  "isCheckedIn" INTEGER DEFAULT 0,
  "qrData" TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create accounts and link to events
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL, -- 'host', 'cohost', 'volunteer'
  "eventId" TEXT REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS "hostId" TEXT REFERENCES accounts(id) ON DELETE CASCADE;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- 6. Open basic policies for the application to function with Anon Key 
--    (In production, restrict these as needed)

CREATE POLICY "Allow public read-all for events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public read-all for ticket_types" ON ticket_types FOR SELECT USING (true);
CREATE POLICY "Allow public read-all for registrations" ON registrations FOR SELECT USING (true);
CREATE POLICY "Allow public read-all for accounts" ON accounts FOR SELECT USING (true);

CREATE POLICY "Allow public insert for events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for ticket_types" ON ticket_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for registrations" ON registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for accounts" ON accounts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update for events" ON events FOR UPDATE USING (true);
CREATE POLICY "Allow public update for ticket_types" ON ticket_types FOR UPDATE USING (true);
CREATE POLICY "Allow public update for registrations" ON registrations FOR UPDATE USING (true);
CREATE POLICY "Allow public update for accounts" ON accounts FOR UPDATE USING (true);

