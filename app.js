/* ══════════════════════════════════════════
     APP REGISTRY
  ══════════════════════════════════════════ */
  const APPS = [
    { id: 'welcome',    name: 'Welcome',    ic: 'ti-sparkles',   gr: 'linear-gradient(135deg,#9333ea,#e11d9c)', w: 520, h: 360 },
    { id: 'calculator', name: 'Calculator', ic: 'ti-calculator',  gr: 'linear-gradient(135deg,#0077ff,#00c2ff)', w: 268, h: 400 },
    { id: 'notes',      name: 'Notes',      ic: 'ti-notebook',    gr: 'linear-gradient(135deg,#f59e0b,#fbbf24)', w: 420, h: 340 },
    { id: 'terminal',   name: 'Terminal',   ic: 'ti-terminal-2',  gr: 'linear-gradient(135deg,#059669,#34d399)', w: 500, h: 320 },
    { id: 'files',      name: 'Files',      ic: 'ti-folder',      gr: 'linear-gradient(135deg,#e11d48,#f97316)', w: 460, h: 360 },
    { id: 'settings',   name: 'Settings',   ic: 'ti-settings',    gr: 'linear-gradient(135deg,#0ea5e9,#6366f1)', w: 400, h: 390 },
  ];

  /* ══════════════════════════════════════════
     STATE
  ══════════════════════════════════════════ */
  let wins   = {};   // { wid: { id, el, aid, min, max, sv } }
  let zz     = 100;
  let activeWin = null;
  let drag   = null;

  /* ══════════════════════════════════════════
     INIT
  ══════════════════════════════════════════ */
  function init() {
    renderDesktopIcons();
    renderSMGrid(APPS);
    tickClock();
    setInterval(tickClock, 1000);
    setTimeout(() => openApp('welcome'), 200);

    // Close start menu on desktop click
    document.getElementById('osbg').addEventListener('mousedown', e => {
      if (!e.target.closest('#smenu') && !e.target.closest('#sm-btn')) closeSM();
    });

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', () => { drag = null; });
  }

  /* ══════════════════════════════════════════
     CLOCK
  ══════════════════════════════════════════ */
  function tickClock() {
    const now  = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('tbar-clock').textContent = time;
    document.getElementById('big-time').textContent   = time;
    document.getElementById('big-date').textContent   = date;
  }

  /* ══════════════════════════════════════════
     NOTIFICATIONS
  ══════════════════════════════════════════ */
  let notifTimer;
  function notify(msg) {
    document.getElementById('notif-msg').textContent = msg;
    document.getElementById('notif').style.display   = 'block';
    clearTimeout(notifTimer);
    notifTimer = setTimeout(() => document.getElementById('notif').style.display = 'none', 3200);
  }

  /* ══════════════════════════════════════════
     DESKTOP ICONS
  ══════════════════════════════════════════ */
  function renderDesktopIcons() {
    document.getElementById('desktop-icons').innerHTML = APPS.map(a => `
      <div class="dki" ondblclick="openApp('${a.id}')">
        <div class="dki-icon" style="background:${a.gr};">
          <i class="ti ${a.ic}" style="font-size:21px;color:white;" aria-hidden="true"></i>
        </div>
        <span class="dki-label">${a.name}</span>
      </div>
    `).join('');
  }

  /* ══════════════════════════════════════════
     START MENU
  ══════════════════════════════════════════ */
  function renderSMGrid(list) {
    document.getElementById('sm-grid').innerHTML = list.map(a => `
      <div class="sm-app-btn" onclick="openApp('${a.id}');closeSM();">
        <div class="sm-app-icon" style="background:${a.gr};">
          <i class="ti ${a.ic}" style="font-size:19px;color:white;" aria-hidden="true"></i>
        </div>
        <span class="sm-app-label">${a.name}</span>
      </div>
    `).join('');
  }

  function filterSM(q) {
    renderSMGrid(APPS.filter(a => a.name.toLowerCase().includes(q.toLowerCase())));
  }

  function toggleSM() {
    const m  = document.getElementById('smenu');
    const op = m.style.display === 'block';
    m.style.display = op ? 'none' : 'block';
    if (!op) setTimeout(() => document.getElementById('sm-search').focus(), 50);
  }

  function closeSM() {
    document.getElementById('smenu').style.display = 'none';
  }

  /* ══════════════════════════════════════════
     WINDOW MANAGEMENT
  ══════════════════════════════════════════ */
  function openApp(id) {
    const existing = Object.values(wins).find(w => w.aid === id);
    if (existing) {
      existing.min ? unminimize(existing.id) : focusWin(existing.id);
      return;
    }
    const app = APPS.find(a => a.id === id);
    if (!app) return;
    const wid = 'w' + Date.now();
    const x   = 60 + Math.random() * 200;
    const y   = 30 + Math.random() * 100;
    spawnWindow(wid, app, x, y);
  }

  function spawnWindow(wid, app, x, y) {
    const el = document.createElement('div');
    el.id        = wid;
    el.className = 'win foc';
    el.style.cssText = `width:${app.w}px;height:${app.h}px;left:${Math.round(x)}px;top:${Math.round(y)}px;z-index:${++zz};`;

    el.innerHTML = `
      <div class="wtb" onmousedown="startDrag(event,'${wid}')">
        <div class="wbtns">
          <button class="wb wbc" onclick="closeWin('${wid}')"    title="Close"></button>
          <button class="wb wbm" onclick="minimizeWin('${wid}')" title="Minimize"></button>
          <button class="wb wbx" onclick="maximizeWin('${wid}')" title="Maximize"></button>
        </div>
        <div class="wtb-info">
          <div class="wtb-app-icon" style="background:${app.gr};">
            <i class="ti ${app.ic}" style="font-size:10px;color:white;" aria-hidden="true"></i>
          </div>
          <span class="wtb-title">${app.name}</span>
        </div>
      </div>
      <div class="wc">${getAppContent(app.id)}</div>
      ${['e','w','s','n','se','sw','ne','nw'].map(d =>
        `<div class="rh ${d}" onmousedown="startResize(event,'${wid}','${d}')"></div>`
      ).join('')}
    `;

    el.addEventListener('mousedown', () => focusWin(wid));
    document.getElementById('wlayer').appendChild(el);
    wins[wid] = { id: wid, el, aid: app.id, min: false, max: false, sv: null };

    addTaskbarBtn(wid, app);
    focusWin(wid);
    setTimeout(() => postInit(app.id, wid), 90);
  }

  function focusWin(wid) {
    if (activeWin === wid) return;
    if (activeWin && wins[activeWin]) wins[activeWin].el.classList.remove('foc');
    activeWin = wid;
    const w = wins[wid]; if (!w) return;
    w.el.classList.add('foc');
    w.el.style.zIndex = ++zz;
    document.querySelectorAll('.tba').forEach(b => b.classList.remove('act'));
    const btn = document.getElementById('tba' + wid);
    if (btn) btn.classList.add('act');
  }

  function closeWin(wid) {
    const w = wins[wid]; if (!w) return;
    w.el.remove();
    const btn = document.getElementById('tba' + wid);
    if (btn) btn.remove();
    delete wins[wid];
    if (activeWin === wid) activeWin = null;
  }

  function minimizeWin(wid) {
    const w = wins[wid]; if (!w) return;
    w.min = true;
    w.el.style.display = 'none';
    const btn = document.getElementById('tba' + wid);
    if (btn) btn.classList.remove('act');
    if (activeWin === wid) activeWin = null;
  }

  function unminimize(wid) {
    const w = wins[wid]; if (!w) return;
    w.min = false;
    w.el.style.display = '';
    focusWin(wid);
  }

  function maximizeWin(wid) {
    const w   = wins[wid]; if (!w) return;
    const lyr = document.getElementById('wlayer');
    if (w.max) {
      const s = w.sv;
      w.el.style.left   = s.l + 'px';  w.el.style.top    = s.t + 'px';
      w.el.style.width  = s.w + 'px';  w.el.style.height = s.h + 'px';
      w.max = false;
    } else {
      w.sv = { l: parseInt(w.el.style.left) || 0, t: parseInt(w.el.style.top) || 0, w: w.el.offsetWidth, h: w.el.offsetHeight };
      w.el.style.left   = '0';
      w.el.style.top    = '0';
      w.el.style.width  = lyr.clientWidth  + 'px';
      w.el.style.height = lyr.clientHeight + 'px';
      w.max = true;
    }
  }

  /* ══════════════════════════════════════════
     TASKBAR BUTTONS
  ══════════════════════════════════════════ */
  function addTaskbarBtn(wid, app) {
    const c   = document.getElementById('tbar-apps');
    const btn = document.createElement('button');
    btn.className = 'tbb tba act';
    btn.id        = 'tba' + wid;
    btn.innerHTML = `
      <div class="tbb-icon" style="background:${app.gr};">
        <i class="ti ${app.ic}" style="font-size:9px;color:white;" aria-hidden="true"></i>
      </div>
      <span style="overflow:hidden;text-overflow:ellipsis;">${app.name}</span>
    `;
    btn.onclick = () => {
      const w = wins[wid]; if (!w) return;
      if (w.min)          unminimize(wid);
      else if (activeWin === wid) minimizeWin(wid);
      else                focusWin(wid);
    };
    c.appendChild(btn);
  }

  /* ══════════════════════════════════════════
     DRAG & RESIZE
  ══════════════════════════════════════════ */
  function startDrag(e, wid) {
    if (e.button !== 0 || e.target.closest('.wbtns')) return;
    e.preventDefault();
    const w = wins[wid]; if (!w || w.max) return;
    drag = {
      type: 'drag', wid,
      ox: e.clientX - parseInt(w.el.style.left || 0),
      oy: e.clientY - parseInt(w.el.style.top  || 0),
    };
  }

  function startResize(e, wid, dir) {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const w = wins[wid]; if (!w || w.max) return;
    drag = {
      type: 'resize', wid, dir,
      sx: e.clientX, sy: e.clientY,
      sw: w.el.offsetWidth,  sh: w.el.offsetHeight,
      sl: parseInt(w.el.style.left || 0),
      st: parseInt(w.el.style.top  || 0),
    };
  }

  function onMouseMove(e) {
    if (!drag) return;
    const w   = wins[drag.wid]; if (!w) { drag = null; return; }
    const lyr = document.getElementById('wlayer');
    const lw  = lyr.clientWidth, lh = lyr.clientHeight;

    if (drag.type === 'drag') {
      w.el.style.left = Math.max(0, Math.min(e.clientX - drag.ox, lw - w.el.offsetWidth))  + 'px';
      w.el.style.top  = Math.max(0, Math.min(e.clientY - drag.oy, lh - w.el.offsetHeight)) + 'px';
    } else {
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      const d  = drag.dir;
      let nw = drag.sw, nh = drag.sh, nl = drag.sl, nt = drag.st;
      const MIN_W = 220, MIN_H = 140;

      if (d.includes('e')) nw = Math.max(MIN_W, drag.sw + dx);
      if (d.includes('s')) nh = Math.max(MIN_H, drag.sh + dy);
      if (d.includes('w')) { nw = Math.max(MIN_W, drag.sw - dx); nl = drag.sl + (drag.sw - nw); }
      if (d.includes('n')) { nh = Math.max(MIN_H, drag.sh - dy); nt = drag.st + (drag.sh - nh); }

      w.el.style.width  = nw + 'px'; w.el.style.height = nh + 'px';
      w.el.style.left   = nl + 'px'; w.el.style.top    = nt + 'px';
    }
  }

  /* ══════════════════════════════════════════
     APP CONTENT ROUTER
  ══════════════════════════════════════════ */
  function getAppContent(id) {
    switch (id) {
      case 'welcome':    return buildWelcome();
      case 'calculator': return buildCalculator();
      case 'notes':      return buildNotes();
      case 'terminal':   return buildTerminal();
      case 'files':      return buildFiles();
      case 'settings':   return buildSettings();
      default:           return '<div style="padding:20px;color:rgba(255,255,255,.5)">App not found.</div>';
    }
  }

  function postInit(appId, wid) {
    if (appId === 'terminal') {
      const inp = document.querySelector('#' + wid + ' .term-input');
      if (inp) inp.focus();
    }
  }

  /* ══════════════════════════════════════════
     APP: WELCOME
  ══════════════════════════════════════════ */
  function buildWelcome() {
    const otherApps = APPS.filter(a => a.id !== 'welcome');
    return `
      <div class="welcome-wrap">
        <div class="welcome-header">
          <div class="welcome-header-icon">
            <i class="ti ti-sparkles" style="font-size:22px;color:white;" aria-hidden="true"></i>
          </div>
          <div>
            <div class="welcome-title">Welcome to LumiOS</div>
            <div class="welcome-sub">A luminous computing experience</div>
          </div>
        </div>
        <div class="welcome-tips">
          <strong>Tips:</strong> Drag windows by their title bar &middot;
          Resize from any edge or corner &middot;
          Double-click desktop icons to open apps &middot;
          Click taskbar buttons to minimize or restore
        </div>
        <div class="welcome-app-grid">
          ${otherApps.map(a => `
            <div class="welcome-app-card" onclick="openApp('${a.id}')">
              <div class="welcome-app-card-icon" style="background:${a.gr};">
                <i class="ti ${a.ic}" style="font-size:15px;color:white;" aria-hidden="true"></i>
              </div>
              <div>
                <div class="welcome-app-card-name">${a.name}</div>
                <div class="welcome-app-card-hint">Open app</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════
     APP: CALCULATOR
  ══════════════════════════════════════════ */
  const CALC_BTNS = [
    ['AC','fn'], ['±','fn'], ['%','fn'], ['÷','op'],
    ['7','num'], ['8','num'], ['9','num'], ['×','op'],
    ['4','num'], ['5','num'], ['6','num'], ['−','op'],
    ['1','num'], ['2','num'], ['3','num'], ['+','op'],
    ['0','num wide'], ['.','num'], ['=','eq'],
  ];

  let cVal = '0', cExpr = '', cOp = null, cFirst = null, cJustOp = false;

  function buildCalculator() {
    return `
      <div class="calc-wrap">
        <div class="calc-display">
          <div class="calc-expr" id="calc-expr"></div>
          <div class="calc-val"  id="calc-val">0</div>
        </div>
        <div class="calc-grid">
          ${CALC_BTNS.map(([l, t]) => `
            <button class="calc-btn ${t}" onclick="calcPress('${l}')">${l}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function calcPress(k) {
    const dv = document.getElementById('calc-val');
    const de = document.getElementById('calc-expr');
    if (!dv) return;

    if (k === 'AC') {
      cVal = '0'; cExpr = ''; cOp = null; cFirst = null; cJustOp = false;
    } else if (k === '±') {
      const n = -parseFloat(cVal); cVal = isNaN(n) ? '0' : String(n);
    } else if (k === '%') {
      cVal = String(parseFloat(cVal) / 100);
    } else if ('÷×−+'.includes(k)) {
      cFirst = parseFloat(cVal); cOp = k; cExpr = cVal + ' ' + k; cJustOp = true;
    } else if (k === '=') {
      if (cOp && cFirst !== null) {
        const s = parseFloat(cVal);
        let r;
        if      (cOp === '+') r = cFirst + s;
        else if (cOp === '−') r = cFirst - s;
        else if (cOp === '×') r = cFirst * s;
        else                  r = s !== 0 ? cFirst / s : NaN;
        cExpr += (cJustOp ? ' ' + cVal : '') + ' =';
        cVal = isNaN(r) ? 'Error' : String(parseFloat(r.toFixed(10)));
        cOp = null; cFirst = null; cJustOp = false;
      }
    } else if (k === '.') {
      if (cJustOp) { cVal = '0.'; cJustOp = false; }
      else if (!cVal.includes('.')) cVal += '.';
    } else {
      if (cJustOp || cVal === '0' || cVal === 'Error') { cVal = k; cJustOp = false; }
      else if (cVal.length < 12) cVal += k;
    }

    dv.textContent = cVal.length > 11 ? parseFloat(cVal).toExponential(3) : cVal;
    de.textContent = cExpr;
  }

  /* ══════════════════════════════════════════
     APP: NOTES
  ══════════════════════════════════════════ */
  function buildNotes() {
    return `
      <div class="notes-wrap">
        <div class="notes-toolbar">
          <button class="notes-btn b" onclick="document.execCommand('bold',false,null)">B</button>
          <button class="notes-btn i" onclick="document.execCommand('italic',false,null)">I</button>
          <button class="notes-btn u" onclick="document.execCommand('underline',false,null)">U</button>
          <div class="notes-sep"></div>
          <button class="notes-btn" onclick="document.execCommand('insertUnorderedList',false,null)">• List</button>
          <button class="notes-btn" onclick="document.execCommand('formatBlock',false,'h3')">Heading</button>
          <button class="notes-btn" onclick="document.execCommand('formatBlock',false,'p')">Normal</button>
        </div>
        <div class="notes-editor" contenteditable="true" onmousedown="event.stopPropagation()">
          <p>Start typing your notes here…</p>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════
     APP: TERMINAL
  ══════════════════════════════════════════ */
  const TERM_COMMANDS = {
    help:   () => 'Commands: help  whoami  date  pwd  ls  uname  echo [text]  clear',
    whoami: () => 'lumi-user',
    date:   () => new Date().toLocaleString(),
    pwd:    () => '/home/lumi-user',
    ls:     () => 'Documents/  Downloads/  Desktop/  Pictures/  Music/\nnotes.md   config.json   README.txt',
    uname:  () => 'LumiOS 1.0.0 LumiCore x86_64',
    echo:   (args) => args.join(' ') || '',
    clear:  () => '__CLEAR__',
  };

  function buildTerminal() {
    return `
      <div class="term-wrap">
        <div class="term-output tout">
          <div style="color:#93c5fd;margin-bottom:3px;">LumiOS Terminal v1.0.0</div>
          <div style="color:rgba(255,255,255,.3);">Type <span style="color:#4ade80">'help'</span> for available commands.</div>
        </div>
        <div class="term-prompt-row">
          <span class="term-prompt-label">lumi@os:~$</span>
          <input
            type="text"
            class="term-input"
            placeholder=""
            onmousedown="event.stopPropagation()"
            onkeydown="if(event.key==='Enter'){termRun(this);this.value=''}"
          />
        </div>
      </div>
    `;
  }

  function termRun(inp) {
    const raw = inp.value.trim(); if (!raw) return;
    const out = inp.closest('.wc').querySelector('.tout'); if (!out) return;

    const cmdLine = document.createElement('div');
    cmdLine.style.color   = 'rgba(255,255,255,.62)';
    cmdLine.textContent   = 'lumi@os:~$ ' + raw;
    out.appendChild(cmdLine);

    const [cmd, ...args] = raw.split(' ');
    const fn = TERM_COMMANDS[cmd];

    if (fn) {
      const result = fn(args);
      if (result === '__CLEAR__') {
        out.innerHTML = '';
      } else {
        result.split('\n').forEach(line => {
          const d = document.createElement('div');
          d.style.color  = '#4ade80';
          d.textContent  = line;
          out.appendChild(d);
        });
      }
    } else {
      const err = document.createElement('div');
      err.style.color  = '#f87171';
      err.textContent  = `lumish: ${cmd}: command not found`;
      out.appendChild(err);
    }
    out.scrollTop = out.scrollHeight;
  }

  /* ══════════════════════════════════════════
     APP: FILES
  ══════════════════════════════════════════ */
  const FILE_ITEMS = [
    { name: 'Documents',   ic: 'ti-folder',    cl: 'rgba(250,180,0,.78)',  meta: 'Folder'  },
    { name: 'Downloads',   ic: 'ti-folder',    cl: 'rgba(250,180,0,.78)',  meta: 'Folder'  },
    { name: 'Pictures',    ic: 'ti-folder',    cl: 'rgba(250,180,0,.78)',  meta: 'Folder'  },
    { name: 'Music',       ic: 'ti-folder',    cl: 'rgba(250,180,0,.78)',  meta: 'Folder'  },
    { name: 'notes.md',    ic: 'ti-file-text', cl: 'rgba(100,200,100,.7)', meta: '5 KB'    },
    { name: 'config.json', ic: 'ti-settings',  cl: 'rgba(100,150,255,.7)', meta: '1 KB'    },
    { name: 'README.txt',  ic: 'ti-file',      cl: 'rgba(200,200,200,.5)', meta: '2 KB'    },
    { name: 'photo.png',   ic: 'ti-photo',     cl: 'rgba(255,100,150,.7)', meta: '2.3 MB'  },
  ];

  function buildFiles() {
    return `
      <div class="files-wrap">
        <div class="files-toolbar">
          <button class="files-nav-btn"><i class="ti ti-chevron-left" aria-hidden="true"></i></button>
          <button class="files-nav-btn"><i class="ti ti-chevron-right" aria-hidden="true"></i></button>
          <div class="files-path">
            <i class="ti ti-home" style="font-size:11px;" aria-hidden="true"></i>
            /home/lumi-user
          </div>
        </div>
        <div class="files-list" onmousedown="event.stopPropagation()">
          ${FILE_ITEMS.map(f => `
            <div class="file-row">
              <div class="file-row-icon">
                <i class="ti ${f.ic}" style="font-size:16px;color:${f.cl};" aria-hidden="true"></i>
              </div>
              <span class="file-row-name">${f.name}</span>
              <span class="file-row-meta">${f.meta}</span>
            </div>
          `).join('')}
        </div>
        <div class="files-statusbar">${FILE_ITEMS.length} items</div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════
     APP: SETTINGS
  ══════════════════════════════════════════ */
  const SETTINGS_NAV = [
    { ic: 'ti-palette',     label: 'Appearance',    active: true  },
    { ic: 'ti-screen',      label: 'Display',       active: false },
    { ic: 'ti-bell',        label: 'Notifications', active: false },
    { ic: 'ti-lock',        label: 'Security',      active: false },
    { ic: 'ti-info-circle', label: 'About',         active: false },
  ];

  const SETTINGS_TOGGLES = [
    { label: 'Transparency',  desc: 'Window blur & glass effects', on: true  },
    { label: 'Dark Mode',     desc: 'System-wide dark theme',      on: true  },
    { label: 'Animations',    desc: 'Motion & transition effects',  on: true  },
  ];

  const ACCENT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9', '#10b981'];

  function buildSettings() {
    return `
      <div class="settings-wrap">
        <div class="settings-sidebar">
          ${SETTINGS_NAV.map(n => `
            <div class="settings-nav-item ${n.active ? 'active' : ''}">
              <i class="ti ${n.ic}" style="font-size:13px;flex-shrink:0;" aria-hidden="true"></i>
              ${n.label}
            </div>
          `).join('')}
        </div>
        <div class="settings-content" onmousedown="event.stopPropagation()">
          <div class="settings-section-title">Appearance</div>

          ${SETTINGS_TOGGLES.map(t => `
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">${t.label}</div>
                <div class="settings-row-desc">${t.desc}</div>
              </div>
              <div
                class="toggle"
                data-on="${t.on ? 1 : 0}"
                style="background:${t.on ? 'rgba(100,140,255,.65)' : 'rgba(255,255,255,.12)'};"
                onclick="toggleSwitch(this)"
              >
                <div class="toggle-thumb" style="${t.on ? 'right:3px;left:auto;' : 'left:3px;right:auto;'}"></div>
              </div>
            </div>
          `).join('')}

          <div class="accent-row">
            <div class="accent-label">Accent Color</div>
            <div class="accent-swatches">
              ${ACCENT_COLORS.map((c, i) => `
                <div
                  class="accent-swatch"
                  style="background:${c};border:2px solid ${i === 0 ? 'white' : 'transparent'};"
                  onclick="selectAccent(this)"
                ></div>
              `).join('')}
            </div>
          </div>

          <div class="settings-section-title" style="margin-top:18px;">System Information</div>
          <div class="sysinfo">
            <div><span class="sysinfo-key">Version</span>  LumiOS 1.0.0</div>
            <div><span class="sysinfo-key">Build</span>    2024.06.14</div>
            <div><span class="sysinfo-key">Kernel</span>   LumiCore 1.0</div>
            <div><span class="sysinfo-key">Platform</span> Web-based</div>
          </div>
        </div>
      </div>
    `;
  }

  function toggleSwitch(el) {
    const on = el.dataset.on === '1';
    el.dataset.on  = on ? '0' : '1';
    el.style.background = on ? 'rgba(255,255,255,.12)' : 'rgba(100,140,255,.65)';
    const thumb = el.querySelector('.toggle-thumb');
    if (on) { thumb.style.right = 'auto'; thumb.style.left  = '3px'; }
    else    { thumb.style.left  = 'auto'; thumb.style.right = '3px'; }
  }

  function selectAccent(el) {
    el.closest('.accent-swatches').querySelectorAll('.accent-swatch')
      .forEach(s => s.style.border = '2px solid transparent');
    el.style.border = '2px solid white';
  }

  /* ══════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════ */
  init();
