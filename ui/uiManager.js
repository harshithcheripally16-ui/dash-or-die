import { state, STATE } from '../core/state.js';
import { player } from '../entities/player.js';
import { canvas } from '../core/canvas.js';
import { selectUpgrade } from '../systems/upgradeSystem.js';
import { drawFloatingTexts } from './textEffects.js';

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
    const pauseScreen = document.getElementById('pause-screen');
    if (startScreen) startScreen.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    if (levelUpScreen) levelUpScreen.style.display = 'none';
    if (pauseScreen) pauseScreen.style.display = 'none';
}

export function showLevelUpScreen(choices = []) {
    hideScreens();
    const screen = document.getElementById('levelup-screen');
    const container = document.getElementById('upgrade-options');
    
    if (screen && container && choices.length > 0) {
        screen.style.display = 'flex';
        screen.style.opacity = '1';
        screen.style.visibility = 'visible';
        
        container.innerHTML = '';
        
        choices.forEach((choice, index) => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.tabIndex = 0;
            card.innerHTML = `
                <div class="upgrade-icon">${choice.icon}</div>
                <h3>${choice.name}</h3>
                <p>${choice.desc}</p>
            `;
            
            const handleSelect = (e) => {
                if (e.type === 'keydown' && e.code !== 'Enter' && e.code !== 'Space') return;
                e.preventDefault();
                selectUpgrade(choice.id);
                hideScreens();
                if (canvas) canvas.focus();
            };

            card.addEventListener('click', handleSelect);
            card.addEventListener('touchstart', handleSelect, { passive: false });
            card.addEventListener('keydown', handleSelect);
            
            container.appendChild(card);
        });
        
        // Auto-focus the first card for keyboard users
        const cards = document.querySelectorAll('.upgrade-card');
        if (cards.length > 0) {
            cards[0].focus();
        }
    }
}

export function updateInstructions(isInitialState) {
    const inst = document.getElementById('game-instructions');
    if (inst) {
        if (isInitialState) {
            inst.innerHTML = '<span class="accent">CLICK</span> to INITIALIZE LINK';
        } else {
            inst.innerHTML = '<span class="accent">WASD</span> to MOVE | <span class="accent">SPACE</span> to DASH';
        }
    }
}

export function triggerGameOver() {
    if (state.gameState === STATE.DYING || state.gameState === STATE.GAMEOVER) return;
    
    state.gameState = STATE.DYING;
    state.effects.shake.intensity = 50;
    state.effects.flash = 1.0;
    state.effects.zoom = 1.25;

    // Trigger Cinematic Vignette
    const vignette = document.getElementById('vignette');
    if (vignette) vignette.classList.add('cinematic-active');

    // Debris particles
    if (player.particles) {
        for (let i = 0; i < 40; i++) {
            player.particles.push({
                x: player.x + player.size / 2,
                y: player.y + player.size / 2,
                vx: (Math.random() - 0.5) * 25,
                vy: (Math.random() - 0.5) * 25,
                size: Math.random() * 8 + 4,
                life: 2.0
            });
        }
    }

    // Delay the final UI presentation
    setTimeout(() => {
        if (state.gameState !== STATE.DYING) return;
        
        state.gameState = STATE.GAMEOVER;
        
        const finalScoreVal = document.getElementById('final-score-val');
        if (finalScoreVal) {
            finalScoreVal.innerText = Math.floor(state.score / 10);
        }
        
        showScreen('game-over');
        
        // Finalize High Score
        try {
            const highScore = localStorage.getItem('dashHighScore') || 0;
            if (state.score > highScore) {
                localStorage.setItem('dashHighScore', state.score);
            }
        } catch (storageError) { /* ignore */ }
    }, 1800);
}

export function togglePause() {
    if (state.gameState === STATE.PLAYING) {
        state.gameState = STATE.PAUSED;
        const pauseScore = document.getElementById('pause-score');
        if (pauseScore) pauseScore.innerText = Math.floor(state.score / 10);
        showScreen('pause-screen');
    } else if (state.gameState === STATE.PAUSED) {
        resumeGame();
    }
}

export function resumeGame() {
    state.gameState = STATE.PLAYING;
    hideScreens();
    if (canvas) canvas.focus();
}

/**
 * Initializes the start menu settings (color picking, theme toggle)
 */
export function setupStartMenu() {
    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', state.settings.theme);
            themeBtn.innerText = state.settings.theme === 'dark' ? 'DARK_MODE' : 'LIGHT_MODE';
        });
    }

    // Color Selection
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const color = opt.getAttribute('data-color');
            state.settings.color = color;
            
            // Highlight selection
            colorOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            
            // Update preview if any
            const preview = document.querySelector('.player-preview');
            if (preview) preview.style.background = color;
        });
    });

    // Pause UI elements
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);

    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);

    const pauseRestartBtn = document.getElementById('pause-restart-btn');
    if (pauseRestartBtn) {
        pauseRestartBtn.addEventListener('click', () => {
            location.reload(); // Hard reset for menu restart or link to resetGame logic
        });
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
    updateHUD();
}

/**
 * Updates all HUD elements (Score, Level, XP Bar)
 */
export function updateHUD() {
    // Score
    const scoreVal = document.getElementById('score-value');
    if (scoreVal) {
        scoreVal.innerText = Math.floor(state.score / 10);
    }

    // Level
    const levelVal = document.getElementById('hud-level');
    if (levelVal) {
        levelVal.innerText = `LVL: ${state.xp.level}`;
    }

    // XP Bar & Text
    const xpBar = document.getElementById('xp-bar');
    const xpText = document.getElementById('hud-xp-text');
    if (xpBar && xpText) {
        const percent = (state.xp.current / state.xp.required) * 100;
        xpBar.style.width = `${percent}%`;
        xpText.innerText = `XP: ${state.xp.current} / ${state.xp.required}`;
    }
}

export function drawDebugOverlay(ctx) {
    // Debug info moved to HUD, leaving only dev metrics
    if (!canvas || !state.debug) return;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(`THR: ${state.enemies.length} | SYNC: ${Math.floor(state.score/10)}`, canvas.width - 20, canvas.height - 20);
}

export function drawCollisionFlash(ctx) {
    if (state.effects.flash > 0.01 && canvas) {
        // Impact flash (white-out starting)
        const alpha = state.effects.flash;
        ctx.save();
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = 'var(--accent-color)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        state.effects.flash *= 0.88;
    }
}
