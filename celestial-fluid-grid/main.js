const THEMES = {
  solar: {
    name: 'SOLAR',
    colors: ['#f59e0b', '#fbbf24', '#78350f'],
    accent: '#f59e0b',
    octaves: 4.0
  },
  vortex: {
    name: 'VORTEX',
    colors: ['#10b981', '#34d399', '#064e3b'],
    accent: '#10b981',
    octaves: 3.5
  },
  nebula: {
    name: 'NEBULA',
    colors: ['#ec4899', '#a855f7', '#1e1b4b'],
    accent: '#ec4899',
    octaves: 5.0
  },
  stardust: {
    name: 'STARDUST',
    colors: ['#3b82f6', '#facc15', '#1e3a8a'],
    accent: '#3b82f6',
    octaves: 6.0
  },
  shimmer: {
    name: 'SHIMMER',
    colors: ['#8b5cf6', '#06b6d4', '#f43f5e'],
    accent: '#8b5cf6',
    octaves: 8.0
  }
};

let currentTheme = THEMES.solar;
let velocity = 1.0;
let tiles = [];

function init() {
  const container = document.getElementById('fluid-grid');
  const cols = 12;
  const rows = 6;
  
  container.innerHTML = '';
  tiles = [];

  for (let i = 0; i < cols * rows; i++) {
    const div = document.createElement('div');
    div.className = 'grid-tile';
    
    const canvas = document.createElement('canvas');
    canvas.className = 'tile-canvas';
    div.appendChild(canvas);
    container.appendChild(div);
    
    const ctx = canvas.getContext('2d');
    tiles.push({ 
      canvas, 
      ctx, 
      offset: Math.random() * 100,
      phase: Math.random() * Math.PI * 2 
    });
  }

  window.addEventListener('resize', resize);
  resize();

  // Controls
  const themeSelect = document.getElementById('theme-selector');
  themeSelect.addEventListener('change', (e) => {
    setTheme(e.target.value);
  });

  const velSlider = document.getElementById('flow-velocity');
  const velVal = document.getElementById('velocity-val');
  velSlider.addEventListener('input', (e) => {
    velocity = parseFloat(e.target.value);
    velVal.innerText = velocity.toFixed(1) + 'X';
  });

  requestAnimationFrame(loop);
}

function setTheme(id) {
  currentTheme = THEMES[id];
  document.documentElement.style.setProperty('--accent', currentTheme.accent);
  document.getElementById('theme-display').innerText = currentTheme.name;
  document.getElementById('octave-display').innerText = currentTheme.octaves.toFixed(1);
  
  // Transition flow phase text
  const flowDisp = document.getElementById('flow-display');
  flowDisp.innerText = 'SYNCING...';
  setTimeout(() => {
    flowDisp.innerText = 'STABLE';
  }, 400);
}

function resize() {
  tiles.forEach(tile => {
    const dpr = window.devicePixelRatio || 1;
    const rect = tile.canvas.getBoundingClientRect();
    tile.canvas.width = rect.width * dpr;
    tile.canvas.height = rect.height * dpr;
    tile.ctx.scale(dpr, dpr);
  });
}

function loop() {
  const time = Date.now() / 1000;

  tiles.forEach((tile, i) => {
    const { ctx, canvas, offset, phase } = tile;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    
    ctx.clearRect(0, 0, w, h);
    
    const flowX = Math.sin(time * 0.5 * velocity + phase) * 20;
    const flowY = Math.cos(time * 0.3 * velocity + phase) * 20;

    const grad = ctx.createRadialGradient(
      w / 2 + flowX, h / 2 + flowY, 0,
      w / 2, h / 2, Math.max(w, h)
    );

    grad.addColorStop(0, currentTheme.colors[0]);
    grad.addColorStop(0.5, currentTheme.colors[1]);
    grad.addColorStop(1, currentTheme.colors[2]);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    // Subtle overlay patterns based on octaves
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5;
    for (let j = 0; j < currentTheme.octaves; j++) {
      ctx.beginPath();
      ctx.moveTo(0, h * (j / currentTheme.octaves));
      ctx.lineTo(w, h * (j / currentTheme.octaves));
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  });

  requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', init);
