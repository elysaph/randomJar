// src/components/Dashboard.tsx
import React from 'react';
import { AppState, Category } from '../types';

interface DashboardProps {
    state: AppState;
    onDraw: () => void;
    onResetCycle: () => void;
    selectedCategory: Category | null;
    selectedMode: string;
}

const Dashboard: React.FC<DashboardProps> = ({
    state,
    onDraw,
    onResetCycle,
    selectedCategory,
    selectedMode
}) => {
    const remainingSlots = state.activePool.length;
    const progress = ((15 - remainingSlots) / 15) * 100;

    return (
        <div className="panel interactive-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
                <div className="surface p-5 text-center">
                    <div className="text-sm text-slate-300">Cycle</div>
                    <div className="text-2xl font-bold">{state.cycleStats.cycleNumber}</div>
                </div>
                <div className="surface p-5 text-center">
                    <div className="text-sm text-slate-300">Level</div>
                    <div className="text-2xl font-bold">{state.levelInfo.level}</div>
                    <div className="text-xs text-slate-300">{state.levelInfo.title}</div>
                </div>
                <div className="surface p-5 text-center">
                    <div className="text-sm text-slate-300">Score</div>
                    <div className={`text-2xl font-bold ${state.cycleStats.score > 0 ? 'text-green-400' :
                        state.cycleStats.score < 0 ? 'text-rose-400' : 'text-amber-300'
                        }`}>
                        {state.cycleStats.score}
                    </div>
                </div>
                <div className="surface p-5 text-center">
                    <div className="text-sm text-slate-300">Streak</div>
                    <div className="text-2xl font-bold text-violet-300">{state.cycleStats.streak}</div>
                    <div className="text-xs text-slate-300">Best: {state.cycleStats.bestStreak}</div>
                </div>
            </div>

            <div className="mb-7">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-300">Cycle Progress</span>
                    <span className="text-sm text-slate-300">{remainingSlots} slots remaining</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                        className="bg-emerald-400 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-7">
                <div className="surface p-4 text-center">
                    <div className="text-sm text-slate-300">Wins</div>
                    <div className="text-xl font-bold text-emerald-300">{state.cycleStats.wins}</div>
                </div>
                <div className="surface p-4 text-center">
                    <div className="text-sm text-slate-300">Losses</div>
                    <div className="text-xl font-bold text-rose-400">{state.cycleStats.losses}</div>
                </div>
            </div>

            {selectedCategory && (
                <div className="surface p-5 mb-7 border border-violet-500/40">
                    <h3 className="font-bold mb-2">Current Draw</h3>
                    <p className="text-lg">{selectedCategory.name}</p>
                    <p className="text-sm text-slate-300">Mode: {selectedMode}</p>
                </div>
            )}

            <div className="space-y-3">
                <button
                    onClick={onDraw}
                    disabled={state.cycleCompleted || remainingSlots === 0}
                    className={`w-full btn py-3 ${state.cycleCompleted || remainingSlots === 0
                        ? 'btn-disabled'
                        : 'btn-primary'
                        }`}
                >
                    {state.cycleCompleted ? 'Cycle Complete' :
                        remainingSlots === 0 ? 'Cycle Ended' : 'Draw Slot'}
                </button>

                {state.cycleCompleted && (
                    <button
                        onClick={onResetCycle}
                        className="w-full btn btn-secondary py-3"
                    >
                        Start New Cycle
                    </button>
                )}
            </div>
        </div>
    );
};

export default Dashboard;