from services.bias_detector import BiasDetector
from services.history_manager import HistoryManager
import threading

# Shared persistent instances
detector = BiasDetector()
history_manager = HistoryManager()

# Metrics Cache
_cached_metrics = None

def invalidate_metrics_cache():
    global _cached_metrics
    _cached_metrics = None

def get_cached_metrics():
    return _cached_metrics

def set_cached_metrics(metrics):
    global _cached_metrics
    _cached_metrics = metrics

def _precompute_metrics():
    """Runs once in background on startup to pre-warm the analytics cache."""
    try:
        mock_sessions = detector.data.get("mock_sessions", [])
        if not mock_sessions:
            return

        # Build a balanced sample: 50 from each class (safe/biased)
        safe_qs = [q for q in mock_sessions if q.get("type") == "S"][:60]
        bias_qs = [q for q in mock_sessions if q.get("type") == "B"][:60]
        sample = safe_qs + bias_qs

        tp, tn, fp, fn = 0, 0, 0, 0
        for item in sample:
            question = item.get("q", "")
            actual_type = item.get("type", "S")
            result = detector.analyze_question(question)
            is_safe_pred = not result["is_biased"]
            is_safe_actual = (actual_type == 'S')
            if is_safe_actual:
                if is_safe_pred: tp += 1
                else: fn += 1
            else:
                if is_safe_pred: fp += 1
                else: tn += 1

        total = tp + tn + fp + fn
        if total > 0:
            accuracy = (tp + tn) / total
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            set_cached_metrics({
                "accuracy": round(accuracy * 100, 2),
                "precision": round(precision * 100, 2),
                "recall": round(recall * 100, 2),
                "f1_score": round(f1 * 100, 2),
                "total_samples": total
            })
            print(f"[Metrics] Accuracy={round(accuracy*100,1)}%  P={round(precision*100,1)}%  R={round(recall*100,1)}%  Samples={total}")
    except Exception as e:
        print(f"[Metrics Pre-warm Error] {e}")

# Kick off pre-warm in background so metrics are ready immediately
threading.Thread(target=_precompute_metrics, daemon=True).start()
