from datetime import date, timedelta
import os
import sys
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


class ValidationTestCase(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()
        self.admin = self.db.query(User).filter(User.email == "admin@coromandel.in").first()
        self.admin_token = create_access_token(subject=self.admin.id, role=self.admin.role)
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}

    def tearDown(self):
        self.db.close()

    def test_invalid_phone_number_rejected(self):
        res = self.client.post("/api/leads", json={
            "name": "Suresh Balaji",
            "email": "suresh.b@example.com",
            "phone": "123",  # Too short!
        }, headers=self.headers)
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertIn("detail", data)
        self.assertTrue("phone" in data["detail"].lower() or "10 digits" in data["detail"].lower())

    def test_past_followup_date_rejected(self):
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        res = self.client.post("/api/leads", json={
            "name": "Girish Chandran",
            "email": "girish.c@example.com",
            "phone": "+91 98409 88776",
            "next_followup_date": yesterday,
        }, headers=self.headers)
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertIn("detail", data)
        self.assertIn("Follow-up date cannot be earlier than today", data["detail"])

    def test_short_lead_name_rejected(self):
        res = self.client.post("/api/leads", json={
            "name": " ",
            "email": "test@example.com",
            "phone": "+91 98409 88776",
        }, headers=self.headers)
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertIn("detail", data)
        self.assertIn("valid lead name", data["detail"].lower())


if __name__ == "__main__":
    unittest.main()
