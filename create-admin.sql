-- PROMOTING A USER TO SUPER ADMIN
-- Run this in Supabase SQL Editor

-- Replace 'wesalapp.x@gmail.com' with the email of the user you want to make admin
-- The user must already exist in the Authentication > Users list

INSERT INTO public.admin_users (user_id, role, permissions)
SELECT id, 'super_admin', '{"users": true, "couples": true, "content": true, "settings": true}'::JSONB
FROM auth.users
WHERE email = 'wesalapp.x@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_admin',
    permissions = '{"users": true, "couples": true, "content": true, "settings": true}'::JSONB;
