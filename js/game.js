// Moteur de jeu principal
class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.target = null;
        this.smoothing = 0.1;
        this.offset = { x: 0, y: 0 };
        this.bounds = null;
        this.shake = { x: 0, y: 0, intensity: 0, duration: 0 };
    }

    setTarget(target) {
        this.target = target;
    }

    setBounds(bounds) {
        this.bounds = bounds;
    }

    update(deltaTime) {
        if (this.target) {
            // Position cible centrée sur le joueur
            const targetX = this.target.position.x - this.width / 2 + this.offset.x;
            const targetY = this.target.position.y - this.height / 2 + this.offset.y;
            
            // Mouvement fluide
            this.x = Utils.lerp(this.x, targetX, this.smoothing);
            this.y = Utils.lerp(this.y, targetY, this.smoothing);
            
            // Limiter aux bounds du monde
            if (this.bounds) {
                this.x = Utils.clamp(this.x, 0, this.bounds.width - this.width);
                this.y = Utils.clamp(this.y, 0, this.bounds.height - this.height);
            }
        }
        
        // Mise à jour du tremblement
        if (this.shake.duration > 0) {
            this.shake.duration -= deltaTime;
            this.shake.x = (Math.random() - 0.5) * this.shake.intensity;
            this.shake.y = (Math.random() - 0.5) * this.shake.intensity;
            
            if (this.shake.duration <= 0) {
                this.shake.x = 0;
                this.shake.y = 0;
                this.shake.intensity = 0;
            }
        }
    }

    addShake(intensity, duration) {
        this.shake.intensity = Math.max(this.shake.intensity, intensity);
        this.shake.duration = Math.max(this.shake.duration, duration);
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x + this.shake.x,
            y: worldY - this.y + this.shake.y
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x - this.shake.x,
            y: screenY + this.y - this.shake.y
        };
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }
}

