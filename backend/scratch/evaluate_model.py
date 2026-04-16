import json
import os
import re
import sys

# Add backend to path so we can import BiasDetector
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.bias_detector import BiasDetector

def evaluate():
    detector = BiasDetector()
    mock_sessions = detector.data.get("mock_sessions", [])
    
    if not mock_sessions:
        print("No mock sessions found.")
        return

    tp = 0 # True Positives (Biased correctly identified)
    tn = 0 # True Negatives (Safe correctly identified)
    fp = 0 # False Positives (Safe flagged as biased)
    fn = 0 # False Negatives (Biased missed)

    for item in mock_sessions:
        question = item["q"]
        actual_type = item["type"] # 'B' or 'S'
        
        insights = detector.analyze_question(question)
        is_biased = len(insights) > 0
        
        if actual_type == 'B':
            if is_biased:
                tp += 1
            else:
                fn += 1
        else: # Safe
            if is_biased:
                fp += 1
            else:
                tn += 1

    total = tp + tn + fp + fn
    accuracy = (tp + tn) / total if total > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    print(f"Total Samples: {total}")
    print(f"Accuracy: {accuracy * 100:.2f}%")
    print(f"Precision: {precision * 100:.2f}%")
    print(f"Recall: {recall * 100:.2f}%")
    print(f"F1 Score: {f1 * 100:.2f}%")
    
    return accuracy, precision, recall, f1

if __name__ == "__main__":
    evaluate()
