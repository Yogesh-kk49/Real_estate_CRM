# EstatePulse — Real Estate CRM

> **Full-Stack Developer Technical Interview Project**
> A production-style Real Estate CRM built for luxury developer sales teams: lead pipeline management, role-based access control, property inventory management (admin UI included), concurrency-guarded unit bookings with cancellation, and a full audit trail.
>
> 🌐 **Live Frontend**: [https://real-estate-crm-5k5j.onrender.com](https://real-estate-crm-5k5j.onrender.com)
> ⚡ **Live Backend API**: [https://estatepulse-backend-56wz.onrender.com](https://estatepulse-backend-56wz.onrender.com)
> 📖 **Swagger Docs**: [https://estatepulse-backend-56wz.onrender.com/api/docs](https://estatepulse-backend-56wz.onrender.com/api/docs)
> 🔗 **GitHub**: [https://github.com/Yogesh-kk49/Real_estate_CRM](https://github.com/Yogesh-kk49/Real_estate_CRM)

---

## 1. Project Overview

EstatePulse is a specialised real estate sales CRM designed for Chennai luxury developers. It models a `Project → Building → Unit` inventory hierarchy and manages a 7-stage lead lifecycle (`New → Contacted → Site Visit → Interested → Negotiation → Booked / Lost`).

Key design goals:
- **No double-booking** — atomic conditional `UPDATE` + partial unique index
- **No invalid state transitions** — `Booked` stage requires a confirmed booking; stage/priority/unit-type values are enum-validated at the schema layer
- **Admin UI for properties** — admins can create Projects, Buildings, and Units from the Properties page
- **Booking cancellation** — cancel frees the unit (`Available`) and unblocks re-booking via partial unique index (filters on `status = 'Confirmed'`)

---

## 2. Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@coromandel.in` | `Admin@1234` |
| **Sales Consultant** | `meera@coromandel.in` | `Sales@1234` |
| **Sales Consultant** | `anand@coromandel.in` | `Sales@1234` |

The login page has `[Load Admin]` / `[Load Staff]` helper buttons that auto-fill credentials.

---

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2 | Auto-generated OpenAPI docs, strict Pydantic validators, async-ready |
| **Database** | PostgreSQL (Render) / SQLite (local/test) | ACID transactions; partial unique indexes for conditional booking uniqueness |
| **Auth** | PyJWT (HS256), Passlib/Bcrypt | Stateless JWT; SECRET_KEY must be set via env var in production |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS | Type-safe SPA; responsive mobile-first layout |
| **Tests** | pytest + FastAPI TestClient | 17 automated tests covering validation, enums, duplicates, state guards, cancellation |

---

## 4. System Architecture

```
Frontend (React 18 + Vite)
  │  Bearer JWT
  ▼
Backend (FastAPI)
  ├── /api/auth          – login, token
  ├── /api/leads         – CRUD, assign, notes  (GET/POST + PUT/PATCH on leads/{id})
  ├── /api/bookings      – create, list, cancel  (POST /bookings/{id}/cancel)
  ├── /api/properties    – projects, buildings, units  (admin POST for creation)
  ├── /api/users         – recruit, deactivate
  └── /api/dashboard     – KPI stats
  │
  ▼
Database (PostgreSQL / SQLite)
  ├── users, leads, lead_notes
  ├── projects, buildings, units
  └── bookings  ← partial unique indexes on (unit_id) and (lead_id) WHERE status='Confirmed'
```

---

## 5. Database Schema

```
USERS           PROJECTS
  id              id
  email (UK)      name, location, status
  hashed_password
  role            BUILDINGS
  is_active         id, project_id FK, name, total_floors

LEADS           UNITS
  id              id, building_id FK
  name            unit_type (1BHK|2BHK|3BHK|4BHK|Penthouse|Villa) ← enum-validated
  email           floor, super_builtup_sqft, price
  phone           availability (Available|Reserved|Booked) ← enum-validated
  stage (enum)
  priority (enum) BOOKINGS
  budget_min        id
  budget_max        lead_id FK
  assigned_user_id  unit_id FK  ← uq_active_booking_unit (WHERE status='Confirmed')
  next_followup_date lead_id UK  ← uq_active_booking_lead  (WHERE status='Confirmed')
                    status (Confirmed|Cancelled)
LEAD_NOTES        booking_amount, booking_date
  id, lead_id FK
  note_type, content, created_at
```

---

## 6. Concurrency Guard (Zero Double-Booking)

Two consultants clicking "Book" simultaneously on the same unit:

```python
# booking_service.py
result = db.execute(
    update(Unit)
    .where(Unit.id == unit_id, Unit.availability == "Available")
    .values(availability="Booked")
)
if result.rowcount == 0:
    raise HTTPException(409, "Unit was just booked by another agent.")
```

- First request: rowcount = 1 → succeeds.
- Second simultaneous request: rowcount = 0 → HTTP 409 Conflict.
- Partial unique index `uq_active_booking_unit WHERE status='Confirmed'` is the second-layer guard, and also allows re-booking after cancellation.

---

## 7. Validation Rules

All enforced at the Pydantic schema layer (returns HTTP 400/422):

| Field | Rule |
|---|---|
| `stage` | Must be `New / Contacted / Site Visit / Interested / Negotiation / Booked / Lost` |
| `priority` | Must be `Low / Medium / High / Urgent` |
| `unit_type` | Must be `1BHK / 2BHK / 3BHK / 4BHK / Penthouse / Villa` |
| `budget_min` | Must be ≤ `budget_max` |
| `phone` | Must be a valid 10-digit mobile number |
| `next_followup_date` | Cannot be in the past |
| Duplicate lead | Same email or phone → HTTP 400 |
| Stage = `Booked` | Only allowed if a `Confirmed` booking exists for that lead |

---

## 8. API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login; returns JWT |
| `GET` | `/api/auth/me` | JWT | Current user profile |
| `GET` | `/api/leads` | JWT | List leads (RBAC scoped) |
| `POST` | `/api/leads` | JWT | Create lead |
| `GET` | `/api/leads/{id}` | JWT | Full lead detail + timeline |
| `PUT` / `PATCH` | `/api/leads/{id}` | JWT | Update lead |
| `POST` | `/api/leads/{id}/notes` | JWT | Add interaction note |
| `POST` / `PATCH` | `/api/leads/{id}/assign` | Admin | Assign/reassign lead |
| `GET` | `/api/properties/projects` | JWT | List projects |
| `POST` | `/api/properties/projects` | Admin | Create project |
| `GET` | `/api/properties/buildings` | JWT | List buildings (filter by project_id) |
| `POST` | `/api/properties/buildings` | Admin | Create building |
| `GET` | `/api/properties/units` | JWT | List units |
| `POST` | `/api/properties/units` | Admin | Create unit |
| `POST` | `/api/bookings` | JWT | Create booking (atomic) |
| `GET` | `/api/bookings` | JWT | List bookings |
| `POST` | `/api/bookings/{id}/cancel` | JWT | Cancel booking; frees unit |
| `GET` | `/api/users` | Admin | List all staff |
| `POST` | `/api/users` | Admin | Recruit sales consultant |
| `PATCH` | `/api/users/{id}` | Admin | Activate/deactivate account |
| `GET` | `/api/dashboard/stats` | JWT | KPI metrics |

---

## 9. Key Engineering Decisions

1. **Partial unique indexes over `UNIQUE` column** — `uq_active_booking_unit` and `uq_active_booking_lead` are `WHERE status='Confirmed'` so cancelled bookings don't block re-booking.

2. **Enum validation at schema layer** — Pydantic `@field_validator` on `stage`, `priority`, `unit_type`, and `availability` rejects unknown values before they reach the ORM.

3. **`Booked` stage guard** — `lead_service.update_lead` refuses to set `stage=Booked` unless a `Booking(status='Confirmed')` row already exists for that lead; prevents orphaned stage transitions.

4. **SECRET_KEY removed from repo** — `config.py` reads `SECRET_KEY` from environment variable; falls back to `secrets.token_urlsafe(32)` in dev. Set the env var in your Render service settings.

5. **Both PUT and PATCH accepted on `/leads/{id}`** — the route registers both verbs so clients using either convention work correctly.

---

## 10. Running Locally

```bash
# 1. Clone
git clone https://github.com/Yogesh-kk49/Real_estate_CRM.git
cd Real_estate_CRM

# 2. Backend
cd backend
pip install -r requirements.txt
python seed.py                             # seeds demo users, projects, leads, bookings
python -m uvicorn app.main:app --reload    # http://localhost:8000/api/docs

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                                # http://localhost:5173

# 4. Tests
cd ..  # back to root
python -m pytest backend/tests/test_validation.py -v    # 17 tests
python backend/tests/test_concurrency.py
```

> Windows users: `run_dev.bat` launches both servers in separate windows.

---

## 11. Deployment (Render)

The repo includes `render.yaml`. Push to GitHub → Render Dashboard → **New → Blueprint** → select `Real_estate_CRM` → **Apply**.

Set these environment variables on the backend service:
- `DATABASE_URL` — Render PostgreSQL internal URL
- `SECRET_KEY` — a strong random string (e.g., `openssl rand -hex 32`)
- `ENVIRONMENT` — `production`
- `CORS_ORIGINS` — your frontend URL (e.g., `https://real-estate-crm-5k5j.onrender.com`)

---

## 12. License

Developed for evaluation and demonstration purposes. © 2026 EstatePulse.
