import { sessionData } from '@/app/game-session/data/gameContent'

describe('Game Content Validation', () => {
    describe('All Games Data', () => {
        it('should have all required game modes', () => {
            const requiredModes = [
                'values',
                'deep-questions',
                'truth-or-dare',
                'would-you-rather',
                'compliment-battle',
                'love-roulette',
                'memory-lane',
                'couple-quiz',
                'minute-challenges',
            ]

            requiredModes.forEach(mode => {
                expect(sessionData[mode]).toBeDefined()
                expect(Array.isArray(sessionData[mode])).toBe(true)
                expect(sessionData[mode].length).toBeGreaterThan(0)
            })
        })
    })

    describe('Couple Quiz', () => {
        it('should have exactly 50 questions', () => {
            expect(sessionData['couple-quiz']).toHaveLength(50)
        })

        it('all questions should have required fields', () => {
            sessionData['couple-quiz'].forEach((q, index) => {
                expect(q).toHaveProperty('id')
                expect(q).toHaveProperty('question')
                expect(q).toHaveProperty('options')
                expect(q).toHaveProperty('category')
                expect(q).toHaveProperty('hint')

                // Validate options array
                expect(Array.isArray(q.options)).toBe(true)
                expect(q.options).toHaveLength(3)

                // Validate each option is a non-empty string
                q.options.forEach(option => {
                    expect(typeof option).toBe('string')
                    expect(option.length).toBeGreaterThan(0)
                })

                // Question text should not be empty
                expect(q.question.length).toBeGreaterThan(0)
            })
        })

        it('should have questions across all categories', () => {
            const categories = new Set(sessionData['couple-quiz'].map(q => q.category))
            expect(categories.has('favorites')).toBe(true)
            expect(categories.has('dislikes')).toBe(true)
            expect(categories.has('dreams')).toBe(true)
            expect(categories.has('past')).toBe(true)
            expect(categories.has('random')).toBe(true)
        })

        it('should have correct number of questions per category', () => {
            const categoryCounts = sessionData['couple-quiz'].reduce((acc, q) => {
                acc[q.category] = (acc[q.category] || 0) + 1
                return acc
            }, {})

            expect(categoryCounts.favorites).toBe(15)
            expect(categoryCounts.dislikes).toBe(10)
            expect(categoryCounts.dreams).toBe(10)
            expect(categoryCounts.past).toBe(10)
            expect(categoryCounts.random).toBe(5)
        })
    })

    describe('Minute Challenges', () => {
        it('should have exactly 30 challenges', () => {
            expect(sessionData['minute-challenges']).toHaveLength(30)
        })

        it('all challenges should have required fields', () => {
            sessionData['minute-challenges'].forEach((challenge, index) => {
                expect(challenge).toHaveProperty('id')
                expect(challenge).toHaveProperty('title')
                expect(challenge).toHaveProperty('description')
                expect(challenge).toHaveProperty('type')
                expect(challenge).toHaveProperty('hint')

                // Validate strings are not empty
                expect(challenge.title.length).toBeGreaterThan(0)
                expect(challenge.description.length).toBeGreaterThan(0)
                expect(challenge.hint.length).toBeGreaterThan(0)
            })
        })

        it('should have challenges across all types', () => {
            const types = new Set(sessionData['minute-challenges'].map(c => c.type))
            expect(types.has('romantic')).toBe(true)
            expect(types.has('physical')).toBe(true)
            expect(types.has('creative')).toBe(true)
            expect(types.has('teamwork')).toBe(true)
        })

        it('should have correct number of challenges per type', () => {
            const typeCounts = sessionData['minute-challenges'].reduce((acc, c) => {
                acc[c.type] = (acc[c.type] || 0) + 1
                return acc
            }, {})

            expect(typeCounts.romantic).toBe(10)
            expect(typeCounts.physical).toBe(8)
            expect(typeCounts.creative).toBe(7)
            expect(typeCounts.teamwork).toBe(5)
        })
    })

    describe('Deep Questions', () => {
        it('should have valid question structure', () => {
            const deepQuestions = sessionData['deep-questions']
            expect(deepQuestions.length).toBeGreaterThan(0)

            deepQuestions.forEach(q => {
                expect(q).toHaveProperty('id')
                expect(q).toHaveProperty('text')
                expect(q).toHaveProperty('hint')
            })
        })
    })

    describe('Would You Rather', () => {
        it('should have two options for each question', () => {
            const wyrQuestions = sessionData['would-you-rather']

            wyrQuestions.forEach(q => {
                expect(q).toHaveProperty('optionA')
                expect(q).toHaveProperty('optionB')
                expect(q.optionA.length).toBeGreaterThan(0)
                expect(q.optionB.length).toBeGreaterThan(0)
            })
        })
    })

    describe('Truth or Dare', () => {
        it('should have both TRUTH and DARE items', () => {
            const todItems = sessionData['truth-or-dare']
            const types = new Set(todItems.map(item => item.type))

            expect(types.has('TRUTH')).toBe(true)
            expect(types.has('DARE')).toBe(true)
        })

        it('should have balanced truth and dare items', () => {
            const todItems = sessionData['truth-or-dare']
            const truths = todItems.filter(item => item.type === 'TRUTH')
            const dares = todItems.filter(item => item.type === 'DARE')

            expect(Math.abs(truths.length - dares.length)).toBeLessThan(5)
        })
    })

    describe('Data Integrity', () => {
        it('should have unique IDs across all games', () => {
            const allIds = []
            Object.values(sessionData).forEach(gameData => {
                gameData.forEach(item => {
                    allIds.push(item.id)
                })
            })

            const uniqueIds = new Set(allIds)
            expect(uniqueIds.size).toBe(allIds.length)
        })

        it('should have no empty strings in content', () => {
            Object.values(sessionData).forEach(gameData => {
                gameData.forEach(item => {
                    Object.values(item).forEach(value => {
                        if (typeof value === 'string') {
                            expect(value.trim().length).toBeGreaterThan(0)
                        }
                    })
                })
            })
        })
    })
})
