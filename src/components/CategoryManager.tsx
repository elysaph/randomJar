// src/components/CategoryManager.tsx
import React, { useState } from 'react';
import { Category } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { formatDisplayText } from '../utils/formatting';

interface CategoryManagerProps {
    categories: Category[];
    onUpdateCategories: (categories: Category[]) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onUpdateCategories }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newMode, setNewMode] = useState('');
    const [newPBCriteria, setNewPBCriteria] = useState('');
    const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

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
        if (!window.confirm('Delete this category and its modes?')) {
            return;
        }
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
        <div className="panel interactive-card">
            <h2 className="text-2xl font-bold mb-5">Category Manager</h2>
            <div className={`mb-5 p-3 rounded-lg text-white ${totalSlots === 15 ? 'bg-emerald-600/90' : 'bg-rose-600/90'}`}>
                Total Slots: {totalSlots} / 15
                {totalSlots !== 15 && (
                    <p className="text-sm mt-1">Total must equal 15 to start a cycle</p>
                )}
            </div>

            <div className="mb-5">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="field mb-2"
                />
                <button
                    onClick={handleAddCategory}
                    className="w-full btn btn-primary py-2"
                >
                    Add Category
                </button>
            </div>

            <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
                {categories.map(category => (
                    <div key={category.id} className="surface p-5">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-lg">{formatDisplayText(category.name)}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-slate-300">Slots:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="15"
                                        value={category.slots}
                                        onChange={(e) => handleUpdateSlots(category.id, parseInt(e.target.value) || 0)}
                                        className="field w-16 px-2 py-1"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setOpenCategoryId((prev) => prev === category.id ? null : category.id)}
                                className="btn btn-soft px-3 py-1 text-sm"
                            >
                                {openCategoryId === category.id ? 'Close' : 'Configure'}
                            </button>
                        </div>

                        <div className="text-xs text-slate-300 mb-2">
                            {category.modes.length} modes • {category.pbCriteria.length} PB criteria
                        </div>

                        {openCategoryId === category.id && <>
                            <div className="mb-3">
                                <div className="text-sm font-semibold mb-2">Modes:</div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {category.modes.map((mode, idx) => (
                                        <span key={idx} className="chip">
                                            {formatDisplayText(mode)}
                                            <button
                                                onClick={() => handleDeleteMode(category.id, idx)}
                                                className="text-rose-400 hover:text-rose-300"
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
                                        className="field flex-1 text-sm"
                                    />
                                    <button
                                        onClick={() => handleAddMode(category.id)}
                                        className="btn btn-secondary px-3 py-1 text-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-semibold mb-2">PB Criteria:</div>
                                <div className="space-y-1 mb-2">
                                    {category.pbCriteria.map(criteria => (
                                        <div key={criteria.id} className="chip rounded-md">
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
                                        className="field flex-1 text-sm"
                                    />
                                    <button
                                        onClick={() => handleAddPBCriteria(category.id)}
                                        className="btn btn-primary px-3 py-1 text-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-700/40">
                                <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="btn btn-danger px-3 py-1 text-sm"
                                >
                                    Delete Category
                                </button>
                            </div>
                        </>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryManager;