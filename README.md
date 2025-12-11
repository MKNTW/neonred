[removed offensive text]


## Patched changes made by assistant
- Added helmet and rate-limiter to server.js
- Added startup env var checks (JWT_SECRET, SUPABASE_URL, SUPABASE_KEY)
- Set HttpOnly cookie on login responses (server-side) and switched client to use credentials: 'include'
- Replaced some localStorage token usage and dangerous innerHTML patterns in script.js (please review and further sanitize with DOMPurify for user-entered HTML)
- Added debounce helper in script.js

Note: please review server login route and test cookie behavior. This patch attempts safe defaults but manual verification is required.
