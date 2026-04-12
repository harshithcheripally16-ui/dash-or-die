let canvas, ctx;

// Game state
const player = {
    x: 0,
    y: 0,
    size: 32,
    color: '#8b5cf6',
    walkSpeed: 1.8,
    walkFriction: 0.82,
    maxWalkSpeed: 6.5,
    dashVelocity: { x: 0, y: 0 },
    dashSpeedInitial: 38,
    dashDecay: 0.84,
    dashMinVelocity: 3.0,
    isDashing: false,
    dashCooldown: 400,
    lastDashTime: 0,
    angle: 0,
    lastDirection: { x: 1, y: 0 },
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
const touchState = {
    active: false,
    origin: { x: 0, y: 0 },
    vector: { x: 0, y: 0 }
};

// States
const STATE = {
    START: 'start',
    PLAYING: 'playing',
    GAMEOVER: 'gameover'
};
let gameState = STATE.START;

// Initialization
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas ? canvas.getContext('2d') : null;
    
    console.log("System initializing...");
    try {
        showScreen('start-screen');
        resizeCanvas();
        if (canvas) canvas.focus();
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
            const isControlKey = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code);
            
            if ((gameState === STATE.START || gameState === STATE.GAMEOVER) && isControlKey) {
                if (gameState === STATE.GAMEOVER) resetGame();
                startGame();
                return;
            }
            keys[e.code] = true;
        } catch (err) {
            console.error("Input processing failure:", err);
        }
    });

    window.addEventListener('keyup', (e) => keys[e.code] = false);
    
    // Mobile Touch Event Listeners
    setupTouchListeners();

    // Prevent stuck movement on tab switch
    window.addEventListener('blur', clearInputs);
    
    gameLoop();
}

function clearInputs() {
    for (let key in keys) keys[key] = false;
    touchState.active = false;
    touchState.vector = { x: 0, y: 0 };
    const joystickContainer = document.getElementById('joystick-container');
    const joystickKnob = document.getElementById('joystick-knob');
    if (joystickContainer) joystickContainer.classList.remove('active');
    if (joystickKnob) joystickKnob.style.transform = `translate(0px, 0px)`;
}

function setupTouchListeners() {
    const joystickContainer = document.getElementById('joystick-container');
    const joystickKnob = document.getElementById('joystick-knob');
    const surgeBtn = document.getElementById('surge-btn');

    window.addEventListener('touchstart', (e) => {
        if (gameState === STATE.START) {
            startGame();
            return;
        }
        const touch = e.touches[0];
        // Only trigger joystick on the left half of the screen
        if (touch.clientX < window.innerWidth / 2) {
            touchState.active = true;
            touchState.origin = { x: touch.clientX, y: touch.clientY };
            
            joystickContainer.style.left = `${touch.clientX - 75}px`;
            joystickContainer.style.bottom = `${window.innerHeight - touch.clientY - 75}px`;
            joystickContainer.classList.add('active');
        }
    });

    window.addEventListener('touchmove', (e) => {
        if (!touchState.active) return;
        const touch = e.touches[0];
        const dx = touch.clientX - touchState.origin.x;
        const dy = touch.clientY - touchState.origin.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = 50;
        
        const ratio = Math.min(dist, maxDist) / maxDist;
        const angle = Math.atan2(dy, dx);
        
        touchState.vector = {
            x: Math.cos(angle) * ratio,
            y: Math.sin(angle) * ratio
        };
        
        const knobX = Math.cos(angle) * Math.min(dist, maxDist);
        const knobY = Math.sin(angle) * Math.min(dist, maxDist);
        joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    });

    window.addEventListener('touchend', (e) => {
        // Only clear if no touches remain to prevent multi-touch glitches
        if (e.touches.length === 0) {
            touchState.active = false;
            touchState.vector = { x: 0, y: 0 };
            joystickContainer.classList.remove('active');
            joystickKnob.style.transform = `translate(0px, 0px)`;
        }
    });

    // Touch Cancel (interrupted by phone call, etc)
    window.addEventListener('touchcancel', clearInputs);

    if (surgeBtn) {
        surgeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState === STATE.PLAYING) {
                const triggerNow = Date.now();
                if (triggerNow - player.lastDashTime > player.dashCooldown && !player.isDashing) {
                    startDash(player.lastDirection.x, player.lastDirection.y);
                }
            }
        });
    }
}

function startGame() {
    console.log("GAME STARTING: Link established.");
    gameState = STATE.PLAYING;
    hideScreens();
    lastSpawnTime = Date.now();
    
    const inst = document.getElementById('game-instructions');
    if (inst) inst.innerHTML = '<span class="accent">WASD</span> to MOVE | <span class="accent">SPACE</span> to DASH';
}

