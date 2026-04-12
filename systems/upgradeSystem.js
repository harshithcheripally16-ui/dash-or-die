import { state, STATE } from '../core/state.js';
import { showLevelUpScreen } from '../ui/uiManager.js';

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
    // Stub: Apply stats here in the future
    
    // Resume combat
    state.gameState = STATE.PLAYING;
}
