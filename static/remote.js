/* remote.js - extracted from remote.html
   Make sure this file is loaded at the end of <body> (it is in remote.html)
*/

// ====== Vibration helpers ======
const vibToggle = document.getElementById('vibToggle');
function canVibrate() { return 'vibrate' in navigator && vibToggle.checked; }
function vibrateTap() { if (canVibrate()) navigator.vibrate(40); }
function vibrateConfirm() { if (canVibrate()) navigator.vibrate([100, 50, 100]); }
function vibrateCancel() { if (canVibrate()) navigator.vibrate(120); }
function vibrateError() { if (canVibrate()) navigator.vibrate([60, 40, 60, 40, 60]); }

// ====== Scroll Hold Variables ======
let scrollInterval = null;
let scrollDirection = null;

// ====== Keyboard Functions ======
async function sendText() {
  const input = document.getElementById('keyboardInput');
  const text = input.value;

  if (!text.trim()) {
    statusEl.innerText = 'Please type something first';
    setTimeout(() => statusEl.innerText = '', 2000);
    return;
  }

  vibrateTap();
  statusEl.innerText = 'Sending text...';

  try {
    await fetch('/api/keyboard/type', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    });

    statusEl.innerText = `✅ Sent: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`;
    input.value = '';
    input.focus();
    setTimeout(() => statusEl.innerText = '', 2000);
  } catch (err) {
    vibrateError();
    statusEl.innerText = '❌ Failed to send text';
    setTimeout(() => statusEl.innerText = '', 2000);
  }
}

async function pressBackspace() {
  vibrateTap();
  statusEl.innerText = '⌫ Deleting...';

  try {
    await fetch('/api/keyboard/backspace', {
      method: 'POST'
    });
    setTimeout(() => statusEl.innerText = '', 1000);
  } catch (err) {
    vibrateError();
    statusEl.innerText = '❌ Failed';
    setTimeout(() => statusEl.innerText = '', 2000);
  }
}



async function pressEnter() {
  vibrateTap();
  statusEl.innerText = '↵ Enter...';

  try {
    await fetch('/api/keyboard/enter', {
      method: 'POST'
    });
    setTimeout(() => statusEl.innerText = '', 1000);
  } catch (err) {
    vibrateError();
    statusEl.innerText = '❌ Failed';
    setTimeout(() => statusEl.innerText = '', 2000);
  }
}

async function pressAltD() {
  vibrateTap();
  statusEl.innerText = 'Alt + D (Address Bar)...';

  try {
    await fetch('/api/keyboard/alt_d', {
      method: 'POST'
    });
    setTimeout(() => statusEl.innerText = '', 1000);
  } catch (err) {
    vibrateError();
    statusEl.innerText = '❌ Failed';
    setTimeout(() => statusEl.innerText = '', 2000);
  }
}

async function pressWindowsTab() {
  vibrateTap();
  statusEl.innerText = '🪟 + Tab (Task View)...';

  try {
    await fetch('/api/keyboard/windows_tab', {
      method: 'POST'
    });
    setTimeout(() => statusEl.innerText = '', 1000);
  } catch (err) {
    vibrateError();
    statusEl.innerText = '❌ Failed';
    setTimeout(() => statusEl.innerText = '', 2000);
  }
}

async function pressWindowsP() {
  vibrateTap();
  statusEl.innerText = '🪟 + P (Project)...';

  try {
    await fetch('/api/keyboard/windows_p', {
      method: 'POST'
    });
    setTimeout(() => statusEl.innerText = '', 1000);
  } catch (err) {
    vibrateError();
    statusEl.innerText = '❌ Failed';
    setTimeout(() => statusEl.innerText = '', 2000);
  }
}

async function pressToggleBluetooth() {
  vibrateTap();
  statusEl.innerText = 'Toggling Bluetooth...';

  try {
    await fetch('/api/keyboard/toggle_bluetooth', {
      method: 'POST'
    });
    setTimeout(() => statusEl.innerText = '', 2000);
  } catch (err) {
    vibrateError();
    statusEl.innerText = '❌ Failed';
    setTimeout(() => statusEl.innerText = '', 2000);
  }
}

async function pressCtrlPlus() {
  vibrateTap();
  statusEl.innerText = 'Ctrl + (Zoom In)...';

  try {
    await fetch('/api/keyboard/ctrl_plus', { method: 'POST' });
    setTimeout(() => statusEl.innerText = '', 1000);
  } catch (err) {
    vibrateError();
    statusEl.innerText = '❌ Failed';
    setTimeout(() => statusEl.innerText = '', 2000);
  }
}

async function pressCtrlMinus() {
  vibrateTap();
  statusEl.innerText = 'Ctrl - (Zoom Out)...';

  try {
    await fetch('/api/keyboard/ctrl_minus', { method: 'POST' });
    setTimeout(() => statusEl.innerText = '', 1000);
  } catch (err) {
    vibrateError();
    statusEl.innerText = '❌ Failed';
    setTimeout(() => statusEl.innerText = '', 2000);
  }
}

// Handle Enter key from phone keyboard
document.getElementById('keyboardInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendText();
  }
});

// ====== Scroll Hold Functions ======
function startScroll(direction) {
  scrollDirection = direction;

  // Start scrolling
  scrollInterval = setInterval(() => {
    const amount = direction === 'up' ? 3 : -3;
    fetch('/api/mouse/scroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount })
    });
  }, 100);
}

function stopScroll() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
}

// ====== Network + UI helpers ======
const statusEl = document.getElementById('status');
async function action(name) {
  statusEl.innerText = '⏳ Sending ' + name + '...';
  try {
    const res = await fetch('/api/' + name, { method: 'POST' });
    if (!res.ok) {
      vibrateError();
      statusEl.innerText = '❌ Error ' + res.status;
      return;
    }
    const data = await res.json();
    statusEl.innerText = '✅ ' + data.action;
    setTimeout(() => statusEl.innerText = '', 2000);
  } catch (err) {
    vibrateError();
    statusEl.innerText = '❌ Network error';
  }
}

async function mouseMove(dx, dy) {
  try {
    const response = await fetch('/api/mouse/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dx: dx, dy: dy })
    });
    return response.ok;
  } catch (err) {
    console.error('Mouse move error:', err);
    return false;
  }
}

function toggleShutdownMenu() {
  document.getElementById('shutdownMenu').classList.toggle('hidden');
  vibrateTap();
}

async function confirmShutdown() {
  vibrateConfirm();
  let s = document.getElementById('shutdownTimer').value;
  statusEl.innerText = '⏳ Scheduling shutdown...';
  try {
    const res = await fetch('/api/shutdown?time=' + s, { method: 'POST' });
    const data = await res.json();
    statusEl.innerText = '💻 Shutdown in ' + data.timer + 's';
    document.getElementById('shutdownMenu').classList.add('hidden');
  } catch (err) {
    vibrateError();
    statusEl.innerText = '❌ Shutdown failed';
  }
}

function cancelShutdown() {
  vibrateCancel();
  document.getElementById('shutdownMenu').classList.add('hidden');
  statusEl.innerText = '❌ Shutdown canceled';
  setTimeout(() => statusEl.innerText = '', 2000);
}

// Persist vib pref
vibToggle.addEventListener('change', () => sessionStorage.setItem('pc_vib', vibToggle.checked ? '1' : '0'));
(function () { if (sessionStorage.getItem('pc_vib') === '0') vibToggle.checked = false; })();

// ====== Button actions with vibration ======
function setupButton(id, actionName) {
  const btn = document.getElementById(id);
  btn.addEventListener('click', () => {
    vibrateTap();
    action(actionName);
  });
}

setupButton("pause", "pause");
setupButton("next", "next");
setupButton("back", "back");
setupButton("skipintro", "skipintro");
setupButton("nextepisode", "nextepisode");
setupButton("altBack", "keyboard/alt_left");
setupButton("openSpotify", "open/spotify");
setupButton("openDimmer", "open/dimmer");
setupButton("closeDimmer", "close/dimmer");
setupButton("openNetflix", "open/netflix");
setupButton("openYoutube", "open/youtube");

// ====== Long press for volume with vibration ======
function setupHoldButton(id, cmd) {
  let interval;
  const btn = document.getElementById(id);

  const start = () => {
    vibrateTap();
    action(cmd);
    interval = setInterval(() => {
      vibrateTap();
      action(cmd);
    }, 200);
  };
  const stop = () => clearInterval(interval);

  btn.addEventListener("mousedown", start);
  btn.addEventListener("mouseup", stop);
  btn.addEventListener("mouseleave", stop);

  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    start();
  });
  btn.addEventListener("touchend", stop);
}
setupHoldButton("volup", "volup");
setupHoldButton("voldown", "voldown");

