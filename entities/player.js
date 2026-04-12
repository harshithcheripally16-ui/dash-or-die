import { state } from '../core/state.js';
import { canvas, ctx } from '../core/canvas.js';
import { triggerGameOver } from '../ui/uiManager.js';

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const player = {
    x: 0,
    y: 0,
    size: 32,
    color: '#8b5cf6', // Will be synced on start
    walkSpeed: 1.8,
    walkFriction: 0.82,
    maxWalkSpeed: 6.5,
    walkVelocity: { x: 0, y: 0 },
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
    particles: [],
    magnetRadius: 150,
    voidBurst: false
};

// Start a dash
export function startDash(dx, dy) {
    const mag = Math.hypot(dx, dy);
    let ux = 1, uy = 0;
    
    if (mag > 0) {
        ux = dx / mag;
        uy = dy / mag;
    } else {
        ux = player.lastDirection.x;
        uy = player.lastDirection.y;
    }

    player.isDashing = true;
    player.dashVelocity = { 
        x: ux * player.dashSpeedInitial, 
        y: uy * player.dashSpeedInitial 
    };
    player.walkVelocity = { x: 0, y: 0 };
    player.lastDashTime = Date.now();
    player.angle = Math.atan2(uy, ux);
    
    // Add Dash Particles
    for (let i = 0; i < 20; i++) {
        player.particles.push({
            x: player.x + player.size / 2,
            y: player.y + player.size / 2,
            vx: -ux * (Math.random() * 10 + 5) + (Math.random() - 0.5) * 5,
            vy: -uy * (Math.random() * 10 + 5) + (Math.random() - 0.5) * 5,
            size: Math.random() * 6 + 2,
            life: 1.0
        });
    }

    // Effect triggers
    state.effects.shake.intensity = 15;
    const cooldownBar = document.getElementById('cooldown-bar');
    if (cooldownBar) {
        cooldownBar.style.width = '0%';
        cooldownBar.style.transition = 'none';
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                cooldownBar.style.width = '100%';
                cooldownBar.style.transition = `width ${player.dashCooldown}ms linear`;
            });
        });
    }
}

// Spawn destruction particles when an enemy is destroyed
export function spawnDestructionParticles(ex, ey) {
    for (let i = 0; i < 15; i++) {
        player.particles.push({
            x: ex,
            y: ey,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            size: Math.random() * 5 + 3,
            life: 1.2
        });
    }
}

// Trigger Void Burst Explosion
export function triggerVoidBurst(x, y) {
    // Visual explosion
    state.effects.flash = 0.8;
    state.effects.shake.intensity = 25;
    
    for (let i = 0; i < 40; i++) {
        player.particles.push({
            x: x + player.size / 2,
            y: y + player.size / 2,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            size: Math.random() * 8 + 4,
            life: 1.5
        });
    }

    // Kill enemies within radius
    const burstRadius = 250;
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        const dx = x - enemy.x;
        const dy = y - enemy.y;
        if (Math.hypot(dx, dy) < burstRadius) {
            state.score += 50;
            state.enemies.splice(i, 1);
            import('../systems/xpSystem.js').then(({ spawnOrb }) => {
                spawnOrb(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2);
            });
        }
    }
}

