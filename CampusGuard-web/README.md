# CampusGuard — Web Frontend

React.js dashboard for the CampusGuard access control system.

## Setup

```bash
# 1. Copy env file
copy .env.example .env

# 2. Install dependencies
npm install

# 3. Start dev server
npm start
```

Open http://localhost:3000

## Demo Logins (no backend needed to explore UI)

| Role    | Username | Password  |
|---------|----------|-----------|
| Admin   | admin    | admin123  |
| Guard   | guard    | guard123  |
| Student | student  | student123|

> Connect backend (port 8000) for real data.

## Pages

| Route      | Role          | Description                        |
|------------|---------------|------------------------------------|
| /          | Admin, Guard  | Live dashboard + stats             |
| /gate      | Admin, Guard  | QR scan, guarded & auto mode       |
| /users     | Admin only    | User CRUD + QR download            |
| /visitors  | Admin, Guard  | Visitor log + checkout             |
| /alerts    | Admin, Guard  | Security alerts + resolve          |
| /reports   | Admin only    | Generate PDF/Excel reports         |
| /portal    | Student/Staff | Personal entry/exit history        |

## Stack

- React 18 + React Router 6
- Recharts (charts)
- Lucide React (icons)
- Axios (API calls)
"# campusGuardV2" 
"# campusGuardV2" 
