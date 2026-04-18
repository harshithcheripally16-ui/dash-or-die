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
            // 1. Default Colors (3)
            { id: 'white', hex: '#ffffff', name: 'CORE_LIGHT', req: 0, category: 'DEFAULT', effect: 'none' },
            { id: 'cyan_def', hex: '#22d3ee', name: 'CORE_CYAN', req: 0, category: 'DEFAULT', effect: 'none' },
            { id: 'green_def', hex: '#4ade80', name: 'CORE_GREEN', req: 0, category: 'DEFAULT', effect: 'none' },
            
            // 2. Glowing Colors (5)
            { id: 'neon_violet', hex: '#8b5cf6', name: 'NEON_VIOLET', req: 500, category: 'GLOWING', effect: 'pulse' },
            { id: 'neon_pink', hex: '#ec4899', name: 'NEON_PINK', req: 1500, category: 'GLOWING', effect: 'pulse' },
            { id: 'neon_amber', hex: '#f59e0b', name: 'NEON_GOLD', req: 3000, category: 'GLOWING', effect: 'pulse' },
            { id: 'neon_emerald', hex: '#10b981', name: 'NEON_SHARP', req: 5000, category: 'GLOWING', effect: 'pulse' },
            { id: 'neon_ice', hex: '#3b82f6', name: 'NEON_FROST', req: 7500, category: 'GLOWING', effect: 'pulse' },

            // 3. Cosmic Colors (3)
            { id: 'nebula', hex: '#a855f7', name: 'NEBULA_DRIFT', req: 15000, category: 'COSMIC', effect: 'cosmic' },
            { id: 'supernova', hex: '#f87171', name: 'SUPERNOVA', req: 25000, category: 'COSMIC', effect: 'cosmic' },
            { id: 'void_blue', hex: '#1d4ed8', name: 'VOID_DEPTH', req: 40000, category: 'COSMIC', effect: 'cosmic' },

            // 4. Ultimate Color (1)
            { id: 'singularity', hex: '#ffffff', name: 'SINGULARITY', req: 100000, category: 'ULTIMATE', effect: 'ultimate' }
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
