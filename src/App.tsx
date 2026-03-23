// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { getInitialState, saveState, generateActivePool } from './utils/storage';
import { drawSlot, selectRandomMode, calculateLevelUpdate, updateStreak, updateBestStreak } from './utils/gameLogic';
import { AppState, Session, EFFORT_LEVELS, LEVEL_TITLES, Category } from './types';
import Dashboard from './components/Dashboard';
import CategoryManager from './components/CategoryManager';
import SessionLogger from './components/SessionLogger';
import PBManager from './components/PBManager';
import AnalyticsPanel from './components/AnalyticsPanel';
import { formatDisplayText } from './utils/formatting';
import { v4 as uuidv4 } from 'uuid';

interface CustomQuest {
    id: string;
    categoryId: string;
    questType: 'mode' | 'pb';
    metricId: string;
    target: number;
    progress: number;
    label: string;
    done: boolean;
}

interface CycleOutcome {
    cycleNumber: number;
    score: number;
    reward: string | null;
    punishment: string | null;
}

interface RewardRule {
    id: string;
    score: number;
    label: string;
}

interface SystemQuest {
    id: string;
    label: string;
    done: boolean;
}

const DEFAULT_REWARD_RULES: RewardRule[] = [
    { id: 'small', score: 5, label: 'Small reward' },
    { id: 'medium', score: 10, label: 'Medium reward' },
    { id: 'large', score: 15, label: 'Large reward' }
];

const DEFAULT_PUNISHMENTS = [
    'Friction: Disable distracting apps for 2 hours',
    'Effort: Complete one extra mandatory session today',
    'Financial: Monetary loss ($5 to penalty jar)'
];

