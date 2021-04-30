import sys
import model
import json
import alfred
import logging

if sys.argv[1] == "--alfred":
    query = " ".join(sys.argv[2:])
    results = alfred.search_and_extract_code_for_alfred(query)
    print(json.dumps(results))
else:
    query = " ".join(sys.argv[1:])
    results = model.search_and_extract_code(query)
    print(results)
