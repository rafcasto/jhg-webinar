-- =============================================================
-- 0012 — Align funnel copy to the real lead magnet
-- =============================================================
-- The deliverable people receive after the quiz is the Notion playbook
-- "Find Your Target Role in 5 Prompts" — not a "Career Compass / game plan".
-- This aligns the user-facing promise on /registered and /referral.
--
-- Each UPDATE is guarded on the previous seeded value (from 0011) so that
-- any copy edited by hand in the admin Content Editor is left untouched.
-- (Internal engine naming — compute_compass, the QUIZ_COMPLETE tag, etc. —
--  is intentionally NOT renamed; this is lead-facing copy only.)
-- =============================================================

-- ---------- /registered (lead-magnet gate) ----------
update content_blocks set value = 'Find Your Target Role in 5 Prompts'
 where page = 'registered' and key = 'magnet_name'
   and value = 'The JobHacker Career Compass';

update content_blocks set value = 'Answer 5 quick questions and we''ll send you the copy-paste AI prompts that turn "I don''t know what to do" into a shortlist of best-fit roles — in under an hour.'
 where page = 'registered' and key = 'magnet_desc'
   and value = 'Answer 5 quick questions and we''ll send you a personalised game plan for your situation — plus the exact resource that fits where you''re stuck.';

update content_blocks set value = 'Send Me The 5 Prompts →'
 where page = 'registered' and key = 'cta_label'
   and value = 'Claim My Free Compass →';

-- ---------- /referral (share-to-win) ----------
update content_blocks set value = 'Your 5 Prompts Are On Their Way.'
 where page = 'referral' and key = 'title'
   and value = 'Your Compass Is On Its Way.';

update content_blocks set value = 'Check your inbox in the next few minutes for your copy-paste prompt playbook. While you wait — here''s how to unlock a free 1-to-1 call with a JobHackers mentor.'
 where page = 'referral' and key = 'subtitle'
   and value = 'Check your inbox in the next few minutes for your personalised game plan. While you wait — here''s how to unlock a free 1-to-1 call with a JobHackers mentor.';
