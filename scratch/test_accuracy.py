import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from services.bias_detector import BiasDetector

detector = BiasDetector()

test_cases = [
    "Are you pregnant?",
    "Where are you from?",
    "Tell me about your parent node.",
    "Do you have kids?",
    "Explain child components."
]

for text in test_cases:
    res = detector.analyze_question(text)
    print(f"Text: {text} -> Result: {'BIASED' if res else 'SAFE'}")
    if res:
        for r in res:
            print(f"  Category: {r['category']}, Confidence: {r['confidence']}")
