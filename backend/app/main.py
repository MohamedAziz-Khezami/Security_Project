from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.core.config import settings

# Initialize FastAPI app with metadata
app = FastAPI(
    title="SecureCrypt API",
    description="API for file and image encryption/decryption",
    version="1.0.0"
)

# Configure CORS middleware to allow cross-origin requests
# Note: Replace '*' with specific origins in production for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes from the router
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    """
    Root endpoint for the SecureCrypt API.
    
    Returns:
    - A welcome message as a JSON response.
    """
    return {"message": "Welcome to SecureCrypt API"}
