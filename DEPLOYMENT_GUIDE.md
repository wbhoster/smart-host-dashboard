# Complete cPanel Deployment Guide for IPTV Admin App

This guide shows you how to deploy your React + Node.js + MySQL app on cPanel hosting with full flexibility for folder locations and domains.

## Architecture Overview

```
Frontend (React)          →  Apache/.htaccess  →  Passenger  →  Backend (Node.js)  →  MySQL
public_html/yourdomain/      Routes /api/*                      Any folder            Database
```

## Prerequisites

- cPanel hosting with:
  - MySQL database access
  - Node.js Selector (Passenger support)
  - SSH access (recommended) or File Manager
  - Your domain configured in cPanel

---

## Step 1: Database Setup

### 1.1 Create MySQL Database

1. **cPanel → MySQL Databases**
2. **Create New Database**: `yourdb_iptv` (cPanel adds prefix automatically)
3. **Create New User**: `yourdb_user` with a strong password
4. **Add User to Database** with ALL PRIVILEGES
5. **Note down**: Database name, username, password, and host (usually `localhost`)

### 1.2 Import Database Schema

1. **cPanel → phpMyAdmin**
2. Select your database
3. Click **Import** tab
4. Upload `backend/database/schema.sql`
5. Click **Go**
6. Verify tables are created: `clients`, `host_urls`, `whatsapp_templates`, `settings`, `admin_users`

---

## Step 2: Backend Setup

### 2.1 Upload Backend Files

Choose any folder name you want (flexible):

**Via File Manager:**
1. Go to cPanel → File Manager
2. Navigate to `/home/yourusername/`
3. Create folder: `api` (or any name you prefer)
4. Upload ALL files from `backend/` folder:
   - `server.js`
   - `app.js`
   - `package.json`
   - `.htaccess`
   - `routes/` folder
   - **DO NOT** upload `.env.example`

**Via SSH/FTP:**
```bash
# Upload to any folder you want
/home/yourusername/api/
```

### 2.2 Configure Environment Variables

Create `.env` file in your backend folder (`/home/yourusername/api/.env`):

```env
NODE_ENV=production
DB_HOST=localhost
DB_USER=yourdb_user
DB_PASSWORD=your_strong_password
DB_NAME=yourdb_iptv
```

**⚠️ Security:** Make sure `.env` has permissions `600` or `644` and is NOT publicly accessible.

### 2.3 Set Up Node.js Application (cPanel Node.js Selector)

This is the CRITICAL step that makes everything work:

1. **cPanel → Setup Node.js App** (or "Node.js Selector")
2. Click **Create Application**
3. Configure:
   - **Node.js Version**: 18.x or higher (recommended)
   - **Application Mode**: Production
   - **Application Root**: `/home/yourusername/api` (your backend folder path)
   - **Application URL**: `/api` (this tells Passenger to serve your backend at yourdomain.com/api/)
   - **Application Startup File**: `app.js`
   - **Domain**: Select your domain (e.g., `panel.a1hoster.pk`)
4. Click **Create**

### 2.4 Install Dependencies

After creating the app, cPanel shows you a command to run. Copy it:

**Option A: Via cPanel Terminal/SSH:**
```bash
cd /home/yourusername/api
source /home/yourusername/nodevenv/api/18/bin/activate
npm install
```

**Option B: Via cPanel Node.js Selector:**
- Click "Run NPM Install" button in the app settings

### 2.5 Start the Application

- In Node.js Selector, click **Start** or **Restart** button
- The app should show status: **Running**

### 2.6 Test Backend

Test the API directly:

```bash
# Health check
curl https://yourdomain.com/api/health

# Should return: {"status":"OK","timestamp":"2024-..."}
```

If you get HTML instead of JSON, the routing isn't working - check Step 2.3 configuration.

---

## Step 3: Frontend Setup

### 3.1 Configure API URL

The frontend is already configured to work automatically:

**`src/config.ts`:**
```typescript
export const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // Production: Uses relative path (yourdomain.com/api)
  : 'http://localhost:3001/api';  // Development
```

No changes needed! The frontend will automatically use `/api` in production.

### 3.2 Build Frontend Locally

On your local machine:

```bash
npm install
npm run build
```

This creates a `dist/` folder with optimized production files.

### 3.3 Upload to cPanel

Upload `dist/` contents to your domain's public folder:

**Target location:** `/home/yourusername/public_html/panel.a1hoster.pk/`

**Upload these files:**
- `index.html`
- `assets/` folder
- `.htaccess` (from `public/.htaccess` in project)
- `robots.txt`
- `favicon.ico`