function showScreen(id) {
    hideScreens();
    const screen = document.getElementById(id);
    if (screen) {
        screen.style.display = 'flex';
        screen.style.opacity = '1';
        screen.style.visibility = 'visible';
    }
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
    const now = Date.now();
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
    if (now - lastSpawnTime > spawnRate) {
        spawnEnemy();
        lastSpawnTime = now;
        // Exponentially increase difficulty
        spawnRate = Math.max(minSpawnRate, spawnRate * 0.97);
    }

    // Combined Movement Logic (Keyboard + Touch)
    let moveDirX = 0;
    let moveDirY = 0;
    
    if (touchState.active) {
        moveDirX = touchState.vector.x;
        moveDirY = touchState.vector.y;
    } else {
        if (keys['KeyW'] || keys['ArrowUp']) moveDirY -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) moveDirY += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveDirX -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) moveDirX += 1;
    }

    if (moveDirX !== 0 || moveDirY !== 0) {
        // Normalize directional input (Touch vector is already normalized-ish by ratio)
        const mag = Math.hypot(moveDirX, moveDirY);
        const ux = moveDirX / mag;
        const uy = moveDirY / mag;
        
        // Use mag for analog-like movement on touch, otherwise 1.0 for keyboard
        const inputStrength = touchState.active ? mag : 1.0;
        
        player.walkVelocity.x += ux * player.walkSpeed * inputStrength;
        player.walkVelocity.y += uy * player.walkSpeed * inputStrength;
        
        // Store last movement vector for 360-degree dashing
        player.lastDirection = { x: ux, y: uy };
        
        // Face movement direction smoothly
        if (!player.isDashing) {
            const targetAngle = Math.atan2(uy, ux);
            let diff = targetAngle - player.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            player.angle += diff * 0.2;
        }
    }

    // Apply Friction
    player.walkVelocity.x *= player.walkFriction;
    player.walkVelocity.y *= player.walkFriction;

    // Cap Walk Speed
    const currentWalkSpeed = Math.hypot(player.walkVelocity.x, player.walkVelocity.y);
    if (currentWalkSpeed > player.maxWalkSpeed) {
        player.walkVelocity.x = (player.walkVelocity.x / currentWalkSpeed) * player.maxWalkSpeed;
        player.walkVelocity.y = (player.walkVelocity.y / currentWalkSpeed) * player.maxWalkSpeed;
    }

    // Apply Walking Position
    player.x += player.walkVelocity.x;
    player.y += player.walkVelocity.y;

    // Dash Trigger (Space)
    if (keys['Space'] && now - player.lastDashTime > player.dashCooldown && !player.isDashing) {
        // Dash in current movement direction or last direction if stationary
        const dashX = (moveDirX === 0 && moveDirY === 0) ? player.lastDirection.x : moveDirX;
        const dashY = (moveDirX === 0 && moveDirY === 0) ? player.lastDirection.y : moveDirY;
        
        startDash(dashX, dashY);
    }

    // Dash Velocity Update
    if (player.isDashing) {
        player.x += player.dashVelocity.x;
        player.y += player.dashVelocity.y;

        player.dashVelocity.x *= player.dashDecay;
        player.dashVelocity.y *= player.dashDecay;

        const currentDashSpeed = Math.hypot(player.dashVelocity.x, player.dashVelocity.y);
        if (currentDashSpeed < player.dashMinVelocity) {
            player.isDashing = false;
            player.dashVelocity = { x: 0, y: 0 };
        }
    }

    // Boundary checks
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Handle Enemies & Proximity
    let minEnemyDist = Infinity;
    
    // Efficiently track and check collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
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
            break; // Stop processing further enemies on death
        }
    }

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
    if (!player.particles) return;
    
    for (let i = player.particles.length - 1; i >= 0; i--) {
        const p = player.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        
        if (p.life <= 0) {
            player.particles.splice(i, 1);
        }
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
    try {
        const highScore = localStorage.getItem('dashHighScore') || 0;
        if (score > highScore) {
            localStorage.setItem('dashHighScore', score);
        }
    } catch (storageError) {
        console.warn("Storage access denied:", storageError);
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
    ctx.rotate(player.angle);
    
    if (player.isDashing) {
        const speed = Math.hypot(player.dashVelocity.x, player.dashVelocity.y);
        const stretch = 1 + speed / 40;
        
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
    try {
        update();
        draw();
    } catch (loopError) {
        console.error("Game Loop Execution Error:", loopError);
    }
    requestAnimationFrame(gameLoop);
}

// Immediate initialization (script is deferred)
init();
