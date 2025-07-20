// Point d'entrée principal du jeu
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Dungeon Crawler - Initialisation...');
    
    // Vérification du support des fonctionnalités nécessaires
    checkBrowserSupport();
    
    // Configuration PWA
    setupPWA();
    
    // Initialisation des systèmes
    initializeSystems();
    
    // Démarrage du jeu
    startGame();
    
    console.log('✅ Dungeon Crawler - Prêt à jouer!');
});

function checkBrowserSupport() {
    const features = {
        'Canvas 2D': !!document.createElement('canvas').getContext('2d'),
        'Local Storage': !!window.localStorage,
        'RequestAnimationFrame': !!window.requestAnimationFrame,
        'Audio Context': !!(window.AudioContext || window.webkitAudioContext),
        'Touch Events': 'ontouchstart' in window,
        'Device Pixel Ratio': !!window.devicePixelRatio
    };
    
    console.log('🔍 Vérification du support navigateur:');
    for (const [feature, supported] of Object.entries(features)) {
        console.log(`${supported ? '✅' : '❌'} ${feature}`);
    }
    
    // Vérifications critiques
    if (!features['Canvas 2D']) {
        showCriticalError('Ce navigateur ne supporte pas Canvas 2D');
        return false;
    }
    
    if (!features['RequestAnimationFrame']) {
        showCriticalError('Ce navigateur ne supporte pas RequestAnimationFrame');
        return false;
    }
    
    return true;
}

