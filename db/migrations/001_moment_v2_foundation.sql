-- MOMENT v2 Migration: Phase 0 Foundation
-- Adds tables for multi-platform, voting, parrot points

CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT,
  video_url TEXT NOT NULL,
  posted_to_tiktok BOOLEAN DEFAULT FALSE,
  posted_to_instagram BOOLEAN DEFAULT FALSE,
  posted_to_facebook BOOLEAN DEFAULT FALSE,
  views_tiktok INTEGER DEFAULT 0,
  views_instagram INTEGER DEFAULT 0,
  views_facebook INTEGER DEFAULT 0,
  views_app INTEGER DEFAULT 0,
  status TEXT DEFAULT ''pending_approval'',
  creator_reward_pool INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parrot_points (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  story_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  story_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referred_user_id TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  bonus_points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  followers_count INTEGER DEFAULT 0,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
