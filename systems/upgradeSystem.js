import { state, STATE } from '../core/state.js';
import { showLevelUpScreen } from '../ui/uiManager.js';
import { player } from '../entities/player.js';

export const UPGRADE_POOL = [
    { id: 'dashSpeed', name: 'Dash Boost', desc: 'Increase dash distance and speed by 10%', icon: '🚀' },
    { id: 'cooldown', name: 'Coolant Flush', desc: 'Reduce dash cooldown by 15%', icon: '❄️' },
    { id: 'magnet', name: 'XP Magnet', desc: 'Increase orb attraction radius by 30px', icon: '🧲' }
];

export function setupUpgradeSystem() {
    // Initialized
}

export function triggerLevelUp() {
    state.gameState = STATE.LEVELUP;
    // Get 3 random choices (repeats allowed)
    const choices = [];
    for (let i = 0; i < 3; i++) {
        choices.push(UPGRADE_POOL[Math.floor(Math.random() * UPGRADE_POOL.length)]);
    }
    showLevelUpScreen(choices);
}

export function selectUpgrade(upgradeId) {
    // Processing upgrade:
    
    switch(upgradeId) {
        case 'dashSpeed':
            player.dashSpeedInitial *= 1.10;
            break;
        case 'cooldown':
            player.dashCooldown = Math.max(100, player.dashCooldown * 0.85); // Cap at 100ms
            break;
        case 'magnet':
            player.magnetRadius += 30;
            break;
    }
    
    // Resume combat
    state.gameState = STATE.PLAYING;
}
