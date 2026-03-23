import { AppState, Category, LEVEL_TITLES } from '../types';
import { getDefaultCategories } from '../data/defaultData';

const STORAGE_KEY = 'goal-weighted-lottery';

const createId = (): string => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toFiniteNumber = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSavedState = (raw: unknown): AppState | null => {
    if (!raw || typeof raw !== 'object') {
        return null;
    }

    const baseState = createNewCycle();
    const source = raw as Partial<AppState> & { [key: string]: unknown };

    const categories = Array.isArray(source.categories)
        ? source.categories
            .filter((category): category is Category => !!category && typeof category === 'object')
            .map((category) => ({
                id: String(category.id ?? createId()),
                name: String(category.name ?? 'Untitled'),
                slots: Math.max(0, toFiniteNumber(category.slots, 1)),
                modes: Array.isArray(category.modes) ? category.modes.map((mode) => String(mode)) : [],
                pbCriteria: Array.isArray(category.pbCriteria)
                    ? category.pbCriteria
                        .filter((pb) => !!pb && typeof pb === 'object')
                        .map((pb: any) => ({
                            id: String(pb.id ?? createId()),
                            label: String(pb.label ?? 'Metric'),
                            value: String(pb.value ?? ''),
                            lastUpdated: String(pb.lastUpdated ?? new Date().toISOString())
                        }))
                    : []
            }))
        : [];

    if (categories.length === 0) {
        return null;
    }

    const categoryIdSet = new Set(categories.map((category) => category.id));
    const activePool = Array.isArray(source.activePool)
        ? source.activePool.map((id) => String(id)).filter((id) => categoryIdSet.has(id))
        : generateActivePool(categories);

    const level = Math.max(0, Math.min(5, toFiniteNumber(source.levelInfo?.level, baseState.levelInfo.level)));

    return {
        categories,
        activePool,
        currentDay: Math.max(1, toFiniteNumber(source.currentDay, 1)),
        sessions: Array.isArray(source.sessions) ? source.sessions as AppState['sessions'] : [],
        cycleStats: {
            cycleNumber: Math.max(1, toFiniteNumber(source.cycleStats?.cycleNumber, 1)),
            wins: Math.max(0, toFiniteNumber(source.cycleStats?.wins, 0)),
            losses: Math.max(0, toFiniteNumber(source.cycleStats?.losses, 0)),
            streak: Math.max(0, toFiniteNumber(source.cycleStats?.streak, 0)),
            bestStreak: Math.max(0, toFiniteNumber(source.cycleStats?.bestStreak, 0)),
            score: toFiniteNumber(source.cycleStats?.score, 0)
        },
        levelInfo: {
            level,
            title: LEVEL_TITLES[level]
        },
        cycleCompleted: Boolean(source.cycleCompleted),
        lastUpdated: typeof source.lastUpdated === 'string' ? source.lastUpdated : new Date().toISOString()
    };
};

export const getInitialState = (): AppState => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const normalized = normalizeSavedState(parsed);
            if (normalized) {
                return normalized;
            }
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('Failed to parse saved state', e);
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    return createNewCycle();
};

export const createNewCycle = (): AppState => {
    const categories = getDefaultCategories();
    const activePool = generateActivePool(categories);

    return {
        categories,
        activePool,
        currentDay: 1,
        sessions: [],
        cycleStats: {
            cycleNumber: 1,
            wins: 0,
            losses: 0,
            streak: 0,
            bestStreak: 0,
            score: 0
        },
        levelInfo: {
            level: 1,
            title: 'Initiate'
        },
        cycleCompleted: false,
        lastUpdated: new Date().toISOString()
    };
};

export const generateActivePool = (categories: Category[]): string[] => {
    const pool: string[] = [];
    categories.forEach(category => {
        for (let i = 0; i < category.slots; i++) {
            pool.push(category.id);
        }
    });
    return pool;
};

export const saveState = (state: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...state,
        lastUpdated: new Date().toISOString()
    }));
};