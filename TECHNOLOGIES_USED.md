# FlowBit SEP - Technologies Used

## 🏗️ Technology Stack Overview

FlowBit SEP is built as a **modern static web application** with a clean separation between frontend and backend services.

---

## 🎨 Frontend Technologies

### **Core Web Technologies**

| Technology | Version | Purpose | Documentation |
|-----------|---------|---------|---------------|
| **HTML5** | Latest | Semantic markup, page structure | [MDN HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) |
| **CSS3** | Latest | Styling, layouts, animations | [MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) |
| **JavaScript (ES6+)** | ES2022 | Application logic, interactivity | [MDN JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) |

**Why chosen:**
- Native browser support (no compilation needed)
- Fast, lightweight, accessible
- Modern ES6 modules for clean code organization

---

### **JavaScript Module System**

```javascript
// ES6 Modules (type="module")
import supabase from './config/supabase-client.js';
import insightsAPI from './services/insights-api.js';
```

**Location:** `assets/js/`

**Benefits:**
- ✅ Native browser support (no bundler required)
- ✅ Clean imports/exports
- ✅ Automatic strict mode
- ✅ Scoped variables (no global pollution)

---

## 📊 Data Visualization

### **Chart.js 4.4.0**

**Purpose:** Interactive charts and graphs for Insights Dashboard

**CDN:**
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

**Used in:**
- `modules/insights/insights.html` - Insights & Analytics page
- `modules/dashboard/dashboard.html` - Dashboard charts

**Chart Types:**
- 📈 Line Charts - Task completion trends
- 🍩 Donut Charts - Workload distribution
- 📊 Polar Area Charts - Goals by category
- 📉 Bar Charts - Team performance

