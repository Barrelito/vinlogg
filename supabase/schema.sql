-- =============================================
-- VinLogg Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Wines table: Cache for Systembolaget data
CREATE TABLE IF NOT EXISTS wines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  producer TEXT,
  vintage INTEGER,
  region TEXT,
  article_number TEXT UNIQUE,
  price DECIMAL(10, 2),
  food_pairing_tags TEXT[] DEFAULT '{}',
  url_to_systembolaget TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs table: User wine entries
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES wines(id) ON DELETE SET NULL,
  user_image_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  location_name TEXT,
  latitude FLOAT,
  longitude FLOAT,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_wines_article_number ON wines(article_number);
CREATE INDEX idx_wines_food_pairing ON wines USING GIN(food_pairing_tags);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_wine_id ON logs(wine_id);

-- RLS Policies
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Wines: Public read, authenticated write
CREATE POLICY "Wines are viewable by everyone" ON wines
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert wines" ON wines
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Logs: Users can only access their own logs
CREATE POLICY "Users can view own logs" ON logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON logs
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Storage Bucket for Wine Images
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('wine-images', 'wine-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public read access for wine images
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'wine-images');

-- Policy: Only authenticated users can upload
CREATE POLICY "Auth Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'wine-images' AND auth.role() = 'authenticated'
);

-- =============================================
-- PHASE 8: Advanced AI Fields Migration
-- Run this section to add support for detailed AI analysis
-- =============================================
DO $$
BEGIN
    -- Add description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wines' AND column_name = 'description') THEN
        ALTER TABLE wines ADD COLUMN description TEXT;
    END IF;

    -- Add serving_temperature column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wines' AND column_name = 'serving_temperature') THEN
        ALTER TABLE wines ADD COLUMN serving_temperature TEXT;
    END IF;

    -- Add storage_potential column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wines' AND column_name = 'storage_potential') THEN
        ALTER TABLE wines ADD COLUMN storage_potential TEXT;
    END IF;

    -- Add flavor_profile column (JSONB for flexibility: body, acidity, tannins, fruitiness)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wines' AND column_name = 'flavor_profile') THEN
        ALTER TABLE wines ADD COLUMN flavor_profile JSONB;
    END IF;
END $$;

-- =============================================
-- PHASE 9: Companions and Occasion Fields
-- Run this to add social context to wine logs
-- =============================================
DO $$
BEGIN
    -- Add companions column (comma-separated names or array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'logs' AND column_name = 'companions') THEN
        ALTER TABLE logs ADD COLUMN companions TEXT;
    END IF;

    -- Add occasion column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'logs' AND column_name = 'occasion') THEN
        ALTER TABLE logs ADD COLUMN occasion TEXT;
    END IF;
END $$;

-- =============================================
-- PHASE 10: Shared Wine Cellar (Partners)
-- Allows two users to share their wine logs
-- =============================================
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_email TEXT NOT NULL,
    partner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, partner_email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_partner_user_id ON partners(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_partners_partner_email ON partners(partner_email);

-- RLS policies for partners table
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'Users can view their own partner connections') THEN
        CREATE POLICY "Users can view their own partner connections" ON partners
            FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'Users can create partner invites') THEN
        CREATE POLICY "Users can create partner invites" ON partners
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'Users can update partner connections they are part of') THEN
        CREATE POLICY "Users can update partner connections they are part of" ON partners
            FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = partner_user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'Users can delete their own partner connections') THEN
        CREATE POLICY "Users can delete their own partner connections" ON partners
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
