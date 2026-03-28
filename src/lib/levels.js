export const LEVEL_CONSTANT = 0.15;

/**
 * Calculate the user's level based on their total XP.
 * Formula: Level = Math.floor(0.15 * sqrt(XP)) + 1
 */
export function calculateLevel(xp) {
  if (!xp || xp < 0) return 1;
  return Math.floor(LEVEL_CONSTANT * Math.sqrt(xp)) + 1;
}

/**
 * Reverse calculate the XP required to REACH a specific level.
 * Formula: XP = ( (Level - 1) / 0.15 )^2
 */
export function getXpForLevel(level) {
  if (level <= 1) return 0;
  return Math.ceil(Math.pow((level - 1) / LEVEL_CONSTANT, 2));
}

/**
 * Returns an object containing progress metrics for the progress bar.
 */
export function getLevelProgress(xp) {
  const currentXp = xp || 0;
  const currentLevel = calculateLevel(currentXp);
  
  const xpCurrentLevelStart = getXpForLevel(currentLevel);
  const xpNextLevelStart = getXpForLevel(currentLevel + 1);
  
  const xpIntoCurrentLevel = currentXp - xpCurrentLevelStart;
  const xpNeededForNextLevel = xpNextLevelStart - xpCurrentLevelStart;
  
  const progressPercentage = (xpIntoCurrentLevel / xpNeededForNextLevel) * 100;

  return {
    level: currentLevel,
    currentXp,
    xpForNextLevel: xpNextLevelStart,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    xpRemaining: xpNextLevelStart - currentXp
  };
}
