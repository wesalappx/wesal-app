import type { Metadata, Viewport } from 'next';
import { Almarai } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const almarai = Almarai({
    subsets: ['arabic'],
    weight: ['300', '400', '700', '800'],
    variable: '--font-almarai',
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export const metadata: Metadata = {
    title: 'وصال | Wesal',
    description: 'تطبيق وصال - لتعزيز العلاقة والمودة بين الأزواج',
    keywords: ['زواج', 'حب', 'علاقة', 'لعبة', 'تواصل', 'وصال'],
    authors: [{ name: 'فريق وصال' }],
    icons: {
        icon: '/favicon.svg',
        shortcut: '/favicon.svg',
        apple: '/favicon.svg',
    },
    openGraph: {
        title: 'تطبيق وصال',
        description: 'مساحتكم الخاصة للحب والتواصل واللعب',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl" className="dark">
            <body className={`${almarai.variable} font-sans`}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}

