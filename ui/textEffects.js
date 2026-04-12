import { state } from '../core/state.js';

/**
 * Spawns a floating text effect in world space.
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} text - Message to display
 * @param {string} color - CSS color
 */
export function spawnFloatingText(x, y, text, color = '#ffffff') {
    state.texts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        alpha: 1.0,
        yVel: -1.5, // Float upwards
        life: 1.5   // Seconds
    });
}

/**
 * Updates floating text physics and decay.
 * @param {number} deltaTime - Time since last frame
 */
export function updateFloatingTexts(deltaTime = 0.016) {
    for (let i = state.texts.length - 1; i >= 0; i--) {
        const t = state.texts[i];
        t.y += t.yVel;
        t.life -= deltaTime;
        t.alpha = Math.max(0, t.life / 1.5);

        if (t.life <= 0) {
            state.texts.splice(i, 1);
        }
    }
}

/**
 * Draws all currently active floating texts.
 * @param {CanvasRenderingContext2D} ctx 
 */
export function drawFloatingTexts(ctx) {
    if (!ctx) return;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Inter';
    
    state.texts.forEach(t => {
        ctx.globalAlpha = t.alpha;
        
        // Shadow for readability
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
        
        // Reset shadow
        ctx.shadowBlur = 0;
    });
    
    ctx.globalAlpha = 1.0;
}
