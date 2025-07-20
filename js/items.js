// Système d'items et d'inventaire
class Item {
    constructor(x, y, type, rarity = 'common') {
        this.position = new Vector2(x, y);
        this.type = type;
        this.rarity = rarity;
        this.width = 16;
        this.height = 16;
        this.active = true;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 2;
        this.bobHeight = 3;
        this.glowIntensity = 0;
        this.collected = false;
        this.magnetRange = 50;
        this.magnetSpeed = 200;
        
        this.setupByType();
        this.setupByRarity();
    }

    setupByType() {
        switch (this.type) {
            case GAME_CONSTANTS.ITEM_TYPES.HEALTH_POTION:
                this.name = 'Potion de Vie';
                this.description = 'Restaure 50 PV';
                this.color = new Color(255, 100, 100);
                this.value = 50;
                this.consumable = true;
                break;
                
            case GAME_CONSTANTS.ITEM_TYPES.MANA_POTION:
                this.name = 'Potion de Mana';
                this.description = 'Restaure 30 MP';
                this.color = new Color(100, 100, 255);
                this.value = 30;
                this.consumable = true;
                break;
                
            case GAME_CONSTANTS.ITEM_TYPES.WEAPON:
                this.name = 'Épée';
                this.description = '+10 Dégâts d\'attaque';
                this.color = new Color(200, 200, 200);
                this.value = 10;
                this.consumable = false;
                this.statBonus = { attack: 10 };
                break;
                
            case GAME_CONSTANTS.ITEM_TYPES.ARMOR:
                this.name = 'Armure';
                this.description = '+20 PV max';
                this.color = new Color(150, 150, 200);
                this.value = 20;
                this.consumable = false;
                this.statBonus = { health: 20 };
                break;
                
            case GAME_CONSTANTS.ITEM_TYPES.KEY:
                this.name = 'Clé';
                this.description = 'Ouvre les portes verrouillées';
                this.color = new Color(255, 255, 100);
                this.value = 1;
                this.consumable = true;
                break;
                
            case GAME_CONSTANTS.ITEM_TYPES.TREASURE:
                this.name = 'Trésor';
                this.description = '+100 Points';
                this.color = new Color(255, 215, 0);
                this.value = 100;
                this.consumable = true;
                break;
        }
    }

    setupByRarity() {
        switch (this.rarity) {
            case 'common':
                this.rarityColor = new Color(255, 255, 255);
                this.rarityMultiplier = 1;
                break;
            case 'uncommon':
                this.rarityColor = new Color(0, 255, 0);
                this.rarityMultiplier = 1.5;
                this.name = `${this.name} +`;
                break;
            case 'rare':
                this.rarityColor = new Color(0, 150, 255);
                this.rarityMultiplier = 2;
                this.name = `${this.name} ++`;
                break;
            case 'epic':
                this.rarityColor = new Color(150, 0, 255);
                this.rarityMultiplier = 3;
                this.name = `${this.name} +++`;
                break;
            case 'legendary':
                this.rarityColor = new Color(255, 165, 0);
                this.rarityMultiplier = 5;
                this.name = `Légendaire ${this.name}`;
                break;
        }
        
        // Appliquer le multiplicateur de rareté
        this.value = Math.floor(this.value * this.rarityMultiplier);
        if (this.statBonus) {
            for (let stat in this.statBonus) {
                this.statBonus[stat] = Math.floor(this.statBonus[stat] * this.rarityMultiplier);
            }
        }
    }

    update(deltaTime) {
        if (!this.active) return;

        // Animation de flottement
        this.bobOffset += this.bobSpeed * deltaTime;
        
        // Effet de lueur
        this.glowIntensity = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
        
        // Attirer vers le joueur s'il est proche
        if (game.player && game.player.active) {
            const distance = this.position.distance(game.player.position);
            if (distance <= this.magnetRange) {
                const direction = Vector2.from(game.player.position).subtract(this.position).normalize();
                this.position.add(Vector2.from(direction).multiply(this.magnetSpeed * deltaTime));
                
                // Collecter si très proche
                if (distance <= 20) {
                    this.collect();
                }
            }
        }
    }

