'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface HealthData {
    id: string;
    last_period_date: string | null;
    cycle_length: number;
    updated_at: string;
}

// Cycle phase types
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface CycleInfo {
    // Current state
    dayOfCycle: number;
    currentPhase: CyclePhase;
    phaseName: { ar: string; en: string };
    phaseDescription: { ar: string; en: string };

    // Key dates
    ovulationDay: number;
    ovulationDate: Date | null;
    fertileWindowStart: Date | null;
    fertileWindowEnd: Date | null;
    nextPeriodDate: Date | null;

    // Fertility
    isFertileToday: boolean;
    isOvulationDay: boolean;
    fertilityLevel: 'none' | 'low' | 'medium' | 'high' | 'peak';

    // Days until events
    daysUntilOvulation: number;
    daysUntilPeriod: number;
    daysUntilFertile: number;
}

// Phase configurations
const phaseConfig: Record<CyclePhase, { color: string; bgColor: string; icon: string }> = {
    menstrual: { color: 'text-rose-400', bgColor: 'bg-rose-500/20', icon: '🩸' },
    follicular: { color: 'text-green-400', bgColor: 'bg-green-500/20', icon: '🌱' },
    ovulation: { color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: '✨' },
    luteal: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: '🌙' }
};

/**
 * Calculate ovulation day based on cycle length
 * Medical standard: Ovulation typically occurs 14 days BEFORE the next period
 * (Luteal phase is relatively constant at ~14 days)
 */
function calculateOvulationDay(cycleLength: number): number {
    // Luteal phase is typically 14 days (can range 12-16)
    const lutealPhase = 14;
    return Math.max(10, cycleLength - lutealPhase);
}

/**
 * Get current cycle phase based on day
 */
function getCyclePhase(dayOfCycle: number, cycleLength: number): CyclePhase {
    const ovulationDay = calculateOvulationDay(cycleLength);

    // Menstrual phase: Days 1-5 (typically)
    if (dayOfCycle <= 5) return 'menstrual';

    // Ovulation phase: Ovulation day ± 1
    if (dayOfCycle >= ovulationDay - 1 && dayOfCycle <= ovulationDay + 1) return 'ovulation';

    // Follicular phase: After menstrual, before ovulation
    if (dayOfCycle < ovulationDay - 1) return 'follicular';

    // Luteal phase: After ovulation until next period
    return 'luteal';
}

/**
 * Get phase name in both languages
 */
function getPhaseName(phase: CyclePhase): { ar: string; en: string } {
    const names: Record<CyclePhase, { ar: string; en: string }> = {
        menstrual: { ar: 'فترة الحيض', en: 'Menstrual Phase' },
        follicular: { ar: 'المرحلة الجرابية', en: 'Follicular Phase' },
        ovulation: { ar: 'فترة الإباضة', en: 'Ovulation Phase' },
        luteal: { ar: 'المرحلة الأصفرية', en: 'Luteal Phase' }
    };
    return names[phase];
}

/**
 * Get phase description
 */
function getPhaseDescription(phase: CyclePhase): { ar: string; en: string } {
    const descriptions: Record<CyclePhase, { ar: string; en: string }> = {
        menstrual: {
            ar: 'بداية الدورة - وقت للراحة والعناية بالنفس',
            en: 'Start of cycle - time for rest and self-care'
        },
        follicular: {
            ar: 'زيادة الطاقة والنشاط - وقت مثالي للتخطيط',
            en: 'Rising energy - great time for planning'
        },
        ovulation: {
            ar: 'ذروة الخصوبة - أعلى مستويات الطاقة',
            en: 'Peak fertility - highest energy levels'
        },
        luteal: {
            ar: 'انتظار الدورة القادمة - وقت للاسترخاء',
            en: 'Awaiting next cycle - time to relax'
        }
    };
    return descriptions[phase];
}

/**
 * Calculate fertility level based on proximity to ovulation
 */
