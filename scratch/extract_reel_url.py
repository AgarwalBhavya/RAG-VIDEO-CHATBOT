import json
import os
import re

log_path = r"C:\Users\agarw\.gemini\antigravity\brain\60a67531-8dbb-4e3e-85f5-ea9f0a2478dd\.system_generated\logs\transcript.jsonl"
print("Log path exists:", os.path.exists(log_path))

if os.path.exists(log_path):
    urls = set()
    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:
            if "instagram.com" in line:
                # Find all URLs matching instagram.com
                found = re.findall(r'https?://[^\s"\'\\<>]+instagram\.com[^\s"\'\\<>]+', line)
                for url in found:
                    urls.add(url)
    
    print("\nFound Instagram URLs in history:")
    for url in urls:
        print("-", url)
else:
    print("Log file not found at", log_path)
