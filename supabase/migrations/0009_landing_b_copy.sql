-- ============================================================
-- 0009 — Variant B (landing_b) copy sync
-- landing_b was never seeded, so LandingB.jsx renders from its JSX defaults.
-- This upserts the same copy into content_blocks so: (a) any stale landing_b
-- rows created via /admin get overwritten with the aligned copy, and (b) Variant B
-- becomes editable in the Content Editor. Same message as Variant A — only the
-- layout differs. Safe to re-run (idempotent upserts).
-- ============================================================

insert into content_blocks (page, key, label, type, value, position) values
  ('landing_b','badge','Hero badge','text','FREE LIVE MASTERCLASS—with David Perry & Laurent Simon',1),
  ('landing_b','hero_title','Hero headline','text','How to Secure a Job You Love, at the Salary You Deserve',2),
  ('landing_b','hero_title_accent','Hero headline accent','text','—Without Applying Online.',3),
  ('landing_b','hero_subtitle','Hero subheadline','textarea','The free 90-minute live MasterClass for professionals stuck in limbo—job hunting, changing careers, or chasing the promotion you''ve earned. Learn the exact system 3,000+ professionals in 35 countries have used to get hired in weeks, not months.',4),
  ('landing_b','countdown_label','Countdown label','text','Next MasterClass begins in',5),
  ('landing_b','proof_strip','Proof strip (· separated)','text','3,000+ professionals coached · David Perry & Laurent Simon · 90-minute live MasterClass',6),
  ('landing_b','learn_heading','What-you''ll-learn heading','text','Each one kills the belief that''s keeping you stuck.',7),
  ('landing_b','part_1_kicker','Secret 1 kicker','text','SECRET #1',8),
  ('landing_b','part_1_title','Secret 1 title','text','Job Hacking',9),
  ('landing_b','part_1_desc','Secret 1 body','textarea','How to harness AI and our 8-step roadmap to make a good job an 8-week project—not a 12-month ordeal. For everyone thinking "I don''t know what to do."',10),
  ('landing_b','part_2_kicker','Secret 2 kicker','text','SECRET #2',11),
  ('landing_b','part_2_title','Secret 2 title','text','Success Cloning',12),
  ('landing_b','part_2_desc','Secret 2 body','textarea','How to ethically "steal" the exact path of people in your industry who''ve already landed—no reinventing yourself. For everyone thinking "I''m not good enough."',13),
  ('landing_b','part_3_kicker','Secret 3 kicker','text','SECRET #3',14),
  ('landing_b','part_3_title','Secret 3 title','text','Hidden Job Market Hack #1',15),
  ('landing_b','part_3_desc','Secret 3 body','textarea','How to get introduced directly to hiring managers before the job is ever posted—no online applications. For everyone thinking "people won''t react well if I reach out."',16),
  ('landing_b','bonus_kicker','Bonus kicker','text','LIVE-ONLY BONUS',17),
  ('landing_b','bonus_title','Bonus title','text','We''re keeping this one a secret.',18),
  ('landing_b','bonus_desc','Bonus body','textarea','Attend live and you''ll get a bonus we''re deliberately not naming. Not sent with the replay.',19),
  ('landing_b','presenters_heading','Presenters heading','text','Your MasterClass Hosts',20),
  ('landing_b','closer_heading','Closer heading','text','Don''t miss this free MasterClass.',21),
  ('landing_b','closer_sub','Closer sub-line','textarea','90 minutes that could change your career. From discouraged Job Seeker to confident JobHacker—pick the session that suits you. It runs every fortnight.',22),
  ('landing_b','cta_label','Primary CTA label (all buttons)','text','Claim Your Free Seat',23),
  ('landing_b','form_heading','Registration card heading','text','Save your seat. The live-only bonus isn''t in the replay.',24),
  ('landing_b','form_button','Registration button label','text','Save My Seat →',25)
on conflict (page, key) do update
  set value = excluded.value, updated_at = now();
