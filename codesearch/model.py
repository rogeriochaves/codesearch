import requests
import urllib
from bs4 import BeautifulSoup

print("Initializing hugging face...")  # nopep8
from transformers import pipeline

print("Initializing model...")
nlp = pipeline(
    "ner", model="mrm8488/codebert-base-finetuned-stackoverflow-ner")
print("Ready!")


def search_and_extract_code(query):
    url = 'https://www.google.com/search?hl=en&' + \
        urllib.parse.urlencode({"q": query})
    headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Cookie': '123',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.16; rv:86.0) Gecko/20100101 Firefox/86.0',
        'Host': 'www.google.com',
        'Referer': 'https://www.google.com/'
    }

    req = requests.get(url, headers=headers)
    soup = BeautifulSoup(req.text, features='html.parser')
    search_results = soup.find(id="search")
    search_text = "".join(search_results.strings).replace(u'\xa0', u' ')

    return extract_code(search_text)


def extract_code(text):
    print("Processing result...")
    result = nlp(text)
    return parse_result(result)


def parse_result(result):
    current_code = ""
    code_blocks = []
    last_index = 0
    for ner in result:
        entity = ner['entity']
        if 'Code_Block' not in entity and 'Function' not in entity and 'Value' not in entity:
            continue

        word = ner['word'].replace("Ġ", " ")
        if 'Value' in entity and len(word) < 5:
            continue

        if ner['index'] > last_index + 1:
            if current_code != "":
                code_blocks.append(current_code.strip())
            current_code = word.strip()
        else:
            current_code += word

        last_index = ner['index']
    if current_code != "":
        code_blocks.append(current_code)
    code_blocks = list(set(code_blocks))
    code_blocks = sorted(code_blocks, key=len, reverse=True)

    return code_blocks
