import { Category, REWARD_THRESHOLDS, LEVEL_TITLES } from '../types';

export const drawSlot = (pool: string[]): { selectedId: string; newPool: string[] } => {
    if (pool.length === 0) {
        throw new Error('Pool is empty');
    }
    const index = Math.floor(Math.random() * pool.length);
    const selectedId = pool[index];
    const newPool = [...pool];
    newPool.splice(index, 1);
    return { selectedId, newPool };
};

export const selectRandomMode = (category: Category): string => {
    if (category.modes.length === 0) {
        return 'No modes defined';
    }
    const index = Math.floor(Math.random() * category.modes.length);
    return category.modes[index];
};

export const calculateLevelUpdate = (
    currentLevel: number,
    score: number,
    hasPBImprovement: boolean,
    highScoreAchieved: boolean,
    discomfortModeWins: number,
    totalWins: number
): number => {
    let newLevel = currentLevel;

    if (score <= 0) {
        newLevel = Math.max(0, currentLevel - 1);
    } else if (score >= 6 && score <= 10) {
        newLevel = Math.min(5, currentLevel + 1);
    } else if (score > 10) {
        newLevel = Math.min(5, currentLevel + 2);
    }

    // Level 4 constraint: requires at least 1 PB improvement
    if (newLevel >= 4 && !hasPBImprovement) {
        newLevel = 3;
    }

    // Level 5 constraint: requires high score + majority discomfort mode wins
    if (newLevel === 5) {
        const hasHighScore = score > 10;
        const majorityDiscomfort = discomfortModeWins > totalWins / 2;
        if (!hasHighScore || !majorityDiscomfort) {
            newLevel = 4;
        }
    }

    return newLevel;
};

export const getRewardForScore = (score: number): string | null => {
    const threshold = REWARD_THRESHOLDS.find(t => score >= t.score);
    return threshold ? threshold.reward : null;
};

export const getPunishmentForScore = (score: number): string | null => {
    if (score < 0) {
        const punishments = [
            '🔒 Friction: Disable distracting apps for 2 hours',
            '💪 Effort: Complete one extra mandatory session today',
            '💰 Financial: Put $5 into a penalty jar'
        ];
        return punishments[Math.floor(Math.random() * punishments.length)];
    }
    return null;
};

export const updateStreak = (currentStreak: number, isWin: boolean): number => {
    return isWin ? currentStreak + 1 : 0;
};

export const updateBestStreak = (currentBest: number, newStreak: number): number => {
    return Math.max(currentBest, newStreak);
};