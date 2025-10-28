# IPTV Admin - cPanel Deployment Guide

## Prerequisites
- cPanel hosting with CloudLinux
- MySQL database access
- Node.js support (via cPanel's Node.js Selector or manual installation)
- SSH access (recommended)

---

## Part 1: Database Setup

### 1.1 Create MySQL Database in cPanel

1. **Login to cPanel**
2. **Go to "MySQL Databases"**
3. **Create New Database:**
   - Database Name: `iptv_admin` (or your choice)
   - Click "Create Database"

4. **Create Database User:**
   - Username: `iptv_user` (or your choice)
   - Password: Generate a strong password
   - Click "Create User"

5. **Add User to Database:**
   - Select the user and database you created
   - Grant ALL PRIVILEGES
   - Click "Make Changes"

6. **Note Down These Details:**
   ```
   Database Name: your_cpanel_username_iptv_admin
   Database User: your_cpanel_username_iptv_user
   Database Password: [your password]
   Database Host: localhost
   ```

### 1.2 Import Database Schema

1. **Go to "phpMyAdmin" in cPanel**
2. **Select your database** (`iptv_admin`)
3. **Click "SQL" tab**
4. **Copy and paste the entire contents** of `backend/database/schema.sql`
5. **Click "Go"**
6. **Verify tables were created:** You should see tables like `clients`, `host_urls`, `whatsapp_templates`, etc.

---

## Part 2: Backend Setup

### 2.1 Upload Backend Files

1. **Using cPanel File Manager or FTP:**
   - Create a folder: `/home/your_username/iptv-api/`
   - Upload all files from the `backend/` folder to this directory

2. **File structure should look like:**
   ```
   /home/your_username/iptv-api/
   ├── app.js (Passenger entry point)
   ├── server.js
   ├── package.json
   ├── .htaccess
   ├── routes/
   │   ├── auth.js
   │   ├── clients.js
   │   ├── hosts.js
   │   ├── templates.js
   │   └── settings.js
   └── database/
       └── schema.sql
   ```

### 2.2 Configure Environment Variables

1. **Create `.env` file** in `/home/your_username/iptv-api/`:
   ```bash
   NODE_ENV=production
   DB_HOST=localhost
   DB_USER=your_cpanel_username_iptv_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_cpanel_username_iptv_admin
   ```

2. **Important:** Replace with your actual database credentials from Step 1.1

3. **Note:** No PORT variable needed - Passenger manages this automatically

### 2.3 Setup Node.js Application in cPanel

**Using cPanel Node.js Selector (Recommended):**

1. **Login to cPanel**
2. **Go to "Setup Node.js App"**
3. **Click "Create Application"**
4. **Configure the application:**
   - **Node.js version:** Select latest LTS (16.x or higher)
   - **Application mode:** Production
   - **Application root:** `iptv-api`
   - **Application URL:** `iptv-api` (this creates the endpoint at yourdomain.com/iptv-api)
   - **Application startup file:** `app.js`
   - **Passenger log file:** (leave default or specify custom path)
   
5. **Click "Create"**
6. **Click "Run NPM Install"** - Wait for installation to complete
7. **Click "Restart"** to start the application

**Via SSH (Alternative):**
```bash
cd /home/your_username/iptv-api
npm install
```

### 2.4 Verify Backend Application

1. **In Node.js Selector, verify:**
   - Status shows "Running"
   - No errors in the log viewer
   
2. **Important Notes:**
   - Passenger automatically manages the application lifecycle
   - No need for PM2, Forever, or manual process management
   - Application auto-restarts on server reboot
   - Application auto-restarts on crashes

### 2.5 Test Backend API

**Test the health endpoint:**
```bash
curl https://yourdomain.com/iptv-api/api/health
```

You should see: `{"status":"OK","timestamp":"..."}`

**Or visit in browser:**
`https://yourdomain.com/iptv-api/api/health`

---

## Part 3: Frontend Setup

### 3.1 Verify Frontend API URL

The `src/config.ts` file is already configured correctly:
```typescript
export const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // In production, proxied via .htaccess
  : 'http://localhost:3001/api';
```

No changes needed - the production build will automatically use `/api` which gets proxied to `/iptv-api` by Apache.

### 3.2 Build Frontend

**On your local machine:**
```bash
npm install
npm run build
```

This creates a `dist/` folder with your production files.

### 3.3 Upload Frontend to cPanel

1. **Using cPanel File Manager:**
   - Navigate to `public_html/` (or your domain's document root)
   - Delete any existing files (index.html, etc.)
   - Upload all contents from the `dist/` folder

2. **File structure in `public_html/`:**
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].js
   │   ├── index-[hash].css
   │   └── ...
   └── robots.txt
   ```

### 3.4 Configure Apache (.htaccess)

**The `.htaccess` file should already be in `public/` folder. Copy it to `public_html/` during deployment.**

The `.htaccess` configuration includes:
- API proxy to `/iptv-api` (your Passenger Node.js app)
- React Router support (SPA routing)
- Gzip compression
- Browser caching

**No modifications needed** - just ensure the file is copied to `public_html/` with your build files.

---

## Part 4: Domain & SSL

### 4.1 Point Domain to cPanel

1. **In your domain registrar:**
   - Update nameservers to your cPanel nameservers
   - Or point A record to your cPanel server IP

2. **In cPanel:**
   - Go to "Domains" or "Addon Domains"
   - Add your domain pointing to `public_html/`

### 4.2 Install SSL Certificate

1. **Go to "SSL/TLS Status" in cPanel**
2. **Select your domain**
3. **Click "Run AutoSSL"**
4. Wait for SSL to be installed (usually takes a few minutes)

5. **Verify HTTPS works:** Visit `https://yourdomain.com`

---

## Part 5: Testing

### 5.1 Test Backend API

```bash
# Test health endpoint directly
curl https://yourdomain.com/iptv-api/api/health

# Test via proxy (as frontend uses it)
curl https://yourdomain.com/api/health

# Test getting clients
curl https://yourdomain.com/api/clients

# Test login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 5.2 Test Frontend

1. **Visit:** `https://yourdomain.com`
2. **Login with:**
   - Username: `admin`
   - Password: `admin123`
3. **Test all features:**
   - Dashboard loads
   - Can add/edit/delete clients
   - Can manage host URLs
   - WhatsApp templates work

---

## Part 6: Security & Maintenance

### 6.1 Change Default Admin Password

1. **Generate new password hash:**
   ```bash
   node -e "console.log(require('bcrypt').hashSync('your_new_password', 10))"
   ```

2. **Update in database via phpMyAdmin:**
   ```sql
   UPDATE admin_users 
   SET password_hash = 'your_generated_hash' 
   WHERE username = 'admin';
   ```

### 6.2 Secure Your Backend

1. **Restrict .env file access** - Add to `.htaccess` in backend folder:
   ```apache
   <Files ".env">
     Order allow,deny
     Deny from all
   </Files>
   ```

2. **Set proper file permissions:**
   ```bash
   chmod 644 .env
   chmod 644 *.js
   chmod 755 routes/
   ```

### 6.3 Enable Backend Logging

**Create `logs/` folder:**
```bash
mkdir /home/your_username/iptv-backend/logs
```

**Update server.js to log errors to file** (optional)

### 6.4 Setup Automatic Backups

1. **Database Backup:**
   - Use cPanel "Backup Wizard"
   - Schedule daily MySQL backups

2. **Files Backup:**
   - Backup `public_html/` and `iptv-backend/` regularly

---

## Troubleshooting

### Backend Not Starting
1. **Check Node.js Selector in cPanel:**
   - Verify app status is "Running"
   - Check the log viewer for errors
   
2. **Check Node.js version:**
   ```bash
   node --version  # Should be 16.x or higher
   ```

3. **Check Passenger logs:**
   - In Node.js Selector, click "Log" button
   - Or via SSH: `tail -f /home/your_username/iptv-api/passenger.log`

4. **Restart the application:**
   - In Node.js Selector, click "Restart"

### API Requests Failing
1. **Check `.htaccess` proxy rules in `public_html/`**
2. **Verify backend is running:**
   - Check Node.js Selector status
   - Test: `curl https://yourdomain.com/iptv-api/api/health`
3. **Check browser console for errors**
4. **Verify API URL proxying:** `/api/*` should route to `/iptv-api/*`

### Database Connection Errors
1. **Verify credentials in `.env`**
2. **Test MySQL connection:**
   ```bash
   mysql -u your_user -p your_database
   ```
3. **Check MySQL user has proper privileges**

### React Router 404 Errors
1. **Verify `.htaccess` exists in `public_html/`**
2. **Check mod_rewrite is enabled** (contact hosting provider)
3. **Clear browser cache**

---

## Performance Optimization

### Enable Gzip Compression
Add to `.htaccess` in `public_html/`:
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### Enable Browser Caching
```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## Support & Maintenance

### Regular Maintenance Tasks
- [ ] Update Node.js dependencies monthly: `npm update`
- [ ] Monitor backend logs for errors
- [ ] Backup database weekly
- [ ] Test WhatsApp API integration
- [ ] Monitor disk space usage

### Monitoring Backend Uptime
```bash
# Add to crontab to restart if crashed
*/5 * * * * curl http://localhost:3001/api/health || pm2 restart iptv-backend
```

---

## Quick Reference

**Default Login:**
- Username: `admin`
- Password: `admin123`

**Important Paths:**
- Frontend: `/home/username/public_html/`
- Backend: `/home/username/iptv-api/`
- Logs: Check in Node.js Selector or `/home/username/iptv-api/`

**Important URLs:**
- Frontend: `https://yourdomain.com`
- API (proxied): `https://yourdomain.com/api/*`
- API (direct): `https://yourdomain.com/iptv-api/api/*`
- Health Check: `https://yourdomain.com/api/health`

---

## Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Review backend logs
3. Check browser console for frontend errors
4. Verify all environment variables are correct
5. Contact your hosting provider for server-specific issues (Node.js support, mod_proxy, etc.)
