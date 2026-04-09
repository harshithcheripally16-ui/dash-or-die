const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Game state
const player = {
    x: 0,
    y: 0,
    size: 40,
    color: '#8b5cf6',
    dashVelocity: { x: 0, y: 0 },
    dashSpeedInitial: 40,
    dashDecay: 0.82,
    dashMinVelocity: 2,
    isDashing: false,
    dashCooldown: 300,
    lastDashTime: 0,
    angle: 0,
    trail: [],
    particles: []
};

let enemies = [];
let score = 0;
let lastSpawnTime = 0;
let spawnRate = 1500;
const minSpawnRate = 400;

const effects = {
    shake: { x: 0, y: 0, intensity: 0 },
    flash: 0,
    proximity: 0
};

const keys = {};

// States
const STATE = {
    START: 'start',
    PLAYING: 'playing',
    GAMEOVER: 'gameover'
};
let gameState = STATE.START;

// Initialization
function init() {
    console.log("System initializing...");
    try {
        resizeCanvas();
        showScreen('start-screen');
    } catch (e) {
        console.error("Core initialization failed:", e);
    }
    
    window.addEventListener('resize', () => {
        try { resizeCanvas(); } catch (e) { console.warn("Resize failed:", e); }
    });
    
    // UI Event Listeners
    const bindBtn = (id, fn) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', fn);
        } else {
            console.warn(`UI Binding failed: ${id} not found.`);
        }
    };

    bindBtn('start-btn', startGame);
    bindBtn('restart-btn', () => {
        resetGame();
        startGame();
    });

    window.addEventListener('keydown', (e) => {
        try {
            if (gameState === STATE.GAMEOVER && e.code === 'Enter') {
                resetGame();
                startGame();
                return;
            }
            if (gameState === STATE.START && e.code === 'Enter') {
                startGame();
                return;
            }
            if (gameState === STATE.PLAYING && !keys[e.code]) {
                handleDashInput(e.code);
            }
            keys[e.code] = true;
        } catch (err) {
            console.error("Input processing failure:", err);
        }
    });

    window.addEventListener('keyup', (e) => keys[e.code] = false);
    
    gameLoop();
}

function startGame() {
    console.log("GAME STARTING: Link established.");
    gameState = STATE.PLAYING;
    hideScreens();
    lastSpawnTime = Date.now();
}

function showScreen(id) {
    hideScreens();
    document.getElementById(id).style.display = 'flex';
}

function hideScreens() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
}

function resetGame() {
    player.x = canvas.width / 2 - player.size / 2;
    player.y = canvas.height / 2 - player.size / 2;
    player.isDashing = false;
    player.trail = [];
    enemies = [];
    isGameOver = false;
    score = 0;
    spawnRate = 1500;
    lastSpawnTime = Date.now();
    document.getElementById('game-over').style.display = 'none';

    // Update High Score Display
    const highScore = localStorage.getItem('dashHighScore') || 0;
    const highScoreElement = document.getElementById('high-score-value');
    if (highScoreElement) {
        highScoreElement.innerText = Math.floor(highScore / 10);
    }
}

function handleDashInput(code) {
    const now = Date.now();
    if (now - player.lastDashTime < player.dashCooldown || player.isDashing) return;

    let dx = 0;
    let dy = 0;

    if (code === 'KeyW' || code === 'ArrowUp') dy = -1;
    if (code === 'KeyS' || code === 'ArrowDown') dy = 1;
    if (code === 'KeyA' || code === 'ArrowLeft') dx = -1;
    if (code === 'KeyD' || code === 'ArrowRight') dx = 1;

    if (dx !== 0 || dy !== 0) {
        startDash(dx, dy);
    }
}

function startDash(dx, dy) {
    // Normalize diagonal movement
    const length = Math.hypot(dx, dy);
    const ux = dx / length;
    const uy = dy / length;

    player.isDashing = true;
    player.dashVelocity = { 
        x: ux * player.dashSpeedInitial, 
        y: uy * player.dashSpeedInitial 
    };
    player.angle = Math.atan2(uy, ux);
    player.lastDashTime = Date.now();

    // Spawn burst particles
    for (let i = 0; i < 15; i++) {
        player.particles.push({
            x: player.x + player.size / 2,
            y: player.y + player.size / 2,
            vx: (Math.random() - 0.5) * 15 - ux * 5,
            vy: (Math.random() - 0.5) * 15 - uy * 5,
            size: Math.random() * 5 + 2,
            life: 1.0
        });
    }
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (gameState === STATE.START) {
        player.x = canvas.width / 2 - player.size / 2;
        player.y = canvas.height / 2 - player.size / 2;
    }
}

