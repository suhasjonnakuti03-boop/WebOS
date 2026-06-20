const starsEl = document.getElementById('stars');
for (let i = 0; i < 120; i++) {
  const s = document.createElement('div');
  s.className = 'star';
  const size = Math.random() * 2.5 + 0.5;
  s.style.cssText = `width:${size}px;height:${size}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--d:${2+Math.random()*4}s;--op:${0.3+Math.random()*0.7};animation-delay:${Math.random()*4}s`;
  starsEl.appendChild(s);
}

document.querySelectorAll('.win').forEach(win => {
  const bar = win.querySelector('.win-bar');
  let dragging = false, ox, oy;
  bar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('wbtn')) return;
    dragging = true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
    win.style.zIndex = ++zTop;
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    let nx = e.clientX - ox, ny = e.clientY - oy;
    nx = Math.max(0, Math.min(nx, window.innerWidth - win.offsetWidth));
    ny = Math.max(44, Math.min(ny, window.innerHeight - win.offsetHeight));
    win.style.left = nx + 'px';
    win.style.top = ny + 'px';
  });
  document.addEventListener('mouseup', () => dragging = false);
  win.addEventListener('mousedown', () => win.style.zIndex = ++zTop);
});

let zTop = 100;

function closeWin(id) { document.getElementById(id).style.display = 'none'; updateDock(); }
function minWin(id) { document.getElementById(id).classList.add('minimized'); updateDock(); }

function openApp(name) {
  const map = { notepad:'win-notepad', calc:'win-calc', clock:'win-clock', todo:'win-todo', weather:'win-weather', colors:'win-colors' };
  const el = document.getElementById(map[name]);
  if (!el) return;
  el.style.display = 'block';
  el.classList.remove('minimized');
  el.style.zIndex = ++zTop;
  hideCtx();
  updateDock();
  if (name === 'clock') drawClock();
  if (name === 'colors') updateColor();
}

function updateDock() {
  const dock = document.getElementById('dock');
  const mins = document.querySelectorAll('.win.minimized');
  dock.innerHTML = mins.length === 0 ? '' : '';
  mins.forEach(w => {
    const label = w.querySelector('.win-bar span').textContent;
    const id = w.id;
    const item = document.createElement('div');
    item.className = 'dock-item';
    item.textContent = label;
    item.onclick = () => { w.classList.remove('minimized'); w.style.display = 'block'; w.style.zIndex = ++zTop; updateDock(); };
    dock.appendChild(item);
  });
}

const startTime = Date.now();
function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString();
  const d = now.toLocaleDateString(undefined, {weekday:'short',month:'short',day:'numeric'});
  const el = document.getElementById('tb-clock');
  if (el) el.textContent = t;
  const dt = document.getElementById('dig-time');
  if (dt) dt.textContent = t;
  const dd = document.getElementById('dig-date');
  if (dd) dd.textContent = d;
  const up = document.getElementById('uptime-display');
  if (up) {
    const sec = Math.floor((Date.now() - startTime) / 1000);
    up.textContent = `up ${sec}s — all systems go`;
  }
  const clockWin = document.getElementById('win-clock');
  if (clockWin && clockWin.style.display !== 'none') drawClock();
}
setInterval(updateClock, 1000);
updateClock();

function drawClock() {
  const canvas = document.getElementById('clock-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 100, cy = 100, r = 90;
  const now = new Date();
  ctx.clearRect(0, 0, 200, 200);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const big = i % 3 === 0;
    ctx.strokeStyle = big ? '#00ff88' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = big ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - (big ? 14 : 8)), cy + Math.sin(a) * (r - (big ? 14 : 8)));
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
  const hands = [
    { angle: (h / 12 + m / 720) * Math.PI * 2 - Math.PI / 2, len: 55, w: 3, color: '#fff' },
    { angle: (m / 60) * Math.PI * 2 - Math.PI / 2, len: 72, w: 2, color: '#ddd' },
    { angle: (s / 60) * Math.PI * 2 - Math.PI / 2, len: 80, w: 1, color: '#00ff88' }
  ];
  hands.forEach(hand => {
    ctx.strokeStyle = hand.color;
    ctx.lineWidth = hand.w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(hand.angle) * hand.len, cy + Math.sin(hand.angle) * hand.len);
    ctx.stroke();
  });
  ctx.fillStyle = '#00ff88';
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
}

