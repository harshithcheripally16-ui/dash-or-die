import { state } from '../core/state.js';
import { player, spawnDestructionParticles } from '../entities/player.js';
import { spawnOrb } from './xpSystem.js';
import { spawnFloatingText } from '../ui/textEffects.js';

export function updateEnemiesAndCollisions(onGameOver) {
    let minEnemyDist = Infinity;
    
    // Process backwards to allow safe removal if needed (though splicing is usually deferred or managed)
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minEnemyDist) minEnemyDist = dist;

        if (dist > 0.1) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }

        // Near Miss Shake
        if (dist < 80 && !player.isDashing) {
            state.effects.shake.intensity = Math.max(state.effects.shake.intensity, 5);
        }

        // AABB Collision Check
        if (player.x < enemy.x + enemy.size &&
            player.x + player.size > enemy.x &&
            player.y < enemy.y + enemy.size &&
            player.y + player.size > enemy.y) {
            
            if (player.isDashing) {
                // Lethal Dash Kill
                state.score += 50; 
                state.effects.shake.intensity = Math.max(state.effects.shake.intensity, 18);
                state.effects.flash = 0.5;
                state.effects.zoom = 1.05;
                spawnDestructionParticles(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2);
                
                // Safely remove the enemy
                const ex = enemy.x + enemy.size / 2;
                const ey = enemy.y + enemy.size / 2;
                state.enemies.splice(i, 1);
                
                // Spawn XP orb at the center of the enemy
                spawnOrb(ex, ey);
                
                // Spawn Floating Score
                spawnFloatingText(ex, ey, "+50", "var(--accent-color)");
            } else {
                // Defensive Hit (Game Over)
                if (onGameOver) onGameOver();
                break;
            }
        }
    }
}
