# Stackly Admin Portal — Quick Access & Feature Guide

This guide provides everything your team needs to set up, authenticate, and navigate the **Stackly Admin Portal**.

---

## 1. Quick Credentials & Login

| Detail | Value |
| :--- | :--- |
| **Admin Portal URL** | `http://localhost:3000/admin` (or `http://localhost:3000/admin/login`) |
| **Default Admin Email** | `admin@stackly.local` |
| **Default Admin Password** | `Admin@Dev2026!` |

---

## 2. Prerequisites & Environment Setup

When teammates pull the code from GitHub, `.env` files are not included (they are ignored by `.gitignore` for security). Follow these steps to ensure local setup is complete:

### Step 1: Backend Setup
1. Open `backend/.env` (create from `backend/.env.example` if it doesn't exist).
2. Ensure the following environment variables are present:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   API_BASE_URL=http://localhost:5000/api
   CORS_ORIGINS=http://localhost:3000

   # MongoDB Atlas Connection
   MONGODB_URI=mongodb+srv://stacklyadmin:81HFY5juHC7EYcXE@cluster0.eozmqsb.mongodb.net/?appName=Cluster0
   MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1

   # JWT & Admin Authentication (Required!)
   JWT_SECRET=change-this-to-a-random-64-char-string
   JWT_ADMIN_SECRET=stackly-admin-dev-secret-64char-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ADMIN_EMAIL=admin@stackly.local
   ADMIN_PASSWORD=Admin@Dev2026!
   ```
3. Run the bootstrap script if the admin account is not yet initialized in your database:
   ```bash
   cd backend
   npm run create-admin
   ```
   *(If using the shared Atlas database, the account is already initialized!)*
4. Start the backend:
   ```bash
   npm run dev
   ```

### Step 2: Frontend Setup
1. In `frontend/`, verify `frontend/.env.local` contains:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
   ```
2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 3. How to Log In

1. Open your browser and navigate to: **`http://localhost:3000/admin/login`**
2. Enter the admin credentials:
   - **Email:** `admin@stackly.local`
   - **Password:** `Admin@Dev2026!`
3. Click **"Sign in to Admin"**.
4. You will be redirected directly to the **Admin Dashboard** (`/admin`).

---

## 4. What's Inside the Admin Panel

The Admin Console provides real-time, cross-platform telemetry and administrative insights:

### 🌟 Top Navigation & Controls
- **Dashboard Quick-Link:** Fast navigation back to the user workspace dashboard (`/dashboard`).
- **Theme Toggle:** Switch smoothly between **Light** and **Dark** modes.
- **Live Refresh:** Instantly fetch the newest platform metrics on-demand without reloading the page.
- **Secure Logout:** Clears your admin session token safely.
- **Reporting Period Selector:** Filter all operational metrics across **7 days**, **30 days**, or **90 days**.

### 📊 Platform KPI Cards
- **Registered Users:** Total registered accounts and the number of active users in the selected period.
- **Published Sites:** Count of live, published websites compared to total created workspaces.
- **Page Views:** Total views across all published websites with unique visitor counts.
- **Paid Revenue:** Total platform revenue in ₹ (INR) and count of completed customer orders.

### 📈 Visual Telemetry & System Health
- **Platform Traffic Visualizer:** Daily interactive bar chart displaying platform-wide traffic and view trends.
- **System Health Monitor:**
  - Deployed versions count
  - Building / Queued deployments
  - Failed deployments (with immediate alert highlighting)
  - Published blog posts & active builder templates

### 🚀 Workspaces, Accounts & Deployments
- **Top Workspaces:** Leaderboard of highest-traffic websites across the entire platform.
- **Recent Accounts:** Inspection of newly registered users, their emails, and plan tiers (`free`, `pro`, `enterprise`).
- **Recent Deployments:** Audit log of recent site publishes, including version (`v1`), deploy status, author, and timestamp.
- **Plan Distribution:** Breakdown of the user base across subscription tiers.