    collect() {
        if (this.collected) return;
        
        this.collected = true;
        this.active = false;
        
        // Appliquer l'effet de l'item
        this.applyEffect();
        
        // Effets visuels et sonores
        audioManager.playRandomItemSound();
        particleSystem.createItemPickupEffect(this.position.x, this.position.y, this.type);
        inputManager.vibrate(50);
        
        // Notification
        game.showNotification(`${this.name} ramassé!`, this.rarityColor);
    }

    applyEffect() {
        if (!game.player || !game.player.active) return;

        switch (this.type) {
            case GAME_CONSTANTS.ITEM_TYPES.HEALTH_POTION:
                game.player.heal(this.value);
                break;
                
            case GAME_CONSTANTS.ITEM_TYPES.MANA_POTION:
                // Restaurer mana (à implémenter si système de mana ajouté)
                break;
                
            case GAME_CONSTANTS.ITEM_TYPES.WEAPON:
                if (this.statBonus.attack) {
                    game.player.attackDamage += this.statBonus.attack;
                }
                break;
                
            case GAME_CONSTANTS.ITEM_TYPES.ARMOR:
                if (this.statBonus.health) {
                    game.player.maxHealth += this.statBonus.health;
                    game.player.heal(this.statBonus.health);
                }
                break;
                
            case GAME_CONSTANTS.ITEM_TYPES.KEY:
                // Ajouter à l'inventaire du joueur
                game.player.addItem(this);
                break;
                
            case GAME_CONSTANTS.ITEM_TYPES.TREASURE:
                game.player.score += this.value;
                break;
        }
    }

    render(ctx) {
        if (!this.active) return;

        const bobY = Math.sin(this.bobOffset) * this.bobHeight;
        const renderY = this.position.y + bobY;

        // Effet de lueur
        const glowSize = 5 + this.glowIntensity * 3;
        const glowGradient = ctx.createRadialGradient(
            this.position.x, renderY, 0,
            this.position.x, renderY, glowSize
        );
        glowGradient.addColorStop(0, `rgba(${this.rarityColor.r}, ${this.rarityColor.g}, ${this.rarityColor.b}, 0.3)`);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.position.x, renderY, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Item principal
        ctx.fillStyle = this.color.toString();
        ctx.fillRect(
            this.position.x - this.width / 2,
            renderY - this.height / 2,
            this.width,
            this.height
        );

        // Bordure de rareté
        ctx.strokeStyle = this.rarityColor.toString();
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.position.x - this.width / 2 - 1,
            renderY - this.height / 2 - 1,
            this.width + 2,
            this.height + 2
        );

