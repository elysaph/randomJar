// src/types/index.ts
export interface PBEntry {
    id: string;
    label: string;
    value: string;
    lastUpdated: string;
}

export interface Category {
    id: string;
    name: string;
    slots: number;
    modes: string[];
    pbCriteria: PBEntry[];
}

export interface Session {
    id: string;
    day: number;
    category: string;
    categoryId: string;
    mode: string;
    result: 'WIN' | 'LOSS';
    effortLevel: 'comfortable' | 'normal' | 'rigorous';
    notes: string;
    timestamp: string;
}

export interface CycleStats {
    cycleNumber: number;
    wins: number;
    losses: number;
    streak: number;
    bestStreak: number;
    score: number;
}

export interface LevelInfo {
    level: number;
    title: string;
}

export interface AppState {
    categories: Category[];
    activePool: string[]; // Array of category IDs
    currentDay: number;
    sessions: Session[];
    cycleStats: CycleStats;
    levelInfo: LevelInfo;
    cycleCompleted: boolean;
    lastUpdated: string;
}

export interface RewardThreshold {
    score: number;
    reward: string;
}

export const LEVEL_TITLES: Record<number, string> = {
    0: 'Chaos Goblin',
    1: 'Initiate',
    2: 'Consistent',
    3: 'Dangerous',
    4: 'Elite',
    5: 'Unfair'
};

export const EFFORT_LEVELS = {
    comfortable: { label: 'Comfortable', isWin: false },
    normal: { label: 'Normal', isWin: false },
    rigorous: { label: 'Rigorous', isWin: true }
};

export const REWARD_THRESHOLDS: RewardThreshold[] = [
    { score: 5, reward: '🎮 30 min gaming session' },
    { score: 10, reward: '🍕 Order your favorite food' },
    { score: 15, reward: '🎁 Special treat - Buy something you want' }
];