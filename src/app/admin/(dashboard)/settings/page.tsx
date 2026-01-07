'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Settings,
    Bell,
    Shield,
    Zap,
    Database,
    Wrench,
    Save,
    RefreshCw
} from 'lucide-react';

interface SettingGroup {
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    settings: {
        key: string;
        label: string;
        description: string;
        type: 'toggle' | 'number' | 'text';
        value: boolean | number | string;
    }[];
}

export default function AdminSettingsPage() {
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<SettingGroup[]>([
        {
            title: 'General',
            description: 'Core application settings',
            icon: Settings,
            color: 'text-slate-400',
            settings: [
                { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Enable to put app in maintenance', type: 'toggle', value: false },
                { key: 'registration_enabled', label: 'Registration Open', description: 'Allow new user registrations', type: 'toggle', value: true },
                { key: 'min_app_version', label: 'Minimum App Version', description: 'Force update below this version', type: 'text', value: '1.0.0' },
            ],
        },
        {
            title: 'Features',
            description: 'Toggle app features',
            icon: Zap,
            color: 'text-purple-400',
            settings: [
                { key: 'feature_ai_coach', label: 'AI Coach', description: 'Enable AI relationship coach', type: 'toggle', value: true },
                { key: 'feature_conflict_ai', label: 'Conflict Resolution AI', description: 'Enable conflict resolution feature', type: 'toggle', value: true },
                { key: 'feature_whispers', label: 'Whispers', description: 'Enable whispers feature', type: 'toggle', value: true },
                { key: 'feature_games', label: 'Games', description: 'Enable games section', type: 'toggle', value: true },
                { key: 'feature_journeys', label: 'Journeys', description: 'Enable journeys section', type: 'toggle', value: true },
                { key: 'feature_insights', label: 'Insights & Analytics', description: 'Enable user insights', type: 'toggle', value: true },
            ],
        },
        {
            title: 'Notifications',
            description: 'Configure push notifications',
            icon: Bell,
            color: 'text-blue-400',
            settings: [
                { key: 'daily_checkin_reminder', label: 'Daily Check-in Reminders', description: 'Send daily reminders to users', type: 'toggle', value: true },
                { key: 'streak_milestone_notification', label: 'Streak Milestones', description: 'Notify on streak achievements', type: 'toggle', value: true },
                { key: 'partner_activity_notification', label: 'Partner Activity', description: 'Notify when partner is active', type: 'toggle', value: true },
            ],
        },
        {
            title: 'Limits',
            description: 'Rate limits and quotas',
            icon: Shield,
            color: 'text-green-400',
            settings: [
                { key: 'max_pairing_codes_per_user', label: 'Max Pairing Codes', description: 'Per user limit', type: 'number', value: 3 },
                { key: 'max_daily_checkins', label: 'Max Daily Check-ins', description: 'Limit check-ins per day', type: 'number', value: 5 },
            ],
        },
    ]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.settings) {
                    setSettings(prev => {
                        const newSettings = [...prev];
                        // Update values from API
                        newSettings.forEach(group => {
                            group.settings.forEach(setting => {
                                if (data.settings[setting.key] !== undefined) {
                                    setting.value = data.settings[setting.key];
                                }
                            });
                        });
                        return newSettings;
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (groupIdx: number, settingIdx: number) => {
        setSettings(prev => {
            const newSettings = [...prev];
            const newGroup = { ...newSettings[groupIdx] };
            const newSetting = { ...newGroup.settings[settingIdx] };

            if (newSetting.type === 'toggle') {
                newSetting.value = !newSetting.value;
            }

            newGroup.settings = [...newGroup.settings];
            newGroup.settings[settingIdx] = newSetting;
            newSettings[groupIdx] = newGroup;
            return newSettings;
        });
    };

    const handleNumberChange = (groupIdx: number, settingIdx: number, value: string) => {
        setSettings(prev => {
            const newSettings = [...prev];
            const newGroup = { ...newSettings[groupIdx] };
            const newSetting = { ...newGroup.settings[settingIdx] };

            newSetting.value = parseInt(value) || 0;

            newGroup.settings = [...newGroup.settings];
            newGroup.settings[settingIdx] = newSetting;
            newSettings[groupIdx] = newGroup;
            return newSettings;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Collect all settings
            const updates: { key: string; value: any }[] = [];
            settings.forEach(group => {
                group.settings.forEach(setting => {
                    updates.push({ key: setting.key, value: setting.value });
                });
            });

            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (!res.ok) {
                throw new Error('Failed to save settings');
            }

            // Optional: Show success toast
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-slate-400 mt-1">Configure application settings</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary-600 hover:bg-primary-500 text-white"
                >
                    {saving ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                </Button>
            </div>

            {/* Settings Groups */}
            <div className="grid gap-6">
                {settings.map((group, groupIdx) => (
                    <Card key={group.title} className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <group.icon className={`w-5 h-5 ${group.color}`} />
                                {group.title}
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                {group.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {group.settings.map((setting, settingIdx) => (
                                <div
                                    key={setting.key}
                                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
                                >
                                    <div>
                                        <h4 className="text-white font-medium">{setting.label}</h4>
                                        <p className="text-sm text-slate-500">{setting.description}</p>
                                    </div>
                                    {setting.type === 'toggle' ? (
                                        <button
                                            onClick={() => handleToggle(groupIdx, settingIdx)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${setting.value ? 'bg-primary-600' : 'bg-slate-700'
                                                }`}
                                        >
                                            <div
                                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${setting.value ? 'translate-x-7' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    ) : setting.type === 'number' ? (
                                        <input
                                            type="number"
                                            value={setting.value as number}
                                            onChange={(e) => handleNumberChange(groupIdx, settingIdx, e.target.value)}
                                            className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-center"
                                        />
                                    ) : null}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Danger Zone */}
            <Card className="bg-red-950/20 border-red-900/50">
                <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                        <Wrench className="w-5 h-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-red-400/70">
                        Irreversible and destructive actions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-950/30 rounded-lg border border-red-900/30">
                        <div>
                            <h4 className="text-white font-medium">Clear All Sessions</h4>
                            <p className="text-sm text-slate-500">Remove all game sessions from the database</p>
                        </div>
                        <Button variant="destructive" size="sm">
                            Clear Sessions
                        </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-950/30 rounded-lg border border-red-900/30">
                        <div>
                            <h4 className="text-white font-medium">Reset All Streaks</h4>
                            <p className="text-sm text-slate-500">Reset all couple streaks to zero</p>
                        </div>
                        <Button variant="destructive" size="sm">
                            Reset Streaks
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* System Info */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-cyan-400" />
                        System Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-white">v1.0.0</p>
                            <p className="text-xs text-slate-500">App Version</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-white">Next.js 14</p>
                            <p className="text-xs text-slate-500">Framework</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-white">Supabase</p>
                            <p className="text-xs text-slate-500">Database</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                            <Badge variant="success" className="text-lg py-1">Online</Badge>
                            <p className="text-xs text-slate-500 mt-1">Status</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
