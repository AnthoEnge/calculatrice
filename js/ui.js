// Système de gestion de l'interface utilisateur
class UIManager {
    constructor() {
        this.currentScreen = 'start';
        this.notifications = [];
        this.menuAnimations = new Map();
        this.transitions = new Map();
        
        this.setupEventListeners();
        this.loadSettings();
    }

    setupEventListeners() {
        // Boutons du menu principal
        document.getElementById('startBtn')?.addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('continueBtn')?.addEventListener('click', () => {
            this.continueGame();
        });

        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('aboutBtn')?.addEventListener('click', () => {
            this.showAbout();
        });

        // Boutons de pause
        document.getElementById('pauseBtn')?.addEventListener('click', () => {
            this.pauseGame();
        });

        document.getElementById('resumeBtn')?.addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('restartBtn')?.addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('mainMenuBtn')?.addEventListener('click', () => {
            this.returnToMainMenu();
        });

        // Boutons de game over
        document.getElementById('playAgainBtn')?.addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('backToMenuBtn')?.addEventListener('click', () => {
            this.returnToMainMenu();
        });

        // Boutons de niveau complété
        document.getElementById('nextLevelBtn')?.addEventListener('click', () => {
            this.nextLevel();
        });

        // Boutons des paramètres
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('cancelSettingsBtn')?.addEventListener('click', () => {
            this.hideSettings();
        });

        // Sliders des paramètres
        document.getElementById('soundVolume')?.addEventListener('input', (e) => {
            audioManager.setSoundVolume(e.target.value / 100);
        });

        document.getElementById('musicVolume')?.addEventListener('input', (e) => {
            audioManager.setMusicVolume(e.target.value / 100);
        });

        // Sélecteur de qualité graphique
        document.getElementById('graphicsQuality')?.addEventListener('change', (e) => {
            this.setGraphicsQuality(e.target.value);
        });

        // Gestion des touches pour les menus
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }

