print("Initializing hugging face...")  # nopep8
from transformers import pipeline

print("Initializing model...")
model = pipeline("ner",
                 model="mrm8488/codebert-base-finetuned-stackoverflow-ner",
                 grouped_entities=True)
print("Ready!")


def nlp(text):
    return model(text)
