<!-- @format -->

# 🚀 Ziloss Deployment Guide

## Quick Dep3. Select your Ziloss repositoryoy to Vercel (Free)

### Prerequisites

1. GitHub account
2. Vercel account (free)
3. Neon account (free PostgreSQL database)

### Step 1: Setup Database (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project called "Ziloss"
3. Copy the connection string (looks like: `postgresql://username:password@hostname/database`)
4. Save this for Step 3

### Step 2: Push to GitHub

1. Create a new repository on GitHub called "Ziloss"
2. In your terminal, run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Ziloss.git
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project" and import your Ziloss repository
3. In the environment variables section, add:
   - `DATABASE_URL` = your Neon connection string from Step 1
   - `NODE_ENV` = `production`
4. Click "Deploy"

### Step 4: Setup Database Schema

After deployment, you need to push your database schema:

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Push database schema: `vercel env pull .env.local && npm run db:push`

### Step 5: Test Your App

Your app will be live at: `https://your-project-name.vercel.app`

---

## Alternative: Railway (Simpler but limited free tier)

### Step 1: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select your StudyFlow repository
5. Railway will automatically detect it's a Node.js app

### Step 2: Add Database

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Copy the database URL from the database service
3. In your main service, go to "Variables" tab
4. Add `DATABASE_URL` with the copied URL

### Step 3: Configure Build

1. In "Settings" tab, set:
   - Build Command: `npm run build`
   - Start Command: `npm start`

---

## Environment Variables Needed

For any platform, you'll need these environment variables:

```env
DATABASE_URL=your_postgres_connection_string
NODE_ENV=production
PORT=3000
```

---

## Troubleshooting

### Common Issues:

1. **Build fails**: Make sure all dependencies are in `package.json`
2. **Database connection fails**: Check your DATABASE_URL format
3. **404 on API routes**: Ensure `vercel.json` is configured correctly

### Need Help?

- Check the Vercel deployment logs for errors
- Ensure your database is accessible from the internet
- Verify all environment variables are set correctly

---

## What's Included

✅ Frontend (React + TypeScript + Tailwind)
✅ Backend API (Express + Node.js)
✅ Database (PostgreSQL with Drizzle ORM)
✅ Session management & scheduling
✅ Progress tracking
✅ Cancel functionality

Your Ziloss app will be live and ready for others to use! 🎉
