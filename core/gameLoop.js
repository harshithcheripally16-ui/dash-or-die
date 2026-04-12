import { state, STATE, resetGameState } from './state.js';
import { canvas, ctx, initCanvas, resizeCanvas, drawGrid } from './canvas.js';
import { setupInput } from './input.js';
import { player, updatePlayerMovement, updatePlayerEffects, drawPlayer } from '../entities/player.js';
import { spawnEnemy, drawEnemies } from '../entities/enemy.js';
import { updateEnemiesAndCollisions } from '../systems/collision.js';
import { updateXPSystem, drawXpOrbs } from '../systems/xpSystem.js';
import { updateFloatingTexts, drawFloatingTexts } from '../ui/textEffects.js';
import { showScreen, hideScreens, updateInstructions, triggerGameOver, updateHighScoreDisplay, updateScoreDisplay, updateHUD, drawDebugOverlay, drawCollisionFlash, togglePause, setupStartMenu, initSplashScreen } from '../ui/uiManager.js';

let lastTime = 0;

export function init() {
    initCanvas();
    
    try {
        initSplashScreen();
        resizeCanvas();
        if (canvas) canvas.focus();
    } catch (e) {
        // Silent fail
    }
    
    window.addEventListener('resize', () => {
        try { resizeCanvas(); } catch (e) { /* ignore */ }
    });
    
    // UI Bindings
    const startBtn = document.getElementById('start-btn');
    const handleStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        startGame();
    };
    if (startBtn) {
        startBtn.addEventListener('click', handleStart);
        startBtn.addEventListener('touchstart', handleStart, { passive: false });
    }
    
    const restartBtn = document.getElementById('restart-btn');
    const handleRestart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        resetGame();
        startGame();
    };
    if (restartBtn) {
        restartBtn.addEventListener('click', handleRestart);
        restartBtn.addEventListener('touchstart', handleRestart, { passive: false });
    }

    setupInput({
        onStart: startGame,
        onReset: resetGame,
        onPause: togglePause
    });

    setupStartMenu();
    
    // Global Pause Key
    window.addEventListener('keydown', (e) => {
        if ((e.code === 'Escape' || e.code === 'KeyP') && state.gameState === STATE.PLAYING) {
            togglePause();
        }
    });
    
    gameLoop(0);
}

export function startGame() {
    state.gameState = STATE.PLAYING;
    hideScreens();
    state.lastSpawnTime = Date.now();
    
    // Sync settings
    player.color = state.settings.color;
    
    updateHUD();
    updateInstructions(false);
    
    // Spawn first wave
    for(let i=0; i<3; i++) spawnEnemy();
}

export function resetGame() {
    if (canvas) {
        player.x = canvas.width / 2 - player.size / 2;
        player.y = canvas.height / 2 - player.size / 2;
    }
    player.isDashing = false;
    player.trail = [];
    player.particles = [];
    player.walkVelocity = { x: 0, y: 0 };
    player.dashVelocity = { x: 0, y: 0 };
    
    resetGameState();
    state.timeScale = 1.0;
    state.dyingProgress = 0;
    
    // Reset cinematic effects
    const v = document.getElementById('vignette');
    if (v) v.classList.remove('cinematic-active');
    
    const gameOverScreen = document.getElementById('game-over');
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    
    updateInstructions(true);
    updateHighScoreDisplay();
}