**⚠️ Important:** 
- Upload contents of `dist/`, NOT the `dist/` folder itself
- Make sure `.htaccess` is uploaded (it's hidden by default)
- The `.htaccess` file handles React Router and API routing

### 3.4 Verify .htaccess

Ensure `/home/yourusername/public_html/panel.a1hoster.pk/.htaccess` exists and contains:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite API requests - let Passenger handle them
  RewriteCond %{REQUEST_URI} ^/api/ [OR]
  RewriteCond %{REQUEST_URI} ^/api$
  RewriteRule ^ - [L]
  
  # Serve existing files/directories directly
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Route all other requests to index.html (React Router)
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Step 4: Domain & SSL

### 4.1 Verify Domain

- Ensure your domain (`panel.a1hoster.pk`) points to your cPanel hosting
- In cPanel → Domains, verify the domain is set up correctly

### 4.2 Enable SSL (HTTPS)

1. **cPanel → SSL/TLS Status**
2. Enable AutoSSL or install Let's Encrypt certificate
3. Force HTTPS (add to `.htaccess` at the top):

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Step 5: Testing

### 5.1 Test Backend API

```bash
curl https://panel.a1hoster.pk/api/health
# Expected: {"status":"OK","timestamp":"..."}

curl https://panel.a1hoster.pk/api/clients
# Expected: [] or client data
```

### 5.2 Test Frontend

1. Open browser: `https://panel.a1hoster.pk`
2. You should see the login page
3. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`
4. Test creating a client
5. Check browser console for errors (F12)

### 5.3 Verify Database

After creating test data:
1. cPanel → phpMyAdmin
2. Select your database
3. Browse `clients` table
4. Verify data was inserted

---

## Step 6: Security & Maintenance

### 6.1 Change Default Admin Password

**Immediately** after first login:
1. Go to Settings page
2. Change admin password from `admin123`

Or via phpMyAdmin:
```sql
UPDATE admin_users 
SET password = '$2b$10$NEW_HASHED_PASSWORD'
WHERE username = 'admin';
```

Generate hash using Node.js:
```javascript
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('your_new_password', 10);
console.log(hash);
```

### 6.2 Secure .env File

```bash
chmod 600 /home/yourusername/api/.env
```

Verify it's NOT accessible via browser:
`https://yourdomain.com/api/.env` should return 404/403

### 6.3 Enable Error Logging

Backend logs are in:
- cPanel → Node.js Selector → Click app → View logs
- Or SSH: `tail -f ~/nodevenv/api/18/logs/passenger.log`

### 6.4 Database Backups

1. cPanel → Backup Wizard
2. Or phpMyAdmin → Export → SQL

---

## Troubleshooting

### Problem: "Unexpected token '<'" error in console

**Cause:** Frontend is getting HTML instead of JSON from API

**Fix:**
1. Check Node.js app is **Running** in cPanel Node.js Selector
2. Verify Application URL is set to `/api` exactly
3. Test API directly: `curl https://yourdomain.com/api/health`
4. Check `.htaccess` in public_html has correct rewrite rules

### Problem: 404 on API calls

**Cause:** Passenger not routing to backend

**Fix:**
1. Verify Node.js app Domain matches your actual domain
2. Restart Node.js app in cPanel
3. Check Application URL is `/api` (not `/iptv-api` or anything else)

### Problem: Database connection error

**Cause:** Wrong credentials in `.env`

**Fix:**
1. Verify DB credentials in cPanel → MySQL Databases
2. Check `.env` file has correct values
3. Test connection via phpMyAdmin

### Problem: White screen after deployment

**Cause:** React Router not working

**Fix:**
1. Verify `.htaccess` is uploaded to public_html
2. Check RewriteBase is `/`
3. Ensure index.html exists in public_html

### Problem: Changes not reflecting

**Fix:**
- Frontend: Re-build (`npm run build`) and re-upload `dist/`
- Backend: Restart Node.js app in cPanel Node.js Selector

---

## Folder Structure Summary

```
/home/yourusername/
├── api/                          # Backend (can be any name)
│   ├── server.js
│   ├── app.js
│   ├── package.json
│   ├── .env                      # Your environment variables
│   ├── .htaccess                 # Disables Passenger in this folder
│   └── routes/
│       ├── clients.js
│       ├── hosts.js
│       ├── templates.js
│       ├── auth.js
│       └── settings.js
│
└── public_html/
    └── panel.a1hoster.pk/        # Frontend (your domain folder)
        ├── index.html
        ├── .htaccess             # React Router + API routing
        ├── assets/
        ├── robots.txt
        └── favicon.ico
```

---

## Important Notes

✅ **Flexible Configuration:**
- Backend can be in ANY folder under `/home/yourusername/`
- Just update "Application Root" in Node.js Selector
- Frontend works with any domain - no code changes needed

✅ **No Hardcoded Paths:**
- Everything is configured via cPanel Node.js Selector
- Frontend automatically uses `/api` for all requests
- `.htaccess` lets Passenger handle API routing

✅ **Future Changes:**
- To change backend location: Update "Application Root" in Node.js Selector
- To change domain: Update "Domain" in Node.js Selector and move frontend files
- No code changes required!

---

## Support

If you encounter issues:
1. Check Node.js app logs in cPanel
2. Check browser console (F12)
3. Test API endpoints with curl
4. Verify database connection in phpMyAdmin
