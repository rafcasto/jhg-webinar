-- ============================================================
-- Seed: Compass quiz (Q1–Q6) + content for the two new pages
-- (/registered lead-magnet gate, /referral share-to-win).
--
-- The quiz seed runs ONCE: it is skipped if the Compass quiz is already
-- present (detected by option value 'lost_job'), so admin edits survive re-runs.
-- To force a re-seed, delete the Compass questions first.
-- ============================================================

do $$
begin
if not exists (select 1 from quiz_options where value = 'lost_job') then

  -- Remove the legacy job-seeker quiz so the Compass quiz is the only one.
  delete from quiz_questions;

  -- Q1 — archetype
  with q as (
    insert into quiz_questions (position, prompt, help_text, type, scored, required, enabled)
    values (1, 'What best describes you right now?',
            'Two minutes. Your answers tailor the MasterClass to your situation.',
            'single', false, true, true)
    returning id
  )
  insert into quiz_options (question_id, position, label, value, archetype, flag, is_other)
  select id, p, l, v, a, f, o from q,
    (values
      (1,'Lost my job, need one fast','lost_job','Job Seeker',null,false),
      (2,'Employed, want a promotion/raise','promotion','Promotion Seeker',null,false),
      (3,'Employed but in the wrong role, want to change direction','wrong_role','Career Changer',null,false),
      (4,'Worried AI will disrupt my career','ai_worried','Career Changer','ai-anxious',false),
      (5,'Something else','other','Unclassified',null,true)
    ) as o(p,l,v,a,f,o);

  -- Q2 — readiness (timeline)
  with q as (
    insert into quiz_questions (position, prompt, type, scored, required, enabled)
    values (2, 'When do you want to be in your new (or next) role?', 'single', true, true, true)
    returning id
  )
  insert into quiz_options (question_id, position, label, value, readiness)
  select id, p, l, v, r from q,
    (values
      (1,'Within 60 days or sooner','lt_60',3),
      (2,'2–3 months','2_3mo',2),
      (3,'4–6 months','4_6mo',1),
      (4,'Just exploring, no timeline','exploring',0)
    ) as o(p,l,v,r);

  -- Q3 — obstacle (routing, not scored)
  with q as (
    insert into quiz_questions (position, prompt, type, scored, required, enabled)
    values (3, 'Where are you getting stuck?', 'single', false, true, true)
    returning id
  )
  insert into quiz_options (question_id, position, label, value, obstacle, is_other)
  select id, p, l, v, ob, o from q,
    (values
      (1,'Showcasing my value','value','value',false),
      (2,'Getting referrals','referrals','referrals',false),
      (3,'Getting interviews','interviews','interviews',false),
      (4,'Negotiating compensation','negotiation','negotiation',false),
      (5,'Something else','other','other',true)
    ) as o(p,l,v,ob,o);

  -- Q4 — fit gate (years of experience)
  with q as (
    insert into quiz_questions (position, prompt, type, scored, required, enabled)
    values (4, 'How many years of professional experience do you have?', 'single', false, true, true)
    returning id
  )
  insert into quiz_options (question_id, position, label, value, fit_gate, flag)
  select id, p, l, v, fg, f from q,
    (values
      (1,'Under 3','under_3','below-icp','below-icp'),
      (2,'3–5','3_5','qualified',null),
      (3,'5–10','5_10','qualified',null),
      (4,'10–15','10_15','qualified',null),
      (5,'15+','15_plus','qualified',null)
    ) as o(p,l,v,fg,f);

  -- Q5 — readiness (what they've already done)
  with q as (
    insert into quiz_questions (position, prompt, type, scored, required, enabled)
    values (5, 'What have you already done about it?', 'single', true, true, true)
    returning id
  )
  insert into quiz_options (question_id, position, label, value, readiness, flag)
  select id, p, l, v, r, f from q,
    (values
      (1,'Paid for a Job Hunting course before','paid_course',3,null),
      (2,'Paid for a Job Hunting coach / Outplacement before','paid_coach',3,'vip-signal'),
      (3,'Lots of DIY effort, no results','diy',2,null),
      (4,'A few small tweaks','tweaks',1,null),
      (5,'Nothing yet','nothing',0,null)
    ) as o(p,l,v,r,f);

  -- Q6 — open text (optional, not scored)
  insert into quiz_questions (position, prompt, help_text, type, scored, required, enabled)
  values (6, 'Anything else you want us to know?', 'Optional — one sentence is plenty.', 'text', false, false, true);

end if;
end $$;

-- ---------- Content: /registered (lead-magnet gate) ----------
insert into content_blocks (page, key, label, type, value, position) values
  ('registered','eyebrow','Eyebrow','text','YOU''RE REGISTERED',1),
  ('registered','title','Headline','text','You''re In. One Last Step.',2),
  ('registered','subtitle','Subheadline','textarea','Your seat is saved — check your inbox for the confirmation. Before you go, claim the free resource below.',3),
  ('registered','magnet_name','Lead-magnet name','text','The JobHacker Career Compass',4),
  ('registered','magnet_desc','Lead-magnet description','textarea','Answer 5 quick questions and we''ll send you a personalised game plan for your situation — plus the exact resource that fits where you''re stuck.',5),
  ('registered','cta_label','CTA button label','text','Claim My Free Compass →',6),
  ('registered','footnote','Footnote','text','Takes less than 60 seconds. Your gift arrives by email right after.',7)
on conflict (page, key) do nothing;

-- ---------- Content: /referral (share-to-win) ----------
insert into content_blocks (page, key, label, type, value, position) values
  ('referral','eyebrow','Eyebrow','text','ALL DONE 🎉',1),
  ('referral','title','Headline','text','Your Compass Is On Its Way.',2),
  ('referral','subtitle','Subheadline','textarea','Check your inbox in the next few minutes for your personalised game plan. While you wait — here''s how to unlock a free 1-to-1 call with a JobHackers mentor.',3),
  ('referral','reward_title','Reward heading','text','Refer friends. Win a 30-minute mentor call.',4),
  ('referral','reward_body','Reward body','textarea','Share your invite link (or the templated email) with people who''d benefit. When enough of them register for the MasterClass, you earn a private 30-minute call with one of our Global mentors.',5),
  ('referral','target_label','Progress label template','text','{count} of {target} referrals — {left} to go',6),
  ('referral','referral_target','Referrals needed to win the call','text','15',7),
  ('referral','share_heading','Share module heading','text','Invite someone who''s stuck too.',8),
  ('referral','success_title','Winner banner title','text','🎉 You did it — your mentor call is unlocked!',9),
  ('referral','success_body','Winner banner body','textarea','Keep an eye on your inbox — we''ll email you a link to book your free 30-minute call with a JobHackers mentor.',10),
  ('referral','cta_label','LinkedIn share button label','text','Share on LinkedIn →',11)
on conflict (page, key) do nothing;
