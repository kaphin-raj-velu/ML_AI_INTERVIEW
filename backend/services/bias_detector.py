import re
import json
import os
import threading
from typing import List, Dict, Optional

try:
    from transformers import pipeline
    BERT_AVAILABLE = True
except ImportError:
    BERT_AVAILABLE = False


class BiasDetector:
    def __init__(self):
        # Strict Absolute Path Resolution
        self.dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'dat.json'))
        self.load_dataset()
        
        # BERT classification pipeline (Zero-Shot) - Load in background to prevent server freezes
        self.bert_classifier = None
        self.is_neural_ready = False
        
        if BERT_AVAILABLE:
            threading.Thread(target=self._init_bert_async, daemon=True).start()

    def _init_bert_async(self):
        try:
            # Use a lightweight zero-shot model
            self.bert_classifier = pipeline(
                "zero-shot-classification", 
                model="typeform/distilbert-base-uncased-mnli",
                device=-1 # CPU by default
            )
            self.is_neural_ready = True
            print("Neural Engine: ONLINE")
        except Exception as e:
            print(f"Neural Engine Fail: {e}")

    def load_dataset(self):
        try:
            with open(self.dataset_path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        except Exception as e:
            print(f"Error loading dataset: {e}")
            self.data = {
                "domains": {},
                "bias_rules": {},
                "suggestions": {},
                "mock_sessions": []
            }

    def save_dataset(self):
        try:
            with open(self.dataset_path, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=4)
            return True
        except Exception as e:
            print(f"Error saving dataset: {e}")
            return False

    def add_training_data(self, question: str, bias_type: str, category: Optional[str] = None):
        """
        bias_type: 'B' (Biased) or 'S' (Safe)
        """
        new_mock = {"q": question, "type": bias_type}

        if new_mock not in self.data["mock_sessions"]:
            self.data["mock_sessions"].insert(0, new_mock)

        if bias_type == 'B' and category:
            if category not in self.data["bias_rules"]:
                self.data["bias_rules"][category] = []

            pattern = question.lower().split()[-1].strip("? . ,")
            if len(pattern) < 3:
                pattern = question.lower()

            new_rule = {
                "pattern": pattern,
                "weight": 0.8,
                "explanation": f"Pattern identified during interactive training for {category}."
            }

            self.data["bias_rules"][category].append(new_rule)

        return self.save_dataset()

    def is_professional_domain(self, text: str) -> bool:
        text_lower = text.lower()
        
        for domain_name, domain_data in self.data["domains"].items():
            technical_keywords = domain_data.get("technical_keywords", [])
            safe_contexts = domain_data.get("safe_contexts", [])

            # Check for direct multi-word safe contexts
            for context in safe_contexts:
                if context in text_lower:
                    return True

            # Check for individual technical keywords
            for tk in technical_keywords:
                if re.search(rf"\b{re.escape(tk)}\b", text_lower):
                    return True
                
        return False

    def is_software_domain(self, text: str) -> bool:
        """Compatibility method: checks if text belongs to any professional domain."""
        return self.is_professional_domain(text)

    def analyze_question(self, text: str, domain: str = "Software Engineering") -> Dict:
        insights = []
        text_lower = text.lower()

        # Phase 1: FAST PATH - Hardcoded Bias Rules (Regex)
        for category, rules in self.data["bias_rules"].items():
            found_evidence = []
            highest_confidence = 0.0

            for rule in rules:
                pattern = rule["pattern"]
                regex_pattern = rf"\b{pattern}\b" if pattern.isalnum() else pattern

                for match in re.finditer(regex_pattern, text_lower, re.IGNORECASE):
                    found_evidence.append(match.group())
                    highest_confidence = max(highest_confidence, rule["weight"])

            if found_evidence:
                final_confidence = min(0.98, highest_confidence + (len(set(found_evidence)) - 1) * 0.05)
                if final_confidence >= 0.6:
                    insights.append({
                        "category": category,
                        "confidence": final_confidence,
                        "explanation": self._get_explanation(category, found_evidence[0]),
                        "legal_flag": final_confidence > 0.8,
                        "biased_phrases": list(set(found_evidence)),
                        "suggestions": self._get_suggestions(category)
                    })

        # Phase 2: SAFE PATH - Domain Keyword Verification
        # If we found no specific bias, check if it's already safely in the professional domain
        # This prevents technical safe questions from being over-analyzed by BERT
        is_professional = self.is_professional_domain(text)

        # Phase 3: NEURAL PATH - BERT Semantic Analysis
        if not insights and self.is_neural_ready and self.bert_classifier:
            try:
                labels = [
                    "technical software engineering question", 
                    "professional behavioral interview question", 
                    "biased, discriminatory, or personal question",
                    "general social talk"
                ]
                bert_res = self.bert_classifier(text, labels)
                
                # High threshold (0.85) to prevent neural false positives on technical jargon
                if bert_res['labels'][0] == "biased, discriminatory, or personal question" and bert_res['scores'][0] > 0.85:
                    insights.append({
                        "category": "Neural Bias Detection",
                        "confidence": bert_res['scores'][0],
                        "explanation": "Semantic analysis suggests potential underlying bias or unprofessional intent.",
                        "legal_flag": False,
                        "biased_phrases": [text],
                        "suggestions": ["Focus strictly on professional skills and technical scenarios."]
                    })
            except Exception as e:
                print(f"BERT Inference Error: {e}")

        # Phase 4: Categorize & Finalize
        if not insights and not is_professional:
            # Rejection for completely out-of-domain questions (Small Talk / Irrelevant)
            insights.append({
                "category": "Non-Software Question",
                "confidence": 0.95,
                "explanation": "This question is not related to the professional software engineering domain.",
                "legal_flag": False,
                "biased_phrases": ["N/A"],
                "suggestions": ["Please ask a question related to software engineering or professional conduct."]
            })

        is_biased = len(insights) > 0
        bias_type = insights[0]["category"] if is_biased else "None"
        
        if is_biased:
            suggested = insights[0]["suggestions"][0] if insights[0]["suggestions"] else "Focus on professional qualifications."
            if bias_type == "Non-Software / Domain Violation":
                suggested = "This tool is restricted to software and professional domain questions only."
        else:
            suggested = text
            # Minor polish for safe questions
            if "i want to" in text_lower or "can you" in text_lower:
                suggested = text.replace("i want to", "Could you please").replace("can you", "Would you be able to")

        return {
            "classification": "Biased" if is_biased and bias_type != "None" else "Safe Question",
            "bias_type": bias_type,
            "suggested_question": suggested,
            "is_biased": is_biased,
            "insights": insights,
            "overall_confidence": max([i["confidence"] for i in insights]) if is_biased else 0.98
        }

    def _get_explanation(self, category: str, detected_word: str) -> str:
        for rule in self.data["bias_rules"].get(category, []):
            if re.search(rule["pattern"], detected_word, re.IGNORECASE):
                return rule["explanation"]
        return f"Inquiries related to {category} are generally discouraged in professional interviews."

    def _get_suggestions(self, category: str) -> List[str]:
        return self.data["suggestions"].get(
            category,
            ["Focus on technical skills and job-related qualifications."]
        )

    def get_tone_alternatives(self, original: str, insights: List[Dict]) -> Dict:
        if not insights:
            return {}
        return {
            "formal": ["Could you explain your technical approach to this problem?"],
            "friendly": ["Can you share your experience with this topic?"],
            "technical": ["Describe the implementation details and trade-offs."]
        }