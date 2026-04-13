export const STATE = {
    SPLASH: 'splash',
    START: 'start',
    PLAYING: 'playing',
    DYING: 'dying',
    GAMEOVER: 'gameover',
    LEVELUP: 'levelup',
    PAUSED: 'paused'
};

export const state = {
    gameState: STATE.SPLASH,
    hasInitialSplashPlayed: false,
    settings: {
        color: '#8b5cf6',
        theme: 'dark',
        unlockedColors: ['#8b5cf6'],
        colorCatalog: [
            { id: 'classic', hex: '#8b5cf6', name: 'Classic Violet', req: 0 },
            { id: 'cyan', hex: '#67e8f9', name: 'Cyan Surge', req: 1000 },
            { id: 'emerald', hex: '#2dd4bf', name: 'Emerald Edge', req: 5000 },
            { id: 'purple', hex: '#a855f7', name: 'Royal Pulse', req: 10000 },
            { id: 'orange', hex: '#fb923c', name: 'Solar Flare', req: 15000 },
            { id: 'crimson', hex: '#ef4444', name: 'Crimson Crisis', req: 25000 }
        ]
    },
    mousePos: { x: 0, y: 0 },
    timeScale: 1.0,
    dyingProgress: 0,
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
        proximity: 0,
        zoom: 1.0
    },
    texts: []
};

export function resetGameState() {
    state.enemies = [];
    state.orbs = [];
    state.texts = [];
    state.score = 0;
    state.xp = { current: 0, required: 100, level: 1 };
    state.spawnRate = 1500;
    state.lastSpawnTime = Date.now();
    state.effects.flash = 0;
    state.effects.shake.intensity = 0;
    state.effects.zoom = 1.0;
    state.timeScale = 1.0;
    state.dyingProgress = 0;
}
