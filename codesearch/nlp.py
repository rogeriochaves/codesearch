import os
import json
import requests

API_TOKEN = os.environ.get("API_TOKEN", None)

if API_TOKEN is None:
    print("Initializing hugging face...")  # nopep8
    from transformers import pipeline

    print("Initializing model...")
    model = pipeline("ner",
                     model="mrm8488/codebert-base-finetuned-stackoverflow-ner",
                     grouped_entities=True)
    print("Ready!")
else:
    print("API_TOKEN detected, using huggingface API for inference")
    url = "https://api-inference.huggingface.co/models/mrm8488/codebert-base-finetuned-stackoverflow-ner"
    headers = {"Authorization": f"Bearer {API_TOKEN}"}

    def model(text):
        data = json.dumps({"inputs": text})
        response = requests.request("POST", url, headers=headers, data=data)
        return json.loads(response.content.decode("utf-8"))


def nlp(text):
    # TODO sleep if error
    return model(text)