        // Icône spécifique selon le type
        this.renderIcon(ctx, this.position.x, renderY);
    }

    renderIcon(ctx, x, y) {
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        switch (this.type) {
            case GAME_CONSTANTS.ITEM_TYPES.HEALTH_POTION:
                ctx.fillText('❤', x, y);
                break;
            case GAME_CONSTANTS.ITEM_TYPES.MANA_POTION:
                ctx.fillText('💙', x, y);
                break;
            case GAME_CONSTANTS.ITEM_TYPES.WEAPON:
                ctx.fillText('⚔', x, y);
                break;
            case GAME_CONSTANTS.ITEM_TYPES.ARMOR:
                ctx.fillText('🛡', x, y);
                break;
            case GAME_CONSTANTS.ITEM_TYPES.KEY:
                ctx.fillText('🗝', x, y);
                break;
            case GAME_CONSTANTS.ITEM_TYPES.TREASURE:
                ctx.fillText('💰', x, y);
                break;
        }
    }

    getBounds() {
        return {
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

class ItemManager {
    constructor() {
        this.items = [];
        this.rarityWeights = {
            'common': 50,
            'uncommon': 25,
            'rare': 15,
            'epic': 8,
            'legendary': 2
        };
    }

    createItem(x, y, type = null, rarity = null) {
        // Type aléatoire si non spécifié
        if (!type) {
            const types = Object.values(GAME_CONSTANTS.ITEM_TYPES);
            type = Utils.choice(types);
        }

        // Rareté aléatoire basée sur les poids
        if (!rarity) {
            rarity = this.getRandomRarity();
        }

        const item = new Item(x, y, type, rarity);
        this.items.push(item);
        return item;
    }

    getRandomRarity() {
        const totalWeight = Object.values(this.rarityWeights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [rarity, weight] of Object.entries(this.rarityWeights)) {
            random -= weight;
            if (random <= 0) {
                return rarity;
            }
        }
        
        return 'common';
    }

    createLootDrop(x, y, enemyType, playerLevel = 1) {
        // Chances d'obtenir différents types d'items selon l'ennemi
        let itemChances = {};
        
        switch (enemyType) {
            case GAME_CONSTANTS.ENEMY_TYPES.GOBLIN:
                itemChances = {
                    [GAME_CONSTANTS.ITEM_TYPES.HEALTH_POTION]: 0.4,
                    [GAME_CONSTANTS.ITEM_TYPES.TREASURE]: 0.3,
                    [GAME_CONSTANTS.ITEM_TYPES.WEAPON]: 0.2,
                    [GAME_CONSTANTS.ITEM_TYPES.KEY]: 0.1
                };
                break;
                
            case GAME_CONSTANTS.ENEMY_TYPES.ORC:
                itemChances = {
                    [GAME_CONSTANTS.ITEM_TYPES.WEAPON]: 0.3,
                    [GAME_CONSTANTS.ITEM_TYPES.ARMOR]: 0.25,
                    [GAME_CONSTANTS.ITEM_TYPES.HEALTH_POTION]: 0.25,
                    [GAME_CONSTANTS.ITEM_TYPES.TREASURE]: 0.2
                };
                break;
                
            case GAME_CONSTANTS.ENEMY_TYPES.SKELETON:
                itemChances = {
                    [GAME_CONSTANTS.ITEM_TYPES.MANA_POTION]: 0.3,
                    [GAME_CONSTANTS.ITEM_TYPES.KEY]: 0.25,
                    [GAME_CONSTANTS.ITEM_TYPES.WEAPON]: 0.25,
                    [GAME_CONSTANTS.ITEM_TYPES.TREASURE]: 0.2
                };
                break;
                
            case GAME_CONSTANTS.ENEMY_TYPES.BOSS:
                // Les boss donnent toujours des objets rares
                itemChances = {
                    [GAME_CONSTANTS.ITEM_TYPES.WEAPON]: 0.3,
                    [GAME_CONSTANTS.ITEM_TYPES.ARMOR]: 0.3,
                    [GAME_CONSTANTS.ITEM_TYPES.TREASURE]: 0.4
                };
                break;
        }

        // Choisir un type d'item
        const random = Math.random();
        let cumulative = 0;
        let chosenType = GAME_CONSTANTS.ITEM_TYPES.HEALTH_POTION;
        
        for (const [type, chance] of Object.entries(itemChances)) {
            cumulative += chance;
            if (random <= cumulative) {
                chosenType = type;
                break;
            }
        }

        // Modifier les chances de rareté selon le niveau
        let modifiedRarityWeights = { ...this.rarityWeights };
        
        if (enemyType === GAME_CONSTANTS.ENEMY_TYPES.BOSS) {
            // Les boss ont de meilleures chances d'objets rares
            modifiedRarityWeights = {
                'common': 20,
                'uncommon': 30,
                'rare': 25,
                'epic': 20,
                'legendary': 5
            };
        } else if (playerLevel > 5) {
            // Niveau élevé = meilleures chances
            modifiedRarityWeights = {
                'common': 40,
                'uncommon': 30,
                'rare': 20,
                'epic': 8,
                'legendary': 2
            };
        }

        // Utiliser temporairement les poids modifiés
        const originalWeights = this.rarityWeights;
        this.rarityWeights = modifiedRarityWeights;
        const rarity = this.getRandomRarity();
        this.rarityWeights = originalWeights;

        return this.createItem(x, y, chosenType, rarity);
    }

    update(deltaTime) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(deltaTime);
            
            if (!item.active) {
                this.items.splice(i, 1);
            }
        }
    }

    render(ctx) {
        for (const item of this.items) {
            item.render(ctx);
        }
    }

    clear() {
        this.items = [];
    }

    getItemsInRange(x, y, range) {
        return this.items.filter(item => {
            return item.active && item.position.distance(new Vector2(x, y)) <= range;
        });
    }

    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    }
}

// Instance globale du gestionnaire d'items
const itemManager = new ItemManager();