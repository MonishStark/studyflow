<!-- @format -->

# Railway PostgreSQL Setup Guide

## Step-by-Step Instructions:

### 1. Add PostgreSQL Service to Railway

1. Go to https://railway.app
2. Select your StudyFlow project
3. Click **"New Service"** button
4. Select **"Database"** → **"Add PostgreSQL"**
5. Railway will automatically provision a PostgreSQL database

### 2. Verify Environment Variables

After adding PostgreSQL, Railway automatically sets:

- `DATABASE_URL` - The connection string to your database
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` - Individual connection details

### 3. Check Your Variables

In Railway dashboard:

1. Go to your StudyFlow project
2. Click on the **"Variables"** tab
3. Verify `DATABASE_URL` exists and looks like:
   ```
   postgresql://username:password@host:port/database
   ```

### 4. Redeploy Your Application

After adding PostgreSQL:

1. Railway will automatically redeploy your app
2. Your app will connect to the database using the `DATABASE_URL`

### 5. Test Database Connection

Visit your app's health endpoint: `https://your-app.railway.app/api/health`

Expected response:

```json
{
	"status": "healthy",
	"database": "connected",
	"timestamp": "2025-08-04T...",
	"environment": "production"
}
```

## Troubleshooting

### If you still get connection errors:

1. **Check PostgreSQL Service Status:**

   - In Railway dashboard, ensure PostgreSQL service is "Active"
   - Check logs for any database errors

2. **Verify DATABASE_URL Format:**
   Should be: `postgresql://username:password@host:port/database`

3. **Check Application Logs:**

   - In Railway dashboard, check your app's deployment logs
   - Look for database connection messages

4. **Manual Database Connection Test:**
   You can connect to your Railway PostgreSQL using:
   ```bash
   psql $DATABASE_URL
   ```

## Common Issues:

- **ECONNREFUSED**: PostgreSQL service not added or not running
- **Authentication failed**: Incorrect DATABASE_URL
- **Connection timeout**: Network issues or wrong host/port

## Contact Railway Support:

If issues persist, contact Railway support with your project details.
