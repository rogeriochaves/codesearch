import model
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


app.run(port=5000)
