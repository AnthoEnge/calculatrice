// Utilitaires mathématiques et généraux pour le jeu
class Utils {
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    }

    static choice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Système de collision
class Collision {
    static rectRect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    static circleCircle(x1, y1, r1, x2, y2, r2) {
        const distance = Utils.distance(x1, y1, x2, y2);
        return distance < r1 + r2;
    }

    static circleRect(cx, cy, radius, rx, ry, rw, rh) {
        const closestX = Utils.clamp(cx, rx, rx + rw);
        const closestY = Utils.clamp(cy, ry, ry + rh);
        const distance = Utils.distance(cx, cy, closestX, closestY);
        return distance < radius;
    }

    static pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }

    static pointInCircle(px, py, cx, cy, radius) {
        return Utils.distance(px, py, cx, cy) <= radius;
    }
}

// Vecteur 2D
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    static from(obj) {
        return new Vector2(obj.x, obj.y);
    }

    static zero() {
        return new Vector2(0, 0);
    }

    static one() {
        return new Vector2(1, 1);
    }

    static up() {
        return new Vector2(0, -1);
    }

    static down() {
        return new Vector2(0, 1);
    }

    static left() {
        return new Vector2(-1, 0);
    }

    static right() {
        return new Vector2(1, 0);
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }

    distance(vector) {
        return Utils.distance(this.x, this.y, vector.x, vector.y);
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }
}

// Timer pour les événements temporisés
class Timer {
    constructor(duration, callback, repeat = false) {
        this.duration = duration;
        this.callback = callback;
        this.repeat = repeat;
        this.elapsed = 0;
        this.active = true;
    }

    update(deltaTime) {
        if (!this.active) return;

        this.elapsed += deltaTime;
        if (this.elapsed >= this.duration) {
            this.callback();
            if (this.repeat) {
                this.elapsed = 0;
            } else {
                this.active = false;
            }
        }
    }

    reset() {
        this.elapsed = 0;
        this.active = true;
    }

    stop() {
        this.active = false;
    }

    getProgress() {
        return Utils.clamp(this.elapsed / this.duration, 0, 1);
    }
}

// Pool d'objets pour optimiser les performances
class ObjectPool {
    constructor(createFunc, resetFunc, initialSize = 10) {
        this.createFunc = createFunc;
        this.resetFunc = resetFunc;
        this.pool = [];
        this.active = [];

        // Pré-remplir le pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFunc());
        }
    }

    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFunc();
        }
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.resetFunc(obj);
            this.pool.push(obj);
        }
    }

    releaseAll() {
        while (this.active.length > 0) {
            this.release(this.active[0]);
        }
    }
}

// Système de couleurs
class Color {
    constructor(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    static fromHex(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return new Color(r, g, b);
    }

    static random() {
        return new Color(
            Utils.randomInt(0, 255),
            Utils.randomInt(0, 255),
            Utils.randomInt(0, 255)
        );
    }

    toString() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }

    copy() {
        return new Color(this.r, this.g, this.b, this.a);
    }

    lerp(other, factor) {
        this.r = Utils.lerp(this.r, other.r, factor);
        this.g = Utils.lerp(this.g, other.g, factor);
        this.b = Utils.lerp(this.b, other.b, factor);
        this.a = Utils.lerp(this.a, other.a, factor);
        return this;
    }
}

// Constantes du jeu
const GAME_CONSTANTS = {
    TILE_SIZE: 32,
    ROOM_MIN_SIZE: 8,
    ROOM_MAX_SIZE: 16,
    MAX_ROOMS: 15,
    PLAYER_SPEED: 200,
    PLAYER_MAX_HEALTH: 100,
    ENEMY_SPAWN_RATE: 0.3,
    ITEM_DROP_RATE: 0.2,
    VIEWPORT_PADDING: 100,
    
    // Types de tuiles
    TILE_TYPES: {
        EMPTY: 0,
        WALL: 1,
        FLOOR: 2,
        DOOR: 3,
        STAIRS: 4
    },

    // Types d'entités
    ENTITY_TYPES: {
        PLAYER: 'player',
        ENEMY: 'enemy',
        PROJECTILE: 'projectile',
        ITEM: 'item',
        PARTICLE: 'particle'
    },

    // Types d'ennemis
    ENEMY_TYPES: {
        GOBLIN: 'goblin',
        ORC: 'orc',
        SKELETON: 'skeleton',
        BOSS: 'boss'
    },

    // Types d'objets
    ITEM_TYPES: {
        HEALTH_POTION: 'health_potion',
        MANA_POTION: 'mana_potion',
        WEAPON: 'weapon',
        ARMOR: 'armor',
        KEY: 'key',
        TREASURE: 'treasure'
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, Collision, Vector2, Timer, ObjectPool, Color, GAME_CONSTANTS };
}