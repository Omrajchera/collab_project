# 🚀 CollabHub - Modern Project & Task Board (Full-Stack)

Welcome to **CollabHub**! This is a state-of-the-art Project and Task Management application featuring user accounts, interactive Kanban boards, and Role-Based Access Control (RBAC). 

This project is built using:
- **Backend**: Node.js + Express REST API + self-contained SQLite database.
- **Frontend**: React + Vite SPA + custom premium Vanilla CSS (Glassmorphism, Dark Mode out-of-the-box, Micro-animations).

---

## 📂 Project Structure

Here is how the project files are organized inside the workspace:

```text
project-collab-hub/
├── package.json                 # Root orchestrator (runs client & server together)
├── README.md                    # This help guide
├── server/                      # Express REST API Server
│   ├── package.json             # Server dependencies (sqlite3, bcryptjs, jwt)
│   ├── server.js                # Server entry point & production hosting configuration
│   ├── db.js                    # SQLite database initializer & table schemas
│   ├── middleware/
│   │   └── auth.js              # Session token validator & RBAC checks
│   └── routes/
│       ├── auth.js              # Signup, Login, Me endpoints
│       ├── projects.js          # Project CRUD & team member endpoints
│       ├── tasks.js             # Task CRUD (Admin/Member permissions applied)
│       └── dashboard.js         # Stat counters, overdue logs, self-assignments
└── client/                      # React Frontend Client
    ├── package.json             # Client dependencies (lucide-react, react-router-dom)
    ├── vite.config.js           # Vite server settings & local development API proxy
    ├── index.html               # Main HTML wrapper (loads Google Fonts)
    └── src/
        ├── main.jsx             # React bootstrapper
        ├── App.css              # Custom premium Vanilla CSS design system
        ├── App.jsx              # App layout, navbar, and state routing
        ├── context/
        │   └── AuthContext.jsx  # Global session store & apiFetch helper
        └── components/
            ├── AuthPages.jsx    # Unified Login/Signup view
            ├── Dashboard.jsx    # Stats, active projects list, overdue panel
            └── ProjectBoard.jsx # Kanban column board (HTML5 Drag & Drop)
```

---

## 💻 Running the App Locally (Beginner Guide)

Since we've wrapped the frontend and backend in a root orchestrator, running the app locally is incredibly simple!

### Step 1: Open Your Terminal
Open your terminal (Command Prompt, PowerShell, or Git Bash) and navigate to the project directory:
```bash
cd C:\Users\hp\.gemini\antigravity\scratch\project-collab-hub
```

### Step 2: Install All Dependencies
We have a custom command that goes into both folders and installs everything for you:
```bash
npm run install-all
```
*(This installs Express and SQLite for the server, and React/Vite for the client, along with all styling assets)*

### Step 3: Start the Development Server
Run the following master command:
```bash
npm run dev
```
This boots up **both** servers concurrently in a single terminal window:
- The backend API starts on `http://localhost:5000`
- The React frontend starts on `http://localhost:5173`

### Step 4: Open Your Browser
Open your browser and navigate to:
```text
http://localhost:5173
```
*You can now sign up, create projects, invite other users, create tasks, and drag them between Kanban columns!*

---

## 🔒 Understanding Roles & Access Control

CollabHub enforces strict Role-Based Access Control (RBAC):

| Feature | Project Admin | Project Member |
| :--- | :---: | :---: |
| **Delete Project Workspace** | ✅ Yes | ❌ No |
| **Add / Invite Team Members** | ✅ Yes | ❌ No |
| **Change Member Roles** | ✅ Yes | ❌ No |
| **Create Tasks** | ✅ Yes | ✅ Yes |
| **Edit Task Title & Desc** | ✅ Yes | ❌ No |
| **Edit Task Status & Priority** | ✅ Yes | ✅ Yes *(Only if assigned to them)* |
| **Delete Tasks** | ✅ Yes | ❌ No |

*If a project Member clicks on a task assigned to someone else, they see a clean red warning alert: **"Read-Only. Only Admins or the assignee can modify this task."**.*

---

## 🌐 Deploying Live to Railway (Mandatory Step)

Railway is an incredible platform that lets you host full-stack projects in under 5 minutes. 

Because we configured the Express backend to **compile and serve the React client directly from the server portfolio**, you only need to deploy a **single service** on Railway, keeping it simple and free!

### Step 1: Create a GitHub Repository
1. Log in to your GitHub account and create a new repository (e.g., `collabhub-app`).
2. Initialize Git and push this project directory to GitHub:
   ```bash
   git init
   git add .
   git commit -m "initial release"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

### Step 2: Log in to Railway
1. Go to [Railway.app](https://railway.app/) and sign up with your GitHub account.

### Step 3: Launch a New Service
1. Click **+ New Project** in the upper-right corner of your Railway dashboard.
2. Select **Deploy from GitHub repo**.
3. Choose your repository (`collabhub-app`).

### Step 4: Add Environment Variables
Before deploying, click on your service box, open the **Variables** tab, and add:
- `PORT` = `8080` (or leave empty, Railway injects this automatically)
- `JWT_SECRET` = `enter_any_long_random_combination_of_characters_here`

### Step 5: Configure Build Commands
Railway reads our root `package.json` and automatically runs:
1. `npm install` (Installs dependencies)
2. `npm run build` (Compiles the frontend assets into `/client/dist`)
3. `npm start` (Launches the server, which serves both the REST API and the compiled React assets)

### Step 6: Generate a Public Domain
1. In Railway, open the **Settings** tab of your service.
2. Under the **Networking** section, click **Generate Domain**.
3. Railway will generate a public URL (e.g., `collabhub-production.up.railway.app`).
4. **Done! Your application is now live, secure, and fully operational globally!** 🚀
