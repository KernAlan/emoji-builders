import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';
import { soundManager } from '../utils/SoundManager.js';

export default class ModeSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ModeSelectionScene' });
  }

  init(data) {
    this.gameMode = data.mode || 'arithmetic';
    this.playerCount = data.playerCount || 2;
    this.selectedDifficulty = 'medium';
  }

  create() {
    this.cameras.main.fadeIn(300);

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x87CEEB);

    // Decorative clouds
    for (let i = 0; i < 6; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(50, 150);
      this.add.ellipse(x, y, Phaser.Math.Between(60, 120), 40, 0xffffff, 0.5);
    }

    // Ground
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 30, GAME_WIDTH, 60, 0x90EE90);

    // Mode title
    const modeEmoji = this.gameMode === 'alphabet' ? '📚' : '🔢';
    const modeColor = this.gameMode === 'alphabet' ? '#E91E63' : '#4CAF50';
    const modeName = this.gameMode.toUpperCase();

    this.add.text(GAME_WIDTH / 2, 80, `${modeEmoji} ${modeName} MODE ${modeEmoji}`, {
      fontSize: '42px',
      fontFamily: 'Comic Sans MS, Arial',
      color: modeColor,
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 5
    }).setOrigin(0.5);

    // Player count display
    const playerText = this.playerCount === 1 ? '👤 1 Player' : '👥 2 Players';
    this.add.text(GAME_WIDTH / 2, 140, playerText, {
      fontSize: '22px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#555555'
    }).setOrigin(0.5);

    // Difficulty selector
    this.createDifficultySelector();

    // Start button
    this.createStartButton();

    // Back button
    this.createBackButton();

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-ONE', () => {
      soundManager.select();
      this.setDifficulty('easy');
    });
    this.input.keyboard.on('keydown-TWO', () => {
      soundManager.select();
      this.setDifficulty('medium');
    });
    this.input.keyboard.on('keydown-THREE', () => {
      soundManager.select();
      this.setDifficulty('hard');
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      soundManager.select();
      this.startGame();
    });
    this.input.keyboard.on('keydown-ESC', () => {
      soundManager.select();
      this.goBack();
    });
  }

  createDifficultySelector() {
    const y = 280;

    this.add.text(GAME_WIDTH / 2, y - 60, 'SELECT DIFFICULTY', {
      fontSize: '28px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#333333',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Container for difficulty info
    const descY = y + 100;
    this.difficultyDescBg = this.add.rectangle(GAME_WIDTH / 2, descY, 400, 70, 0xffffff, 0.9);
    this.difficultyDescBg.setStrokeStyle(3, 0x333333);

    this.difficultyDesc = this.add.text(GAME_WIDTH / 2, descY, '', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#333333',
      align: 'center'
    }).setOrigin(0.5);

    // EASY button
    this.easyBtn = this.add.rectangle(GAME_WIDTH / 2 - 150, y, 130, 55, 0x666666);
    this.easyBtn.setStrokeStyle(3, 0xffffff);
    this.easyBtn.setInteractive({ useHandCursor: true });

    this.easyText = this.add.text(GAME_WIDTH / 2 - 150, y, '🐣 EASY', {
      fontSize: '20px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // MEDIUM button (default selected)
    this.mediumBtn = this.add.rectangle(GAME_WIDTH / 2, y, 130, 55, 0x4CAF50);
    this.mediumBtn.setStrokeStyle(3, 0xffffff);
    this.mediumBtn.setInteractive({ useHandCursor: true });

    this.mediumText = this.add.text(GAME_WIDTH / 2, y, '🐥 MEDIUM', {
      fontSize: '20px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // HARD button
    this.hardBtn = this.add.rectangle(GAME_WIDTH / 2 + 150, y, 130, 55, 0x666666);
    this.hardBtn.setStrokeStyle(3, 0xffffff);
    this.hardBtn.setInteractive({ useHandCursor: true });

    this.hardText = this.add.text(GAME_WIDTH / 2 + 150, y, '🐔 HARD', {
      fontSize: '20px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Key hints
    this.add.text(GAME_WIDTH / 2 - 150, y + 40, '[1]', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#00000044', padding: { x: 6, y: 2 }
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, y + 40, '[2]', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#00000044', padding: { x: 6, y: 2 }
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2 + 150, y + 40, '[3]', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffff',
      backgroundColor: '#00000044', padding: { x: 6, y: 2 }
    }).setOrigin(0.5);

    // Event handlers
    this.easyBtn.on('pointerdown', () => {
      soundManager.select();
      this.setDifficulty('easy');
    });
    this.mediumBtn.on('pointerdown', () => {
      soundManager.select();
      this.setDifficulty('medium');
    });
    this.hardBtn.on('pointerdown', () => {
      soundManager.select();
      this.setDifficulty('hard');
    });

    // Hover effects
    this.easyBtn.on('pointerover', () => this.easyBtn.setScale(1.05));
    this.easyBtn.on('pointerout', () => this.easyBtn.setScale(1));
    this.mediumBtn.on('pointerover', () => this.mediumBtn.setScale(1.05));
    this.mediumBtn.on('pointerout', () => this.mediumBtn.setScale(1));
    this.hardBtn.on('pointerover', () => this.hardBtn.setScale(1.05));
    this.hardBtn.on('pointerout', () => this.hardBtn.setScale(1));

    // Set initial state
    this.updateDifficultyDisplay();
  }

  setDifficulty(difficulty) {
    this.selectedDifficulty = difficulty;
    this.updateDifficultyDisplay();
  }

  updateDifficultyDisplay() {
    const activeColor = 0x4CAF50;
    const inactiveColor = 0x666666;

    this.easyBtn.setFillStyle(this.selectedDifficulty === 'easy' ? activeColor : inactiveColor);
    this.mediumBtn.setFillStyle(this.selectedDifficulty === 'medium' ? activeColor : inactiveColor);
    this.hardBtn.setFillStyle(this.selectedDifficulty === 'hard' ? activeColor : inactiveColor);

    // Update description
    const descriptions = {
      easy: 'Slower blocks, bigger targets\nPerfect for beginners!',
      medium: 'Balanced speed and challenge\nRecommended for most players',
      hard: 'Faster blocks, smaller targets\nFor experienced players!'
    };
    this.difficultyDesc.setText(descriptions[this.selectedDifficulty]);
  }

  createStartButton() {
    const btnY = 480;
    const primaryColor = this.gameMode === 'alphabet' ? 0xE91E63 : 0x4CAF50;

    const shadow = this.add.rectangle(GAME_WIDTH / 2 + 4, btnY + 4, 220, 60, 0x000000, 0.3);
    const btn = this.add.rectangle(GAME_WIDTH / 2, btnY, 220, 60, primaryColor);
    btn.setStrokeStyle(4, 0xffffff);
    btn.setInteractive({ useHandCursor: true });

    this.add.text(GAME_WIDTH / 2, btnY, '▶ START GAME', {
      fontSize: '26px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      soundManager.select();
      this.startGame();
    });
    btn.on('pointerover', () => {
      btn.setScale(1.05);
      shadow.setScale(1.05);
    });
    btn.on('pointerout', () => {
      btn.setScale(1);
      shadow.setScale(1);
    });

    this.add.text(GAME_WIDTH / 2, btnY + 45, 'Press ENTER', {
      fontSize: '14px', fontFamily: 'Arial', color: '#666666'
    }).setOrigin(0.5);
  }

  createBackButton() {
    const btn = this.add.rectangle(100, 50, 120, 40, 0x666666);
    btn.setStrokeStyle(2, 0xffffff);
    btn.setInteractive({ useHandCursor: true });

    this.add.text(100, 50, '← BACK', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      soundManager.select();
      this.goBack();
    });
    btn.on('pointerover', () => btn.setScale(1.05));
    btn.on('pointerout', () => btn.setScale(1));
  }

  startGame() {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(300, () => {
      this.scene.start('IntroScene', {
        mode: this.gameMode,
        playerCount: this.playerCount,
        difficulty: this.selectedDifficulty
      });
    });
  }

  goBack() {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(300, () => {
      this.scene.start('MenuScene');
    });
  }
}
