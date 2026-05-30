with open("backend.py", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "print(" in line:
            safe_line = line.strip().encode('ascii', 'backslashreplace').decode('ascii')
            print(f"{i}: {safe_line}")