// ====== Holdable Scroll Buttons ======
const scrollUpBtn = document.getElementById('scrollUp');
const scrollDownBtn = document.getElementById('scrollDown');

// Scroll Up hold
scrollUpBtn.addEventListener('mousedown', () => {
  vibrateTap();
  statusEl.innerText = 'Scrolling Up (hold)...';
  startScroll('up');
});

scrollUpBtn.addEventListener('mouseup', () => {
  stopScroll();
  statusEl.innerText = 'Scroll stopped';
  setTimeout(() => statusEl.innerText = '', 1000);
});

scrollUpBtn.addEventListener('mouseleave', stopScroll);

scrollUpBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  vibrateTap();
  statusEl.innerText = 'Scrolling Up (hold)...';
  startScroll('up');
});

scrollUpBtn.addEventListener('touchend', () => {
  stopScroll();
  statusEl.innerText = 'Scroll stopped';
  setTimeout(() => statusEl.innerText = '', 1000);
});

// Scroll Down hold
scrollDownBtn.addEventListener('mousedown', () => {
  vibrateTap();
  statusEl.innerText = 'Scrolling Down (hold)...';
  startScroll('down');
});

scrollDownBtn.addEventListener('mouseup', () => {
  stopScroll();
  statusEl.innerText = 'Scroll stopped';
  setTimeout(() => statusEl.innerText = '', 1000);
});

scrollDownBtn.addEventListener('mouseleave', stopScroll);

scrollDownBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  vibrateTap();
  statusEl.innerText = 'Scrolling Down (hold)...';
  startScroll('down');
});

scrollDownBtn.addEventListener('touchend', () => {
  stopScroll();
  statusEl.innerText = 'Scroll stopped';
  setTimeout(() => statusEl.innerText = '', 1000);
});

// ====== D-Pad Mouse Control ======
const mouseSpeeds = [
  { value: 10, label: "Slow" },
  { value: 25, label: "Medium" },
  { value: 50, label: "Fast" },
];
let currentSpeedIndex = 1; // Start with Medium
let mouseMoveInterval = null;
let currentDirection = null;
let isMouseMoving = false;

function getMouseSpeed() {
  return mouseSpeeds[currentSpeedIndex].value;
}

function moveMouse(direction) {
  let dx = 0, dy = 0;
  const speed = getMouseSpeed();

  switch (direction) {
    case 'up': dy = -speed; break;
    case 'down': dy = speed; break;
    case 'left': dx = -speed; break;
    case 'right': dx = speed; break;
  }

  mouseMove(dx, dy);
}

function updateSpeedDisplay() {
  const speedDisplay = document.getElementById('speedDisplay');
  const currentSpeed = mouseSpeeds[currentSpeedIndex];

  speedDisplay.textContent = currentSpeed.label;
  speedDisplay.className = 'speed-value';
  statusEl.innerText = `🎯 Mouse speed: ${currentSpeed.label} (${currentSpeed.value}px)`;
  setTimeout(() => {
    if (statusEl.innerText.includes('Mouse speed:')) {
      statusEl.innerText = '';
    }
  }, 2000);
}

function cycleMouseSpeed() {
  vibrateTap();
  currentSpeedIndex = (currentSpeedIndex + 1) % mouseSpeeds.length;
  updateSpeedDisplay();

  sessionStorage.setItem('pc_mouse_speed', currentSpeedIndex.toString());
}

function stopMouseMovement() {
  if (mouseMoveInterval) {
    clearInterval(mouseMoveInterval);
    mouseMoveInterval = null;
  }
  currentDirection = null;
  isMouseMoving = false;
}

// ====== Touchpad Mouse Control ======
// Replaces the old D-pad with a single touch-sensitive pad. Hold and drag to move cursor; distance from center controls speed.
let padPointerId = null;
let padInterval = null;
let padDx = 0, padDy = 0;

const mousePad = document.getElementById('mousePad');

