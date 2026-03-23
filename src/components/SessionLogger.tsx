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
        <div className="panel p-6">
            <h2 className="text-2xl font-bold mb-4">Log Session</h2>
            <div className="mb-4">
                <p className="text-slate-300">Category: <span className="text-slate-100 font-bold">{category.name}</span></p>
                <p className="text-slate-300">Mode: <span className="text-slate-100 font-bold">{mode}</span></p>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">How was the task?</label>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(EFFORT_LEVELS).map(([key, value]) => (
                        <button
                            key={key}
                            onClick={() => setEffortLevel(key as any)}
                            className={`btn py-2 px-3 ${effortLevel === key
                                ? 'btn-primary text-white'
                                : 'btn-soft'
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
                    className="field"
                    rows={3}
                    placeholder="What did you accomplish? Any insights?"
                />
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => onLogSession(effortLevel, notes)}
                    className="flex-1 btn btn-secondary py-2"
                >
                    Submit
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 btn btn-soft py-2"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default SessionLogger;