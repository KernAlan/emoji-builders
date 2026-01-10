import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants.js';
import { soundManager } from '../utils/SoundManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.cameras.main.fadeIn(300);
    soundManager.init();

    this.playerCount = 2; // Default to 2 players

    // Bright gradient background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x87CEEB);

    // Decorative clouds
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(50, 180);
      this.add.ellipse(x, y, Phaser.Math.Between(80, 150), 50, 0xffffff, 0.6);
    }

    // Ground
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 30, GAME_WIDTH, 60, 0x90EE90);

    // Title
    this.add.text(GAME_WIDTH / 2, 70, '🏗️ EMOJI BUILDERS 🏗️', {
      fontSize: '48px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#8B4513',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 115, 'Build Together, Learn Together!', {
      fontSize: '20px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      stroke: '#333333',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Player count selector
    this.createPlayerSelector();

    // Mode buttons
    this.createModeButton(
      GAME_WIDTH / 2 - 170,
      380,
      '📚',
      'ALPHABET',
      'Letters & Words!',
      'alphabet',
      0xE91E63,
      0xF48FB1
    );

    this.createModeButton(
      GAME_WIDTH / 2 + 170,
      380,
      '🔢',
      'ARITHMETIC',
      'Add & Subtract!',
      'arithmetic',
      0x4CAF50,
      0x81C784
    );

    // Instructions
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 95, 450, 90, 0xffffff, 0.9)
      .setStrokeStyle(3, 0x333333);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 125, '🎮 CONTROLS', {
      fontSize: '18px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'Player 1: A ◀ ▶ D     Player 2: ◀ ▶ Arrows', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#555555'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 75, '⭐ Build the Emoji House together! ⭐', {
      fontSize: '14px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#4CAF50',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Sound toggle
    this.createSoundToggle();

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-ONE', () => {
      soundManager.select();
      this.startGame('alphabet');
    });
    this.input.keyboard.on('keydown-TWO', () => {
      soundManager.select();
      this.startGame('arithmetic');
    });
  }

  createPlayerSelector() {
    const y = 175;

    this.add.text(GAME_WIDTH / 2, y, 'PLAYERS', {
      fontSize: '20px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#333333',
      strokeThickness: 2
    }).setOrigin(0.5);

    // 1 Player button
    this.player1Btn = this.add.rectangle(GAME_WIDTH / 2 - 80, y + 40, 120, 45, 0x666666);
    this.player1Btn.setStrokeStyle(3, 0xffffff);
    this.player1Btn.setInteractive({ useHandCursor: true });

    this.player1Text = this.add.text(GAME_WIDTH / 2 - 80, y + 40, '👤 1 Player', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 2 Players button
    this.player2Btn = this.add.rectangle(GAME_WIDTH / 2 + 80, y + 40, 120, 45, 0x4CAF50);
    this.player2Btn.setStrokeStyle(3, 0xffffff);
    this.player2Btn.setInteractive({ useHandCursor: true });

    this.player2Text = this.add.text(GAME_WIDTH / 2 + 80, y + 40, '👥 2 Players', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.player1Btn.on('pointerdown', () => {
      soundManager.select();
      this.setPlayerCount(1);
    });

    this.player2Btn.on('pointerdown', () => {
      soundManager.select();
      this.setPlayerCount(2);
    });

    this.player1Btn.on('pointerover', () => this.player1Btn.setScale(1.05));
    this.player1Btn.on('pointerout', () => this.player1Btn.setScale(1));
    this.player2Btn.on('pointerover', () => this.player2Btn.setScale(1.05));
    this.player2Btn.on('pointerout', () => this.player2Btn.setScale(1));
  }

  setPlayerCount(count) {
    this.playerCount = count;

    if (count === 1) {
      this.player1Btn.setFillStyle(0x4CAF50);
      this.player2Btn.setFillStyle(0x666666);
    } else {
      this.player1Btn.setFillStyle(0x666666);
      this.player2Btn.setFillStyle(0x4CAF50);
    }
  }

  createSoundToggle() {
    const x = GAME_WIDTH - 60;
    const y = 40;

    this.soundIcon = this.add.text(x, y, soundManager.enabled ? '🔊' : '🔇', {
      fontSize: '32px',
      padding: { top: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.soundIcon.on('pointerdown', () => {
      const enabled = soundManager.toggle();
      this.soundIcon.setText(enabled ? '🔊' : '🔇');
      if (enabled) soundManager.select();
    });

    this.soundIcon.on('pointerover', () => this.soundIcon.setScale(1.2));
    this.soundIcon.on('pointerout', () => this.soundIcon.setScale(1));
  }

  createModeButton(x, y, emoji, title, subtitle, mode, colorMain, colorLight) {
    const shadow = this.add.rectangle(x + 4, y + 4, 260, 220, 0x000000, 0.3);
    const bg = this.add.rectangle(x, y, 260, 220, colorMain);
    bg.setStrokeStyle(4, 0xffffff);
    bg.setInteractive({ useHandCursor: true });

    this.add.rectangle(x, y - 15, 240, 150, colorLight, 0.3);

    const emojiText = this.add.text(x, y - 50, emoji, {
      fontSize: '64px',
      padding: { top: 10 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: emojiText,
      y: y - 58,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(x, y + 35, title, {
      fontSize: '28px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(x, y + 65, subtitle, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const keyNum = mode === 'alphabet' ? '1' : '2';
    this.add.text(x, y + 95, `Press [${keyNum}]`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#00000044',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setScale(1.05);
      shadow.setScale(1.05);
      emojiText.setScale(1.1);
    });

    bg.on('pointerout', () => {
      bg.setScale(1);
      shadow.setScale(1);
      emojiText.setScale(1);
    });

    bg.on('pointerdown', () => {
      soundManager.select();
      this.startGame(mode);
    });
  }

  startGame(mode) {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(300, () => {
      this.scene.start('IntroScene', {
        mode: mode,
        playerCount: this.playerCount
      });
    });
  }
}
