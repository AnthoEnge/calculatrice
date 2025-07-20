// Système de particules pour les effets visuels
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.size = 1;
        this.maxSize = 1;
        this.color = new Color(255, 255, 255);
        this.gravity = 0;
        this.friction = 1;
        this.active = false;
        this.type = 'default';
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.alpha = 1;
        this.scaleWithLife = true;
        this.fadeWithLife = true;
    }

    init(x, y, vx, vy, life, size, color, type = 'default') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.maxSize = size;
        this.color = color instanceof Color ? color.copy() : new Color(color.r, color.g, color.b, color.a || 1);
        this.active = true;
        this.type = type;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.alpha = 1;
        
        // Paramètres spécifiques selon le type
        switch (type) {
            case 'blood':
                this.gravity = 200;
                this.friction = 0.98;
                this.scaleWithLife = false;
                break;
            case 'spark':
                this.gravity = 100;
                this.friction = 0.95;
                this.rotationSpeed = (Math.random() - 0.5) * 0.2;
                break;
            case 'smoke':
                this.gravity = -50;
                this.friction = 0.99;
                this.rotationSpeed = (Math.random() - 0.5) * 0.05;
                break;
            case 'magic':
                this.gravity = -30;
                this.friction = 0.97;
                this.rotationSpeed = (Math.random() - 0.5) * 0.3;
                break;
            case 'explosion':
                this.gravity = 0;
                this.friction = 0.9;
                break;
        }
    }

    update(deltaTime) {
        if (!this.active) return;

        // Mise à jour de la physique
        this.vy += this.gravity * deltaTime;
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        this.rotation += this.rotationSpeed;
        
        // Diminuer la vie
        this.life -= deltaTime;
        
        // Mise à jour des propriétés visuelles
        const lifeRatio = this.life / this.maxLife;
        
        if (this.scaleWithLife) {
            this.size = this.maxSize * lifeRatio;
        }
        
        if (this.fadeWithLife) {
            this.alpha = lifeRatio;
        }
        
        // Effets spéciaux selon le type
        switch (this.type) {
            case 'smoke':
                this.size = this.maxSize * (1 - lifeRatio * 0.5);
                this.alpha = lifeRatio * 0.6;
                break;
            case 'magic':
                this.alpha = Math.sin(lifeRatio * Math.PI) * 0.8;
                break;
            case 'spark':
                if (lifeRatio < 0.3) {
                    this.alpha = lifeRatio / 0.3;
                }
                break;
        }
        
        // Désactiver si la vie est épuisée
        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active || this.alpha <= 0) return;

        ctx.save();
        
        // Appliquer la transparence
        ctx.globalAlpha = this.alpha;
        
        // Position et rotation
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Couleur
        ctx.fillStyle = this.color.toString();
        
        // Rendu selon le type
        switch (this.type) {
            case 'blood':
                this.renderBlood(ctx);
                break;
            case 'spark':
                this.renderSpark(ctx);
                break;
            case 'smoke':
                this.renderSmoke(ctx);
                break;
            case 'magic':
                this.renderMagic(ctx);
                break;
            case 'explosion':
                this.renderExplosion(ctx);
                break;
            default:
                this.renderDefault(ctx);
                break;
        }
        
        ctx.restore();
    }

    renderDefault(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    renderBlood(ctx) {
        // Goutte de sang
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Petite traînée
        ctx.beginPath();
        ctx.ellipse(0, this.size * 0.5, this.size * 0.3, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderSpark(ctx) {
        // Étincelle en forme d'étoile
        const spikes = 4;
        const outerRadius = this.size;
        const innerRadius = this.size * 0.4;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    renderSmoke(ctx) {
        // Fumée avec gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    renderMagic(ctx) {
        // Particule magique scintillante
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`);
        gradient.addColorStop(0.7, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Ajout d'un petit éclat au centre
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderExplosion(ctx) {
        // Fragment d'explosion
        ctx.fillStyle = this.color.toString();
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.particlePool = new ObjectPool(
            () => new Particle(),
            (particle) => particle.reset(),
            100
        );
    }

    createParticle(x, y, vx, vy, life, size, color, type = 'default') {
        const particle = this.particlePool.get();
        particle.init(x, y, vx, vy, life, size, color, type);
        return particle;
    }

    // Effets prédéfinis
    createBloodSplash(x, y, intensity = 1) {
        const count = Math.floor(5 + Math.random() * 10 * intensity);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100 * intensity;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 4;
            const life = 0.5 + Math.random() * 1;
            const color = new Color(
                150 + Utils.randomInt(0, 50),
                0,
                0,
                0.8 + Math.random() * 0.2
            );
            
            this.createParticle(x, y, vx, vy, life, size, color, 'blood');
        }
    }

    createSparkBurst(x, y, intensity = 1) {
        const count = Math.floor(8 + Math.random() * 12 * intensity);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 150 * intensity;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 1 + Math.random() * 3;
            const life = 0.3 + Math.random() * 0.7;
            const color = new Color(
                255,
                200 + Utils.randomInt(0, 55),
                100 + Utils.randomInt(0, 100),
                1
            );
            
            this.createParticle(x, y, vx, vy, life, size, color, 'spark');
        }
    }

    createSmokePuff(x, y, intensity = 1) {
        const count = Math.floor(3 + Math.random() * 5 * intensity);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 40;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 30; // Tendance vers le haut
            const size = 5 + Math.random() * 10;
            const life = 1 + Math.random() * 2;
            const gray = 100 + Utils.randomInt(0, 100);
            const color = new Color(gray, gray, gray, 0.6);
            
            this.createParticle(x, y, vx, vy, life, size, color, 'smoke');
        }
    }

    createMagicEffect(x, y, color, intensity = 1) {
        const count = Math.floor(6 + Math.random() * 8 * intensity);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 60;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 4;
            const life = 0.8 + Math.random() * 1.2;
            
            this.createParticle(x, y, vx, vy, life, size, color, 'magic');
        }
    }

    createExplosion(x, y, intensity = 1) {
        const count = Math.floor(15 + Math.random() * 20 * intensity);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200 * intensity;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 6;
            const life = 0.5 + Math.random() * 1;
            const color = new Color(
                255,
                150 + Utils.randomInt(0, 105),
                50 + Utils.randomInt(0, 100),
                1
            );
            
            this.createParticle(x, y, vx, vy, life, size, color, 'explosion');
        }
    }

    createDeathEffect(x, y, entityType) {
        switch (entityType) {
            case 'player':
                this.createBloodSplash(x, y, 2);
                this.createSmokePuff(x, y, 1);
                break;
            case 'enemy':
                this.createBloodSplash(x, y, 1.5);
                this.createSparkBurst(x, y, 0.5);
                break;
            case 'boss':
                this.createExplosion(x, y, 2);
                this.createBloodSplash(x, y, 3);
                break;
        }
    }

    createItemPickupEffect(x, y, itemType) {
        const colors = {
            health: new Color(255, 100, 100),
            mana: new Color(100, 100, 255),
            treasure: new Color(255, 255, 100),
            weapon: new Color(200, 200, 200),
            armor: new Color(150, 150, 200)
        };
        
        const color = colors[itemType] || new Color(255, 255, 255);
        this.createMagicEffect(x, y, color, 1);
    }

    createHitEffect(x, y, direction) {
        // Sparks dans la direction opposée
        const baseAngle = Math.atan2(direction.y, direction.x) + Math.PI;
        const count = 5 + Math.random() * 5;
        
        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.5;
            const speed = 60 + Math.random() * 80;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 1 + Math.random() * 2;
            const life = 0.2 + Math.random() * 0.4;
            const color = new Color(255, 200, 100, 1);
            
            this.createParticle(x, y, vx, vy, life, size, color, 'spark');
        }
    }

    createDashEffect(x, y, direction) {
        const count = 8 + Math.random() * 8;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.atan2(direction.y, direction.x) + Math.PI + (Math.random() - 0.5) * 0.5;
            const speed = 40 + Math.random() * 60;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 1 + Math.random() * 3;
            const life = 0.3 + Math.random() * 0.5;
            const color = new Color(150, 150, 255, 0.8);
            
            this.createParticle(x, y, vx, vy, life, size, color, 'magic');
        }
    }

    update(deltaTime) {
        // Mise à jour de toutes les particules actives
        for (let i = this.particlePool.active.length - 1; i >= 0; i--) {
            const particle = this.particlePool.active[i];
            particle.update(deltaTime);
            
            if (!particle.active) {
                this.particlePool.release(particle);
            }
        }
    }

    render(ctx) {
        // Rendu de toutes les particules actives
        for (const particle of this.particlePool.active) {
            particle.render(ctx);
        }
    }

    clear() {
        this.particlePool.releaseAll();
    }

    getActiveCount() {
        return this.particlePool.active.length;
    }
}

// Instance globale du système de particules
const particleSystem = new ParticleSystem();