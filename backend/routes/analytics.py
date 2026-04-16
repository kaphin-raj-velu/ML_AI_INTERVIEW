from fastapi import APIRouter, Depends
from .shared import detector, history_manager, get_cached_metrics, set_cached_metrics, invalidate_metrics_cache
from .auth import get_current_user

router = APIRouter()

@router.get("/analytics/{session_id}")
async def get_analytics(session_id: str, username: str = Depends(get_current_user)):
    # Use username as the key for isolated history
    history = history_manager.get_user_history(username)
    if not history:
        return {
            "session_id": session_id,
            "total_questions": 0,
            "bias_count": 0,
            "bias_distribution": {},
            "professionalism_score": 100
        }
        
    total = len(history)
    biased = [q for q in history if q["is_biased"]]
    bias_count = len(biased)
    
    distribution = {}
    for q in biased:
        for insight in q["insights"]:
            cat = insight["category"]
            distribution[cat] = distribution.get(cat, 0) + 1
            
    prof_score = ((total - bias_count) / total) * 100 if total > 0 else 100
    
    return {
        "session_id": session_id,
        "total_questions": total,
        "bias_count": bias_count,
        "bias_distribution": distribution,
        "professionalism_score": round(prof_score, 2)
    }

# Global metrics cache to prevent dashboard hangs
_cached_metrics = None

@router.get("/mock_data")
async def get_mock_data(username: str = Depends(get_current_user)):
    sessions = detector.data.get("mock_sessions", [])
    # Return 50 shuffled items for rich training variety
    import random
    sample = sessions.copy()
    random.shuffle(sample)
    return sample[:50]

@router.get("/model_metrics")
async def get_model_metrics():
    cached = get_cached_metrics()
    
    mock_sessions = detector.data.get("mock_sessions", [])
    if not mock_sessions:
        return {"accuracy": 0, "precision": 0, "recall": 0, "f1_score": 0, "total_samples": 0}

    # If already cached, return instantly
    if cached:
        return cached

    # Build a balanced sample to get realistic (non-trivial) metrics
    safe_items = [q for q in mock_sessions if q.get("type") == "S"][:60]
    bias_items = [q for q in mock_sessions if q.get("type") == "B"][:60]
    sample = safe_items + bias_items

    tp, tn, fp, fn = 0, 0, 0, 0
    for item in sample:
        question = item["q"]
        actual_type = item["type"]
        
        if not detector.is_software_domain(question):
            continue
            
        analysis_result = detector.analyze_question(question)
        is_safe_pred = not analysis_result["is_biased"]
        is_safe_actual = (actual_type == 'S')
        
        if is_safe_actual:
            if is_safe_pred: tp += 1
            else: fn += 1
        else:
            if is_safe_pred: fp += 1
            else: tn += 1

    total = tp + tn + fp + fn
    accuracy = (tp + tn) / total if total > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    result = {
        "accuracy": round(accuracy * 100, 2),
        "precision": round(precision * 100, 2),
        "recall": round(recall * 100, 2),
        "f1_score": round(f1 * 100, 2),
        "total_samples": total
    }
    set_cached_metrics(result)
    return result
