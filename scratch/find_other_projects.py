import os

parent_dir = r"C:\Bhavya\Projects"
print("Scanning parent directory:", parent_dir)

for root, dirs, files in os.walk(parent_dir):
    # limit depth to prevent long scans
    depth = root.replace(parent_dir, "").count(os.sep)
    if depth > 3:
        continue
        
    for file in files:
        if file == "App.jsx":
            print("Found App.jsx at:", os.path.abspath(os.path.join(root, file)))
