# FlowBit SEP - Project Setup Instructions

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Code Editor**: VS Code, Sublime Text, or similar
- **Supabase Account**: Free tier account at [supabase.com](https://supabase.com)
- **Git** (optional): For version control

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Get Your Supabase Credentials

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in:
     - Project Name: `flowbit-sep`
     - Database Password: (choose a strong password)
     - Region: Choose closest to you
   - Wait 2-3 minutes for project creation

2. **Copy Your API Keys**
   - Go to **Project Settings** → **API**
   - Copy:
     - **Project URL**: `https://xxxxx.supabase.co`
     - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### Step 2: Configure the Project

1. **Navigate to Configuration Folder**
   ```
   📁 workflow-management-platform/
   └── 📁 assets/
       └── 📁 js/
           └── 📁 config/
               └── 📝 config.js  ← Edit this file
   ```

2. **Open `assets/js/config/config.js`**
   
3. **Replace with Your Credentials**
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'https://YOUR-PROJECT-ID.supabase.co',  ← Paste your URL here
       anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  ← Paste your key here
   };

   export default SUPABASE_CONFIG;
   ```

4. **Save the file** (Ctrl+S or Cmd+S)

---

### Step 3: Set Up Database Schema

1. **Go to Supabase SQL Editor**
   - In your Supabase dashboard, click **SQL Editor** (left sidebar)

2. **Run the Schema Script**
   - Open `database/schema.sql` from your project
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run** (or press Ctrl+Enter)
   - Wait for "Success" message

3. **Run the Seed Data (Optional - for testing)**
   - Open `database/insights-seed-data.sql`
   - Copy contents
   - Paste into SQL Editor
   - Click **Run**

---

### Step 4: Launch the Application

#### **Option A: Using VS Code Live Server (Recommended)**

1. **Install Live Server Extension**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search "Live Server"
   - Click "Install"

2. **Start the Server**
   - Right-click on any `.html` file (e.g., `modules/auth/login.html`)
   - Select **"Open with Live Server"**
   - Browser opens automatically at `http://localhost:5500`

#### **Option B: Using Python HTTP Server**

```bash
# Navigate to project root
cd workflow-management-platform

# Start server (Python 3)
python -m http.server 8000

# Open browser to:
http://localhost:8000/modules/auth/login.html
```

#### **Option C: Direct File Opening (Not Recommended)**

- Double-click `modules/auth/login.html`
- **Note**: Some features may not work due to CORS restrictions

---

## 🔐 First User Registration

1. **Open the Application**
   - Navigate to: `http://localhost:5500/modules/auth/register.html`

2. **Create Your Account**
   - Full Name: `Your Name`
   - Email: `you@example.com`
   - Password: `minimum 6 characters`
   - Click **"Sign Up"**

3. **Login**
   - You'll be redirected to login page
   - Enter your credentials
   - Click **"Sign In"**

4. **Access Dashboard**
   - After login, you'll see the main dashboard
   - Start creating goals, milestones, and tasks!

---

## 📂 Project Structure Overview

```
workflow-management-platform/
├── 📁 assets/
│   ├── 📁 css/           ← Global styles
│   ├── 📁 images/        ← Images and icons
│   └── 📁 js/
│       ├── 📁 auth/      ← Authentication services
│       ├── 📁 config/    ← Configuration (EDIT THIS!)
│       ├── 📁 services/  ← API services
│       └── 📁 utils/     ← Utility functions
│
├── 📁 modules/
│   ├── 📁 auth/          ← Login & Registration pages
│   │   ├── login.html
│   │   └── register.html
│   ├── 📁 dashboard/     ← Dashboard page
│   ├── 📁 goals/         ← Goals management
│   ├── 📁 insights/      ← Insights & Analytics
│   └── 📁 ...
│
├── 📁 database/
│   ├── schema.sql        ← Database structure
│   └── insights-seed-data.sql  ← Test data
│
└── 📁 backend/ (optional - for future API)
```

---

## ✅ Verify Installation

### Check 1: Configuration File
- Open `assets/js/config/config.js`
- Verify URL and key are filled in (not placeholder text)

### Check 2: Database Tables
- Go to Supabase → **Table Editor**
- You should see tables: `goals`, `tasks`, `milestones`, `user_profiles`

### Check 3: Login Page
- Open `modules/auth/login.html` in browser
- You should see the login form (no errors in console)

### Check 4: Create Account
- Register a new user
- Check Supabase → **Authentication** → **Users**
- Your user should appear in the list

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" or Network Error

**Solution:**
1. Check `assets/js/config/config.js` - ensure URL and key are correct
2. Check Supabase dashboard - project should be active (not paused)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try incognito/private window

### Issue: "Table does not exist"

**Solution:**
1. Go to Supabase SQL Editor
2. Re-run `database/schema.sql`
3. Check **Table Editor** to verify tables were created

### Issue: Login/Register Not Working

**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Common fixes:
   - Clear localStorage: `localStorage.clear()`
   - Verify email format is correct
   - Password must be 6+ characters

### Issue: JWT Expired Error

**Solution:**
```javascript
// Run in browser console:
localStorage.clear();
window.location.href = 'modules/auth/login.html';
```

### Issue: Page Styles Not Loading

**Solution:**
1. Check file paths in HTML files (should use relative paths)
2. Ensure using Live Server or HTTP server (not direct file:// URLs)
3. Verify CSS files exist in `assets/css/` folder

---

## 🔄 Updating the Project

### Update Configuration
1. Edit `assets/js/config/config.js`
2. Save and refresh browser (Ctrl+F5)

### Update Database Schema
1. Open Supabase SQL Editor
2. Run new migration scripts
3. Refresh application

### Clear Cache and Reset
```javascript
// Browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 📞 Getting Help

### Check Documentation
- `TECHNOLOGIES_USED.md` - Technology stack details
- `USER_GUIDE.md` - How to use the application
- `README.md` - Project overview

### Common Resources
- **Supabase Docs**: https://supabase.com/docs
- **JavaScript MDN**: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- **Chart.js Docs**: https://www.chartjs.org/docs/

---

## 🎉 Success!

If you can:
1. ✅ Login to the application
2. ✅ See the dashboard
3. ✅ Create a goal or task
4. ✅ View insights page

**Congratulations! Your setup is complete!** 🚀

---

## 📌 Next Steps

1. **Explore the Application**
   - Navigate to `modules/dashboard/` to see your dashboard
   - Visit `modules/insights/` to view analytics
   - Create goals in `modules/goals/`

2. **Customize**
   - Modify colors in `assets/css/` files
   - Add your logo to `assets/images/`
   - Adjust layouts in module HTML files

3. **Deploy** (Future)
   - Host on Netlify, Vercel, or GitHub Pages
   - Configure production Supabase project
   - Update config.js with production credentials

---

*Last Updated: April 26, 2026*
