import { state } from '../core/state.js';
import { canvas, ctx } from '../core/canvas.js';
import { triggerGameOver } from '../ui/uiManager.js';

export const player = {
    x: 0,
    y: 0,
    size: 32,
    color: '#8b5cf6',
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
    particles: []
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

export function updatePlayerMovement(now, moveDirX, moveDirY) {
    if (moveDirX !== 0 || moveDirY !== 0) {
        const mag = Math.hypot(moveDirX, moveDirY);
        const ux = moveDirX / mag;
        const uy = moveDirY / mag;
        
        const inputStrength = state.touchState.active ? mag : 1.0;
        
        player.walkVelocity.x += ux * player.walkSpeed * inputStrength;
        player.walkVelocity.y += uy * player.walkSpeed * inputStrength;
        player.lastDirection = { x: ux, y: uy };
        
        if (!player.isDashing) {
            const targetAngle = Math.atan2(uy, ux);
            let diff = targetAngle - player.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            player.angle += diff * 0.2;
        }
    }

    // Apply Friction & Caps
    player.walkVelocity.x *= player.walkFriction;
    player.walkVelocity.y *= player.walkFriction;

    const currentWalkSpeed = Math.hypot(player.walkVelocity.x, player.walkVelocity.y);
    if (currentWalkSpeed > player.maxWalkSpeed) {
        player.walkVelocity.x = (player.walkVelocity.x / currentWalkSpeed) * player.maxWalkSpeed;
        player.walkVelocity.y = (player.walkVelocity.y / currentWalkSpeed) * player.maxWalkSpeed;
    }

    player.x += player.walkVelocity.x;
    player.y += player.walkVelocity.y;

    // Dash Trigger (Space)
    if (state.keys['Space'] && now - player.lastDashTime > player.dashCooldown && !player.isDashing) {
        const dashX = (moveDirX === 0 && moveDirY === 0) ? player.lastDirection.x : moveDirX;
        const dashY = (moveDirX === 0 && moveDirY === 0) ? player.lastDirection.y : moveDirY;
        startDash(dashX, dashY);
    }

    // Dash processing
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
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        
        if (p.life <= 0) {
            player.particles.splice(i, 1);
        }
    }
}

export function drawPlayer() {
    if (!ctx) return;
    
    // Draw Trail
    player.trail.forEach((p) => {
        ctx.fillStyle = `rgba(99, 102, 241, ${Math.max(0, p.opacity)})`;
        const drawSize = player.size * p.scale;
        const offset = (player.size - drawSize) / 2;
        ctx.fillRect(p.x + offset, p.y + offset, drawSize, drawSize);
    });

    // Draw Particles
    player.particles.forEach(p => {
        ctx.fillStyle = `rgba(139, 92, 246, ${Math.max(0, p.life)})`;
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
            ctx.fillStyle = player.color;
            ctx.fillRect(-(player.size / 2) - i * 15, -player.size / 2, player.size, player.size);
        }
        ctx.globalAlpha = 1.0;
        ctx.scale(stretch, 1 / stretch);
    }

    ctx.shadowBlur = 25;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    
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
