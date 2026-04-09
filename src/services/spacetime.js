import { DbConnection } from 'spacetimedb'

const SPACETIMEDB_URI = 'ws://localhost:3000'
const MODULE_NAME = 'openclaw-module'

let connection = null
let agents = []
let taskResults = []
let isAttempting = false
let isConnected = false
const listeners = new Set()

function notify() {
  listeners.forEach(fn => fn({ agents, taskResults, isConnected }))
}

export function connectSpacetime(onUpdate) {
  listeners.add(onUpdate)
  
  if (connection || isAttempting) {
    onUpdate({ agents, taskResults, isConnected })
    return
  }
  
  isAttempting = true

  try {
    connection = DbConnection.builder()
      .withUri(SPACETIMEDB_URI)
      .withModuleName(MODULE_NAME)
      .onConnect((conn, identity) => {
        console.log('SpacetimeDB connected:', identity.toHexString())
        isConnected = true
        conn.subscriptionBuilder().subscribe([
            'SELECT * FROM PcAgent',
            'SELECT * FROM TaskResult',
            'SELECT * FROM CommandSession'
        ])
        notify()
      })
      .onDisconnect(() => {
        console.log('SpacetimeDB disconnected')
        isConnected = false
        connection = null
        isAttempting = false
        notify()
      })
      .build()

    if (connection.db && connection.db.PcAgent) {
        connection.db.PcAgent.onInsert((agent) => {
            const id = agent.agentId || agent.agent_id;
            agents = [...agents.filter(a => (a.agentId || a.agent_id) !== id), agent]
            notify()
        })
        connection.db.PcAgent.onUpdate((oldAgent, newAgent) => {
            const id = newAgent.agentId || newAgent.agent_id;
            agents = agents.map(a => (a.agentId || a.agent_id) === id ? newAgent : a)
            notify()
        })
    }
    
    if (connection.db && connection.db.TaskResult) {
        connection.db.TaskResult.onInsert((result) => {
            taskResults = [...taskResults, result]
            notify()
        })
        connection.db.TaskResult.onUpdate((old, updated) => {
            const id = updated.taskId || updated.task_id;
            taskResults = taskResults.map(r => (r.taskId || r.task_id) === id ? updated : r)
            notify()
        })
    }
  } catch (error) {
    console.error("SpacetimeDB connection failed, falling back", error)
    isConnected = false
    notify()
  }
}

export function disconnectSpacetime(onUpdate) {
  listeners.delete(onUpdate)
}

export function getAgents() { return agents }
export function getTaskResults() { return taskResults }
