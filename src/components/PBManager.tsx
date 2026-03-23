// src/components/PBManager.tsx
import React, { useState } from 'react';
import { Category, PBEntry } from '../types';

interface PBManagerProps {
    categories: Category[];
    onUpdatePB: (categoryId: string, pbEntries: PBEntry[]) => void;
}

const PBManager: React.FC<PBManagerProps> = ({ categories, onUpdatePB }) => {
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [editingPB, setEditingPB] = useState<{ id: string; value: string } | null>(null);

    const handleUpdatePBValue = (categoryId: string, pbId: string, value: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        const updatedPB = category.pbCriteria.map(pb =>
            pb.id === pbId
                ? { ...pb, value, lastUpdated: new Date().toISOString() }
                : pb
        );

        onUpdatePB(categoryId, updatedPB);
        setEditingPB(null);
    };

    return (
        <div className="panel p-6">
            <h2 className="text-2xl font-bold mb-4">Personal Bests</h2>

            <div className="mb-4">
                <select
                    onChange={(e) => {
                        const cat = categories.find(c => c.id === e.target.value);
                        setSelectedCategory(cat || null);
                    }}
                    className="field"
                    defaultValue=""
                >
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {selectedCategory && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    <h3 className="font-bold text-lg mb-2">{selectedCategory.name}</h3>
                    {selectedCategory.pbCriteria.length === 0 ? (
                        <p className="text-slate-300">No PB criteria set for this category</p>
                    ) : (
                        selectedCategory.pbCriteria.map(pb => (
                            <div key={pb.id} className="surface p-3">
                                <div className="font-semibold mb-1">{pb.label}</div>
                                {editingPB?.id === pb.id ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            defaultValue={pb.value}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleUpdatePBValue(selectedCategory.id, pb.id, e.currentTarget.value);
                                                }
                                            }}
                                            className="field flex-1 px-2 py-1"
                                            autoFocus
                                        />
                                        <button
                                            onClick={(e) => {
                                                const input = e.currentTarget.parentElement?.querySelector('input');
                                                if (input) {
                                                    handleUpdatePBValue(selectedCategory.id, pb.id, input.value);
                                                }
                                            }}
                                            className="btn btn-secondary px-3 py-1"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingPB(null)}
                                            className="btn btn-soft px-3 py-1"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <span className={pb.value ? 'text-emerald-300' : 'text-slate-300'}>
                                            {pb.value || 'Not set yet'}
                                        </span>
                                        <button
                                            onClick={() => setEditingPB({ id: pb.id, value: pb.value })}
                                            className="btn btn-primary px-3 py-1 text-sm"
                                        >
                                            Update
                                        </button>
                                    </div>
                                )}
                                {pb.lastUpdated && pb.value && (
                                    <div className="text-xs text-slate-300 mt-1">
                                        Updated: {new Date(pb.lastUpdated).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default PBManager;