function showCriticalError(message) {
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a2e; color: white; font-family: Arial, sans-serif; text-align: center;">
            <div>
                <h1 style="color: #ff6b6b;">❌ Erreur Critique</h1>
                <p>${message}</p>
                <p>Veuillez utiliser un navigateur plus récent.</p>
            </div>
        </div>
    `;
}

function setupPWA() {
    // Enregistrer le Service Worker (si disponible)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('🔧 Service Worker enregistré:', registration.scope);
            })
            .catch(error => {
                console.log('⚠️ Échec de l\'enregistrement du Service Worker:', error);
            });
    }
    
    // Gérer l'installation PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('📱 Prompt d\'installation PWA disponible');
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt();
    });
    
    function showInstallPrompt() {
        // Créer un bouton d'installation discret
        const installButton = document.createElement('button');
        installButton.textContent = '📱 Installer l\'app';
        installButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: #4a9eff;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                console.log('👤 Choix utilisateur pour l\'installation:', result.outcome);
                deferredPrompt = null;
                installButton.remove();
            }
        });
        
        document.body.appendChild(installButton);
        
        // Masquer automatiquement après 10 secondes
        setTimeout(() => {
            if (installButton.parentNode) {
                installButton.remove();
            }
        }, 10000);
    }
    
    // Détecter si l'app est lancée depuis l'écran d'accueil
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('🚀 Application lancée en mode standalone');
        document.body.classList.add('standalone');
    }
}

function initializeSystems() {
    // Initialiser les gestionnaires globaux
    try {
        // Les instances sont déjà créées dans leurs fichiers respectifs
        console.log('🎵 Audio Manager:', audioManager ? '✅' : '❌');
        console.log('🎮 Input Manager:', inputManager ? '✅' : '❌');
        console.log('🖥️ UI Manager:', uiManager ? '✅' : '❌');
        console.log('✨ Particle System:', particleSystem ? '✅' : '❌');
        console.log('📦 Item Manager:', itemManager ? '✅' : '❌');
        
        // Configuration des paramètres selon l'appareil
        detectAndConfigureDevice();
        
        // Gestion des erreurs globales
        setupErrorHandling();
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des systèmes:', error);
        showCriticalError('Erreur lors de l\'initialisation du jeu');
    }
}

function detectAndConfigureDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    
    console.log('📱 Détection d\'appareil:');
    console.log(`Device: ${isMobile ? 'Mobile' : 'Desktop'}`);
    console.log(`Tablet: ${isTablet}`);
    console.log(`iOS: ${isIOS}`);
    console.log(`Android: ${isAndroid}`);
    console.log(`Screen: ${screen.width}x${screen.height}`);
    console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
    console.log(`DPR: ${window.devicePixelRatio}`);
    
    // Ajuster les paramètres selon l'appareil
    document.body.classList.add(isMobile ? 'mobile' : 'desktop');
    
    if (isMobile) {
        document.body.classList.add('touch-device');
        
        // Optimisations mobiles
        if (window.devicePixelRatio > 2) {
            console.log('🔧 Appareil haute densité détecté, ajustement des performances');
            localStorage.setItem('graphicsQuality', 'medium');
        }
        
        // Prévenir le zoom sur les inputs
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    if (isIOS) {
        document.body.classList.add('ios');
        
        // Correctifs spécifiques iOS
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // Gérer les zones sûres iOS
        if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
            document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
        }
    }
    
    if (isAndroid) {
        document.body.classList.add('android');
    }
}

function setupErrorHandling() {
    // Capturer les erreurs JavaScript
    window.addEventListener('error', (event) => {
        console.error('💥 Erreur JavaScript:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
        
        // En production, vous pourriez envoyer ces erreurs à un service de monitoring
        reportError('JavaScript Error', event.error || event.message);
    });
    
    // Capturer les promesses rejetées
    window.addEventListener('unhandledrejection', (event) => {
        console.error('💥 Promesse rejetée:', event.reason);
        reportError('Unhandled Promise Rejection', event.reason);
    });
    
    // Capturer les erreurs de ressources
    window.addEventListener('error', (event) => {
        if (event.target !== window) {
            console.error('💥 Erreur de ressource:', {
                type: event.target.tagName,
                source: event.target.src || event.target.href,
                message: 'Failed to load resource'
            });
        }
    }, true);
}

function reportError(type, error) {
    // En mode développement, just log
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return;
    }
    
    // En production, vous pourriez envoyer à un service comme Sentry, LogRocket, etc.
    try {
        const errorReport = {
            type,
            error: error?.toString() || 'Unknown error',
            userAgent: navigator.userAgent,
            url: location.href,
            timestamp: new Date().toISOString(),
            gameState: game?.state || 'unknown'
        };
        
        // Exemple d'envoi (à adapter selon votre service)
        // fetch('/api/errors', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(errorReport)
        // });
        
        console.log('📊 Rapport d\'erreur généré:', errorReport);
    } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
    }
}

function startGame() {
    try {
        // Vérifier que le jeu est initialisé
        if (!game) {
            throw new Error('Instance de jeu non trouvée');
        }
        
        // Démarrer la boucle de jeu
        game.start();
        
        console.log('🎮 Boucle de jeu démarrée');
        
        // Analytics/métriques de démarrage
        logGameStart();
        
    } catch (error) {
        console.error('❌ Impossible de démarrer le jeu:', error);
        showCriticalError('Impossible de démarrer le jeu: ' + error.message);
    }
}

function logGameStart() {
    const startMetrics = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screen: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio,
        language: navigator.language,
        platform: navigator.platform,
        connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt
        } : null
    };
    
    console.log('📊 Métriques de démarrage:', startMetrics);
    
    // En production, envoyer ces métriques à votre service d'analytics
    localStorage.setItem('gameStartMetrics', JSON.stringify(startMetrics));
}

// Gestion de la visibilité de la page (pause automatique)
document.addEventListener('visibilitychange', () => {
    if (game && game.state === 'playing') {
        if (document.visibilityState === 'hidden') {
            console.log('🔄 Page cachée, pause automatique du jeu');
            game.pause();
            uiManager.showScreen('pauseScreen');
        }
        // Note: on ne reprend pas automatiquement quand la page redevient visible
        // pour éviter les reprises accidentelles
    }
});

// Gestion des raccourcis clavier globaux
document.addEventListener('keydown', (e) => {
    // F11 pour le plein écran
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
    
    // Ctrl+S pour sauvegarder (override du navigateur)
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (game && game.player) {
            game.saveGame();
            uiManager.showNotification('Partie sauvegardée!', new Color(100, 255, 100));
        }
    }
    
    // F12 pour toggle debug (en développement)
    if (e.key === 'F12' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        e.preventDefault();
        toggleDebugMode();
    }
});

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            console.log('🖥️ Mode plein écran activé');
            uiManager.showNotification('Mode plein écran', new Color(100, 255, 100));
        }).catch(err => {
            console.log('❌ Impossible d\'activer le plein écran:', err);
        });
    } else {
        document.exitFullscreen().then(() => {
            console.log('🖥️ Mode plein écran désactivé');
        });
    }
}

function toggleDebugMode() {
    const debugEnabled = localStorage.getItem('debugMode') === 'true';
    localStorage.setItem('debugMode', (!debugEnabled).toString());
    
    if (game) {
        game.debugMode = !debugEnabled;
    }
    
    console.log(`🐛 Mode debug: ${!debugEnabled ? 'activé' : 'désactivé'}`);
    uiManager.showNotification(`Debug: ${!debugEnabled ? 'ON' : 'OFF'}`, new Color(255, 255, 100));
}

// Performance monitoring
let performanceMetrics = {
    frameCount: 0,
    lastFPSCheck: performance.now(),
    fpsHistory: [],
    memoryHistory: []
};

setInterval(() => {
    // Mesurer les FPS
    const now = performance.now();
    const deltaTime = now - performanceMetrics.lastFPSCheck;
    const fps = Math.round(1000 / (deltaTime / 60));
    
    performanceMetrics.fpsHistory.push(fps);
    if (performanceMetrics.fpsHistory.length > 60) {
        performanceMetrics.fpsHistory.shift();
    }
    
    // Mesurer la mémoire (si disponible)
    if (performance.memory) {
        const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        performanceMetrics.memoryHistory.push(memoryMB);
        if (performanceMetrics.memoryHistory.length > 60) {
            performanceMetrics.memoryHistory.shift();
        }
    }
    
    performanceMetrics.lastFPSCheck = now;
    
    // Alerter si les performances sont mauvaises
    const avgFPS = performanceMetrics.fpsHistory.reduce((a, b) => a + b, 0) / performanceMetrics.fpsHistory.length;
    if (avgFPS < 30 && performanceMetrics.fpsHistory.length > 30) {
        console.warn('⚠️ Performances dégradées détectées, FPS moyen:', Math.round(avgFPS));
        
        // Suggérer des optimisations automatiques
        if (localStorage.getItem('graphicsQuality') !== 'low') {
            console.log('🔧 Réduction automatique de la qualité graphique');
            localStorage.setItem('graphicsQuality', 'low');
            uiManager.setGraphicsQuality('low');
            uiManager.showNotification('Qualité réduite pour améliorer les performances', new Color(255, 200, 100));
        }
    }
}, 1000);

console.log('🎯 Main.js chargé, en attente de DOMContentLoaded...');