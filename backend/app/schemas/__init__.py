from app.schemas.user import UserLogin, UserResponse, Token
from app.schemas.property import (
    ProjectCreate, ProjectResponse,
    BuildingCreate, BuildingResponse,
    UnitCreate, UnitUpdate, UnitResponse
)
from app.schemas.lead import (
    LeadCreate, LeadUpdate, LeadResponse, LeadDetailResponse,
    LeadNoteCreate, LeadNoteResponse, LeadAssignRequest
)
from app.schemas.booking import BookingCreate, BookingResponse
from app.schemas.dashboard import DashboardStatsResponse

__all__ = [
    "UserLogin", "UserResponse", "Token",
    "ProjectCreate", "ProjectResponse",
    "BuildingCreate", "BuildingResponse",
    "UnitCreate", "UnitUpdate", "UnitResponse",
    "LeadCreate", "LeadUpdate", "LeadResponse", "LeadDetailResponse",
    "LeadNoteCreate", "LeadNoteResponse", "LeadAssignRequest",
    "BookingCreate", "BookingResponse",
    "DashboardStatsResponse",
]
