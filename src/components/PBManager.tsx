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
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Personal Bests</h2>

            <div className="mb-4">
                <select
                    onChange={(e) => {
                        const cat = categories.find(c => c.id === e.target.value);
                        setSelectedCategory(cat || null);
                    }}
                    className="w-full bg-gray-700 rounded-lg p-2"
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
                        <p className="text-gray-400">No PB criteria set for this category</p>
                    ) : (
                        selectedCategory.pbCriteria.map(pb => (
                            <div key={pb.id} className="bg-gray-700 rounded-lg p-3">
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
                                            className="flex-1 bg-gray-600 rounded px-2 py-1"
                                            autoFocus
                                        />
                                        <button
                                            onClick={(e) => {
                                                const input = e.currentTarget.parentElement?.querySelector('input');
                                                if (input) {
                                                    handleUpdatePBValue(selectedCategory.id, pb.id, input.value);
                                                }
                                            }}
                                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingPB(null)}
                                            className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <span className={pb.value ? 'text-green-400' : 'text-gray-400'}>
                                            {pb.value || 'Not set yet'}
                                        </span>
                                        <button
                                            onClick={() => setEditingPB({ id: pb.id, value: pb.value })}
                                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                                        >
                                            Update
                                        </button>
                                    </div>
                                )}
                                {pb.lastUpdated && pb.value && (
                                    <div className="text-xs text-gray-400 mt-1">
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