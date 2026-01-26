'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type RelationshipStage = 'khatba' | 'married' | 'dating';

interface UseRelationshipStageReturn {
    stage: RelationshipStage;
    isLoading: boolean;
    updateStage: (newStage: RelationshipStage) => Promise<void>;
    isKhatba: boolean;
    isMarried: boolean;
}

export function useRelationshipStage(): UseRelationshipStageReturn {
    const [stage, setStage] = useState<RelationshipStage>('married');
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchStage = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsLoading(false);
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('relationship_stage')
                    .eq('id', user.id)
                    .single();

                if (profile?.relationship_stage) {
                    setStage(profile.relationship_stage as RelationshipStage);
                }
            } catch (err) {
                console.error('Error fetching relationship stage:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStage();
    }, [supabase]);

    const updateStage = async (newStage: RelationshipStage) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .update({ relationship_stage: newStage })
                .eq('id', user.id);

            if (error) throw error;
            setStage(newStage);
        } catch (err) {
            console.error('Error updating stage:', err);
            throw err;
        }
    };

    return {
        stage,
        isLoading,
        updateStage,
        isKhatba: stage === 'khatba',
        isMarried: stage === 'married',
    };
}
