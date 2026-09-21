import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "EstatePulse_Database_and_API_Overview.pdf")

# Palette
COLOR_PRIMARY = colors.HexColor("#C25E34")      # Terracotta
COLOR_SECONDARY = colors.HexColor("#0F172A")    # Deep Slate
COLOR_MUTED = colors.HexColor("#475569")        # Muted Slate
COLOR_BG_LIGHT = colors.HexColor("#F8F7F4")     # Linen
COLOR_BORDER = colors.HexColor("#E2E8F0")       # Border grey
COLOR_ACCENT = colors.HexColor("#047857")       # Emerald
COLOR_AMBER = colors.HexColor("#B45309")        # Amber

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(COLOR_MUTED)
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "EstatePulse CRM • Database & API Architecture Overview")
            self.drawRightString(612 - 54, 750, "Live Submission Document")
            self.setStrokeColor(COLOR_BORDER)
            self.setLineWidth(0.5)
            self.line(54, 744, 612 - 54, 744)

        # Footer (all pages)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawString(54, 36, "EstatePulse CRM — Production Real Estate Operations OS © 2026")
        self.drawRightString(612 - 54, 36, page_text)
        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(54, 48, 612 - 54, 48)
        self.restoreState()


def generate_submission_pdf():
    doc = SimpleDocTemplate(
        PDF_OUTPUT_PATH,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=COLOR_SECONDARY,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=COLOR_MUTED,
        spaceAfter=14,
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=COLOR_PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=COLOR_SECONDARY,
        spaceBefore=8,
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=COLOR_SECONDARY,
        spaceAfter=6,
    )

    bold_body_style = ParagraphStyle(
        'BoldBody_Custom',
        parent=body_style,
        fontName='Helvetica-Bold',
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=COLOR_SECONDARY,
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=COLOR_SECONDARY,
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName='Helvetica-Bold',
    )

    badge_admin = ParagraphStyle(
        'BadgeAdmin',
        parent=table_cell_style,
        fontName='Helvetica-Bold',
        textColor=COLOR_AMBER,
    )

    badge_staff = ParagraphStyle(
        'BadgeStaff',
        parent=table_cell_style,
        fontName='Helvetica-Bold',
        textColor=COLOR_ACCENT,
    )

    story = []

    # Title & Metadata Banner
    story.append(Paragraph("EstatePulse CRM — Database & API Overview", title_style))
    story.append(Paragraph("Technical Interview Project Submission • Full-Stack Operations OS", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_PRIMARY, spaceBefore=0, spaceAfter=10))

    # Key Submission Links Table
    meta_data = [
        [
            Paragraph("<b>Live Web Application</b>", table_cell_bold),
            Paragraph("<font color='#C25E34'><u>https://real-estate-crm-5k5j.onrender.com</u></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Backend API Root</b>", table_cell_bold),
            Paragraph("<font color='#C25E34'><u>https://estatepulse-backend-56wz.onrender.com</u></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Interactive Swagger Docs</b>", table_cell_bold),
            Paragraph("<font color='#C25E34'><u>https://estatepulse-backend-56wz.onrender.com/api/docs</u></font>", table_cell_style)
        ],
        [
            Paragraph("<b>GitHub Repository</b>", table_cell_bold),
            Paragraph("<font color='#C25E34'><u>https://github.com/Yogesh-kk49/Real_estate_CRM</u></font>", table_cell_style)
        ],
    ]
    meta_table = Table(meta_data, colWidths=[130, 374])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # Section 1: Demo Credentials
    story.append(Paragraph("1. Demo Evaluation Credentials", h1_style))
    story.append(Paragraph("The application enforces strict Role-Based Access Control (RBAC). Reviewers can sign in with the following pre-configured credentials (or use the one-click modal loaders):", body_style))

    creds_data = [
        [Paragraph("Role", table_header_style), Paragraph("Email", table_header_style), Paragraph("Password", table_header_style), Paragraph("Privileges & Scoping", table_header_style)],
        [
            Paragraph("Administrator", badge_admin),
            Paragraph("admin@coromandel.in", table_cell_bold),
            Paragraph("Admin@1234", code_style),
            Paragraph("Full organization oversight, recruit sales consultants, all leads, inventory control", table_cell_style)
        ],
        [
            Paragraph("Sales Consultant", badge_staff),
            Paragraph("meera@coromandel.in", table_cell_bold),
            Paragraph("Sales@1234", code_style),
            Paragraph("Scoped lead workspace (assigned leads only), customer timeline, unit booking", table_cell_style)
        ],
        [
            Paragraph("Sales Consultant", badge_staff),
            Paragraph("anand@coromandel.in", table_cell_bold),
            Paragraph("Sales@1234", code_style),
            Paragraph("Scoped lead workspace (assigned leads only), customer timeline, unit booking", table_cell_style)
        ],
    ]
    creds_table = Table(creds_data, colWidths=[90, 120, 75, 219])
    creds_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_SECONDARY),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(creds_table)
    story.append(Spacer(1, 14))

    # Section 2: Database Architecture
    story.append(Paragraph("2. Database Architecture (PostgreSQL 16)", h1_style))
    story.append(Paragraph(
        "The production system is powered by a <b>Managed PostgreSQL 16</b> cloud database on Render. "
        "SQLAlchemy 2.0 ORM manages relational transactions, connection pooling (<code>pool_pre_ping=True</code>, <code>pool_recycle=300</code>), "
        "foreign keys, and row-level locks.", body_style
    ))

    db_entities_data = [
        [Paragraph("Entity Table", table_header_style), Paragraph("Primary Key / Indexes", table_header_style), Paragraph("Key Relational Constraints", table_header_style), Paragraph("Business Purpose", table_header_style)],
        [
            Paragraph("<b>users</b>", table_cell_bold),
            Paragraph("id (PK)<br/>email (UK, Indexed)", code_style),
            Paragraph("role: ADMIN | SALES_EMPLOYEE", table_cell_style),
            Paragraph("User authentication, salted bcrypt hashes (72-byte safe limit), RBAC access levels.", table_cell_style)
        ],
        [
            Paragraph("<b>projects</b>", table_cell_bold),
            Paragraph("id (PK)", code_style),
            Paragraph("1:N with buildings", table_cell_style),
            Paragraph("Chennai luxury developments (location, status, completion timeline).", table_cell_style)
        ],
        [
            Paragraph("<b>buildings</b>", table_cell_bold),
            Paragraph("id (PK)<br/>project_id (FK)", code_style),
            Paragraph("1:N with units", table_cell_style),
            Paragraph("Building towers and wings within luxury developments.", table_cell_style)
        ],
        [
            Paragraph("<b>units</b>", table_cell_bold),
            Paragraph("id (PK)<br/>building_id (FK)", code_style),
            Paragraph("availability: Available | Reserved | Booked", table_cell_style),
            Paragraph("Real-time inventory matrix: super built-up sq.ft, floor, facing, INR pricing.", table_cell_style)
        ],
        [
            Paragraph("<b>leads</b>", table_cell_bold),
            Paragraph("id (PK)<br/>assigned_user_id (FK)", code_style),
            Paragraph("7-Stage lifecycle state machine", table_cell_style),
            Paragraph("Buyer lead portfolio, budget bounds (Lakhs/Crores), scheduled follow-up dates.", table_cell_style)
        ],
        [
            Paragraph("<b>lead_notes</b>", table_cell_bold),
            Paragraph("id (PK)<br/>lead_id (FK), author_id (FK)", code_style),
            Paragraph("Indexed on created_at", table_cell_style),
            Paragraph("Chronological 360° interaction logs (Call, Meeting, WhatsApp, Site Visit).", table_cell_style)
        ],
        [
            Paragraph("<b>bookings</b>", table_cell_bold),
            Paragraph("id (PK)<br/><b>unit_id (FK, UK)</b>", code_style),
            Paragraph("<b>UNIQUE(unit_id)</b> constraint", table_cell_bold),
            Paragraph("Transaction ledger: token deposits, agreement values, payment references.", table_cell_style)
        ],
    ]
    db_table = Table(db_entities_data, colWidths=[70, 110, 120, 204])
    db_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_SECONDARY),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(db_table)
    story.append(Spacer(1, 14))

    # Section 3: Concurrency Guard
    story.append(Paragraph("3. Concurrency Guard: Zero Double-Booking Architecture", h1_style))
    story.append(Paragraph(
        "To eliminate double-allocations when multiple agents book the same high-demand villa at the exact same millisecond, "
        "EstatePulse executes an <b>atomic conditional UPDATE statement</b> inside the database transaction:", body_style
    ))
    
    code_box = [
        [Paragraph(
            "<b># backend/app/services/booking_service.py</b><br/>"
            "stmt = update(Unit).where(Unit.id == unit_id, Unit.availability == 'Available').values(availability='Booked')<br/>"
            "result = db.execute(stmt)<br/>"
            "<b>if result.rowcount == 0:</b><br/>"
            "&nbsp;&nbsp;&nbsp;&nbsp;db.rollback()<br/>"
            "&nbsp;&nbsp;&nbsp;&nbsp;<b>raise HTTPException(status_code=409, detail='Unit was just booked by another user.')</b>",
            code_style
        )]
    ]
    code_table = Table(code_box, colWidths=[504])
    code_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_PRIMARY),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(code_table)
    story.append(Spacer(1, 6))
    story.append(Paragraph("• <b>First Request</b>: Finds <code>availability = 'Available'</code>, updates row to <code>Booked</code>, returns <b>HTTP 201 Created</b>.<br/>"
                           "• <b>Second Concurrent Request</b>: Matches <code>rowcount == 0</code>, rolls back, returns <b>HTTP 409 Conflict</b>.<br/>"
                           "• <b>Secondary Safety</b>: Unique index constraint on <code>bookings.unit_id</code>.", body_style))

    story.append(PageBreak())

    # Section 4: API Specification
    story.append(Paragraph("4. Complete API Endpoints Specification", h1_style))
    story.append(Paragraph("Base URL: <code>https://estatepulse-backend-56wz.onrender.com/api</code> • Bearer Token Auth via <code>Authorization: Bearer &lt;JWT&gt;</code>", body_style))

    api_endpoints_data = [
        [Paragraph("Category", table_header_style), Paragraph("Method & Path", table_header_style), Paragraph("Access", table_header_style), Paragraph("Request Payload / Parameters", table_header_style), Paragraph("Status", table_header_style)],
        # Auth
        [Paragraph("Auth", table_cell_bold), Paragraph("<code>POST /auth/login</code>", code_style), Paragraph("Public", table_cell_style), Paragraph("email, password", table_cell_style), Paragraph("200, 401", table_cell_bold)],
        [Paragraph("Auth", table_cell_bold), Paragraph("<code>GET /auth/me</code>", code_style), Paragraph("Authenticated", table_cell_style), Paragraph("Bearer token header", table_cell_style), Paragraph("200, 401", table_cell_bold)],
        # Users
        [Paragraph("Users", table_cell_bold), Paragraph("<code>GET /users/employees</code>", code_style), Paragraph("Authenticated", table_cell_style), Paragraph("Active sales consultants", table_cell_style), Paragraph("200", table_cell_bold)],
        [Paragraph("Users", table_cell_bold), Paragraph("<code>GET /users</code>", code_style), Paragraph("Admin Only", badge_admin), Paragraph("Team roster & lead stats", table_cell_style), Paragraph("200, 403", table_cell_bold)],
        [Paragraph("Users", table_cell_bold), Paragraph("<code>POST /users</code>", code_style), Paragraph("Admin Only", badge_admin), Paragraph("Recruit staff (SALES_EMPLOYEE only)", table_cell_style), Paragraph("201, 400", table_cell_bold)],
        [Paragraph("Users", table_cell_bold), Paragraph("<code>PATCH /users/{id}</code>", code_style), Paragraph("Admin Only", badge_admin), Paragraph("Update profile / toggle active", table_cell_style), Paragraph("200, 404", table_cell_bold)],
        # Leads
        [Paragraph("Leads", table_cell_bold), Paragraph("<code>GET /leads</code>", code_style), Paragraph("RBAC Scoped", table_cell_style), Paragraph("Query: stage, priority, search", table_cell_style), Paragraph("200", table_cell_bold)],
        [Paragraph("Leads", table_cell_bold), Paragraph("<code>POST /leads</code>", code_style), Paragraph("Authenticated", table_cell_style), Paragraph("name, email, phone, budget, date", table_cell_style), Paragraph("201, 400", table_cell_bold)],
        [Paragraph("Leads", table_cell_bold), Paragraph("<code>GET /leads/{id}</code>", code_style), Paragraph("RBAC Scoped", table_cell_style), Paragraph("Full 360° lead timeline dossier", table_cell_style), Paragraph("200, 403", table_cell_bold)],
        [Paragraph("Leads", table_cell_bold), Paragraph("<code>PATCH /leads/{id}</code>", code_style), Paragraph("RBAC Scoped", table_cell_style), Paragraph("Lifecycle stage transition", table_cell_style), Paragraph("200, 400", table_cell_bold)],
        [Paragraph("Leads", table_cell_bold), Paragraph("<code>POST /leads/{id}/notes</code>", code_style), Paragraph("RBAC Scoped", table_cell_style), Paragraph("note_type, touchpoint content", table_cell_style), Paragraph("201", table_cell_bold)],
        [Paragraph("Leads", table_cell_bold), Paragraph("<code>POST /leads/{id}/assign</code>", code_style), Paragraph("Admin Only", badge_admin), Paragraph("assigned_user_id (Delegation)", table_cell_style), Paragraph("200, 403", table_cell_bold)],
        # Properties
        [Paragraph("Properties", table_cell_bold), Paragraph("<code>GET /properties/projects</code>", code_style), Paragraph("Authenticated", table_cell_style), Paragraph("Developments + inventory stats", table_cell_style), Paragraph("200", table_cell_bold)],
        [Paragraph("Properties", table_cell_bold), Paragraph("<code>GET /properties/units</code>", code_style), Paragraph("Authenticated", table_cell_style), Paragraph("Query: project_id, floor, availability", table_cell_style), Paragraph("200", table_cell_bold)],
        # Bookings
        [Paragraph("Bookings", table_cell_bold), Paragraph("<code>POST /bookings</code>", code_style), Paragraph("Authenticated", table_cell_style), Paragraph("lead_id, unit_id, agreement, deposit", table_cell_style), Paragraph("201, 409", table_cell_bold)],
        [Paragraph("Bookings", table_cell_bold), Paragraph("<code>GET /bookings</code>", code_style), Paragraph("RBAC Scoped", table_cell_style), Paragraph("Booking agreements ledger", table_cell_style), Paragraph("200", table_cell_bold)],
        # Dashboard
        [Paragraph("Dashboard", table_cell_bold), Paragraph("<code>GET /dashboard/stats</code>", code_style), Paragraph("RBAC Scoped", table_cell_style), Paragraph("Pipeline KPIs, follow-up alerts, funnel", table_cell_style), Paragraph("200", table_cell_bold)],
    ]

    api_table = Table(api_endpoints_data, colWidths=[60, 134, 75, 175, 60])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_SECONDARY),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(api_table)
    story.append(Spacer(1, 14))

    # Section 5: Engineering Highlights
    story.append(Paragraph("5. Technical Architecture Highlights", h1_style))
    highlights_text = (
        "• <b>Automated Cloud Bootstrapping</b>: On initial boot against an empty PostgreSQL database, the backend automatically "
        "initializes schema tables and seeds default demo accounts so logins work immediately with zero manual shell commands.<br/>"
        "• <b>Strict Role Escalation Guard</b>: System administrators can onboard sales consultants (<code>SALES_EMPLOYEE</code>), but "
        "backend Pydantic validators explicitly prohibit creating additional administrators to preserve organizational hierarchy.<br/>"
        "• <b>Input Normalization & Validation</b>: Indian telephone patterns (<code>+91</code> or 10-digit formats), future-dated "
        "follow-up dates, and Lakhs/Crores currency denominations are strictly validated.<br/>"
        "• <b>Automated Test Suite Verified</b>: 100% test pass rate across concurrency race conditions, RBAC authorization, and data validation."
    )
    story.append(Paragraph(highlights_text, body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {PDF_OUTPUT_PATH}")

if __name__ == "__main__":
    generate_submission_pdf()
