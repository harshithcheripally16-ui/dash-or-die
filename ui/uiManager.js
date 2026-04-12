import { state, STATE } from '../core/state.js';
import { player } from '../entities/player.js';
import { canvas } from '../core/canvas.js';
import { selectUpgrade } from '../systems/upgradeSystem.js';

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
    const levelUpScreen = document.getElementById('levelup-screen');
    if (startScreen) startScreen.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    if (levelUpScreen) levelUpScreen.style.display = 'none';
}

export function showLevelUpScreen() {
    hideScreens();
    const screen = document.getElementById('levelup-screen');
    if (screen) {
        screen.style.display = 'flex';
        screen.style.opacity = '1';
        screen.style.visibility = 'visible';
        
        // Bind full accessibility and click listeners
        const cards = document.querySelectorAll('.upgrade-card');
        cards.forEach((card, index) => {
            // Remove old listeners by cloning
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            const handleSelect = (e) => {
                if (e.type === 'keydown' && e.code !== 'Enter' && e.code !== 'Space') return;
                e.preventDefault();
                selectUpgrade(`mock_upgrade_${index}`);
                hideScreens();
                if (canvas) canvas.focus(); // Return focus to game
            };

            newCard.addEventListener('click', handleSelect);
            newCard.addEventListener('touchstart', handleSelect, { passive: false });
            newCard.addEventListener('keydown', handleSelect);
        });
        
        // Auto-focus the first card for keyboard users
        if (cards.length > 0) {
            document.querySelectorAll('.upgrade-card')[0].focus();
        }
    }
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
