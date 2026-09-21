import os
import logging
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import auth, bookings, dashboard, leads, properties, users
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models.user import User

logger = logging.getLogger("uvicorn")

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty (ensures admin & staff logins work out-of-the-box on Render/Cloud)
def auto_seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            logger.info("🌱 Database is empty — running initial seed with admin & sales staff accounts...")
            from seed import seed_database
            seed_database(drop_tables=False)
            logger.info("✅ Database seeded successfully!")
    except Exception as exc:
        logger.warning(f"Note on initial seed: {exc}")
    finally:
        db.close()

try:
    auto_seed_if_empty()
except Exception as e:
    logger.warning(f"Auto-seed check note: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-Velocity Real Estate Operations & CRM API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Format FastAPI/Pydantic validation errors into clean, user-friendly messages.
    """
    errors = exc.errors()
    first_error = errors[0] if errors else None
    
    # Extract contextual message
    if first_error:
        msg = first_error.get("msg", "Invalid input provided.")
        if msg.startswith("Value error, "):
            msg = msg[len("Value error, "):]
        loc = first_error.get("loc", [])
        field_name = loc[-1] if loc else "field"
    else:
        msg = "Validation failed on the submitted data."
        field_name = "general"

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": msg,
            "field": str(field_name),
            "errors": [
                {
                    "field": str(e.get("loc", [])[-1]) if e.get("loc") else "field",
                    "message": e.get("msg", "").replace("Value error, ", ""),
                }
                for e in errors
            ],
        },
    )


# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(leads.router, prefix=settings.API_V1_STR)
app.include_router(properties.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)


# Serve built React frontend if dist directory exists (supports all-in-one Render deployment)
dist_candidates = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist"),
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist"),
    os.path.join(os.getcwd(), "frontend", "dist"),
    os.path.join(os.getcwd(), "dist"),
]

frontend_dist = next((p for p in dist_candidates if os.path.exists(p) and os.path.isdir(p)), None)

if frontend_dist:
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API and documentation paths to pass through
        if full_path.startswith("api") or full_path.startswith("health") or full_path.startswith("docs") or full_path.startswith("redoc"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
