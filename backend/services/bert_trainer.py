import json
import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from torch.utils.data import Dataset

class BiasDataset(Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)

def train_bert_model():
    dataset_path = os.path.join(os.path.dirname(__file__), 'dat.json')
    with open(dataset_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Prepare data from mock_sessions
    # Map S to 0 (Professional), B to 1 (Biased)
    texts = []
    labels = []
    for session in data.get('mock_sessions', []):
        texts.append(session['q'])
        labels.append(1 if session['type'] == 'B' else 0)

    if not texts:
        print("No training data found in dat.json")
        return

    model_name = "distilbert-base-uncased"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    encodings = tokenizer(texts, truncation=True, padding=True, max_length=128)
    
    dataset = BiasDataset(encodings, labels)

    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)

    training_args = TrainingArguments(
        output_dir='./results',
        num_train_epochs=3,
        per_device_train_batch_size=8,
        warmup_steps=100,
        weight_decay=0.01,
        logging_dir='./logs',
        logging_steps=10,
        report_to="none"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
    )

    print("Starting BERT Fine-Tuning...")
    trainer.train()
    
    # Save the model
    model_save_path = os.path.join(os.path.dirname(__file__), 'bias_model_bert')
    model.save_pretrained(model_save_path)
    tokenizer.save_pretrained(model_save_path)
    print(f"Model saved to {model_save_path}")

if __name__ == "__main__":
    train_bert_model()
