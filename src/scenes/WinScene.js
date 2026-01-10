import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';
import { soundManager } from '../utils/SoundManager.js';

export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  init(data) {
    this.gameMode = data.mode || 'arithmetic';
    this.playerCount = data.playerCount || 2;
  }

  create() {
    this.cameras.main.fadeIn(300);

    // Play the win sound
    soundManager.win();

    // Starfield background
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 3), 0xffffff, 0.5);
      this.tweens.add({
        targets: star,
        alpha: 0,
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true,
        repeat: -1
      });
    }

    // Victory text
    const winText = this.add.text(GAME_WIDTH / 2, 150, '🎉 YOU WIN! 🎉', {
      fontSize: '72px',
      fontFamily: 'Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: winText,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Great message - different for single vs 2 players
    const message = this.playerCount === 1 ? 'Great job!' : 'Great teamwork!';
    this.add.text(GAME_WIDTH / 2, 240, message, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Celebration emojis floating
    const celebrationEmojis = ['⭐', '🌟', '✨', '🎊', '🏆', '🎯', '💪'];
    for (let i = 0; i < 15; i++) {
      const emoji = Phaser.Utils.Array.GetRandom(celebrationEmojis);
      const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
      const y = Phaser.Math.Between(300, GAME_HEIGHT - 200);
      const text = this.add.text(x, y, emoji, { fontSize: '40px' }).setOrigin(0.5);

      this.tweens.add({
        targets: text,
        y: y - 20,
        rotation: Phaser.Math.Between(-0.2, 0.2),
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Buttons
    this.createButton(GAME_WIDTH / 2 - 150, GAME_HEIGHT - 120, 'PLAY AGAIN', 0x4ecca3, () => {
      soundManager.select();
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start('GameScene', { mode: this.gameMode, playerCount: this.playerCount });
      });
    });

    this.createButton(GAME_WIDTH / 2 + 150, GAME_HEIGHT - 120, 'MENU', 0xe94560, () => {
      soundManager.select();
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start('MenuScene');
      });
    });

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-SPACE', () => {
      soundManager.select();
      this.scene.start('GameScene', { mode: this.gameMode, playerCount: this.playerCount });
    });

    this.input.keyboard.on('keydown-ESC', () => {
      soundManager.select();
      this.scene.start('MenuScene');
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'SPACE = Play Again    ESC = Menu', {
      fontSize: '16px',
      color: '#666666'
    }).setOrigin(0.5);
  }

  createButton(x, y, text, color, callback) {
    const bg = this.add.rectangle(x, y, 180, 50, color);
    bg.setStrokeStyle(2, 0xffffff);
    bg.setInteractive({ useHandCursor: true });

    this.add.text(x, y, text, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setScale(1.1);
    });

    bg.on('pointerout', () => {
      bg.setScale(1);
    });

    bg.on('pointerdown', callback);
  }
}
