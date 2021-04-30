import model
import urllib
import alfred
from flask import Flask, make_response, request, jsonify
app = Flask(__name__)


@app.route('/')
def search():
    query = request.args.get('q')
    if query is None or query == "":
        response = make_response(
            "Please specify a query parameter with /?q=query", 400)
        return response

    results = model.search_and_extract_code(query)
    return jsonify(results)


@app.route('/alfred')
def alfred_search():
    query = request.args.get('q')

    results = alfred.search_and_extract_code_for_alfred(query)
    return jsonify(results)


app.run(port=2633)
