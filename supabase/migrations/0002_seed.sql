-- ============================================================
-- Seed: JobHackers job-seeker quiz, landing/thank-you content, CTAs.
-- Idempotent: each question is keyed by position; safe to re-run.
-- ============================================================

-- Q1 — situation / urgency
with q as (
  insert into quiz_questions (position, prompt, help_text, type, scored)
  select 1, 'Where are you in your job search right now?',
         'Please take 20 seconds to answer a few quick questions:', 'single', true
  where not exists (select 1 from quiz_questions where position = 1)
  returning id
)
insert into quiz_options (question_id, position, label, value, score)
select id, p, l, v, s from q,
  (values (1,'Recently laid off / between roles','between_roles',25),
          (2,'Applying but getting no traction','no_traction',22),
          (3,'Employed but want out','want_out',15),
          (4,'Exploring a career change','career_change',15),
          (5,'Just starting to think about it','early',5)) as o(p,l,v,s);

-- Q2 — timeline
with q as (
  insert into quiz_questions (position, prompt, type, scored)
  select 2, 'How soon do you need to land your next role?', 'single', true
  where not exists (select 1 from quiz_questions where position = 2)
  returning id
)
insert into quiz_options (question_id, position, label, value, score)
select id, p, l, v, s from q,
  (values (1,'ASAP / within 30 days','asap',25),
          (2,'1 to 3 months','1_3_months',20),
          (3,'3 to 6 months','3_6_months',10),
          (4,'Just exploring','exploring',3)) as o(p,l,v,s);

-- Q3 — biggest obstacle (drives archetype)
with q as (
  insert into quiz_questions (position, prompt, type, scored)
  select 3, 'What''s holding your search back the most?', 'single', true
  where not exists (select 1 from quiz_questions where position = 3)
  returning id
)
insert into quiz_options (question_id, position, label, value, score, archetype)
select id, p, l, v, s, a from q,
  (values (1,'I''m not getting interviews','no_interviews',12,'The Overlooked'),
          (2,'I get interviews but no offers','no_offers',12,'The Almost'),
          (3,'I don''t know how to network / hidden market','networking',10,'The Connector'),
          (4,'My LinkedIn/resume isn''t landing','positioning',10,'The Positioner'),
          (5,'I''m not sure what role I want','direction',8,'The Explorer'),
          (6,'I struggle to negotiate salary','negotiation',8,'The Undersold')) as o(p,l,v,s,a);

-- Q4 — level / value
with q as (
  insert into quiz_questions (position, prompt, type, scored)
  select 4, 'What best describes your level?', 'single', true
  where not exists (select 1 from quiz_questions where position = 4)
  returning id
)
insert into quiz_options (question_id, position, label, value, score)
select id, p, l, v, s from q,
  (values (1,'Executive / Director','executive',25),
          (2,'Senior / Manager','senior',20),
          (3,'Mid-level professional','mid',15),
          (4,'Early career','early_career',8),
          (5,'Student / entry','student',3)) as o(p,l,v,s);

-- Q5 — readiness to invest
with q as (
  insert into quiz_questions (position, prompt, type, scored)
  select 5, 'How ready are you to invest in a proven system to get hired faster?', 'single', true
  where not exists (select 1 from quiz_questions where position = 5)
  returning id
)
insert into quiz_options (question_id, position, label, value, score)
select id, p, l, v, s from q,
  (values (1,'Ready to invest now','ready_now',30),
          (2,'Open if it''s the right fit','open',15),
          (3,'Just want the free workshop','free_only',3)) as o(p,l,v,s);

-- Q6 — attribution (not scored)
with q as (
  insert into quiz_questions (position, prompt, type, scored)
  select 6, 'How did you first hear about this workshop?', 'single', false
  where not exists (select 1 from quiz_questions where position = 6)
  returning id
)
insert into quiz_options (question_id, position, label, value, score)
select id, p, l, v, 0 from q,
  (values (1,'Instagram','instagram'),
          (2,'YouTube','youtube'),
          (3,'Podcast','podcast'),
          (4,'LinkedIn','linkedin'),
          (5,'Google search','google'),
          (6,'Word of mouth','word_of_mouth'),
          (7,'Other','other')) as o(p,l,v);

