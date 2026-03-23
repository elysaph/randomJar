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
    modeValue?: number;
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
    sessionHistory: Session[];
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
    comfortable: { label: 'Comfortable', isWin: false, points: -1 },
    normal: { label: 'Normal', isWin: true, points: 1 },
    rigorous: { label: 'Rigorous', isWin: true, points: 2 }
};

export const REWARD_THRESHOLDS: RewardThreshold[] = [
    { score: 5, reward: 'Small reward' },
    { score: 10, reward: 'Medium reward' },
    { score: 15, reward: 'Large reward' }
];