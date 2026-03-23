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
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-400">Cycle</div>
                    <div className="text-2xl font-bold">{state.cycleStats.cycleNumber}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-400">Level</div>
                    <div className="text-2xl font-bold">{state.levelInfo.level}</div>
                    <div className="text-xs text-gray-400">{state.levelInfo.title}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-400">Score</div>
                    <div className={`text-2xl font-bold ${state.cycleStats.score > 0 ? 'text-green-400' :
                        state.cycleStats.score < 0 ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                        {state.cycleStats.score}
                    </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-400">Streak</div>
                    <div className="text-2xl font-bold text-orange-400">{state.cycleStats.streak}</div>
                    <div className="text-xs text-gray-400">Best: {state.cycleStats.bestStreak}</div>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Cycle Progress</span>
                    <span className="text-sm text-gray-400">{remainingSlots} slots remaining</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-green-500 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-400">Wins</div>
                    <div className="text-xl font-bold text-green-400">{state.cycleStats.wins}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-400">Losses</div>
                    <div className="text-xl font-bold text-red-400">{state.cycleStats.losses}</div>
                </div>
            </div>

            {selectedCategory && (
                <div className="bg-purple-900 rounded-lg p-4 mb-6">
                    <h3 className="font-bold mb-2">Current Draw</h3>
                    <p className="text-lg">{selectedCategory.name}</p>
                    <p className="text-sm text-gray-300">Mode: {selectedMode}</p>
                </div>
            )}

            <div className="space-y-3">
                <button
                    onClick={onDraw}
                    disabled={state.cycleCompleted || remainingSlots === 0}
                    className={`w-full py-3 rounded-lg font-bold transition ${state.cycleCompleted || remainingSlots === 0
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {state.cycleCompleted ? 'Cycle Complete' :
                        remainingSlots === 0 ? 'Cycle Ended' : 'Draw Slot'}
                </button>

                {state.cycleCompleted && (
                    <button
                        onClick={onResetCycle}
                        className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold transition"
                    >
                        Start New Cycle
                    </button>
                )}
            </div>
        </div>
    );
};

export default Dashboard;