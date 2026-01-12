-- ============================================
-- TEST DATA FOR SESSION FLOW DEMONSTRATION
-- Run this in Supabase SQL Editor AFTER running create_action_logs_table.sql
-- ============================================

-- Create a test user session (simulating a user journey)
INSERT INTO user_action_logs (session_id, user_id, action_type, action_name, page_path, component, duration_ms, is_error, device_info, created_at)
VALUES 
    -- Session 1: User browsing and playing a game
    ('session-demo-001', NULL, 'page_view', 'page_load', '/dashboard', NULL, 150, false, '{"browser": "Chrome", "os": "Windows"}', NOW() - INTERVAL '10 minutes'),
    ('session-demo-001', NULL, 'click', 'open_games_menu', '/dashboard', 'GamesButton', 50, false, '{"browser": "Chrome", "os": "Windows"}', NOW() - INTERVAL '9 minutes'),
    ('session-demo-001', NULL, 'api_request', 'GET /api/games-config', '/dashboard', 'GamesFetcher', 230, false, '{"browser": "Chrome", "os": "Windows"}', NOW() - INTERVAL '9 minutes'),
    ('session-demo-001', NULL, 'page_view', 'page_load', '/play', NULL, 180, false, '{"browser": "Chrome", "os": "Windows"}', NOW() - INTERVAL '8 minutes'),
    ('session-demo-001', NULL, 'click', 'select_game', '/play', 'GameCard', 30, false, '{"browser": "Chrome", "os": "Windows"}', NOW() - INTERVAL '7 minutes'),
    ('session-demo-001', NULL, 'api_request', 'POST /api/game/start', '/play', 'GameStarter', 450, false, '{"browser": "Chrome", "os": "Windows"}', NOW() - INTERVAL '7 minutes'),
    ('session-demo-001', NULL, 'page_view', 'page_load', '/game-session', NULL, 200, false, '{"browser": "Chrome", "os": "Windows"}', NOW() - INTERVAL '6 minutes'),
    ('session-demo-001', NULL, 'game', 'round_completed', '/game-session', 'GameRound', 5000, false, '{"browser": "Chrome", "os": "Windows"}', NOW() - INTERVAL '5 minutes'),
    ('session-demo-001', NULL, 'game', 'game_finished', '/game-session', 'GameSession', 120, false, '{"browser": "Chrome", "os": "Windows"}', NOW() - INTERVAL '4 minutes'),

    -- Session 2: User with an error
    ('session-demo-002', NULL, 'page_view', 'page_load', '/dashboard', NULL, 100, false, '{"browser": "Safari", "os": "iOS"}', NOW() - INTERVAL '30 minutes'),
    ('session-demo-002', NULL, 'click', 'upgrade_button', '/dashboard', 'UpgradePrompt', 20, false, '{"browser": "Safari", "os": "iOS"}', NOW() - INTERVAL '29 minutes'),
    ('session-demo-002', NULL, 'page_view', 'page_load', '/settings/upgrade', NULL, 250, false, '{"browser": "Safari", "os": "iOS"}', NOW() - INTERVAL '28 minutes'),
    ('session-demo-002', NULL, 'subscription', 'start_checkout', '/settings/upgrade', 'CheckoutButton', 50, false, '{"browser": "Safari", "os": "iOS"}', NOW() - INTERVAL '27 minutes'),
    ('session-demo-002', NULL, 'api_request', 'POST /api/payments/create', '/settings/upgrade', 'PaymentProcessor', 3000, false, '{"browser": "Safari", "os": "iOS"}', NOW() - INTERVAL '27 minutes'),
    ('session-demo-002', NULL, 'error', 'payment_failed', '/settings/upgrade', 'PaymentProcessor', NULL, true, '{"browser": "Safari", "os": "iOS"}', NOW() - INTERVAL '26 minutes'),

    -- Session 3: Admin actions
    ('session-demo-003', NULL, 'auth', 'admin_login', '/admin/login', 'LoginForm', 500, false, '{"browser": "Chrome", "os": "macOS"}', NOW() - INTERVAL '1 hour'),
    ('session-demo-003', NULL, 'page_view', 'page_load', '/admin', NULL, 300, false, '{"browser": "Chrome", "os": "macOS"}', NOW() - INTERVAL '59 minutes'),
    ('session-demo-003', NULL, 'admin', 'view_couples', '/admin/couples', 'CouplesTable', 400, false, '{"browser": "Chrome", "os": "macOS"}', NOW() - INTERVAL '58 minutes'),
    ('session-demo-003', NULL, 'admin', 'grant_premium', '/admin/couples', 'GrantPremiumButton', 800, false, '{"browser": "Chrome", "os": "macOS"}', NOW() - INTERVAL '57 minutes'),
    ('session-demo-003', NULL, 'api_response', 'POST /api/admin/couples/grant-premium', '/admin/couples', 'GrantPremiumAPI', 350, false, '{"browser": "Chrome", "os": "macOS"}', NOW() - INTERVAL '57 minutes');

-- Update error details for the payment failure
UPDATE user_action_logs 
SET error_message = 'Payment gateway timeout - connection refused',
    error_code = 'PAYMENT_GATEWAY_ERROR'
WHERE action_name = 'payment_failed' AND session_id = 'session-demo-002';

-- Verify the data
SELECT 
    session_id,
    COUNT(*) as action_count,
    COUNT(CASE WHEN is_error THEN 1 END) as error_count,
    MIN(created_at) as session_start,
    MAX(created_at) as session_end
FROM user_action_logs
GROUP BY session_id
ORDER BY session_start DESC;
