import { state, STATE, resetGameState } from './state.js';
import { canvas, ctx, initCanvas, resizeCanvas, drawGrid } from './canvas.js';
import { setupInput } from './input.js';
import { player, updatePlayerMovement, updatePlayerEffects, drawPlayer } from '../entities/player.js';
import { spawnEnemy, drawEnemies } from '../entities/enemy.js';
import { updateEnemiesAndCollisions } from '../systems/collision.js';
import { updateXPSystem } from '../systems/xpSystem.js';
import { showScreen, hideScreens, updateInstructions, triggerGameOver, updateHighScoreDisplay, updateScoreDisplay, drawDebugOverlay, drawCollisionFlash } from '../ui/uiManager.js';

let lastTime = 0;

export function init() {
    initCanvas();
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
    
    // UI Bindings
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.addEventListener('click', startGame);
    
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.addEventListener('click', () => {
        resetGame();
        startGame();
    });

    setupInput({
        onStart: startGame,
        onReset: resetGame
    });
    
    gameLoop(0);
}

export function startGame() {
    console.log("GAME STARTING: Link established.");
    state.gameState = STATE.PLAYING;
    hideScreens();
    state.lastSpawnTime = Date.now();
    
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
    
    const gameOverScreen = document.getElementById('game-over');
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    
    updateInstructions(true);
    updateHighScoreDisplay();
}

function update() {
    const now = Date.now();
    
    if (state.gameState !== STATE.PLAYING) {
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

    let moveDirX = 0;
    let moveDirY = 0;
    
    if (state.touchState.active) {
        moveDirX = state.touchState.vector.x;
        moveDirY = state.touchState.vector.y;
    } else {
        if (state.keys['KeyW'] || state.keys['ArrowUp']) moveDirY -= 1;
        if (state.keys['KeyS'] || state.keys['ArrowDown']) moveDirY += 1;
        if (state.keys['KeyA'] || state.keys['ArrowLeft']) moveDirX -= 1;
        if (state.keys['KeyD'] || state.keys['ArrowRight']) moveDirX += 1;
    }

    updatePlayerMovement(now, moveDirX, moveDirY);
    updatePlayerEffects();
    
    updateEnemiesAndCollisions(triggerGameOver);
    updateXPSystem();

    state.score++;
    
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
    if (state.effects.shake.intensity > 0.1) {
        ctx.translate(state.effects.shake.x, state.effects.shake.y);
    }

    drawGrid();
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
