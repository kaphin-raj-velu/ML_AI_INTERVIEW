from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import analysis, analytics, auth

app = FastAPI(title="Interview Copilot AI")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routes
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

@app.get("/")
async def root():
    return {"message": "Welcome to Interview Copilot AI API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
