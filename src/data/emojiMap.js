// Word to emoji mappings for visual hints
// Each word gets a fun emoji that represents it

export const emojiMap = {
  // _AT words
  'CAT': '🐈',
  'BAT': '🦇',
  'HAT': '🎩',
  'MAT': '🧹',
  'RAT': '🐀',
  'SAT': '🪑',
  'PAT': '👋',
  'FAT': '🍔',

  // _OG words
  'DOG': '🐕',
  'LOG': '🪵',
  'FOG': '🌫️',
  'HOG': '🐷',
  'JOG': '🏃',
  'BOG': '🌿',

  // _UN words
  'SUN': '☀️',
  'RUN': '🏃',
  'FUN': '🎉',
  'BUN': '🥯',
  'GUN': '🔫',
  'PUN': '😄',

  // _AN words
  'CAN': '🥫',
  'MAN': '👨',
  'PAN': '🍳',
  'FAN': '🌀',
  'RAN': '🏃',
  'TAN': '☀️',
  'VAN': '🚐',

  // _EN words
  'HEN': '🐔',
  'PEN': '🖊️',
  'TEN': '🔟',
  'MEN': '👨‍👨‍👦',
  'DEN': '🏠',
  'BEN': '👦',

  // _IT words
  'SIT': '🪑',
  'HIT': '👊',
  'BIT': '🦷',
  'FIT': '💪',
  'KIT': '🧰',
  'PIT': '🕳️',

  // _OP words
  'TOP': '🔝',
  'HOP': '🐰',
  'MOP': '🧹',
  'POP': '🎈',
  'COP': '👮',

  // _UG words
  'BUG': '🐛',
  'HUG': '🤗',
  'MUG': '☕',
  'RUG': '🧶',
  'TUG': '🚢',
  'JUG': '🫗',

  // _OT words
  'HOT': '🔥',
  'POT': '🍲',
  'DOT': '⚫',
  'COT': '🛏️',
  'GOT': '✅',
  'NOT': '❌',

  // _ED words
  'BED': '🛏️',
  'RED': '🔴',
  'FED': '🍽️',
  'LED': '💡'
};

// Get emoji for a word, or a question mark if not found
export function getEmojiForWord(word) {
  return emojiMap[word.toUpperCase()] || '❓';
}
