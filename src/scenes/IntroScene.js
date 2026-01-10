import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants.js';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  init(data) {
    this.gameMode = data.mode || 'arithmetic';
    this.playerCount = data.playerCount || 2;
  }

  create() {
    this.cameras.main.fadeIn(300);

    // Sky background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x87CEEB);

    // Ground
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH, 120, 0x90EE90);

    // Sad emojis at the start - homeless!
    const sadEmojis = ['😢', '😿', '🥺', '😰', '😞'];
    this.emojiGroup = [];

    for (let i = 0; i < sadEmojis.length; i++) {
      const emoji = this.add.text(
        GAME_WIDTH / 2 + (i - 2) * 80,
        GAME_HEIGHT - 80,
        sadEmojis[i],
        { fontSize: '48px', padding: { top: 10 } }
      ).setOrigin(0.5, 1);

      this.emojiGroup.push(emoji);

      // Sad bouncing
      this.tweens.add({
        targets: emoji,
        y: emoji.y - 10,
        duration: 500 + i * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Story text - appears sequentially
    const storyLines = [
      { text: 'Oh no!', delay: 500, y: 80 },
      { text: 'The emojis lost their home!', delay: 1500, y: 130 },
      { text: 'Can you help them build a new one?', delay: 3000, y: 180 }
    ];

    storyLines.forEach(line => {
      const textObj = this.add.text(GAME_WIDTH / 2, line.y, line.text, {
        fontSize: '36px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#333333',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 4
      }).setOrigin(0.5).setAlpha(0);

      this.time.delayedCall(line.delay, () => {
        this.tweens.add({
          targets: textObj,
          alpha: 1,
          y: line.y - 10,
          duration: 500,
          ease: 'Power2'
        });
      });
    });

    // Broken house image (emoji style)
    const brokenHouse = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, '🏚️', {
      fontSize: '120px',
      padding: { top: 10 }
    }).setOrigin(0.5).setAlpha(0);

    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: brokenHouse,
        alpha: 1,
        scale: { from: 0.5, to: 1 },
        duration: 500,
        ease: 'Bounce.easeOut'
      });
    });

    // "Let's build!" button appears after story
    this.time.delayedCall(4500, () => {
      this.showStartButton();
    });

    // Skip with any key after a brief moment
    this.time.delayedCall(1000, () => {
      this.input.keyboard.once('keydown', () => this.startGame());
      this.input.once('pointerdown', () => this.startGame());
    });
  }

  showStartButton() {
    const btnY = GAME_HEIGHT - 220;

    // Button background - smaller, less obnoxious
    const btn = this.add.rectangle(GAME_WIDTH / 2, btnY, 180, 50, COLORS.success);
    btn.setStrokeStyle(2, 0xffffff);
    btn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(GAME_WIDTH / 2, btnY, "START", {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Simple fade in, no pulsing
    btn.setAlpha(0);
    btnText.setAlpha(0);

    this.tweens.add({
      targets: [btn, btnText],
      alpha: 1,
      duration: 300
    });

    btn.on('pointerdown', () => this.startGame());
    btn.on('pointerover', () => btn.setScale(1.05));
    btn.on('pointerout', () => btn.setScale(1));

    // Skip hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 170, 'or press any key', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#666666'
    }).setOrigin(0.5);
  }

  startGame() {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(300, () => {
      this.scene.start('GameScene', {
        mode: this.gameMode,
        playerCount: this.playerCount
      });
    });
  }
}
