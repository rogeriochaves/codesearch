import sys
import model

query = " ".join(sys.argv[1:])
print("Searching for", query, "...")
results = model.search_and_extract_code(query)

print(results)
