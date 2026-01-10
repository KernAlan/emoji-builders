// Phonics patterns for word building
// Each pattern has valid words and decoy letters that make nonsense words

export const phonicsPatterns = {
  '_AT': {
    validWords: ['CAT', 'BAT', 'HAT', 'MAT', 'RAT', 'SAT', 'PAT', 'FAT'],
    decoyLetters: ['Z', 'Q', 'X', 'V']
  },
  '_OG': {
    validWords: ['DOG', 'LOG', 'FOG', 'HOG', 'JOG', 'BOG'],
    decoyLetters: ['Z', 'Q', 'X', 'V']
  },
  '_UN': {
    validWords: ['SUN', 'RUN', 'FUN', 'BUN', 'GUN', 'PUN'],
    decoyLetters: ['Z', 'Q', 'X', 'V']
  },
  '_AN': {
    validWords: ['CAN', 'MAN', 'PAN', 'FAN', 'RAN', 'TAN', 'VAN'],
    decoyLetters: ['Z', 'Q', 'X']
  },
  '_EN': {
    validWords: ['HEN', 'PEN', 'TEN', 'MEN', 'DEN', 'BEN'],
    decoyLetters: ['Z', 'Q', 'X', 'V']
  },
  '_IT': {
    validWords: ['SIT', 'HIT', 'BIT', 'FIT', 'KIT', 'PIT'],
    decoyLetters: ['Z', 'Q', 'X', 'V']
  },
  '_OP': {
    validWords: ['TOP', 'HOP', 'MOP', 'POP', 'COP'],
    decoyLetters: ['Z', 'Q', 'X', 'V']
  },
  '_UG': {
    validWords: ['BUG', 'HUG', 'MUG', 'RUG', 'TUG', 'JUG'],
    decoyLetters: ['Z', 'Q', 'X', 'V']
  },
  '_OT': {
    validWords: ['HOT', 'POT', 'DOT', 'COT', 'GOT', 'NOT'],
    decoyLetters: ['Z', 'Q', 'X', 'V']
  },
  '_ED': {
    validWords: ['BED', 'RED', 'FED', 'LED'],
    decoyLetters: ['Z', 'Q', 'X', 'V']
  }
};

// Get a random pattern from available ones based on difficulty level
export function getRandomPattern(allowedPatterns) {
  const pattern = Phaser.Utils.Array.GetRandom(allowedPatterns);
  return {
    pattern,
    data: phonicsPatterns[pattern]
  };
}

// Get letters to display (mix of valid and decoy)
export function getLettersForPattern(patternData, correctLetter) {
  const letters = [correctLetter];

  // Add 2-3 decoy letters
  const decoys = Phaser.Utils.Array.Shuffle([...patternData.decoyLetters]);
  letters.push(...decoys.slice(0, 3));

  return Phaser.Utils.Array.Shuffle(letters);
}
