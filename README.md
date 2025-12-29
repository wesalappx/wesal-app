# Wesal (وصال) - Couples Growth App

Wesal is a guided journey application for married couples to deepen connection, improve communication, and build a stronger relationship through daily check-ins, gamified challenges, and shared journals.

## 🚀 Features

- **Daily Check-ins**: Track mood, energy, and stress. Share safely with your partner.
- **Partner Pairing**: Connect with your spouse using a secure 6-digit code.
- **Gamified Journeys**: Unlock achievements and streaks as you grow together.
- **DeepSeek AI Advice**: Get personalized marriage advice and conversation starters.
- **Privacy First**: Built with rigorous privacy standards (Saudi PDPL compliant).

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Framer Motion (Glassmorphism & Aniimations)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State**: Zustand (with Persistence)
- **AI**: DeepSeek API

## 🏃‍♂️ Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   DEEPSEEK_API_KEY=your_deepseek_key
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### Vercel (Recommended)

1. Push code to GitHub.
2. Import project in Vercel.
3. Add Environment Variables in Vercel Dashboard.
4. Deploy!

## 🗄️ Database Setup

Run the SQL schemas provided in `supabase-schema.sql` and `supabase-schema-additional.sql` in your Supabase SQL Editor to set up all tables and RLS policies.
