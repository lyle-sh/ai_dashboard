'use client';
import CalendarEvents from './components/CalendarEvents';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

interface Goal { id:number; name:string; current:number; target:number; unit:string; color:string; status:string }
interface Countdown { id:number; label:string; days:number; color:string }
interface Priority { id:number; title:string; meta:string; tag:string; color:string }
interface CalEvent { id:number; time:string; title:string; detail:string; color:string; googleId?:string }
interface Habit { id:number; name:string; done:number[] }
interface Chip { text:string; type:'urgent'|'focus'|'good'|'warning' }
interface Briefing { headline:string; summary:string; chips:Chip[] }

const D_GOALS: Goal[] = [
  { id:1, name:'Instagram Reels', current:2, target:5, unit:'this week', color:'#f5a623', status:'behind' },
  { id:2, name:'Gym sessions',    current:1, target:4, unit:'this week', color:'#f06470', status:'at risk' },
  { id:3, name:'Running',         current:3, target:4, unit:'this week', color:'#2dd4a0', status:'on track' },
  { id:4, name:'Target weight',   current:3, target:5, unit:'kg to go',  color:'#a594ff', status:'in progress' },
];
const D_COUNTDOWNS: Countdown[] = [
  { id:1, label:'✈ Flight to Milan', days:2,  color:'#f06470' },
  { id:2, label:'🎯 Fitness target',  days:12, color:'#f5a623' },
  { id:3, label:'📊 Pitch deadline',  days:3,  color:'#2dd4a0' },
  { id:4, label:'🏖 Summer trip',     days:28, color:'#a594ff' },
];
const D_PRIORITIES: Priority[] = [
  { id:1, title:'Finish pitch deck slides', meta:'Due Friday · 40% done',   tag:'Urgent',  color:'#f06470' },
  { id:2, title:'Morning run (30 min)',      meta:'Before 9am · Goal streak', tag:'Health',  color:'#2dd4a0' },
  { id:3, title:'Post Instagram Reel',       meta:'3 days behind target',     tag:'Content', color:'#f5a623' },
  { id:4, title:'Review Q2 budget',          meta:'Team sync at 2pm',         tag:'Work',    color:'#a594ff' },
];
const D_CALEVENTS: CalEvent[] = [
  { id:1, time:'8:00',  title:'Morning run + journaling', detail:'Personal · 45 min',       color:'#2dd4a0' },
  { id:2, time:'10:00', title:'Deep work — Pitch deck',   detail:'Focus block · 2 hours',   color:'#a594ff' },
  { id:3, time:'14:00', title:'Q2 Budget team sync',      detail:'Zoom · 7 attendees · 1h', color:'#f5a623' },
  { id:4, time:'16:30', title:'⚠ Conflict: Gym vs Call', detail:'Rescheduling recommended', color:'#f06470' },
];
const D_HABITS: Habit[] = [
  { id:1, name:'Morning routine',    done:[1,1,1,1,1,0,0] },
  { id:2, name:'Gym / Workout',      done:[1,0,0,0,0,0,0] },
  { id:3, name:'No social media AM', done:[1,1,1,1,1,0,0] },
  { id:4, name:'Read 20 min',        done:[1,0,1,1,0,0,0] },
];

const COLORS = ['#a594ff','#2dd4a0','#f5a623','#f06470','#4fd89a','#7c6af7','#60c5f7','#f093fb'];
const DAYS_SHORT = ['M','T','W','T','F','S','S'];
const CHIP_STYLES: Record<string,{bg:string,border:string,color:string}> = {
  urgent:  {bg:'#f0647015',border:'#f0647030',color:'#f06470'},
  warning: {bg:'#f5a62315',border:'#f5a62330',color:'#f5a623'},
  focus:   {bg:'#7c6af715',border:'#7c6af730',color:'#a594ff'},
  good:    {bg:'#4fd89a15',border:'#4fd89a30',color:'#4fd89a'},
};

function getStatus(c:number,t:number){const p=c/t;if(p>=1)return'complete';if(p>=.6)return'on track';if(p>=.3)return'in progress';return'at risk';}
function statusColor(s:string){if(s==='complete')return'#4fd89a';if(s==='on track')return'#2dd4a0';if(s==='in progress')return'#a594ff';if(s==='behind')return'#f5a623';return'#f06470';}
function useLS<T>(key:string,def:T):[T,React.Dispatch<React.SetStateAction<T>>]{
  const[val,setVal]=useState<T>(def);
  useEffect(()=>{try{const s=localStorage.getItem(key);if(s)setVal(JSON.parse(s));}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(val));}catch{}},[val]);
  return[val,setVal];
}