let calcExpr = '';
function calcIn(v) {
  calcExpr += v;
  document.getElementById('calc-disp').textContent = calcExpr;
  document.getElementById('calc-expr').textContent = '';
}
function calcEq() {
  try {
    const res = eval(calcExpr);
    document.getElementById('calc-expr').textContent = calcExpr + ' =';
    document.getElementById('calc-disp').textContent = parseFloat(res.toFixed(10));
    calcExpr = String(res);
  } catch { document.getElementById('calc-disp').textContent = 'Error'; calcExpr = ''; }
}
function calcClear() {
  calcExpr = '';
  document.getElementById('calc-disp').textContent = '0';
  document.getElementById('calc-expr').textContent = '';
}

function addTodo() {
  const input = document.getElementById('todo-in');
  const text = input.value.trim();
  if (!text) return;
  const li = document.createElement('li');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.onchange = () => { li.classList.toggle('done', cb.checked); updateStats(); };
  const sp = document.createElement('span');
  sp.textContent = text;
  const del = document.createElement('button');
  del.className = 'del'; del.textContent = '×';
  del.onclick = () => { li.remove(); updateStats(); };
  li.append(cb, sp, del);
  document.getElementById('todo-list').appendChild(li);
  input.value = '';
  updateStats();
}
document.getElementById('todo-in').addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

function updateStats() {
  const all = document.querySelectorAll('#todo-list li').length;
  const done = document.querySelectorAll('#todo-list li.done').length;
  document.getElementById('todo-stats').textContent = `${done}/${all} complete`;
}

const weathers = [
  { icon:'☀️', temp:'82°F', desc:'Sunny' },
  { icon:'🌤', temp:'72°F', desc:'Partly Cloudy' },
  { icon:'🌧', temp:'61°F', desc:'Rainy' },
  { icon:'⛅', temp:'68°F', desc:'Cloudy' },
  { icon:'🌩', temp:'65°F', desc:'Thunderstorm' },
];
function refreshWeather() {
  const w = weathers[Math.floor(Math.random() * weathers.length)];
  document.getElementById('weather-icon').textContent = w.icon;
  document.getElementById('weather-temp').textContent = w.temp;
  document.getElementById('weather-desc').textContent = w.desc;
}

function updateColor() {
  const pick = document.getElementById('color-pick');
  if (!pick) return;
  pick.addEventListener('input', () => {
    const hex = pick.value;
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    document.getElementById('color-vals').innerHTML =
      `HEX: ${hex.toUpperCase()}RGB: rgb(${r}, ${g}, ${b})HSL: ${hexToHSL(hex)}`;
    document.getElementById('color-preview').style.background = hex;
  });
}
function hexToHSL(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){ case r: h=((g-b)/d+(g {
  e.preventDefault();
  ctxMenu.style.display = 'block';
  ctxMenu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
  ctxMenu.style.top = Math.min(e.clientY, window.innerHeight - 250) + 'px';
});
document.addEventListener('click', hideCtx);
function hideCtx() { ctxMenu.style.display = 'none'; }

function formatText(cmd) { document.execCommand(cmd, false, null); }
function clearNote() { document.getElementById('notepad-area').innerHTML = ''; }
function copyNote() {
  const text = document.getElementById('notepad-area').innerText;
  navigator.clipboard.writeText(text);
}

navigator.getBattery && navigator.getBattery().then(b => {
  const el = document.getElementById('battery');
  const update = () => { if (el) el.textContent = `🔋 ${Math.round(b.level*100)}%`; };
  update();
  b.addEventListener('levelchange', update);
});
