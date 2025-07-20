// Système de gestion des entrées pour mobile et desktop
class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, pressed: false };
        this.touches = new Map();
        this.joystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0,
            strength: 0,
            angle: 0
        };
        
        this.deadZone = 0.1;
        this.maxDistance = 60; // Rayon du joystick
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Clavier
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });

        // Souris
        document.addEventListener('mousedown', (e) => {
            this.mouse.pressed = true;
            this.updateMousePosition(e);
        });

        document.addEventListener('mouseup', (e) => {
            this.mouse.pressed = false;
        });

        document.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
        });

        // Touch events pour mobile
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });

        // Joystick virtuel
        this.setupVirtualJoystick();
    }

    updateMousePosition(e) {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    handleTouchStart(e) {
        for (let touch of e.changedTouches) {
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY,
                target: touch.target
            });

            // Vérifier si c'est le joystick
            if (this.isJoystickTouch(touch)) {
                this.startJoystick(touch);
            }
        }
    }

    handleTouchMove(e) {
        for (let touch of e.changedTouches) {
            if (this.touches.has(touch.identifier)) {
                const touchData = this.touches.get(touch.identifier);
                touchData.x = touch.clientX;
                touchData.y = touch.clientY;

                // Mettre à jour le joystick si c'est le bon touch
                if (this.joystick.active && this.joystick.touchId === touch.identifier) {
                    this.updateJoystick(touch);
                }
            }
        }
    }

    handleTouchEnd(e) {
        for (let touch of e.changedTouches) {
            if (this.touches.has(touch.identifier)) {
                // Arrêter le joystick si nécessaire
                if (this.joystick.active && this.joystick.touchId === touch.identifier) {
                    this.stopJoystick();
                }

                this.touches.delete(touch.identifier);
            }
        }
    }

    setupVirtualJoystick() {
        const joystickElement = document.getElementById('joystick');
        const knobElement = document.getElementById('joystickKnob');

        if (!joystickElement || !knobElement) return;

        this.joystickElement = joystickElement;
        this.knobElement = knobElement;

        // Position du joystick
        const rect = joystickElement.getBoundingClientRect();
        this.joystickCenterX = rect.left + rect.width / 2;
        this.joystickCenterY = rect.top + rect.height / 2;
    }

    isJoystickTouch(touch) {
        const joystickElement = document.getElementById('joystick');
        if (!joystickElement) return false;

        const rect = joystickElement.getBoundingClientRect();
        return touch.clientX >= rect.left && 
               touch.clientX <= rect.right && 
               touch.clientY >= rect.top && 
               touch.clientY <= rect.bottom;
    }

    startJoystick(touch) {
        this.joystick.active = true;
        this.joystick.touchId = touch.identifier;
        this.joystick.startX = touch.clientX;
        this.joystick.startY = touch.clientY;
        this.updateJoystick(touch);
    }

    updateJoystick(touch) {
        if (!this.joystick.active) return;

        const deltaX = touch.clientX - this.joystick.startX;
        const deltaY = touch.clientY - this.joystick.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Limiter la distance
        const constrainedDistance = Math.min(distance, this.maxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        
        this.joystick.currentX = this.joystick.startX + Math.cos(angle) * constrainedDistance;
        this.joystick.currentY = this.joystick.startY + Math.sin(angle) * constrainedDistance;
        
        // Calculer les valeurs normalisées
        this.joystick.deltaX = Math.cos(angle) * (constrainedDistance / this.maxDistance);
        this.joystick.deltaY = Math.sin(angle) * (constrainedDistance / this.maxDistance);
        this.joystick.strength = constrainedDistance / this.maxDistance;
        this.joystick.angle = angle;

        // Appliquer la zone morte
        if (this.joystick.strength < this.deadZone) {
            this.joystick.deltaX = 0;
            this.joystick.deltaY = 0;
            this.joystick.strength = 0;
        }

        // Mettre à jour l'affichage visuel
        this.updateJoystickVisual();
    }

    stopJoystick() {
        this.joystick.active = false;
        this.joystick.touchId = null;
        this.joystick.deltaX = 0;
        this.joystick.deltaY = 0;
        this.joystick.strength = 0;
        this.updateJoystickVisual();
    }

    updateJoystickVisual() {
        if (!this.knobElement) return;

        if (this.joystick.active && this.joystick.strength > 0) {
            const offsetX = this.joystick.deltaX * this.maxDistance;
            const offsetY = this.joystick.deltaY * this.maxDistance;
            this.knobElement.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
        } else {
            this.knobElement.style.transform = 'translate(-50%, -50%)';
        }
    }

    // Méthodes pour vérifier l'état des entrées
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }

    isMousePressed() {
        return this.mouse.pressed;
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    getMovementInput() {
        let x = 0;
        let y = 0;

        // Clavier (WASD ou flèches)
        if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) x -= 1;
        if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) x += 1;
        if (this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp')) y -= 1;
        if (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown')) y += 1;

        // Joystick virtuel (priorité sur le clavier)
        if (this.joystick.active && this.joystick.strength > this.deadZone) {
            x = this.joystick.deltaX;
            y = this.joystick.deltaY;
        }

        // Normaliser si nécessaire
        const magnitude = Math.sqrt(x * x + y * y);
        if (magnitude > 1) {
            x /= magnitude;
            y /= magnitude;
        }

        return { x, y, magnitude: Math.min(magnitude, 1) };
    }

    isActionPressed(action) {
        switch (action) {
            case 'attack':
                return this.isKeyPressed('Space') || this.isButtonPressed('attackBtn');
            case 'dash':
                return this.isKeyPressed('ShiftLeft') || this.isButtonPressed('dashBtn');
            case 'use':
                return this.isKeyPressed('KeyE') || this.isButtonPressed('useBtn');
            case 'pause':
                return this.isKeyPressed('Escape') || this.isButtonPressed('pauseBtn');
            case 'inventory':
                return this.isKeyPressed('Tab') || this.isKeyPressed('KeyI');
            default:
                return false;
        }
    }

    isButtonPressed(buttonId) {
        const button = document.getElementById(buttonId);
        return button && button.classList.contains('active');
    }

    // Gérer les boutons d'action tactiles
    setupActionButtons() {
        const actionButtons = ['attackBtn', 'dashBtn', 'useBtn', 'pauseBtn'];
        
        actionButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (!button) return;

            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.classList.add('active');
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                button.classList.remove('active');
            });

            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                button.classList.remove('active');
            });

            // Support souris pour desktop
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                button.classList.add('active');
            });

            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                button.classList.remove('active');
            });

            button.addEventListener('mouseleave', (e) => {
                button.classList.remove('active');
            });
        });
    }

    // Gestion du multi-touch pour les combos
    getTouchCount() {
        return this.touches.size;
    }

    getAllTouches() {
        return Array.from(this.touches.values());
    }

    // Vibration pour le feedback tactile (si supporté)
    vibrate(pattern = 50) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    // Reset toutes les entrées
    reset() {
        this.keys = {};
        this.mouse.pressed = false;
        this.touches.clear();
        this.stopJoystick();
    }

    // Mise à jour appelée chaque frame
    update() {
        // Mettre à jour la position du joystick si nécessaire
        if (this.joystickElement) {
            const rect = this.joystickElement.getBoundingClientRect();
            this.joystickCenterX = rect.left + rect.width / 2;
            this.joystickCenterY = rect.top + rect.height / 2;
        }
    }
}

// Instance globale du gestionnaire d'entrées
const inputManager = new InputManager();

// Configuration automatique au chargement
document.addEventListener('DOMContentLoaded', () => {
    inputManager.setupActionButtons();
});