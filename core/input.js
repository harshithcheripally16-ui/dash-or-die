import { state, STATE } from './state.js';

export function setupInput(callbacks) {
    const { onStart, onReset } = callbacks;

    window.addEventListener('keydown', (e) => {
        try {
            const isControlKey = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code);
            
            if ((state.gameState === STATE.START || state.gameState === STATE.GAMEOVER) && isControlKey) {
                if (state.gameState === STATE.GAMEOVER && onReset) onReset();
                if (onStart) onStart();
                return;
            }
            state.keys[e.code] = true;
        } catch (err) {
            console.error("Input processing failure:", err);
        }
    });

    window.addEventListener('keyup', (e) => state.keys[e.code] = false);

    // Prevent stuck movement on tab switch
    window.addEventListener('blur', () => {
        for (let key in state.keys) state.keys[key] = false;
        state.touchState.active = false;
    });

    setupTouchListeners(onStart);
}

function setupTouchListeners(onStart) {
    const joystickBase = document.getElementById('joystick-base');
    const joystickKnob = document.getElementById('joystick-knob');
    const surgeBtn = document.getElementById('surge-btn');

    window.addEventListener('touchstart', (e) => {
        if (state.gameState === STATE.START) {
            if (onStart) onStart();
            return;
        }
        const touch = e.touches[0];
        // Only trigger joystick on the left half of the screen
        if (touch.clientX < window.innerWidth / 2) {
            state.touchState.active = true;
            state.touchState.origin = { x: touch.clientX, y: touch.clientY };
            
            if (joystickBase && joystickKnob) {
                joystickBase.style.display = 'block';
                joystickBase.style.left = `${touch.clientX - 50}px`;
                joystickBase.style.top = `${touch.clientY - 50}px`;
                joystickKnob.style.transform = `translate(-50%, -50%)`;
            }
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!state.touchState.active) return;
        e.preventDefault(); // Prevent scrolling
        
        let activeTouch = null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].clientX < window.innerWidth / 2) {
                activeTouch = e.touches[i];
                break;
            }
        }
        
        if (!activeTouch) return;

        const dx = activeTouch.clientX - state.touchState.origin.x;
        const dy = activeTouch.clientY - state.touchState.origin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 40;

        let nx = dx, ny = dy;
        if (distance > maxDist) {
            nx = (dx / distance) * maxDist;
            ny = (dy / distance) * maxDist;
        }

        if (joystickKnob) {
            joystickKnob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
        }

        const normDist = distance > 0 ? Math.min(distance / maxDist, 1.0) : 0;
        state.touchState.vector = {
            x: distance > 0 ? (dx / distance) * normDist : 0,
            y: distance > 0 ? (dy / distance) * normDist : 0
        };
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        let hasLeftTouch = false;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].clientX < window.innerWidth / 2) {
                hasLeftTouch = true;
                break;
            }
        }

        if (!hasLeftTouch) {
            state.touchState.active = false;
            state.touchState.vector = { x: 0, y: 0 };
            if (joystickBase) joystickBase.style.display = 'none';
        }
    });

    window.addEventListener('touchcancel', () => {
        state.touchState.active = false;
        state.touchState.vector = { x: 0, y: 0 };
        if (joystickBase) joystickBase.style.display = 'none';
    });

    // Surge Button bindings
    if (surgeBtn) {
        surgeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            surgeBtn.style.transform = 'scale(0.9)';
            surgeBtn.style.backgroundColor = 'var(--accent-glow)';
            state.keys['Space'] = true;
        });

        surgeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            surgeBtn.style.transform = 'scale(1)';
            surgeBtn.style.backgroundColor = 'var(--accent-color)';
            state.keys['Space'] = false;
        });
    }
}
