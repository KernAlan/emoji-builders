import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // Bright sky background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x87CEEB);

    // Sun
    const sun = this.add.circle(GAME_WIDTH - 120, 100, 60, 0xFFD700);
    this.add.circle(GAME_WIDTH - 120, 100, 50, 0xFFF59D);

    // Sun rays
    this.tweens.add({
      targets: sun,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Clouds
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(50, 150);
      const cloud = this.add.ellipse(x, y, Phaser.Math.Between(80, 140), 40, 0xffffff, 0.8);

      this.tweens.add({
        targets: cloud,
        x: x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(4000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Ground
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH, 120, 0x90EE90);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 15, GAME_WIDTH, 30, 0x7CB342);

    // Title - animated entrance
    const title1 = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'EMOJI', {
      fontSize: '84px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#8B4513',
      strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    const title2 = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 'BUILDERS', {
      fontSize: '84px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#333333',
      strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    // Construction crane emoji
    const crane = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 180, '🏗️', {
      fontSize: '64px'
    }).setOrigin(0.5).setAlpha(0);

    // Animate title in
    this.tweens.add({
      targets: crane,
      alpha: 1,
      y: GAME_HEIGHT / 2 - 160,
      duration: 600,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: title1,
      alpha: 1,
      scale: 1,
      delay: 200,
      duration: 600,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: title2,
      alpha: 1,
      scale: 1,
      delay: 400,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Decorative emojis falling in
    const emojis = ['🧱', '📚', '🔢', '⭐', '🎯'];
    emojis.forEach((emoji, i) => {
      const x = GAME_WIDTH / 2 + (i - 2) * 90;
      const e = this.add.text(x, -50, emoji, {
        fontSize: '48px'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: e,
        y: GAME_HEIGHT / 2 + 100,
        delay: 800 + i * 150,
        duration: 600,
        ease: 'Bounce.easeOut'
      });
    });

    // Press to continue
    const pressText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 140, '✨ Press any key to start! ✨', {
      fontSize: '28px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      stroke: '#333333',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: pressText,
      alpha: 1,
      delay: 1800,
      duration: 500
    });

    // Blink effect
    this.time.addEvent({
      delay: 2300,
      callback: () => {
        this.tweens.add({
          targets: pressText,
          alpha: 0.5,
          duration: 400,
          yoyo: true,
          repeat: -1
        });
      }
    });

    // Wait for input
    this.time.delayedCall(1800, () => {
      this.input.keyboard.once('keydown', () => {
        this.cameras.main.fadeOut(400);
        this.time.delayedCall(400, () => {
          this.scene.start('MenuScene');
        });
      });
    });
  }
}
