/**
 * Unit tests for validation messages and utilities
 */

import {
    validationMessages,
    getPasswordStrength,
    validateSaudiPhone,
    validateEmail
} from '@/lib/validation-messages';

describe('Validation Messages', () => {
    describe('validationMessages', () => {
        it('should have required field message', () => {
            expect(validationMessages.required).toBeDefined();
            expect(typeof validationMessages.required).toBe('string');
        });

        it('should have email validation messages', () => {
            expect(validationMessages.email).toBeDefined();
            expect(validationMessages.emailRequired).toBeDefined();
        });

        it('should have password validation messages', () => {
            expect(validationMessages.passwordRequired).toBeDefined();
            expect(validationMessages.passwordMin).toBeDefined();
            expect(validationMessages.passwordWeak).toBeDefined();
            expect(validationMessages.passwordMedium).toBeDefined();
            expect(validationMessages.passwordStrong).toBeDefined();
            expect(validationMessages.passwordMatch).toBeDefined();
        });

        it('should have phone validation messages', () => {
            expect(validationMessages.phoneRequired).toBeDefined();
            expect(validationMessages.phoneInvalid).toBeDefined();
            expect(validationMessages.phoneSaudi).toBeDefined();
        });

        it('should have OTP messages', () => {
            expect(validationMessages.otpRequired).toBeDefined();
            expect(validationMessages.otpInvalid).toBeDefined();
            expect(validationMessages.otpExpired).toBeDefined();
        });

        it('should have dynamic min/max length functions', () => {
            expect(typeof validationMessages.minLength).toBe('function');
            expect(typeof validationMessages.maxLength).toBe('function');
            expect(validationMessages.minLength(5)).toContain('5');
            expect(validationMessages.maxLength(10)).toContain('10');
        });
    });

    describe('getPasswordStrength', () => {
        it('should return weak for short passwords', () => {
            const result = getPasswordStrength('abc');
            expect(result.score).toBeLessThanOrEqual(2);
            expect(result.color).toContain('red');
        });

        it('should return medium for moderate passwords', () => {
            const result = getPasswordStrength('Password1');
            expect(result.score).toBeGreaterThan(2);
            expect(result.score).toBeLessThanOrEqual(4);
        });

        it('should return strong for complex passwords', () => {
            const result = getPasswordStrength('MyStr0ng!Pass123');
            expect(result.score).toBeGreaterThan(4);
            expect(result.color).toContain('emerald');
        });

        it('should give points for length', () => {
            const short = getPasswordStrength('abc');
            const long = getPasswordStrength('abcdefghijkl');
            expect(long.score).toBeGreaterThan(short.score);
        });
    });

    describe('validateSaudiPhone', () => {
        it('should validate correct Saudi phone numbers', () => {
            expect(validateSaudiPhone('0512345678')).toBe(true);
            expect(validateSaudiPhone('0598765432')).toBe(true);
        });

        it('should reject invalid formats', () => {
            expect(validateSaudiPhone('1234567890')).toBe(false);
            expect(validateSaudiPhone('05123')).toBe(false);
            expect(validateSaudiPhone('051234567890')).toBe(false);
        });

        it('should handle formatted numbers', () => {
            expect(validateSaudiPhone('05-1234-5678')).toBe(true);
            expect(validateSaudiPhone('05 123 456 78')).toBe(true);
        });
    });

    describe('validateEmail', () => {
        it('should validate correct email addresses', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name@domain.org')).toBe(true);
            expect(validateEmail('user+tag@gmail.com')).toBe(true);
        });

        it('should reject invalid email addresses', () => {
            expect(validateEmail('invalid')).toBe(false);
            expect(validateEmail('missing@domain')).toBe(false);
            expect(validateEmail('@nodomain.com')).toBe(false);
            expect(validateEmail('spaces in@email.com')).toBe(false);
        });
    });
});