**Documentation:** [Chart.js Docs](https://www.chartjs.org/docs/)

---

## 🗄️ Backend & Database

### **Supabase** (Backend-as-a-Service)

**Version:** Latest  
**Purpose:** Database, Authentication, Real-time, Storage

**Components Used:**

#### 1. **PostgreSQL Database**
- **Tables:** `goals`, `tasks`, `milestones`, `user_profiles`
- **Relationships:** Foreign keys, constraints
- **Features:** JSONB columns, full-text search

#### 2. **Authentication**
- Email/Password authentication
- JWT token-based sessions
- Row Level Security (RLS)
- Protected routes

#### 3. **RESTful API**
- Auto-generated REST endpoints
- CRUD operations for all tables
- Real-time subscriptions (future)

**Configuration:**
```javascript
// assets/js/config/config.js
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'eyJhbGc...'
};
```

**Documentation:** [Supabase Docs](https://supabase.com/docs)

---

## 🧩 Architecture & Patterns

### **Clean Architecture**

```
┌─────────────────────────────────────────┐
│  Presentation Layer (HTML/CSS)          │
│  - modules/insights/insights.html       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Business Logic Layer (JavaScript)      │
│  - assets/js/services/insights-api.js   │
│  - Pure functions, no hard-coded data   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Data Access Layer (Supabase Client)    │
│  - assets/js/config/supabase-client.js  │
│  - CRUD operations, authentication      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Database (Supabase PostgreSQL)         │
│  - Tables, constraints, RLS policies    │
└─────────────────────────────────────────┘
```

---

### **Module Pattern**

**File Structure:**
```
modules/
├── insights/
│   ├── insights.html       ← UI
│   ├── insights.css        ← Styles
│   └── (uses services)     ← Logic
```

**Benefits:**
- Separation of concerns
- Reusable services
- Easy testing and maintenance

---

### **Singleton Pattern**

```javascript
// assets/js/services/insights-api.js
class InsightsAPI {
    constructor() { /* ... */ }
    async getInsightsDashboard() { /* ... */ }
}

// Export singleton instance
export default new InsightsAPI();
```

**Used in:**
- `insights-api.js` - Insights calculations
- `supabase-client.js` - Database client
- `authService.js` - Authentication service

---

## 🎯 Design Patterns & Best Practices

### **1. ES6 Classes**
```javascript
class InsightsAPI {
    constructor() { this.cache = {}; }
    async fetchAllData() { /* ... */ }
}
```

### **2. Async/Await**
```javascript
async function loadInsights() {
    const data = await insightsAPI.getInsightsDashboard();
    updateUI(data);
}
```

### **3. Promises (Parallel Execution)**
```javascript
const [tasks, milestones, goals] = await Promise.all([
    supabase.select('tasks'),
    supabase.select('milestones'),
    supabase.select('goals')
]);
```

### **4. Caching Strategy**
```javascript
// 1-minute TTL cache
if (now - lastFetch < 60000) {
    return cachedData;
}
```

### **5. Error Handling**
```javascript
try {
    const data = await fetchData();
} catch (error) {
    console.error('Failed:', error);
    showErrorMessage(error.message);
}
```

---

## 📦 Project Dependencies

### **Runtime Dependencies**

| Package | Type | Source | Purpose |
|---------|------|--------|---------|
| Chart.js | CDN | jsDelivr | Data visualization |
| Supabase JS Client | Built-in | Custom | Database & Auth |

**No npm install required!** All dependencies loaded via CDN or custom modules.

---

### **Development Tools (Optional)**

| Tool | Purpose | Installation |
|------|---------|-------------|
| **VS Code** | Code editor | [Download](https://code.visualstudio.com/) |
| **Live Server** | Local dev server | VS Code extension |
| **Chrome DevTools** | Debugging | Built-in browser |
| **Git** | Version control | [Download](https://git-scm.com/) |

---

## 🔧 Build Tools

**None required!** This is a static website with:
- ❌ No webpack/bundler
- ❌ No npm/yarn
- ❌ No build step
- ✅ Direct browser execution
- ✅ ES6 modules natively supported

---

## 🌐 Browser Compatibility

### **Supported Browsers**

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| **Chrome** | 90+ | Recommended |
| **Firefox** | 88+ | Full support |
| **Safari** | 14+ | Full support |
| **Edge** | 90+ | Chromium-based |
| **Opera** | 76+ | Full support |

### **Required Browser Features**

- ✅ ES6 Modules (`type="module"`)
- ✅ Async/Await
- ✅ Fetch API
- ✅ LocalStorage
- ✅ CSS Grid & Flexbox
- ✅ CSS Custom Properties (variables)

---

## 📁 File Organization

### **JavaScript Services**

```
assets/js/
├── config/
│   ├── config.js              ← Supabase credentials
│   └── supabase-client.js     ← Database client
├── services/
│   ├── insights-api.js        ← Insights business logic
│   ├── goalService.js         ← Goals CRUD
│   ├── taskService.js         ← Tasks CRUD
│   └── milestoneService.js    ← Milestones CRUD
├── auth/
│   └── authService.js         ← Authentication
└── utils/
    └── helpers.js             ← Utility functions
```

### **Modules (Pages)**

```
modules/
├── auth/
│   ├── login.html
│   └── register.html
├── dashboard/
│   └── dashboard.html
├── insights/
│   ├── insights.html
│   └── insights.css
├── goals/
│   ├── goals.html
│   └── goal-detail.html
└── tasks/
    └── tasks.html
```

---

## 🔐 Security

### **Authentication**
- JWT-based sessions
- Secure password hashing (Supabase)
- Token stored in localStorage
- Auto-redirect on expired sessions

### **Row Level Security (RLS)**
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (auth.uid() = user_id);
```

### **API Security**
- CORS enabled for specific origins
- Anon key (public) for client-side
- Service key (secret) for server-side only

---

## 📊 Data Flow Architecture

```
User Action (Click Button)
       ↓
HTML Event Listener
       ↓
JavaScript Function
       ↓
Service Layer (insights-api.js)
       ↓
Supabase Client (supabase-client.js)
       ↓
HTTP Request (Fetch API)
       ↓
Supabase REST API
       ↓
PostgreSQL Database
       ↓
Response (JSON)
       ↓
Update UI (DOM Manipulation)
```

---

## 🚀 Performance Optimizations

### **1. Caching**
- In-memory cache for API calls (60s TTL)
- Browser localStorage for auth tokens

### **2. Lazy Loading**
- Charts loaded only on Insights page
- Modular JS files (not monolithic)

### **3. Parallel Requests**
```javascript
// Fetch multiple tables simultaneously
await Promise.all([
    supabase.select('tasks'),
    supabase.select('goals')
]);
```

### **4. Minimal Dependencies**
- Only Chart.js (159KB) loaded via CDN
- No heavy frameworks (React, Vue, Angular)

---

## 📚 Learning Resources

### **For JavaScript (ES6+)**
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [ES6 Features](https://github.com/lukehoban/es6features)

### **For Supabase**
- [Supabase Quickstart](https://supabase.com/docs/guides/getting-started)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

### **For Chart.js**
- [Chart.js Getting Started](https://www.chartjs.org/docs/latest/getting-started/)
- [Chart.js Examples](https://www.chartjs.org/docs/latest/samples/)

---

## 🔄 Future Technology Considerations

### **Potential Additions**

| Technology | Purpose | Priority |
|-----------|---------|----------|
| **TypeScript** | Type safety | Medium |
| **Vite** | Build tool, faster dev | Low |
| **Tailwind CSS** | Utility-first CSS | Medium |
| **Vitest** | Unit testing | High |
| **GitHub Actions** | CI/CD pipeline | Medium |

---

## 📝 Version History

| Date | Version | Changes |
|------|---------|---------|
| Apr 26, 2026 | 1.0.0 | Initial release with Insights module |
| Apr 5, 2026 | 0.9.0 | Risk Engine implementation |
| Apr 1, 2026 | 0.8.0 | Dashboard enhancements |
| Feb 23, 2026 | 0.5.0 | Core modules (Goals, Tasks, Milestones) |

---

*Last Updated: April 26, 2026*
