// src/components/SessionLogger.tsx
import React, { useState } from 'react';
import { Category, EFFORT_LEVELS } from '../types';

interface SessionLoggerProps {
    category: Category;
    mode: string;
    onLogSession: (effortLevel: 'comfortable' | 'normal' | 'rigorous', notes: string) => void;
    onCancel: () => void;
}

const SessionLogger: React.FC<SessionLoggerProps> = ({ category, mode, onLogSession, onCancel }) => {
    const [effortLevel, setEffortLevel] = useState<'comfortable' | 'normal' | 'rigorous'>('normal');
    const [notes, setNotes] = useState('');

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Log Session</h2>
            <div className="mb-4">
                <p className="text-gray-300">Category: <span className="text-white font-bold">{category.name}</span></p>
                <p className="text-gray-300">Mode: <span className="text-white font-bold">{mode}</span></p>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">How was the task?</label>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(EFFORT_LEVELS).map(([key, value]) => (
                        <button
                            key={key}
                            onClick={() => setEffortLevel(key as any)}
                            className={`py-2 px-3 rounded-lg transition ${effortLevel === key
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {value.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg p-2 text-white"
                    rows={3}
                    placeholder="What did you accomplish? Any insights?"
                />
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => onLogSession(effortLevel, notes)}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg font-bold transition"
                >
                    Submit
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg font-bold transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default SessionLogger;