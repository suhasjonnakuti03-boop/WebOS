let zTop = 100;

// ── Stars ──────────────────────────────────────────────
const starsEl = document.getElementById('stars');
for (let i = 0; i < 120; i++) {
  const s = document.createElement('div');
  s.className = 'star';
  const size = Math.random() * 2.5 + 0.5;
  s.style.cssText = 'width:'+size+'px;height:'+size+'px;top:'+Math.random()*100+'%;left:'+Math.random()*100+'%;--d:'+(2+Math.random()*4)+'s;--op:'+(0.3+Math.random()*0.7)+';animation-delay:'+Math.random()*4+'s';
  starsEl.appendChild(s);
}

// ── Window open/close/minimize ──────────────────────────
function closeWin(id) {
  var el = document.getElementById(id);
  if (el) { el.style.display = 'none'; delete el.dataset.minimized; }
  updateDock();
}

function minWin(id) {
  var el = document.getElementById(id);
  if (el) { el.style.display = 'none'; el.dataset.minimized = 'true'; }
  updateDock();
}

function openApp(name) {
  var ids = {
    welcome: 'win-welcome',
    notepad: 'win-notepad',
    calc:    'win-calc',
    clock:   'win-clock',
    todo:    'win-todo',
    weather: 'win-weather',
    colors:  'win-colors'
  };
  var id = ids[name];
  if (!id) { console.log('No id for', name); return; }
  var el = document.getElementById(id);
  if (!el) { console.log('No element', id); return; }
  el.style.display = 'block';
  delete el.dataset.minimized;
  el.style.zIndex = ++zTop;
  hideCtx();
  updateDock();
  if (name === 'clock') { setTimeout(drawClock, 50); }
  if (name === 'colors') { setTimeout(setupColor, 50); }
  if (name === 'weather') { fetchWeather(); }
}

// ── Dock ───────────────────────────────────────────────
function updateDock() {
  var dock = document.getElementById('dock');
  if (!dock) return;
  dock.innerHTML = '';
  var wins = document.querySelectorAll('.win');
  wins.forEach(function(w) {
    if (w.dataset.minimized === 'true') {
      var barSpan = w.querySelector('.win-bar span');
      var label = barSpan ? barSpan.textContent : w.id;
      var item = document.createElement('div');
      item.className = 'dock-item';
      item.textContent = label;
      item.onclick = function() {
        w.style.display = 'block';
        delete w.dataset.minimized;
        w.style.zIndex = ++zTop;
        updateDock();
      };
      dock.appendChild(item);
    }
  });
}

// ── Dragging ───────────────────────────────────────────
document.querySelectorAll('.win').forEach(function(win) {
  var bar = win.querySelector('.win-bar');
  if (!bar) return;
  var dragging = false, ox = 0, oy = 0;

  bar.addEventListener('mousedown', function(e) {
    if (e.target.classList.contains('wbtn')) return;
    dragging = true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
    win.style.zIndex = ++zTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    var nx = Math.max(0, Math.min(e.clientX - ox, window.innerWidth - win.offsetWidth));
    var ny = Math.max(46, Math.min(e.clientY - oy, window.innerHeight - 40));
    win.style.left = nx + 'px';
    win.style.top = ny + 'px';
  });

  document.addEventListener('mouseup', function() { dragging = false; });
  win.addEventListener('mousedown', function() { win.style.zIndex = ++zTop; });
});

// ── Clock ──────────────────────────────────────────────
var startTime = Date.now();

function updateClock() {
  var now = new Date();
  var t = now.toLocaleTimeString();
  var d = now.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
  var tb = document.getElementById('tb-clock'); if (tb) tb.textContent = t;
  var dt = document.getElementById('dig-time'); if (dt) dt.textContent = t;
  var dd = document.getElementById('dig-date'); if (dd) dd.textContent = d;
  var up = document.getElementById('uptime-display');
  if (up) up.textContent = 'up ' + Math.floor((Date.now()-startTime)/1000) + 's - all systems go';
  var cw = document.getElementById('win-clock');
  if (cw && cw.style.display !== 'none') drawClock();
}
setInterval(updateClock, 1000);
updateClock();

function drawClock() {
  var canvas = document.getElementById('clock-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var cx=100, cy=100, r=90;
  var now = new Date();
  ctx.clearRect(0,0,200,200);
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
  for (var i=0;i<12;i++){
    var a=(i/12)*Math.PI*2-Math.PI/2, big=i%3===0;
    ctx.strokeStyle=big?'#00ff88':'rgba(255,255,255,0.2)'; ctx.lineWidth=big?2:1;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a)*(r-(big?14:8)), cy+Math.sin(a)*(r-(big?14:8)));
    ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r); ctx.stroke();
  }
  var h=now.getHours()%12, m=now.getMinutes(), s=now.getSeconds();
  [{angle:(h/12+m/720)*Math.PI*2-Math.PI/2,len:55,w:3,color:'#fff'},
   {angle:(m/60)*Math.PI*2-Math.PI/2,len:72,w:2,color:'#ddd'},
   {angle:(s/60)*Math.PI*2-Math.PI/2,len:80,w:1,color:'#00ff88'}
  ].forEach(function(hand){
    ctx.strokeStyle=hand.color; ctx.lineWidth=hand.w; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx+Math.cos(hand.angle)*hand.len, cy+Math.sin(hand.angle)*hand.len); ctx.stroke();
  });
  ctx.fillStyle='#00ff88'; ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2); ctx.fill();
}

