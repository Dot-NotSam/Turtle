import { useState, useEffect } from 'react';
import { speakText } from '../services/elevenlabs';
import { toast } from '../utils/toast';

const styles = `
  .progress-track {
    width: 100%;
    height: 8px;
    background: rgba(255,255,255,0.06);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 10px;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
    border-radius: 4px;
    transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.6);
  }
  
  .task-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-glass);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 16px;
    animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes slideUpFade {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  .terminal-box {
    background: #050810;
    padding: 16px;
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 0.75rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    border-top: 1px solid rgba(255,255,255,0.05);
    transition: max-height 0.3s ease-out;
  }
  
  .summary-wrapper {
    position: relative;
    border-radius: 16px;
    padding: 1px;
    overflow: hidden;
    margin-top: 32px;
    margin-bottom: 32px;
    animation: slideUpFade 0.7s forwards;
  }
  .summary-bg {
    position: absolute;
    inset: -50%;
    background: conic-gradient(from 0deg, transparent 70%, var(--accent-blue) 85%, var(--accent-purple) 100%);
    animation: spinSweep 4s linear infinite;
    z-index: 0;
  }
  @keyframes spinSweep {
    to { transform: rotate(360deg); }
  }
  .summary-content {
    position: relative;
    background: var(--bg-card);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 15px;
    padding: 20px;
    z-index: 1;
    height: 100%;
  }

  .wave-bar-small {
    width: 3px;
    background: var(--text-primary);
    border-radius: 2px;
    height: 4px;
  }
  .wave-anim {
    animation: smallWave 0.5s infinite alternate ease-in-out;
  }
  @keyframes smallWave {
    0% { height: 4px; }
    100% { height: 16px; }
  }

  .node-pill {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
    border: 1px solid rgba(255,255,255,0.1);
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .confetti-container {
    position: absolute;
    top: 50%;
    left: 50%;
    pointer-events: none;
    z-index: 1000;
  }
  .confetti {
    position: absolute;
    width: 8px; height: 8px;
    background-color: var(--accent-green);
    animation: confetti-fall 2.5s ease-out forwards;
    border-radius: 2px;
  }
  @keyframes confetti-fall {
    0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) rotate(720deg); opacity: 0; }
  }
`;

