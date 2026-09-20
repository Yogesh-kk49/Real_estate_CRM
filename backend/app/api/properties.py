from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.property import Building, Project, Unit, UnitAvailability
from app.models.user import User
from app.schemas.property import (
    BuildingCreate, BuildingResponse,
    ProjectCreate, ProjectResponse,
    UnitCreate, UnitResponse, UnitUpdate
)

router = APIRouter(prefix="/properties", tags=["Properties"])


def _format_unit(u: Unit) -> dict:
    return {
        "id": u.id,
        "unit_number": u.unit_number,
        "unit_type": u.unit_type,
        "floor": u.floor,
        "super_builtup_sqft": u.super_builtup_sqft,
        "carpet_sqft": u.carpet_sqft,
        "facing": u.facing,
        "price": u.price,
        "availability": u.availability,
        "building_id": u.building_id,
        "building_name": u.building.name if u.building else "",
        "project_id": u.building.project_id if u.building else None,
        "project_name": u.building.project.name if u.building and u.building.project else "",
        "project_location": u.building.project.location if u.building and u.building.project else "",
        "updated_at": u.updated_at,
    }


@router.get("/projects", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.query(Project).order_by(Project.id.asc()).all()
    results = []
    for p in projects:
        total_units = 0
        avail_units = 0
        booked_units = 0
        for b in p.buildings:
            for u in b.units:
                total_units += 1
                if u.availability == UnitAvailability.AVAILABLE.value:
                    avail_units += 1
                elif u.availability == UnitAvailability.BOOKED.value:
                    booked_units += 1
        
        results.append({
            "id": p.id,
            "name": p.name,
            "location": p.location,
            "description": p.description,
            "status": p.status,
            "completion_year": p.completion_year,
            "hero_image": p.hero_image,
            "created_at": p.created_at,
            "buildings_count": len(p.buildings),
            "total_units_count": total_units,
            "available_units_count": avail_units,
            "booked_units_count": booked_units,
        })
    return results


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    existing = db.query(Project).filter(Project.name == project_in.name.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A project with name '{project_in.name}' already exists."
        )
    
    project = Project(
        name=project_in.name.strip(),
        location=project_in.location.strip(),
        description=project_in.description,
        status=project_in.status,
        completion_year=project_in.completion_year,
        hero_image=project_in.hero_image,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "id": project.id,
        "name": project.name,
        "location": project.location,
        "description": project.description,
        "status": project.status,
        "completion_year": project.completion_year,
        "hero_image": project.hero_image,
        "created_at": project.created_at,
        "buildings_count": 0,
        "total_units_count": 0,
        "available_units_count": 0,
        "booked_units_count": 0,
    }


@router.post("/buildings", response_model=BuildingResponse, status_code=status.HTTP_201_CREATED)
def create_building(
    building_in: BuildingCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    project = db.query(Project).filter(Project.id == building_in.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    building = Building(
        project_id=building_in.project_id,
        name=building_in.name.strip(),
        total_floors=building_in.total_floors,
    )
    db.add(building)
    db.commit()
    db.refresh(building)
    return {
        "id": building.id,
        "project_id": building.project_id,
        "name": building.name,
        "total_floors": building.total_floors,
        "units_count": 0,
        "available_units_count": 0,
        "created_at": building.created_at,
    }


@router.get("/units", response_model=List[UnitResponse])
def list_units(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    building_id: Optional[int] = Query(None, description="Filter by building ID"),
    unit_type: Optional[str] = Query(None, description="Filter by type (e.g. 2BHK, 3BHK)"),
    availability: Optional[str] = Query(None, description="Filter by status (Available, Reserved, Booked)"),
    search: Optional[str] = Query(None, description="Search unit number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Unit).join(Building).join(Project)
    
    if project_id:
        query = query.filter(Project.id == project_id)
    if building_id:
        query = query.filter(Building.id == building_id)
    if unit_type and unit_type != "All":
        query = query.filter(Unit.unit_type == unit_type)
    if availability and availability != "All":
        query = query.filter(Unit.availability == availability)
    if search:
        query = query.filter(Unit.unit_number.ilike(f"%{search.strip()}%"))

    units = query.order_by(Unit.building_id.asc(), Unit.floor.asc(), Unit.unit_number.asc()).all()
    return [_format_unit(u) for u in units]


@router.get("/units/{id}", response_model=UnitResponse)
def get_unit(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    unit = db.query(Unit).filter(Unit.id == id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found.")
    return _format_unit(unit)


@router.post("/units", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
def create_unit(
    unit_in: UnitCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    building = db.query(Building).filter(Building.id == unit_in.building_id).first()
    if not building:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Building not found.")

    existing = db.query(Unit).filter(
        Unit.building_id == unit_in.building_id,
        Unit.unit_number == unit_in.unit_number.strip()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unit '{unit_in.unit_number}' already exists in {building.name}."
        )

    unit = Unit(
        building_id=unit_in.building_id,
        unit_number=unit_in.unit_number.strip(),
        unit_type=unit_in.unit_type,
        floor=unit_in.floor,
        super_builtup_sqft=unit_in.super_builtup_sqft,
        carpet_sqft=unit_in.carpet_sqft,
        facing=unit_in.facing,
        price=unit_in.price,
        availability=unit_in.availability or UnitAvailability.AVAILABLE.value,
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return _format_unit(unit)


@router.patch("/units/{id}", response_model=UnitResponse)
def update_unit(
    id: int,
    unit_in: UnitUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    unit = db.query(Unit).filter(Unit.id == id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found.")

    for field, value in unit_in.model_dump(exclude_unset=True).items():
        setattr(unit, field, value)

    db.commit()
    db.refresh(unit)
    return _format_unit(unit)
