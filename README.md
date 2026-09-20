# EstatePulse - High-Velocity Real Estate CRM & Operations OS

> **Full-Stack Developer Technical Interview Project**  
> An enterprise-grade, production-style Real Estate CRM built specifically for luxury developer sales operations, real-time inventory allocation, and concurrency-guarded property unit bookings.
>
> 🔗 **GitHub Repository**: [https://github.com/Yogesh-kk49/Real_estate_CRM](https://github.com/Yogesh-kk49/Real_estate_CRM)

---

## 1. Project Overview

**EstatePulse** is a specialized real estate sales CRM engineered for high-velocity property developers and sales teams. It models residential luxury developments in Chennai (such as beachfront luxury villas along ECR, sky suites on Boat Club Road, panoramic oceanfront residences at Marina Skyline, and modern executive towers along the OMR IT Corridor).

EstatePulse features an **architectural, high-contrast, clean visual identity** (warm linen canvas, crisp white cards, bold slate typography, and architectural terracotta accents). It prioritizes information density, strict typography hierarchy (Plus Jakarta Sans with tabular figures for currency in Lakhs/Crores), and instant state clarity.


---

## 2. Core Features & Business Highlights

### 📋 Lead Pipeline & Lifecycle Progression
- **7-Stage Pipeline**: Systematic progression: `New` → `Contacted` → `Site Visit` → `Interested` → `Negotiation` → `Booked` / `Lost`.
- **Interactive Lifecycle Stepper**: 1-click stage advancement directly from the customer's 360° profile view.
- **Budget & Preference Tracking**: Budgets formatted cleanly in Indian denomination (₹ Lakhs and Crores).
- **Search & Multi-Filter**: Real-time filtering by lead stage, property interest, priority, and assigned sales consultant.

### 🛡️ Concurrency-Guarded Booking Engine (Zero Double-Booking)
- **Atomic Database Locks**: Connects buyer leads to property units with agreed value, token deposit, payment reference, and contract notes.
- **Zero Double-Booking Guarantee**: Backend conditional row updates (`WHERE id = :id AND availability = 'Available'`) and unique constraints prevent two consultants from booking the same unit, returning clean **HTTP 409 Conflict** errors with user-friendly resolution prompts.

### 👥 Staff Recruitment & Delegation (Admin-Only)
- **Recruit Sales Staff**: Administrators can onboard new sales consultants by providing their full name, work email (or Gmail), mobile number, and initial password.
- **Staff-Only Role Protection**: The recruitment workflow is strictly locked to create **Sales Consultants (`SALES_EMPLOYEE`)** only, preventing unauthorized admin escalation.
- **Lead Delegation & Reassignment**: Admins can distribute unassigned or existing buyer leads to newly recruited consultants.
- **Access Control**: Instant account deactivation and reactivation controls.

### 🏢 Relational Property Hierarchy & Live Matrix
- **Relational Schema**: `Project` → `Building` → `Unit`.
- **Inventory Matrix**: Tracks floors, super built-up area (sq.ft), carpet area, facing direction, and configuration (`1BHK`, `2BHK`, `3BHK`, `4BHK`, `Penthouse`, `Villa`).
- **Real-Time Unit States**: Color-coded badges for `Available`, `Reserved`, and `Booked`.

### ⏱️ 360° Interaction Audit Trail & Follow-up Intelligence
- **Interaction Logs**: Chronological timeline covering `Phone Call`, `Meeting`, `WhatsApp Message`, `Site Visit`, `General Note`, `Stage Change`, and `Unit Booking`.
- **Urgency Classification**: Automated badges highlighting `Due Today`, `Overdue`, and upcoming consultations.
- **Past-Date Validation**: Ensures scheduled follow-up touchpoints cannot be placed in the past.

### 🔐 Role-Based Access Control (RBAC) & Persona Testing
- **Executive Admin**: Full organization-wide oversight, staff recruitment, property configuration, and cross-portfolio analytics.
- **Sales Consultant**: Scoped visibility limited strictly to assigned leads and self-booked units.
- **Topbar Persona Switcher**: Allows interviewers and reviewers to toggle between Admin and Consultant accounts with 1 click to verify RBAC isolation in real time.
- **Secure Sign Out Flow**: Confirmation dialog before ending sessions and automatic clearance of JWT authentication tokens.

---

## 3. Demo Access Credentials

| Role | Email | Password | Scope & Privileges |
|---|---|---|---|
| **Administrator** | `admin@coromandel.in` | `Admin@1234` | Full system control, recruit sales consultants, manage all leads & inventory |
| **Sales Consultant** | `meera@coromandel.in` | `Sales@1234` | Scoped consultant workspace, manage assigned leads, execute bookings |
| **Sales Consultant** | `anand@coromandel.in` | `Sales@1234` | Scoped consultant workspace, manage assigned leads, execute bookings |

> 💡 **Quick Sign-In**: The Login screen features an on-demand modal with handy `[Load Admin]` and `[Load Staff]` buttons for instant evaluation without typing.

---

## 4. Tech Stack

| Layer | Technologies | Rationale |
|---|---|---|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn | High performance, auto-generated OpenAPI/Swagger documentation at `/api/docs`, strict validation guards. |
| **Database** | SQLite (WAL Mode + Foreign Keys + Row Locks) | Zero-friction setup for evaluation, ACID transaction guarantees, immediate write-ahead logging. |
| **Auth & Security** | PyJWT (HS256), Passlib, Bcrypt | Stateless JWT bearer tokens, role verification dependencies, salted password hashing. |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React | Modern SPA architecture, lightning-fast HMR, high-contrast accessible design system. |
| **Testing** | Python `unittest` + `httpx.ASGITransport` + `asyncio` | Automated concurrency stress tests, RBAC access tests, and validation constraint tests. |

---

## 5. System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (React 18 + Vite + Tailwind)"]
        UI[UI Views: Dashboard, Leads, Properties, Bookings, Team]
        AuthCtx[AuthContext & Instant Persona Switcher]
        APIClient[Axios Client with Bearer Interceptors]
    end

    subgraph Server ["Backend (FastAPI + Python 3.12)"]
        Router[API Routers: /auth, /leads, /properties, /bookings, /users, /dashboard]
        Dep[Dependencies: JWT Auth & RBAC Guards]
        BService[Booking Service: Atomic Concurrency Lock]
        LService[Lead Service: Scoping & Lifecycle Validation]
    end

    subgraph DB ["Database (SQLite in WAL Mode)"]
        UnitsTbl[(Units Table: Atomic Conditional Update)]
        BookingsTbl[(Bookings Table: UNIQUE unit_id constraint)]
        LeadsTbl[(Leads & LeadNotes Tables)]
        UsersTbl[(Users Table: Salted Hashes & Roles)]
    end

    UI --> AuthCtx
    UI --> APIClient
    APIClient -->|Bearer JWT| Router
    Router --> Dep
    Router --> BService
    Router --> LService
    BService -->|Atomic UPDATE + Rowcount Check| UnitsTbl
    BService --> BookingsTbl
    LService --> LeadsTbl
```

---

## 6. Database Schema & Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ LEADS : "assigned_to"
    USERS ||--o{ BOOKINGS : "booked_by"
    USERS ||--o{ LEAD_NOTES : "authored_by"
    PROJECTS ||--o{ BUILDINGS : "contains"
    BUILDINGS ||--o{ UNITS : "contains"
    LEADS ||--o{ LEAD_NOTES : "has_timeline"
    LEADS ||--o| BOOKINGS : "results_in"
    UNITS ||--o| BOOKINGS : "allocated_to"

    USERS {
        int id PK
        string email UK
        string hashed_password
        string full_name
        string role "ADMIN | SALES_EMPLOYEE"
        string phone
        boolean is_active
        datetime created_at
    }

    PROJECTS {
        int id PK
        string name
        string location
        string status
        int completion_year
    }

    BUILDINGS {
        int id PK
        int project_id FK
        string name
        int total_floors
    }

    UNITS {
        int id PK
        int building_id FK
        string unit_number
        string unit_type "1BHK|2BHK|3BHK|4BHK|Penthouse|Villa"
        int floor
        float super_builtup_sqft
        float price "INR Denominated"
        string availability "Available | Reserved | Booked"
    }

    LEADS {
        int id PK
        string name
        string email
        string phone
        string stage "New|Contacted|Site Visit|Interested|Negotiation|Booked|Lost"
        string priority "Low|Medium|High|Urgent"
        float budget_min
        float budget_max
        int interested_project_id FK
        int assigned_user_id FK
        date next_followup_date
    }

    LEAD_NOTES {
        int id PK
        int lead_id FK
        int author_id FK
        string note_type "Call|Meeting|WhatsApp|Site Visit|Stage Change|Booking|General"
        text content
        datetime created_at
    }

    BOOKINGS {
        int id PK
        int lead_id FK
        int unit_id FK, UK
        int booked_by_user_id FK
        float agreement_value
        float booking_amount
        string status "Confirmed"
        string payment_reference
        datetime booking_date
    }
```

---

## 7. Concurrency Guard Deep-Dive (Solving the Double-Booking Problem)

In luxury real estate sales, multiple agents frequently negotiate with different high-net-worth buyers simultaneously. If two agents click "Confirm Booking" on the same prime villa at the exact same millisecond:

```
Agent 1 (Meera):  POST /api/bookings (Unit #1 - Coromandel Ocean Villa)
Agent 2 (Anand):  POST /api/bookings (Unit #1 - Coromandel Ocean Villa)
```

### The Solution:
Rather than relying on in-memory locks or naive client checks, EstatePulse executes an **atomic conditional UPDATE** inside a transaction:

```python
# backend/app/services/booking_service.py
result = db.execute(
    update(Unit)
    .where(Unit.id == unit_id, Unit.availability == UnitAvailability.AVAILABLE.value)
    .values(availability=UnitAvailability.BOOKED.value)
)

if result.rowcount == 0:
    db.rollback()
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Unit {unit.unit_number} was just booked by another agent. Please select another available unit."
    )
```

1. The first request updates the unit row from `Available` to `Booked` and proceeds.
2. The second simultaneous request matches `rowcount == 0`, rolls back, and returns **HTTP 409 Conflict**.
3. A unique database index on `bookings.unit_id` serves as a secondary guarantee.

---

## 8. Installation & Quick Start

### Prerequisites
- **Node.js** v18+ (tested on Node v20/v22)
- **Python** 3.10+ (tested on Python 3.12)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Yogesh-kk49/Real_estate_CRM.git
cd Real_estate_CRM
```

---

### Step 2: Backend Setup & Seeding

1. Open a terminal and navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Initialize the database and seed demo data:
   ```powershell
   python seed.py
   ```
   *(Seeds 3 demo users, 4 Chennai luxury projects, 24 units, 13 leads with interaction timelines, and 4 confirmed bookings).*

4. Start the FastAPI backend server:
   ```powershell
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API endpoint: `http://127.0.0.1:8000`
   - Interactive Swagger API documentation: `http://127.0.0.1:8000/api/docs`

---

### Step 3: Frontend Setup & Launch

1. In a **second terminal**, navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
4. Open your browser:
   ```
   http://localhost:5173
   ```

---

### Windows One-Click Quick Launch
If you are on Windows, simply double-click the root batch file:
```cmd
run_dev.bat
```
*(Automatically verifies dependencies, seeds the database if needed, and launches both backend and frontend servers in separate windows).*

---

## 9. Running Automated Test Suite

Run the full automated test suite directly from the `backend` directory:

```powershell
cd backend

# 1. Test concurrency race conditions (confirms 201 Created & 409 Conflict)
python tests/test_concurrency.py

# 2. Test authentication & RBAC isolation (confirms 403 Forbidden & scoped queries)
python tests/test_auth_rbac.py

# 3. Test input validations (phone formatting, past follow-up dates, name constraints)
python tests/test_validation.py
```

---

## 10. API Endpoints Reference

| Category | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate with email/password and obtain JWT token |
| **Auth** | `GET` | `/api/auth/me` | Authenticated | Retrieve profile of the currently signed-in user |
| **Users** | `GET` | `/api/users/employees` | Authenticated | List active sales consultants for assignment dropdowns |
| **Users** | `GET` | `/api/users` | Admin Only | List all team accounts and assigned lead counts |
| **Users** | `POST` | `/api/users` | Admin Only | Recruit a new sales consultant (`SALES_EMPLOYEE` only) |
| **Users** | `PATCH`| `/api/users/{id}` | Admin Only | Update staff profile or activate/deactivate account |
| **Leads** | `GET` | `/api/leads` | RBAC Scoped | List leads (filtered automatically for sales consultants) |
| **Leads** | `POST` | `/api/leads` | Sales / Admin | Create a new lead with follow-up validation |
| **Leads** | `GET` | `/api/leads/{id}` | RBAC Scoped | Retrieve full 360° lead detail and interaction timeline |
| **Leads** | `PATCH`| `/api/leads/{id}` | RBAC Scoped | Update lead contact details, stage, or notes |
| **Leads** | `POST` | `/api/leads/{id}/notes`| RBAC Scoped | Log a new client touchpoint (Call, Meeting, WhatsApp) |
| **Leads** | `POST` | `/api/leads/{id}/assign`| Admin Only | Reassign a lead to another sales consultant |
| **Properties** | `GET` | `/api/properties/projects` | Authenticated | List luxury developments with unit availability stats |
| **Properties** | `GET` | `/api/properties/units` | Authenticated | Filter inventory units by project, floor, and status |
| **Bookings** | `POST` | `/api/bookings` | Sales / Admin | Atomic concurrency-guarded property booking |
| **Bookings** | `GET` | `/api/bookings` | RBAC Scoped | List confirmed booking ledger agreements |
| **Dashboard** | `GET` | `/api/dashboard/stats` | RBAC Scoped | Real-time KPIs, pipeline funnel, follow-up alerts |

---

## 11. Key Engineering & Product Decisions

1. **Database-Level Atomic Conditional Updates Over In-Memory Locks**:
   - In-memory locks fail when scaling across multiple worker processes or containers. By performing conditional `UPDATE` statements inside database transactions and checking affected row counts, we guarantee zero double-booking with zero distributed locking overhead.

2. **Decoupled Modern Architecture**:
   - Backend (FastAPI) and Frontend (React/Vite) have separate concerns and clean contracts. FastAPI generates compliant OpenAPI documentation at `/api/docs`, while Vite powers a responsive, type-safe React client.

3. **Strict Staff-Only Recruitment**:
   - Administrators can onboard and recruit sales consultants (`SALES_EMPLOYEE`), but the recruitment interface and API schema strictly prohibit creating additional administrators, safeguarding organizational privilege hierarchy.

4. **Reviewer-First UX & Persona Switcher**:
   - Evaluating RBAC normally requires logging in and out repeatedly. EstatePulse provides a 1-click persona switcher in the Topbar, enabling reviewers to toggle roles in seconds to witness lead isolation in real time.

5. **Contextual Error Handling**:
   - Both Pydantic schema validation errors and backend exceptions are normalized into actionable, user-friendly sentences instead of raw stack traces or ambiguous errors.

---

## 12. License

Developed for evaluation and demonstration purposes. All rights reserved © 2026 EstatePulse.
