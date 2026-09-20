import asyncio
import os
import sys
import unittest
import httpx

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Add backend root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.lead import Lead, LeadStage
from app.models.property import Unit, UnitAvailability
from app.models.user import User


class ConcurrencyTestCase(unittest.IsolatedAsyncioTestCase):
    async def test_simultaneous_double_booking_race_condition(self):
        """
        CRITICAL INTERVIEW REQUIREMENT TEST:
        Simulates two simultaneous booking requests for the EXACT same unit.
        Verifies that the backend / database concurrency locking:
          1. Guarantees ONLY ONE request succeeds (201 Created)
          2. The other request fails with HTTP 409 Conflict
          3. Returns the exact contextual error message:
             'Unit {unit_number} was just booked by another user. Please select another available unit.'
        """
        db = SessionLocal()
        try:
            # Find users
            user_a = db.query(User).filter(User.email == "admin@coromandel.in").first()
            user_b = db.query(User).filter(User.email == "meera@coromandel.in").first()
            self.assertIsNotNone(user_a)
            self.assertIsNotNone(user_b)

            # Find an available unit
            target_unit = db.query(Unit).filter(Unit.availability == UnitAvailability.AVAILABLE.value).first()
            self.assertIsNotNone(target_unit, "Must have an available unit for testing")
            unit_id = target_unit.id
            unit_number = target_unit.unit_number

            # Create two distinct fresh leads for the two users
            lead_a = Lead(
                name="Concurrent Buyer Alpha",
                email="alpha@example.com",
                phone="+91 99999 11111",
                stage=LeadStage.NEGOTIATION.value,
                assigned_user_id=user_a.id,
            )
            lead_b = Lead(
                name="Concurrent Buyer Beta",
                email="beta@example.com",
                phone="+91 99999 22222",
                stage=LeadStage.NEGOTIATION.value,
                assigned_user_id=user_b.id,
            )
            db.add_all([lead_a, lead_b])
            db.commit()
            db.refresh(lead_a)
            db.refresh(lead_b)

            token_a = create_access_token(subject=user_a.id, role=user_a.role)
            token_b = create_access_token(subject=user_b.id, role=user_b.role)

            payload_a = {
                "lead_id": lead_a.id,
                "unit_id": unit_id,
                "agreement_value": target_unit.price,
                "booking_amount": 1000000.0,
                "payment_reference": "CONCURRENT-TEST-A",
                "notes": "Fastest finger buyer A",
            }
            payload_b = {
                "lead_id": lead_b.id,
                "unit_id": unit_id,
                "agreement_value": target_unit.price,
                "booking_amount": 1000000.0,
                "payment_reference": "CONCURRENT-TEST-B",
                "notes": "Fastest finger buyer B",
            }

            # Fire both requests simultaneously
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                headers_a = {"Authorization": f"Bearer {token_a}"}
                headers_b = {"Authorization": f"Bearer {token_b}"}

                req_a = client.post("/api/bookings", json=payload_a, headers=headers_a)
                req_b = client.post("/api/bookings", json=payload_b, headers=headers_b)

                responses = await asyncio.gather(req_a, req_b)

            status_codes = [r.status_code for r in responses]
            print(f"\n[Test Result] Concurrent booking HTTP status codes: {status_codes}")

            self.assertIn(201, status_codes, "Exactly one booking request must succeed with 201 Created")
            self.assertIn(409, status_codes, "The competing request must receive 409 Conflict")
            self.assertEqual(status_codes.count(201), 1, "Only 1 request must succeed")
            self.assertEqual(status_codes.count(409), 1, "Only 1 request must fail with 409")

            conflict_res = next(r for r in responses if r.status_code == 409)
            conflict_json = conflict_res.json()
            self.assertIn(unit_number, conflict_json["detail"])
            self.assertIn("was just booked by another user", conflict_json["detail"])

            print(f"[Test Result] Conflict message verified: '{conflict_json['detail']}'")

        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