function update() {
    const now = Date.now();
    const gameDelta = state.timeScale;
    
    if (state.gameState === STATE.PAUSED) return;

    if (state.gameState === STATE.SPLASH) return;

    if (state.gameState !== STATE.PLAYING && state.gameState !== STATE.DYING) {
        state.effects.shake.intensity *= 0.9;
        state.effects.shake.x = (Math.random() - 0.5) * state.effects.shake.intensity;
        state.effects.shake.y = (Math.random() - 0.5) * state.effects.shake.intensity;
        state.effects.flash *= 0.85;

        if (state.gameState === STATE.START && canvas) {
            player.x = canvas.width / 2 - player.size / 2;
            player.y = canvas.height / 2 - player.size / 2;
        }

        updatePlayerEffects();
        return;
    }

    state.effects.shake.intensity *= 0.9;
    state.effects.shake.x = (Math.random() - 0.5) * state.effects.shake.intensity;
    state.effects.shake.y = (Math.random() - 0.5) * state.effects.shake.intensity;
    state.effects.flash *= 0.85;

    if (now - state.lastSpawnTime > state.spawnRate) {
        spawnEnemy();
        state.lastSpawnTime = now;
        state.spawnRate = Math.max(state.minSpawnRate, state.spawnRate * 0.97);
    }

    // Decay/Sync effects
    state.effects.shake.intensity *= 0.9;
    state.effects.shake.x = (Math.random() - 0.5) * state.effects.shake.intensity;
    state.effects.shake.y = (Math.random() - 0.5) * state.effects.shake.intensity;
    state.effects.zoom += (1.0 - state.effects.zoom) * 0.1;

    // Time Dilation logic
    if (state.gameState === STATE.DYING) {
        state.timeScale += (0.05 - state.timeScale) * 0.05; // Lerp to slomo
        state.dyingProgress += 0.01;
    } else {
        state.timeScale = 1.0;
    }

    let moveDirX = 0;
    let moveDirY = 0;
    
    if (state.gameState === STATE.PLAYING) {
        if (state.touchState.active) {
            // Priority: Joystick handles full 360 vectors
            moveDirX = state.touchState.vector.x;
            moveDirY = state.touchState.vector.y;
        } else {
            // Desktop: Combined WASD vectors
            if (state.keys['KeyW'] || state.keys['ArrowUp']) moveDirY -= 1;
            if (state.keys['KeyS'] || state.keys['ArrowDown']) moveDirY += 1;
            if (state.keys['KeyA'] || state.keys['ArrowLeft']) moveDirX -= 1;
            if (state.keys['KeyD'] || state.keys['ArrowRight']) moveDirX += 1;
            
            // Normalize desktop diagonal movement
            if (moveDirX !== 0 || moveDirY !== 0) {
                const mag = Math.hypot(moveDirX, moveDirY);
                moveDirX /= mag;
                moveDirY /= mag;
            }
        }
    }

    updatePlayerMovement(now, moveDirX, moveDirY);
    updatePlayerEffects();
    
    // Scale existing update systems by gameDelta inside their logic or here
    updateEnemiesAndCollisions(triggerGameOver);
    updateXPSystem();
    updateFloatingTexts(0.016 * gameDelta);

    if (state.gameState === STATE.PLAYING) state.score++;
    
    if (state.score % 10 === 0) {
        updateScoreDisplay();
        const scoreVal = document.getElementById('score-value');
        if (scoreVal && state.score % 100 === 0) {
            scoreVal.classList.remove('pulse-milestone');
            void scoreVal.offsetWidth;
            scoreVal.classList.add('pulse-milestone');
            state.effects.flash = 0.3;
        }
    }
}

function draw() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    
    // Global transformations (Shake + Zoom)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.scale(state.effects.zoom, state.effects.zoom);
    ctx.translate(-centerX, -centerY);

    if (state.effects.shake.intensity > 0.1) {
        ctx.translate(state.effects.shake.x, state.effects.shake.y);
    }

    drawGrid();
    drawXpOrbs(ctx);
    drawFloatingTexts(ctx);
    drawPlayer();
    drawEnemies();
    
    ctx.restore();

    drawCollisionFlash(ctx);
    drawDebugOverlay(ctx);
}

function gameLoop(timestamp) {
    try {
        update();
        draw();
    } catch (loopError) {
        console.error("Game Loop Execution Error:", loopError);
    }
    requestAnimationFrame(gameLoop);
}
