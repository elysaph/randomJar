// src/components/CategoryManager.tsx
import React, { useState } from 'react';
import { Category } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CategoryManagerProps {
    categories: Category[];
    onUpdateCategories: (categories: Category[]) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onUpdateCategories }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newMode, setNewMode] = useState('');
    const [newPBCriteria, setNewPBCriteria] = useState('');

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;

        const newCategory: Category = {
            id: uuidv4(),
            name: newCategoryName,
            slots: 1,
            modes: [],
            pbCriteria: []
        };

        onUpdateCategories([...categories, newCategory]);
        setNewCategoryName('');
    };

    const handleDeleteCategory = (id: string) => {
        if (categories.length === 1) {
            alert('You need at least one category');
            return;
        }
        onUpdateCategories(categories.filter(c => c.id !== id));
    };

    const handleUpdateSlots = (id: string, slots: number) => {
        onUpdateCategories(categories.map(c =>
            c.id === id ? { ...c, slots: Math.max(0, slots) } : c
        ));
    };

    const handleAddMode = (categoryId: string) => {
        if (!newMode.trim()) return;
        onUpdateCategories(categories.map(c =>
            c.id === categoryId
                ? { ...c, modes: [...c.modes, newMode] }
                : c
        ));
        setNewMode('');
    };

    const handleDeleteMode = (categoryId: string, modeIndex: number) => {
        onUpdateCategories(categories.map(c =>
            c.id === categoryId
                ? { ...c, modes: c.modes.filter((_, i) => i !== modeIndex) }
                : c
        ));
    };

    const handleAddPBCriteria = (categoryId: string) => {
        if (!newPBCriteria.trim()) return;
        onUpdateCategories(categories.map(c =>
            c.id === categoryId
                ? {
                    ...c,
                    pbCriteria: [
                        ...c.pbCriteria,
                        {
                            id: uuidv4(),
                            label: newPBCriteria,
                            value: '',
                            lastUpdated: new Date().toISOString()
                        }
                    ]
                }
                : c
        ));
        setNewPBCriteria('');
    };

    const totalSlots = categories.reduce((sum, c) => sum + c.slots, 0);

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Category Manager</h2>
            <div className={`mb-4 p-3 rounded-lg ${totalSlots === 15 ? 'bg-green-900' : 'bg-red-900'}`}>
                Total Slots: {totalSlots} / 15
                {totalSlots !== 15 && (
                    <p className="text-sm mt-1">Total must equal 15 to start a cycle</p>
                )}
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="w-full bg-gray-700 rounded-lg p-2 mb-2"
                />
                <button
                    onClick={handleAddCategory}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition"
                >
                    Add Category
                </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
                {categories.map(category => (
                    <div key={category.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-lg">{category.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm">Slots:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="15"
                                        value={category.slots}
                                        onChange={(e) => handleUpdateSlots(category.id, parseInt(e.target.value) || 0)}
                                        className="w-16 bg-gray-600 rounded px-2 py-1"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                            >
                                Delete
                            </button>
                        </div>

                        <div className="mb-3">
                            <div className="text-sm font-semibold mb-2">Modes:</div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {category.modes.map((mode, idx) => (
                                    <span key={idx} className="bg-gray-600 px-2 py-1 rounded text-sm flex items-center gap-2">
                                        {mode}
                                        <button
                                            onClick={() => handleDeleteMode(category.id, idx)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMode}
                                    onChange={(e) => setNewMode(e.target.value)}
                                    placeholder="New mode"
                                    className="flex-1 bg-gray-600 rounded px-2 py-1 text-sm"
                                />
                                <button
                                    onClick={() => handleAddMode(category.id)}
                                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-semibold mb-2">PB Criteria:</div>
                            <div className="space-y-1 mb-2">
                                {category.pbCriteria.map(criteria => (
                                    <div key={criteria.id} className="bg-gray-600 px-2 py-1 rounded text-sm">
                                        {criteria.label}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newPBCriteria}
                                    onChange={(e) => setNewPBCriteria(e.target.value)}
                                    placeholder="New PB criteria"
                                    className="flex-1 bg-gray-600 rounded px-2 py-1 text-sm"
                                />
                                <button
                                    onClick={() => handleAddPBCriteria(category.id)}
                                    className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryManager;