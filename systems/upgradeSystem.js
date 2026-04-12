import { state, STATE } from '../core/state.js';
import { showLevelUpScreen } from '../ui/uiManager.js';
import { player } from '../entities/player.js';

export function setupUpgradeSystem() {
    console.log("Upgrade System initialized.");
}

export function triggerLevelUp() {
    // Freeze the game loop physics
    state.gameState = STATE.LEVELUP;
    showLevelUpScreen();
}

export function selectUpgrade(upgradeId) {
    console.log(`Upgrade Selected: ${upgradeId}`);
    
    // index 0: Overclock Dash
    if (upgradeId.includes('0')) {
        player.dashSpeedInitial *= 1.15;
        player.dashCooldown *= 0.85;
    }
    // index 1: Vacuum Array
    else if (upgradeId.includes('1')) {
        player.magnetRadius += 50;
    }
    // index 2: Void Burst
    else if (upgradeId.includes('2')) {
        player.voidBurst = true;
    }
    
    // Resume combat
    state.gameState = STATE.PLAYING;
}
