from transformers import pipeline

def debug_bert():
    try:
        classifier = pipeline(
            "zero-shot-classification", 
            model="typeform/distilbert-base-uncased-mnli"
        )
        text = "I don't think someone from your lifestyle would fit our rigid corporate culture."
        labels = ["professional", "biased", "discriminatory"]
        res = classifier(text, labels)
        print(f"Results for: {text}")
        for label, score in zip(res['labels'], res['scores']):
            print(f"  {label}: {score:.4f}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_bert()
