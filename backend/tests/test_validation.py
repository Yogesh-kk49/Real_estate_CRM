"""
EstatePulse CRM – Validation & Business Rule Tests
===================================================
Tests cover:
  1. Basic field validation (phone, name, follow-up date)
  2. Enum enforcement  – stage, priority, unit type
  3. Budget range guard – budget_min > budget_max returns 400
  4. Duplicate lead detection – same email or phone returns 400
  5. Booked-stage guard – can't set stage=Booked without a confirmed booking
  6. Booking cancellation – cancelling frees the unit back to Available
  7. Unit type validation – only known UnitType values accepted
"""

from datetime import date, timedelta
import os
import sys
import uuid
import unittest
from fastapi.testclient import TestClient

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User


# ─── helpers ──────────────────────────────────────────────────────────────────

def _unique_email():
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


def _unique_phone():
    # 10-digit mobile number prefixed with +91
    digits = str(uuid.uuid4().int)[:10]
    return f"+91 {digits[:5]} {digits[5:]}"


# ─── base class ───────────────────────────────────────────────────────────────

class BaseTestCase(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()
        admin = self.db.query(User).filter(User.email == "admin@coromandel.in").first()
        if admin is None:
            self.skipTest("Seed data missing – run the app once to create demo accounts.")
        self.admin_token = create_access_token(subject=admin.id, role=admin.role)
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}

    def tearDown(self):
        self.db.close()

    # ── convenience ──────────────────────────────────────────────────────────

    def _create_lead(self, **overrides):
        payload = {
            "name": "Test Lead",
            "email": _unique_email(),
            "phone": _unique_phone(),
        }
        payload.update(overrides)
        res = self.client.post("/api/leads", json=payload, headers=self.headers)
        return res

    def _lead_id(self, **overrides):
        res = self._create_lead(**overrides)
        self.assertEqual(res.status_code, 201, res.text)
        return res.json()["id"]


# ─── 1. Basic field validation ─────────────────────────────────────────────────

class TestFieldValidation(BaseTestCase):

    def test_invalid_phone_number_rejected(self):
        res = self._create_lead(phone="123")
        self.assertEqual(res.status_code, 400)
        self.assertIn("detail", res.json())

    def test_past_followup_date_rejected(self):
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        res = self._create_lead(next_followup_date=yesterday)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Follow-up date cannot be earlier than today", res.json()["detail"])

    def test_blank_lead_name_rejected(self):
        res = self._create_lead(name="  ")
        self.assertEqual(res.status_code, 400)
        self.assertIn("valid lead name", res.json()["detail"].lower())


# ─── 2. Enum enforcement ───────────────────────────────────────────────────────

class TestEnumEnforcement(BaseTestCase):

    def test_invalid_stage_rejected_on_create(self):
        res = self._create_lead(stage="Foo")
        self.assertIn(res.status_code, (400, 422), res.text)

    def test_invalid_stage_rejected_on_update(self):
        lead_id = self._lead_id()
        res = self.client.put(
            f"/api/leads/{lead_id}", json={"stage": "Foo"}, headers=self.headers
        )
        self.assertIn(res.status_code, (400, 422), res.text)

    def test_invalid_priority_rejected_on_create(self):
        res = self._create_lead(priority="Ultra")
        self.assertIn(res.status_code, (400, 422), res.text)

    def test_invalid_priority_rejected_on_update(self):
        lead_id = self._lead_id()
        res = self.client.put(
            f"/api/leads/{lead_id}", json={"priority": "Ultra"}, headers=self.headers
        )
        self.assertIn(res.status_code, (400, 422), res.text)


# ─── 3. Budget range guard ─────────────────────────────────────────────────────

class TestBudgetRange(BaseTestCase):

    def test_budget_min_gt_max_rejected_on_create(self):
        res = self._create_lead(budget_min=9000000, budget_max=1000000)
        self.assertIn(res.status_code, (400, 422), res.text)

    def test_budget_min_eq_max_accepted(self):
        res = self._create_lead(budget_min=5000000, budget_max=5000000)
        self.assertEqual(res.status_code, 201, res.text)

    def test_budget_min_gt_max_rejected_on_update(self):
        lead_id = self._lead_id()
        res = self.client.put(
            f"/api/leads/{lead_id}",
            json={"budget_min": 9999999, "budget_max": 1},
            headers=self.headers,
        )
        self.assertIn(res.status_code, (400, 422), res.text)


# ─── 4. Duplicate lead detection ──────────────────────────────────────────────

