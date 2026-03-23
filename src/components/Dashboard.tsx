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
        <div className="panel p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="surface p-4 text-center">
                    <div className="text-sm text-slate-500">Cycle</div>
                    <div className="text-2xl font-bold">{state.cycleStats.cycleNumber}</div>
                </div>
                <div className="surface p-4 text-center">
                    <div className="text-sm text-slate-500">Level</div>
                    <div className="text-2xl font-bold">{state.levelInfo.level}</div>
                    <div className="text-xs text-slate-500">{state.levelInfo.title}</div>
                </div>
                <div className="surface p-4 text-center">
                    <div className="text-sm text-slate-500">Score</div>
                    <div className={`text-2xl font-bold ${state.cycleStats.score > 0 ? 'text-green-400' :
                        state.cycleStats.score < 0 ? 'text-red-500' : 'text-amber-600'
                        }`}>
                        {state.cycleStats.score}
                    </div>
                </div>
                <div className="surface p-4 text-center">
                    <div className="text-sm text-slate-500">Streak</div>
                    <div className="text-2xl font-bold text-orange-600">{state.cycleStats.streak}</div>
                    <div className="text-xs text-slate-500">Best: {state.cycleStats.bestStreak}</div>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-500">Cycle Progress</span>
                    <span className="text-sm text-slate-500">{remainingSlots} slots remaining</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                        className="bg-emerald-500 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="surface p-3 text-center">
                    <div className="text-sm text-slate-500">Wins</div>
                    <div className="text-xl font-bold text-emerald-600">{state.cycleStats.wins}</div>
                </div>
                <div className="surface p-3 text-center">
                    <div className="text-sm text-slate-500">Losses</div>
                    <div className="text-xl font-bold text-red-500">{state.cycleStats.losses}</div>
                </div>
            </div>

            {selectedCategory && (
                <div className="surface p-4 mb-6 border border-orange-200">
                    <h3 className="font-bold mb-2">Current Draw</h3>
                    <p className="text-lg">{selectedCategory.name}</p>
                    <p className="text-sm text-slate-500">Mode: {selectedMode}</p>
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