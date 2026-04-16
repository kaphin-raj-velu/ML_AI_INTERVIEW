from pydantic import BaseModel
from typing import List, Optional

class AnalyzeRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default"
    language: Optional[str] = "en"

class BiasInsight(BaseModel):
    category: str
    confidence: float
    explanation: str
    legal_flag: bool
    biased_phrases: List[str]
    suggestions: List[str]

class AnalyzeResponse(BaseModel):
    original_question: str
    classification: str # "Safe Question" or "Biased"
    bias_type: str # e.g., "Gender Bias", "Leading Bias", "None"
    suggested_question: str
    is_biased: bool
    overall_confidence: float
    insights: List[BiasInsight]
    tone_alternatives: dict 

class ModelMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    total_questions: int

class UserSignup(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class SessionReport(BaseModel):
    session_id: str
    total_questions: int
    bias_count: int
    bias_distribution: dict # { "category": count }
    professionalism_score: float

class TrainRequest(BaseModel):
    question: str
    type: str # 'B' or 'S'
    category: Optional[str] = None
