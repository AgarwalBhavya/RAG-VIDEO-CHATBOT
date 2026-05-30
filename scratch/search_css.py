with open("src/App.css", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "card-header" in line or "video-card" in line:
            print(f"{i}: {line.strip()}")
