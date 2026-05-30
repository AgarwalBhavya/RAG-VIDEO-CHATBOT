with open("src/App.jsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "VideoCard" in line:
            print(f"{i}: {line.strip()}")
