import sys
import os

# Add the directory containing services to the path
sys.path.append(os.path.join(os.getcwd(), 'services'))

from bias_detector import BiasDetector

def test():
    detector = BiasDetector()
    
    test_cases = [
        ("How do you implement a binary search tree?", "Safe Question", "Software"),
        ("How do you handle a stress interview or high-pressure situations?", "Safe Question", "Professional/Stress (Old)"),
        ("How do you handle stress?", "Safe Question", "Professional/Stress (Individual token)"),
        ("What is your greatest weakness?", "Safe Question", "Professional/Behavioral"),
        ("Tell me about a time you failed.", "Safe Question", "Professional/Failure"),
        ("Can you tell me about the company values?", "Safe Question", "Company"),
        ("What is your favorite color?", "Biased", "Irrelevant"),
        ("Are you planning to have children soon?", "Biased", "Gender Bias"),
        ("I don't think someone from your lifestyle would fit our rigid corporate culture.", "Biased", "Semantic Bias (BERT)")
    ]
    
    print(f"{'Question':<60} | {'Expected':<15} | {'Actual':<15} | {'Status'}")
    print("-" * 100)
    
    for q, expected_cat, desc in test_cases:
        result = detector.analyze_question(q)
        actual_cat = result["classification"]
        status = "PASS" if actual_cat == expected_cat else "FAIL"
        print(f"{q[:58]:<60} | {expected_cat:<15} | {actual_cat:<15} | {status}")
        if status == "FAIL":
            print(f"  Details: {result}")

if __name__ == "__main__":
    test()
