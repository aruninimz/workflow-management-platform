# FlowBit SEP - User Guide

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Dashboard Overview](#dashboard-overview)
4. [Managing Goals](#managing-goals)
5. [Managing Milestones](#managing-milestones)
6. [Managing Tasks](#managing-tasks)
7. [Insights & Analytics](#insights--analytics)
8. [Team Collaboration](#team-collaboration)
9. [Tips & Best Practices](#tips--best-practices)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### What is FlowBit SEP?

FlowBit SEP (Strategic Execution Platform) is a **workflow management system** designed to help teams:

- 🎯 **Set and track strategic goals**
- 📍 **Break goals into milestones**
- ✅ **Manage tasks and deliverables**
- 📊 **Monitor progress with analytics**
- 👥 **Collaborate with team members**

### First Time Setup

1. **Register an Account**
   - Navigate to `modules/auth/register.html`
   - Enter your details (Full Name, Email, Password)
   - Click **"Sign Up"**

2. **Login**
   - Go to `modules/auth/login.html`
   - Enter your credentials
   - Click **"Sign In"**

3. **Access Dashboard**
   - After login, you'll see your main dashboard
   - Start creating your first goal!

---

## 🔐 Authentication

### Creating an Account

**Location:** `modules/auth/register.html`

**Steps:**
1. Enter **Full Name** (displayed in the app)
2. Enter **Email** (used for login)
3. Choose a **Password** (minimum 6 characters)
4. Click **"Sign Up"**

**Email Format:** Must be valid (e.g., `user@example.com`)

---

### Logging In

**Location:** `modules/auth/login.html`

**Steps:**
1. Enter your **Email**
2. Enter your **Password**
3. Click **"Sign In"**

**Remember Me:** Your session lasts until you logout or the token expires (typically 1 hour)

---

### Logging Out

**How to Logout:**
1. Click your **avatar** (top-right corner)
2. Select **"Logout"**
3. You'll be redirected to the login page

**Session Expired:** If you see "JWT expired" error, simply log in again.

---

## 📊 Dashboard Overview

**Location:** `modules/dashboard/dashboard.html`

### What You'll See

The dashboard shows a high-level overview of your work:

#### **Top Stats Bar**
- 📋 **Active Goals** - Goals currently in progress
- 🎯 **Milestones** - Total milestones across all goals
- ✅ **Tasks Completed** - Tasks you've finished
- 📈 **Health Score** - Overall project health (0-100)

#### **Task Completion Trends Chart**
- **Line chart** showing tasks completed per week
- **Last 30 days** of activity
- Helps identify velocity trends

#### **Recent Activity**
- Latest goals created
- Recent task completions
- Milestone updates

---

## 🎯 Managing Goals

**Location:** `modules/goals/goals.html`

### What is a Goal?

A **goal** is a high-level objective you want to achieve. Examples:
- "Launch New Product"
- "Improve Customer Satisfaction by 20%"
- "Build Marketing Website"

---

### Creating a New Goal

**Steps:**
1. Click **"+ New Goal"** button (top-right)
2. Fill in the modal:
   - **Title** (required): Short, clear name
   - **Description**: Detailed explanation
   - **Start Date**: When to begin
   - **Target Date**: Deadline
   - **Priority**: LOW, MEDIUM, HIGH, CRITICAL
   - **Status**: PLANNING, ACTIVE, ON_HOLD, COMPLETED
   - **Category**: Development, Design, Marketing, etc.
3. Click **"Create Goal"**

**Tips:**
- Use specific, measurable titles
- Set realistic target dates
- Start with 3-5 goals maximum

---

### Viewing Goal Details

**Location:** `modules/goals/goal-detail.html?id={goal_id}`

**What You'll See:**
- Goal title, description, dates
- **Progress bar** (auto-calculated from milestones)
- **Associated milestones**
- **Tasks** under each milestone
- **Activity timeline**

**Editing a Goal:**
1. Open goal detail page
2. Click **"Edit"** button
3. Modify fields
4. Click **"Save Changes"**

---

### Deleting a Goal

**Steps:**
1. Open goal detail page
2. Click **"Delete"** button (bottom-right)
3. Confirm deletion

**Warning:** This will also delete all associated milestones and tasks!

---

## 📍 Managing Milestones

**Location:** `modules/milestones/milestones.html`

### What is a Milestone?

A **milestone** is a significant checkpoint within a goal. Examples:
- "Complete User Research" (for Product Launch goal)
- "Design Mockups Approved"
- "Beta Testing Complete"

---

### Creating a New Milestone

**From Goals Page:**
1. Open a goal detail page
2. Scroll to **Milestones** section
3. Click **"+ Add Milestone"**
4. Fill in:
   - **Title** (required)
   - **Description**
   - **Due Date**
   - **Assignee** (optional)
   - **Status**: PLANNING, IN_PROGRESS, COMPLETED
5. Click **"Create Milestone"**

**From Milestones Page:**
1. Go to `modules/milestones/milestones.html`
2. Click **"+ New Milestone"**
3. **Select a Goal** (dropdown)
4. Fill in details
5. Click **"Create"**

---

### Viewing Milestone Details

**Location:** `modules/milestones/milestone-detail.html?id={milestone_id}`

**What You'll See:**
- Milestone title, description, dates
- **Parent goal** (clickable link)
- **Progress percentage** (from completed tasks)
- **Task list** (all tasks in this milestone)
- **Dependencies** (other milestones this depends on)

---

### Editing a Milestone

**Steps:**
1. Open milestone detail page
2. Click **"Edit"** button
3. Modify fields
4. Click **"Save"**

**Common Edits:**
- Move due date
- Change assignee
- Update status (IN_PROGRESS → COMPLETED)

---

## ✅ Managing Tasks

**Location:** `modules/tasks/tasks.html`

### What is a Task?

A **task** is a specific action item that contributes to a milestone. Examples:
- "Write user survey questions"
- "Conduct 10 customer interviews"
- "Analyze survey results"

---

### Creating a New Task

**Steps:**
1. Go to `modules/tasks/tasks.html`
2. Click **"+ New Task"**
3. Fill in the modal:
   - **Title** (required): Clear, actionable
   - **Description**: Details, context
   - **Goal**: Parent goal (dropdown)
   - **Milestone**: Parent milestone (dropdown)
   - **Assignee**: Who will do it
   - **Priority**: LOW, MEDIUM, HIGH, CRITICAL
   - **Status**: TODO, IN_PROGRESS, BLOCKED, COMPLETED
   - **Due Date**: Deadline
   - **Estimated Hours**: How long it will take
4. Click **"Create Task"**

**Tips:**
- Keep tasks small (1-8 hours)
- Use clear, action-oriented titles (e.g., "Write", "Design", "Test")
- Assign to specific people

---

### Updating Task Status

**Quick Update:**
1. Find task in the list
2. Click the **status dropdown**
3. Select new status:
   - **TODO** - Not started
   - **IN_PROGRESS** - Currently working on it
   - **BLOCKED** - Stuck, needs help
   - **COMPLETED** - Done!

**Detailed Update:**
1. Click on the task to open details
2. Edit fields as needed
3. Add **actual hours** when completing
4. Click **"Save"**

---

### Filtering Tasks

**Available Filters:**
- **By Status**: Show only TODO, IN_PROGRESS, etc.
- **By Priority**: HIGH, CRITICAL tasks
- **By Assignee**: Your tasks vs. team tasks
- **By Goal**: Tasks for a specific goal
- **By Due Date**: Overdue, due this week, etc.

**How to Filter:**
1. Use the **filter dropdown** (top of page)
2. Select criteria
3. Click **"Apply"**
4. Click **"Clear Filters"** to reset

---

## 📊 Insights & Analytics

**Location:** `modules/insights/insights.html`

### Overview

The **Insights Dashboard** provides data-driven analytics to help you:
- Track team velocity
- Identify bottlenecks
- Monitor health metrics
- Make informed decisions

---

### KPI Cards (Top Row)

#### 1. **On-Time Completion %**
- **What it shows**: Percentage of tasks completed before/on their due date
- **Formula**: (On-time completions / Total completions) × 100
- **Good target**: 80%+

**How to Improve:**
- Set realistic due dates
- Identify blockers early
- Adjust timelines as needed

---

#### 2. **Average Completion Time**
- **What it shows**: Average days from task creation to completion
- **Formula**: Average of (completed_at - created_at)
- **Good target**: 3-5 days

**How to Improve:**
- Break tasks into smaller chunks
- Remove blockers quickly
- Prioritize high-impact work

---

#### 3. **Tasks per Member**
- **What it shows**: Average active tasks assigned per team member
- **Formula**: Active tasks / Unique assignees
- **Good target**: 5-10 tasks per person

**Interpretation:**
- **< 5**: Team may be underutilized
- **5-10**: Healthy workload
- **10-15**: Consider redistributing
- **> 15**: Overloaded, risk of burnout

---

#### 4. **Health Score**
- **What it shows**: Overall project health (0-100)
- **Formula**: Composite of:
  - On-Time Completion (40%)
  - Task Velocity (30%)
  - Workload Balance (20%)
  - Risk Level (10%)

**Score Ranges:**
- **80-100**: Excellent (Green)
- **60-79**: Good (Blue)
- **40-59**: Fair (Yellow)
- **20-39**: Poor (Orange)
- **0-19**: Critical (Red)

**How to Improve:**
- Complete tasks on time
- Maintain steady velocity
- Balance workload across team
- Address overdue items

---

### Task Completion Trends Chart

**What it shows:**
- Line chart of tasks completed per week
- **Last 30 days** (5 weekly buckets)

**How to Use:**
- **Upward trend**: Velocity increasing ✅
- **Flat trend**: Consistent pace ✅
- **Downward trend**: Investigate ⚠️
- **Spikes**: Identify what caused them

---

### Workload Distribution Chart

**What it shows:**
- Donut chart of task distribution by status
- **Segments**:
  - 🟢 Completed
  - 🔵 In Progress
  - 🟠 To Do
  - 🔴 Blocked

**Healthy Distribution:**
- Completed: 30-40%
- In Progress: 20-30%
- To Do: 30-40%
- Blocked: < 5%

**Red Flags:**
- Blocked > 10% → Address blockers urgently
- In Progress > 50% → Tasks not being completed
- To Do > 60% → Too much queued work

---

### Goals by Category Chart

**What it shows:**
- Polar area chart of goals grouped by category
- Categories: Development, Design, Marketing, Operations, Strategy, Other

**How to Use:**
- Identify which areas get the most focus
- Balance strategic priorities
- Align with business objectives

---

### Team Performance Cards

**What it shows:**
- Individual team member stats:
  - **Completed tasks** (all-time)
  - **Total tasks** (assigned)
  - **Active tasks** (current workload)
  - **Completion rate** (%)

**How to Use:**
- Identify top performers
- Spot overloaded team members
- Redistribute work if needed

---

### Key Insights Panel

**What it shows:**
- **Automated insights** generated from your data
- Insights types:
  - 🔴 **Critical** - Requires immediate action
  - ⚠️ **Warning** - Potential issue
  - ℹ️ **Info** - General observation
  - ✅ **Positive** - Good news!

**Example Insights:**

1. **Velocity Decline**
   - "Team velocity decreased by 71% this week (2 vs 7 tasks)"
   - **Action**: Investigate blockers or capacity issues

2. **Resource Constraint**
   - "Sarah is at 220% capacity with 22 tasks"
   - **Action**: Redistribute tasks to other team members

3. **Time Budget Status**
   - "86% time utilization - 172h used of 200h"
   - **Action**: Monitor closely to avoid overruns

4. **Overdue Items Detected**
   - "65 items overdue (54 tasks, 11 milestones)"
   - **Action**: Prioritize overdue work immediately

---

### How to Interpret Insights

#### **Critical Insights (Red)**
- **Stop and address immediately**
- Usually indicates blockers or risks
- Examples: Overdue items, resource constraints

#### **Warning Insights (Yellow)**
- **Review and plan action**
- May become critical if ignored
- Examples: Declining velocity, budget concerns

#### **Info Insights (Blue)**
- **Good to know**
- Monitor trends
- Examples: Budget status, milestone progress

#### **Positive Insights (Green)**
- **Celebrate wins!**
- Reinforce good practices
- Examples: Velocity improvement, no overdue items

---

## 👥 Team Collaboration

### Assigning Tasks

**How to Assign:**
1. Create or edit a task
2. Click **"Assignee"** dropdown
3. Select team member
4. Click **"Save"**

**Best Practices:**
- Assign to one person (clear accountability)
- Balance workload (check Tasks per Member KPI)
- Consider skills and availability

---

### Viewing Team Workload

**From Insights Page:**
1. Go to `modules/insights/insights.html`
2. Scroll to **Team Performance** section
3. See each member's:
   - Active tasks
   - Completion rate
   - Total workload

**From Tasks Page:**
1. Go to `modules/tasks/tasks.html`
2. Filter by **Assignee**
3. View that person's task list

---

### Communication Tips

**Within the App:**
- Use task **descriptions** for context
- Add **comments** (if feature is enabled)
- Tag team members with @mentions (future feature)

**Outside the App:**
- Use Slack/Teams for quick questions
- Reference task IDs in messages (e.g., "Task #123")
- Schedule regular standups to review progress

---

## 💡 Tips & Best Practices

### Goal Setting

✅ **DO:**
- Set 3-5 goals at a time (focus)
- Use SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)
- Review goals weekly

❌ **DON'T:**
- Create vague goals ("Improve things")
- Set unrealistic deadlines
- Create too many goals (spreads focus thin)

---

### Milestone Planning

✅ **DO:**
- Break goals into 3-7 milestones
- Set clear success criteria
- Order milestones logically (dependencies)

❌ **DON'T:**
- Create milestones that are too big (> 1 month)
- Skip milestones (goals → tasks directly)
- Ignore dependencies

---

### Task Management

✅ **DO:**
- Keep tasks small (1-8 hours)
- Update status regularly (daily)
- Set realistic due dates
- Break down complex tasks

❌ **DON'T:**
- Create monster tasks (> 16 hours)
- Leave tasks in IN_PROGRESS for weeks
- Assign multiple people to one task
- Forget to mark tasks COMPLETED

---

### Using Analytics

✅ **DO:**
- Check Insights dashboard weekly
- Act on critical insights immediately
- Track trends over time (velocity, health score)
- Share insights with the team

❌ **DON'T:**
- Ignore red/critical metrics
- Obsess over daily fluctuations
- Rely solely on data (talk to your team!)
- Set unrealistic targets based on one-time spikes

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" or Network Error

**Symptoms:**
- Data doesn't load
- Console shows "Failed to fetch"
- Empty dashboards

**Solutions:**
1. Check `assets/js/config/config.js` - ensure Supabase URL/key are correct
2. Verify Supabase project is active (not paused)
3. Check internet connection
4. Clear browser cache (Ctrl+Shift+Delete)
5. Try incognito/private window

---

### Issue: Login Not Working

**Symptoms:**
- "Invalid credentials" error
- Stuck on login page
- No response after clicking "Sign In"

**Solutions:**
1. Verify email/password are correct
2. Check caps lock is off
3. Clear localStorage:
   ```javascript
   // Browser console (F12)
   localStorage.clear();
   location.reload();
   ```
4. Try registering a new account
5. Check browser console (F12) for errors

---

### Issue: JWT Expired Error

**Symptoms:**
- "JWT expired" in console
- Suddenly logged out
- Data stops loading

**Solution:**
```javascript
// Browser console (F12):
localStorage.clear();
window.location.href = 'modules/auth/login.html';
```
Then log in again.

**Prevention:** Log in/out properly (don't just close browser)

---

### Issue: Charts Not Displaying

**Symptoms:**
- Blank chart areas
- Console error: "Chart is not defined"

**Solutions:**
1. Check Chart.js CDN is loaded:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
   ```
2. Verify internet connection (CDN requires online)
3. Clear browser cache
4. Try different browser
5. Check for JavaScript errors in console

---

### Issue: No Data Showing

**Symptoms:**
- Empty lists (goals, tasks, milestones)
- Dashboard shows zeros
- Insights page blank

**Solutions:**
1. **Create some data first!**
   - Add a goal
   - Add a milestone
   - Add tasks
2. Run seed data:
   - Open Supabase SQL Editor
   - Run `database/insights-seed-data.sql`
3. Check filters are not hiding data
4. Verify you're logged in as correct user

---

### Issue: Slow Performance

**Symptoms:**
- Pages take long to load
- Charts render slowly
- UI feels sluggish

**Solutions:**
1. Reduce data volume (archive old goals)
2. Close unused browser tabs
3. Clear browser cache
4. Check Supabase dashboard (free tier limits)
5. Update to latest browser version

---

## 📞 Getting More Help

### Documentation
- **Setup Guide**: `SETUP_INSTRUCTIONS.md`
- **Tech Stack**: `TECHNOLOGIES_USED.md`
- **This User Guide**: `USER_GUIDE.md`

### External Resources
- **Supabase Docs**: https://supabase.com/docs
- **Chart.js Docs**: https://www.chartjs.org/docs/
- **JavaScript MDN**: https://developer.mozilla.org/en-US/docs/Web/JavaScript

### Contact Support
- **GitHub Issues**: (if open-source)
- **Email**: support@flowbit.com (if applicable)
- **Slack/Discord**: (if community exists)

---

## 🎉 Quick Start Checklist

Ready to use FlowBit SEP? Follow this checklist:

- [ ] ✅ Account created and logged in
- [ ] 🎯 First goal created
- [ ] 📍 Milestone added to goal
- [ ] ✅ Tasks created and assigned
- [ ] 📊 Visited Insights dashboard
- [ ] 👥 Invited team members (if applicable)
- [ ] 📈 Updated task status to COMPLETED
- [ ] 🏆 Checked Health Score

**Congratulations! You're ready to execute your strategy!** 🚀

---

*Last Updated: April 26, 2026*
