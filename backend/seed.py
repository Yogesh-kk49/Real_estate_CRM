import os
import sys
from datetime import date, datetime, timedelta

# Add parent directory to sys.path so app modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from app.core.database import Base, SessionLocal, engine
from app.core.security import get_password_hash
from app.models.booking import Booking, BookingStatus
from app.models.lead import Lead, LeadNote, LeadPriority, LeadStage
from app.models.property import Building, Project, Unit, UnitAvailability, UnitType
from app.models.user import User, UserRole


def seed_database(drop_tables: bool = True):
    print("🌱 Initializing database schema...")
    if drop_tables:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("👤 Creating user accounts...")
        # 1. Users
        admin_user = User(
            email="admin@coromandel.in",
            hashed_password=get_password_hash("Admin@1234"),
            full_name="Karthik Ramaswamy",
            role=UserRole.ADMIN.value,
            phone="+91 98401 23456",
            is_active=True,
        )
        sales_1 = User(
            email="meera@coromandel.in",
            hashed_password=get_password_hash("Sales@1234"),
            full_name="Meera Krishnan",
            role=UserRole.SALES_EMPLOYEE.value,
            phone="+91 98402 34567",
            is_active=True,
        )
        sales_2 = User(
            email="anand@coromandel.in",
            hashed_password=get_password_hash("Sales@1234"),
            full_name="Anand Swaminathan",
            role=UserRole.SALES_EMPLOYEE.value,
            phone="+91 98403 45678",
            is_active=True,
        )
        db.add_all([admin_user, sales_1, sales_2])
        db.flush()

        print("🏢 Seeding Chennai luxury projects and buildings...")
        # 2. Projects & Buildings
        # Project 1: Coromandel Bay Villas (ECR)
        proj_ecr = Project(
            name="Coromandel Bay Villas",
            location="East Coast Road, Muttukadu, Chennai",
            description="Ultra-luxury gated beachfront villas with private beach pavilions, personal lap pools, and panoramic sea views.",
            status="Under Construction",
            completion_year=2026,
            hero_image="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
        )
        db.add(proj_ecr)
        db.flush()

        bldg_azure = Building(project_id=proj_ecr.id, name="Azure Oceanfront Enclave", total_floors=3)
        bldg_palms = Building(project_id=proj_ecr.id, name="Pelican Palms Wing", total_floors=2)
        db.add_all([bldg_azure, bldg_palms])
        db.flush()

        # Project 2: The Grand Azure (Boat Club Road)
        proj_boatclub = Project(
            name="The Grand Azure",
            location="Boat Club Road, RA Puram, Chennai",
            description="Chennai's most prestigious ultra-luxury residential address. Limited edition 3BHK and 4BHK sky suites with private elevators.",
            status="Ready to Move",
            completion_year=2024,
            hero_image="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
        )
        db.add(proj_boatclub)
        db.flush()

        bldg_regal = Building(project_id=proj_boatclub.id, name="Tower A - Regal Tower", total_floors=18)
        bldg_club = Building(project_id=proj_boatclub.id, name="Tower B - Club Residences", total_floors=16)
        db.add_all([bldg_regal, bldg_club])
        db.flush()

        # Project 3: Marina Skyline Residences (Santhome / MRC Nagar)
        proj_marina = Project(
            name="Marina Skyline Residences",
            location="Santhome High Road, MRC Nagar, Chennai",
            description="Twin architectural towers framing the Bay of Bengal with 180-degree unobstructed coastal views.",
            status="Under Construction",
            completion_year=2025,
            hero_image="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        )
        db.add(proj_marina)
        db.flush()

        bldg_east_bay = Building(project_id=proj_marina.id, name="East Bay Pavilion", total_floors=22)
        bldg_west_bay = Building(project_id=proj_marina.id, name="West Bay Pavilion", total_floors=22)
        db.add_all([bldg_east_bay, bldg_west_bay])
        db.flush()

        # Project 4: Olympia Meridian Enclave (OMR Tech Corridor)
        proj_omr = Project(
            name="Olympia Meridian Enclave",
            location="OMR IT Expressway, Sholinganallur, Chennai",
            description="Contemporary smart residences tailored for executive families and tech leaders, featuring rooftop infinity pools.",
            status="Under Construction",
            completion_year=2026,
            hero_image="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        )
        db.add(proj_omr)
        db.flush()

        bldg_tech_a = Building(project_id=proj_omr.id, name="Tech Crest Tower A", total_floors=15)
        db.add(bldg_tech_a)
        db.flush()

        print("🏠 Seeding units with realistic Chennai pricing...")
        # 3. Units
        units_data = [
            # Coromandel Bay Villas - Azure Oceanfront Enclave
            {"b": bldg_azure, "num": "V-01", "type": UnitType.VILLA.value, "floor": 1, "s_sqft": 4850, "c_sqft": 3950, "facing": "East (Sea)", "price": 68000000.0, "status": UnitAvailability.BOOKED.value},
            {"b": bldg_azure, "num": "V-02", "type": UnitType.VILLA.value, "floor": 1, "s_sqft": 4850, "c_sqft": 3950, "facing": "East (Sea)", "price": 68000000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_azure, "num": "V-03", "type": UnitType.VILLA.value, "floor": 1, "s_sqft": 5400, "c_sqft": 4400, "facing": "East (Sea)", "price": 75000000.0, "status": UnitAvailability.RESERVED.value},
            {"b": bldg_palms, "num": "V-07", "type": UnitType.VILLA.value, "floor": 1, "s_sqft": 3900, "c_sqft": 3100, "facing": "North", "price": 42500000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_palms, "num": "V-08", "type": UnitType.VILLA.value, "floor": 1, "s_sqft": 3900, "c_sqft": 3100, "facing": "North", "price": 42500000.0, "status": UnitAvailability.AVAILABLE.value},

            # The Grand Azure - Tower A Regal
            {"b": bldg_regal, "num": "A-0401", "type": UnitType.THREE_BHK.value, "floor": 4, "s_sqft": 2650, "c_sqft": 2100, "facing": "North-East", "price": 34000000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_regal, "num": "A-0802", "type": UnitType.THREE_BHK.value, "floor": 8, "s_sqft": 2850, "c_sqft": 2250, "facing": "East", "price": 37500000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_regal, "num": "A-1201", "type": UnitType.FOUR_BHK.value, "floor": 12, "s_sqft": 3600, "c_sqft": 2900, "facing": "East", "price": 49000000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_regal, "num": "A-1402", "type": UnitType.FOUR_BHK.value, "floor": 14, "s_sqft": 3600, "c_sqft": 2900, "facing": "East", "price": 51000000.0, "status": UnitAvailability.BOOKED.value},
            {"b": bldg_regal, "num": "A-1701", "type": UnitType.PENTHOUSE.value, "floor": 17, "s_sqft": 5800, "c_sqft": 4700, "facing": "North-East", "price": 85000000.0, "status": UnitAvailability.AVAILABLE.value},

            # The Grand Azure - Tower B Club
            {"b": bldg_club, "num": "B-0301", "type": UnitType.THREE_BHK.value, "floor": 3, "s_sqft": 2500, "c_sqft": 1980, "facing": "North", "price": 32000000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_club, "num": "B-0702", "type": UnitType.THREE_BHK.value, "floor": 7, "s_sqft": 2500, "c_sqft": 1980, "facing": "East", "price": 33500000.0, "status": UnitAvailability.RESERVED.value},
            {"b": bldg_club, "num": "B-1101", "type": UnitType.FOUR_BHK.value, "floor": 11, "s_sqft": 3400, "c_sqft": 2750, "facing": "East", "price": 46000000.0, "status": UnitAvailability.AVAILABLE.value},

            # Marina Skyline - East Bay
            {"b": bldg_east_bay, "num": "E-0402", "type": UnitType.TWO_BHK.value, "floor": 4, "s_sqft": 1450, "c_sqft": 1150, "facing": "East (Sea)", "price": 17500000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_east_bay, "num": "E-0801", "type": UnitType.THREE_BHK.value, "floor": 8, "s_sqft": 2150, "c_sqft": 1720, "facing": "East (Sea)", "price": 26500000.0, "status": UnitAvailability.BOOKED.value},
            {"b": bldg_east_bay, "num": "E-1502", "type": UnitType.THREE_BHK.value, "floor": 15, "s_sqft": 2300, "c_sqft": 1850, "facing": "East (Sea)", "price": 29500000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_east_bay, "num": "E-2001", "type": UnitType.PENTHOUSE.value, "floor": 20, "s_sqft": 4200, "c_sqft": 3450, "facing": "East (Sea)", "price": 58000000.0, "status": UnitAvailability.AVAILABLE.value},

            # Marina Skyline - West Bay
            {"b": bldg_west_bay, "num": "W-0501", "type": UnitType.TWO_BHK.value, "floor": 5, "s_sqft": 1450, "c_sqft": 1150, "facing": "North", "price": 16800000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_west_bay, "num": "W-1002", "type": UnitType.THREE_BHK.value, "floor": 10, "s_sqft": 2100, "c_sqft": 1680, "facing": "East", "price": 25500000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_west_bay, "num": "W-1801", "type": UnitType.FOUR_BHK.value, "floor": 18, "s_sqft": 3200, "c_sqft": 2600, "facing": "North-East", "price": 41000000.0, "status": UnitAvailability.AVAILABLE.value},

            # Olympia Meridian - Tech Crest A
            {"b": bldg_tech_a, "num": "T-0204", "type": UnitType.TWO_BHK.value, "floor": 2, "s_sqft": 1180, "c_sqft": 920, "facing": "North", "price": 9200000.0, "status": UnitAvailability.BOOKED.value},
            {"b": bldg_tech_a, "num": "T-0602", "type": UnitType.TWO_BHK.value, "floor": 6, "s_sqft": 1250, "c_sqft": 980, "facing": "East", "price": 9800000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_tech_a, "num": "T-0901", "type": UnitType.THREE_BHK.value, "floor": 9, "s_sqft": 1680, "c_sqft": 1340, "facing": "East", "price": 13800000.0, "status": UnitAvailability.AVAILABLE.value},
            {"b": bldg_tech_a, "num": "T-1203", "type": UnitType.THREE_BHK.value, "floor": 12, "s_sqft": 1750, "c_sqft": 1400, "facing": "North-East", "price": 14500000.0, "status": UnitAvailability.AVAILABLE.value},
        ]

        created_units = {}
        for ud in units_data:
            u = Unit(
                building_id=ud["b"].id,
                unit_number=ud["num"],
                unit_type=ud["type"],
                floor=ud["floor"],
                super_builtup_sqft=ud["s_sqft"],
                carpet_sqft=ud["c_sqft"],
                facing=ud["facing"],
                price=ud["price"],
                availability=ud["status"],
            )
            db.add(u)
            db.flush()
            created_units[ud["num"]] = u

        print("📋 Seeding leads with realistic timelines and follow-ups...")
        # 4. Leads & Notes
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        in_three_days = today + timedelta(days=3)

        # Lead 1: Dr. Rajeshwar Murthy
        lead_1 = Lead(
            name="Dr. Rajeshwar Murthy",
            email="dr.murthy@apollohospitals.org",
            phone="+91 98410 11223",
            stage=LeadStage.BOOKED.value,
            priority=LeadPriority.HIGH.value,
            source="Referral",
            budget_min=65000000.0,
            budget_max=75000000.0,
            interested_project_id=proj_ecr.id,
            assigned_user_id=sales_1.id,
            next_followup_date=None,
        )
        db.add(lead_1)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_1.id, author_id=sales_1.id, note_type="Call", content="Dr. Murthy inquired about private beachfront access and backup power infrastructure."),
            LeadNote(lead_id=lead_1.id, author_id=sales_1.id, note_type="Site Visit", content="Visited Coromandel Bay site with family. Selected Oceanfront Villa V-01."),
            LeadNote(lead_id=lead_1.id, author_id=sales_1.id, note_type="Booking", content="Unit V-01 booked. Paid ₹50 Lakhs token advance via RTGS."),
        ])

        # Lead 2: Priyanka Chandrasekar
        lead_2 = Lead(
            name="Priyanka Chandrasekar",
            email="priyanka.c@zoho.com",
            phone="+91 98411 22334",
            stage=LeadStage.NEGOTIATION.value,
            priority=LeadPriority.URGENT.value,
            source="Property Portal",
            budget_min=45000000.0,
            budget_max=52000000.0,
            interested_project_id=proj_boatclub.id,
            assigned_user_id=sales_1.id,
            next_followup_date=today,  # Due Today!
        )
        db.add(lead_2)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_2.id, author_id=sales_1.id, note_type="Call", content="Spoke regarding Tower A 12th floor unit (A-1201). Requested final price breakdown including club charges."),
            LeadNote(lead_id=lead_2.id, author_id=sales_1.id, note_type="WhatsApp", content="Shared customized payment schedule milestone table on WhatsApp."),
            LeadNote(lead_id=lead_2.id, author_id=sales_1.id, note_type="Meeting", content="Meeting scheduled today 5:00 PM at Boat Club Sales Gallery to finalize agreement."),
        ])

        # Lead 3: Arunachalam Sundaram
        lead_3 = Lead(
            name="Arunachalam Sundaram",
            email="asundaram@tcs.com",
            phone="+91 98412 33445",
            stage=LeadStage.SITE_VISIT.value,
            priority=LeadPriority.HIGH.value,
            source="Website",
            budget_min=30000000.0,
            budget_max=35000000.0,
            interested_project_id=proj_boatclub.id,
            assigned_user_id=sales_1.id,
            next_followup_date=today,  # Due Today!
        )
        db.add(lead_3)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_3.id, author_id=sales_1.id, note_type="Call", content="Interested in Tower B unit B-0301. Confirmed site visit for today afternoon."),
            LeadNote(lead_id=lead_3.id, author_id=sales_1.id, note_type="Site Visit", content="Site visit conducted. Showed clubhouse, fitness centre and sample 3BHK layout."),
        ])

        # Lead 4: Divya Venkataraman
        lead_4 = Lead(
            name="Divya Venkataraman",
            email="divya.v@accenture.com",
            phone="+91 98413 44556",
            stage=LeadStage.INTERESTED.value,
            priority=LeadPriority.MEDIUM.value,
            source="Walk-In",
            budget_min=25000000.0,
            budget_max=30000000.0,
            interested_project_id=proj_marina.id,
            assigned_user_id=sales_2.id,
            next_followup_date=tomorrow,
        )
        db.add(lead_4)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_4.id, author_id=sales_2.id, note_type="Meeting", content="Walked into Santhome Experience Lounge. Inquired about East Bay sea facing 3BHK."),
            LeadNote(lead_id=lead_4.id, author_id=sales_2.id, note_type="WhatsApp", content="Sent 3D virtual tour video of Marina Skyline."),
        ])

        # Lead 5: Vikramaditya Rao
        lead_5 = Lead(
            name="Vikramaditya Rao",
            email="v.rao@sanmar-group.com",
            phone="+91 98414 55667",
            stage=LeadStage.BOOKED.value,
            priority=LeadPriority.HIGH.value,
            source="Referral",
            budget_min=50000000.0,
            budget_max=55000000.0,
            interested_project_id=proj_boatclub.id,
            assigned_user_id=sales_2.id,
            next_followup_date=None,
        )
        db.add(lead_5)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_5.id, author_id=sales_2.id, note_type="Call", content="Initial inquiry through Managing Director reference."),
            LeadNote(lead_id=lead_5.id, author_id=sales_2.id, note_type="Meeting", content="Executive discussion held. Finalized Tower A Unit A-1402."),
            LeadNote(lead_id=lead_5.id, author_id=sales_2.id, note_type="Booking", content="Unit A-1402 booked. Booking token of ₹35 Lakhs received."),
        ])

        # Lead 6: Kavitha Senthil
        lead_6 = Lead(
            name="Kavitha Senthil",
            email="kavitha.senthil@cognizant.com",
            phone="+91 98415 66778",
            stage=LeadStage.CONTACTED.value,
            priority=LeadPriority.MEDIUM.value,
            source="Property Portal",
            budget_min=12000000.0,
            budget_max=15000000.0,
            interested_project_id=proj_omr.id,
            assigned_user_id=sales_2.id,
            next_followup_date=in_three_days,
        )
        db.add(lead_6)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_6.id, author_id=sales_2.id, note_type="Call", content="Connected via phone. Looking for 3BHK for immediate family near Sholinganallur junction."),
        ])

        # Lead 7: Naveen Balasubramanian
        lead_7 = Lead(
            name="Naveen Balasubramanian",
            email="naveen.bala@gmail.com",
            phone="+91 98416 77889",
            stage=LeadStage.NEW.value,
            priority=LeadPriority.HIGH.value,
            source="Website",
            budget_min=18000000.0,
            budget_max=22000000.0,
            interested_project_id=proj_marina.id,
            assigned_user_id=sales_1.id,
            next_followup_date=yesterday,  # Overdue!
        )
        db.add(lead_7)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_7.id, author_id=sales_1.id, note_type="General", content="Submitted website inquiry form for Marina Skyline 2BHK coastal suites."),
        ])

        # Lead 8: Suresh Kumar Narayanan
        lead_8 = Lead(
            name="Suresh Kumar Narayanan",
            email="suresh.narayanan@larsentoubro.com",
            phone="+91 98417 88990",
            stage=LeadStage.SITE_VISIT.value,
            priority=LeadPriority.HIGH.value,
            source="Walk-In",
            budget_min=13000000.0,
            budget_max=16000000.0,
            interested_project_id=proj_omr.id,
            assigned_user_id=sales_1.id,
            next_followup_date=today,  # Due Today!
        )
        db.add(lead_8)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_8.id, author_id=sales_1.id, note_type="Site Visit", content="Visited Olympia Meridian site to inspect structural progress of Tower A."),
            LeadNote(lead_id=lead_8.id, author_id=sales_1.id, note_type="Call", content="Follow up today to address queries on car parking allocation."),
        ])

        # Lead 9: Ananya Swaminathan
        lead_9 = Lead(
            name="Ananya Swaminathan",
            email="ananya.s@hdfcbank.com",
            phone="+91 98418 99001",
            stage=LeadStage.BOOKED.value,
            priority=LeadPriority.HIGH.value,
            source="Referral",
            budget_min=25000000.0,
            budget_max=28000000.0,
            interested_project_id=proj_marina.id,
            assigned_user_id=sales_1.id,
            next_followup_date=None,
        )
        db.add(lead_9)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_9.id, author_id=sales_1.id, note_type="Booking", content="East Bay Unit E-0801 confirmed. Loan pre-approved by HDFC Bank."),
        ])

        # Lead 10: Harish Raghavan
        lead_10 = Lead(
            name="Harish Raghavan",
            email="harish.raghavan@freshworks.com",
            phone="+91 98419 00112",
            stage=LeadStage.NEGOTIATION.value,
            priority=LeadPriority.MEDIUM.value,
            source="Direct Inquiry",
            budget_min=8500000.0,
            budget_max=10000000.0,
            interested_project_id=proj_omr.id,
            assigned_user_id=sales_2.id,
            next_followup_date=tomorrow,
        )
        db.add(lead_10)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_10.id, author_id=sales_2.id, note_type="Call", content="Discussing floor rise charges for 6th floor unit T-0602."),
        ])

        # Lead 11: Meenakshi Natarajan
        lead_11 = Lead(
            name="Meenakshi Natarajan",
            email="meenakshi.n@wipro.com",
            phone="+91 98420 11223",
            stage=LeadStage.CONTACTED.value,
            priority=LeadPriority.LOW.value,
            source="Website",
            budget_min=15000000.0,
            budget_max=18000000.0,
            interested_project_id=proj_marina.id,
            assigned_user_id=sales_2.id,
            next_followup_date=in_three_days,
        )
        db.add(lead_11)
        db.flush()

        # Lead 12: Raghavan Iyer
        lead_12 = Lead(
            name="Raghavan Iyer",
            email="raghavan.iyer@chennaipetro.com",
            phone="+91 98421 22334",
            stage=LeadStage.LOST.value,
            priority=LeadPriority.LOW.value,
            source="Walk-In",
            budget_min=6000000.0,
            budget_max=7500000.0,
            interested_project_id=proj_omr.id,
            assigned_user_id=sales_1.id,
            next_followup_date=None,
        )
        db.add(lead_12)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_12.id, author_id=sales_1.id, note_type="Note", content="Budget ceiling of ₹75L is below our base 2BHK price point of ₹92L. Marked as Lost."),
        ])

        # Lead 13: Siddharth Ramamurthy
        lead_13 = Lead(
            name="Siddharth Ramamurthy",
            email="siddharth.r@ford.com",
            phone="+91 98422 33445",
            stage=LeadStage.BOOKED.value,
            priority=LeadPriority.HIGH.value,
            source="Property Portal",
            budget_min=9000000.0,
            budget_max=10000000.0,
            interested_project_id=proj_omr.id,
            assigned_user_id=sales_2.id,
            next_followup_date=None,
        )
        db.add(lead_13)
        db.flush()
        db.add_all([
            LeadNote(lead_id=lead_13.id, author_id=sales_2.id, note_type="Booking", content="Booked 2BHK Unit T-0204 at Olympia Meridian Enclave."),
        ])

        print("📑 Creating pre-existing bookings connecting Leads and Units...")
        # 5. Bookings
        booking_1 = Booking(
            lead_id=lead_1.id,
            unit_id=created_units["V-01"].id,
            booked_by_user_id=sales_1.id,
            agreement_value=68000000.0,
            booking_amount=5000000.0,
            status=BookingStatus.CONFIRMED.value,
            payment_reference="HDFC-RTGS-8829104",
            notes="Exclusive beachfront villa. 10% advance paid, balance linked to construction milestones.",
            booking_date=datetime.utcnow() - timedelta(days=12),
        )

        booking_2 = Booking(
            lead_id=lead_5.id,
            unit_id=created_units["A-1402"].id,
            booked_by_user_id=sales_2.id,
            agreement_value=51000000.0,
            booking_amount=3500000.0,
            status=BookingStatus.CONFIRMED.value,
            payment_reference="ICICI-CHQ-449102",
            notes="Grand Azure 14th floor 4BHK. Includes 2 covered basement car parking slots.",
            booking_date=datetime.utcnow() - timedelta(days=5),
        )

        booking_3 = Booking(
            lead_id=lead_9.id,
            unit_id=created_units["E-0801"].id,
            booked_by_user_id=sales_1.id,
            agreement_value=26500000.0,
            booking_amount=2000000.0,
            status=BookingStatus.CONFIRMED.value,
            payment_reference="KOTAK-NEFT-991283",
            notes="Marina Skyline East Bay 3BHK. Sea view unit.",
            booking_date=datetime.utcnow() - timedelta(days=2),
        )

        booking_4 = Booking(
            lead_id=lead_13.id,
            unit_id=created_units["T-0204"].id,
            booked_by_user_id=sales_2.id,
            agreement_value=9200000.0,
            booking_amount=1000000.0,
            status=BookingStatus.CONFIRMED.value,
            payment_reference="SBI-UPI-10928374",
            notes="Olympia Meridian Tech Crest 2BHK unit.",
            booking_date=datetime.utcnow() - timedelta(days=1),
        )

        db.add_all([booking_1, booking_2, booking_3, booking_4])
        db.commit()
        print("✅ Database seeding complete!")
        print("   Users: 3 (Admin: admin@coromandel.in / Admin@1234, Sales: meera@coromandel.in & anand@coromandel.in / Sales@1234)")
        print("   Projects: 4 (Coromandel Bay, The Grand Azure, Marina Skyline, Olympia Meridian)")
        print(f"   Units: {len(units_data)} (Available: 18, Reserved: 2, Booked: 4)")
        print("   Leads: 13 (with full activity timeline)")
        print("   Bookings: 4 confirmed bookings")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