function App() {
    const [state, setState] = useState<AppState>(() => getInitialState());
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedMode, setSelectedMode] = useState<string>('');
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showPBManager, setShowPBManager] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [ambientAudio, setAmbientAudio] = useState(false);
    const [drawPulse, setDrawPulse] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [cyclePBImproved, setCyclePBImproved] = useState(false);
    const [cycleOutcome, setCycleOutcome] = useState<CycleOutcome | null>(null);
    const [customQuests, setCustomQuests] = useState<CustomQuest[]>([]);
    const [hiddenSystemQuestIds, setHiddenSystemQuestIds] = useState<string[]>([]);
    const [showQuestBuilder, setShowQuestBuilder] = useState(false);
    const [questCategoryId, setQuestCategoryId] = useState('');
    const [questTrackingType, setQuestTrackingType] = useState<'mode' | 'pb' | ''>('');
    const [questMetricId, setQuestMetricId] = useState('');
    const [questTarget, setQuestTarget] = useState('');
    const [rewardRules, setRewardRules] = useState<RewardRule[]>(DEFAULT_REWARD_RULES);
    const [newRewardScore, setNewRewardScore] = useState('');
    const [newRewardLabel, setNewRewardLabel] = useState('');
    const [punishments, setPunishments] = useState<string[]>(DEFAULT_PUNISHMENTS);
    const [newPunishment, setNewPunishment] = useState('');
    const loggerTopRef = useRef<HTMLDivElement | null>(null);

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

    useEffect(() => {
        if (selectedCategory && loggerTopRef.current) {
            loggerTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedCategory]);

    const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleDraw = () => {
        const totalSlots = state.categories.reduce((sum, cat) => sum + cat.slots, 0);
        if (totalSlots !== 15) {
            showMessage('error', `Draw is locked until total slots is 15 (current: ${totalSlots}).`);
            return;
        }

        if (state.activePool.length === 0) {
            handleCycleEnd();
            return;
        }

        if (state.cycleCompleted) {
            showMessage('error', 'Cycle completed! Please reset to start a new cycle.');
            return;
        }

        if (selectedCategory) {
            showMessage('info', 'Finish logging the active session before drawing again.');
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

            setDrawPulse(true);
            window.setTimeout(() => setDrawPulse(false), 420);

            showMessage('success', `Drawn: ${formatDisplayText(category.name)} - ${formatDisplayText(mode)}`);
        } catch (error) {
            showMessage('error', 'Failed to draw slot');
        }
    };

    const handleLogSession = (
        effortLevel: 'comfortable' | 'normal' | 'rigorous',
        notes: string,
        modeValueRaw: string,
        selectedPBId: string,
        pbValueRaw: string
    ) => {
        if (!selectedCategory) {
            showMessage('error', 'No active session to log');
            return;
        }

        const isWin = EFFORT_LEVELS[effortLevel].isWin;
        const pointsDelta = EFFORT_LEVELS[effortLevel].points;
        const newStreak = updateStreak(state.cycleStats.streak, isWin);
        const newBestStreak = updateBestStreak(state.cycleStats.bestStreak, newStreak);

        const newWins = isWin ? state.cycleStats.wins + 1 : state.cycleStats.wins;
        const newLosses = !isWin ? state.cycleStats.losses + 1 : state.cycleStats.losses;
        const newScore = state.cycleStats.score + pointsDelta;

        const parsedModeValue = Number(modeValueRaw);
        const modeValue = Number.isFinite(parsedModeValue) ? parsedModeValue : undefined;

        let pbImprovedThisSession = false;
        let pbWasAttempted = false;
        let nextCategories = state.categories;
        let parsedPBValue: number | undefined;

        if (selectedPBId && pbValueRaw.trim()) {
            pbWasAttempted = true;
            const numericPB = Number(pbValueRaw);
            if (Number.isFinite(numericPB)) {
                parsedPBValue = numericPB;
                nextCategories = state.categories.map((cat) => {
                    if (cat.id !== selectedCategory.id) {
                        return cat;
                    }

                    return {
                        ...cat,
                        pbCriteria: cat.pbCriteria.map((criterion) => {
                            if (criterion.id !== selectedPBId) {
                                return criterion;
                            }

                            const currentValue = Number(criterion.value);
                            const isImprovement = !Number.isFinite(currentValue) || numericPB > currentValue;
                            if (isImprovement) {
                                pbImprovedThisSession = true;
                                return {
                                    ...criterion,
                                    value: String(numericPB),
                                    lastUpdated: new Date().toISOString()
                                };
                            }

                            return criterion;
                        })
                    };
                });
            }
        }

        const session: Session = {
            id: uuidv4(),
            day: state.currentDay,
            category: formatDisplayText(selectedCategory.name),
            categoryId: selectedCategory.id,
            mode: formatDisplayText(selectedMode),
            modeValue,
            result: isWin ? 'WIN' : 'LOSS',
            effortLevel,
            notes,
            timestamp: new Date().toISOString()
        };

        const latestMode = selectedMode;
        const latestCategoryId = selectedCategory.id;
        const shouldEndCycle = state.activePool.length === 1;

        setCustomQuests((prev) =>
            prev.map((quest) => {
                if (quest.done || quest.categoryId !== latestCategoryId) {
                    return quest;
                }

                if (quest.questType === 'mode') {
                    if (quest.metricId !== latestMode) {
                        return quest;
                    }

                    const nextProgress = quest.progress + 1;
                    return {
                        ...quest,
                        progress: nextProgress,
                        done: nextProgress >= quest.target
                    };
                }

                if (!selectedPBId || quest.metricId !== selectedPBId || !Number.isFinite(parsedPBValue)) {
                    return quest;
                }

                const nextProgress = Math.max(quest.progress, parsedPBValue as number);
                return {
                    ...quest,
                    progress: nextProgress,
                    done: nextProgress >= quest.target
                };
            })
        );

        setState(prev => ({
            ...prev,
            categories: nextCategories,
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

        if (pbImprovedThisSession) {
            setCyclePBImproved(true);
        }

        setSelectedCategory(null);
        setSelectedMode('');

        if (shouldEndCycle) {
            handleCycleEnd(newScore, cyclePBImproved || pbImprovedThisSession, [...state.sessions, session], newWins);
        } else {
            const sign = pointsDelta > 0 ? '+' : '';
            let detail = '';
            if (pbImprovedThisSession) {
                detail = ' PB improved!';
            } else if (pbWasAttempted && selectedPBId) {
                detail = ' PB unchanged.';
            }
            showMessage('success', `Session logged: ${isWin ? 'WIN' : 'LOSS'} (${sign}${pointsDelta}). Streak: ${newStreak}.${detail}`);
        }
    };

    const handleCycleEnd = (
        scoreOverride?: number,
        pbImprovementOverride?: boolean,
        sessionsOverride?: Session[],
        winsOverride?: number
    ) => {
        const finalScore = scoreOverride ?? state.cycleStats.score;
        const reward = rewardRules
            .filter((rule) => finalScore >= rule.score)
            .sort((a, b) => b.score - a.score)[0]?.label ?? null;
        const punishment = finalScore < 0 && punishments.length > 0
            ? punishments[Math.floor(Math.random() * punishments.length)]
            : null;

        const hasPBImprovement = pbImprovementOverride ?? cyclePBImproved;
        const highScoreAchieved = finalScore > 10;
        const sessionsForCalc = sessionsOverride ?? state.sessions;
        const discomfortModeWins = sessionsForCalc.filter(s => s.effortLevel === 'rigorous' && s.result === 'WIN').length;
        const totalWins = winsOverride ?? state.cycleStats.wins;

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
        setCycleOutcome({
            cycleNumber: state.cycleStats.cycleNumber,
            score: finalScore,
            reward,
            punishment
        });

        showMessage('info', `Cycle ${state.cycleStats.cycleNumber} completed. Check your reward or consequence.`);
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
        setCyclePBImproved(false);
        setCycleOutcome(null);
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

    const systemQuests = [
        { id: 'draw-next', label: 'Draw your next challenge', done: Boolean(selectedCategory) },
        { id: 'rigorous-win', label: 'Log one rigorous win', done: state.sessions.some(s => s.effortLevel === 'rigorous' && s.result === 'WIN') },
        { id: 'finish-slots', label: 'Finish all slots in current cycle', done: state.activePool.length === 0 || state.cycleCompleted },
        { id: 'slots-15', label: 'Keep category slots exactly at 15', done: state.categories.reduce((sum, cat) => sum + cat.slots, 0) === 15 }
    ].filter((quest) => !hiddenSystemQuestIds.includes(quest.id)) as SystemQuest[];

    const activeQuestCategory = state.categories.find((cat) => cat.id === questCategoryId) || null;

    const handleAddCustomQuest = () => {
        const category = state.categories.find((cat) => cat.id === questCategoryId);
        if (!category) {
            showMessage('error', 'Choose a category before adding a quest.');
            return;
        }

        if (!questTrackingType) {
            showMessage('error', 'Choose whether quest tracks by mode or by PB.');
            return;
        }

        if (!questMetricId) {
            showMessage('error', 'Choose a mode or PB metric for this quest.');
            return;
        }

        const target = Number(questTarget);
        if (!Number.isFinite(target) || target <= 0) {
            showMessage('error', 'Quest target must be a positive number.');
            return;
        }

        const metricLabel = questTrackingType === 'mode'
            ? formatDisplayText(questMetricId)
            : (category.pbCriteria.find((pb) => pb.id === questMetricId)?.label || 'PB metric');

        const label = questTrackingType === 'mode'
            ? `${formatDisplayText(category.name)} • ${metricLabel} sessions >= ${target}`
            : `${formatDisplayText(category.name)} • ${metricLabel} >= ${target}`;

        setCustomQuests((prev) => [
            ...prev,
            {
                id: uuidv4(),
                categoryId: category.id,
                questType: questTrackingType,
                metricId: questMetricId,
                target,
                progress: 0,
                label,
                done: false
            }
        ]);
        showMessage('success', 'Quest added.');
        setShowQuestBuilder(false);
        setQuestTrackingType('');
        setQuestMetricId('');
        setQuestTarget('');
    };

    const handleDeleteQuest = (questId: string) => {
        if (!window.confirm('Delete this quest?')) {
            return;
        }
        setCustomQuests((prev) => prev.filter((quest) => quest.id !== questId));
        showMessage('success', 'Quest deleted.');
    };

    const handleDeleteAllCustomQuests = () => {
        if (customQuests.length === 0) {
            showMessage('info', 'There are no custom quests to delete.');
            return;
        }

        if (!window.confirm('Delete all custom quests?')) {
            return;
        }

        setCustomQuests([]);
        showMessage('success', 'All custom quests deleted.');
    };

    const handleDeleteSystemQuest = (questId: string) => {
        setHiddenSystemQuestIds((prev) => [...prev, questId]);
        showMessage('success', 'Default quest removed from board.');
    };

    const handleAddRewardRule = () => {
        const score = Number(newRewardScore);
        const label = newRewardLabel.trim();

        if (!Number.isFinite(score) || score < 0) {
            showMessage('error', 'Reward score must be a valid number 0 or greater.');
            return;
        }

        if (!label) {
            showMessage('error', 'Reward label is required.');
            return;
        }

        setRewardRules((prev) => [
            ...prev,
            { id: uuidv4(), score, label }
        ]);
        setNewRewardScore('');
        setNewRewardLabel('');
        showMessage('success', 'Reward range added.');
    };

    const handleDeleteRewardRule = (id: string) => {
        setRewardRules((prev) => prev.filter((rule) => rule.id !== id));
    };

    const handleAddPunishment = () => {
        const text = newPunishment.trim();
        if (!text) {
            showMessage('error', 'Punishment text is required.');
            return;
        }

        setPunishments((prev) => [...prev, text]);
        setNewPunishment('');
        showMessage('success', 'Punishment added.');
    };

    const handleDeletePunishment = (index: number) => {
        setPunishments((prev) => prev.filter((_, idx) => idx !== index));
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
        const totalSlots = newCategories.reduce((sum, cat) => sum + cat.slots, 0);
        setState(prev => ({
            ...prev,
            categories: newCategories,
            activePool: generateActivePool(newCategories)
        }));
        if (totalSlots !== 15) {
            showMessage('info', `Categories updated. Total slots is ${totalSlots}; set it to 15 to unlock draw.`);
        } else {
            showMessage('success', 'Categories updated! Total slots is now 15.');
        }
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

            {cycleOutcome && (
                <div className="fixed inset-0 z-40 bg-slate-950/70 flex items-center justify-center px-4">
                    <div className="panel interactive-card w-full max-w-xl">
                        <h2 className="text-2xl font-bold mb-2">Cycle Complete</h2>
                        <p className="text-slate-300 mb-4">
                            Cycle {cycleOutcome.cycleNumber} ended with score <strong>{cycleOutcome.score}</strong>.
                        </p>
                        {cycleOutcome.reward && (
                            <div className="surface p-3 mb-3 border border-emerald-400/30">
                                <div className="text-xs uppercase tracking-wide text-emerald-300 mb-1">Reward</div>
                                <div className="text-slate-100 font-semibold">{cycleOutcome.reward}</div>
                            </div>
                        )}
                        {cycleOutcome.punishment && (
                            <div className="surface p-3 mb-4 border border-rose-400/30">
                                <div className="text-xs uppercase tracking-wide text-rose-300 mb-1">Punishment</div>
                                <div className="text-slate-100 font-semibold">{cycleOutcome.punishment}</div>
                            </div>
                        )}
                        {!cycleOutcome.reward && !cycleOutcome.punishment && (
                            <p className="text-slate-300 mb-4">Neutral finish. Keep brewing consistency.</p>
                        )}
                        <div className="flex gap-2">
                            <button className="btn btn-soft flex-1" onClick={() => setCycleOutcome(null)}>Close</button>
                            <button className="btn btn-secondary flex-1" onClick={handleResetCycle}>Start Next Cycle</button>
                        </div>
                    </div>
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
                        <div ref={loggerTopRef} />
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

                        <Dashboard
                            state={state}
                            onDraw={handleDraw}
                            onResetCycle={handleResetCycle}
                            selectedCategory={selectedCategory}
                            selectedMode={formatDisplayText(selectedMode)}
                            isDrawLocked={Boolean(selectedCategory)}
                            drawPulse={drawPulse}
                        />

                        <div className="rune-divider"><span>Runic Logging Circle</span></div>

                        {showAnalytics && <AnalyticsPanel state={state} />}
                    </div>

                    <div className="side-stack">
                        <div className="panel interactive-card">
                            <h3 className="text-lg font-semibold mb-3">Quest Board</h3>
                            <div className="mb-3 flex justify-end">
                                <button
                                    onClick={handleDeleteAllCustomQuests}
                                    className="btn btn-soft text-xs px-2 py-1"
                                >
                                    Delete all custom quests
                                </button>
                            </div>
                            <div className="space-y-2">
                                {systemQuests.map((quest) => (
                                    <div key={quest.label} className="surface p-3 flex justify-between items-center">
                                        <div>
                                            <span className="text-sm text-slate-200">{quest.label}</span>
                                            <div className={`text-xs font-bold ${quest.done ? 'text-emerald-300' : 'text-amber-300'}`}>
                                                {quest.done ? 'Done' : 'Incomplete'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSystemQuest(quest.id)}
                                            className="btn quest-minus"
                                            aria-label="Delete default quest"
                                        >
                                            -
                                        </button>
                                    </div>
                                ))}
                                {customQuests.map((quest) => (
                                    <div key={quest.id} className="surface p-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <div className="text-sm text-slate-200">{quest.label}</div>
                                                <div className={`text-xs font-bold ${quest.done ? 'text-emerald-300' : 'text-amber-300'}`}>
                                                    {quest.done ? 'Done' : 'Incomplete'}
                                                </div>
                                                <div className="text-xs text-slate-300 mt-1">
                                                    Progress: {quest.progress} / {quest.target}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteQuest(quest.id)}
                                                className="btn quest-minus"
                                                aria-label="Delete custom quest"
                                            >
                                                -
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 border-t border-slate-700/40 pt-3 space-y-2">
                                <button
                                    onClick={() => setShowQuestBuilder((prev) => !prev)}
                                    className="btn btn-secondary w-full text-sm py-2"
                                >
                                    {showQuestBuilder ? 'Close Add Quest' : 'Open Add Quest'}
                                </button>

                                {showQuestBuilder && (
                                    <div className="space-y-2">
                                        <select
                                            value={questCategoryId}
                                            onChange={(e) => {
                                                const nextCategory = e.target.value;
                                                setQuestCategoryId(nextCategory);
                                                setQuestTrackingType('');
                                                setQuestMetricId('');
                                                setQuestTarget('');
                                            }}
                                            className="field text-sm"
                                        >
                                            <option value="">1) Select category</option>
                                            {state.categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{formatDisplayText(cat.name)}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={questTrackingType}
                                            onChange={(e) => {
                                                const nextType = e.target.value as 'mode' | 'pb' | '';
                                                setQuestTrackingType(nextType);
                                                setQuestMetricId('');
                                            }}
                                            className="field text-sm"
                                            disabled={!activeQuestCategory}
                                        >
                                            <option value="">2) By mode or By PB</option>
                                            <option value="mode">By mode</option>
                                            <option value="pb">By PB</option>
                                        </select>

                                        <select
                                            value={questMetricId}
                                            onChange={(e) => setQuestMetricId(e.target.value)}
                                            className="field text-sm"
                                            disabled={!activeQuestCategory || !questTrackingType}
                                        >
                                            <option value="">
                                                {questTrackingType === 'pb'
                                                    ? '3) Select PB metric'
                                                    : '3) Select mode'}
                                            </option>
                                            {questTrackingType === 'mode' && activeQuestCategory?.modes.map((modeName) => (
                                                <option key={modeName} value={modeName}>{formatDisplayText(modeName)}</option>
                                            ))}
                                            {questTrackingType === 'pb' && activeQuestCategory?.pbCriteria.map((pb) => (
                                                <option key={pb.id} value={pb.id}>{pb.label}</option>
                                            ))}
                                        </select>

                                        <input
                                            type="number"
                                            value={questTarget}
                                            onChange={(e) => setQuestTarget(e.target.value)}
                                            className="field text-sm"
                                            disabled={!questMetricId}
                                            placeholder={questTrackingType === 'pb'
                                                ? '4) PB value target'
                                                : '4) Session count target'}
                                        />

                                        <button onClick={handleAddCustomQuest} className="btn btn-secondary w-full text-sm py-2">
                                            Add quest
                                        </button>
                                    </div>
                                )}
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
                                <div className="advanced-stack">
                                    <div className="surface advanced-item">
                                        <div>
                                            <div className="advanced-label">Export Data</div>
                                            <div className="advanced-help">Download your current save as JSON.</div>
                                        </div>
                                        <button onClick={handleExportData} className="btn btn-soft">Export</button>
                                    </div>

                                    <div className="surface advanced-item">
                                        <div>
                                            <div className="advanced-label">Import Data</div>
                                            <div className="advanced-help">Load a previous JSON save file.</div>
                                        </div>
                                        <label className="btn btn-soft cursor-pointer text-center">
                                            Import
                                            <input type="file" accept="application/json" className="hidden" onChange={handleImportData} />
                                        </label>
                                    </div>

                                    <div className="surface advanced-item">
                                        <div>
                                            <div className="advanced-label">Witchy Ambience</div>
                                            <div className="advanced-help">Toggle background audio for ritual focus.</div>
                                        </div>
                                        <button
                                            onClick={() => setAmbientAudio((prev) => !prev)}
                                            className={`btn ${ambientAudio ? 'btn-secondary' : 'btn-soft'}`}
                                        >
                                            {ambientAudio ? 'On' : 'Off'}
                                        </button>
                                    </div>

                                    <div className="surface advanced-item advanced-column">
                                        <div>
                                            <div className="advanced-label">Reward Ranges</div>
                                            <div className="advanced-help">Add score thresholds like small, normal, or large reward.</div>
                                        </div>
                                        <div className="advanced-inline-grid">
                                            <input
                                                type="number"
                                                value={newRewardScore}
                                                onChange={(e) => setNewRewardScore(e.target.value)}
                                                className="field text-sm"
                                                placeholder="Min points"
                                            />
                                            <input
                                                type="text"
                                                value={newRewardLabel}
                                                onChange={(e) => setNewRewardLabel(e.target.value)}
                                                className="field text-sm"
                                                placeholder="Reward label"
                                            />
                                            <button onClick={handleAddRewardRule} className="btn btn-soft">Add</button>
                                        </div>
                                        <div className="space-y-1 w-full">
                                            {[...rewardRules].sort((a, b) => a.score - b.score).map((rule) => (
                                                <div key={rule.id} className="advanced-list-row">
                                                    <span className="text-sm text-slate-200">{rule.score}+ : {rule.label}</span>
                                                    <button
                                                        onClick={() => handleDeleteRewardRule(rule.id)}
                                                        className="btn quest-minus"
                                                        aria-label="Delete reward range"
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="surface advanced-item advanced-column">
                                        <div>
                                            <div className="advanced-label">Punishments</div>
                                            <div className="advanced-help">Add punishments used when cycle score is below zero.</div>
                                        </div>
                                        <div className="advanced-inline-grid punish-grid">
                                            <input
                                                type="text"
                                                value={newPunishment}
                                                onChange={(e) => setNewPunishment(e.target.value)}
                                                className="field text-sm"
                                                placeholder="Punishment text"
                                            />
                                            <button onClick={handleAddPunishment} className="btn btn-soft">Add</button>
                                        </div>
                                        <div className="space-y-1 w-full">
                                            {punishments.map((item, idx) => (
                                                <div key={`${item}-${idx}`} className="advanced-list-row">
                                                    <span className="text-sm text-slate-200">{item}</span>
                                                    <button
                                                        onClick={() => handleDeletePunishment(idx)}
                                                        className="btn quest-minus"
                                                        aria-label="Delete punishment"
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
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