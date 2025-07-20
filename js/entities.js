// Classes de base pour les entités du jeu
class Entity {
    constructor(x, y, width, height) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2();
        this.width = width;
        this.height = height;
        this.health = 100;
        this.maxHealth = 100;
        this.active = true;
        this.type = GAME_CONSTANTS.ENTITY_TYPES.PLAYER;
        this.color = new Color(255, 255, 255);
        this.angle = 0;
        this.speed = 100;
        this.lastDamageTime = 0;
        this.invulnerabilityDuration = 0.5;
    }

    getBounds() {
        return {
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    getCenter() {
        return { x: this.position.x, y: this.position.y };
    }

    takeDamage(amount, source) {
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastDamageTime < this.invulnerabilityDuration) {
            return false;
        }

        this.health = Math.max(0, this.health - amount);
        this.lastDamageTime = currentTime;
        this.onDamage(amount, source);
        
        if (this.health <= 0) {
            this.onDeath();
            return true;
        }
        return false;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    isInvulnerable() {
        const currentTime = Date.now() / 1000;
        return currentTime - this.lastDamageTime < this.invulnerabilityDuration;
    }

    onDamage(amount, source) {
        // Override dans les sous-classes
    }

    onDeath() {
        this.active = false;
    }

    update(deltaTime) {
        // Mise à jour de la physique de base
        this.position.add(Vector2.from(this.velocity).multiply(deltaTime));
    }

    render(ctx) {
        const bounds = this.getBounds();
        
        // Effet de clignotement si invulnérable
        if (this.isInvulnerable()) {
            const alpha = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.globalAlpha = alpha;
        }

        ctx.fillStyle = this.color.toString();
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        ctx.globalAlpha = 1;
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.type = GAME_CONSTANTS.ENTITY_TYPES.PLAYER;
        this.color = new Color(100, 150, 255);
        this.speed = GAME_CONSTANTS.PLAYER_SPEED;
        this.health = GAME_CONSTANTS.PLAYER_MAX_HEALTH;
        this.maxHealth = GAME_CONSTANTS.PLAYER_MAX_HEALTH;
        
        // Capacités spéciales
        this.dashCooldown = 0;
        this.dashDuration = 0.2;
        this.dashSpeed = 400;
        this.isDashing = false;
        this.dashTimer = 0;
        
        // Combat
        this.attackCooldown = 0;
        this.attackDamage = 25;
        this.attackRange = 40;
        
        // Inventaire
        this.inventory = [];
        this.maxInventorySize = 4;
        
        // Stats
        this.score = 0;
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 100;
        
        // Mouvement fluide
        this.targetVelocity = new Vector2();
        this.acceleration = 800;
        this.friction = 600;
    }

    update(deltaTime) {
        this.handleInput(deltaTime);
        this.updateMovement(deltaTime);
        this.updateAbilities(deltaTime);
        super.update(deltaTime);
    }

    handleInput(deltaTime) {
        const movement = inputManager.getMovementInput();
        
        // Définir la vélocité cible
        this.targetVelocity.set(
            movement.x * this.speed,
            movement.y * this.speed
        );

        // Ajuster la vitesse pendant le dash
        if (this.isDashing) {
            this.targetVelocity.multiply(this.dashSpeed / this.speed);
        }

        // Actions
        if (inputManager.isActionPressed('attack') && this.attackCooldown <= 0) {
            this.attack();
        }

        if (inputManager.isActionPressed('dash') && this.dashCooldown <= 0 && !this.isDashing) {
            this.startDash();
        }
    }

    updateMovement(deltaTime) {
        // Mouvement fluide avec accélération
        const deltaVel = Vector2.from(this.targetVelocity).subtract(this.velocity);
        const accelMagnitude = Math.min(deltaVel.magnitude(), this.acceleration * deltaTime);
        
        if (deltaVel.magnitude() > 0) {
            deltaVel.normalize().multiply(accelMagnitude);
            this.velocity.add(deltaVel);
        } else {
            // Appliquer la friction
            const frictionForce = this.friction * deltaTime;
            if (this.velocity.magnitude() > frictionForce) {
                this.velocity.add(Vector2.from(this.velocity).normalize().multiply(-frictionForce));
            } else {
                this.velocity.set(0, 0);
            }
        }

        // Mettre à jour l'angle basé sur la direction
        if (this.velocity.magnitude() > 0.1) {
            this.angle = this.velocity.angle();
        }

        // Son de pas
        if (this.velocity.magnitude() > 10) {
            audioManager.playStepSound();
        }
    }

    updateAbilities(deltaTime) {
        // Cooldowns
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        this.dashCooldown = Math.max(0, this.dashCooldown - deltaTime);

        // Dash
        if (this.isDashing) {
            this.dashTimer -= deltaTime;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        }
    }

    attack() {
        this.attackCooldown = 0.5;
        
        // Créer un projectile ou une attaque de mêlée
        const direction = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
        const projectilePos = Vector2.from(this.position).add(Vector2.from(direction).multiply(25));
        
        game.addProjectile(new Projectile(
            projectilePos.x,
            projectilePos.y,
            direction.x * 300,
            direction.y * 300,
            this.attackDamage,
            'player'
        ));

        // Effets
        audioManager.playSound('attack');
        particleSystem.createSparkBurst(projectilePos.x, projectilePos.y, 0.5);
    }

    startDash() {
        if (this.targetVelocity.magnitude() > 0) {
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            this.dashCooldown = 2.0;
            
            // Effets visuels et sonores
            audioManager.playSound('dash');
            particleSystem.createDashEffect(this.position.x, this.position.y, this.targetVelocity);
            inputManager.vibrate(100);
        }
    }

    onDamage(amount, source) {
        audioManager.playSound('playerHit');
        particleSystem.createBloodSplash(this.position.x, this.position.y, 0.8);
        inputManager.vibrate([100, 50, 100]);
    }

    onDeath() {
        super.onDeath();
        audioManager.playSound('gameOver');
        particleSystem.createDeathEffect(this.position.x, this.position.y, 'player');
        game.gameOver();
    }

    addItem(item) {
        if (this.inventory.length < this.maxInventorySize) {
            this.inventory.push(item);
            return true;
        }
        return false;
    }

    addExperience(amount) {
        this.experience += amount;
        this.score += amount * 10;
        
        if (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.experience -= this.experienceToNext;
        this.experienceToNext = Math.floor(this.experienceToNext * 1.2);
        
        // Bonus de level up
        this.maxHealth += 10;
        this.health = this.maxHealth;
        this.attackDamage += 2;
        
        audioManager.playSound('levelComplete');
        particleSystem.createMagicEffect(this.position.x, this.position.y, new Color(255, 255, 100), 2);
    }

    render(ctx) {
        const bounds = this.getBounds();
        
        // Effet de clignotement si invulnérable
        if (this.isInvulnerable()) {
            const alpha = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.globalAlpha = alpha;
        }

        // Corps principal
        ctx.fillStyle = this.color.toString();
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        // Indicateur de direction
        ctx.fillStyle = 'white';
        const dirX = this.position.x + Math.cos(this.angle) * 15;
        const dirY = this.position.y + Math.sin(this.angle) * 15;
        ctx.fillRect(dirX - 2, dirY - 2, 4, 4);
        
        // Effet dash
        if (this.isDashing) {
            ctx.fillStyle = 'rgba(150, 150, 255, 0.5)';
            ctx.fillRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
        }
        
        ctx.globalAlpha = 1;
    }
}

class Enemy extends Entity {
    constructor(x, y, type = GAME_CONSTANTS.ENEMY_TYPES.GOBLIN) {
        super(x, y, 18, 18);
        this.type = GAME_CONSTANTS.ENTITY_TYPES.ENEMY;
        this.enemyType = type;
        this.setupByType();
        
        this.target = null;
        this.attackCooldown = 0;
        this.lastAttackTime = 0;
        this.wanderDirection = Math.random() * Math.PI * 2;
        this.wanderTimer = 0;
        this.aggroRange = 150;
        this.attackRange = 30;
        this.pathfindingTimer = 0;
        this.stuck = false;
        this.stuckTimer = 0;
    }

    setupByType() {
        switch (this.enemyType) {
            case GAME_CONSTANTS.ENEMY_TYPES.GOBLIN:
                this.health = this.maxHealth = 30;
                this.speed = 80;
                this.attackDamage = 15;
                this.color = new Color(100, 200, 100);
                this.experienceValue = 20;
                break;
                
            case GAME_CONSTANTS.ENEMY_TYPES.ORC:
                this.health = this.maxHealth = 60;
                this.speed = 60;
                this.attackDamage = 25;
                this.color = new Color(200, 100, 100);
                this.experienceValue = 40;
                this.width = this.height = 24;
                break;
                
            case GAME_CONSTANTS.ENEMY_TYPES.SKELETON:
                this.health = this.maxHealth = 40;
                this.speed = 90;
                this.attackDamage = 20;
                this.color = new Color(200, 200, 200);
                this.experienceValue = 30;
                this.attackRange = 80; // Attaque à distance
                break;
                
            case GAME_CONSTANTS.ENEMY_TYPES.BOSS:
                this.health = this.maxHealth = 200;
                this.speed = 50;
                this.attackDamage = 40;
                this.color = new Color(150, 50, 200);
                this.experienceValue = 200;
                this.width = this.height = 40;
                this.attackRange = 60;
                break;
        }
    }

    update(deltaTime) {
        this.updateAI(deltaTime);
        this.updateCombat(deltaTime);
        super.update(deltaTime);
    }

    updateAI(deltaTime) {
        this.pathfindingTimer -= deltaTime;
        this.wanderTimer -= deltaTime;
        
        // Chercher le joueur
        if (game.player && game.player.active) {
            const distToPlayer = this.position.distance(game.player.position);
            
            if (distToPlayer <= this.aggroRange) {
                this.target = game.player;
            }
        }

        if (this.target && this.target.active) {
            this.moveToTarget(deltaTime);
        } else {
            this.wander(deltaTime);
        }
    }

    moveToTarget(deltaTime) {
        const direction = Vector2.from(this.target.position).subtract(this.position);
        const distance = direction.magnitude();
        
        if (distance > this.attackRange) {
            direction.normalize();
            this.velocity.set(
                direction.x * this.speed,
                direction.y * this.speed
            );
            this.angle = direction.angle();
        } else {
            this.velocity.set(0, 0);
        }
    }

    wander(deltaTime) {
        if (this.wanderTimer <= 0) {
            this.wanderDirection += (Math.random() - 0.5) * 2;
            this.wanderTimer = 1 + Math.random() * 2;
        }

        const speed = this.speed * 0.3; // Wandering plus lent
        this.velocity.set(
            Math.cos(this.wanderDirection) * speed,
            Math.sin(this.wanderDirection) * speed
        );
        this.angle = this.wanderDirection;
    }

    updateCombat(deltaTime) {
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        if (this.target && this.target.active && this.attackCooldown <= 0) {
            const distance = this.position.distance(this.target.position);
            
            if (distance <= this.attackRange) {
                this.attack();
            }
        }
    }

    attack() {
        this.attackCooldown = 1.5 + Math.random() * 0.5;
        
        if (this.enemyType === GAME_CONSTANTS.ENEMY_TYPES.SKELETON) {
            // Attaque à distance
            const direction = Vector2.from(this.target.position).subtract(this.position).normalize();
            const projectilePos = Vector2.from(this.position).add(Vector2.from(direction).multiply(20));
            
            game.addProjectile(new Projectile(
                projectilePos.x,
                projectilePos.y,
                direction.x * 200,
                direction.y * 200,
                this.attackDamage,
                'enemy'
            ));
        } else {
            // Attaque de mêlée
            const distance = this.position.distance(this.target.position);
            if (distance <= this.attackRange && this.target.takeDamage) {
                this.target.takeDamage(this.attackDamage, this);
                
                // Effet d'attaque
                const direction = Vector2.from(this.target.position).subtract(this.position).normalize();
                particleSystem.createHitEffect(this.target.position.x, this.target.position.y, direction);
            }
        }
        
        audioManager.playRandomEnemySound();
    }

    onDamage(amount, source) {
        // Effet de hit
        const direction = Vector2.from(this.position).subtract(source.position).normalize();
        particleSystem.createHitEffect(this.position.x, this.position.y, direction);
        
        // Knock-back léger
        this.velocity.add(Vector2.from(direction).multiply(100));
    }

    onDeath() {
        super.onDeath();
        
        // Donner de l'expérience au joueur
        if (game.player && game.player.active) {
            game.player.addExperience(this.experienceValue);
        }
        
        // Effets
        audioManager.playSound('enemyDeath');
        particleSystem.createDeathEffect(this.position.x, this.position.y, 'enemy');
        
        // Drop d'items
        if (Math.random() < GAME_CONSTANTS.ITEM_DROP_RATE) {
            game.addItem(this.position.x, this.position.y);
        }
        
        // Stats
        game.enemiesKilled++;
    }

    render(ctx) {
        const bounds = this.getBounds();
        
        // Effet de clignotement si invulnérable
        if (this.isInvulnerable()) {
            const alpha = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.globalAlpha = alpha;
        }

        // Corps principal
        ctx.fillStyle = this.color.toString();
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        // Barre de vie
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const barY = bounds.y - barHeight - 2;
            
            ctx.fillStyle = 'red';
            ctx.fillRect(bounds.x, barY, barWidth, barHeight);
            
            ctx.fillStyle = 'green';
            const healthPercent = this.health / this.maxHealth;
            ctx.fillRect(bounds.x, barY, barWidth * healthPercent, barHeight);
        }
        
        // Indicateur de direction pour les boss
        if (this.enemyType === GAME_CONSTANTS.ENEMY_TYPES.BOSS) {
            ctx.fillStyle = 'yellow';
            const dirX = this.position.x + Math.cos(this.angle) * 25;
            const dirY = this.position.y + Math.sin(this.angle) * 25;
            ctx.fillRect(dirX - 3, dirY - 3, 6, 6);
        }
        
        ctx.globalAlpha = 1;
    }
}

class Projectile extends Entity {
    constructor(x, y, vx, vy, damage, owner) {
        super(x, y, 6, 6);
        this.type = GAME_CONSTANTS.ENTITY_TYPES.PROJECTILE;
        this.velocity.set(vx, vy);
        this.damage = damage;
        this.owner = owner;
        this.lifeTime = 3; // Secondes
        this.piercing = false;
        this.hitTargets = new Set();
        
        // Couleur selon le propriétaire
        if (owner === 'player') {
            this.color = new Color(100, 150, 255);
        } else {
            this.color = new Color(255, 100, 100);
        }
        
        this.angle = this.velocity.angle();
        this.trail = [];
        this.maxTrailLength = 8;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Diminuer la durée de vie
        this.lifeTime -= deltaTime;
        if (this.lifeTime <= 0) {
            this.active = false;
            return;
        }
        
        // Mettre à jour la traînée
        this.trail.unshift({ x: this.position.x, y: this.position.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }
        
        // Vérifier les collisions
        this.checkCollisions();
    }

    checkCollisions() {
        if (this.owner === 'player') {
            // Collision avec les ennemis
            game.enemies.forEach(enemy => {
                if (enemy.active && !this.hitTargets.has(enemy)) {
                    const distance = this.position.distance(enemy.position);
                    if (distance < (this.width + enemy.width) / 2) {
                        this.hitTarget(enemy);
                    }
                }
            });
        } else {
            // Collision avec le joueur
            if (game.player && game.player.active && !this.hitTargets.has(game.player)) {
                const distance = this.position.distance(game.player.position);
                if (distance < (this.width + game.player.width) / 2) {
                    this.hitTarget(game.player);
                }
            }
        }
        
        // Collision avec les murs
        if (game.dungeon && game.dungeon.isWall(this.position.x, this.position.y)) {
            this.onWallHit();
        }
    }

    hitTarget(target) {
        this.hitTargets.add(target);
        target.takeDamage(this.damage, this);
        
        // Effets
        const direction = Vector2.from(this.velocity).normalize();
        particleSystem.createHitEffect(target.position.x, target.position.y, direction);
        
        if (!this.piercing) {
            this.active = false;
        }
    }

    onWallHit() {
        this.active = false;
        particleSystem.createSparkBurst(this.position.x, this.position.y, 0.3);
    }

    render(ctx) {
        // Dessiner la traînée
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = (this.trail.length - i) / this.trail.length * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color.toString();
            const size = (this.width * alpha);
            ctx.fillRect(point.x - size/2, point.y - size/2, size, size);
        }
        
        ctx.globalAlpha = 1;
        
        // Dessiner le projectile
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color.toString();
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.restore();
    }
}