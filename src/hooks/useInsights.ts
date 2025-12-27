'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface InsightsData {
    score: number;
    scoreDelta: number;
    emotionTrend: number[];
    avgMood: number;
    avgEnergy: number;
    avgStress: number;
    avgSleep: number;
    avgConnection: number;
    checkInCount: number;
    recommendations: string[];
    weeklyHighlight: string;
    partnerSync: number;
}

// Default mock data for demo/development
const mockInsights: InsightsData = {
    score: 78,
    scoreDelta: 5,
    emotionTrend: [65, 70, 68, 75, 80, 78, 82],
    avgMood: 76,
    avgEnergy: 72,
    avgStress: 35,
    avgSleep: 68,
    avgConnection: 82,
    checkInCount: 7,
    recommendations: [
        'استمروا في هذا التوازن الرائع! 🌟',
        'جربوا نشاط جديد معاً هذا الأسبوع',
        'خصصوا وقت للحديث العميق',
    ],
    weeklyHighlight: 'أعلى مستوى اتصال عاطفي كان يوم الجمعة 💕',
    partnerSync: 85,
};

export function useInsights() {
    const supabase = createClient();
    const { user } = useAuth();
    const [insights, setInsights] = useState<InsightsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInsights = async () => {
        setIsLoading(true);

        try {
            // If no user, use mock data for demo
            if (!user) {
                setInsights(mockInsights);
                setIsLoading(false);
                return;
            }

            // Get last 7 days of check-ins
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: checkIns, error } = await supabase
                .from('check_ins')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching check-ins:', error);
                // Use mock data on error
                setInsights(mockInsights);
                setIsLoading(false);
                return;
            }

            if (!checkIns || checkIns.length === 0) {
                // Use mock data when no check-ins exist
                setInsights(mockInsights);
                setIsLoading(false);
                return;
            }

            // Calculate averages (values are 1-5, convert to percentage)
            const avgMood = checkIns.reduce((sum, c) => sum + (c.mood || 3), 0) / checkIns.length;
            const avgEnergy = checkIns.reduce((sum, c) => sum + (c.energy || 3), 0) / checkIns.length;
            const avgStress = checkIns.reduce((sum, c) => sum + (c.stress || 3), 0) / checkIns.length;
            const avgSleep = checkIns.reduce((sum, c) => sum + (c.sleep || 3), 0) / checkIns.length;
            const avgConnection = checkIns.reduce((sum, c) => sum + (c.connection || 3), 0) / checkIns.length;

            // Calculate overall score (weighted average)
            const overallScore = Math.round(
                ((avgMood * 0.25) + (avgEnergy * 0.2) + (avgStress * 0.2) + (avgSleep * 0.15) + (avgConnection * 0.2)) * 20
            );

            // Create daily trend
            const dailyScores = checkIns.map(c => {
                return Math.round(
                    (((c.mood || 3) + (c.energy || 3) + (c.stress || 3) + (c.sleep || 3) + (c.connection || 3)) / 5) * 20
                );
            });

            // Calculate delta (compare last 3 days to previous 4 days)
            let scoreDelta = 0;
            if (checkIns.length >= 4) {
                const recentAvg = dailyScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
                const previousAvg = dailyScores.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, dailyScores.length - 3);
                scoreDelta = Math.round(recentAvg - previousAvg);
            }

            // Find weekly highlight (best day)
            const bestDay = checkIns.reduce((best, c, idx) => {
                const score = (c.mood || 0) + (c.connection || 0);
                if (score > best.score) {
                    return { score, idx, date: new Date(c.created_at) };
                }
                return best;
            }, { score: 0, idx: 0, date: new Date() });

            const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            const weeklyHighlight = `أعلى مستوى اتصال عاطفي كان يوم ${dayNames[bestDay.date.getDay()]} 💕`;

            // Generate recommendations based on data
            const recommendations: string[] = [];

            if (avgMood < 3) {
                recommendations.push('لاحظنا انخفاض في المزاج، جربوا نشاط ممتع معاً');
            }
            if (avgEnergy < 3) {
                recommendations.push('الطاقة منخفضة، تأكدوا من الحصول على قسط كافٍ من النوم');
            }
            if (avgStress > 3) {
                recommendations.push('مستوى الضغط مرتفع، خصصوا وقتاً للاسترخاء');
            }
            if (avgSleep < 3) {
                recommendations.push('جودة النوم تحتاج تحسين، حاولوا النوم في أوقات منتظمة');
            }
            if (avgConnection < 3) {
                recommendations.push('وقت الاتصال العاطفي قليل، خصصوا وقت نوعي لبعض');
            }
            if (checkIns.length < 5) {
                recommendations.push('سجلوا حالتكم يومياً للحصول على رؤى أدق');
            }
            if (recommendations.length === 0) {
                recommendations.push('استمروا في هذا التوازن الرائع! 🌟');
                recommendations.push('جربوا نشاط جديد معاً لتعزيز الترابط');
            }

            // Partner sync score (mock for now, can be enhanced with real data)
            const partnerSync = Math.min(100, Math.round(avgConnection * 20 + 10));

            setInsights({
                score: overallScore,
                scoreDelta,
                emotionTrend: dailyScores,
                avgMood: Math.round(avgMood * 20),
                avgEnergy: Math.round(avgEnergy * 20),
                avgStress: Math.round(avgStress * 20), // High score = Relaxed (Good)
                avgSleep: Math.round(avgSleep * 20),
                avgConnection: Math.round(avgConnection * 20),
                checkInCount: checkIns.length,
                recommendations,
                weeklyHighlight,
                partnerSync,
            });
        } catch (error) {
            console.error('Error fetching insights:', error);
            // Use mock data on error
            setInsights(mockInsights);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, [user]);

    return {
        insights,
        isLoading,
        refetch: fetchInsights,
    };
}
