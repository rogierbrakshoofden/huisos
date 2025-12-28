# Deployment Guide for HuisOS

This guide walks you through deploying HuisOS to Vercel and setting up your Supabase database.

## Prerequisites

- GitHub account (you already have the repo!)
- Supabase account (free tier is fine)
- Vercel account (free tier is fine)

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (or use existing)
4. Click "New project"
5. Fill in:
   - **Name**: `huisos`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you (probably `eu-central-1` for Amsterdam)
   - **Pricing Plan**: Free
6. Click "Create new project" and wait for it to initialize (~2 minutes)

### 1.2 Run the Database Schema

1. In your Supabase project, click on the **SQL Editor** in the left sidebar
2. Click "New query"
3. Copy the contents of `supabase/schema.sql` from this repo
4. Paste it into the SQL editor
5. Click "Run" (bottom right)
6. You should see "Success. No rows returned"

### 1.3 Seed Initial Data

1. Click "New query" again
2. Copy the contents of `supabase/seed.sql` from this repo
3. Paste it into the SQL editor
4. Click "Run"
5. You should see the family members and chores populated

### 1.4 Enable Realtime

1. Go to **Database** → **Replication** in the left sidebar
2. Click on each table and toggle "Enable Realtime" on:
   - `family_members`
   - `chores`
   - `chore_completions`
   - `tasks`
   - `events`
   - `presence`
   - `tokens`
   - `rewards`

### 1.5 Get Your API Keys

1. Go to **Settings** → **API** in the left sidebar
2. Copy these two values (you'll need them for Vercel):
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## Step 2: Deploy to Vercel

### 2.1 Import Your Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your `huisos` repository from GitHub
4. If not connected, click "Connect GitHub Account" and authorize Vercel

### 2.2 Configure the Project

1. **Framework Preset**: Should auto-detect as "Next.js"
2. **Root Directory**: Leave as `./`
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)
5. **Install Command**: `npm install` (default)

### 2.3 Add Environment Variables

1. Expand the **Environment Variables** section
2. Add these two variables:

   | Name                            | Value                        |
   | ------------------------------- | ---------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase Project URL    |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |

3. Make sure they're set for **Production**, **Preview**, and **Development**

### 2.4 Deploy!

1. Click "Deploy"
2. Wait for the build to complete (~2-3 minutes)
3. Once done, you'll see "Congratulations!" with a link to your live site
4. Click "Visit" to see your HuisOS dashboard!

## Step 3: Set Up Your Custom Domain (Optional)

Vercel gives you a free domain like `huisos-xyz.vercel.app`, but you can add your own:

1. Go to your project in Vercel
2. Click **Settings** → **Domains**
3. Add your domain (e.g., `huisos.jouwdomein.nl`)
4. Follow the DNS instructions to point your domain to Vercel

## Step 4: Configure iPad/Mobile Access

### For iPad (Kitchen Dashboard)

1. Open Safari on the iPad
2. Navigate to your HuisOS URL
3. Tap the Share button (square with arrow)
4. Tap "Add to Home Screen"
5. Name it "HuisOS"
6. Tap "Add"
7. Now you have a full-screen app icon!

### For Mobile Devices

Same process as iPad:
1. Open in Safari (iOS) or Chrome (Android)
2. Add to home screen
3. Opens as a standalone app

## Troubleshooting

### "Error: No rows returned" when loading dashboard
- Check that you ran both `schema.sql` AND `seed.sql`
- Verify in Supabase Table Editor that family_members and chores have data

### Chores not updating in real-time
- Make sure you enabled Realtime for all tables in Step 1.4
- Check browser console for any errors

### Build fails on Vercel
- Check the build logs for specific errors
- Make sure all environment variables are set correctly
- Try running `npm run build` locally first to catch issues

### Can't complete chores (checkbox doesn't work)
- Verify Supabase RLS policies are set (they should be from schema.sql)
- Check browser console for API errors
- Verify environment variables are correct

## Next Steps

1. **Test the Dashboard**: Complete a chore and watch the confetti! 🎉
2. **Customize**: Edit chores, add tasks, create events
3. **Monitor Usage**: Check Supabase dashboard for database activity
4. **Add Features**: See the roadmap in README.md

## Support

If you run into issues:
1. Check browser console for errors
2. Check Vercel deployment logs
3. Check Supabase logs under **Logs** in the sidebar
4. File an issue on GitHub with details

---

**Your HuisOS is now live! Enjoy your organized household! 🏠**