const EG={name:'',current:'0',target:'10',unit:'this week',color:COLORS[0]};
const EC={label:'',days:'7',color:COLORS[2]};
const EP={title:'',meta:'',tag:'',color:COLORS[0]};
const EE={time:'',title:'',detail:'',color:COLORS[0]};

function GoogleCalBtn() {
  const { data: session } = useSession();
  if (session) return (
    <span style={{fontSize:11,color:'#2dd4a0',marginLeft:6,display:'inline-flex',alignItems:'center',gap:6}}>
      ✓ Google connected
      <button onClick={() => signOut()} style={{fontSize:10,color:'var(--text3)',background:'none',border:'1px solid var(--border)',borderRadius:4,cursor:'pointer',padding:'1px 5px'}}>Sign out</button>
    </span>
  );
  return <button className="add-btn" onClick={() => signIn('google')} style={{background:'#4285F420',color:'#4285F4',marginLeft:6}}>+ Google Cal</button>;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [goals,      setGoals]      = useLS<Goal[]>     ('mos_goals',      D_GOALS);
  const [countdowns, setCountdowns] = useLS<Countdown[]>('mos_countdowns', D_COUNTDOWNS);
  const [priorities, setPriorities] = useLS<Priority[]> ('mos_priorities', D_PRIORITIES);
  const [calEvents,  setCalEvents]  = useLS<CalEvent[]> ('mos_calevents',  D_CALEVENTS);
  const [googleCalEvents, setGoogleCalEvents] = useState<CalEvent[]>([]);
  const [habits,     setHabits]     = useLS<Habit[]>    ('mos_habits',     D_HABITS);

  const [briefing,  setBriefing]  = useState<Briefing|null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError,   setAiError]   = useState('');

  const [modal,  setModal]  = useState<string|null>(null);
  const [editId, setEditId] = useState<number|null>(null);
  const [gf, setGf] = useState({...EG});
  const [cf, setCf] = useState({...EC});
  const [pf, setPf] = useState({...EP});
  const [ef, setEf] = useState({...EE});
  const [hName, setHName] = useState('');

  async function generateBriefing() {
    setLoadingAI(true);
    setAiError('');
    try {
      const res = await fetch('/api/briefing', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({goals,priorities,calEvents,habits}),
      });
      if(!res.ok) throw new Error('API error');
      const data = await res.json();
      setBriefing(data);
    } catch {
      setAiError('Could not generate briefing. Check your API key in .env.local');
    } finally {
      setLoadingAI(false);
    }
  }

  function openModal(type:string,id?:number){
    setEditId(id??null);
    if(type==='goal'){const g=id?goals.find(x=>x.id===id):null;setGf(g?{name:g.name,current:String(g.current),target:String(g.target),unit:g.unit,color:g.color}:{...EG});}
    if(type==='priority'){const p=id?priorities.find(x=>x.id===id):null;setPf(p?{title:p.title,meta:p.meta,tag:p.tag,color:p.color}:{...EP});}
    if(type==='cal'){const e=id?calEvents.find(x=>x.id===id):null;setEf(e?{time:e.time,title:e.title,detail:e.detail,color:e.color}:{...EE});}
    if(type==='cd')setCf({...EC});
    if(type==='habit')setHName('');
    setModal(type);
  }
  function closeModal(){setModal(null);setEditId(null);}
  function saveGoal(){if(!gf.name.trim())return;const cur=Math.max(0,Number(gf.current)),tar=Math.max(1,Number(gf.target));const status=getStatus(cur,tar);if(editId)setGoals(p=>p.map(g=>g.id===editId?{...g,...gf,current:cur,target:tar,status}:g));else setGoals(p=>[...p,{id:Date.now(),name:gf.name,current:cur,target:tar,unit:gf.unit,color:gf.color,status}]);closeModal();}
  function saveCd(){if(!cf.label.trim())return;setCountdowns(p=>[...p,{id:Date.now(),label:cf.label,days:Math.max(0,Number(cf.days)),color:cf.color}]);closeModal();}
  function savePriority(){if(!pf.title.trim())return;if(editId)setPriorities(p=>p.map(x=>x.id===editId?{...x,...pf}:x));else setPriorities(p=>[...p,{id:Date.now(),...pf}]);closeModal();}
  async function saveCalEvent(){
    if(!ef.title.trim())return;
    if(editId){
      const existing=calEvents.find(x=>x.id===editId);
      setCalEvents(p=>p.map(x=>x.id===editId?{...x,...ef}:x));
      if(session?.accessToken&&existing?.googleId){
        await fetch('/api/calendar',{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.accessToken},body:JSON.stringify({...ef,googleId:existing.googleId})});
      }
    } else {
      let googleId;
      if(session?.accessToken){
        const res=await fetch('/api/calendar',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.accessToken},body:JSON.stringify(ef)});
        const data=await res.json();
        googleId=data.googleId;
      }
      setCalEvents(p=>[...p,{id:Date.now(),...ef,googleId}]);
    }
    closeModal();
  }
  function saveHabit(){if(!hName.trim())return;setHabits(p=>[...p,{id:Date.now(),name:hName,done:[0,0,0,0,0,0,0]}]);closeModal();}
  function toggleHabit(hid:number,day:number){setHabits(p=>p.map(h=>h.id===hid?{...h,done:h.done.map((d,i)=>i===day?d===1?0:1:d)}:h));}
  function incrementGoal(id:number){setGoals(p=>p.map(g=>{if(g.id!==id)return g;const next=Math.min(g.current+1,g.target);return{...g,current:next,status:getStatus(next,g.target)};}));}

  const now=new Date();
  // Fetch today's Google Calendar events
  useEffect(()=>{
    if(!session?.accessToken) return;
    const startOfDay=new Date(); startOfDay.setHours(0,0,0,0);
    const endOfDay=new Date(); endOfDay.setHours(23,59,59,999);
    fetch('/api/calendar?timeMin='+startOfDay.toISOString()+'&timeMax='+endOfDay.toISOString(),{
      headers:{'Authorization':'Bearer '+session.accessToken}
    })
    .then(r=>r.json())
    .then(data=>{
      const localGoogleIds=calEvents.filter(e=>e.googleId).map(e=>e.googleId);
      const merged=(data.events||[])
        .filter((e:any)=>!localGoogleIds.includes(e.id))
        .map((e:any)=>({
          id: e.id,
          time: e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false}) : 'All Day',
          title: e.summary||'Untitled',
          detail: e.description||'',
          color: '#4285F4',
          googleId: e.id
        }));
      setGoogleCalEvents(merged);
    })
    .catch(console.error);
  },[session]);

  const dateStr=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const hour=now.getHours();
  const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  const sortedCal=[...calEvents,...googleCalEvents].sort((a,b)=>a.time.localeCompare(b.time));

  const CP=({value,onChange}:{value:string,onChange:(c:string)=>void})=>(
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {COLORS.map(c=><div key={c} onClick={()=>onChange(c)} style={{width:24,height:24,borderRadius:'50%',background:c,cursor:'pointer',border:`2px solid ${value===c?'#fff':'transparent'}`,transform:value===c?'scale(1.2)':'scale(1)',transition:'transform .15s'}}/>)}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        :root{--bg:#0a0a0f;--bg2:#111118;--bg3:#16161f;--bg4:#1c1c28;--border:#ffffff0f;--border2:#ffffff18;--text:#f0f0f8;--text2:#9090a8;--text3:#5a5a70;--accent:#7c6af7;--accent2:#a594ff;--green:#4fd89a}
        html,body{height:100%;background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;overflow:hidden}
        .layout{display:flex;height:100vh}
        .sidebar{width:220px;min-width:220px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:24px 14px;gap:4px;height:100vh;overflow-y:auto}
        .logo{display:flex;align-items:center;gap:10px;padding:0 8px 22px;border-bottom:1px solid var(--border);margin-bottom:8px}
        .logo-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#7c6af7,#a594ff);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff}
        .nav-section{font-size:10px;font-weight:600;letter-spacing:.08em;color:var(--text3);text-transform:uppercase;padding:14px 8px 4px}
        .nav-item{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;font-size:13px;color:var(--text2);cursor:pointer;border:1px solid transparent;transition:all .15s}
        .nav-item:hover{background:var(--bg3);color:var(--text)}
        .nav-item.active{background:#7c6af720;color:var(--accent2);border-color:#7c6af722}
        .nav-dot{width:6px;height:6px;border-radius:50%;background:var(--text3);flex-shrink:0}
        .nav-item.active .nav-dot{background:var(--accent2)}
        .nav-badge{margin-left:auto;background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:20px}
        .sidebar-footer{margin-top:auto;padding-top:16px;border-top:1px solid var(--border)}
        .main{flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden;min-width:0}
        .topbar{padding:22px 28px 0;display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0}
        .greeting-sub{font-size:11px;color:var(--text3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
        .greeting-main{font-family:'DM Serif Display',serif;font-size:26px;color:var(--text);letter-spacing:-.3px}
        .greeting-main em{color:var(--accent2);font-style:italic}
        .status-pill{background:var(--bg3);border:1px solid var(--border);border-radius:20px;padding:7px 14px;font-size:12px;color:var(--text2);display:flex;align-items:center;gap:7px;flex-shrink:0}
        .pulse{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .content{flex:1;overflow-y:auto;padding:18px 28px 28px;display:grid;grid-template-columns:1fr 1fr 300px;gap:14px;align-content:start}
        .content::-webkit-scrollbar{width:4px}
        .content::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}
        .span2{grid-column:span 2}
        .col3{grid-column:3;grid-row:1/5;display:flex;flex-direction:column;gap:14px}
        .card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:18px}
        .clabel{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);display:flex;align-items:center;gap:6px}
        .ldot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .row{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .ai-badge{display:inline-flex;align-items:center;gap:6px;background:#7c6af718;border:1px solid #7c6af730;border-radius:20px;padding:4px 10px;font-size:11px;color:var(--accent2)}
        .ai-dot{width:5px;height:5px;border-radius:50%;background:var(--accent2)}
        .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
        .chip{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500}
        .gen-btn{width:100%;padding:11px;border-radius:10px;font-size:13px;font-weight:600;border:1px solid #7c6af740;background:#7c6af718;color:var(--accent2);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;margin-top:14px;display:flex;align-items:center;justify-content:center;gap:8px}
        .gen-btn:hover{background:#7c6af728;border-color:#7c6af760}
        .gen-btn:disabled{opacity:.5;cursor:not-allowed}
        .skeleton{background:linear-gradient(90deg,var(--bg3) 25%,var(--bg4) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:6px;margin-bottom:8px}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .p-item{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer;transition:background .15s;border:1px solid transparent}
        .p-item:hover{background:var(--bg3);border-color:var(--border)}
        .rank{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
        .ptag{font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600;flex-shrink:0}
        .xbtn{width:20px;height:20px;border-radius:5px;background:transparent;border:none;color:var(--text3);cursor:pointer;font-size:11px;display:none;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}
        .p-item:hover .xbtn,.cal-item:hover .xbtn{display:flex}
        .xbtn:hover{background:#f0647020!important;color:#f06470!important}
        .cal-item{display:flex;gap:10px;padding:8px;border-radius:8px;cursor:pointer;transition:background .15s;border:1px solid transparent}
        .cal-item:hover{background:var(--bg3);border-color:var(--border)}
        .cal-bar{width:3px;border-radius:4px;flex-shrink:0;min-height:32px}
        .goal-item{margin-bottom:10px;padding:10px;border-radius:10px;background:var(--bg3);border:1px solid var(--border)}
        .goal-item:last-child{margin-bottom:0}
        .track{height:5px;background:#ffffff08;border-radius:10px;overflow:hidden;margin:6px 0}
        .fill{height:100%;border-radius:10px;transition:width .4s ease}
        .g-actions{display:flex;gap:5px;margin-top:8px}
        .g-btn{flex:1;padding:5px;border-radius:6px;font-size:11px;font-weight:600;border:1px solid var(--border);background:transparent;color:var(--text2);cursor:pointer;transition:all .15s}
        .g-btn:hover{background:var(--bg4);color:var(--text)}
        .g-btn.inc:hover{background:#2dd4a020;color:#2dd4a0;border-color:#2dd4a030}
        .g-btn.del:hover{background:#f0647020;color:#f06470;border-color:#f0647030}
        .cd-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .cdown{background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;position:relative}
        .cdown-x{position:absolute;top:5px;right:5px;width:16px;height:16px;border-radius:4px;background:transparent;border:none;color:var(--text3);font-size:10px;cursor:pointer;display:none;align-items:center;justify-content:center;transition:all .15s}
        .cdown:hover .cdown-x{display:flex}
        .cdown-x:hover{background:#f0647020;color:#f06470}
        .h-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:4px;border-radius:6px}
        .h-row:last-child{margin-bottom:0}
        .hdot{width:18px;height:18px;border-radius:5px;background:#ffffff08;cursor:pointer;transition:all .15s;border:1px solid transparent;display:flex;align-items:center;justify-content:center;font-size:9px;color:transparent;flex-shrink:0}
        .hdot:hover{border-color:var(--border2);background:#ffffff12}
        .hdot.on{background:#4fd89a;color:#fff;border-color:transparent}
        .h-del{width:18px;height:18px;border-radius:5px;background:transparent;border:none;color:transparent;cursor:pointer;font-size:10px;transition:all .15s;flex-shrink:0}
        .h-row:hover .h-del{color:var(--text3)}
        .h-row:hover .h-del:hover{background:#f0647020;color:#f06470}
        .qa-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
        .qa-btn{display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);font-size:12px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .15s}
        .qa-btn:hover{background:var(--bg4);color:var(--text);border-color:var(--border2)}
        .qa-icon{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
        .divider{border:none;border-top:1px solid var(--border);margin:14px 0}
        .add-btn{font-size:11px;color:var(--accent2);cursor:pointer;background:none;border:none;padding:0;opacity:.7;transition:opacity .15s}
        .add-btn:hover{opacity:1}
        .overlay{position:fixed;inset:0;background:#00000090;z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal{background:var(--bg2);border:1px solid var(--border2);border-radius:16px;padding:24px;width:100%;max-width:400px}
        .modal-title{font-family:'DM Serif Display',serif;font-size:18px;color:var(--text);margin-bottom:20px}
        .field{margin-bottom:14px}
        .field label{display:block;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
        .field input{width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:9px 12px;font-size:13px;color:var(--text);font-family:'DM Sans',sans-serif;outline:none;transition:border-color .15s}
        .field input:focus{border-color:#7c6af750}
        .mrow{display:flex;gap:8px}
        .mrow .field{flex:1}
        .btn-row{display:flex;gap:8px;margin-top:20px}
        .btn-p{flex:1;padding:10px;border-radius:8px;background:var(--accent);border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .15s}
        .btn-p:hover{opacity:.85}
        .btn-s{padding:10px 16px;border-radius:8px;background:transparent;border:1px solid var(--border2);color:var(--text2);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
        .btn-s:hover{background:var(--bg3);color:var(--text)}
      `}</style>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">OS</div>
            <div><div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>MorningOS</div><div style={{fontSize:10,color:'var(--text3)'}}>AI Dashboard</div></div>
          </div>
          {[{l:'Today',b:'3'},{l:'Goals'},{l:'Calendar'},{l:'Countdowns'}].map(n=>(
            <div key={n.l} className={`nav-item${n.l==='Today'?' active':''}`}>
              <div className="nav-dot"/>{n.l}{n.b&&<span className="nav-badge">{n.b}</span>}
            </div>
          ))}
          <div className="nav-section">Planning</div>
          {['This Week','Projects'].map(l=><div key={l} className="nav-item"><div className="nav-dot"/>{l}</div>)}
          <div className="nav-section">Integrations</div>
          {['Google Cal','Telegram'].map(l=><div key={l} className="nav-item"><div className="nav-dot"/>{l}</div>)}
          <div className="sidebar-footer">
            <div style={{display:'flex',alignItems:'center',gap:10,padding:8}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#7c6af7,#2dd4a0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>Y</div>
              <div><div style={{fontSize:13,fontWeight:500}}>You</div><div style={{fontSize:10,color:'var(--text3)'}}>Pro · Active</div></div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <div>
              <div className="greeting-sub">{dateStr}</div>
              <div className="greeting-main">{greeting}, <em>let&apos;s win today.</em></div>
            </div>
            <div className="status-pill"><div className="pulse"/>{loadingAI?'Generating…':briefing?'Briefing ready':'AI briefing ready'}</div>
          </div>

          <div className="content">

            {/* ── AI BRIEFING CARD ── */}
            <div className="card span2">
              {/* Top row: badge only */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div className="ai-badge"><div className="ai-dot"/> AI Morning Briefing</div>
                {briefing && !loadingAI && (
                  <button className="add-btn" onClick={generateBriefing}>↺ Regenerate</button>
                )}
              </div>

              {/* Loading skeleton */}
              {loadingAI && (
                <div>
                  <div className="skeleton" style={{height:18,width:'70%'}}/>
                  <div className="skeleton" style={{height:18,width:'50%'}}/>
                  <div className="skeleton" style={{height:13,width:'90%',marginTop:14}}/>
                  <div className="skeleton" style={{height:13,width:'80%'}}/>
                  <div className="skeleton" style={{height:13,width:'60%'}}/>
                </div>
              )}

              {/* Briefing content */}
              {!loadingAI && briefing && (
                <>
                  <div style={{fontFamily:'DM Serif Display,serif',fontSize:17,color:'var(--text)',lineHeight:1.4,marginBottom:10}}>{briefing.headline}</div>
                  <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.7}}>{briefing.summary}</div>
                  <div className="chips">
                    {briefing.chips.map((chip,i)=>{
                      const s=CHIP_STYLES[chip.type]||CHIP_STYLES.focus;
                      return <div key={i} className="chip" style={{background:s.bg,border:`1px solid ${s.border}`,color:s.color}}>{chip.text}</div>;
                    })}
                  </div>
                </>
              )}

              {/* Empty state — big prominent button */}
              {!loadingAI && !briefing && (
                <>
                  <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.7,marginBottom:4}}>
                    Get a personalized morning summary based on your actual goals, calendar, and priorities.
                  </div>
                  {aiError && <div style={{fontSize:12,color:'#f06470',marginBottom:8}}>{aiError}</div>}
                  <button className="gen-btn" onClick={generateBriefing} disabled={loadingAI}>
                    ✦ Generate My Morning Briefing
                  </button>
                </>
              )}
            </div>

            {/* PRIORITIES */}
            <div className="card">
              <div className="row">
                <div className="clabel"><div className="ldot" style={{background:'#a594ff'}}/>Today&apos;s priorities</div>
                <button className="add-btn" onClick={()=>openModal('priority')}>+ Add</button>
              </div>
              {priorities.map((p,i)=>(
                <div className="p-item" key={p.id} onClick={()=>openModal('priority',p.id)}>
                  <div className="rank" style={{background:`${p.color}18`,color:p.color}}>{i+1}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.title}</div>
                    <div style={{fontSize:11,color:'var(--text3)'}}>{p.meta}</div>
                  </div>
                  <div className="ptag" style={{background:`${p.color}15`,color:p.color}}>{p.tag}</div>
                  <button className="xbtn" onClick={e=>{e.stopPropagation();setPriorities(x=>x.filter(i=>i.id!==p.id))}}>✕</button>
                </div>
              ))}
            </div>

            {/* CALENDAR */}
            <div className="card">
              <div className="row">
                <div className="clabel"><div className="ldot" style={{background:'#2dd4a0'}}/>Today&apos;s calendar</div>
                <button className="add-btn" onClick={()=>openModal('cal')}>+ Add</button>
                <GoogleCalBtn />
              </div>
              {sortedCal.map(e=>(
                <div className="cal-item" key={e.id} onClick={()=>openModal('cal',e.id)}>
                  <div style={{minWidth:38,fontSize:11,color:'var(--text3)',fontWeight:600,paddingTop:2}}>{e.time}</div>
                  <div className="cal-bar" style={{background:e.color}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.title}</div>
                    <div style={{fontSize:11,color:'var(--text3)'}}>{e.detail}</div>
                  </div>
                  <button className="xbtn" onClick={async ev=>{
    ev.stopPropagation();
    if(session?.accessToken&&e.googleId){
      await fetch('/api/calendar',{method:'DELETE',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.accessToken},body:JSON.stringify({googleId:e.googleId})});
    }
    setCalEvents(x=>x.filter(i=>i.id!==e.id));
  }}>✕</button>
                </div>
              ))}
            </div>

            {/* RIGHT COLUMN */}
            <div className="col3">
              {/* GOALS */}
              <div className="card">
                <div className="row">
                  <div className="clabel"><div className="ldot" style={{background:'#2dd4a0'}}/>Goal tracker</div>
                  <button className="add-btn" onClick={()=>openModal('goal')}>+ Add</button>
                </div>
                {goals.map(g=>{
                  const pct=Math.min(100,Math.round((g.current/g.target)*100));
                  return(
                    <div className="goal-item" key={g.id}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{g.name}</div>
                        <div style={{fontSize:12,color:'var(--text2)'}}><strong style={{color:'var(--text)'}}>{g.current}</strong>/{g.target} {g.unit}</div>
                      </div>
                      <div className="track"><div className="fill" style={{width:`${pct}%`,background:g.color}}/></div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text3)'}}>
                        <span>{pct}% complete</span><span style={{color:statusColor(g.status)}}>{g.status}</span>
                      </div>
                      <div className="g-actions">
                        <button className="g-btn inc" onClick={()=>incrementGoal(g.id)}>+ Log</button>
                        <button className="g-btn" onClick={()=>openModal('goal',g.id)}>Edit</button>
                        <button className="g-btn del" onClick={()=>setGoals(p=>p.filter(x=>x.id!==g.id))}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* COUNTDOWNS */}
              <div className="card">
                <div className="row">
                  <div className="clabel"><div className="ldot" style={{background:'#f5a623'}}/>Countdowns</div>
                  <button className="add-btn" onClick={()=>openModal('cd')}>+ Add</button>
                </div>
                <div className="cd-grid">
                  {countdowns.map(c=>(
                    <div className="cdown" key={c.id}>
                      <button className="cdown-x" onClick={()=>setCountdowns(p=>p.filter(x=>x.id!==c.id))}>✕</button>
                      <div style={{fontSize:26,fontWeight:700,lineHeight:1,marginBottom:2,color:c.color}}>{c.days}</div>
                      <div style={{fontSize:9,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>days</div>
                      <div style={{fontSize:11,color:'var(--text2)',fontWeight:500}}>{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HABITS */}
              <div className="card">
                <div className="row">
                  <div className="clabel"><div className="ldot" style={{background:'#4fd89a'}}/>Habit streaks</div>
                  <button className="add-btn" onClick={()=>openModal('habit')}>+ Add</button>
                </div>
                <div style={{display:'flex',justifyContent:'flex-end',gap:3,marginBottom:6,paddingRight:26}}>
                  {DAYS_SHORT.map((d,i)=><div key={i} style={{width:18,textAlign:'center',fontSize:9,color:'var(--text3)',fontWeight:600}}>{d}</div>)}
                </div>
                {habits.map(h=>(
                  <div className="h-row" key={h.id}>
                    <div style={{fontSize:12,color:'var(--text2)',flex:1}}>{h.name}</div>
                    <div style={{display:'flex',gap:3}}>
                      {h.done.map((d,i)=>(
                        <div key={i} className={`hdot${d===1?' on':''}`} onClick={()=>toggleHabit(h.id,i)}>{d===1?'✓':''}</div>
                      ))}
                    </div>
                    <button className="h-del" onClick={()=>setHabits(p=>p.filter(x=>x.id!==h.id))}>✕</button>
                  </div>
                ))}
                <hr className="divider"/>
                <div className="clabel" style={{marginBottom:10}}><div className="ldot" style={{background:'#a594ff'}}/>Quick actions</div>
                <div className="qa-grid">
                  <div className="qa-btn" onClick={()=>openModal('goal')}><div className="qa-icon" style={{background:'#7c6af720'}}>✦</div>Add goal</div>
                  <div className="qa-btn" onClick={()=>openModal('habit')}><div className="qa-icon" style={{background:'#2dd4a020'}}>+</div>Add habit</div>
                  <div className="qa-btn" onClick={()=>openModal('cal')}><div className="qa-icon" style={{background:'#f5a62320'}}>📅</div>Add event</div>
                  <div className="qa-btn" onClick={()=>openModal('cd')}><div className="qa-icon" style={{background:'#f0647020'}}>⏱</div>Countdown</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CalendarEvents />
      {/* MODALS */}
      {modal==='goal'&&(<div className="overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal()}}><div className="modal"><div className="modal-title">{editId?'Edit goal':'New goal'}</div><div className="field"><label>Goal name</label><input placeholder="e.g. Go to the gym" value={gf.name} onChange={e=>setGf(p=>({...p,name:e.target.value}))}/></div><div className="mrow"><div className="field"><label>Current</label><input type="number" min="0" value={gf.current} onChange={e=>setGf(p=>({...p,current:e.target.value}))}/></div><div className="field"><label>Target</label><input type="number" min="1" value={gf.target} onChange={e=>setGf(p=>({...p,target:e.target.value}))}/></div></div><div className="field"><label>Unit</label><input placeholder="this week" value={gf.unit} onChange={e=>setGf(p=>({...p,unit:e.target.value}))}/></div><div className="field"><label>Color</label><CP value={gf.color} onChange={c=>setGf(p=>({...p,color:c}))}/></div><div className="btn-row"><button className="btn-s" onClick={closeModal}>Cancel</button><button className="btn-p" onClick={saveGoal}>{editId?'Save':'Add goal'}</button></div></div></div>)}
      {modal==='cd'&&(<div className="overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal()}}><div className="modal"><div className="modal-title">New countdown</div><div className="field"><label>Label</label><input placeholder="e.g. ✈ Flight to Paris" value={cf.label} onChange={e=>setCf(p=>({...p,label:e.target.value}))}/></div><div className="field"><label>Days remaining</label><input type="number" min="0" value={cf.days} onChange={e=>setCf(p=>({...p,days:e.target.value}))}/></div><div className="field"><label>Color</label><CP value={cf.color} onChange={c=>setCf(p=>({...p,color:c}))}/></div><div className="btn-row"><button className="btn-s" onClick={closeModal}>Cancel</button><button className="btn-p" onClick={saveCd}>Add countdown</button></div></div></div>)}
      {modal==='priority'&&(<div className="overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal()}}><div className="modal"><div className="modal-title">{editId?'Edit priority':'New priority'}</div><div className="field"><label>Title</label><input placeholder="e.g. Finish the proposal" value={pf.title} onChange={e=>setPf(p=>({...p,title:e.target.value}))}/></div><div className="field"><label>Details</label><input placeholder="e.g. Due Friday · 40% done" value={pf.meta} onChange={e=>setPf(p=>({...p,meta:e.target.value}))}/></div><div className="field"><label>Tag</label><input placeholder="e.g. Urgent / Health / Work" value={pf.tag} onChange={e=>setPf(p=>({...p,tag:e.target.value}))}/></div><div className="field"><label>Color</label><CP value={pf.color} onChange={c=>setPf(p=>({...p,color:c}))}/></div><div className="btn-row"><button className="btn-s" onClick={closeModal}>Cancel</button><button className="btn-p" onClick={savePriority}>{editId?'Save':'Add'}</button></div></div></div>)}
      {modal==='cal'&&(<div className="overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal()}}><div className="modal"><div className="modal-title">{editId?'Edit event':'New event'}</div><div className="mrow"><div className="field"><label>Time</label><input placeholder="09:00" value={ef.time} onChange={e=>setEf(p=>({...p,time:e.target.value}))}/></div><div className="field" style={{flex:2}}><label>Title</label><input placeholder="e.g. Team standup" value={ef.title} onChange={e=>setEf(p=>({...p,title:e.target.value}))}/></div></div><div className="field"><label>Details</label><input placeholder="e.g. Zoom · 30 min" value={ef.detail} onChange={e=>setEf(p=>({...p,detail:e.target.value}))}/></div><div className="field"><label>Color</label><CP value={ef.color} onChange={c=>setEf(p=>({...p,color:c}))}/></div><div className="btn-row"><button className="btn-s" onClick={closeModal}>Cancel</button><button className="btn-p" onClick={saveCalEvent}>{editId?'Save':'Add'}</button></div></div></div>)}
      {modal==='habit'&&(<div className="overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal()}}><div className="modal"><div className="modal-title">New habit</div><div className="field"><label>Habit name</label><input placeholder="e.g. Cold shower" value={hName} onChange={e=>setHName(e.target.value)}/></div><p style={{fontSize:12,color:'var(--text3)',marginTop:-8,marginBottom:8}}>Click any day dot on the dashboard to toggle it.</p><div className="btn-row"><button className="btn-s" onClick={closeModal}>Cancel</button><button className="btn-p" onClick={saveHabit}>Add habit</button></div></div></div>)}
    </>
  );
}
