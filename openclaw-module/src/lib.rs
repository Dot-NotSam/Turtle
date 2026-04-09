// Install SpacetimeDB CLI:
// curl -fsSL https://install.spacetimedb.com | bash
// spacetime init --lang rust openclaw-module
// cd openclaw-module

use spacetimedb::{spacetimedb, Identity, ReducerContext, Table, Timestamp};

#[spacetimedb(table)]
pub struct PcAgent {
    #[primarykey]
    pub agent_id: String,        // "local-001" or hostname
    pub hostname: String,
    pub ip_address: String,
    pub os: String,
    pub status: String,          // "online" | "busy" | "offline"
    pub cpu_usage: u32,          // 0-100
    pub memory_usage: u32,       // 0-100
    pub current_task: String,    // "" if idle
    pub last_seen: Timestamp,
}

#[spacetimedb(table)]
pub struct TaskResult {
    #[primarykey]
    pub task_id: String,
    pub session_id: String,
    pub agent_id: String,
    pub action: String,
    pub command: String,
    pub status: String,          // "pending" | "running" | "completed" | "failed" | "blocked"
    pub output: String,
    pub policy: String,          // "ALLOWED" | "BLOCKED"
    pub block_reason: String,
    pub created_at: Timestamp,
    pub completed_at: Timestamp,
}

#[spacetimedb(table)]
pub struct CommandSession {
    #[primarykey]
    pub session_id: String,
    pub raw_command: String,
    pub status: String,          // "parsing"|"executing"|"completed"
    pub summary: String,
    pub created_at: Timestamp,
}

// Reducers

#[spacetimedb(reducer)]
pub fn register_agent(ctx: ReducerContext, agent_id: String, hostname: String, 
                       ip_address: String, os: String) {
    PcAgent::insert(PcAgent {
        agent_id,
        hostname,
        ip_address,
        os,
        status: "online".to_string(),
        cpu_usage: 0,
        memory_usage: 0,
        current_task: "".to_string(),
        last_seen: ctx.timestamp,
    });
}

#[spacetimedb(reducer)]
pub fn update_agent_status(ctx: ReducerContext, agent_id: String, status: String,
                            cpu_usage: u32, memory_usage: u32, current_task: String) {
    if let Some(mut agent) = PcAgent::filter_by_agent_id(&agent_id) {
        agent.status = status;
        agent.cpu_usage = cpu_usage;
        agent.memory_usage = memory_usage;
        agent.current_task = current_task;
        agent.last_seen = ctx.timestamp;
        PcAgent::update_by_agent_id(&agent_id, agent);
    }
}

#[spacetimedb(reducer)]
pub fn insert_task_result(ctx: ReducerContext, task_id: String, session_id: String,
                           agent_id: String, action: String, command: String,
                           status: String, output: String, policy: String,
                           block_reason: String) {
    TaskResult::insert(TaskResult {
        task_id, session_id, agent_id, action, command,
        status, output, policy, block_reason,
        created_at: ctx.timestamp,
        completed_at: ctx.timestamp,
    });
}

#[spacetimedb(reducer)]
pub fn update_task_status(ctx: ReducerContext, task_id: String, 
                           status: String, output: String) {
    if let Some(mut task) = TaskResult::filter_by_task_id(&task_id) {
        task.status = status;
        task.output = output;
        task.completed_at = ctx.timestamp;
        TaskResult::update_by_task_id(&task_id, task);
    }
}
