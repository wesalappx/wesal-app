import { create } from 'zustand';

interface GameState {
    currentJourneySlug: string | null;
    currentStage: number;
    currentQuestion: number;
    isPartnerReady: boolean;
    isSelfReady: boolean;

    // Actions
    setCurrentJourney: (slug: string | null) => void;
    setProgress: (stage: number, question: number) => void;
    setReadyStatus: (self: boolean, partner: boolean) => void;
    resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    currentJourneySlug: null,
    currentStage: 1,
    currentQuestion: 1,
    isPartnerReady: false,
    isSelfReady: false,

    setCurrentJourney: (slug) =>
        set({ currentJourneySlug: slug }),

    setProgress: (stage, question) =>
        set({ currentStage: stage, currentQuestion: question }),

    setReadyStatus: (self, partner) =>
        set({ isSelfReady: self, isPartnerReady: partner }),

    resetGame: () =>
        set({
            currentJourneySlug: null,
            currentStage: 1,
            currentQuestion: 1,
            isPartnerReady: false,
            isSelfReady: false,
        }),
}));