function updatePadFromEvent(e) {
  const rect = mousePad.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const x = e.clientX;
  const y = e.clientY;
  let dx = x - cx;
  let dy = y - cy;
  const maxR = Math.min(rect.width, rect.height) / 2;
  const mag = Math.hypot(dx, dy);
  const norm = Math.min(mag / maxR, 1);

  if (mag <= 6) {
    padDx = 0; padDy = 0;
    statusEl.innerText = 'Center';
    return;
  }

  // normalized components relative to half-size (-1..1)
  const nx = dx / maxR;
  const ny = dy / maxR;
  const absNx = Math.abs(nx), absNy = Math.abs(ny);

  // Parameters: diagonals only when near corners and both components are large
  const cornerDist = 0.72;      // fraction of radius required to consider corner
  const diagCompThreshold = 0.72; // normalized component threshold for diagonals

  // unit direction
  const ux = dx / mag;
  const uy = dy / mag;

  let finalUx = ux, finalUy = uy;

  if (norm < cornerDist) {
    // not close enough to edges -> snap to dominant cardinal axis
    if (absNx > absNy * 1.2) { finalUy = 0; finalUx = Math.sign(ux); }
    else if (absNy > absNx * 1.2) { finalUx = 0; finalUy = Math.sign(uy); }
    else {
      // small offset -> snap to nearest cardinal
      if (absNx > absNy) { finalUy = 0; finalUx = Math.sign(ux); }
      else { finalUx = 0; finalUy = Math.sign(uy); }
    }
  } else {
    // near edges: allow diagonal only if both comps are large
    if (absNx > diagCompThreshold && absNy > diagCompThreshold) {
      finalUx = ux; finalUy = uy; // allow diagonal
    } else {
      // otherwise snap to dominant axis
      if (absNx > absNy) { finalUy = 0; finalUx = Math.sign(ux); }
      else { finalUx = 0; finalUy = Math.sign(uy); }
    }
  }

  const speedScale = (0.5 + 1.5 * norm); // same scaling as before
  const outDx = finalUx * getMouseSpeed() * speedScale;
  const outDy = finalUy * getMouseSpeed() * speedScale;

  padDx = Math.round(outDx);
  padDy = Math.round(outDy);

  if (padDx === 0 && padDy === 0) {
    statusEl.innerText = 'Center';
  } else {
    statusEl.innerText = `Moving ${padDx}, ${padDy}`;
  }
}

function sendPadMove() {
  if (padDx !== 0 || padDy !== 0) {
    mouseMove(padDx, padDy);
  }
}

mousePad.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  vibrateTap();
  padPointerId = e.pointerId;
  try { mousePad.setPointerCapture(padPointerId); } catch (err) {}
  updatePadFromEvent(e);
  sendPadMove();
  padInterval = setInterval(sendPadMove, 80);
});

mousePad.addEventListener('pointermove', (e) => {
  if (e.pointerId !== padPointerId) return;
  updatePadFromEvent(e);
});

const releasePad = (e) => {
  if (padPointerId !== null) {
    try { mousePad.releasePointerCapture(padPointerId); } catch (err) {}
  }
  padPointerId = null;
  clearInterval(padInterval);
  padInterval = null;
  padDx = 0; padDy = 0;
  statusEl.innerText = '';
}   ;

mousePad.addEventListener('pointerup', releasePad);
mousePad.addEventListener('pointercancel', releasePad);

// Also stop on window pointerup in case pointer leaves area
window.addEventListener('pointerup', (e) => {
  if (padPointerId !== null && e.pointerId === padPointerId) releasePad(e);
});

// Add click handler to speed button
document.getElementById('mouseSpeedBtn').addEventListener('click', cycleMouseSpeed);

// Click buttons (left/right click) remain unchanged
document.getElementById('leftClick').addEventListener('click', () => {
  vibrateTap();
  fetch('/api/mouse/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ button: 'left' })
  });
  statusEl.innerText = 'Left Click';
  setTimeout(() => statusEl.innerText = '', 1000);
});

document.getElementById('rightClick').addEventListener('click', () => {
  vibrateTap();
  fetch('/api/mouse/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ button: 'right' })
  });
  statusEl.innerText = 'Right Click';
  setTimeout(() => statusEl.innerText = '', 1000);
});

// Update keyboard shortcuts for desktop testing to use mouseMove directly
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    mouseMove(0, -getMouseSpeed());
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    mouseMove(0, getMouseSpeed());
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    mouseMove(-getMouseSpeed(), 0);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    mouseMove(getMouseSpeed(), 0);
  }
});