// ── Calculator ─────────────────────────────────────────
var calcExpr = '';
function calcIn(v) {
  calcExpr += v;
  document.getElementById('calc-disp').textContent = calcExpr;
  document.getElementById('calc-expr').textContent = '';
}
function calcEq() {
  try {
    var res = eval(calcExpr);
    var rounded = parseFloat(res.toFixed(10));
    document.getElementById('calc-expr').textContent = calcExpr + ' =';
    document.getElementById('calc-disp').textContent = rounded;
    calcExpr = String(rounded);
  } catch(e) {
    document.getElementById('calc-disp').textContent = 'Error';
    calcExpr = '';
  }
}
function calcClear() {
  calcExpr = '';
  document.getElementById('calc-disp').textContent = '0';
  document.getElementById('calc-expr').textContent = '';
}

// ── To-Do ──────────────────────────────────────────────
function addTodo() {
  var input = document.getElementById('todo-in');
  var text = input.value.trim();
  if (!text) return;
  var li = document.createElement('li');
  var cb = document.createElement('input'); cb.type = 'checkbox';
  cb.onchange = function() { li.classList.toggle('done', cb.checked); updateStats(); };
  var sp = document.createElement('span'); sp.textContent = text;
  var del = document.createElement('button'); del.className = 'del'; del.textContent = 'x';
  del.onclick = function() { li.remove(); updateStats(); };
  li.appendChild(cb); li.appendChild(sp); li.appendChild(del);
  document.getElementById('todo-list').appendChild(li);
  input.value = ''; updateStats();
}
var todoInput = document.getElementById('todo-in');
if (todoInput) todoInput.addEventListener('keydown', function(e){ if(e.key==='Enter') addTodo(); });
function updateStats() {
  var all = document.querySelectorAll('#todo-list li').length;
  var done = document.querySelectorAll('#todo-list li.done').length;
  var el = document.getElementById('todo-stats');
  if (el) el.textContent = done + '/' + all + ' complete';
}

// ── Real Weather ───────────────────────────────────────
function fetchWeather() {
  var iconEl = document.getElementById('weather-icon');
  var tempEl = document.getElementById('weather-temp');
  var descEl = document.getElementById('weather-desc');
  var humEl  = document.getElementById('weather-hum');
  var windEl = document.getElementById('weather-wind');

  if (iconEl) iconEl.textContent = '...';
  if (tempEl) tempEl.textContent = 'Loading';
  if (descEl) descEl.textContent = 'Getting your location...';

  if (!navigator.geolocation) {
    if (descEl) descEl.textContent = 'Geolocation not supported';
    return;
  }

  navigator.geolocation.getCurrentPosition(function(pos) {
    var lat = pos.coords.latitude.toFixed(4);
    var lon = pos.coords.longitude.toFixed(4);
    var url = 'https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'¤t_weather=true&hourly=relativehumidity_2m,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph';

    fetch(url)
      .then(function(r){ return r.json(); })
      .then(function(data) {
        var cw = data.current_weather;
        var temp = Math.round(cw.temperature);
        var wind = Math.round(cw.windspeed);
        var code = cw.weathercode;
        var hum  = data.hourly.relativehumidity_2m[0];

        var icon = '🌤', desc = 'Partly Cloudy';
        if (code === 0)                      { icon='☀️';  desc='Clear Sky'; }
        else if (code <= 2)                  { icon='⛅';  desc='Partly Cloudy'; }
        else if (code === 3)                 { icon='☁️';  desc='Overcast'; }
        else if (code <= 49)                 { icon='🌫️'; desc='Foggy'; }
        else if (code <= 59)                 { icon='🌦️'; desc='Drizzle'; }
        else if (code <= 69)                 { icon='🌧️'; desc='Rain'; }
        else if (code <= 79)                 { icon='❄️';  desc='Snow'; }
        else if (code <= 82)                 { icon='🌧️'; desc='Rain Showers'; }
        else if (code <= 86)                 { icon='🌨️'; desc='Snow Showers'; }
        else                                  { icon='⛈️';  desc='Thunderstorm'; }

        if (iconEl) iconEl.textContent = icon;
        if (tempEl) tempEl.textContent = temp + '°F';
        if (descEl) descEl.textContent = desc;
        if (humEl)  humEl.textContent  = 'Humidity ' + hum + '%';
        if (windEl) windEl.textContent = 'Wind ' + wind + ' mph';
      })
      .catch(function() {
        if (descEl) descEl.textContent = 'Could not load weather';
      });
  }, function() {
    if (descEl) descEl.textContent = 'Location denied - allow location to see weather';
  });
}

function refreshWeather() { fetchWeather(); }

// ── Color Picker ───────────────────────────────────────
var colorSetup = false;
function setupColor() {
  if (colorSetup) return; colorSetup = true;
  var pick = document.getElementById('color-pick');
  if (!pick) return;
  function updateColor() {
    var hex = pick.value;
    var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    var valsEl = document.getElementById('color-vals');
    var prevEl = document.getElementById('color-preview');
    if (valsEl) valsEl.innerHTML = 'HEX: '+hex.toUpperCase()+'RGB: rgb('+r+','+g+','+b+')HSL: '+hexToHSL(hex);
    if (prevEl) prevEl.style.background = hex;
  }
  pick.addEventListener('input', updateColor);
  updateColor();
}

function applyBg() {
  var pick = document.getElementById('color-pick');
  if (pick) document.getElementById('desktop').style.background = pick.value;
}

function hexToHSL(hex) {
  var r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255;
  var max=Math.max(r,g,b), min=Math.min(r,g,b), h=0, s=0, l=(max+min)/2;
  if (max!==min) {
    var d=max-min; s=l>0.5?d/(2-max-min):d/(max+min);
    if(max===r) h=((g-b)/d+(g
