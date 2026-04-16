import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.bias_detector import BiasDetector

def test_metrics():
    detector = BiasDetector()
    mock_sessions = [
        {"q": "How do you handle pressure in a stress interview?", "type": "S"}, # Professional Safe
        {"q": "What are our company values and culture?", "type": "S"}, # Professional Safe
        {"q": "What is the result of 2+2?", "type": "B"}, # Domain Violation
        {"q": "Are you single?", "type": "B"} # Biased
    ]
    
    tp, tn, fp, fn = 0, 0, 0, 0
    for item in mock_sessions:
        q = item["q"]
        actual_type = item["type"]
        res = detector.analyze_question(q)
        is_safe_pred = not res["is_biased"]
        is_safe_actual = (actual_type == 'S')
        
        if is_safe_actual:
            if is_safe_pred: tp += 1
            else: fn += 1
        else:
            if is_safe_pred: fp += 1
            else: tn += 1
            
    print(f"TP (True Safe): {tp}")
    print(f"TN (True Biased): {tn}")
    print(f"FP (False Safe): {fp}")
    print(f"FN (False Biased): {fn}")
    
    total = tp+tn+fp+fn
    accuracy = (tp+tn)/total if total > 0 else 0
    precision = tp/(tp+fp) if (tp+fp) > 0 else 0
    recall = tp/(tp+fn) if (tp+fn) > 0 else 0
    
    print(f"Accuracy: {accuracy}")
    print(f"Precision: {precision}")
    print(f"Recall: {recall}")

if __name__ == "__main__":
    test_metrics()
