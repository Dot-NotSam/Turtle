from pydantic import BaseModel
from typing import Optional, List

class Task(BaseModel):
    id: str
    action: str
    command: str
    node: str
    status: str
    output: Optional[str] = None
    policy: str
    block_reason: Optional[str] = None
    timestamp: str

class ParseRequest(BaseModel):
    command: str
    session_id: Optional[str] = None

class ParseResponse(BaseModel):
    session_id: str
    raw_command: str
    tasks: List[Task]
    status: str