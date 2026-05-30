import json
import os
import re

log_path = r"C:\Users\agarw\.gemini\antigravity\brain\60a67531-8dbb-4e3e-85f5-ea9f0a2478dd\.system_generated\logs\transcript.jsonl"

if os.path.exists(log_path):
    with open(log_path, "r", encoding="utf-8") as f:
        for line in f:
            if "instagram.com/reel" in line:
                # print matches
                found = re.findall(r'https?://[^\s"\'\\<>]+instagram\.com/reel/[^\s"\'\\<>]+', line)
                if found:
                    print("Found in line:", found)
