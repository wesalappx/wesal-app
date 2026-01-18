# وصال (Wesal) - Couples Growth App

A modern Arabic-first relationship enhancement application built with Next.js, Supabase, and AI.

## 🚀 Features

### Core Features
- **Partner Pairing** - Connect with your partner using unique codes
- **AI Coach** - Personalized relationship advice powered by Gemini AI
- **Conflict Resolution (المستشار)** - Guided AI mediation for healthy conflict resolution
- **Daily Check-ins** - Track and share moods with your partner
- **Whispers (همسة)** - Send sweet anonymous messages

### Games & Activities
- 9+ interactive games: Truth/Dare, Roulette, Compatibility, etc.
- Journeys (رحلات) - Structured couple activities
- Secret Sparks - Anonymous desire sharing

### Premium Features
- Unlimited AI sessions
- All games unlocked
- Full journey access
- Voice notes

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS, Framer Motion
- **Backend**: Supabase (Auth, Database, Realtime)
- **AI**: Google Gemini API
- **State**: Zustand
- **Testing**: Jest, React Testing Library

## 📦 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── dashboard/         # Main user dashboard
│   ├── ai-coach/          # AI coaching feature
│   ├── conflict/          # Conflict resolution
│   ├── play/              # Games hub
│   ├── journeys/          # Couple journeys
│   └── ...
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks (20+)
├── lib/                   # Utilities (Supabase, AI, etc.)
├── stores/                # Zustand state stores
└── locales/               # i18n translations (ar/en)
```

## 🏃 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/wesalappx/wesal-app.git
cd wesal-app/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and Gemini API keys

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📱 Deployment

### Vercel (Primary)
The app is deployed on Vercel with automatic deployments from the `master` branch.

### Mobile (Future)
Ready for Capacitor wrapping for iOS/Android app stores.

## 🔐 Key Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state management |
| `usePairing` | Partner connection logic |
| `useTierLimits` | Premium feature access control |
| `useNotifications` | In-app notifications |
| `usePresence` | Real-time online status |
| `useCheckIn` | Daily mood tracking |
| `useWhisper` | Anonymous messaging |

## 🌍 Internationalization

- Arabic (ar) - Primary language, RTL support
- English (en) - Secondary language

## 📄 License

Private - All rights reserved.

## 👥 Team

Built with ❤️ for Saudi couples.
