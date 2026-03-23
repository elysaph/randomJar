import React, { useMemo } from 'react';
import { AppState } from '../types';
import { formatDisplayText } from '../utils/formatting';

interface AnalyticsPanelProps {
    state: AppState;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ state }) => {
    const sessions = state.sessionHistory;

    const categoryStats = useMemo(() => {
        const map = new Map<string, number>();
        sessions.forEach((session) => {
            const key = formatDisplayText(session.category);
            map.set(key, (map.get(key) ?? 0) + 1);
        });

        return Array.from(map.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }, [sessions]);

    const timeline = useMemo(() => {
        const items = sessions
            .map((session) => ({
                day: new Date(session.timestamp).toLocaleDateString(),
                value: session.result === 'WIN' ? 1 : -1
            }))
            .slice(-30);

        let running = 0;
        return items.map((item) => {
            running += item.value;
            return { ...item, running };
        });
    }, [sessions]);

    const effortMix = useMemo(() => {
        const counts = { comfortable: 0, normal: 0, rigorous: 0 };
        sessions.forEach((session) => {
            counts[session.effortLevel] += 1;
        });
        return counts;
    }, [sessions]);

    const totalSessions = sessions.length;
    const totalWins = sessions.filter((session) => session.result === 'WIN').length;
    const totalLosses = totalSessions - totalWins;
    const winRate = totalSessions === 0 ? 0 : Math.round((totalWins / totalSessions) * 100);

    const maxCategory = Math.max(1, ...categoryStats.map((item) => item.count));
    const maxTimeline = Math.max(1, ...timeline.map((item) => Math.abs(item.running)));

    return (
        <div className="panel interactive-card">
            <h2 className="text-2xl font-bold mb-5">Grand Ledger</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="surface p-4">
                    <div className="text-xs text-slate-300">Total sessions</div>
                    <div className="text-2xl font-bold">{totalSessions}</div>
                </div>
                <div className="surface p-4">
                    <div className="text-xs text-slate-300">Wins</div>
                    <div className="text-2xl font-bold text-emerald-300">{totalWins}</div>
                </div>
                <div className="surface p-4">
                    <div className="text-xs text-slate-300">Losses</div>
                    <div className="text-2xl font-bold text-rose-400">{totalLosses}</div>
                </div>
                <div className="surface p-4">
                    <div className="text-xs text-slate-300">Win rate</div>
                    <div className="text-2xl font-bold text-violet-300">{winRate}%</div>
                </div>
            </div>

            <div className="rune-divider"><span>Category Usage</span></div>
            <div className="space-y-2 mb-6">
                {categoryStats.length === 0 && <p className="text-slate-300">No data yet.</p>}
                {categoryStats.map((item) => (
                    <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1 text-slate-300">
                            <span>{item.label}</span>
                            <span>{item.count}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-violet-400 to-emerald-400"
                                style={{ width: `${(item.count / maxCategory) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="rune-divider"><span>Cumulative Fate Trend</span></div>
            <div className="surface p-4 mb-6">
                {timeline.length < 2 ? (
                    <p className="text-slate-300">Log more sessions to reveal trend lines.</p>
                ) : (
                    <svg viewBox="0 0 600 180" className="w-full h-40">
                        <polyline
                            fill="none"
                            stroke="url(#trendGradient)"
                            strokeWidth="4"
                            points={timeline
                                .map((point, idx) => {
                                    const x = (idx / Math.max(1, timeline.length - 1)) * 580 + 10;
                                    const y = 90 - (point.running / maxTimeline) * 70;
                                    return `${x},${y}`;
                                })
                                .join(' ')}
                        />
                        <defs>
                            <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#7f5cff" />
                                <stop offset="100%" stopColor="#16c3a9" />
                            </linearGradient>
                        </defs>
                    </svg>
                )}
            </div>

            <div className="rune-divider"><span>Effort Mix</span></div>
            <div className="grid grid-cols-3 gap-3">
                <div className="surface p-3 text-center">
                    <div className="text-xs text-slate-300">Comfortable</div>
                    <div className="text-lg font-bold">{effortMix.comfortable}</div>
                </div>
                <div className="surface p-3 text-center">
                    <div className="text-xs text-slate-300">Normal</div>
                    <div className="text-lg font-bold">{effortMix.normal}</div>
                </div>
                <div className="surface p-3 text-center">
                    <div className="text-xs text-slate-300">Rigorous</div>
                    <div className="text-lg font-bold">{effortMix.rigorous}</div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPanel;
