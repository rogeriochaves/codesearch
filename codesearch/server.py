import model
import urllib
from flask import Flask, make_response, request, jsonify
app = Flask(__name__)


@app.route('/')
def search():
    query = request.args.get('q')
    if query is None or query == "":
        response = make_response(
            "Please specify a query parameter with /?q=query", 400)
        return response

    print("Searching for", query, "...")
    results = model.search_and_extract_code(query)
    return jsonify(results)


@app.route('/alfred')
def alfred():
    query = request.args.get('q')

    response = {"items": [
        {
            "uid": "search",
            "valid": True,
            "title": "Search DuckDuckGo for '" + query + "'",
            "icon": {
                "path": "ddg.png"
            },
            "arg": "https://duckduckgo.com/?" + urllib.parse.urlencode({"q": query})
        }
    ]}

    if query is None or len(query) < 5:
        return jsonify(response)

    print("Searching for", query, "...")
    results = model.search_and_extract_code(query)

    for result in results:
        response["items"].append({
            "uid": result,
            "valid": True,
            "title": result,
            "arg": result
        })

    return jsonify(response)


app.run(port=2633)
