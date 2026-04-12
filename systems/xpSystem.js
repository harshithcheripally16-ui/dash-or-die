import { state } from '../core/state.js';
import { player } from '../entities/player.js';
import { triggerLevelUp } from './upgradeSystem.js';

export function setupXPSystem() {
    console.log("XP System active.");
}

export function spawnOrb(x, y) {
    state.orbs.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: 8,
        pulseOffset: Math.random() * Math.PI * 2,
        magnetized: false
    });
}

export function updateXPSystem() {
    const collectionRadius = player.size / 2 + 10;
    const magnetForce = 0.8;
    const friction = 0.9;

    for (let i = state.orbs.length - 1; i >= 0; i--) {
        const orb = state.orbs[i];
        
        // Basic physics / Float
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.vx *= friction;
        orb.vy *= friction;

        const dx = (player.x + player.size / 2) - orb.x;
        const dy = (player.y + player.size / 2) - orb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Magnet logic
        if (dist < player.magnetRadius) {
            orb.magnetized = true;
            orb.vx += (dx / dist) * magnetForce;
            orb.vy += (dy / dist) * magnetForce;
        }

        // Collection logic
        if (dist < collectionRadius) {
            state.xp.current += 10;
            state.orbs.splice(i, 1);
            
            // Basic UI flash or sound could go here
            if (state.xp.current >= state.xp.required) {
                // Level Up Trigger!
                state.xp.current -= state.xp.required;
                state.xp.level++;
                state.xp.required = Math.floor(state.xp.required * 1.5);
                console.log(`LEVEL UP! Now level ${state.xp.level}`);
                
                // Add a visual flash and hit stop
                state.effects.flash = 0.8;
                state.effects.shake.intensity = 20;
                
                // Pause game and invoke UI
                triggerLevelUp();
            }
        }
    }
}

export function drawXpOrbs(ctx) {
    if (!ctx) return;
    
    const time = Date.now() / 200;
    
    state.orbs.forEach(orb => {
        const pulse = Math.sin(time + orb.pulseOffset) * 2;
        const currentSize = orb.size + pulse;

        ctx.shadowBlur = 15;
        ctx.shadowColor = orb.magnetized ? '#22d3ee' : '#fde047'; // Cyan when moving to player, yellow when static
        
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, Math.max(2, currentSize), 0, Math.PI * 2);
        ctx.fillStyle = orb.magnetized ? '#67e8f9' : '#fef08a';
        ctx.fill();
        
        // Inner core
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, Math.max(1, currentSize / 2), 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    });
}
