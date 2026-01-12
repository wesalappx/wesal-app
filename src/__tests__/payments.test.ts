/**
 * Unit tests for payment utility functions
 */

import {
    getPlanById,
    formatPrice,
    SUBSCRIPTION_PLANS,
    FREE_TIER_LIMITS,
    FREE_GAMES,
    PREMIUM_GAMES,
    FREE_JOURNEYS
} from '@/lib/payments';

describe('Payment Utilities', () => {
    describe('getPlanById', () => {
        it('should return the free plan', () => {
            const plan = getPlanById('free');
            expect(plan).toBeDefined();
            expect(plan?.id).toBe('free');
            expect(plan?.price).toBe(0);
            expect(plan?.tier).toBe('free');
        });

        it('should return the premium monthly plan', () => {
            const plan = getPlanById('premium_monthly');
            expect(plan).toBeDefined();
            expect(plan?.id).toBe('premium_monthly');
            expect(plan?.price).toBe(29);
            expect(plan?.tier).toBe('premium');
            expect(plan?.isMostPopular).toBe(true);
        });

        it('should return the premium annual plan', () => {
            const plan = getPlanById('premium_annual');
            expect(plan).toBeDefined();
            expect(plan?.id).toBe('premium_annual');
            expect(plan?.price).toBe(249);
            expect(plan?.tier).toBe('premium');
        });

        it('should return undefined for invalid plan ID', () => {
            const plan = getPlanById('invalid_plan');
            expect(plan).toBeUndefined();
        });
    });

    describe('formatPrice', () => {
        it('should format price and return non-empty string', () => {
            const formatted = formatPrice(29);
            expect(formatted).toBeDefined();
            expect(typeof formatted).toBe('string');
            // Arabic numerals are used, so check for non-empty result
            expect(formatted.length).toBeGreaterThan(2);
        });

        it('should format zero price', () => {
            const formatted = formatPrice(0);
            expect(formatted).toBeDefined();
            expect(formatted.length).toBeGreaterThan(0);
        });

        it('should format large prices', () => {
            const formatted = formatPrice(249);
            expect(formatted).toBeDefined();
            expect(formatted.length).toBeGreaterThan(3);
        });

        it('should include currency indicator', () => {
            const formatted = formatPrice(100);
            // Should contain SAR indicator (ر.س. in Arabic)
            expect(formatted).toMatch(/ر\.س\.|SAR/);
        });
    });

    describe('SUBSCRIPTION_PLANS', () => {
        it('should have exactly 3 plans', () => {
            expect(SUBSCRIPTION_PLANS).toHaveLength(3);
        });

        it('should have all required plan properties', () => {
            SUBSCRIPTION_PLANS.forEach(plan => {
                expect(plan).toHaveProperty('id');
                expect(plan).toHaveProperty('name');
                expect(plan).toHaveProperty('price');
                expect(plan).toHaveProperty('interval');
                expect(plan).toHaveProperty('tier');
                expect(plan).toHaveProperty('features');
                expect(plan.name).toHaveProperty('ar');
                expect(plan.name).toHaveProperty('en');
                expect(plan.features).toHaveProperty('ar');
                expect(plan.features).toHaveProperty('en');
            });
        });

        it('should have bilingual names and features', () => {
            const freePlan = getPlanById('free');
            expect(freePlan?.name.ar).toBe('مجاني');
            expect(freePlan?.name.en).toBe('Free');
        });
    });

    describe('FREE_TIER_LIMITS', () => {
        it('should have ai_chat limit', () => {
            expect(FREE_TIER_LIMITS.ai_chat).toBeDefined();
            expect(FREE_TIER_LIMITS.ai_chat.limit).toBe(5);
            expect(FREE_TIER_LIMITS.ai_chat.period).toBe('daily');
        });

        it('should have conflict_ai limit', () => {
            expect(FREE_TIER_LIMITS.conflict_ai).toBeDefined();
            expect(FREE_TIER_LIMITS.conflict_ai.limit).toBe(2);
            expect(FREE_TIER_LIMITS.conflict_ai.period).toBe('weekly');
        });

        it('should have whisper limit', () => {
            expect(FREE_TIER_LIMITS.whisper).toBeDefined();
            expect(FREE_TIER_LIMITS.whisper.limit).toBe(3);
            expect(FREE_TIER_LIMITS.whisper.period).toBe('weekly');
        });

        it('should have bilingual descriptions', () => {
            Object.values(FREE_TIER_LIMITS).forEach(limit => {
                expect(limit.descriptionAr).toBeDefined();
                expect(limit.descriptionEn).toBeDefined();
                expect(limit.descriptionAr.length).toBeGreaterThan(0);
                expect(limit.descriptionEn.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Game and Journey Classification', () => {
        it('should have 4 free games', () => {
            expect(FREE_GAMES).toHaveLength(4);
            expect(FREE_GAMES).toContain('would-you-rather');
            expect(FREE_GAMES).toContain('compliment-battle');
            expect(FREE_GAMES).toContain('love-roulette');
            expect(FREE_GAMES).toContain('deep-questions');
        });

        it('should have 4 premium games', () => {
            expect(PREMIUM_GAMES).toHaveLength(4);
            expect(PREMIUM_GAMES).toContain('memory-lane');
            expect(PREMIUM_GAMES).toContain('truth-or-dare');
            expect(PREMIUM_GAMES).toContain('couple-quiz');
            expect(PREMIUM_GAMES).toContain('minute-challenges');
        });

        it('should have no overlap between free and premium games', () => {
            const overlap = FREE_GAMES.filter(game => PREMIUM_GAMES.includes(game));
            expect(overlap).toHaveLength(0);
        });

        it('should have 2 free journeys', () => {
            expect(FREE_JOURNEYS).toHaveLength(2);
            expect(FREE_JOURNEYS).toContain('communication-basics');
            expect(FREE_JOURNEYS).toContain('gratitude-start');
        });
    });
});
