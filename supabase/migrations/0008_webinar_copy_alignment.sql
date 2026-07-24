-- ============================================================
-- 0008 — Webinar copy alignment (3 Secrets + 8-step roadmap)
-- Overwrites the OLD seeded content_blocks/ctas so the live site stops
-- showing the pre-alignment copy. Safe to re-run (idempotent upserts).
--
-- Apply: `supabase db push`  OR paste into Supabase Studio → SQL editor.
-- Note: `landing_b` has no seeded rows — Variant B renders from JSX defaults,
-- so it needs a redeploy, not a DB change.
-- ============================================================

-- ---------- content_blocks: upsert new values, insert new keys ----------
insert into content_blocks (page, key, label, type, value, position) values
  ('landing','hero_eyebrow','Hero eyebrow / series title','text','FREE LIVE MASTERCLASS—with David Perry & Laurent Simon',1),
  ('landing','hero_title','Hero headline','text','How to Secure a Job You Love, at the Salary You Deserve—Without Applying Online',2),
  ('landing','hero_subtitle','Hero subheadline','textarea','The free 90-minute live MasterClass for professionals stuck in limbo—job hunting, changing careers, or chasing the promotion you''ve earned. Learn the exact system 3,000+ professionals in 35 countries have used to get hired in weeks, not months.',3),
  ('landing','problem_1_desc','Problem 1 body','textarea','You''re qualified, but the market can''t tell what you do or where you fit—so you get filtered out, undervalued, or ignored.',11),
  ('landing','problem_2_desc','Problem 2 body','textarea','Volume and hope. Endless applications, generic résumés, and silence back. That''s panic with Wi-Fi—not a strategy.',13),
  ('landing','who_intro','Who-is-it-for intro','text','Whatever "stuck" looks like for you, the way out starts the same place—the 3 Secrets.',17),
  ('landing','who_1_title','Audience 1 title','text','The Dreamer',18),
  ('landing','who_1_desc','Audience 1 body','textarea','Overwhelmed and unsure what the first step even is.',19),
  ('landing','who_1_em','Audience 1 payoff','text','You''ll leave with the exact starting sequence—no more guessing.',20),
  ('landing','who_2_title','Audience 2 title','text','The Wanderer',21),
  ('landing','who_2_desc','Audience 2 body','textarea','You started—then got stuck or lost momentum.',22),
  ('landing','who_2_em','Audience 2 payoff','text','You''ll leave knowing precisely what to fix next, and in what order.',23),
  ('landing','who_3_title','Audience 3 title','text','The Doer',24),
  ('landing','who_3_desc','Audience 3 body','textarea','Big effort, little to show for it. Applications out, silence back.',25),
  ('landing','who_3_em','Audience 3 payoff','text','You''ll leave knowing where your hours actually pay.',26),
  ('landing','method_heading','Method heading','text','The 3 Secrets You''ll Learn Live',27),
  ('landing','method_subline','Method sub-line','text','Each one kills the belief that''s keeping you stuck.',28),
  ('landing','method_1_title','Secret 1 title','text','Secret #1—Job Hacking.',29),
  ('landing','method_1_desc','Secret 1 body','textarea','How to harness AI and our 8-step roadmap to make a good job an 8-week project—not a 12-month ordeal. For everyone thinking "I don''t know what to do."',30),
  ('landing','method_2_title','Secret 2 title','text','Secret #2—Success Cloning.',31),
  ('landing','method_2_desc','Secret 2 body','textarea','How to ethically "steal" the exact path of people in your industry who''ve already landed—no reinventing yourself. For everyone thinking "I''m not good enough."',32),
  ('landing','method_3_title','Secret 3 title','text','Secret #3—Hidden Job Market Hack #1.',33),
  ('landing','method_3_desc','Secret 3 body','textarea','How to get introduced directly to hiring managers before the job is ever posted—no online applications. For everyone thinking "people won''t react well if I reach out."',34),
  ('landing','get_1','You will get — item 1','text','The 3 Secrets—Job Hacking, Success Cloning, and Hidden Job Market Hack #1',40),
  ('landing','get_2','You will get — item 2','text','The 8-step JobHacking roadmap that turns your search into an 8-week project',41),
  ('landing','get_3','You will get — item 3','text','Why the hidden job market (70–80% of roles) is where offers actually come from',42),
  ('landing','get_4','You will get — item 4','text','What dedicated JobHackers do differently to land in 3–8 weeks vs the 26-week US average',43),
  ('landing','get_5','You will get — item 5','text','Live Q&A with David & Laurent—bring your real situation',44),
  ('landing','bonus_heading','Bonus heading','text','There''s a bonus. We''re not telling you what it is.',45),
  ('landing','bonus_body','Bonus body','textarea','Show up live and you''ll get something we''re deliberately keeping off this page. It''s for live attendees only—it doesn''t go out with the replay—and you''ll understand why the moment you see it.',46),
  ('landing','biz_body','Business-for-good body','textarea','JobHackers exists to put clarity and confidence back in the hands of people the market overlooked. A share of every program goes toward helping job seekers who can''t yet afford support—because everyone deserves to be understood and chosen.',53),
  ('landing','action_statement','Take-action statement','textarea','The average US job search runs about 26 weeks. Every month it drags on is a month of salary you never get back. One free 90-minute MasterClass could change that math.',55),
  ('landing','identity_arc','Take-action identity line','text','From discouraged Job Seeker to confident JobHacker.',56),
  ('landing','form_heading','Registration card heading','text','Save your seat. The live-only bonus isn''t in the replay.',102),
  ('landing','form_button','Registration button label','text','Save My Seat →',103),
  ('thankyou','title','Thank-you headline','text','You''re in. One more move locks it in.',1),
  ('thankyou','subtitle','Thank-you subheadline','textarea','Registrants who do the two steps below are the ones who show up live—and the ones who show up get the results.',2),
  ('thankyou','welcome_quote','Founder welcome quote (video fallback)','textarea','We built this MasterClass for professionals doing everything "right" and hearing nothing back. Bring your real situation—we''ll bring the system 3,000+ professionals have used to get hired in weeks, not months. See you live.',5),
  ('thankyou','share_heading','Share module heading','text','Someone in your network is stuck too.',10),
  ('thankyou','share_private','Share module — private path','text','Know one person stuck in their search? Send them your seat link.',11),
  ('thankyou','community_label','Community card label','text','Join the JobHackers community',12),
  ('thankyou','community_sublabel','Community card sublabel','text','4.5★ from 93 reviews—meet the people running the same playbook.',13)
on conflict (page, key) do update
  set value = excluded.value, updated_at = now();

-- ---------- content_blocks: remove keys no longer used ----------
-- Method is now 3 Secrets (not a 5-step method) — drop steps 4 & 5.
delete from content_blocks
  where page = 'landing' and key in ('method_4_title','method_4_desc','method_5_title','method_5_desc');

-- ---------- ctas (thank-you): calendar / community copy + drop stale playbook ----------
update ctas set sublabel = 'Locks the time—and the people who add it are the ones who show up.'
  where page = 'thankyou' and slot = 'card_1';

update ctas set label = 'Join the JobHackers community',
                sublabel = '4.5★ from 93 reviews—meet the people running the same playbook.'
  where page = 'thankyou' and slot = 'card_3';

-- Stale "Get the free JobHacking playbook (7-step…)" card — the bonus is now a
-- live-only mystery reveal, and the thank-you flow is calendar → share → community.
delete from ctas where page = 'thankyou' and slot = 'card_2';
