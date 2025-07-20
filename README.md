# 🎮 Dungeon Crawler - Rogue-like Mobile

Un jeu rogue-like mobile inspiré des meilleurs jeux du genre comme Dead Cells, Enter the Gungeon et The Binding of Isaac. Développé entièrement en JavaScript avec HTML5 Canvas, optimisé pour les appareils mobiles.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Mobile%20%7C%20Desktop-lightgrey.svg)

## ✨ Fonctionnalités

### 🎯 Gameplay
- **Génération procédurale** de donjons uniques à chaque partie
- **Combat en temps réel** avec système de dash et d'attaques
- **Système de progression** avec niveaux et expérience
- **Objets avec rareté** (Commun, Rare, Épique, Légendaire)
- **Ennemis variés** avec IA et comportements différents
- **Boss de fin de niveau** avec mécaniques spéciales

### 📱 Optimisations Mobile
- **Contrôles tactiles** optimisés avec joystick virtuel
- **Interface responsive** adaptée à tous les écrans
- **PWA (Progressive Web App)** installable
- **Support offline** partiel
- **Vibration** pour le feedback haptique
- **Optimisations de performance** automatiques

### 🎨 Visuels & Audio
- **Système de particules** avancé pour les effets
- **Audio synthétique** sans fichiers externes
- **Animations fluides** et transitions
- **Thème sombre** adapté au gaming
- **Effets visuels** (screen shake, clignotements, etc.)

## 🚀 Installation

### Option 1: Installation en tant que PWA (Recommandé)
1. Ouvrez le jeu dans votre navigateur mobile
2. Ajoutez-le à l'écran d'accueil quand proposé
3. Lancez depuis l'icône sur votre écran d'accueil

### Option 2: Serveur local
```bash
# Cloner le projet
git clone <repository-url>
cd dungeon-crawler

# Servir avec un serveur HTTP simple
python -m http.server 8000
# ou
npx serve .
# ou
php -S localhost:8000

# Ouvrir http://localhost:8000
```

## 🎮 Comment Jouer

### Contrôles Mobile
- **Joystick virtuel** (bas gauche) : Déplacement
- **Bouton d'attaque** ⚔️ : Tirer des projectiles
- **Bouton de dash** 💨 : Esquive rapide
- **Bouton d'utilisation** 🎒 : Utiliser objets
- **Bouton pause** ⏸️ : Mettre en pause

### Contrôles Clavier (Desktop)
- **WASD / Flèches** : Déplacement
- **Espace** : Attaque
- **Shift** : Dash
- **E** : Utiliser objet
- **Échap** : Pause
- **F11** : Plein écran
- **Ctrl+S** : Sauvegarder

### Objectifs
1. Explorez le donjon généré procéduralement
2. Combattez les ennemis et collectez de l'expérience
3. Ramassez des objets pour améliorer vos stats
4. Trouvez les escaliers pour passer au niveau suivant
5. Battez le boss de chaque niveau
6. Survivez le plus longtemps possible !

## 🏗️ Architecture Technique

### Structure du Projet
```
dungeon-crawler/
├── index.html          # Point d'entrée
├── manifest.json       # Manifeste PWA
├── style.css          # Styles principaux
├── js/
│   ├── main.js         # Point d'entrée JS
│   ├── game.js         # Moteur de jeu principal
│   ├── utils.js        # Utilitaires mathématiques
│   ├── input.js        # Gestion des entrées
│   ├── audio.js        # Système audio
│   ├── particles.js    # Système de particules
│   ├── entities.js     # Joueur, ennemis, projectiles
│   ├── items.js        # Système d'objets
│   ├── dungeon.js      # Générateur de donjon
│   └── ui.js          # Interface utilisateur
└── README.md
```

### Technologies Utilisées
- **HTML5 Canvas** pour le rendu graphique
- **Web Audio API** pour les effets sonores synthétiques
- **Local Storage** pour la sauvegarde
- **Service Workers** pour le support offline (PWA)
- **CSS Grid/Flexbox** pour l'interface responsive
- **ES6+ JavaScript** avec classes et modules

