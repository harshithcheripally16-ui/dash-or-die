import { state, STATE } from '../core/state.js';
import { player } from '../entities/player.js';
import { canvas } from '../core/canvas.js';

export function showScreen(id) {
    hideScreens();
    const screen = document.getElementById(id);
    if (screen) {
        screen.style.display = 'flex';
        screen.style.opacity = '1';
        screen.style.visibility = 'visible';
    }
}

export function hideScreens() {
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over');
    if (startScreen) startScreen.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
}

export function updateInstructions(isInitialState) {
    const inst = document.getElementById('game-instructions');
    if (inst) {
        if (isInitialState) {
            inst.innerHTML = 'Press <span class="accent">ANY KEY</span> to INITIALIZE LINK';
        } else {
            inst.innerHTML = '<span class="accent">WASD</span> to MOVE | <span class="accent">SPACE</span> to DASH';
        }
    }
}

export function triggerGameOver() {
    state.gameState = STATE.GAMEOVER;
    state.effects.shake.intensity = 50;
    state.effects.flash = 1.0;
    
    const finalScoreVal = document.getElementById('final-score-val');
    if (finalScoreVal) {
        finalScoreVal.innerText = Math.floor(state.score / 10);
    }
    
    showScreen('game-over');
    
    // Debris particles
    if (canvas) { // Ensure canvas exists dynamically if needed, though usually globally safe
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
    }

    // Save High Score
    try {
        const highScore = localStorage.getItem('dashHighScore') || 0;
        if (state.score > highScore) {
            localStorage.setItem('dashHighScore', state.score);
        }
    } catch (storageError) {
        console.warn("Storage access denied:", storageError);
    }
}

export function updateHighScoreDisplay() {
    try {
        const highScore = localStorage.getItem('dashHighScore') || 0;
        const highScoreElement = document.getElementById('high-score-value');
        if (highScoreElement) {
            highScoreElement.innerText = Math.floor(highScore / 10);
        }
    } catch (e) {
        // Ignore storage errors on read
    }
}

export function updateScoreDisplay() {
    const scoreVal = document.getElementById('score-value');
    if (scoreVal) {
        scoreVal.innerText = Math.floor(state.score / 10);
    }
}

export function drawDebugOverlay(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    if (canvas) {
        ctx.fillText(`THR: ${state.enemies.length} | SYNC: ${Math.floor(state.score/10)} | LVL: ${state.xp.level} | XP: ${state.xp.current}/${state.xp.required}`, canvas.width - 20, canvas.height - 20);
    }
}

export function drawCollisionFlash(ctx) {
    if (state.effects.flash > 0.1 && canvas) {
        ctx.fillStyle = `rgba(139, 92, 246, ${state.effects.flash * 0.4})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        state.effects.flash *= 0.85;
    }
}
