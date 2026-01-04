import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Public API to get active offers for the upgrade page
export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch active offers that are currently valid
        const { data: offers, error } = await supabase
            .from('special_offers')
            .select('id, name, discount_percent, valid_until, code')
            .eq('is_active', true)
            .gte('valid_until', new Date().toISOString())
            .order('discount_percent', { ascending: false });

        if (error) {
            console.error('Offers fetch error:', error);
            return NextResponse.json({ offers: [] });
        }

        return NextResponse.json({
            offers: offers || [],
            hasActiveOffer: (offers?.length || 0) > 0,
            bestOffer: offers?.[0] || null
        });
    } catch (err) {
        console.error('Offers API error:', err);
        return NextResponse.json({ offers: [], hasActiveOffer: false });
    }
}
