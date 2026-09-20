import os
import sys
import unittest
from fastapi.testclient import TestClient

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Add backend root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.lead import Lead, LeadStage
from app.models.user import User, UserRole


class AuthRBACTestCase(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()
        self.admin = self.db.query(User).filter(User.email == "admin@coromandel.in").first()
        self.sales = self.db.query(User).filter(User.email == "meera@coromandel.in").first()
        self.admin_token = create_access_token(subject=self.admin.id, role=self.admin.role)
        self.sales_token = create_access_token(subject=self.sales.id, role=self.sales.role)

    def tearDown(self):
        self.db.close()

    def test_login_success(self):
        res = self.client.post("/api/auth/login", json={
            "email": "admin@coromandel.in",
            "password": "Admin@1234"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "ADMIN")

    def test_login_invalid_password(self):
        res = self.client.post("/api/auth/login", json={
            "email": "admin@coromandel.in",
            "password": "WrongPassword999"
        })
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.json()["detail"], "Incorrect email or password.")

    def test_admin_can_create_project(self):
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        res = self.client.post("/api/properties/projects", json={
            "name": "Emerald Coast Enclave",
            "location": "ECR, Chennai",
            "description": "Test project created by admin",
            "status": "Pre-Launch",
        }, headers=headers)
        self.assertIn(res.status_code, [201, 400])  # 201 or 400 if already exists

    def test_sales_employee_cannot_create_project(self):
        headers = {"Authorization": f"Bearer {self.sales_token}"}
        res = self.client.post("/api/properties/projects", json={
            "name": "Unauthorized Enclave",
            "location": "OMR, Chennai",
        }, headers=headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("Administrator privileges required", res.json()["detail"])

    def test_sales_employee_lead_scoping(self):
        headers = {"Authorization": f"Bearer {self.sales_token}"}
        res = self.client.get("/api/leads", headers=headers)
        self.assertEqual(res.status_code, 200)
        leads = res.json()
        for lead in leads:
            self.assertEqual(lead["assigned_user_id"], self.sales.id)


if __name__ == "__main__":
    unittest.main()