    showScreen(screenId) {
        // Masquer tous les écrans
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Afficher l'écran demandé
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
            
            // Jouer un son d'interface
            audioManager.playUISound('click');
            
            // Animation d'entrée
            this.animateScreenTransition(screen);
        }
    }

    animateScreenTransition(screen) {
        const container = screen.querySelector('.menu-container');
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'scale(0.9) translateY(20px)';
            
            // Animation d'entrée
            setTimeout(() => {
                container.style.transition = 'all 0.3s ease-out';
                container.style.opacity = '1';
                container.style.transform = 'scale(1) translateY(0)';
            }, 50);
        }
    }

    startNewGame() {
        this.showScreen('gameScreen');
        
        // Initialiser ou redémarrer le jeu
        if (window.game) {
            game.newGame();
        }
        
        // Démarrer la musique
        audioManager.playBackgroundMusic();
        
        // Masquer le curseur sur mobile
        if (this.isMobile()) {
            document.body.style.cursor = 'none';
        }
    }

    continueGame() {
        if (this.hasSavedGame()) {
            this.showScreen('gameScreen');
            
            if (window.game) {
                game.loadGame();
            }
            
            audioManager.playBackgroundMusic();
        } else {
            this.showNotification('Aucune partie sauvegardée trouvée!', new Color(255, 100, 100));
            audioManager.playUISound('error');
        }
    }

    pauseGame() {
        if (window.game && game.state === 'playing') {
            game.pause();
            this.showScreen('pauseScreen');
            audioManager.playUISound('click');
        }
    }

    resumeGame() {
        if (window.game) {
            game.resume();
            this.showScreen('gameScreen');
            audioManager.playUISound('click');
        }
    }

    restartGame() {
        if (window.game) {
            game.restart();
            this.showScreen('gameScreen');
            audioManager.playUISound('click');
        }
    }

    returnToMainMenu() {
        this.showScreen('startScreen');
        
        if (window.game) {
            game.saveGame();
            game.stop();
        }
        
        audioManager.stopBackgroundMusic();
        document.body.style.cursor = 'default';
        
        // Mettre à jour le bouton Continuer
        this.updateContinueButton();
    }

    gameOver(stats) {
        this.showScreen('gameOverScreen');
        audioManager.stopBackgroundMusic();
        
        // Mettre à jour les stats finales
        document.getElementById('finalScore').textContent = stats.score || 0;
        document.getElementById('finalLevel').textContent = stats.level || 1;
        document.getElementById('enemiesKilled').textContent = stats.enemiesKilled || 0;
        
        // Sauvegarder le meilleur score
        this.saveHighScore(stats.score || 0);
    }

    levelComplete(levelData) {
        this.showScreen('levelCompleteScreen');
        
        // Mettre à jour les récompenses
        document.getElementById('levelBonus').textContent = levelData.bonus || 0;
        
        // Afficher la récompense d'objet
        const itemReward = document.getElementById('itemReward');
        if (levelData.item) {
            itemReward.textContent = `Nouvel objet: ${levelData.item.name}`;
            itemReward.style.display = 'block';
        } else {
            itemReward.style.display = 'none';
        }
        
        audioManager.playSound('levelComplete');
    }

    nextLevel() {
        this.showScreen('gameScreen');
        
        if (window.game) {
            game.nextLevel();
        }
        
        audioManager.playUISound('success');
    }

    showSettings() {
        this.showScreen('settingsScreen');
        this.loadSettingsUI();
    }

    hideSettings() {
        this.showScreen('startScreen');
    }

    loadSettingsUI() {
        // Charger les valeurs actuelles dans l'interface
        document.getElementById('soundVolume').value = audioManager.soundVolume * 100;
        document.getElementById('musicVolume').value = audioManager.musicVolume * 100;
        
        // Charger la qualité graphique
        const quality = localStorage.getItem('graphicsQuality') || 'medium';
        document.getElementById('graphicsQuality').value = quality;
    }

    saveSettings() {
        audioManager.saveSettings();
        
        const quality = document.getElementById('graphicsQuality').value;
        localStorage.setItem('graphicsQuality', quality);
        this.setGraphicsQuality(quality);
        
        this.showNotification('Paramètres sauvegardés!', new Color(100, 255, 100));
        audioManager.playUISound('success');
        
        this.hideSettings();
    }

    setGraphicsQuality(quality) {
        // Ajuster les paramètres de qualité graphique
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            switch (quality) {
                case 'low':
                    canvas.style.imageRendering = 'pixelated';
                    break;
                case 'medium':
                    canvas.style.imageRendering = 'auto';
                    break;
                case 'high':
                    canvas.style.imageRendering = 'crisp-edges';
                    break;
            }
        }
    }

    showAbout() {
        const aboutText = `
Dungeon Crawler v1.0

Un jeu rogue-like mobile inspiré des meilleurs jeux du genre.

Fonctionnalités:
• Génération procédurale de donjons
• Combat tactique en temps réel
• Système de progression
• Objets avec rareté
• Contrôles tactiles optimisés
• Effets visuels et sonores

Développé avec amour pour les fans de rogue-likes!

Appuyez sur Échap pour fermer.
        `;
        
        alert(aboutText);
    }

    showNotification(message, color = new Color(255, 255, 255), duration = 3000) {
        const notification = {
            message,
            color,
            duration,
            startTime: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        };
        
        this.notifications.push(notification);
        
        // Limiter le nombre de notifications
        if (this.notifications.length > 5) {
            this.notifications.shift();
        }
        
        // Supprimer automatiquement après la durée
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
    }

    removeNotification(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notifications.splice(index, 1);
        }
    }

    updateGameUI(gameData) {
        if (this.currentScreen !== 'gameScreen') return;
        
        // Mettre à jour la barre de vie
        if (gameData.player) {
            const healthPercent = (gameData.player.health / gameData.player.maxHealth) * 100;
            const healthFill = document.getElementById('healthFill');
            const healthText = document.getElementById('healthText');
            
            if (healthFill) {
                healthFill.style.width = `${healthPercent}%`;
            }
            
            if (healthText) {
                healthText.textContent = `${gameData.player.health}/${gameData.player.maxHealth}`;
            }
            
            // Mettre à jour le niveau et le score
            document.getElementById('level').textContent = `Niveau ${gameData.level || 1}`;
            document.getElementById('score').textContent = `Score: ${gameData.score || 0}`;
        }
        
        // Mettre à jour l'inventaire
        this.updateInventory(gameData.inventory || []);
    }

    updateInventory(inventory) {
        for (let i = 0; i < 4; i++) {
            const slot = document.querySelector(`[data-slot="${i}"]`);
            if (slot) {
                if (inventory[i]) {
                    slot.classList.add('has-item');
                    slot.title = inventory[i].name || 'Objet';
                    slot.textContent = this.getItemIcon(inventory[i].type);
                } else {
                    slot.classList.remove('has-item');
                    slot.title = '';
                    slot.textContent = '';
                }
            }
        }
    }

    getItemIcon(itemType) {
        const icons = {
            [GAME_CONSTANTS.ITEM_TYPES.HEALTH_POTION]: '❤️',
            [GAME_CONSTANTS.ITEM_TYPES.MANA_POTION]: '💙',
            [GAME_CONSTANTS.ITEM_TYPES.WEAPON]: '⚔️',
            [GAME_CONSTANTS.ITEM_TYPES.ARMOR]: '🛡️',
            [GAME_CONSTANTS.ITEM_TYPES.KEY]: '🗝️',
            [GAME_CONSTANTS.ITEM_TYPES.TREASURE]: '💰'
        };
        return icons[itemType] || '❓';
    }

    renderNotifications(ctx, canvasWidth, canvasHeight) {
        const padding = 20;
        const notificationHeight = 40;
        const startY = padding;
        
        for (let i = 0; i < this.notifications.length; i++) {
            const notification = this.notifications[i];
            const elapsed = Date.now() - notification.startTime;
            const progress = elapsed / notification.duration;
            
            // Animation de fondu
            let alpha = 1;
            if (progress > 0.8) {
                alpha = (1 - progress) / 0.2;
            } else if (progress < 0.1) {
                alpha = progress / 0.1;
            }
            
            const y = startY + i * (notificationHeight + 10);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Fond de la notification
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(padding, y, canvasWidth - padding * 2, notificationHeight);
            
            // Bordure
            ctx.strokeStyle = notification.color.toString();
            ctx.lineWidth = 2;
            ctx.strokeRect(padding, y, canvasWidth - padding * 2, notificationHeight);
            
            // Texte
            ctx.fillStyle = notification.color.toString();
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                notification.message,
                canvasWidth / 2,
                y + notificationHeight / 2
            );
            
            ctx.restore();
        }
    }

    handleKeyPress(e) {
        switch (e.code) {
            case 'Escape':
                if (this.currentScreen === 'gameScreen') {
                    this.pauseGame();
                } else if (this.currentScreen === 'pauseScreen') {
                    this.resumeGame();
                } else if (this.currentScreen !== 'startScreen') {
                    this.returnToMainMenu();
                }
                break;
                
            case 'Enter':
                if (this.currentScreen === 'startScreen') {
                    this.startNewGame();
                } else if (this.currentScreen === 'gameOverScreen') {
                    this.startNewGame();
                } else if (this.currentScreen === 'levelCompleteScreen') {
                    this.nextLevel();
                }
                break;
        }
    }

    hasSavedGame() {
        return localStorage.getItem('dungeonCrawlerSave') !== null;
    }

    updateContinueButton() {
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            if (this.hasSavedGame()) {
                continueBtn.style.display = 'block';
            } else {
                continueBtn.style.display = 'none';
            }
        }
    }

    saveHighScore(score) {
        const currentHighScore = parseInt(localStorage.getItem('highScore')) || 0;
        if (score > currentHighScore) {
            localStorage.setItem('highScore', score.toString());
            this.showNotification('Nouveau record!', new Color(255, 215, 0));
        }
    }

    loadSettings() {
        // Charger les paramètres sauvegardés
        const quality = localStorage.getItem('graphicsQuality') || 'medium';
        this.setGraphicsQuality(quality);
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    resizeCanvas() {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Ajuster le DPR pour les écrans haute densité
            const dpr = window.devicePixelRatio || 1;
            canvas.width *= dpr;
            canvas.height *= dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
        }
    }

    init() {
        this.updateContinueButton();
        this.resizeCanvas();
        
        // Redimensionner automatiquement
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Gérer l'orientation sur mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.resizeCanvas();
            }, 100);
        });
    }
}

// Instance globale du gestionnaire d'UI
const uiManager = new UIManager();