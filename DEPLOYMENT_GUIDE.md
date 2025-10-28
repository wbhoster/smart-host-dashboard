# Complete cPanel Deployment Guide for IPTV Admin App

This guide shows you how to deploy your React + PHP + MySQL app on cPanel hosting with full flexibility for folder locations and domains.

## Architecture Overview

```
Frontend (React)          →  Apache/.htaccess  →  Backend (PHP)  →  MySQL
public_html/yourdomain/      Routes /api/*         Any folder       Database
```

## Prerequisites

- cPanel hosting with:
  - PHP 7.4 or higher (usually pre-installed)
  - MySQL database access
  - File Manager or FTP access
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

### 2.1 Choose Backend Location

You can place the backend in ANY folder outside `public_html/`:

**Recommended locations:**
- `/home/yourusername/api/` (simple and clear)
- `/home/yourusername/backend/` (descriptive)
- `/home/yourusername/private/api/` (more secure)

For this guide, we'll use `/home/yourusername/api/`

### 2.2 Upload Backend Files

**Via File Manager:**
1. Go to **cPanel → File Manager**
2. Navigate to `/home/yourusername/`
3. Click **+ Folder** → Create folder: `api`
4. Enter the `api` folder
5. Upload ALL files from your local `backend/` folder:
   - `index.php`
   - `.htaccess`
   - `config/` folder (containing `database.php`)
   - `api/` folder (containing all route files)
   - **DO NOT** upload `.env.example`

**Via FTP:**
Upload the entire `backend/` contents to `/home/yourusername/api/`

### 2.3 Create .env Configuration File

In your backend folder (`/home/yourusername/api/`), create a new file named `.env`:

1. Click **+ File** → Name it `.env`
2. Right-click the file → **Edit**
3. Add your database credentials:

```env
DB_HOST=localhost
DB_USER=yourdb_user
DB_PASSWORD=your_strong_password
DB_NAME=yourdb_iptv
```

4. **Save** and **Close**
5. Right-click `.env` → **Permissions** → Set to `600` or `644`

**⚠️ CRITICAL:** The `.htaccess` file already denies access to `.env` from browsers. Verify it's not publicly accessible:
- Try opening: `https://yourdomain.com/api/.env` (should show 403 Forbidden)

### 2.4 Configure Apache to Route /api/ Requests

Edit your **public_html** `.htaccess` to add API routing:

1. Go to `/home/yourusername/public_html/panel.a1hoster.pk/`
2. Open `.htaccess` file
3. Make sure it contains these rules (should already exist from frontend setup):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Route /api/ requests to backend folder
  RewriteCond %{REQUEST_URI} ^/api/
  RewriteRule ^api/(.*)$ /home/yourusername/api/index.php [L]
  
  # Serve existing files/directories directly
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Route all other requests to index.html (React Router)
  RewriteRule . /index.html [L]
</IfModule>
```

**📝 Note:** Replace `/home/yourusername/api/` with your actual backend path if different.

### 2.5 Verify PHP Version

1. **cPanel → MultiPHP Manager** or **Select PHP Version**
2. Ensure your domain is using **PHP 7.4 or higher**
3. Enable required PHP extensions (usually already enabled):
   - `pdo`
   - `pdo_mysql`
   - `json`

### 2.6 Test Backend API

Open your browser or use curl to test:

```bash
# Health check
curl https://panel.a1hoster.pk/api/health

# Expected response:
{"status":"OK","timestamp":"2025-10-28T..."}
```

If you see JSON response, your backend is working! ✅

**Common issues:**
- **404 Error**: Check `.htaccess` RewriteRule path is correct
- **500 Error**: Check `.env` database credentials
- **HTML instead of JSON**: Verify PHP files are uploaded correctly

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

Open browser or use curl:

```bash
# Health check
curl https://panel.a1hoster.pk/api/health
# Expected: {"status":"OK","timestamp":"..."}

# Get clients (should be empty initially)
curl https://panel.a1hoster.pk/api/clients
# Expected: []
```

If you get JSON responses, your backend is working correctly! ✅

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

### 6.3 Enable PHP Error Logging

PHP errors are logged in:
- cPanel → Errors (in the Metrics section)
- Or check: `/home/yourusername/public_html/error_log`

To enable detailed errors during development (disable in production):
Add to `/home/yourusername/api/index.php` at the top:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

**⚠️ Remove** these lines after fixing issues!

### 6.4 Database Backups

1. cPanel → Backup Wizard
2. Or phpMyAdmin → Export → SQL

---

## Troubleshooting

### Problem: "Unexpected token '<'" error in console

**Cause:** Frontend is getting HTML instead of JSON from API

**Fix:**
1. Verify backend files are uploaded to correct folder
2. Check `.htaccess` RewriteRule in public_html points to correct backend path
3. Test API directly: `curl https://yourdomain.com/api/health`
4. Check if PHP is enabled for your domain (cPanel → MultiPHP Manager)
5. Verify `.htaccess` in backend folder has correct routing rules

### Problem: 404 on API calls

**Cause:** Apache not routing to PHP backend

**Fix:**
1. Check public_html `.htaccess` RewriteRule path matches your backend location
2. Verify backend folder path: `/home/yourusername/api/index.php` exists
3. Test: `https://yourdomain.com/api/health` should return JSON
4. Check PHP version is 7.4+ in cPanel

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
- Backend: Re-upload PHP files (no restart needed, PHP processes each request fresh)

---

## Folder Structure Summary

```
/home/yourusername/
├── api/                          # Backend (can be any name)
│   ├── index.php                 # Main entry point
│   ├── .htaccess                 # API routing rules
│   ├── .env                      # Your database credentials
│   ├── config/
│   │   └── database.php          # Database connection
│   └── api/
│       ├── auth.php              # Authentication logic
│       ├── clients.php           # Client management
│       ├── hosts.php             # Host URL management
│       ├── templates.php         # WhatsApp templates
│       └── settings.php          # App settings
│
└── public_html/
    └── panel.a1hoster.pk/        # Frontend (your domain folder)
        ├── index.html
        ├── .htaccess             # React Router + API routing to backend
        ├── assets/
        ├── robots.txt
        └── favicon.ico
```

---

## Important Notes

✅ **Flexible Configuration:**
- Backend can be in ANY folder under `/home/yourusername/`
- Just update RewriteRule path in public_html `.htaccess`
- Frontend works with any domain - no code changes needed

✅ **No Hardcoded Paths:**
- Backend location is only defined in public_html `.htaccess`
- Frontend automatically uses `/api` for all requests
- PHP processes requests on-demand (no background service needed)

✅ **Simple Maintenance:**
- No Node.js app to monitor or restart
- PHP files are processed fresh on each request
- Easy to update: just upload new files
- Standard cPanel hosting - no special requirements

✅ **Future Changes:**
- To change backend location: Update RewriteRule in public_html `.htaccess`
- To change domain: Move frontend files to new domain folder
- Update `.env` file if database credentials change

---

## Support

If you encounter issues:
1. Check PHP error logs in cPanel → Errors
2. Check browser console (F12) for frontend errors
3. Test API endpoints with curl or browser
4. Verify database connection in phpMyAdmin
5. Check `.htaccess` rewrite rules are correct
6. Ensure PHP version is 7.4+ (cPanel → MultiPHP Manager)
