import { state } from '../core/state.js';
import { canvas, ctx } from '../core/canvas.js';
import { player } from './player.js';

export function spawnEnemy() {
    if (!canvas) return;
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

    state.enemies.push({ 
        x, 
        y, 
        size, 
        speed: 1.2 + Math.random() * 1.5,
        pulse: 0,
        id: Math.random()
    });
}

export function drawEnemies() {
    if (!ctx) return;
    
    state.enemies.forEach(enemy => {
        try {
            enemy.pulse = (enemy.pulse + 0.1) % (Math.PI * 2);
            const glowSize = Math.sin(enemy.pulse) * 5 + 15;
            
            ctx.shadowBlur = glowSize;
            ctx.shadowColor = '#ef4444';
            ctx.fillStyle = '#ef4444';
            
            const glitchX = (Math.random() - 0.5) * 2;
            const glitchY = (Math.random() - 0.5) * 2;
            
            ctx.beginPath();
            ctx.roundRect(enemy.x + glitchX, enemy.y + glitchY, enemy.size, enemy.size, 4);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.2;
            ctx.fillRect(enemy.x + glitchX + 5, enemy.y + glitchY + 5, enemy.size - 10, enemy.size - 10);
            ctx.globalAlpha = 1.0;
        } catch (e) {
            console.warn("Enemy draw failed:", e);
        }
    });
}