### Systèmes Principaux

#### 🎲 Générateur de Donjon Procédural
- Algorithme de placement de salles
- Connexion par corridors en L
- Différents types de salles (normale, trésor, boss)
- Placement intelligent des ennemis et objets

#### 🤖 Intelligence Artificielle
- Pathfinding simple pour les ennemis
- États comportementaux (patrouille, poursuite, attaque)
- Différents types d'ennemis avec capacités uniques

#### ⚡ Système de Particules
- Pool d'objets pour les performances
- Différents types d'effets (sang, étincelles, fumée, magie)
- Rendu optimisé avec culling

#### 🎵 Audio Synthétique
- Génération de sons en temps réel
- Aucun fichier audio externe requis
- Mélodies procédurales pour la musique de fond

## 🔧 Configuration et Personnalisation

### Paramètres de Jeu
Les constantes du jeu peuvent être modifiées dans `js/utils.js` :

```javascript
const GAME_CONSTANTS = {
    TILE_SIZE: 32,                // Taille des tuiles
    PLAYER_SPEED: 200,            // Vitesse du joueur
    PLAYER_MAX_HEALTH: 100,       // Vie maximale
    ENEMY_SPAWN_RATE: 0.3,        // Taux d'apparition ennemis
    ITEM_DROP_RATE: 0.2,          // Taux de drop d'objets
    // ... autres paramètres
};
```

### Qualité Graphique
Trois niveaux disponibles :
- **Basse** : Rendu pixelisé, moins de particules
- **Moyenne** : Rendu standard (par défaut)
- **Haute** : Rendu haute qualité, plus d'effets

### Audio
- Volume des effets sonores
- Volume de la musique
- Possibilité de désactiver complètement

## 📊 Performance et Optimisations

### Optimisations Implémentées
- **Culling de rendu** : Seuls les objets visibles sont rendus
- **Pool d'objets** : Réutilisation des particules et projectiles
- **Canvas scaling** : Adaptation automatique au DPR
- **Dégradation automatique** : Réduction de qualité si FPS < 30
- **Lazy loading** : Chargement différé des ressources

### Métriques de Performance
Le jeu monitore automatiquement :
- FPS en temps réel
- Utilisation mémoire (si disponible)
- Nombre d'entités actives
- Temps de rendu par frame

## 🐛 Débogage

### Mode Debug (Développement)
Appuyez sur **F12** en local pour activer :
- Affichage des FPS
- Compteurs d'entités
- Informations de performance
- Logs détaillés dans la console

### Console de Débogage
Le jeu utilise des emojis pour catégoriser les logs :
- 🎮 Événements de jeu
- 🔧 Systèmes techniques
- ⚠️ Avertissements
- ❌ Erreurs
- 📱 Détection mobile
- 🎵 Audio

## 🚀 Fonctionnalités Futures

### À Venir
- [ ] Multijoueur local (écran partagé)
- [ ] Plus de types d'ennemis et de boss
- [ ] Système de sorts et magie
- [ ] Différents biomes de donjon
- [ ] Modes de jeu alternatifs
- [ ] Leaderboards en ligne
- [ ] Achievements/Succès
- [ ] Skin/Customisation du personnage

### Contributions
Les contributions sont les bienvenues ! Voir le fichier CONTRIBUTING.md pour les guidelines.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🙏 Remerciements

Inspiré par les meilleurs rogue-likes :
- **Dead Cells** (Motion Twin) - Combat fluide et progression
- **Enter the Gungeon** (Dodge Roll) - Génération procédurale
- **The Binding of Isaac** (Edmund McMillen) - Système d'objets
- **Hades** (Supergiant Games) - Polish et narrative

---

**Développé avec ❤️ pour les fans de rogue-likes mobiles**

Pour tout support ou question : [Créer une issue](https://github.com/your-repo/issues)