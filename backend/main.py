import uuid
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import Task, ParseRequest, ParseResponse
from gemini_parser import parse_command

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "OpenClaw Backend"}

@app.post("/api/parse")
async def parse(req: ParseRequest):
    raw_tasks = await parse_command(req.command)
    
    tasks = []
    for t in raw_tasks:
        is_blocked = t["command"] in ["__BLOCKED__", "__ERROR__"]
        tasks.append(Task(
            id=str(uuid.uuid4()),
            action=t["action"],
            command=t["command"],
            node=t.get("node", "local"),
            status="blocked" if is_blocked else "pending",
            policy="BLOCKED" if is_blocked else "ALLOWED",
            block_reason="ArmorClaw: Destructive command detected" if is_blocked else None,
            timestamp=datetime.now().isoformat()
        ))
    
    return ParseResponse(
        session_id=str(uuid.uuid4()),
        raw_command=req.command,
        tasks=tasks,
        status="confirming"
    )