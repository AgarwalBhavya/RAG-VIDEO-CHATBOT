import os

for root, dirs, files in os.walk("."):
    # Skip .venv and node_modules
    if "node_modules" in root or ".venv" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith((".jsx", ".js", ".html")):
            print(os.path.join(root, file))
