# Database Setup Guide

## Overview

SoundScape uses **PostgreSQL** for production (Vercel) and **SQLite** for local development. This ensures data persistence across Vercel deployments.

---

## Local Development (SQLite)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the App
```bash
uvicorn api.index:app --reload
```

The app will automatically create `soundscape.db` in the project root.

---

## Production Setup (PostgreSQL + Vercel)

### Step 1: Create a Free PostgreSQL Database

We recommend **Neon** (free tier includes 3 projects, up to 10GB storage):

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy your connection string (looks like):
   ```
   postgresql://user:password@neon.tech/soundscape
   ```

**Alternative: Supabase**
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Copy the connection string from "Connection Strings" → "PostgreSQL"

### Step 2: Set DATABASE_URL in Vercel

1. Go to your **Vercel project settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `DATABASE_URL`
   - **Value:** Paste your PostgreSQL connection string
   - **Environments:** Check "Production", "Preview", and "Development"
3. Click **Add**

### Step 3: Deploy

Push your code to GitHub. Vercel will automatically:
1. Install dependencies (including `psycopg2-binary`)
2. Read `DATABASE_URL` from environment variables
3. Connect to PostgreSQL on startup
4. Create tables on first run

---

## Testing the Connection Locally

To test PostgreSQL locally before deploying:

### 1. Create a Local PostgreSQL Database

**On macOS (with Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb soundscape
```

**On Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb soundscape
```

**On Windows:**
- Download [PostgreSQL installer](https://www.postgresql.org/download/windows/)
- Install and remember the password
- Use pgAdmin (included) to create database `soundscape`

### 2. Get Your Connection String

**macOS/Linux:**
```bash
psql -d soundscape -c "SELECT current_user, version();"
# Connection string: postgresql://your_username@localhost/soundscape
```

**Windows (pgAdmin):**
- Right-click the database → Properties → Connection string shown there

### 3. Set Local Environment

Create `.env.local`:
```
DATABASE_URL=postgresql://your_username@localhost/soundscape
```

### 4. Run Locally with PostgreSQL

```bash
pip install -r requirements.txt
uvicorn api.index:app --reload
```

Visit `http://localhost:8000` and test autosave & stats. Data persists across restarts ✅

---

## Verifying Production Database

### Check Connection Status

After deployment, visit:
```
https://your-app.vercel.app/api/notes
```

If you get a JSON response (not an error), the database is connected! ✅

### Monitor Database Usage (Neon Console)

1. Log into [neon.tech](https://neon.tech)
2. Go to your project → **Monitoring**
3. Check **Connections**, **Query statistics**, and **Storage**

---

## Troubleshooting

### "DATABASE_URL not set"
- Verify you added `DATABASE_URL` to Vercel environment variables
- Redeploy after adding it: `git push` to trigger new deployment

### "server closed the connection unexpectedly"
- This is normal on free-tier PostgreSQL after idle time
- The fix is already in `database.py`: `pool_pre_ping=True` detects and reconnects
- No action needed; happens automatically

### "psycopg2 not found" error
- Run `pip install psycopg2-binary` locally
- Or: delete `requirements.txt.lock` if it exists and `pip install -r requirements.txt` again
- Vercel installs it automatically

### Lost Data After Deployment
- You likely forgot to set `DATABASE_URL` → data was on ephemeral SQLite
- Set the environment variable and redeploy (data won't be recovered, but future data persists)

---

## Migration: SQLite → PostgreSQL

If you had data in local SQLite and want to migrate it:

```bash
# Export SQLite data
sqlite3 soundscape.db ".dump" > backup.sql

# Import to PostgreSQL
psql -d soundscape < backup.sql
```

(This requires some SQL cleanup, so DM if you need help)

---

## FAQ

**Q: Is Neon free?**
A: Yes! Free tier includes:
- Up to 3 projects
- 3GB storage per project
- Unlimited connections
- Sufficient for SoundScape

**Q: Do I need to do anything special to scale?**
A: Not until you hit ~10GB storage or 1000+ concurrent users. Neon auto-scales transparently.

**Q: Can I switch databases later?**
A: Yes! Just update `DATABASE_URL` in Vercel and redeploy. All code handles both SQLite and PostgreSQL.

**Q: What about data backups?**
A: Neon provides automated daily backups. Access them via the Neon console.

---

## Next Steps

1. ✅ Create a Neon or Supabase PostgreSQL database
2. ✅ Add `DATABASE_URL` to Vercel environment variables
3. ✅ Redeploy your app
4. ✅ Test autosave at `https://your-app.vercel.app`

Your data now persists across deployments! 🎉
