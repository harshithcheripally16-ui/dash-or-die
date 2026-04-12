import { init } from './core/gameLoop.js';

// Initialize the game engine immediately when the module loads
try {
    init();
} catch (criticalError) {
    console.error("CRITICAL SYSTEM FAILURE:", criticalError);
}