-- ---------- Editable content blocks ----------
insert into content_blocks (page, key, label, type, value, position) values
  ('landing','hero_eyebrow','Hero eyebrow / series title','text','The New Rules of Getting Hired Masterclass',1),
  ('landing','hero_title','Hero headline','text','You Did Everything Right. The Rules Changed Anyway.',2),
  ('landing','hero_subtitle','Hero subheadline','textarea','The free fortnightly masterclass for professionals who are stuck — whether you''re job hunting, changing careers, or chasing the promotion you''ve earned. Learn how to get understood and chosen in a job market that quietly rewrote the rules. With David Perry & Laurent Simon.',3),
  ('landing','benefit_1','Hero benefit 1','text','Get a clear lane the market understands in seconds',4),
  ('landing','benefit_2','Hero benefit 2','text','Turn your experience into proof that gets you chosen',5),
  ('landing','benefit_3','Hero benefit 3','text','Walk away with a system — not just more applications',6),
  ('landing','hero_prize','Prize / giveaway hook','text','Live on the call: one attendee gets a free résumé + LinkedIn teardown.',7),
  ('landing','logo_strip','Logo bar caption','text','As featured in',8),
  ('landing','problem_heading','Problem heading','text','The Problem Isn''t You. It''s How the Market Reads You.',9),
  ('landing','problem_1_title','Problem 1 title','text','You''re blurry.',10),
  ('landing','problem_1_desc','Problem 1 body','textarea','You''re qualified, but the market can''t tell what you do or where you fit — so you get filtered out, undervalued, or ignored.',11),
  ('landing','problem_2_title','Problem 2 title','text','You''re applying into the void.',12),
  ('landing','problem_2_desc','Problem 2 body','textarea','Volume and hope. Endless applications, generic résumés, and silence back. That''s panic with Wi-Fi — not a strategy.',13),
  ('landing','problem_3_title','Problem 3 title','text','You sound like everyone else.',14),
  ('landing','problem_3_desc','Problem 3 body','textarea','"Experienced professional with strong communication skills." Your profile blurs into a thousand lookalikes the moment AI flooded the market.',15),
  ('landing','who_heading','Who-is-it-for heading','text','Who Is It For',16),
  ('landing','who_intro','Who-is-it-for intro','text','Whatever "stuck" looks like for you, the fix starts the same way — clarity.',17),
  ('landing','who_1_title','Audience 1 title','text','The Job Seeker',18),
  ('landing','who_1_desc','Audience 1 body','textarea','You lost your job and need to land fast. You''ve been applying for months with no traction, stuck in limbo.',19),
  ('landing','who_1_em','Audience 1 payoff','text','You''ll learn how to compress your time-to-value and get hired sooner.',20),
  ('landing','who_2_title','Audience 2 title','text','The Career Changer',21),
  ('landing','who_2_desc','Audience 2 body','textarea','You feel stuck in the wrong role and you''re ready to reinvent — to pivot into work that delivers more value and sits closer to what drives you.',22),
  ('landing','who_2_em','Audience 2 payoff','text','You''ll learn how to reposition your experience for a new lane the market will pay for.',23),
  ('landing','who_3_title','Audience 3 title','text','The Promotion Seeker',24),
  ('landing','who_3_desc','Audience 3 body','textarea','You''re employed but underpaid and under-promoted. You want the raise and title where you are — or a better deal elsewhere.',25),
  ('landing','who_3_em','Audience 3 payoff','text','You''ll learn how to prove your value and negotiate like a pro.',26),
  ('landing','method_heading','Method heading','text','The Method',27),
  ('landing','method_subline','Method sub-line','text','Clarity → Proof → System',28),
  ('landing','method_1_title','Method step 1 title','text','Find your lane.',29),
  ('landing','method_1_desc','Method step 1 body','textarea','State what you do in one sentence the market instantly understands. Your lane isn''t a prison cell — it''s a firing position.',30),
  ('landing','method_2_title','Method step 2 title','text','Follow the pain to the paycheck.',31),
  ('landing','method_2_desc','Method step 2 body','textarea','Map your skills to the expensive problems employers actually pay to solve.',32),
  ('landing','method_3_title','Method step 3 title','text','Build proof.',33),
  ('landing','method_3_desc','Method step 3 body','textarea','Convert vague skills into believable evidence: skill + situation + result. Proof beats claim.',34),
  ('landing','method_4_title','Method step 4 title','text','Signal "operator."',35),
  ('landing','method_4_desc','Method step 4 body','textarea','Rebuild your résumé and LinkedIn so recruiters find you and read "operator," not "applicant."',36),
  ('landing','method_5_title','Method step 5 title','text','Run the system.',37),
  ('landing','method_5_desc','Method step 5 body','textarea','Your Mission Card, pipeline dashboard, and weekly reset — momentum protected by rhythm, not hope.',38),
  ('landing','get_heading','You-will-get heading','text','You Will Get',39),
  ('landing','get_1','You will get — item 1','text','Your one-sentence lane',40),
  ('landing','get_2','You will get — item 2','text','A pain-to-paycheck map of your skills',41),
  ('landing','get_3','You will get — item 3','text','The proof-bullet formula (skill + situation + result)',42),
  ('landing','get_4','You will get — item 4','text','Recruiter-ready résumé & LinkedIn fixes',43),
  ('landing','get_5','You will get — item 5','text','The Mission Card operating template',44),
  ('landing','bonus_heading','Bonus heading','text','The Bonus',45),
  ('landing','bonus_body','Bonus body','textarea','Register and you''ll get the JobHacker Mission Card — the one-page operating system that turns a chaotic job hunt into a disciplined campaign: daily non-negotiables, a pipeline dashboard, and a weekly reset.',46),
  ('landing','hero_quote','Hero quote','textarea','3 job offers in about 30 days… and a $60,000 raise! Hands down the best decision I''ve made.',47),
  ('landing','hero_quote_attr','Hero quote attribution','text','Bill Gibbs, Sales & Marketing Executive 🇺🇸',48),
  ('landing','event_date','Event date (fallback)','text','Wed 19 August 2026',49),
  ('landing','event_time','Event time (fallback)','text','9:00 AM NZST',50),
  ('landing','event_location','Event location','text','Online · Zoom',51),
  ('landing','biz_heading','Business-for-good heading','text','Business for Good',52),
  ('landing','biz_body','Business-for-good body','textarea','JobHackers exists to put clarity and confidence back in the hands of people the market overlooked. A share of every program goes toward helping job seekers who can''t yet afford support — because everyone deserves to be understood and chosen.',53),
  ('landing','action_statement_title','Take-action heading','text','The market changed the rules. Learn the new ones.',54),
  ('landing','action_statement','Take-action statement','textarea','Hope is not a strategy. Drift is not a strategy. Volume is not a strategy. Your next session starts soon.',55),
  ('landing','cta_label','Primary CTA label (all buttons)','text','Save My Seat',56),
  ('landing','register_title','Signup modal title','text','Save my seat',57),
  ('landing','video_url','Hero video URL','url','',58),
  ('quiz','intro','Quiz intro line','text','Please take 20 seconds to answer a few quick questions:',1),
  ('thankyou','title','Thank-you headline','text','You''re in! 🎉 Now watch this short video',1),
  ('thankyou','subtitle','Thank-you subheadline','textarea','Here''s how to get the most out of the workshop — complete the 3 quick steps below.',2),
  ('thankyou','video_url','Thank-you video URL','url','',3),
  ('thankyou','steps_title','Next steps title','text','Complete your next steps 👇',4)
on conflict (page, key) do nothing;

-- ---------- CTAs ----------
insert into ctas (page, slot, label, sublabel, url, icon, style, position) values
  ('thankyou','card_1','Add to your calendar','Lock in your seat so you don''t miss it','#','📅','primary',1),
  ('thankyou','card_2','Get the free JobHacking playbook','The 7-step done-for-you templates (PDF)','https://jobhackers.global','📘','primary',2),
  ('thankyou','card_3','Join the community','Meet other job hackers on Meetup','https://www.meetup.com/job-hackers-global/','🤝','primary',3),
  ('landing','primary','Save My Seat',null,'#register','→','primary',1)
on conflict (page, slot) do nothing;
