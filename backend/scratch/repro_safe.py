from services.bias_detector import BiasDetector

def test_safe_questions():
    detector = BiasDetector()
    safe_questions = [
        "What is your experience with React?",
        "How do you handle a binary search tree?",
        "Can you explain the difference between a process and a thread?",
        "How do you handle stress in a professional environment?",
        "Tell me about your leadership experience.",
        "What are your long-term career goals?"
    ]
    
    print(f"{'Question':<60} | {'Classification':<15} | {'Bias Type':<20}")
    print("-" * 100)
    for q in safe_questions:
        result = detector.analyze_question(q)
        print(f"{q[:58]:<60} | {result['classification']:<15} | {result['bias_type']:<20}")

if __name__ == "__main__":
    test_safe_questions()
