// Define scenes
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('player', 'https://labs.phaser.io/assets/sprites/red_ball.png');
    }

    create() {
        const text = this.add.text(400, 300, 'Click to Start', {
            fontSize: '32px',
            fill: '#fff'
        });
        text.setOrigin(0.5);

        this.input.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        // Initialize statistics tracking system
        this.playerStats = new Map();
        this.gameHistory = [];
    }

    preload() {
        this.load.image('player', 'https://labs.phaser.io/assets/sprites/red_ball.png');
    }

    create() {
        // Create player sprite and enable physics
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDisplaySize(32, 32);
        
        // Initialize cursor keys
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        // Reset velocity at the start of each update
        this.player.setVelocity(0);

        // Handle player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        }
        if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        }
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-200);
        }
        if (this.cursors.down.isDown) {
            this.player.setVelocityY(200);
        }
    }

    // Create detailed player statistics
    createPlayerStats(playerId) {
        return {
            // Basic Stats
            score: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
            
            // Game Performance
            timePlayed: 0,
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            
            // Detailed Stats
            damageDealt: 0,
            damageTaken: 0,
            powerupsCollected: 0,
            
            // Current Match Stats
            currentStreak: 0,
            bestStreak: 0,
            lastDeathTime: 0,
            
            // Position Tracking
            movementHistory: [],
            heatmapData: new Map(),
            
            // Performance Metrics
            averageSpeed: 0,
            reactionTime: [],
            
            // Achievement Progress
            achievements: new Set(),
            
            // Methods to update stats
            addKill() { this.kills++; this.currentStreak++; },
            addDeath() { 
                this.deaths++; 
                this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
                this.currentStreak = 0;
            }
        };
    }

    // Track player movement and update stats
    updatePlayerStats(playerId, player) {
        const stats = this.playerStats.get(playerId);
        if (!stats) return;

        // Update position history
        stats.movementHistory.push({
            x: player.x,
            y: player.y,
            time: this.time.now
        });

        // Limit history length
        if (stats.movementHistory.length > 1000) {
            stats.movementHistory.shift();
        }

        // Update heatmap data
        const gridX = Math.floor(player.x / 32);
        const gridY = Math.floor(player.y / 32);
        const gridKey = `${gridX},${gridY}`;
        stats.heatmapData.set(gridKey, (stats.heatmapData.get(gridKey) || 0) + 1);
    }

    // Generate player statistics report
    generateStatsReport(playerId) {
        const stats = this.playerStats.get(playerId);
        if (!stats) return null;

        return {
            overview: {
                kdr: stats.kills / Math.max(1, stats.deaths),
                winRate: (stats.wins / Math.max(1, stats.matchesPlayed) * 100).toFixed(2) + '%',
                averageScore: stats.score / Math.max(1, stats.matchesPlayed)
            },
            performance: {
                bestStreak: stats.bestStreak,
                averageDamagePerGame: stats.damageDealt / Math.max(1, stats.matchesPlayed),
                powerupEfficiency: stats.powerupsCollected / stats.timePlayed
            },
            achievements: Array.from(stats.achievements)
        };
    }

    // Track achievements
    checkAchievements(playerId) {
        const stats = this.playerStats.get(playerId);
        if (!stats) return;

        // Example achievement checks
        if (stats.kills >= 100 && !stats.achievements.has('CENTURY_KILLER')) {
            stats.achievements.add('CENTURY_KILLER');
            this.events.emit('achievement-unlocked', playerId, 'CENTURY_KILLER');
        }

        if (stats.currentStreak >= 10 && !stats.achievements.has('UNSTOPPABLE')) {
            stats.achievements.add('UNSTOPPABLE');
            this.events.emit('achievement-unlocked', playerId, 'UNSTOPPABLE');
        }
    }

    // Save stats to localStorage
    saveStats() {
        const statsData = Object.fromEntries(this.playerStats);
        localStorage.setItem('playerStats', JSON.stringify(statsData));
    }

    // Load stats from localStorage
    loadStats() {
        const savedStats = localStorage.getItem('playerStats');
        if (savedStats) {
            const statsData = JSON.parse(savedStats);
            Object.entries(statsData).forEach(([playerId, stats]) => {
                this.playerStats.set(playerId, stats);
            });
        }
    }

    // Update UI with current stats
    updateStatsDisplay(playerId) {
        const stats = this.playerStats.get(playerId);
        if (!stats || !this.statsText) return;

        this.statsText.setText([
            `Player: ${playerId}`,
            `Score: ${stats.score}`,
            `K/D: ${stats.kills}/${stats.deaths}`,
            `Streak: ${stats.currentStreak}`,
            `Best: ${stats.bestStreak}`
        ]);
    }

    // Create stats display
    createStatsDisplay() {
        this.statsText = this.add.text(16, 16, '', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.statsText.setScrollFactor(0);
        this.statsText.setDepth(1000);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);
