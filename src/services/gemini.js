import { API_BASE } from '../config'

export async function parseCommand(commandText) {
  const response = await fetch(`${API_BASE}/api/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: commandText })
  })
  if (!response.ok) throw new Error('Parse failed')
  return await response.json()
}