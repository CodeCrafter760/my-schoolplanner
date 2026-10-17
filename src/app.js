// Simple Auto-plan My Day prototype
// Data stored in localStorage under keys: bp_tasks, bp_availability

const qs = s => document.querySelector(s);

function loadTasks(){
  const raw = localStorage.getItem('bp_tasks');
  return raw ? JSON.parse(raw) : [];
}
function saveTasks(tasks){
  localStorage.setItem('bp_tasks', JSON.stringify(tasks));
}
function loadAvailability(){
  const raw = localStorage.getItem('bp_availability');
  if(!raw) return {start:'17:00', end:'21:00', block:30};
  return JSON.parse(raw);
}
function saveAvailability(av){
  localStorage.setItem('bp_availability', JSON.stringify(av));
}

function renderTasks(){
  const list = qs('#tasks-list');
  const tasks = loadTasks();
  if(tasks.length===0){ list.innerHTML='<p class="small">No assignments yet.</p>'; return; }
  list.innerHTML='';
  tasks.forEach((t,idx)=>{
    const el = document.createElement('div'); el.className='task-item';
    el.innerHTML = `<div>
      <strong>${escapeHtml(t.title)}</strong>
      <div class="small">Due: ${t.due} • Effort: ${t.effort} min • Priority: ${prioLabel(t.priority)}</div>
    </div>
    <div><button data-idx="${idx}" class="remove">Delete</button></div>`;
    list.appendChild(el);
  });
  list.querySelectorAll('.remove').forEach(btn=>btn.addEventListener('click',e=>{
    const i = Number(e.target.dataset.idx);
    const tasks = loadTasks(); tasks.splice(i,1); saveTasks(tasks); renderTasks();
  }));
}

function prioLabel(v){ return v==3? 'High' : v==2? 'Medium' : 'Low'; }

function planDay(dateStr){
  const tasks = loadTasks().filter(t=>t.effort>0);
  if(tasks.length===0) return [];
  // parse availability
  const avail = loadAvailability();
  const [sh, sm] = avail.start.split(':').map(Number);
  const [eh, em] = avail.end.split(':').map(Number);
  const block = Number(avail.block);
  // build time slots for the date
  const slots = [];
  const start = new Date(dateStr + 'T' + pad(sh)+':'+pad(sm)+':00');
  const end = new Date(dateStr + 'T' + pad(eh)+':'+pad(em)+':00');
  for(let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + block)){
    const s = new Date(t);
    const e = new Date(t); e.setMinutes(e.getMinutes() + block);
    if(e > end) break;
    slots.push({start:new Date(s), end:new Date(e), taken:false});
  }

  // sort tasks: earlier due first, then higher priority
  tasks.sort((a,b)=>{
    const da = new Date(a.due); const db = new Date(b.due);
    if(da - db !== 0) return da - db;
    return b.priority - a.priority;
  });

  // allocate blocks greedily
  const schedule = [];
  let slotIdx = 0;
  for(const task of tasks){
    let remaining = task.effort;
    while(remaining > 0 && slotIdx < slots.length){
      if(!slots[slotIdx].taken){
        // allocate this slot to the task
        schedule.push({title:task.title, start: new Date(slots[slotIdx].start), end: new Date(slots[slotIdx].end) });
        slots[slotIdx].taken = true;
        remaining -= block;
      }
      slotIdx++;
    }
  }

  return schedule;
}

function renderPlan(schedule){
  const out = qs('#plan-result');
  if(schedule.length===0){ out.innerHTML='<p class="small">No plan — either no tasks or no availability/time left.</p>'; return; }
  out.innerHTML='';
  schedule.forEach(s=>{
    const el = document.createElement('div'); el.className='task-item';
    el.innerHTML = `<div><strong>${escapeHtml(s.title)}</strong>
      <div class="small">${formatTime(s.start)} — ${formatTime(s.end)}</div></div>`;
    out.appendChild(el);
  });
}

// Helpers
function pad(n){return n.toString().padStart(2,'0');}
function formatTime(d){ return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Wire up forms
qs('#task-form').addEventListener('submit', e=>{
  e.preventDefault();
  const title = qs('#task-title').value.trim();
  const due = qs('#task-due').value;
  const effort = Number(qs('#task-effort').value);
  const priority = Number(qs('#task-priority').value);
  if(!title || !due || !effort) return alert('Please fill all fields.');
  const tasks = loadTasks();
  tasks.push({title,due,effort,priority});
  saveTasks(tasks); renderTasks();
  qs('#task-form').reset();
});

qs('#availability-form').addEventListener('submit', e=>{
  e.preventDefault();
  const start = qs('#avail-start').value;
  const end = qs('#avail-end').value;
  const block = Number(qs('#block-length').value);
  if(start >= end) return alert('Start time must be before end time.');
  saveAvailability({start,end,block});
  alert('Availability saved.');
});

qs('#plan-button').addEventListener('click', ()=>{
  const dateInput = qs('#plan-date').value || (new Date()).toISOString().slice(0,10);
  const schedule = planDay(dateInput);
  renderPlan(schedule);
});

// initial render
(function init(){
  // set default plan date to today
  qs('#plan-date').value = (new Date()).toISOString().slice(0,10);
  const avail = loadAvailability();
  qs('#avail-start').value = avail.start;
  qs('#avail-end').value = avail.end;
  qs('#block-length').value = avail.block;
  renderTasks();
})();

