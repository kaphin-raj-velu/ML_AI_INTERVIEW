from services.bias_detector import BiasDetector
import os

def check_detector():
    detector = BiasDetector()
    print(f"Path searching: {detector.dataset_path}")
    print(f"File exists: {os.path.exists(detector.dataset_path)}")
    print(f"Keys found: {list(detector.data.keys())}")
    print(f"Mock sessions count: {len(detector.data.get('mock_sessions', []))}")

if __name__ == "__main__":
    check_detector()