export function updatePlayerMovement(now, forwardInput, backwardInput) {
    // 1. Rotation Logic (Face Mouse)
    const centerX = player.x + player.size / 2;
    const centerY = player.y + player.size / 2;
    const targetAngle = Math.atan2(state.mousePos.y - centerY, state.mousePos.x - centerX);
    
    // Smooth rotation lerp
    let diff = targetAngle - player.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    player.angle += diff * 0.15; // Smooth face

    // 2. Locomotion Logic (W/S Forward/Backward)
    const moveDir = forwardInput ? 1 : (backwardInput ? -1 : 0);
    
    if (moveDir !== 0) {
        const ux = Math.cos(player.angle);
        const uy = Math.sin(player.angle);
        
        player.walkVelocity.x += ux * player.walkSpeed * moveDir;
        player.walkVelocity.y += uy * player.walkSpeed * moveDir;
        player.lastDirection = { x: ux, y: uy };
    }

    // Apply Friction & Caps
    player.walkVelocity.x *= Math.pow(player.walkFriction, state.timeScale);
    player.walkVelocity.y *= Math.pow(player.walkFriction, state.timeScale);

    const currentWalkSpeed = Math.hypot(player.walkVelocity.x, player.walkVelocity.y);
    if (currentWalkSpeed > player.maxWalkSpeed) {
        player.walkVelocity.x = (player.walkVelocity.x / currentWalkSpeed) * player.maxWalkSpeed;
        player.walkVelocity.y = (player.walkVelocity.y / currentWalkSpeed) * player.maxWalkSpeed;
    }

    player.x += player.walkVelocity.x * state.timeScale;
    player.y += player.walkVelocity.y * state.timeScale;

    // Dash Trigger (Space)
    if (state.keys['Space'] && now - player.lastDashTime > player.dashCooldown && !player.isDashing) {
        // Dash always follows the current facing angle
        startDash(Math.cos(player.angle), Math.sin(player.angle));
    }

    // Dash processing
    if (player.isDashing) {
        player.x += player.dashVelocity.x * state.timeScale;
        player.y += player.dashVelocity.y * state.timeScale;

        player.dashVelocity.x *= Math.pow(player.dashDecay, state.timeScale);
        player.dashVelocity.y *= Math.pow(player.dashDecay, state.timeScale);

        const currentDashSpeed = Math.hypot(player.dashVelocity.x, player.dashVelocity.y);
        if (currentDashSpeed < player.dashMinVelocity) {
            if (player.voidBurst) {
                triggerVoidBurst(player.x, player.y);
            }
            player.isDashing = false;
            player.dashVelocity = { x: 0, y: 0 };
        }
    }

    // Border Collision
    if (canvas) {
        player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
        player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
    }
}

export function updatePlayerEffects() {
    // Add to trail
    player.trail.push({ 
        x: player.x, 
        y: player.y, 
        opacity: 0.6,
        scale: player.isDashing ? 1.0 : 0.8
    });
    
    if (player.trail.length > (player.isDashing ? 12 : 6)) {
        player.trail.shift();
    }
    
    player.trail.forEach(p => {
        p.opacity -= player.isDashing ? 0.05 : 0.1;
        p.scale *= 0.92; 
    });

    // Particles
    for (let i = player.particles.length - 1; i >= 0; i--) {
        const p = player.particles[i];
        p.x += p.vx * state.timeScale;
        p.y += p.vy * state.timeScale;
        p.life -= 0.02 * state.timeScale;
        
        if (p.life <= 0) {
            player.particles.splice(i, 1);
        }
    }
}

export function drawPlayer() {
    if (!ctx) return;
    
    // Draw Trail (Motion Blur)
    player.trail.forEach((p, index) => {
        const ratio = (index + 1) / player.trail.length;
        ctx.globalAlpha = p.opacity * ratio;
        ctx.fillStyle = state.settings.color;
        
        const drawSize = player.size * p.scale;
        const offset = (player.size - drawSize) / 2;
        
        ctx.beginPath();
        if (player.isDashing) {
            // During dash, trail is more stretched
            const speed = Math.hypot(player.dashVelocity.x, player.dashVelocity.y);
            const stretch = 1 + (speed / 30) * ratio;
            ctx.save();
            ctx.translate(p.x + player.size / 2, p.y + player.size / 2);
            ctx.rotate(player.angle);
            ctx.roundRect(-drawSize / 2 * stretch, -drawSize / 2, drawSize * stretch, drawSize, 6);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.roundRect(p.x + offset, p.y + offset, drawSize, drawSize, 4);
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1.0;

    // Draw Particles
    player.particles.forEach(p => {
        const opacity = Math.max(0, p.life);
        ctx.fillStyle = hexToRgba(state.settings.color, opacity);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.size * p.life), 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Player Body
    ctx.save();
    ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
    ctx.rotate(player.angle);
    
    if (player.isDashing) {
        const speed = Math.hypot(player.dashVelocity.x, player.dashVelocity.y);
        const stretch = 1 + speed / 40;
        
        for (let i = 0; i < 4; i++) {
            ctx.globalAlpha = Math.max(0, 0.2 - i * 0.05);
            ctx.fillStyle = state.settings.color;
            ctx.fillRect(-(player.size / 2) - i * 15, -player.size / 2, player.size, player.size);
        }
        ctx.globalAlpha = 1.0;
        ctx.scale(stretch, 1 / stretch);
    }

    ctx.shadowBlur = 25;
    ctx.shadowColor = state.settings.color;
    ctx.fillStyle = state.settings.color;
    
    ctx.beginPath();
    ctx.roundRect(-player.size / 2, -player.size / 2, player.size, player.size, 8);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(-player.size / 2, -player.size / 2, player.size, player.size / 2.5, [8, 8, 0, 0]);
    ctx.fill();
    ctx.restore();
}
