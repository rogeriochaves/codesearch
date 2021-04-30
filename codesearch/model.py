import time
import requests
import urllib
from bs4 import BeautifulSoup
from nlp import nlp
import re
from multiprocessing import cpu_count, Pool


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
    text = req.text
    text = text.replace("...", "")  # remove ellipsis
    text = re.sub(r'\d{1,2} \D{3} \d{4} —', "", text)  # remove dates

    soup = BeautifulSoup(text, features='html.parser')
    search_results = soup.find(id="search")
    # Search results descriptions are <spans> without classes with more text than other spans
    spans = search_results.findAll(lambda tag: tag.name ==
                                   "span" and tag.class_ is None and len(tag.text) > 40)
    descriptions = ["".join(s.strings) for s in spans]
    # We take just the first third which should be relevant results to speedup processing
    descriptions = descriptions[0:int(len(descriptions) / 3)]
    descriptions = " ".join(descriptions)

    titles = search_results.findAll("h3")
    titles = ["".join(s.strings) for s in titles]
    titles = titles[0:int(len(titles) / 3)]
    titles = " ".join(titles)

    return extract_code(titles + " " + descriptions)


def extract_code(text):
    print("Processing result...")
    time1 = time.time()
    result = nlp(text)
    time2 = time.time()
    print('Took %.3f ms' % ((time2 - time1) * 1000))

    return parse_result(result)


def parse_result(result):
    current_code = ""
    code_blocks = []
    last_end = 0
    for ner in result:
        entity = ner['entity_group']
        if 'Code_Block' not in entity and 'Function' not in entity and 'Value' not in entity:
            continue

        word = ner['word']

        if ner['start'] > last_end + 1:
            if len(current_code) > 2:
                code_blocks.append(current_code.strip())
            current_code = word.strip()
        else:
            current_code += word
        last_end = ner['end']

    if len(current_code) > 2:
        code_blocks.append(current_code)
    code_blocks = list(set(code_blocks))
    code_blocks = sorted(code_blocks, key=len, reverse=True)

    return code_blocks
