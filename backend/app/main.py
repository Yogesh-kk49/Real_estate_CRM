from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import auth, bookings, dashboard, leads, properties, users
from app.core.config import settings
from app.core.database import Base, engine

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

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
        # If pydantic prepends "Value error, ", strip it for clean UI display
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
