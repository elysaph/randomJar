import { AppState, Category } from '../types';
import { getDefaultCategories } from '../data/defaultData';

const STORAGE_KEY = 'goal-weighted-lottery';

export const getInitialState = (): AppState => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse saved state', e);
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