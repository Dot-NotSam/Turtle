import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are the task decomposition engine for OpenClaw — an autonomous PC orchestration system.

Given a natural language command, break it into concrete executable shell command steps.
Respond ONLY with a raw JSON array. No markdown. No backticks. No explanation.

Each item must have exactly these fields:
{
  "action": "Human readable description",
  "command": "actual bash/shell command",
  "node": "local"
}

SAFETY: If a command is destructive (rm -rf, deleting /etc files, dropping databases, accessing secrets), set:
  "command": "__BLOCKED__"
  "action": "BLOCKED: [describe what was attempted]"

Example:
Input: "check disk space and show running processes"
Output: [
  {"action": "Check disk space", "command": "df -h", "node": "local"},
  {"action": "Show running processes", "command": "ps aux | head -20", "node": "local"}
]"""

async def parse_command(raw_command: str) -> list:
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=f"{SYSTEM_PROMPT}\n\nCommand: {raw_command}"
        )
        text = response.text.strip()
        # Strip accidental markdown
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Gemini error: {e}")
        return [{"action": "Parse failed", "command": "__ERROR__", "node": "local"}]