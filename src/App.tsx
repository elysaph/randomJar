// src/App.tsx
import React, { useState, useEffect } from 'react';
import { getInitialState, saveState, generateActivePool } from './utils/storage';
import { drawSlot, selectRandomMode, calculateLevelUpdate, getRewardForScore, getPunishmentForScore, updateStreak, updateBestStreak } from './utils/gameLogic';
import { AppState, Session, EFFORT_LEVELS, LEVEL_TITLES, Category } from './types';
import Dashboard from './components/Dashboard';
import CategoryManager from './components/CategoryManager';
import SessionLogger from './components/SessionLogger';
import PBManager from './components/PBManager';
import { v4 as uuidv4 } from 'uuid';

function App() {
    const [state, setState] = useState<AppState>(() => getInitialState());
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedMode, setSelectedMode] = useState<string>('');
    const [showPBManager, setShowPBManager] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    useEffect(() => {
        saveState(state);
    }, [state]);

    const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleDraw = () => {
        if (state.activePool.length === 0) {
            handleCycleEnd();
            return;
        }

        if (state.cycleCompleted) {
            showMessage('error', 'Cycle completed! Please reset to start a new cycle.');
            return;
        }

        try {
            const { selectedId, newPool } = drawSlot(state.activePool);
            const category = state.categories.find(c => c.id === selectedId);

            if (!category) {
                throw new Error('Category not found');
            }

            const mode = selectRandomMode(category);

            setSelectedCategory(category);
            setSelectedMode(mode);
            setState(prev => ({
                ...prev,
                activePool: newPool
            }));

            showMessage('success', `Drawn: ${category.name} - ${mode}`);
        } catch (error) {
            showMessage('error', 'Failed to draw slot');
        }
    };

    const handleLogSession = (effortLevel: 'comfortable' | 'normal' | 'rigorous', notes: string) => {
        if (!selectedCategory) {
            showMessage('error', 'No active session to log');
            return;
        }

        const isWin = EFFORT_LEVELS[effortLevel].isWin;
        const newStreak = updateStreak(state.cycleStats.streak, isWin);
        const newBestStreak = updateBestStreak(state.cycleStats.bestStreak, newStreak);

        const newWins = isWin ? state.cycleStats.wins + 1 : state.cycleStats.wins;
        const newLosses = !isWin ? state.cycleStats.losses + 1 : state.cycleStats.losses;
        const newScore = newWins - newLosses;

        const session: Session = {
            id: uuidv4(),
            day: state.currentDay,
            category: selectedCategory.name,
            categoryId: selectedCategory.id,
            mode: selectedMode,
            result: isWin ? 'WIN' : 'LOSS',
            effortLevel,
            notes,
            timestamp: new Date().toISOString()
        };

        setState(prev => ({
            ...prev,
            sessions: [...prev.sessions, session],
            currentDay: prev.currentDay + 1,
            cycleStats: {
                ...prev.cycleStats,
                wins: newWins,
                losses: newLosses,
                streak: newStreak,
                bestStreak: newBestStreak,
                score: newScore
            }
        }));

        setSelectedCategory(null);
        setSelectedMode('');

        if (state.activePool.length === 1) {
            handleCycleEnd();
        } else {
            showMessage('success', `Session logged: ${isWin ? 'WIN' : 'LOSS'}! Streak: ${newStreak}`);
        }
    };

    const handleCycleEnd = () => {
        const finalScore = state.cycleStats.score;
        const reward = getRewardForScore(finalScore);
        const punishment = getPunishmentForScore(finalScore);

        // Calculate PB improvements (simplified for now)
        const hasPBImprovement = false; // This would be checked from PB updates
        const highScoreAchieved = finalScore > 10;
        const discomfortModeWins = state.sessions.filter(s => s.effortLevel === 'rigorous' && s.result === 'WIN').length;
        const totalWins = state.cycleStats.wins;

        const newLevelValue = calculateLevelUpdate(
            state.levelInfo.level,
            finalScore,
            hasPBImprovement,
            highScoreAchieved,
            discomfortModeWins,
            totalWins
        );

        const newLevelTitle = LEVEL_TITLES[newLevelValue];

        setState(prev => ({
            ...prev,
            cycleCompleted: true,
            levelInfo: {
                level: newLevelValue,
                title: newLevelTitle
            }
        }));

        let messageText = `Cycle ${state.cycleStats.cycleNumber} completed! Score: ${finalScore}`;
        if (reward) messageText += `\n🎉 Reward: ${reward}`;
        if (punishment) messageText += `\n⚠️ Punishment: ${punishment}`;

        showMessage('info', messageText);
    };

    const handleResetCycle = () => {
        const newPool = generateActivePool(state.categories);
        setState(prev => ({
            ...prev,
            activePool: newPool,
            currentDay: 1,
            sessions: [],
            cycleStats: {
                ...prev.cycleStats,
                cycleNumber: prev.cycleStats.cycleNumber + 1,
                wins: 0,
                losses: 0,
                streak: 0,
                score: 0
            },
            cycleCompleted: false
        }));
        setSelectedCategory(null);
        setSelectedMode('');
        showMessage('success', 'New cycle started!');
    };

    const handleUpdatePB = (categoryId: string, pbEntries: any[]) => {
        setState(prev => ({
            ...prev,
            categories: prev.categories.map(cat =>
                cat.id === categoryId
                    ? { ...cat, pbCriteria: pbEntries }
                    : cat
            )
        }));
        showMessage('success', 'Personal bests updated!');
    };

    const handleUpdateCategories = (newCategories: Category[]) => {
        // Ensure total slots = 15
        const totalSlots = newCategories.reduce((sum, cat) => sum + cat.slots, 0);
        if (totalSlots !== 15) {
            showMessage('error', `Total slots must be 15. Current: ${totalSlots}`);
            return;
        }

        setState(prev => ({
            ...prev,
            categories: newCategories,
            activePool: generateActivePool(newCategories)
        }));
        showMessage('success', 'Categories updated!');
    };

    return (
        <div className="app-shell">
            {message && (
                <div className={`toast ${message.type === 'success' ? 'toast-success' :
                    message.type === 'error' ? 'toast-error' : 'toast-info'
                    }`}>
                    {message.text.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                    ))}
                </div>
            )}

            <div className="app-container">
                <header className="text-center mb-8">
                    <h1 className="hero-title">Goal-Weighted Lottery</h1>
                    <p className="hero-subtitle">Let fate guide your growth</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Dashboard
                            state={state}
                            onDraw={handleDraw}
                            onResetCycle={handleResetCycle}
                            selectedCategory={selectedCategory}
                            selectedMode={selectedMode}
                        />

                        {selectedCategory && (
                            <SessionLogger
                                category={selectedCategory}
                                mode={selectedMode}
                                onLogSession={handleLogSession}
                                onCancel={() => {
                                    setSelectedCategory(null);
                                    setSelectedMode('');
                                }}
                            />
                        )}
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={() => setShowCategoryManager(!showCategoryManager)}
                            className="w-full btn btn-secondary py-2 px-4"
                        >
                            {showCategoryManager ? 'Hide' : 'Show'} Category Manager
                        </button>

                        <button
                            onClick={() => setShowPBManager(!showPBManager)}
                            className="w-full btn btn-primary py-2 px-4"
                        >
                            {showPBManager ? 'Hide' : 'Show'} Personal Bests
                        </button>

                        {showCategoryManager && (
                            <CategoryManager
                                categories={state.categories}
                                onUpdateCategories={handleUpdateCategories}
                            />
                        )}

                        {showPBManager && (
                            <PBManager
                                categories={state.categories}
                                onUpdatePB={handleUpdatePB}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;