function ConfettiBurst() {
  return (
    <div className="confetti-container">
      {Array.from({ length: 15 }).map((_, i) => {
        const tx = (Math.random() - 0.5) * 300 + 'px';
        const ty = (Math.random() * -300) - 100 + 'px';
        const colors = ['var(--accent-blue)', 'var(--accent-purple)', 'var(--accent-green)', 'var(--accent-amber)'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return (
          <div key={i} className="confetti" style={{ '--tx': tx, '--ty': ty, background: color, animationDelay: `${Math.random() * 0.2}s` }} />
        );
      })}
    </div>
  );
}

function OutputTaskCard({ task }) {
  const isBlocked = task.policy === 'BLOCKED' || task.status === 'blocked';
  const isComplete = task.status === 'completed';
  const isPending = task.status === 'pending';
  const isRunning = task.status === 'running';
  const isFailed = task.status === 'failed';

  let statusEl;
  if (isPending) statusEl = <span style={{display:'flex', alignItems:'center', gap:'6px', color:'var(--text-secondary)'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'gray',animation:'pulseOpacity 1s infinite'}} /> Pending...</span>;
  if (isRunning) statusEl = <span style={{display:'flex', alignItems:'center', gap:'6px', color:'var(--accent-amber)'}}><div style={{width:'12px',height:'12px',borderTop:'2px solid var(--accent-amber)',borderRadius:'50%',animation:'spin 1s linear infinite'}} /> Running...</span>;
  if (isComplete) statusEl = <span style={{color:'var(--accent-green)', fontWeight:700}}>✅ Done</span>;
  if (isFailed) statusEl = <span style={{color:'var(--accent-red)', fontWeight:700}}>❌ Failed</span>;
  if (isBlocked) statusEl = <span style={{color:'var(--accent-red)', fontWeight:700}}>❌ Blocked by ArmorClaw</span>;

  let terminalColor = 'var(--accent-green)';
  if (isRunning) terminalColor = 'var(--text-secondary)';
  if (isFailed || isBlocked) terminalColor = 'var(--accent-red)';

  const hostname = task.agent_id || task.agentId || 'local-node';

  return (
    <div className="task-card">
       {/* Card Header Area */}
       <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="node-pill">{hostname}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{task.action || 'Unknown Action'}</span>
             </div>
             <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                 {new Date(task.created_at || task.createdAt || Date.now()).toLocaleTimeString()}
             </span>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {task.policy === 'ALLOWED' ? (
                 <span style={{ fontSize: '0.65rem', background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent-green)', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', textShadow: '0 0 10px rgba(34, 197, 94, 0.4)' }}>
                   🛡️ ALLOWED
                 </span>
              ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', textShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}>
                      ⛔ BLOCKED
                    </span>
                    <span style={{ fontSize:'0.55rem', color:'var(--accent-red)' }}>{task.block_reason || task.blockReason}</span>
                 </div>
              )}
              <span style={{ borderLeft: '1px solid var(--border-glass)', height: '16px' }}></span>
              <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{statusEl}</div>
          </div>
       </div>
       
       {/* Terminal Output Area */}
       <div className="terminal-box">
           <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--accent-green)', textShadow: '0 0 5px var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 🛡️ Verified · ArmorClaw
              </span>
           </div>
           <div style={{ color: terminalColor, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
               {(task.output === "" || !task.output) ? "Waiting for output..." : task.output}
           </div>
       </div>
    </div>
  );
}

export default function OutputConsole() {
  const [session, setSession] = useState(null);
  const [taskResults, setTaskResults] = useState([]);
  const [useDemo, setUseDemo] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  
  // Read session
  useEffect(() => {
    let mounted = true;
    const stored = localStorage.getItem('currentSession');
    let sess = null;
    if (stored) {
        try { sess = JSON.parse(stored); } catch(e) {}
    }
    setSession(sess);
    if (!sess) {
        setUseDemo(true);
    } else {
        setUseDemo(true);
    }
    
    return () => {
        mounted = false;
    };
  }, []);

  // Demo fallback logic
  useEffect(() => {
     let timers = [];
     if (useDemo) {
          const rawSessionCommand = session ? session.raw_command : "Update nodes and delete temporary files";
          if (!session) {
             setSession({ session_id: 'demo-session-999', raw_command: rawSessionCommand, tasks: [] });
          }

          const m1 = { task_id: '1', agent_id: 'dev-station-01', action: 'Update nodes', command: 'apt update', status: 'running', output: '', policy: 'ALLOWED' };
          const m2 = { task_id: '2', agent_id: 'ml-rig', action: 'Delete temporary files', command: '__BLOCKED__', status: 'blocked', output: 'Access denied to system directory', policy: 'BLOCKED', block_reason: 'ArmorClaw: Destructive command detected' };
          const m3 = { task_id: '3', agent_id: 'build-server', action: 'Restart service', command: 'systemctl restart', status: 'pending', output: '', policy: 'ALLOWED' };

          setTaskResults([m1]);
          
          timers.push(setTimeout(() => {
              setTaskResults([{...m1, status: 'completed', output: 'Reading state information... Done\\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.'}, m2]);
              toast.success("✅ Task done on dev-station-01");
              toast.error("⛔ ArmorClaw blocked a command on ml-rig");
          }, 1500));
          
          timers.push(setTimeout(() => {
              setTaskResults([{...m1, status: 'completed', output: 'Reading state information... Done\\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.'}, m2, {...m3, status: 'completed', output: 'Service restarted successfully.\\nPID: 18234 | Port: 8080'}]);
              toast.success("✅ Task done on build-server");
          }, 3500));
     }
     return () => timers.forEach(clearTimeout);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useDemo]);

  // Derived states
  const totalTasks = session?.tasks?.length || Math.max(taskResults.length, 1);
  const completedTasks = taskResults.filter(t => ['completed', 'failed', 'blocked'].includes(t.status));
  const progressRatio = Math.min((completedTasks.length / totalTasks) * 100, 100) || 0;
  const isComplete = completedTasks.length > 0 && completedTasks.length >= totalTasks;

  const numCompleted = taskResults.filter(t => t.status === 'completed').length;
  const numBlocked = taskResults.filter(t => t.status === 'blocked').length;
  const summaryText = `Executed ${totalTasks} tasks. ${numCompleted} completed successfully. ${numBlocked} blocked by Armor Claw policy.`;

  const handlePlayAudio = async () => {
    if (playingAudio) return;
    setPlayingAudio(true);
    const audio = await speakText(summaryText);
    if (audio) {
      audio.onended = () => setPlayingAudio(false);
    } else {
      setTimeout(() => setPlayingAudio(false), 3000);
    }
  };

  return (
    <div className="page-enter">
      <style>{styles}</style>
      
      {/* HEADER & PROGRESS */}
      <header style={{ marginBottom: '24px', marginTop: '12px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Execution Feed</h1>
        
        <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
           <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
             <span style={{ color: 'var(--accent-purple)' }}>&gt;</span> {session?.raw_command || '...'}
           </div>
           
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600, marginTop: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Progress: {completedTasks.length} of {totalTasks} tasks complete
              </span>
              <span style={{ color: isComplete ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                {isComplete ? '✅ Complete' : '⏳ Executing...'}
              </span>
           </div>
           <div className="progress-track">
             <div className="progress-fill" style={{ width: `${progressRatio}%` }}></div>
           </div>
           <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '8px', opacity: 0.6 }}>
              ID: {session?.session_id || 'calculating...'}
           </div>
        </div>
      </header>
      
      {/* TASK RESULTS FEED */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
         {taskResults.map((task, idx) => (
           <OutputTaskCard key={task.task_id || task.taskId || idx} task={task} />
         ))}
      </div>
      
      {/* AI SUMMARY CARD */}
      {isComplete && (
        <div className="summary-wrapper">
           {isComplete && <ConfettiBurst />}
           <div className="summary-bg"></div>
           <div className="summary-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                 <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                   ✨ Mission Complete
                 </h3>
                 <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.1)', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                   🛡️ Verified by ArmorClaw
                 </span>
              </div>
              
              <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '20px' }}>
                 {summaryText}
              </p>
              
              <button 
                 className="interactive-element play-audio-btn"
                 onClick={handlePlayAudio}
                 style={{ 
                   background: 'rgba(255, 255, 255, 0.05)', 
                   border: '1px solid var(--border-glass)', 
                   borderRadius: '20px', 
                   padding: '8px 16px', 
                   display: 'flex', 
                   alignItems: 'center', 
                   gap: '12px', 
                   cursor: 'pointer',
                   color: 'var(--text-primary)',
                   fontFamily: 'var(--font-family)',
                   fontWeight: 600,
                   fontSize: '0.8rem'
                 }}
              >
                 🔊 {playingAudio ? 'Playing...' : 'Play Summary'}
                 
                 {/* Waveform graphic */}
                 <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '16px' }}>
                    {[1,2,3,4,5].map(i => (
                      <div 
                        key={i} 
                        className={`wave-bar-small ${playingAudio ? 'wave-anim' : ''}`} 
                        style={{ animationDelay: `${i * 0.1}s`, height: playingAudio ? undefined : '4px' }} 
                      />
                    ))}
                 </div>
              </button>
           </div>
        </div>
      )}
      
    </div>
  )
}