function getFertilityLevel(dayOfCycle: number, ovulationDay: number): 'none' | 'low' | 'medium' | 'high' | 'peak' {
    const daysFromOvulation = dayOfCycle - ovulationDay;

    // Sperm can survive 5 days, egg survives 12-24 hours
    // Fertile window: 5 days before to 1 day after ovulation

    if (daysFromOvulation === 0) return 'peak'; // Ovulation day
    if (daysFromOvulation === -1 || daysFromOvulation === -2) return 'high'; // 2 days before
    if (daysFromOvulation >= -5 && daysFromOvulation <= 1) return 'medium'; // Fertile window
    if (daysFromOvulation >= -7 && daysFromOvulation <= 3) return 'low'; // Near fertile window

    return 'none';
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Calculate comprehensive cycle information
 */
export function calculateCycleInfo(lastPeriodDate: string | null, cycleLength: number): CycleInfo | null {
    if (!lastPeriodDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastPeriod = new Date(lastPeriodDate);
    lastPeriod.setHours(0, 0, 0, 0);

    // Calculate day of cycle (1-indexed)
    const diffTime = today.getTime() - lastPeriod.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let dayOfCycle = (diffDays % cycleLength) + 1;
    if (dayOfCycle <= 0) dayOfCycle += cycleLength;

    // Calculate key values
    const ovulationDay = calculateOvulationDay(cycleLength);
    const currentPhase = getCyclePhase(dayOfCycle, cycleLength);
    const fertilityLevel = getFertilityLevel(dayOfCycle, ovulationDay);

    // Calculate dates - find the current cycle start
    const currentCycleNumber = Math.floor(diffDays / cycleLength);
    const currentCycleStart = addDays(lastPeriod, currentCycleNumber * cycleLength);

    // Ovulation date (in current cycle)
    const ovulationDate = addDays(currentCycleStart, ovulationDay - 1);

    // Fertile window: 5 days before ovulation to 1 day after
    const fertileWindowStart = addDays(ovulationDate, -5);
    const fertileWindowEnd = addDays(ovulationDate, 1);

    // Next period date
    const nextPeriodDate = addDays(currentCycleStart, cycleLength);

    // Check fertility today
    const isFertileToday = today >= fertileWindowStart && today <= fertileWindowEnd;
    const isOvulationDay = dayOfCycle === ovulationDay;

    // Days until events
    const daysUntilOvulation = ovulationDay - dayOfCycle;
    const daysUntilPeriod = cycleLength - dayOfCycle;
    const daysUntilFertile = Math.max(0, ovulationDay - 5 - dayOfCycle);

    return {
        dayOfCycle,
        currentPhase,
        phaseName: getPhaseName(currentPhase),
        phaseDescription: getPhaseDescription(currentPhase),

        ovulationDay,
        ovulationDate: ovulationDate > today ? ovulationDate : null,
        fertileWindowStart: fertileWindowStart > today ? fertileWindowStart : null,
        fertileWindowEnd: fertileWindowEnd > today ? fertileWindowEnd : null,
        nextPeriodDate,

        isFertileToday,
        isOvulationDay,
        fertilityLevel,

        daysUntilOvulation: Math.max(0, daysUntilOvulation),
        daysUntilPeriod: Math.max(0, daysUntilPeriod),
        daysUntilFertile
    };
}

export function useHealth() {
    const supabase = createClient();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Get couple ID
    const getCoupleId = async (): Promise<string | null> => {
        if (!user) return null;
        const { data } = await supabase
            .from('couples')
            .select('id')
            .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
            .eq('status', 'ACTIVE')
            .single();
        return data?.id || null;
    };

    const getHealthData = async () => {
        if (!user) return { data: null, error: 'Not authenticated' };

        setIsLoading(true);
        try {
            const coupleId = await getCoupleId();

            // Try to fetch by couple_id first (shared), then user_id (personal fallback)
            let query = supabase.from('health_tracking').select('*');

            if (coupleId) {
                query = query.eq('couple_id', coupleId);
            } else {
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query.maybeSingle();

            if (error) throw error;
            return { data: data as HealthData | null, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    const updateHealthData = async (data: { last_period_date: string | null; cycle_length: number }) => {
        if (!user) return { error: 'Not authenticated' };

        setIsLoading(true);
        try {
            const coupleId = await getCoupleId();

            // Prepare upsert data
            const upsertData: any = {
                last_period_date: data.last_period_date,
                cycle_length: data.cycle_length,
                updated_at: new Date().toISOString()
            };

            // If paired, attach to couple, otherwise attach to user
            if (coupleId) {
                upsertData.couple_id = coupleId;
            } else {
                upsertData.user_id = user.id;
            }

            let existing = await getHealthData();

            let result;
            if (existing.data?.id) {
                result = await supabase
                    .from('health_tracking')
                    .update(upsertData)
                    .eq('id', existing.data.id)
                    .select()
                    .single();
            } else {
                // If we are inserting
                if (coupleId) upsertData.user_id = user.id; // Record creator
                result = await supabase
                    .from('health_tracking')
                    .insert(upsertData)
                    .select()
                    .single();
            }

            if (result.error) throw result.error;
            return { data: result.data, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Get full cycle analysis for given health data
     */
    const getCycleInfo = (healthData: HealthData | null): CycleInfo | null => {
        if (!healthData?.last_period_date) return null;
        return calculateCycleInfo(healthData.last_period_date, healthData.cycle_length);
    };

    return {
        getHealthData,
        updateHealthData,
        getCycleInfo,
        calculateCycleInfo,
        phaseConfig,
        isLoading
    };
}

