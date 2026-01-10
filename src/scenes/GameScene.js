import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, HALF_WIDTH, COLORS,
  BLOCK_SIZE, TOWER_BLOCK_HEIGHT, DIFFICULTY, BLOCKS_TO_WIN
} from '../utils/constants.js';
import { phonicsPatterns } from '../data/wordList.js';
import { getEmojiForWord } from '../data/emojiMap.js';
import { soundManager } from '../utils/SoundManager.js';

const CATCHER_WIDTH = 80;
const CATCHER_HEIGHT = 20;
const CATCHER_SPEED = 380;
const TOWER_WIDTH = 90;

const PLAY_AREA_LEFT_START = TOWER_WIDTH + 10;
const PLAY_AREA_LEFT_END = HALF_WIDTH - 10;
const PLAY_AREA_RIGHT_START = HALF_WIDTH + 10;
const PLAY_AREA_RIGHT_END = GAME_WIDTH - TOWER_WIDTH - 10;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.gameMode = data.mode || 'arithmetic';
    this.playerCount = data.playerCount || 2;
    this.mathType = 'addition';
    this.isPaused = false;

    // Shared co-op state (2-player mode only)
    this.sharedTowerHeight = 0;
  }

  create() {
    this.cameras.main.fadeIn(300);
    soundManager.init();
    soundManager.startMusic();

    this.player1 = this.createPlayerState();
    this.player2 = this.createPlayerState();

    this.primaryColor = this.gameMode === 'alphabet' ? COLORS.catcherWord : COLORS.catcherMath;
    this.blockColor = this.gameMode === 'alphabet' ? COLORS.blockWord : COLORS.blockMath;
    this.bgColor = this.gameMode === 'alphabet' ? COLORS.wordSide : COLORS.mathSide;

    this.drawBackground();
    this.createClouds();
    this.createTowerAreas();
    this.createCatchers();
    this.createEquationDisplay();
    this.createInstructionDisplay();
    this.createUI();
    this.createPauseMenu();
    this.setupInput();

    this.player1TowerBlocks = [];
    this.player2TowerBlocks = [];
    this.sharedTowerBlocks = [];


    this.startNewProblem(this.player1, 1);
    if (this.playerCount === 2) {
      this.startNewProblem(this.player2, 2);
    }

    // Dynamic spawn timers - these get adjusted by adaptive difficulty
    this.spawnTimer1 = this.time.addEvent({
      delay: this.player1.currentSpawnInterval,
      callback: () => this.spawnBlock(this.player1, 1),
      loop: true
    });

    if (this.playerCount === 2) {
      this.spawnTimer2 = this.time.addEvent({
        delay: this.player2.currentSpawnInterval,
        callback: () => this.spawnBlock(this.player2, 2),
        loop: true
      });
    }

    // Spawn correct answer immediately so player can start right away
    this.spawnCorrectBlock(this.player1, 1);
    if (this.playerCount === 2) {
      this.spawnCorrectBlock(this.player2, 2);
    }

    // Then spawn a couple more blocks
    this.time.delayedCall(500, () => {
      this.spawnBlock(this.player1, 1);
      if (this.playerCount === 2) {
        this.spawnBlock(this.player2, 2);
      }
    });

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.isPaused) {
        this.resumeGame();
      } else {
        soundManager.stopMusic();
        this.scene.start('MenuScene');
      }
    });

    this.input.keyboard.on('keydown-P', () => {
      if (this.isPaused) {
        this.resumeGame();
      } else {
        this.pauseGame();
      }
    });
  }

  createPlayerState() {
    return {
      currentSum: 0,
      targetSum: 0,
      startNum: 0,
      isSubtraction: false,
      caughtNumbers: [],
      currentPattern: '',
      validWords: [],
      targetWord: '',
      towerHeight: 0,
      difficulty: 'easy',
      blocks: [],
      // Ultra-responsive adaptive difficulty tracking
      recentResults: [], // Recent results for tracking
      currentFallSpeed: 100, // Start medium - adjusts instantly either way
      currentSpawnInterval: 1200, // Medium spawn rate
      streak: 0 // Positive for success streak, negative for fail streak
    };
  }

  drawBackground() {
    if (this.playerCount === 1) {
      // Single player - full width
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, this.bgColor);
    } else {
      // Two players - split screen
      this.add.rectangle(HALF_WIDTH / 2, GAME_HEIGHT / 2, HALF_WIDTH, GAME_HEIGHT, this.bgColor);
      this.add.rectangle(HALF_WIDTH + HALF_WIDTH / 2, GAME_HEIGHT / 2, HALF_WIDTH, GAME_HEIGHT, this.bgColor);

      // Divider
      this.add.rectangle(HALF_WIDTH, GAME_HEIGHT / 2, 6, GAME_HEIGHT, 0xffffff, 0.5);
    }

    // Subtle pattern overlay
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      this.add.circle(x, y, Phaser.Math.Between(20, 60), 0xffffff, 0.1);
    }

    const modeTitle = this.gameMode === 'alphabet' ? '📚 ALPHABET' : '🔢 ARITHMETIC';

    // Player labels with mascots
    const p1X = PLAY_AREA_LEFT_START + (PLAY_AREA_LEFT_END - PLAY_AREA_LEFT_START) / 2;
    const mascot = this.gameMode === 'alphabet' ? '🦊' : '🐸';

    if (this.playerCount === 1) {
      // Single player - mode title at top
      this.add.text(GAME_WIDTH / 2, 20, modeTitle + ' MODE', {
        fontSize: '28px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, 55, `${mascot} PLAYER 1 ${mascot}`, {
        fontSize: '26px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, 82, '◀ A/← Move →/D ▶', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
    } else {
      // Two players - mode labels on sides, hearts in center (added separately)
      const p2X = PLAY_AREA_RIGHT_START + (PLAY_AREA_RIGHT_END - PLAY_AREA_RIGHT_START) / 2;

      this.add.text(p1X, 20, `${mascot} PLAYER 1`, {
        fontSize: '22px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      this.add.text(p1X, 45, '◀ A   D ▶', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);

      this.add.text(p2X, 20, `PLAYER 2 ${mascot}`, {
        fontSize: '22px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      this.add.text(p2X, 45, '◀ ←   → ▶', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
    }
  }

  createClouds() {
    // Decorative floating clouds
    for (let i = 0; i < 6; i++) {
      const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
      const y = Phaser.Math.Between(GAME_HEIGHT - 200, GAME_HEIGHT - 80);
      const cloud = this.add.ellipse(x, y, Phaser.Math.Between(60, 100), 30, 0xffffff, 0.3);

      this.tweens.add({
        targets: cloud,
        x: x + Phaser.Math.Between(-20, 20),
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createTowerAreas() {
    const winLineY = GAME_HEIGHT - (BLOCKS_TO_WIN * TOWER_BLOCK_HEIGHT) - 60;
    const winLines = [];

    if (this.playerCount === 1) {
      // Single player - left tower
      this.add.rectangle(TOWER_WIDTH / 2, GAME_HEIGHT / 2, TOWER_WIDTH - 10, GAME_HEIGHT - 20, 0x8B4513, 0.6);
      this.add.rectangle(TOWER_WIDTH / 2, GAME_HEIGHT / 2, TOWER_WIDTH - 20, GAME_HEIGHT - 30, 0xDEB887, 0.4);

      this.add.text(TOWER_WIDTH / 2, 25, '🏗️', { fontSize: '24px', padding: { top: 10 } }).setOrigin(0.5);

      const winLine1 = this.add.rectangle(TOWER_WIDTH / 2, winLineY, TOWER_WIDTH - 15, 4, COLORS.gold);
      winLines.push(winLine1);

      this.add.text(TOWER_WIDTH / 2, winLineY - 15, '⭐ WIN ⭐', {
        fontSize: '12px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
    } else {
      // Two players - SHARED CENTER TOWER (Emoji House!)
      const centerX = GAME_WIDTH / 2;
      const towerWidth = 120;

      // Tower/house background - starts lower to not overlap with UI
      this.add.rectangle(centerX, GAME_HEIGHT / 2 + 120, towerWidth + 20, GAME_HEIGHT / 2 - 20, 0x8B4513, 0.7);
      this.add.rectangle(centerX, GAME_HEIGHT / 2 + 120, towerWidth, GAME_HEIGHT / 2 - 30, 0xDEB887, 0.5);

      // "EMOJI HOUSE" label with house icon - positioned below equation boxes
      this.add.text(centerX, 200, '🏠 EMOJI HOUSE', {
        fontSize: '16px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#8B4513',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 3
      }).setOrigin(0.5);

      // Win line on shared tower
      const winLine = this.add.rectangle(centerX, winLineY, towerWidth, 4, COLORS.gold);
      winLines.push(winLine);

      this.add.text(centerX, winLineY - 20, '⭐ FINISH ⭐', {
        fontSize: '14px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
    }

    // Animate win lines
    if (winLines.length > 0) {
      this.tweens.add({
        targets: winLines,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }
  }

  createCatchers() {
    const catcherY = GAME_HEIGHT - 50;

    if (this.playerCount === 1) {
      // Single player - use full width (minus tower)
      const singlePlayerMinX = TOWER_WIDTH + CATCHER_WIDTH / 2 + 10;
      const singlePlayerMaxX = GAME_WIDTH - CATCHER_WIDTH / 2 - 10;
      const singlePlayerCenterX = (singlePlayerMinX + singlePlayerMaxX) / 2;

      this.catcher1 = this.add.rectangle(singlePlayerCenterX, catcherY, CATCHER_WIDTH, CATCHER_HEIGHT, this.primaryColor);
      this.catcher1.setStrokeStyle(4, 0xffffff);
      this.catcher1.minX = singlePlayerMinX;
      this.catcher1.maxX = singlePlayerMaxX;

      // Catcher 1 eyes
      this.catcher1Eye1 = this.add.circle(singlePlayerCenterX - 15, catcherY - 5, 4, 0xffffff);
      this.catcher1Eye2 = this.add.circle(singlePlayerCenterX + 15, catcherY - 5, 4, 0xffffff);
      this.catcher1Pupil1 = this.add.circle(singlePlayerCenterX - 15, catcherY - 5, 2, 0x000000);
      this.catcher1Pupil2 = this.add.circle(singlePlayerCenterX + 15, catcherY - 5, 2, 0x000000);

      // No catcher 2 in single player - create dummy objects
      this.catcher2 = { x: -100, y: -100, minX: 0, maxX: 0 };
      this.catcher2Eye1 = { x: -100 };
      this.catcher2Eye2 = { x: -100 };
      this.catcher2Pupil1 = { x: -100 };
      this.catcher2Pupil2 = { x: -100 };
    } else {
      // Two players - split screen
      const p1X = PLAY_AREA_LEFT_START + (PLAY_AREA_LEFT_END - PLAY_AREA_LEFT_START) / 2;
      this.catcher1 = this.add.rectangle(p1X, catcherY, CATCHER_WIDTH, CATCHER_HEIGHT, this.primaryColor);
      this.catcher1.setStrokeStyle(4, 0xffffff);
      this.catcher1.minX = PLAY_AREA_LEFT_START + CATCHER_WIDTH / 2;
      this.catcher1.maxX = PLAY_AREA_LEFT_END - CATCHER_WIDTH / 2;

      const p2X = PLAY_AREA_RIGHT_START + (PLAY_AREA_RIGHT_END - PLAY_AREA_RIGHT_START) / 2;
      this.catcher2 = this.add.rectangle(p2X, catcherY, CATCHER_WIDTH, CATCHER_HEIGHT, this.primaryColor);
      this.catcher2.setStrokeStyle(4, 0xffffff);
      this.catcher2.minX = PLAY_AREA_RIGHT_START + CATCHER_WIDTH / 2;
      this.catcher2.maxX = PLAY_AREA_RIGHT_END - CATCHER_WIDTH / 2;

      // Add eyes to catchers to make them characters!
      this.catcher1Eye1 = this.add.circle(p1X - 15, catcherY - 5, 4, 0xffffff);
      this.catcher1Eye2 = this.add.circle(p1X + 15, catcherY - 5, 4, 0xffffff);
      this.catcher1Pupil1 = this.add.circle(p1X - 15, catcherY - 5, 2, 0x000000);
      this.catcher1Pupil2 = this.add.circle(p1X + 15, catcherY - 5, 2, 0x000000);

      this.catcher2Eye1 = this.add.circle(p2X - 15, catcherY - 5, 4, 0xffffff);
      this.catcher2Eye2 = this.add.circle(p2X + 15, catcherY - 5, 4, 0xffffff);
      this.catcher2Pupil1 = this.add.circle(p2X - 15, catcherY - 5, 2, 0x000000);
      this.catcher2Pupil2 = this.add.circle(p2X + 15, catcherY - 5, 2, 0x000000);
    }
  }

  createEquationDisplay() {
    // Position equation boxes below player labels but above blocks
    const eqY = this.playerCount === 1 ? 140 : 110;
    const eqHeight = 70;
    const eqWidth = 200;

    if (this.playerCount === 1) {
      // Single player - centered equation box
      this.eq1Bg = this.add.rectangle(GAME_WIDTH / 2, eqY, eqWidth, eqHeight, 0xffffff, 0.95);
      this.eq1Bg.setStrokeStyle(4, this.primaryColor);
      this.eq1Bg.setDepth(10);

      this.eq1Text = this.add.text(GAME_WIDTH / 2, eqY, '', {
        fontSize: '28px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#333333',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(11);

      // Dummy player 2 equation objects
      this.eq2Bg = { setStrokeStyle: () => {} };
      this.eq2Text = { setText: () => {}, setFontSize: () => {} };
    } else {
      // Two players - split screen equation boxes
      const p1X = PLAY_AREA_LEFT_START + (PLAY_AREA_LEFT_END - PLAY_AREA_LEFT_START) / 2;
      const p2X = PLAY_AREA_RIGHT_START + (PLAY_AREA_RIGHT_END - PLAY_AREA_RIGHT_START) / 2;

      // Player 1 equation box
      this.eq1Bg = this.add.rectangle(p1X, eqY, eqWidth, eqHeight, 0xffffff, 0.95);
      this.eq1Bg.setStrokeStyle(4, this.primaryColor);
      this.eq1Bg.setDepth(10);

      this.eq1Text = this.add.text(p1X, eqY, '', {
        fontSize: '26px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#333333',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(11);

      // Player 2 equation box
      this.eq2Bg = this.add.rectangle(p2X, eqY, eqWidth, eqHeight, 0xffffff, 0.95);
      this.eq2Bg.setStrokeStyle(4, this.primaryColor);
      this.eq2Bg.setDepth(10);

      this.eq2Text = this.add.text(p2X, eqY, '', {
        fontSize: '26px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#333333',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(11);
    }
  }

  createInstructionDisplay() {
    // Big "CATCH THE X!" instruction text - below equation boxes
    const instructionY = this.playerCount === 1 ? 200 : 170;

    if (this.playerCount === 1) {
      // Single player - centered
      this.instruction1 = this.add.text(GAME_WIDTH / 2, instructionY, '', {
        fontSize: '38px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5
      }).setOrigin(0.5).setDepth(12);

      // Dummy for player 2
      this.instruction2 = { setText: () => {} };
    } else {
      // Two players
      const p1X = PLAY_AREA_LEFT_START + (PLAY_AREA_LEFT_END - PLAY_AREA_LEFT_START) / 2;
      const p2X = PLAY_AREA_RIGHT_START + (PLAY_AREA_RIGHT_END - PLAY_AREA_RIGHT_START) / 2;

      this.instruction1 = this.add.text(p1X, instructionY, '', {
        fontSize: '32px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(12);

      this.instruction2 = this.add.text(p2X, instructionY, '', {
        fontSize: '32px',
        fontFamily: 'Comic Sans MS, Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(12);
    }
  }

  updateInstructionDisplay(player, playerNum) {
    const instruction = playerNum === 1 ? this.instruction1 : this.instruction2;

    if (this.gameMode === 'arithmetic') {
      let needed;
      if (player.isSubtraction) {
        needed = player.currentSum - player.targetSum;
      } else {
        needed = player.targetSum - player.currentSum;
      }

      if (needed > 4) {
        // Need more than one block - show progress toward goal
        instruction.setText(`NEED ${needed} MORE!`);
      } else if (needed > 0) {
        // Can finish with one block - show exact value needed
        instruction.setText(`CATCH A ${needed}!`);
      } else {
        instruction.setText('');
      }
    } else {
      const neededLetter = player.targetWord[0];
      const emoji = getEmojiForWord(player.targetWord);
      instruction.setText(`CATCH THE ${neededLetter}! ${emoji}`);
    }
  }

  createUI() {
    this.tower1Text = this.add.text(TOWER_WIDTH / 2, GAME_HEIGHT - 25, '0/' + BLOCKS_TO_WIN, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    if (this.playerCount === 2) {
      this.tower2Text = this.add.text(GAME_WIDTH - TOWER_WIDTH / 2, GAME_HEIGHT - 25, '0/' + BLOCKS_TO_WIN, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
    } else {
      // Dummy tower 2 text object for single player
      this.tower2Text = { setText: () => {} };
    }

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'P = Pause  |  ESC = Menu', {
      fontSize: '14px',
      color: '#666666'
    }).setOrigin(0.5);
  }

  createPauseMenu() {
    // Pause overlay - initially hidden
    this.pauseOverlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.pauseOverlay.setVisible(false);
    this.pauseOverlay.setDepth(1000);

    const dimBg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);

    const pauseBg = this.add.rectangle(0, 0, 350, 280, 0xffffff, 0.95);
    pauseBg.setStrokeStyle(4, this.primaryColor);

    const pauseTitle = this.add.text(0, -90, '⏸️ PAUSED', {
      fontSize: '42px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Resume button
    const resumeBtn = this.add.rectangle(0, -10, 200, 50, this.primaryColor);
    resumeBtn.setStrokeStyle(3, 0xffffff);
    resumeBtn.setInteractive({ useHandCursor: true });

    const resumeText = this.add.text(0, -10, '▶️ RESUME', {
      fontSize: '24px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    resumeBtn.on('pointerdown', () => {
      soundManager.select();
      this.resumeGame();
    });
    resumeBtn.on('pointerover', () => resumeBtn.setScale(1.05));
    resumeBtn.on('pointerout', () => resumeBtn.setScale(1));

    // Menu button
    const menuBtn = this.add.rectangle(0, 60, 200, 50, 0x666666);
    menuBtn.setStrokeStyle(3, 0xffffff);
    menuBtn.setInteractive({ useHandCursor: true });

    const menuText = this.add.text(0, 60, '🏠 MENU', {
      fontSize: '24px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    menuBtn.on('pointerdown', () => {
      soundManager.stopMusic();
      soundManager.select();
      this.scene.start('MenuScene');
    });
    menuBtn.on('pointerover', () => menuBtn.setScale(1.05));
    menuBtn.on('pointerout', () => menuBtn.setScale(1));

    const hintText = this.add.text(0, 115, 'Press P or ESC to resume', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#666666'
    }).setOrigin(0.5);

    this.pauseOverlay.add([dimBg, pauseBg, pauseTitle, resumeBtn, resumeText, menuBtn, menuText, hintText]);
  }

  pauseGame() {
    if (this.isPaused) return;
    this.isPaused = true;
    soundManager.select();
    this.pauseOverlay.setVisible(true);

    // Pause all tweens and timers
    this.tweens.pauseAll();
    if (this.spawnTimer1) this.spawnTimer1.paused = true;
    if (this.spawnTimer2) this.spawnTimer2.paused = true;
  }

  resumeGame() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.pauseOverlay.setVisible(false);

    // Resume all tweens and timers
    this.tweens.resumeAll();
    if (this.spawnTimer1) this.spawnTimer1.paused = false;
    if (this.spawnTimer2) this.spawnTimer2.paused = false;
  }

  setupInput() {
    this.keys = {
      p1Left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      p1Right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      p2Left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      p2Right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    };
  }

  startNewProblem(player, playerNum) {
    const difficulty = DIFFICULTY[player.difficulty];
    player.caughtNumbers = [];

    if (this.gameMode === 'arithmetic') {
      // Addition only for now - simpler for kids
      player.isSubtraction = false;

      // Target is 5-10 range - requires catching MULTIPLE blocks
      // Blocks will only show 1-4, so kids must ADD them up
      player.targetSum = Phaser.Math.Between(5, Math.min(10, difficulty.maxSum + 2));
      player.currentSum = 0;
      player.startNum = 0;
    } else {
      const patterns = difficulty.wordPatterns;
      player.currentPattern = Phaser.Utils.Array.GetRandom(patterns);
      const patternData = phonicsPatterns[player.currentPattern];
      player.validWords = patternData.validWords;
      player.targetWord = Phaser.Utils.Array.GetRandom(patternData.validWords);
    }

    this.updateEquationDisplay(player, playerNum);
  }

  updateEquationDisplay(player, playerNum) {
    const eqText = playerNum === 1 ? this.eq1Text : this.eq2Text;
    const eqBg = playerNum === 1 ? this.eq1Bg : this.eq2Bg;

    if (this.gameMode === 'arithmetic') {
      let displayText;

      if (player.isSubtraction) {
        // Show subtraction equation building
        if (player.caughtNumbers.length === 0) {
          displayText = `${player.startNum} - ? = ${player.targetSum}`;
        } else {
          const caught = player.caughtNumbers.join(' - ');
          displayText = `${player.startNum} - ${caught}\n= ${player.currentSum}`;
        }
      } else {
        // Show addition equation building
        if (player.caughtNumbers.length === 0) {
          displayText = `? + ? = ${player.targetSum}`;
        } else {
          const caught = player.caughtNumbers.join(' + ');
          const remaining = player.targetSum - player.currentSum;
          if (remaining > 0) {
            displayText = `${caught} + ?\n= ${player.targetSum}`;
          } else {
            displayText = `${caught}\n= ${player.currentSum}`;
          }
        }
      }

      eqText.setText(displayText);
      eqText.setFontSize(player.caughtNumbers.length > 2 ? 24 : 30);

      // Color feedback
      if (player.isSubtraction) {
        if (player.currentSum === player.targetSum) {
          eqBg.setStrokeStyle(4, COLORS.success);
        } else if (player.currentSum < player.targetSum) {
          eqBg.setStrokeStyle(4, COLORS.failure);
        } else {
          eqBg.setStrokeStyle(4, this.primaryColor);
        }
      } else {
        if (player.currentSum === player.targetSum) {
          eqBg.setStrokeStyle(4, COLORS.success);
        } else if (player.currentSum > player.targetSum) {
          eqBg.setStrokeStyle(4, COLORS.failure);
        } else {
          eqBg.setStrokeStyle(4, this.primaryColor);
        }
      }
    } else {
      const emoji = getEmojiForWord(player.targetWord);
      eqText.setText(`${emoji}\n${player.currentPattern}`);
      eqText.setFontSize(36);
    }

    // Update the big instruction text too
    this.updateInstructionDisplay(player, playerNum);
  }

  spawnBlock(player, playerNum, forceCorrect = false) {
    const difficulty = DIFFICULTY[player.difficulty];
    const isLeft = playerNum === 1;
    const startX = this.playerCount === 1 ? TOWER_WIDTH + 50 : (isLeft ? PLAY_AREA_LEFT_START + 50 : PLAY_AREA_RIGHT_START + 50);
    const endX = this.playerCount === 1 ? GAME_WIDTH - 50 : (isLeft ? PLAY_AREA_LEFT_END - 50 : PLAY_AREA_RIGHT_END - 50);

    let displayText, value, letter, isValid;

    if (this.gameMode === 'arithmetic') {
      const neededValue = player.targetSum - player.currentSum;

      if (neededValue <= 0) return; // Already solved or failed

      // IMPORTANT: Only spawn blocks with values 1-4
      // This forces kids to catch MULTIPLE blocks and ADD them
      // E.g., Target=7: catch 3, then catch 4 (3+4=7!)
      const maxBlockValue = Math.min(4, neededValue); // Never spawn more than needed

      if (forceCorrect) {
        // Spawn a value that helps them progress (1 to maxBlockValue)
        value = Phaser.Math.Between(1, maxBlockValue);
      } else {
        // Random value from 1-4, but never more than needed
        value = Phaser.Math.Between(1, maxBlockValue);
      }
      displayText = value.toString();
    } else {
      const patternData = phonicsPatterns[player.currentPattern];
      const neededLetter = player.targetWord[0]; // First letter of target word
      const correctBlockCount = player.blocks.filter(b => b.letter === neededLetter).length;

      // Force correct, or keep at least 2 correct letters on screen
      if (forceCorrect || correctBlockCount < 2) {
        letter = neededLetter;
      } else if (Math.random() < 0.5) {
        letter = neededLetter;
      } else {
        // Spawn a decoy letter (wrong answer)
        letter = Phaser.Utils.Array.GetRandom(patternData.decoyLetters);
      }
      displayText = letter;
      isValid = letter === neededLetter;
    }

    const x = Phaser.Math.Between(startX, endX);
    const block = this.createFallingBlock(x, -BLOCK_SIZE, displayText);
    block.value = value;
    block.letter = letter;
    block.isValid = isValid;
    block.playerNum = playerNum;

    player.blocks.push(block);
    soundManager.spawn();
  }

  createFallingBlock(x, y, text) {
    const container = this.add.container(x, y);

    // Rounded rectangle effect
    const shadow = this.add.rectangle(3, 3, BLOCK_SIZE, BLOCK_SIZE, 0x000000, 0.3);
    const bg = this.add.rectangle(0, 0, BLOCK_SIZE, BLOCK_SIZE, this.blockColor);
    bg.setStrokeStyle(3, 0xffffff);

    // Shine effect
    const shine = this.add.rectangle(-BLOCK_SIZE/4, -BLOCK_SIZE/4, BLOCK_SIZE/3, BLOCK_SIZE/3, 0xffffff, 0.3);

    const label = this.add.text(0, 0, text, {
      fontSize: '28px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([shadow, bg, shine, label]);

    // Wobble animation
    this.tweens.add({
      targets: container,
      angle: { from: -3, to: 3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return container;
  }

  update(time, delta) {
    if (this.isPaused) return;

    this.handleInput(delta);
    this.updateBlocks(delta);
    this.updateCatcherEyes();
    this.checkCollisions();
    this.cleanupBlocks();
  }

  handleInput(delta) {
    const moveAmount = CATCHER_SPEED * (delta / 1000);

    if (this.playerCount === 1) {
      // Single player - both A/D and arrow keys control player 1
      if (this.keys.p1Left.isDown || this.keys.p2Left.isDown) {
        this.catcher1.x = Math.max(this.catcher1.minX, this.catcher1.x - moveAmount);
      }
      if (this.keys.p1Right.isDown || this.keys.p2Right.isDown) {
        this.catcher1.x = Math.min(this.catcher1.maxX, this.catcher1.x + moveAmount);
      }
    } else {
      // Two players - separate controls
      if (this.keys.p1Left.isDown) {
        this.catcher1.x = Math.max(this.catcher1.minX, this.catcher1.x - moveAmount);
      }
      if (this.keys.p1Right.isDown) {
        this.catcher1.x = Math.min(this.catcher1.maxX, this.catcher1.x + moveAmount);
      }

      if (this.keys.p2Left.isDown) {
        this.catcher2.x = Math.max(this.catcher2.minX, this.catcher2.x - moveAmount);
      }
      if (this.keys.p2Right.isDown) {
        this.catcher2.x = Math.min(this.catcher2.maxX, this.catcher2.x + moveAmount);
      }

      // Update player 2 eye positions
      this.catcher2Eye1.x = this.catcher2.x - 15;
      this.catcher2Eye2.x = this.catcher2.x + 15;
      this.catcher2Pupil1.x = this.catcher2.x - 15;
      this.catcher2Pupil2.x = this.catcher2.x + 15;
    }

    // Update player 1 eye positions
    this.catcher1Eye1.x = this.catcher1.x - 15;
    this.catcher1Eye2.x = this.catcher1.x + 15;
    this.catcher1Pupil1.x = this.catcher1.x - 15;
    this.catcher1Pupil2.x = this.catcher1.x + 15;
  }

  updateCatcherEyes() {
    // Make eyes look at nearest block
    const lookAtBlock = (blocks, pupil1, pupil2, baseX) => {
      if (blocks.length > 0) {
        let nearest = blocks[0];
        for (const b of blocks) {
          if (b.y > nearest.y) nearest = b;
        }
        const dx = (nearest.x - baseX) * 0.02;
        pupil1.x = baseX - 15 + Phaser.Math.Clamp(dx, -2, 2);
        pupil2.x = baseX + 15 + Phaser.Math.Clamp(dx, -2, 2);
      }
    };

    lookAtBlock(this.player1.blocks, this.catcher1Pupil1, this.catcher1Pupil2, this.catcher1.x);
    if (this.playerCount === 2) {
      lookAtBlock(this.player2.blocks, this.catcher2Pupil1, this.catcher2Pupil2, this.catcher2.x);
    }
  }

  updateBlocks(delta) {
    // Use per-player adaptive fall speed
    const fallAmount1 = this.player1.currentFallSpeed * (delta / 1000);
    const fallAmount2 = this.player2.currentFallSpeed * (delta / 1000);

    for (const block of this.player1.blocks) {
      block.y += fallAmount1;
    }

    if (this.playerCount === 2) {
      for (const block of this.player2.blocks) {
        block.y += fallAmount2;
      }
    }
  }

  checkCollisions() {
    const catcherTop = this.catcher1.y - CATCHER_HEIGHT / 2;

    for (let i = this.player1.blocks.length - 1; i >= 0; i--) {
      const block = this.player1.blocks[i];
      if (!block || !block.y) continue; // Block may have been cleared
      const blockBottom = block.y + BLOCK_SIZE / 2;

      if (blockBottom >= catcherTop && blockBottom <= catcherTop + 35) {
        if (Math.abs(block.x - this.catcher1.x) < (CATCHER_WIDTH / 2 + BLOCK_SIZE / 2 - 10)) {
          this.catchBlock(this.player1, block, i, 1);
          break; // Exit loop - blocks may have been cleared on success
        }
      }
    }

    if (this.playerCount === 2) {
      for (let i = this.player2.blocks.length - 1; i >= 0; i--) {
        const block = this.player2.blocks[i];
        if (!block || !block.y) continue; // Block may have been cleared
        const blockBottom = block.y + BLOCK_SIZE / 2;

        if (blockBottom >= catcherTop && blockBottom <= catcherTop + 35) {
          if (Math.abs(block.x - this.catcher2.x) < (CATCHER_WIDTH / 2 + BLOCK_SIZE / 2 - 10)) {
            this.catchBlock(this.player2, block, i, 2);
            break; // Exit loop - blocks may have been cleared on success
          }
        }
      }
    }
  }

  catchBlock(player, block, index, playerNum) {
    player.blocks.splice(index, 1);
    soundManager.catch();

    if (this.gameMode === 'arithmetic') {
      player.caughtNumbers.push(block.value);

      if (player.isSubtraction) {
        player.currentSum -= block.value;
      } else {
        player.currentSum += block.value;
      }

      this.createCatchEffect(block.x, block.y);
      block.destroy();
      this.updateEquationDisplay(player, playerNum);

      // Check win/fail conditions
      if (player.isSubtraction) {
        if (player.currentSum === player.targetSum) {
          this.playerSuccess(player, playerNum);
        } else if (player.currentSum < player.targetSum) {
          this.playerFail(player, playerNum);
        }
      } else {
        if (player.currentSum === player.targetSum) {
          this.playerSuccess(player, playerNum);
        } else if (player.currentSum > player.targetSum) {
          this.playerFail(player, playerNum);
        }
      }
    } else {
      const formedWord = block.letter + player.currentPattern.substring(1);

      // Must match the EXACT word shown by the emoji, not just any valid word
      if (formedWord === player.targetWord) {
        this.createCatchEffect(block.x, block.y);
        block.destroy();
        this.playerSuccess(player, playerNum, formedWord);
      } else {
        this.createFailEffect(block.x, block.y);
        block.destroy();
        this.playerFail(player, playerNum);
      }
    }
  }

  playerSuccess(player, playerNum, word = '') {
    soundManager.success();

    // Fast adaptive difficulty - track success
    player.streak = Math.max(1, player.streak + 1);
    player.recentResults.push(true);
    if (player.recentResults.length > 5) player.recentResults.shift();
    this.updateAdaptiveDifficulty(player, playerNum);

    // Show victory splash with completed equation/word
    this.showVictorySplash(player, playerNum, word);

    // Big celebration!
    this.createBigCelebration(playerNum);

    // Clear all remaining blocks for this player immediately
    // so stray blocks don't trigger wrong answers
    for (const block of player.blocks) {
      block.destroy();
    }
    player.blocks = [];

    if (this.playerCount === 1) {
      // SINGLE PLAYER - individual tower
      player.towerHeight++;
      this.addTowerBlock(playerNum, word);

      const towerText = playerNum === 1 ? this.tower1Text : this.tower2Text;
      towerText.setText(player.towerHeight + '/' + BLOCKS_TO_WIN);

      if (this.checkWinCondition()) return;

      // Start new problem immediately
      this.startNewProblem(player, playerNum);
      this.spawnCorrectBlock(player, playerNum);
    } else {
      // TWO PLAYER CO-OP - shared tower, both work independently
      this.sharedTowerHeight++;
      this.addSharedTowerBlock(word);

      // Update progress text
      this.tower1Text.setText(`${this.sharedTowerHeight}/${BLOCKS_TO_WIN}`);
      if (this.tower2Text && this.tower2Text.setText) {
        this.tower2Text.setText(`${this.sharedTowerHeight}/${BLOCKS_TO_WIN}`);
      }

      if (this.checkWinCondition()) return;

      // Start new problem immediately for this player
      this.startNewProblem(player, playerNum);
      this.spawnCorrectBlock(player, playerNum);
    }
  }

  showVictorySplash(player, playerNum, word = '') {
    const x = this.playerCount === 1 ? GAME_WIDTH / 2 :
      (playerNum === 1 ? HALF_WIDTH / 2 : HALF_WIDTH + HALF_WIDTH / 2);
    const y = GAME_HEIGHT / 2 - 60;

    let splashText;

    if (this.gameMode === 'arithmetic') {
      // Show the completed equation: "3 + 4 = 7!"
      if (player.caughtNumbers.length > 0) {
        if (player.isSubtraction) {
          const equation = `${player.startNum} - ${player.caughtNumbers.join(' - ')} = ${player.targetSum}`;
          splashText = `${equation} ✓`;
        } else {
          const equation = `${player.caughtNumbers.join(' + ')} = ${player.targetSum}`;
          splashText = `${equation} ✓`;
        }
      } else {
        splashText = `= ${player.targetSum} ✓`;
      }
    } else {
      // Show the completed word: "C + AT = CAT! 🐱"
      const letter = word[0];
      const pattern = player.currentPattern.substring(1);
      const emoji = getEmojiForWord(word);
      splashText = `${letter} + ${pattern} = ${word}! ${emoji}`;
    }

    // Create splash container
    const splash = this.add.container(x, y);

    // Background
    const bg = this.add.rectangle(0, 0, 350, 80, 0x000000, 0.8);
    bg.setStrokeStyle(4, COLORS.gold);

    // Text
    const text = this.add.text(0, 0, splashText, {
      fontSize: '32px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    splash.add([bg, text]);
    splash.setScale(0);
    splash.setDepth(100);

    // Animate in
    this.tweens.add({
      targets: splash,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold then fade out
        this.time.delayedCall(1200, () => {
          this.tweens.add({
            targets: splash,
            scale: 0,
            alpha: 0,
            duration: 300,
            onComplete: () => splash.destroy()
          });
        });
      }
    });
  }

  spawnCorrectBlock(player, playerNum) {
    // Force spawn the correct answer
    this.spawnBlock(player, playerNum, true);
  }

  playerFail(player, playerNum) {
    soundManager.fail();
    this.cameras.main.shake(200, 0.015);

    // Fast adaptive difficulty - track failure
    player.streak = Math.min(-1, player.streak - 1);
    player.recentResults.push(false);
    if (player.recentResults.length > 5) player.recentResults.shift();
    this.updateAdaptiveDifficulty(player, playerNum);

    // No game over - just let kids keep trying!

    const flashX = this.playerCount === 1 ? GAME_WIDTH / 2 :
      (playerNum === 1 ? HALF_WIDTH / 2 : HALF_WIDTH + HALF_WIDTH / 2);
    const flashWidth = this.playerCount === 1 ? GAME_WIDTH : HALF_WIDTH;
    const flash = this.add.rectangle(flashX, GAME_HEIGHT / 2, flashWidth, GAME_HEIGHT, COLORS.failure, 0.4);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy()
    });

    // Sad emoji
    const sad = this.add.text(flashX, GAME_HEIGHT / 2, '😢', { fontSize: '64px', padding: { top: 10 } }).setOrigin(0.5);
    this.tweens.add({
      targets: sad,
      y: GAME_HEIGHT / 2 - 50,
      alpha: 0,
      duration: 600,
      onComplete: () => sad.destroy()
    });

    this.time.delayedCall(500, () => {
      player.currentSum = player.isSubtraction ? player.startNum : 0;
      player.caughtNumbers = [];
      this.updateEquationDisplay(player, playerNum);
    });
  }

  createBigCelebration(playerNum) {
    const x = playerNum === 1 ? HALF_WIDTH / 2 : HALF_WIDTH + HALF_WIDTH / 2;
    const y = GAME_HEIGHT / 2;

    // Burst of particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dist = Phaser.Math.Between(50, 120);
      const particle = this.add.circle(x, y, Phaser.Math.Between(5, 12),
        Phaser.Utils.Array.GetRandom([COLORS.gold, 0xff6b6b, 0x4ecdc4, 0xffe66d]));

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }

    // Big star
    const star = this.add.text(x, y, '⭐', { fontSize: '80px', padding: { top: 10 } }).setOrigin(0.5).setScale(0);
    this.tweens.add({
      targets: star,
      scale: 1.5,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: star,
          y: y - 80,
          alpha: 0,
          duration: 400,
          onComplete: () => star.destroy()
        });
      }
    });

    // "GREAT!" text
    const great = this.add.text(x, y + 60, Phaser.Utils.Array.GetRandom(['GREAT!', 'AWESOME!', 'WOW!', 'SUPER!']), {
      fontSize: '36px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: great,
      scale: 1,
      duration: 200,
      yoyo: true,
      hold: 300,
      onComplete: () => great.destroy()
    });
  }

  addTowerBlock(playerNum, word = '') {
    const towerBlocks = playerNum === 1 ? this.player1TowerBlocks : this.player2TowerBlocks;
    const player = playerNum === 1 ? this.player1 : this.player2;
    const x = playerNum === 1 ? TOWER_WIDTH / 2 : GAME_WIDTH - TOWER_WIDTH / 2;

    const y = GAME_HEIGHT - 60 - (towerBlocks.length * TOWER_BLOCK_HEIGHT);

    const block = this.add.container(x, GAME_HEIGHT + 50);

    const bg = this.add.rectangle(0, 0, TOWER_WIDTH - 12, TOWER_BLOCK_HEIGHT - 4, this.primaryColor);
    bg.setStrokeStyle(2, 0xffffff);

    let displayText;
    if (this.gameMode === 'arithmetic') {
      displayText = player.targetSum.toString();
    } else {
      displayText = word ? getEmojiForWord(word) : '?';
    }

    const label = this.add.text(0, 0, displayText, {
      fontSize: '22px',
      fontFamily: 'Comic Sans MS, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    block.add([bg, label]);

    this.tweens.add({
      targets: block,
      y: y,
      duration: 500,
      ease: 'Bounce.easeOut'
    });

    towerBlocks.push(block);
  }

  addSharedTowerBlock(word = '') {
    // Add a block to the shared center tower (2-player co-op)
    const x = GAME_WIDTH / 2;
    const towerWidth = 100;

    const y = GAME_HEIGHT - 60 - (this.sharedTowerBlocks.length * TOWER_BLOCK_HEIGHT);

    const block = this.add.container(x, GAME_HEIGHT + 50);

    // Alternate colors based on block count
    const bgColor = this.sharedTowerBlocks.length % 2 === 0 ? 0x4CAF50 : 0xE91E63;
    const bg = this.add.rectangle(0, 0, towerWidth, TOWER_BLOCK_HEIGHT - 4, bgColor);
    bg.setStrokeStyle(2, 0xffffff);

    // Show emoji from the completed word or fun icon for math
    let displayText = '🏠';
    if (this.gameMode === 'alphabet' && word) {
      displayText = getEmojiForWord(word);
    } else {
      displayText = Phaser.Utils.Array.GetRandom(['⭐', '🌟', '✨', '🎯', '🏆']);
    }

    const label = this.add.text(0, 0, displayText, {
      fontSize: '24px',
      padding: { top: 10 }
    }).setOrigin(0.5);

    block.add([bg, label]);

    this.tweens.add({
      targets: block,
      y: y,
      duration: 500,
      ease: 'Bounce.easeOut'
    });

    this.sharedTowerBlocks.push(block);
  }

  updateAdaptiveDifficulty(player, playerNum) {
    // ULTRA-RESPONSIVE adaptive difficulty
    // Reacts IMMEDIATELY - one fail = slow down, one success = speed up
    const minSpeed = 50;   // Very slow for struggling kids
    const maxSpeed = 200;  // Fast for kids crushing it
    const minInterval = 600;  // Fast spawns when doing well
    const maxInterval = 2500; // Slow spawns when struggling

    // IMMEDIATE reaction to last result
    const lastResult = player.recentResults[player.recentResults.length - 1];
    let speedAdjust = 0;
    let intervalAdjust = 0;

    if (lastResult === true) {
      // Success! Speed up based on streak
      if (player.streak >= 3) {
        speedAdjust = 25;      // Big speed boost
        intervalAdjust = -200;
      } else if (player.streak >= 2) {
        speedAdjust = 15;
        intervalAdjust = -100;
      } else {
        speedAdjust = 8;
        intervalAdjust = -50;
      }
    } else if (lastResult === false) {
      // Fail! Slow down IMMEDIATELY and significantly
      if (player.streak <= -2) {
        speedAdjust = -40;     // Major slowdown
        intervalAdjust = 400;
      } else {
        speedAdjust = -25;     // Immediate slowdown on first fail
        intervalAdjust = 250;
      }
    }

    // Apply adjustments with clamping
    player.currentFallSpeed = Phaser.Math.Clamp(
      player.currentFallSpeed + speedAdjust,
      minSpeed,
      maxSpeed
    );

    player.currentSpawnInterval = Phaser.Math.Clamp(
      player.currentSpawnInterval + intervalAdjust,
      minInterval,
      maxInterval
    );

    // Update difficulty tier based on tower height (for word patterns)
    if (player.towerHeight >= 4) {
      player.difficulty = 'hard';
    } else if (player.towerHeight >= 2) {
      player.difficulty = 'medium';
    }

    // Recreate spawn timer with new interval
    const timer = playerNum === 1 ? this.spawnTimer1 : this.spawnTimer2;
    if (timer) {
      timer.remove();
    }

    const newTimer = this.time.addEvent({
      delay: player.currentSpawnInterval,
      callback: () => this.spawnBlock(player, playerNum),
      loop: true
    });

    if (playerNum === 1) {
      this.spawnTimer1 = newTimer;
    } else {
      this.spawnTimer2 = newTimer;
    }
  }

  checkWinCondition() {
    let hasWon = false;

    if (this.playerCount === 1) {
      // Single player - individual tower
      hasWon = this.player1.towerHeight >= BLOCKS_TO_WIN;
    } else {
      // 2-player co-op - shared tower
      hasWon = this.sharedTowerHeight >= BLOCKS_TO_WIN;
    }

    if (hasWon) {
      soundManager.stopMusic();
      soundManager.win();
      this.time.delayedCall(1000, () => {
        this.scene.start('WinScene', {
          mode: this.gameMode,
          playerCount: this.playerCount,
          emojis: this.sharedTowerBlocks ? this.sharedTowerBlocks.length : 0
        });
      });
      return true;
    }
    return false;
  }

  createCatchEffect(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = this.add.circle(x, y, 8, this.primaryColor);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        alpha: 0,
        scale: 0,
        duration: 350,
        onComplete: () => particle.destroy()
      });
    }

    const star = this.add.text(x, y, '✨', { fontSize: '40px', padding: { top: 10 } }).setOrigin(0.5);
    this.tweens.add({
      targets: star,
      y: y - 40,
      alpha: 0,
      scale: 1.3,
      duration: 350,
      onComplete: () => star.destroy()
    });
  }

  createFailEffect(x, y) {
    const xMark = this.add.text(x, y, '❌', { fontSize: '48px', padding: { top: 10 } }).setOrigin(0.5);
    this.tweens.add({
      targets: xMark,
      y: y - 40,
      alpha: 0,
      scale: 1.3,
      duration: 400,
      onComplete: () => xMark.destroy()
    });
  }

  cleanupBlocks() {
    for (let i = this.player1.blocks.length - 1; i >= 0; i--) {
      if (this.player1.blocks[i].y > GAME_HEIGHT + BLOCK_SIZE) {
        this.player1.blocks[i].destroy();
        this.player1.blocks.splice(i, 1);
      }
    }

    if (this.playerCount === 2) {
      for (let i = this.player2.blocks.length - 1; i >= 0; i--) {
        if (this.player2.blocks[i].y > GAME_HEIGHT + BLOCK_SIZE) {
          this.player2.blocks[i].destroy();
          this.player2.blocks.splice(i, 1);
        }
      }
    }
  }
}
