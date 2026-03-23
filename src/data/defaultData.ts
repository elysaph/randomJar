// src/data/defaultData.ts
import { Category } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const getDefaultCategories = (): Category[] => [
    {
        id: uuidv4(),
        name: 'Memory',
        slots: 5,
        modes: ['SystemBuilding', 'StressTest', 'RecallDrill', 'SpeedPush', 'RouteReinforcement', 'ChaosMode'],
        pbCriteria: [
            { id: uuidv4(), label: 'Fastest 52 cards', value: '', lastUpdated: new Date().toISOString() },
            { id: uuidv4(), label: 'Most digits', value: '', lastUpdated: new Date().toISOString() },
            { id: uuidv4(), label: 'Best recall accuracy', value: '', lastUpdated: new Date().toISOString() }
        ]
    },
    {
        id: uuidv4(),
        name: 'CreativeWriting',
        slots: 3,
        modes: ['FreeWrite', 'Poetry', 'ShortStory', 'CharacterDevelopment', 'WorldBuilding'],
        pbCriteria: [
            { id: uuidv4(), label: 'Best story (link/title)', value: '', lastUpdated: new Date().toISOString() },
            { id: uuidv4(), label: 'Best rewrite', value: '', lastUpdated: new Date().toISOString() },
            { id: uuidv4(), label: 'Most powerful idea', value: '', lastUpdated: new Date().toISOString() }
        ]
    },
    {
        id: uuidv4(),
        name: 'EssayWriting',
        slots: 2,
        modes: ['Argumentative', 'Analytical', 'Research', 'Personal', 'Review'],
        pbCriteria: [
            { id: uuidv4(), label: 'Best essay (link/title)', value: '', lastUpdated: new Date().toISOString() },
            { id: uuidv4(), label: 'Most research depth', value: '', lastUpdated: new Date().toISOString() }
        ]
    },
    {
        id: uuidv4(),
        name: 'Coding',
        slots: 3,
        modes: ['Algorithm', 'Project', 'BugFix', 'CodeReview', 'Documentation', 'Refactor'],
        pbCriteria: [
            { id: uuidv4(), label: 'Coolest tool built', value: '', lastUpdated: new Date().toISOString() },
            { id: uuidv4(), label: 'Most useful automation', value: '', lastUpdated: new Date().toISOString() }
        ]
    },
    {
        id: uuidv4(),
        name: 'Math',
        slots: 1,
        modes: ['Algebra', 'Calculus', 'Statistics', 'Geometry', 'Proofs'],
        pbCriteria: [
            { id: uuidv4(), label: 'Hardest problem solved', value: '', lastUpdated: new Date().toISOString() }
        ]
    },
    {
        id: uuidv4(),
        name: 'Physics',
        slots: 1,
        modes: ['Mechanics', 'Thermodynamics', 'Quantum', 'Electromagnetism', 'Relativity'],
        pbCriteria: [
            { id: uuidv4(), label: 'Hardest concept understood', value: '', lastUpdated: new Date().toISOString() }
        ]
    }
];