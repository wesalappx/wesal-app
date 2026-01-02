import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch pricing from app_settings
        const { data: settings, error } = await supabase
            .from('app_settings')
            .select('key, value')
            .in('key', ['premium_monthly_price', 'premium_annual_price']);

        if (error) {
            console.error('Pricing fetch error:', error);
            // Return default prices if fetch fails
            return NextResponse.json({
                monthly: 29,
                annual: 249,
                currency: 'SAR'
            });
        }

        const pricing: Record<string, number> = {
            monthly: 29,
            annual: 249
        };

        settings?.forEach(s => {
            if (s.key === 'premium_monthly_price') {
                pricing.monthly = typeof s.value === 'number' ? s.value : parseInt(String(s.value));
            }
            if (s.key === 'premium_annual_price') {
                pricing.annual = typeof s.value === 'number' ? s.value : parseInt(String(s.value));
            }
        });

        return NextResponse.json({
            monthly: pricing.monthly,
            annual: pricing.annual,
            currency: 'SAR',
            savings: (pricing.monthly * 12) - pricing.annual
        });
    } catch (err) {
        console.error('Pricing API error:', err);
        return NextResponse.json({
            monthly: 29,
            annual: 249,
            currency: 'SAR'
        });
    }
}
