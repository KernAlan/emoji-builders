// Game dimensions
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;
export const HALF_WIDTH = GAME_WIDTH / 2;

// BRIGHT kid-friendly colors!
export const COLORS = {
  background: 0x87CEEB,      // Sky blue
  mathSide: 0x98D8AA,        // Soft green
  wordSide: 0xFFB6C1,        // Light pink

  catcherMath: 0x4CAF50,     // Bright green
  catcherWord: 0xE91E63,     // Bright pink

  blockMath: 0xFFEB3B,       // Bright yellow
  blockWord: 0xFF9800,       // Bright orange

  towerMath: 0x8BC34A,       // Light green
  towerWord: 0xF48FB1,       // Light pink

  success: 0x4CAF50,
  failure: 0xF44336,
  gold: 0xFFD700
};

// Game settings
export const BLOCK_SIZE = 50;
export const TOWER_BLOCK_HEIGHT = 45;

// Difficulty settings
export const DIFFICULTY = {
  easy: {
    maxSum: 5,
    fallSpeed: 55,
    spawnInterval: 2200,
    wordPatterns: ['_AT', '_OG', '_UN']
  },
  medium: {
    maxSum: 8,
    fallSpeed: 70,
    spawnInterval: 1900,
    wordPatterns: ['_AT', '_OG', '_UN', '_AN', '_EN', '_IT']
  },
  hard: {
    maxSum: 10,
    fallSpeed: 90,
    spawnInterval: 1600,
    wordPatterns: ['_AT', '_OG', '_UN', '_AN', '_EN', '_IT', '_OP', '_UG']
  }
};

// Blocks needed to win
export const BLOCKS_TO_WIN = 6;
