-- Check if streaks exist for the couple
SELECT s.*, c.partner1_id, c.partner2_id 
FROM streaks s
JOIN couples c ON c.id = s.couple_id
WHERE c.status = 'ACTIVE';

-- Also check what's the current user's couple
-- (Run after getting user ID from auth session)
