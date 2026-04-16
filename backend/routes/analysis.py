from fastapi import APIRouter, HTTPException, Depends
from models.schemas import AnalyzeRequest, AnalyzeResponse
from services.bias_detector import BiasDetector
from .auth import get_current_user
from .shared import detector, history_manager, invalidate_metrics_cache

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_question(request: AnalyzeRequest, username: str = Depends(get_current_user)):
    try:
        analysis_result = detector.analyze_question(request.question)
        
        tone_alternatives = detector.get_tone_alternatives(request.question, analysis_result["insights"])
        
        response = AnalyzeResponse(
            original_question=request.question,
            classification=analysis_result["classification"],
            bias_type=analysis_result["bias_type"],
            suggested_question=analysis_result["suggested_question"],
            is_biased=analysis_result["is_biased"],
            overall_confidence=analysis_result["overall_confidence"],
            insights=analysis_result["insights"],
            tone_alternatives=tone_alternatives
        )
        
        # Store in persistent history
        history_manager.save(username, response.dict())
        invalidate_metrics_cache()
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from models.schemas import AnalyzeRequest, AnalyzeResponse, TrainRequest

@router.post("/train")
async def train_model(request: TrainRequest):
    try:
        success = detector.add_training_data(
            question=request.question,
            type=request.type,
            category=request.category
        )
        if success:
            return {"status": "success", "message": "Model trained successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save training data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{session_id}")
async def get_history(session_id: str, username: str = Depends(get_current_user)):
    return history_manager.get_user_history(username)