class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.camera = new Camera();
        this.state = 'menu'; // menu, playing, paused, gameover
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.frameCount = 0;
        this.fpsDisplay = 0;
        
        // Entités du jeu
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.items = [];
        
        // Monde
        this.dungeon = null;
        this.currentLevel = 1;
        this.enemiesKilled = 0;
        this.worldBounds = { width: 0, height: 0 };
        
        // Collision et pathfinding
        this.collisionGrid = null;
        this.quadTree = null;
        
        // Performance
        this.visibleEntities = [];
        this.cullingEnabled = true;
        
        this.init();
    }

    init() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas non trouvé!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Initialiser les gestionnaires
        inputManager.setupActionButtons();
        uiManager.init();
        
        console.log('Jeu initialisé');
    }

    setupCanvas() {
        // Configuration du canvas pour de meilleures performances
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Redimensionner le canvas
        this.resizeCanvas();
        
        // Écouter les redimensionnements
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 100);
        });
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.camera.resize(rect.width, rect.height);
        
        console.log(`Canvas redimensionné: ${rect.width}x${rect.height}, DPR: ${dpr}`);
    }

    newGame() {
        this.currentLevel = 1;
        this.enemiesKilled = 0;
        this.state = 'playing';
        
        this.generateLevel();
        
        console.log('Nouvelle partie commencée');
    }

    generateLevel() {
        console.log(`Génération du niveau ${this.currentLevel}`);
        
        // Créer le donjon
        const dungeonSize = Math.min(80 + this.currentLevel * 5, 120);
        this.dungeon = new DungeonGenerator(dungeonSize, dungeonSize);
        this.dungeon.generate(this.currentLevel);
        
        // Définir les limites du monde
        this.worldBounds = this.dungeon.getWorldBounds();
        this.camera.setBounds(this.worldBounds);
        
        // Nettoyer les entités précédentes
        this.enemies = [];
        this.projectiles = [];
        itemManager.clear();
        particleSystem.clear();
        
        // Créer le joueur
        const startPos = this.dungeon.getStartPosition();
        this.player = new Player(startPos.x, startPos.y);
        this.camera.setTarget(this.player);
        
        // Peupler le donjon
        this.populateDungeon();
        
        console.log(`Niveau ${this.currentLevel} généré avec ${this.enemies.length} ennemis`);
    }

    populateDungeon() {
        // Créer les ennemis depuis les données du donjon
        for (const room of this.dungeon.rooms) {
            for (const enemyData of room.enemies) {
                const enemy = new Enemy(enemyData.x, enemyData.y, enemyData.type);
                this.enemies.push(enemy);
            }
            
            // Créer les items
            for (const itemData of room.items) {
                if (room.roomType === 'treasure') {
                    // Items spéciaux dans les salles aux trésors
                    itemManager.createItem(itemData.x, itemData.y, null, 'rare');
                } else {
                    itemManager.createItem(itemData.x, itemData.y);
                }
            }
        }
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    addItem(x, y, type = null) {
        if (this.player) {
            itemManager.createLootDrop(x, y, 'goblin', this.player.level);
        } else {
            itemManager.createItem(x, y, type);
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Mettre à jour les systèmes
        inputManager.update();
        
        // Collision avec les murs pour le joueur
        this.updatePlayerCollision();
        
        // Mettre à jour les entités
        this.player.update(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateProjectiles(deltaTime);
        
        // Mettre à jour les systèmes
        itemManager.update(deltaTime);
        particleSystem.update(deltaTime);
        this.camera.update(deltaTime);
        
        // Vérifier les conditions de victoire/défaite
        this.checkWinConditions();
        this.checkLoseConditions();
        
        // Mettre à jour l'UI
        this.updateUI();
    }

    updatePlayerCollision() {
        if (!this.player || !this.dungeon) return;
        
        const nextX = this.player.position.x + this.player.velocity.x * this.deltaTime;
        const nextY = this.player.position.y + this.player.velocity.y * this.deltaTime;
        
        // Vérifier collision X
        if (!this.dungeon.canMoveTo(nextX, this.player.position.y)) {
            this.player.velocity.x = 0;
        }
        
        // Vérifier collision Y
        if (!this.dungeon.canMoveTo(this.player.position.x, nextY)) {
            this.player.velocity.y = 0;
        }
        
        // Vérifier les escaliers
        if (this.dungeon.getTile(this.player.position.x, this.player.position.y) === GAME_CONSTANTS.TILE_TYPES.STAIRS) {
            this.completeLevel();
        }
    }

    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (!enemy.active) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            // Collision avec les murs
            const nextX = enemy.position.x + enemy.velocity.x * deltaTime;
            const nextY = enemy.position.y + enemy.velocity.y * deltaTime;
            
            if (!this.dungeon.canMoveTo(nextX, enemy.position.y)) {
                enemy.velocity.x = 0;
            }
            
            if (!this.dungeon.canMoveTo(enemy.position.x, nextY)) {
                enemy.velocity.y = 0;
            }
            
            enemy.update(deltaTime);
        }
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (!projectile.active) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            projectile.update(deltaTime);
        }
    }

    checkWinConditions() {
        // Vérifier si tous les ennemis sont morts (optionnel)
        const activeEnemies = this.enemies.filter(e => e.active);
        if (activeEnemies.length === 0 && this.enemies.length > 0) {
            // Tous les ennemis sont morts, donner un bonus
            if (this.player) {
                this.player.addExperience(50);
            }
        }
    }

    checkLoseConditions() {
        if (this.player && !this.player.active) {
            this.gameOver();
        }
    }

    completeLevel() {
        const bonus = this.currentLevel * 100;
        const itemReward = Math.random() < 0.7 ? itemManager.createItem(0, 0, null, 'uncommon') : null;
        
        if (this.player) {
            this.player.score += bonus;
        }
        
        uiManager.levelComplete({
            bonus: bonus,
            item: itemReward
        });
        
        this.state = 'paused';
        
        console.log(`Niveau ${this.currentLevel} terminé!`);
    }

    nextLevel() {
        this.currentLevel++;
        this.generateLevel();
        this.state = 'playing';
        
        uiManager.showNotification(`Niveau ${this.currentLevel}`, new Color(100, 255, 100));
    }

    gameOver() {
        const stats = {
            score: this.player ? this.player.score : 0,
            level: this.currentLevel,
            enemiesKilled: this.enemiesKilled
        };
        
        this.state = 'gameover';
        uiManager.gameOver(stats);
        
        console.log('Game Over!', stats);
    }

    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
        }
    }

    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
        }
    }

    restart() {
        this.newGame();
    }

    stop() {
        this.state = 'menu';
    }

    updateUI() {
        const gameData = {
            player: this.player,
            level: this.currentLevel,
            score: this.player ? this.player.score : 0,
            inventory: this.player ? this.player.inventory : []
        };
        
        uiManager.updateGameUI(gameData);
    }

    render() {
        if (!this.ctx) return;
        
        // Nettoyer le canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state === 'playing' || this.state === 'paused') {
            this.renderGame();
        }
        
        // Rendu des notifications UI
        uiManager.renderNotifications(this.ctx, this.camera.width, this.camera.height);
        
        // Affichage FPS en mode debug
        if (this.frameCount % 60 === 0) {
            this.fpsDisplay = Math.round(1 / this.deltaTime);
        }
        
        this.renderDebugInfo();
    }

    renderGame() {
        this.ctx.save();
        
        // Appliquer la transformation de la caméra
        this.ctx.translate(-this.camera.x + this.camera.shake.x, -this.camera.y + this.camera.shake.y);
        
        // Rendu du donjon
        if (this.dungeon) {
            this.dungeon.render(this.ctx, this.camera);
        }
        
        // Rendu des items
        itemManager.render(this.ctx);
        
        // Rendu des entités
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        for (const enemy of this.enemies) {
            if (this.isEntityVisible(enemy)) {
                enemy.render(this.ctx);
            }
        }
        
        for (const projectile of this.projectiles) {
            if (this.isEntityVisible(projectile)) {
                projectile.render(this.ctx);
            }
        }
        
        // Rendu des particules
        particleSystem.render(this.ctx);
        
        this.ctx.restore();
        
        // Effet de pause
        if (this.state === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.camera.width, this.camera.height);
        }
    }

    renderDebugInfo() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        let y = 20;
        const debugInfo = [
            `FPS: ${this.fpsDisplay}`,
            `Entités: ${this.enemies.length + this.projectiles.length + 1}`,
            `Particules: ${particleSystem.getActiveCount()}`,
            `Items: ${itemManager.items.length}`,
            `Niveau: ${this.currentLevel}`,
            `Position: ${Math.round(this.player?.position.x || 0)}, ${Math.round(this.player?.position.y || 0)}`
        ];
        
        for (const info of debugInfo) {
            this.ctx.fillText(info, 10, y);
            y += 18;
        }
    }

    isEntityVisible(entity) {
        if (!this.cullingEnabled) return true;
        
        const margin = 50;
        return entity.position.x + entity.width >= this.camera.x - margin &&
               entity.position.x - entity.width <= this.camera.x + this.camera.width + margin &&
               entity.position.y + entity.height >= this.camera.y - margin &&
               entity.position.y - entity.height <= this.camera.y + this.camera.height + margin;
    }

    gameLoop(currentTime) {
        // Calculer deltaTime
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1/30); // Cap à 30 FPS minimum
        this.lastTime = currentTime;
        this.frameCount++;
        
        // Mise à jour
        this.update(this.deltaTime);
        
        // Rendu
        this.render();
        
        // Continuer la boucle
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    start() {
        console.log('Démarrage de la boucle de jeu');
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Sauvegarde et chargement
    saveGame() {
        const saveData = {
            currentLevel: this.currentLevel,
            enemiesKilled: this.enemiesKilled,
            player: this.player ? {
                position: this.player.position,
                health: this.player.health,
                maxHealth: this.player.maxHealth,
                score: this.player.score,
                level: this.player.level,
                experience: this.player.experience,
                experienceToNext: this.player.experienceToNext,
                attackDamage: this.player.attackDamage,
                inventory: this.player.inventory
            } : null,
            timestamp: Date.now()
        };
        
        localStorage.setItem('dungeonCrawlerSave', JSON.stringify(saveData));
        console.log('Partie sauvegardée');
    }

    loadGame() {
        try {
            const saveData = JSON.parse(localStorage.getItem('dungeonCrawlerSave'));
            if (!saveData) return false;
            
            this.currentLevel = saveData.currentLevel;
            this.enemiesKilled = saveData.enemiesKilled;
            
            // Générer le niveau actuel
            this.generateLevel();
            
            // Restaurer le joueur
            if (saveData.player && this.player) {
                this.player.position.set(saveData.player.position.x, saveData.player.position.y);
                this.player.health = saveData.player.health;
                this.player.maxHealth = saveData.player.maxHealth;
                this.player.score = saveData.player.score;
                this.player.level = saveData.player.level;
                this.player.experience = saveData.player.experience;
                this.player.experienceToNext = saveData.player.experienceToNext;
                this.player.attackDamage = saveData.player.attackDamage;
                this.player.inventory = saveData.player.inventory || [];
            }
            
            this.state = 'playing';
            
            console.log('Partie chargée');
            uiManager.showNotification('Partie chargée!', new Color(100, 255, 100));
            
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            return false;
        }
    }

    showNotification(message, color) {
        uiManager.showNotification(message, color);
    }
}

// Instance globale du jeu
const game = new Game();