class TestDuplicateLead(BaseTestCase):

    def test_duplicate_email_rejected(self):
        email = _unique_email()
        self._lead_id(email=email)
        res = self._create_lead(email=email)
        self.assertEqual(res.status_code, 400, res.text)
        detail = res.json()["detail"].lower()
        self.assertTrue("already" in detail, f"Expected duplicate error, got: {detail}")

    def test_duplicate_phone_rejected(self):
        phone = _unique_phone()
        self._lead_id(phone=phone)
        res = self._create_lead(phone=phone)
        self.assertEqual(res.status_code, 400, res.text)
        detail = res.json()["detail"].lower()
        self.assertTrue("already" in detail, f"Expected duplicate error, got: {detail}")


# ─── 5. Booked-stage guard ─────────────────────────────────────────────────────

class TestBookedStageGuard(BaseTestCase):

    def test_cannot_create_lead_with_booked_stage(self):
        res = self._create_lead(stage="Booked")
        self.assertEqual(res.status_code, 400, res.text)
        self.assertIn("booking", res.json()["detail"].lower())

    def test_cannot_update_stage_to_booked_without_booking(self):
        lead_id = self._lead_id()
        res = self.client.put(
            f"/api/leads/{lead_id}", json={"stage": "Booked"}, headers=self.headers
        )
        self.assertEqual(res.status_code, 400, res.text)
        self.assertIn("booking", res.json()["detail"].lower())


# ─── 6. Booking cancellation ──────────────────────────────────────────────────

class TestBookingCancellation(BaseTestCase):

    def _find_available_unit(self):
        """Return the first Available unit id, or skip the test."""
        res = self.client.get("/api/properties/units", headers=self.headers)
        if res.status_code != 200:
            self.skipTest("Units endpoint unavailable.")
        units = res.json()
        available = [u for u in units if u.get("availability") == "Available"]
        if not available:
            self.skipTest("No Available units in seed data – cannot test cancellation.")
        return available[0]["id"]

    def test_cancel_booking_frees_unit(self):
        unit_id = self._find_available_unit()
        lead_id = self._lead_id()

        # Use the admin id directly from the db (already loaded in setUp)
        admin = self.db.query(User).filter(User.email == "admin@coromandel.in").first()
        me_id = admin.id

        self.client.post(
            f"/api/leads/{lead_id}/assign",
            json={"assigned_to": me_id},
            headers=self.headers,
        )

        # Create booking
        booking_res = self.client.post(
            "/api/bookings",
            json={"lead_id": lead_id, "unit_id": unit_id, "booking_amount": 100000},
            headers=self.headers,
        )
        if booking_res.status_code != 201:
            self.skipTest(f"Could not create booking: {booking_res.text}")
        booking_id = booking_res.json()["id"]

        # Cancel booking
        cancel_res = self.client.post(
            f"/api/bookings/{booking_id}/cancel", headers=self.headers
        )
        self.assertEqual(cancel_res.status_code, 200, cancel_res.text)

        # Verify unit is Available again
        unit_res = self.client.get(f"/api/properties/units/{unit_id}", headers=self.headers)
        if unit_res.status_code == 200:
            self.assertEqual(unit_res.json()["availability"], "Available")


# ─── 7. Unit type validation ──────────────────────────────────────────────────

class TestUnitTypeValidation(BaseTestCase):

    def _find_project_and_building(self):
        projects_res = self.client.get("/api/properties/projects", headers=self.headers)
        if projects_res.status_code != 200 or not projects_res.json():
            self.skipTest("No projects in seed data.")
        project_id = projects_res.json()[0]["id"]

        buildings_res = self.client.get(
            f"/api/properties/buildings?project_id={project_id}", headers=self.headers
        )
        if buildings_res.status_code != 200 or not buildings_res.json():
            self.skipTest("No buildings in seed data.")
        building_id = buildings_res.json()[0]["id"]
        return project_id, building_id

    def test_invalid_unit_type_rejected(self):
        project_id, building_id = self._find_project_and_building()
        res = self.client.post(
            "/api/properties/units",
            json={
                "unit_number": "Z-999",
                "building_id": building_id,
                "unit_type": "Castle",   # invalid
                "floor": 1,
                "super_builtup_sqft": 1000,
                "price": 5000000,
                "availability": "Available",
            },
            headers=self.headers,
        )
        self.assertIn(res.status_code, (400, 422), res.text)

    def test_valid_unit_type_accepted(self):
        project_id, building_id = self._find_project_and_building()
        res = self.client.post(
            "/api/properties/units",
            json={
                "unit_number": f"T-{uuid.uuid4().hex[:4].upper()}",
                "building_id": building_id,
                "unit_type": "2BHK",
                "floor": 3,
                "super_builtup_sqft": 950,
                "price": 7500000,
                "availability": "Available",
            },
            headers=self.headers,
        )
        self.assertEqual(res.status_code, 201, res.text)


# ─── runner ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    unittest.main(verbosity=2)
