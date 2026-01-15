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
    this.emojisCount = data.emojis || 6;
    this.difficulty = data.difficulty || 'medium';
  }

  create() {
    this.cameras.main.fadeIn(300);

    // Play the win sound
    soundManager.win();

    // Sky background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x87CEEB);

    // Sun
    this.add.circle(GAME_WIDTH - 120, 80, 50, 0xFFD700);
    this.add.circle(GAME_WIDTH - 120, 80, 40, 0xFFF59D);

    // Ground
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 50, GAME_WIDTH, 100, 0x90EE90);

    // Sparkles in background
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(50, GAME_HEIGHT - 150);
      const sparkle = this.add.text(x, y, '✨', { fontSize: '20px', padding: { top: 10 } }).setOrigin(0.5).setAlpha(0.3);
      this.tweens.add({
        targets: sparkle,
        alpha: 0.8,
        scale: 1.2,
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true,
        repeat: -1
      });
    }

    // Victory text
    const winText = this.add.text(GAME_WIDTH / 2, 60, '🎉 YOU WIN! 🎉', {
      fontSize: '56px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#8B4513',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.tweens.add({
      targets: winText,
      scale: 1.05,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Message based on mode
    const message = this.playerCount === 1
      ? 'You built the Emoji House!'
      : 'You built the Emoji House together!';

    this.add.text(GAME_WIDTH / 2, 120, message, {
      fontSize: '24px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#333333',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setOrigin(0.5);

    // THE EMOJI HOUSE!
    this.createEmojiHouse();

    // Happy emojis waving from windows
    this.createHappyEmojis();

    // Buttons
    this.createButton(GAME_WIDTH / 2 - 150, GAME_HEIGHT - 120, 'PLAY AGAIN', 0x4ecca3, () => {
      soundManager.select();
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start('GameScene', { mode: this.gameMode, playerCount: this.playerCount, difficulty: this.difficulty });
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
      this.scene.start('GameScene', { mode: this.gameMode, playerCount: this.playerCount, difficulty: this.difficulty });
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

  createEmojiHouse() {
    const houseX = GAME_WIDTH / 2;
    const houseY = GAME_HEIGHT / 2 + 80;

    // House body
    this.add.rectangle(houseX, houseY, 280, 200, 0xDEB887);
    this.add.rectangle(houseX, houseY, 270, 190, 0xF5DEB3);

    // Roof
    const roofPoints = [
      { x: houseX - 160, y: houseY - 100 },
      { x: houseX, y: houseY - 180 },
      { x: houseX + 160, y: houseY - 100 }
    ];
    this.add.triangle(
      houseX, houseY - 140,
      -160, 40,
      0, -80,
      160, 40,
      0xB22222
    );
    this.add.triangle(
      houseX, houseY - 140,
      -150, 35,
      0, -70,
      150, 35,
      0xCD5C5C
    );

    // Door
    this.add.rectangle(houseX, houseY + 50, 50, 80, 0x8B4513);
    this.add.circle(houseX + 15, houseY + 50, 5, 0xFFD700);

    // Windows (4 windows)
    const windowPositions = [
      { x: houseX - 80, y: houseY - 20 },
      { x: houseX + 80, y: houseY - 20 },
      { x: houseX - 80, y: houseY + 50 },
      { x: houseX + 80, y: houseY + 50 }
    ];

    windowPositions.forEach(pos => {
      this.add.rectangle(pos.x, pos.y, 50, 50, 0x87CEEB);
      this.add.rectangle(pos.x, pos.y, 45, 45, 0xADD8E6);
      // Window frame
      this.add.rectangle(pos.x, pos.y, 50, 4, 0x8B4513);
      this.add.rectangle(pos.x, pos.y, 4, 50, 0x8B4513);
    });

    // Chimney with smoke
    this.add.rectangle(houseX + 100, houseY - 160, 30, 50, 0xA0522D);

    // Smoke puffs
    for (let i = 0; i < 3; i++) {
      const smoke = this.add.circle(houseX + 100 + i * 10, houseY - 200 - i * 20, 15 - i * 3, 0xffffff, 0.6);
      this.tweens.add({
        targets: smoke,
        y: smoke.y - 30,
        alpha: 0,
        duration: 2000,
        delay: i * 500,
        repeat: -1
      });
    }

    // "HOME SWEET HOME" sign
    const sign = this.add.rectangle(houseX, houseY + 170, 200, 40, 0x8B4513);
    this.add.text(houseX, houseY + 170, '🏠 HOME SWEET HOME 🏠', {
      fontSize: '16px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  createHappyEmojis() {
    const houseX = GAME_WIDTH / 2;
    const houseY = GAME_HEIGHT / 2 + 80;

    // Happy emojis in windows
    const happyEmojis = ['😊', '🥳', '😸', '🐶', '🐱', '☀️', '🌟', '😄'];
    const windowPositions = [
      { x: houseX - 80, y: houseY - 20 },
      { x: houseX + 80, y: houseY - 20 },
      { x: houseX - 80, y: houseY + 50 },
      { x: houseX + 80, y: houseY + 50 }
    ];

    windowPositions.forEach((pos, i) => {
      const emoji = this.add.text(pos.x, pos.y, happyEmojis[i % happyEmojis.length], {
        fontSize: '28px',
        padding: { top: 10 }
      }).setOrigin(0.5);

      // Waving animation
      this.tweens.add({
        targets: emoji,
        angle: { from: -10, to: 10 },
        duration: 300 + i * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Extra happy emojis floating around the house
    const floatingPositions = [
      { x: houseX - 180, y: houseY - 50 },
      { x: houseX + 180, y: houseY - 50 },
      { x: houseX - 200, y: houseY + 80 },
      { x: houseX + 200, y: houseY + 80 }
    ];

    floatingPositions.forEach((pos, i) => {
      const emoji = this.add.text(pos.x, pos.y, happyEmojis[(i + 4) % happyEmojis.length], {
        fontSize: '36px',
        padding: { top: 10 }
      }).setOrigin(0.5);

      // Floating animation
      this.tweens.add({
        targets: emoji,
        y: pos.y - 15,
        duration: 800 + i * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // "Thank you!" speech bubble
    const bubble = this.add.container(houseX, houseY - 250);
    const bubbleBg = this.add.rectangle(0, 0, 160, 50, 0xffffff);
    bubbleBg.setStrokeStyle(3, 0x333333);
    const bubbleText = this.add.text(0, 0, 'Thank you!', {
      fontSize: '20px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    bubble.add([bubbleBg, bubbleText]);

    this.tweens.add({
      targets: bubble,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}