// Update logic
function update() {
    if (gameState !== STATE.PLAYING) {
        // Subtle decay still active
        effects.shake.intensity *= 0.9;
        effects.shake.x = (Math.random() - 0.5) * effects.shake.intensity;
        effects.shake.y = (Math.random() - 0.5) * effects.shake.intensity;
        effects.flash *= 0.85;

        // Still update particles for debris
        updateParticles();
        return;
    }

    // Decay Effects
    effects.shake.intensity *= 0.9;
    effects.shake.x = (Math.random() - 0.5) * effects.shake.intensity;
    effects.shake.y = (Math.random() - 0.5) * effects.shake.intensity;
    effects.flash *= 0.85;

    // Enemy Spawning
    const now = Date.now();
    if (now - lastSpawnTime > spawnRate) {
        spawnEnemy();
        lastSpawnTime = now;
        // Exponentially increase difficulty
        spawnRate = Math.max(minSpawnRate, spawnRate * 0.97);
    }

    // Dash velocity update
    if (player.isDashing) {
        player.x += player.dashVelocity.x;
        player.y += player.dashVelocity.y;

        player.dashVelocity.x *= player.dashDecay;
        player.dashVelocity.y *= player.dashDecay;

        const currentSpeed = Math.hypot(player.dashVelocity.x, player.dashVelocity.y);
        if (currentSpeed < player.dashMinVelocity) {
            player.isDashing = false;
            player.dashVelocity = { x: 0, y: 0 };
        }
    }

    // Boundary checks
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Handle Enemies & Proximity
    let minEnemyDist = Infinity;
    enemies.forEach((enemy, index) => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minEnemyDist) minEnemyDist = dist;

        // Tracking speed 
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;

        // Near Miss Shake (threshold 80px)
        if (dist < 80 && !player.isDashing) {
            effects.shake.intensity = Math.max(effects.shake.intensity, 5);
        }

        // Collision Check (AABB)
        if (player.x < enemy.x + enemy.size &&
            player.x + player.size > enemy.x &&
            player.y < enemy.y + enemy.size &&
            player.y + player.size > enemy.y) {
            triggerGameOver();
        }
    });

    // Update Proximity Vignette
    const vignette = document.getElementById('vignette');
    if (vignette) {
        if (minEnemyDist < 150) {
            vignette.classList.add('active');
        } else {
            vignette.classList.remove('active');
        }
    }

    // Score Tracking
    score += 1;
    const scoreVal = document.getElementById('score-value');
    if (scoreVal) {
        const currentDisplayScore = Math.floor(score / 10);
        scoreVal.innerText = currentDisplayScore;
        
        // Visual Milestone (every 100 display points)
        if (currentDisplayScore > 0 && currentDisplayScore % 100 === 0) {
            scoreVal.classList.add('pulse-milestone');
            setTimeout(() => scoreVal.classList.remove('pulse-milestone'), 1000);
        }
    }

    // Handle Trail (Enhanced Scaling)
    const trailSize = player.isDashing ? 15 : 8;
    player.trail.push({ 
        x: player.x, 
        y: player.y, 
        opacity: player.isDashing ? 0.8 : 0.4,
        scale: 1.0
    });
    
    if (player.trail.length > trailSize) player.trail.shift();
    player.trail.forEach(p => {
        p.opacity -= 0.05;
        p.scale *= 0.95;
    });

    // Particle system update
    updateParticles();

    // Update Dash UI
    const cooldownBar = document.getElementById('cooldown-bar');
    if (cooldownBar) {
        const elapsed = Date.now() - player.lastDashTime;
        const progress = Math.min(100, (elapsed / player.dashCooldown) * 100);
        cooldownBar.style.width = `${progress}%`;
        
        if (progress === 100) {
            cooldownBar.classList.add('ready');
        } else {
            cooldownBar.classList.remove('ready');
        }
    }
}

function updateParticles() {
    if (player.particles) {
        player.particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) player.particles.splice(index, 1);
        });
    }
}

function spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    const size = 25;
    const margin = 50;

    if (edge === 0) { // Top
        x = Math.random() * canvas.width;
        y = -margin;
    } else if (edge === 1) { // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + margin;
    } else if (edge === 2) { // Left
        x = -margin;
        y = Math.random() * canvas.height;
    } else { // Right
        x = canvas.width + margin;
        y = Math.random() * canvas.height;
    }

    enemies.push({ 
        x, 
        y, 
        size, 
        speed: 1.2 + Math.random() * 1.5,
        pulse: 0,
        id: Math.random()
    });
}

function triggerGameOver() {
    gameState = STATE.GAMEOVER;
    effects.shake.intensity = 50;
    effects.flash = 1.0;
    
    // Set Final Score
    document.getElementById('final-score-val').innerText = Math.floor(score / 10);
    showScreen('game-over');
    
    // Debris particles
    for (let i = 0; i < 30; i++) {
        player.particles.push({
            x: player.x + player.size / 2,
            y: player.y + player.size / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            size: Math.random() * 8 + 4,
            life: 1.5
        });
    }

    // Save High Score
    const highScore = localStorage.getItem('dashHighScore') || 0;
    if (score > highScore) {
        localStorage.setItem('dashHighScore', score);
    }

    document.getElementById('game-over').style.display = 'flex';
}

// Render logic
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (effects.shake.intensity > 0.1) {
        ctx.translate(effects.shake.x, effects.shake.y);
    }

    drawGrid();

    // Draw Trail (With Scaling)
    player.trail.forEach((p, index) => {
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        const drawSize = player.size * p.scale;
        const offset = (player.size - drawSize) / 2;
        ctx.fillRect(p.x + offset, p.y + offset, drawSize, drawSize);
    });

    // Draw Particles
    player.particles.forEach(p => {
        ctx.fillStyle = `rgba(139, 92, 246, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Enemies
    enemies.forEach(enemy => {
        enemy.pulse = (enemy.pulse + 0.1) % (Math.PI * 2);
        const glowSize = Math.sin(enemy.pulse) * 5 + 15;
        
        ctx.shadowBlur = glowSize;
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = '#ef4444';
        
        // Slightly glitchy drawing
        const glitchX = (Math.random() - 0.5) * 2;
        const glitchY = (Math.random() - 0.5) * 2;
        
        ctx.beginPath();
        ctx.roundRect(enemy.x + glitchX, enemy.y + glitchY, enemy.size, enemy.size, 4);
        ctx.fill();
        
        // Inner core
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.2;
        ctx.fillRect(enemy.x + glitchX + 5, enemy.y + glitchY + 5, enemy.size - 10, enemy.size - 10);
        ctx.globalAlpha = 1.0;
    });

    // Draw Player with Smear & Stretch Effect
    ctx.save();
    ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
    
    if (player.isDashing) {
        const speed = Math.hypot(player.dashVelocity.x, player.dashVelocity.y);
        const stretch = 1 + speed / 40;
        ctx.rotate(player.angle);
        
        // Draw Smear (Neon Trail)
        for (let i = 0; i < 4; i++) {
            ctx.globalAlpha = 0.2 - i * 0.05;
            ctx.fillStyle = player.color;
            ctx.fillRect(-(player.size / 2) - i * 15, -player.size / 2, player.size, player.size);
        }
        ctx.globalAlpha = 1.0;
        
        ctx.scale(stretch, 1 / stretch);
    }

    ctx.shadowBlur = 25;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    
    // Draw player center-aligned
    ctx.beginPath();
    ctx.roundRect(-player.size / 2, -player.size / 2, player.size, player.size, 8);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(-player.size / 2, -player.size / 2, player.size, player.size / 2.5, [8, 8, 0, 0]);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Collision Flash (Chromatic Aberration feel)
    if (effects.flash > 0.1) {
        ctx.fillStyle = `rgba(139, 92, 246, ${effects.flash * 0.4})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        effects.flash *= 0.85;
    }
    // Debug Overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('GAME RUNNING', canvas.width - 20, canvas.height - 20);
}

function drawGrid() {
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

window.onload = () => {
    try {
        init();
    } catch (criticalError) {
        console.error("CRITICAL SYSTEM FAILURE:", criticalError);
    }
};
