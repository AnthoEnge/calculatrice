// Système audio pour le jeu
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.music = new Map();
        this.currentMusic = null;
        this.masterVolume = 1.0;
        this.soundVolume = 0.7;
        this.musicVolume = 0.5;
        this.muted = false;
        
        this.initAudioContext();
        this.createSounds();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Reprendre le contexte audio après interaction utilisateur
            document.addEventListener('touchstart', () => this.resumeAudioContext(), { once: true });
            document.addEventListener('mousedown', () => this.resumeAudioContext(), { once: true });
        } catch (error) {
            console.warn('Audio Context non supporté:', error);
        }
    }

    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Créer des sons synthétiques pour éviter les fichiers externes
    createSounds() {
        this.createSound('playerHit', 200, 0.1, 'sawtooth');
        this.createSound('enemyHit', 150, 0.15, 'square');
        this.createSound('enemyDeath', 100, 0.3, 'sawtooth');
        this.createSound('itemPickup', 400, 0.1, 'sine');
        this.createSound('levelComplete', 600, 0.5, 'sine');
        this.createSound('gameOver', 80, 1.0, 'triangle');
        this.createSound('dash', 300, 0.1, 'noise');
        this.createSound('attack', 180, 0.2, 'square');
        this.createSound('doorOpen', 220, 0.3, 'triangle');
        this.createSound('treasure', 500, 0.8, 'sine');

        // Créer une musique de fond simple
        this.createBackgroundMusic();
    }

    createSound(name, frequency, duration, waveType = 'sine') {
        if (!this.audioContext) return;

        const sound = {
            frequency,
            duration,
            waveType,
            play: () => this.playSound(name)
        };

        this.sounds.set(name, sound);
    }

    playSound(name, volume = 1.0) {
        if (!this.audioContext || this.muted) return;

        const sound = this.sounds.get(name);
        if (!sound) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            if (sound.waveType === 'noise') {
                // Créer du bruit blanc pour les effets spéciaux
                const bufferSize = this.audioContext.sampleRate * 0.1;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                
                const noise = this.audioContext.createBufferSource();
                noise.buffer = buffer;
                noise.connect(gainNode);
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume * this.soundVolume * this.masterVolume * 0.1, this.audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + sound.duration);
                
                noise.start(this.audioContext.currentTime);
                noise.stop(this.audioContext.currentTime + sound.duration);
                
                return;
            }

            oscillator.type = sound.waveType;
            oscillator.frequency.setValueAtTime(sound.frequency, this.audioContext.currentTime);
            
            // Envelope pour un son plus naturel
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * this.soundVolume * this.masterVolume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + sound.duration);

            // Variation de fréquence pour certains sons
            if (name === 'enemyDeath') {
                oscillator.frequency.exponentialRampToValueAtTime(sound.frequency * 0.5, this.audioContext.currentTime + sound.duration);
            } else if (name === 'levelComplete') {
                oscillator.frequency.linearRampToValueAtTime(sound.frequency * 1.5, this.audioContext.currentTime + sound.duration);
            }

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + sound.duration);

        } catch (error) {
            console.warn('Erreur lors de la lecture du son:', error);
        }
    }

    createBackgroundMusic() {
        if (!this.audioContext) return;

        // Créer une mélodie simple et répétitive
        const melody = [
            { freq: 220, duration: 0.5 },
            { freq: 246.94, duration: 0.5 },
            { freq: 277.18, duration: 0.5 },
            { freq: 220, duration: 0.5 },
            { freq: 196, duration: 0.5 },
            { freq: 220, duration: 0.5 },
            { freq: 246.94, duration: 0.5 },
            { freq: 196, duration: 0.5 }
        ];

        this.backgroundMelody = melody;
        this.melodyIndex = 0;
        this.musicTimer = 0;
    }

    playBackgroundMusic() {
        if (!this.audioContext || this.muted || this.currentMusic) return;

        this.musicPlaying = true;
        this.playNextNote();
    }

    playNextNote() {
        if (!this.musicPlaying || !this.audioContext) return;

        const note = this.backgroundMelody[this.melodyIndex];
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.musicVolume * this.masterVolume * 0.1, this.audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + note.duration - 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + note.duration);
            
        } catch (error) {
            console.warn('Erreur lors de la lecture de la musique:', error);
        }

        this.melodyIndex = (this.melodyIndex + 1) % this.backgroundMelody.length;
        
        // Programmer la prochaine note
        setTimeout(() => {
            if (this.musicPlaying) {
                this.playNextNote();
            }
        }, note.duration * 1000);
    }

    stopBackgroundMusic() {
        this.musicPlaying = false;
        this.melodyIndex = 0;
    }

    // Effets sonores spécialisés
    playRandomEnemySound() {
        const enemySounds = ['enemyHit', 'enemyDeath'];
        const sound = Utils.choice(enemySounds);
        this.playSound(sound);
    }

    playRandomItemSound() {
        const itemSounds = ['itemPickup', 'treasure'];
        const sound = Utils.choice(itemSounds);
        this.playSound(sound);
    }

    playStepSound() {
        // Son de pas léger
        if (Math.random() < 0.3) { // Jouer seulement parfois pour éviter le spam
            this.createTemporarySound(150 + Math.random() * 50, 0.05, 'triangle', 0.1);
        }
    }

    createTemporarySound(frequency, duration, waveType, volume = 0.5) {
        if (!this.audioContext || this.muted) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = waveType;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * this.soundVolume * this.masterVolume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
        } catch (error) {
            console.warn('Erreur lors de la création du son temporaire:', error);
        }
    }

    // Gestion des volumes
    setSoundVolume(volume) {
        this.soundVolume = Utils.clamp(volume, 0, 1);
        this.saveSettings();
    }

    setMusicVolume(volume) {
        this.musicVolume = Utils.clamp(volume, 0, 1);
        this.saveSettings();
    }

    setMasterVolume(volume) {
        this.masterVolume = Utils.clamp(volume, 0, 1);
        this.saveSettings();
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
        this.saveSettings();
    }

    // Sauvegarde des paramètres
    saveSettings() {
        const settings = {
            soundVolume: this.soundVolume,
            musicVolume: this.musicVolume,
            masterVolume: this.masterVolume,
            muted: this.muted
        };
        localStorage.setItem('audioSettings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('audioSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.soundVolume = settings.soundVolume || 0.7;
                this.musicVolume = settings.musicVolume || 0.5;
                this.masterVolume = settings.masterVolume || 1.0;
                this.muted = settings.muted || false;
            }
        } catch (error) {
            console.warn('Erreur lors du chargement des paramètres audio:', error);
        }
    }

    // Sons d'ambiance
    playAmbientSound(type) {
        switch (type) {
            case 'dungeon':
                // Son d'ambiance de donjon (gouttes d'eau, vent)
                if (Math.random() < 0.1) {
                    this.createTemporarySound(80 + Math.random() * 40, 0.2, 'triangle', 0.05);
                }
                break;
            case 'combat':
                // Tension sonore pendant le combat
                this.createTemporarySound(60 + Math.random() * 20, 2.0, 'sawtooth', 0.03);
                break;
        }
    }

    // Feedback tactile avec son
    playUISound(type) {
        switch (type) {
            case 'click':
                this.createTemporarySound(400, 0.1, 'square', 0.3);
                break;
            case 'hover':
                this.createTemporarySound(600, 0.05, 'sine', 0.2);
                break;
            case 'error':
                this.createTemporarySound(200, 0.3, 'sawtooth', 0.4);
                break;
            case 'success':
                this.createTemporarySound(800, 0.2, 'sine', 0.5);
                break;
        }
    }

    // Nettoyage
    destroy() {
        this.stopBackgroundMusic();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Instance globale du gestionnaire audio
const audioManager = new AudioManager();

// Charger les paramètres au démarrage
document.addEventListener('DOMContentLoaded', () => {
    audioManager.loadSettings();
});