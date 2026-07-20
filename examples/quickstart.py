#!/usr/bin/env python3
"""
SoundScape API Quickstart Example
Demonstrates how to interact with the SoundScape REST backend programmatically.
"""

import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"


def fetch_workspace_note():
    print("--- 1. Fetching Workspace Note ---")
    url = f"{BASE_URL}/api/notes"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print(f"Title: {data.get('title')}")
            print(f"Content Preview: {data.get('content')[:60]}...")
            return data
    except urllib.error.URLError as e:
        print(f"Connection failed: {e}. Make sure 'python main.py' is running!")
        return None


def update_workspace_note(new_content):
    print("\n--- 2. Updating Workspace Note ---")
    url = f"{BASE_URL}/api/notes"
    payload = json.dumps({"content": new_content}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            print(f"Update status: {res.get('status')}, Last updated: {res.get('updated_at')}")
    except urllib.error.URLError as e:
        print(f"Failed to update note: {e}")


def log_focus_session(duration_minutes):
    print(f"\n--- 3. Logging {duration_minutes}-minute Focus Session ---")
    url = f"{BASE_URL}/api/sessions"
    payload = json.dumps({"duration_minutes": duration_minutes}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            print(f"Session logged! ID: {res.get('session_id')}, Completed at: {res.get('completed_at')}")
    except urllib.error.URLError as e:
        print(f"Failed to log session: {e}")


def get_focus_stats():
    print("\n--- 4. Fetching 7-Day Focus Stats Summary ---")
    url = f"{BASE_URL}/api/stats"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            stats = json.loads(response.read().decode())
            for entry in stats:
                print(f"Date: {entry['date']} | Total Focus: {entry['minutes']} mins")
    except urllib.error.URLError as e:
        print(f"Failed to fetch stats: {e}")


if __name__ == "__main__":
    print("Connecting to SoundScape Local Engine at http://127.0.0.1:8000...\n")
    note = fetch_workspace_note()
    if note:
        update_workspace_note("# SoundScape Flow Note\n\n- [x] Deep Coding Session\n- [x] Synthesized Binaural Beats")
        log_focus_session(25)
        get_focus_stats()
