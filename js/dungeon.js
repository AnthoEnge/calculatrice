// Générateur de donjon procédural
class Room {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.center = {
            x: x + Math.floor(width / 2),
            y: y + Math.floor(height / 2)
        };
        this.connected = false;
        this.enemies = [];
        this.items = [];
        this.roomType = 'normal'; // normal, start, boss, treasure
    }

    intersects(other) {
        return !(this.x + this.width <= other.x || 
                other.x + other.width <= this.x || 
                this.y + this.height <= other.y || 
                other.y + other.height <= this.y);
    }

    distanceTo(other) {
        const dx = this.center.x - other.center.x;
        const dy = this.center.y - other.center.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    contains(x, y) {
        return x >= this.x && x < this.x + this.width && 
               y >= this.y && y < this.y + this.height;
    }

    getRandomPoint() {
        return {
            x: this.x + 1 + Math.floor(Math.random() * (this.width - 2)),
            y: this.y + 1 + Math.floor(Math.random() * (this.height - 2))
        };
    }
}

class Corridor {
    constructor(start, end) {
        this.start = start;
        this.end = end;
        this.points = this.generatePath();
    }

    generatePath() {
        const points = [];
        let currentX = this.start.x;
        let currentY = this.start.y;
        
        // L-shaped corridor
        points.push({ x: currentX, y: currentY });
        
        // Horizontal segment
        while (currentX !== this.end.x) {
            currentX += currentX < this.end.x ? 1 : -1;
            points.push({ x: currentX, y: currentY });
        }
        
        // Vertical segment
        while (currentY !== this.end.y) {
            currentY += currentY < this.end.y ? 1 : -1;
            points.push({ x: currentX, y: currentY });
        }
        
        return points;
    }
}

class DungeonGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.rooms = [];
        this.corridors = [];
        this.startRoom = null;
        this.endRoom = null;
        
        this.initGrid();
    }

    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = GAME_CONSTANTS.TILE_TYPES.WALL;
            }
        }
    }

    generate(level = 1) {
        this.initGrid();
        this.rooms = [];
        this.corridors = [];
        
        // Générer les salles
        this.generateRooms(level);
        
        // Connecter les salles
        this.connectRooms();
        
        // Créer les corridors
        this.carveCorridors();
        
        // Placer les portes
        this.placeDoors();
        
        // Désigner les salles spéciales
        this.designateSpecialRooms();
        
        // Peupler le donjon
        this.populateDungeon(level);
        
        return this;
    }

    generateRooms(level) {
        const maxAttempts = 500;
        const targetRooms = Math.min(GAME_CONSTANTS.MAX_ROOMS, 8 + level * 2);
        
        for (let attempt = 0; attempt < maxAttempts && this.rooms.length < targetRooms; attempt++) {
            const width = Utils.randomInt(GAME_CONSTANTS.ROOM_MIN_SIZE, GAME_CONSTANTS.ROOM_MAX_SIZE);
            const height = Utils.randomInt(GAME_CONSTANTS.ROOM_MIN_SIZE, GAME_CONSTANTS.ROOM_MAX_SIZE);
            const x = Utils.randomInt(1, this.width - width - 1);
            const y = Utils.randomInt(1, this.height - height - 1);
            
            const newRoom = new Room(x, y, width, height);
            
            // Vérifier qu'elle ne chevauche pas avec les autres salles
            if (!this.rooms.some(room => newRoom.intersects(room))) {
                this.rooms.push(newRoom);
                this.carveRoom(newRoom);
            }
        }
        
        console.log(`Généré ${this.rooms.length} salles pour le niveau ${level}`);
    }

    carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                this.grid[y][x] = GAME_CONSTANTS.TILE_TYPES.FLOOR;
            }
        }
    }

    connectRooms() {
        if (this.rooms.length === 0) return;
        
        // Algorithme du plus proche voisin pour connecter toutes les salles
        const connected = new Set();
        const unconnected = new Set(this.rooms);
        
        // Commencer par la première salle
        const startRoom = this.rooms[0];
        connected.add(startRoom);
        unconnected.delete(startRoom);
        
        while (unconnected.size > 0) {
            let minDistance = Infinity;
            let closestPair = null;
            
            // Trouver la paire connectée/non-connectée la plus proche
            for (const connectedRoom of connected) {
                for (const unconnectedRoom of unconnected) {
                    const distance = connectedRoom.distanceTo(unconnectedRoom);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPair = { connected: connectedRoom, unconnected: unconnectedRoom };
                    }
                }
            }
            
            if (closestPair) {
                // Créer un corridor
                const corridor = new Corridor(
                    closestPair.connected.center,
                    closestPair.unconnected.center
                );
                this.corridors.push(corridor);
                
                // Marquer la salle comme connectée
                connected.add(closestPair.unconnected);
                unconnected.delete(closestPair.unconnected);
                closestPair.connected.connected = true;
                closestPair.unconnected.connected = true;
            }
        }
        
        // Ajouter quelques connexions supplémentaires pour créer des boucles
        const extraConnections = Math.floor(this.rooms.length * 0.15);
        for (let i = 0; i < extraConnections; i++) {
            const room1 = Utils.choice(this.rooms);
            const room2 = Utils.choice(this.rooms);
            if (room1 !== room2) {
                const corridor = new Corridor(room1.center, room2.center);
                this.corridors.push(corridor);
            }
        }
    }

    carveCorridors() {
        for (const corridor of this.corridors) {
            for (const point of corridor.points) {
                if (point.x >= 0 && point.x < this.width && 
                    point.y >= 0 && point.y < this.height) {
                    this.grid[point.y][point.x] = GAME_CONSTANTS.TILE_TYPES.FLOOR;
                }
            }
        }
    }

    placeDoors() {
        // Placer des portes à l'intersection des corridors et des salles
        for (const corridor of this.corridors) {
            for (const point of corridor.points) {
                // Vérifier si ce point est adjacent à une salle
                for (const room of this.rooms) {
                    if (this.isPointAdjacentToRoom(point, room)) {
                        // Parfois placer une porte
                        if (Math.random() < 0.3) {
                            this.grid[point.y][point.x] = GAME_CONSTANTS.TILE_TYPES.DOOR;
                        }
                    }
                }
            }
        }
    }

    isPointAdjacentToRoom(point, room) {
        return (point.x === room.x - 1 || point.x === room.x + room.width) &&
               point.y >= room.y && point.y < room.y + room.height ||
               (point.y === room.y - 1 || point.y === room.y + room.height) &&
               point.x >= room.x && point.x < room.x + room.width;
    }

    designateSpecialRooms() {
        if (this.rooms.length === 0) return;
        
        // Salle de départ (première salle)
        this.startRoom = this.rooms[0];
        this.startRoom.roomType = 'start';
        
        // Salle de boss (dernière salle la plus éloignée du départ)
        let maxDistance = 0;
        for (const room of this.rooms) {
            const distance = this.startRoom.distanceTo(room);
            if (distance > maxDistance) {
                maxDistance = distance;
                this.endRoom = room;
            }
        }
        
        if (this.endRoom && this.endRoom !== this.startRoom) {
            this.endRoom.roomType = 'boss';
            // Placer les escaliers dans la salle de boss
            const center = this.endRoom.getRandomPoint();
            this.grid[center.y][center.x] = GAME_CONSTANTS.TILE_TYPES.STAIRS;
        }
        
        // Quelques salles aux trésors
        const treasureRooms = Math.floor(this.rooms.length * 0.2);
        const availableRooms = this.rooms.filter(room => 
            room.roomType === 'normal' && room !== this.startRoom && room !== this.endRoom
        );
        
        for (let i = 0; i < treasureRooms && i < availableRooms.length; i++) {
            const room = Utils.choice(availableRooms);
            room.roomType = 'treasure';
            availableRooms.splice(availableRooms.indexOf(room), 1);
        }
    }

    populateDungeon(level) {
        for (const room of this.rooms) {
            this.populateRoom(room, level);
        }
    }

    populateRoom(room, level) {
        if (room.roomType === 'start') {
            // Pas d'ennemis dans la salle de départ
            return;
        }
        
        const roomArea = room.width * room.height;
        let enemyCount = 0;
        let itemCount = 0;
        
        switch (room.roomType) {
            case 'normal':
                enemyCount = Utils.randomInt(1, Math.max(2, Math.floor(roomArea / 20)));
                itemCount = Math.random() < 0.3 ? 1 : 0;
                break;
                
            case 'treasure':
                enemyCount = Utils.randomInt(0, 2);
                itemCount = Utils.randomInt(2, 4);
                break;
                
            case 'boss':
                enemyCount = 1; // Un seul boss
                itemCount = Utils.randomInt(1, 3);
                break;
        }
        
        // Placer les ennemis
        for (let i = 0; i < enemyCount; i++) {
            const point = room.getRandomPoint();
            const worldX = point.x * GAME_CONSTANTS.TILE_SIZE + GAME_CONSTANTS.TILE_SIZE / 2;
            const worldY = point.y * GAME_CONSTANTS.TILE_SIZE + GAME_CONSTANTS.TILE_SIZE / 2;
            
            let enemyType;
            if (room.roomType === 'boss') {
                enemyType = GAME_CONSTANTS.ENEMY_TYPES.BOSS;
            } else {
                // Choisir un type d'ennemi basé sur le niveau
                const enemyTypes = [
                    GAME_CONSTANTS.ENEMY_TYPES.GOBLIN,
                    GAME_CONSTANTS.ENEMY_TYPES.ORC,
                    GAME_CONSTANTS.ENEMY_TYPES.SKELETON
                ];
                
                const weights = [
                    Math.max(5, 15 - level),  // Goblins moins fréquents aux niveaux élevés
                    Math.min(10, level * 2),  // Orcs plus fréquents
                    Math.min(8, level)        // Squelettes selon le niveau
                ];
                
                enemyType = this.weightedChoice(enemyTypes, weights);
            }
            
            room.enemies.push({ x: worldX, y: worldY, type: enemyType });
        }
        
        // Placer les items
        for (let i = 0; i < itemCount; i++) {
            const point = room.getRandomPoint();
            const worldX = point.x * GAME_CONSTANTS.TILE_SIZE + GAME_CONSTANTS.TILE_SIZE / 2;
            const worldY = point.y * GAME_CONSTANTS.TILE_SIZE + GAME_CONSTANTS.TILE_SIZE / 2;
            
            room.items.push({ x: worldX, y: worldY });
        }
    }

    weightedChoice(choices, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < choices.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return choices[i];
            }
        }
        
        return choices[choices.length - 1];
    }

    // Méthodes d'accès à la grille
    getTile(x, y) {
        const tileX = Math.floor(x / GAME_CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(y / GAME_CONSTANTS.TILE_SIZE);
        
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return GAME_CONSTANTS.TILE_TYPES.WALL;
        }
        
        return this.grid[tileY][tileX];
    }

    setTile(x, y, tileType) {
        const tileX = Math.floor(x / GAME_CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(y / GAME_CONSTANTS.TILE_SIZE);
        
        if (tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.height) {
            this.grid[tileY][tileX] = tileType;
        }
    }

    isWall(x, y) {
        return this.getTile(x, y) === GAME_CONSTANTS.TILE_TYPES.WALL;
    }

    isFloor(x, y) {
        const tile = this.getTile(x, y);
        return tile === GAME_CONSTANTS.TILE_TYPES.FLOOR || 
               tile === GAME_CONSTANTS.TILE_TYPES.DOOR ||
               tile === GAME_CONSTANTS.TILE_TYPES.STAIRS;
    }

    canMoveTo(x, y) {
        return this.isFloor(x, y);
    }

    getStartPosition() {
        if (this.startRoom) {
            const point = this.startRoom.getRandomPoint();
            return {
                x: point.x * GAME_CONSTANTS.TILE_SIZE + GAME_CONSTANTS.TILE_SIZE / 2,
                y: point.y * GAME_CONSTANTS.TILE_SIZE + GAME_CONSTANTS.TILE_SIZE / 2
            };
        }
        return { x: 100, y: 100 };
    }

    getRoomAt(x, y) {
        const tileX = Math.floor(x / GAME_CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(y / GAME_CONSTANTS.TILE_SIZE);
        
        return this.rooms.find(room => room.contains(tileX, tileY));
    }

    render(ctx, camera) {
        const startX = Math.floor(camera.x / GAME_CONSTANTS.TILE_SIZE) - 1;
        const startY = Math.floor(camera.y / GAME_CONSTANTS.TILE_SIZE) - 1;
        const endX = startX + Math.ceil(camera.width / GAME_CONSTANTS.TILE_SIZE) + 2;
        const endY = startY + Math.ceil(camera.height / GAME_CONSTANTS.TILE_SIZE) + 2;
        
        for (let y = Math.max(0, startY); y < Math.min(this.height, endY); y++) {
            for (let x = Math.max(0, startX); x < Math.min(this.width, endX); x++) {
                const worldX = (x * GAME_CONSTANTS.TILE_SIZE) - camera.x;
                const worldY = (y * GAME_CONSTANTS.TILE_SIZE) - camera.y;
                
                this.renderTile(ctx, worldX, worldY, this.grid[y][x]);
            }
        }
    }

    renderTile(ctx, x, y, tileType) {
        switch (tileType) {
            case GAME_CONSTANTS.TILE_TYPES.WALL:
                ctx.fillStyle = '#444444';
                ctx.fillRect(x, y, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                
                // Bordure plus sombre
                ctx.fillStyle = '#222222';
                ctx.fillRect(x, y, GAME_CONSTANTS.TILE_SIZE, 2);
                ctx.fillRect(x, y, 2, GAME_CONSTANTS.TILE_SIZE);
                break;
                
            case GAME_CONSTANTS.TILE_TYPES.FLOOR:
                ctx.fillStyle = '#666666';
                ctx.fillRect(x, y, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                break;
                
            case GAME_CONSTANTS.TILE_TYPES.DOOR:
                ctx.fillStyle = '#666666';
                ctx.fillRect(x, y, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x + 4, y + 4, GAME_CONSTANTS.TILE_SIZE - 8, GAME_CONSTANTS.TILE_SIZE - 8);
                break;
                
            case GAME_CONSTANTS.TILE_TYPES.STAIRS:
                ctx.fillStyle = '#666666';
                ctx.fillRect(x, y, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(x + 8, y + 8, GAME_CONSTANTS.TILE_SIZE - 16, GAME_CONSTANTS.TILE_SIZE - 16);
                
                // Dessiner des escaliers
                ctx.fillStyle = '#FFA500';
                for (let i = 0; i < 3; i++) {
                    const stepY = y + 8 + i * 4;
                    ctx.fillRect(x + 8, stepY, GAME_CONSTANTS.TILE_SIZE - 16, 2);
                }
                break;
                
            default:
                ctx.fillStyle = '#000000';
                ctx.fillRect(x, y, GAME_CONSTANTS.TILE_SIZE, GAME_CONSTANTS.TILE_SIZE);
                break;
        }
    }

    getWorldBounds() {
        return {
            width: this.width * GAME_CONSTANTS.TILE_SIZE,
            height: this.height * GAME_CONSTANTS.TILE_SIZE
        };
    }
}