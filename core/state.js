export const STATE = {
    START: 'start',
    PLAYING: 'playing',
    GAMEOVER: 'gameover'
};

export const state = {
    gameState: STATE.START,
    score: 0,
    lastSpawnTime: 0,
    spawnRate: 1500,
    minSpawnRate: 400,
    enemies: [],
    orbs: [],
    xp: { current: 0, required: 100, level: 1 },
    keys: {},
    touchState: {
        active: false,
        origin: { x: 0, y: 0 },
        vector: { x: 0, y: 0 }
    },
    effects: {
        shake: { x: 0, y: 0, intensity: 0 },
        flash: 0,
        proximity: 0
    }
};

export function resetGameState() {
    state.enemies = [];
    state.orbs = [];
    state.score = 0;
    state.xp = { current: 0, required: 100, level: 1 };
    state.spawnRate = 1500;
    state.lastSpawnTime = Date.now();
    state.effects.flash = 0;
    state.effects.shake.intensity = 0;
}
