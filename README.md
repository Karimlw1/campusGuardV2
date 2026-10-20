# CampusGuard — Backend API

FastAPI + MySQL backend for the CampusGuard system.

## Setup (Windows)

### 1. Create virtual environment
```bash
cd C:\Users\alvin\Documents\CampusGuard
py -3.12 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Create the database
Open MySQL Workbench or run:
```sql
CREATE DATABASE campusguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure .env
```bash
copy .env.example .env
notepad .env
```
Fill in your MySQL password. Everything else can stay default.

### 4. Seed the database (first time only)
```bash
python seed.py
```
This creates gates, admin, guard, and student accounts with QR codes.

### 5. Start the server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open: http://localhost:8000/docs

## Demo Accounts (created by seed.py)

| Role     | Email / Reg No.         | Password     |
|----------|-------------------------|--------------|
| Admin    | admin@campusguard.ug    | admin123     |
| Guard    | guard@campusguard.ug    | guard123     |
| Student  | 23/BIT/BU/R/0017        | student123   |
| Staff    | STF/008                 | staff123     |
| Lecturer | LEC/021                 | lecturer123  |

## API Endpoints

| Method | Path                  | Description            |
|--------|-----------------------|------------------------|
| POST   | /auth/login           | Login                  |
| POST   | /auth/refresh         | Refresh token          |
| GET    | /users                | List all users         |
| POST   | /users                | Create user + QR       |
| GET    | /users/{id}/qr        | Download QR image      |
| GET    | /users/search?q=      | Search by name/reg no  |
| POST   | /gates/scan           | Scan QR at gate        |
| POST   | /gates/admit          | Log entry/exit         |
| GET    | /entries              | Entry history          |
| GET    | /visitors             | List visitors          |
| POST   | /visitors             | Log new visitor        |
| GET    | /alerts               | List alerts            |
| GET    | /dashboard/stats      | Live stats             |
| GET    | /reports/generate     | Export PDF/Excel       |
"# campusGuardV2" 
