// src/App.tsx
import React, { useState, useEffect } from 'react';
import { getInitialState, saveState, generateActivePool } from './utils/storage';
import { drawSlot, selectRandomMode, calculateLevelUpdate, getRewardForScore, getPunishmentForScore, updateStreak, updateBestStreak } from './utils/gameLogic';
import { AppState, Session, EFFORT_LEVELS, LEVEL_TITLES, Category } from './types';
import Dashboard from './components/Dashboard';
import CategoryManager from './components/CategoryManager';
import SessionLogger from './components/SessionLogger';
import PBManager from './components/PBManager';
import AnalyticsPanel from './components/AnalyticsPanel';
import { formatDisplayText } from './utils/formatting';
import { v4 as uuidv4 } from 'uuid';

function App() {
    const [state, setState] = useState<AppState>(() => getInitialState());
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedMode, setSelectedMode] = useState<string>('');
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showPBManager, setShowPBManager] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [ambientAudio, setAmbientAudio] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    useEffect(() => {
        saveState(state);
    }, [state]);

    useEffect(() => {
        const updateCursor = (event: MouseEvent) => {
            document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`);
            document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`);
        };

        window.addEventListener('mousemove', updateCursor);
        return () => window.removeEventListener('mousemove', updateCursor);
    }, []);

    useEffect(() => {
        let audioContext: AudioContext | null = null;
        let cleanup: (() => void) | null = null;

        const startAmbient = async () => {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const mainGain = audioContext.createGain();
            mainGain.gain.value = 0.015;
            mainGain.connect(audioContext.destination);

            const drone = audioContext.createOscillator();
            drone.type = 'triangle';
            drone.frequency.value = 174;

            const shimmer = audioContext.createOscillator();
            shimmer.type = 'sine';
            shimmer.frequency.value = 261.63;

            const lfo = audioContext.createOscillator();
            const lfoGain = audioContext.createGain();
            lfo.frequency.value = 0.11;
            lfoGain.gain.value = 12;

            const filter = audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 900;

            drone.connect(filter);
            shimmer.connect(filter);
            filter.connect(mainGain);
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);

            drone.start();
            shimmer.start();
            lfo.start();

            cleanup = () => {
                drone.stop();
                shimmer.stop();
                lfo.stop();
                audioContext?.close();
            };
        };

        if (ambientAudio) {
            startAmbient().catch(() => setAmbientAudio(false));
        }

        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [ambientAudio]);

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

            showMessage('success', `Drawn: ${formatDisplayText(category.name)} - ${formatDisplayText(mode)}`);
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
            category: formatDisplayText(selectedCategory.name),
            categoryId: selectedCategory.id,
            mode: formatDisplayText(selectedMode),
            result: isWin ? 'WIN' : 'LOSS',
            effortLevel,
            notes,
            timestamp: new Date().toISOString()
        };

        setState(prev => ({
            ...prev,
            sessions: [...prev.sessions, session],
            sessionHistory: [...prev.sessionHistory, session],
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
        if (!window.confirm('Start a new cycle? Your current cycle sessions will reset, but lifetime history stays.')) {
            return;
        }

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

    const handleExportData = () => {
        const fileName = `randomJar-save-${new Date().toISOString().slice(0, 10)}.json`;
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        showMessage('success', 'Save exported successfully.');
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result));
                if (!parsed || !Array.isArray(parsed.categories) || !Array.isArray(parsed.sessions)) {
                    throw new Error('Invalid save format');
                }

                if (!window.confirm('Importing will overwrite your current local save. Continue?')) {
                    return;
                }

                const importedState: AppState = {
                    ...getInitialState(),
                    ...parsed,
                    sessionHistory: Array.isArray(parsed.sessionHistory)
                        ? parsed.sessionHistory
                        : (Array.isArray(parsed.sessions) ? parsed.sessions : []),
                    lastUpdated: new Date().toISOString()
                };
                setState(importedState);
                showMessage('success', 'Save imported successfully.');
            } catch (error) {
                showMessage('error', 'Failed to import save file.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const quests = [
        { label: 'Draw your next challenge', done: Boolean(selectedCategory) },
        { label: 'Log one rigorous win', done: state.sessions.some(s => s.effortLevel === 'rigorous' && s.result === 'WIN') },
        { label: 'Finish all slots in current cycle', done: state.activePool.length === 0 || state.cycleCompleted },
        { label: 'Keep category slots exactly at 15', done: state.categories.reduce((sum, cat) => sum + cat.slots, 0) === 15 }
    ];

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
            <div className="cursor-glow" />
            <div className="potion-particles" aria-hidden="true">
                {[8, 16, 24, 33, 41, 50, 58, 67, 75, 84, 92].map((left, idx) => (
                    <span
                        key={left}
                        className={`potion-particle ${idx % 2 === 0 ? 'violet' : ''}`}
                        style={{
                            left: `${left}%`,
                            animationDuration: `${8 + (idx % 5) * 1.5}s`,
                            animationDelay: `${-idx * 1.15}s`
                        }}
                    />
                ))}
            </div>
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
                <header className="hero-wrap">
                    <div className="hero-card interactive-card">
                        <h1 className="hero-title">randomJar</h1>
                        <p className="hero-subtitle">Brew discipline, draw your fate.</p>
                    </div>
                </header>

                <div className="layout-grid">
                    <div className="main-stack">
                        <Dashboard
                            state={state}
                            onDraw={handleDraw}
                            onResetCycle={handleResetCycle}
                            selectedCategory={selectedCategory}
                            selectedMode={formatDisplayText(selectedMode)}
                        />

                        <div className="rune-divider"><span>Runic Logging Circle</span></div>

                        {selectedCategory && (
                            <SessionLogger
                                category={selectedCategory}
                                mode={formatDisplayText(selectedMode)}
                                onLogSession={handleLogSession}
                                onCancel={() => {
                                    setSelectedCategory(null);
                                    setSelectedMode('');
                                }}
                            />
                        )}

                        {showAnalytics && <AnalyticsPanel state={state} />}
                    </div>

                    <div className="side-stack">
                        <div className="panel interactive-card">
                            <h3 className="text-lg font-semibold mb-3">Quest Board</h3>
                            <div className="space-y-2">
                                {quests.map((quest) => (
                                    <div key={quest.label} className="surface p-3 flex justify-between items-center">
                                        <span className="text-sm text-slate-200">{quest.label}</span>
                                        <span className={`text-xs font-bold ${quest.done ? 'text-emerald-300' : 'text-amber-300'}`}>
                                            {quest.done ? 'Done' : 'Pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setShowAnalytics(!showAnalytics)}
                            className="btn btn-soft rail-button interactive-card"
                        >
                            <span>{showAnalytics ? 'Hide' : 'Show'} Analytics</span>
                            <span className="hint">History</span>
                        </button>

                        <button
                            onClick={() => setShowPBManager(!showPBManager)}
                            className="btn btn-primary rail-button interactive-card"
                        >
                            <span>{showPBManager ? 'Hide' : 'Show'} Personal Bests</span>
                            <span className="hint">Track PB</span>
                        </button>

                        <button
                            onClick={() => setShowCategoryManager(!showCategoryManager)}
                            className="btn btn-secondary rail-button interactive-card"
                        >
                            <span>{showCategoryManager ? 'Hide' : 'Show'} Category Manager</span>
                            <span className="hint">Edit Pool</span>
                        </button>

                        <div className="rune-divider"><span>Archive Vault</span></div>

                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="btn btn-soft rail-button interactive-card"
                        >
                            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Setup</span>
                            <span className="hint">Config</span>
                        </button>

                        {showAdvanced && (
                            <div className="panel interactive-card">
                                <h3 className="text-lg font-semibold mb-3">Control Shelf</h3>
                                <div className="space-y-2">
                                    <button onClick={handleExportData} className="btn btn-soft w-full">Export save data</button>
                                    <label className="btn btn-soft w-full text-center cursor-pointer">
                                        Import save data
                                        <input type="file" accept="application/json" className="hidden" onChange={handleImportData} />
                                    </label>
                                    <button
                                        onClick={() => setAmbientAudio((prev) => !prev)}
                                        className={`btn w-full ${ambientAudio ? 'btn-secondary' : 'btn-soft'}`}
                                    >
                                        {ambientAudio ? 'Disable' : 'Enable'} Witchy ambience
                                    </button>
                                </div>
                            </div>
                        )}

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