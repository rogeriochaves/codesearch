import os
import json
import requests
import time
import logging

logging.basicConfig(level=logging.INFO)

API_TOKEN = os.environ.get("API_TOKEN", None)

if API_TOKEN is None:
    logging.info("Initializing hugging face...")
    from transformers import pipeline

    logging.info("Initializing model...")
    model = pipeline("ner",
                     model="mrm8488/codebert-base-finetuned-stackoverflow-ner",
                     grouped_entities=True)
    printprint("Ready!")
else:
    logging.info("API_TOKEN detected, using huggingface API for inference")
    url = "https://api-inference.huggingface.co/models/mrm8488/codebert-base-finetuned-stackoverflow-ner"
    headers = {"Authorization": f"Bearer {API_TOKEN}"}

    def model(text):
        data = json.dumps({"inputs": text})
        response = requests.request("POST", url, headers=headers, data=data)
        result = json.loads(response.content.decode("utf-8"))
        if "error" in result:
            if "estimated_time" in result:
                time.sleep(result["estimated_time"] + 1)
                return model(text)
            else:
                raise Exception(result["error"])
        return result


def nlp(text):
    # TODO sleep if error
    return model(text)
