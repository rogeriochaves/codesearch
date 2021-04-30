import model
import urllib


def search_and_extract_code_for_alfred(query):
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
        return response

    results = model.search_and_extract_code(query)

    for result in results:
        response["items"].append({
            "uid": result,
            "valid": True,
            "title": result,
            "arg": result
        })

    return response
