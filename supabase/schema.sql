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
