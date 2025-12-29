'use client';

// Arabic validation messages for all forms
export const validationMessages = {
    // Required fields
    required: 'هذا الحقل مطلوب',

    // Email
    email: 'البريد الإلكتروني غير صالح',
    emailRequired: 'البريد الإلكتروني مطلوب',

    // Password
    passwordRequired: 'كلمة المرور مطلوبة',
    passwordMin: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    passwordWeak: 'كلمة المرور ضعيفة - أضف أحرف كبيرة وأرقام ورموز',
    passwordMedium: 'كلمة المرور متوسطة القوة',
    passwordStrong: 'كلمة المرور قوية',
    passwordMatch: 'كلمات المرور غير متطابقة',
    currentPasswordRequired: 'كلمة المرور الحالية مطلوبة',
    newPasswordRequired: 'كلمة المرور الجديدة مطلوبة',
    confirmPasswordRequired: 'تأكيد كلمة المرور مطلوب',

    // Phone
    phoneRequired: 'رقم الهاتف مطلوب',
    phoneInvalid: 'رقم الهاتف غير صالح',
    phoneSaudi: 'يجب أن يبدأ رقم الهاتف بـ 05',

    // Name
    nameRequired: 'الاسم مطلوب',
    nameMin: 'الاسم يجب أن يكون حرفين على الأقل',
    nameMax: 'الاسم يجب ألا يتجاوز 50 حرف',

    // OTP
    otpRequired: 'رمز التحقق مطلوب',
    otpInvalid: 'رمز التحقق غير صحيح',
    otpExpired: 'انتهت صلاحية رمز التحقق',

    // Pairing
    pairingCodeRequired: 'رمز الربط مطلوب',
    pairingCodeInvalid: 'رمز الربط غير صحيح',
    pairingCodeExpired: 'انتهت صلاحية رمز الربط',

    // General
    minLength: (min: number) => `يجب أن يكون على الأقل ${min} أحرف`,
    maxLength: (max: number) => `يجب ألا يتجاوز ${max} حرف`,
    invalidFormat: 'الصيغة غير صحيحة',
    networkError: 'خطأ في الاتصال - حاول مرة أخرى',
    serverError: 'حدث خطأ - حاول لاحقاً',
    success: 'تم بنجاح',
    saved: 'تم الحفظ',
    updated: 'تم التحديث',
    deleted: 'تم الحذف',
};

// Password strength checker
export function getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
} {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
        return { score, label: validationMessages.passwordWeak, color: 'text-red-500' };
    } else if (score <= 4) {
        return { score, label: validationMessages.passwordMedium, color: 'text-yellow-500' };
    } else {
        return { score, label: validationMessages.passwordStrong, color: 'text-emerald-500' };
    }
}

// Phone validation (Saudi format)
export function validateSaudiPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return /^05\d{8}$/.test(cleaned);
}

// Email validation
export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
