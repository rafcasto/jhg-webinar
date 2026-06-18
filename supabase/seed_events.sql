-- Bootstrap webinar_events from live Zoom occurrences (one-off).
-- Run once so the site shows real dates before zoom-sync is scheduled.
-- Idempotent via unique (zoom_meeting_id, occurrence_id).
insert into webinar_events
  (zoom_meeting_id, occurrence_id, topic, start_time, duration_min, timezone, join_url, status)
values
  ('85074943654','1787086800000','The New Rules of Getting Hired MasterClass','2026-08-18T21:00:00Z',90,'Pacific/Auckland','https://us06web.zoom.us/j/85074943654?pwd=U6NbkbWTWft6JC9CJqqRGZqh7IGK6r.1','scheduled'),
  ('85074943654','1788296400000','The New Rules of Getting Hired MasterClass','2026-09-01T21:00:00Z',90,'Pacific/Auckland','https://us06web.zoom.us/j/85074943654?pwd=U6NbkbWTWft6JC9CJqqRGZqh7IGK6r.1','scheduled'),
  ('85074943654','1789506000000','The New Rules of Getting Hired MasterClass','2026-09-15T21:00:00Z',90,'Pacific/Auckland','https://us06web.zoom.us/j/85074943654?pwd=U6NbkbWTWft6JC9CJqqRGZqh7IGK6r.1','scheduled'),
  ('85074943654','1790712000000','The New Rules of Getting Hired MasterClass','2026-09-29T20:00:00Z',90,'Pacific/Auckland','https://us06web.zoom.us/j/85074943654?pwd=U6NbkbWTWft6JC9CJqqRGZqh7IGK6r.1','scheduled'),
  ('85074943654','1791921600000','The New Rules of Getting Hired MasterClass','2026-10-13T20:00:00Z',90,'Pacific/Auckland','https://us06web.zoom.us/j/85074943654?pwd=U6NbkbWTWft6JC9CJqqRGZqh7IGK6r.1','scheduled'),
  ('85074943654','1793131200000','The New Rules of Getting Hired MasterClass','2026-10-27T20:00:00Z',90,'Pacific/Auckland','https://us06web.zoom.us/j/85074943654?pwd=U6NbkbWTWft6JC9CJqqRGZqh7IGK6r.1','scheduled'),
  ('85074943654','1794340800000','The New Rules of Getting Hired MasterClass','2026-11-10T20:00:00Z',90,'Pacific/Auckland','https://us06web.zoom.us/j/85074943654?pwd=U6NbkbWTWft6JC9CJqqRGZqh7IGK6r.1','scheduled'),
  ('85074943654','1795550400000','The New Rules of Getting Hired MasterClass','2026-11-24T20:00:00Z',90,'Pacific/Auckland','https://us06web.zoom.us/j/85074943654?pwd=U6NbkbWTWft6JC9CJqqRGZqh7IGK6r.1','scheduled'),
  ('85074943654','1796760000000','The New Rules of Getting Hired MasterClass','2026-12-08T20:00:00Z',90,'Pacific/Auckland','https://us06web.zoom.us/j/85074943654?pwd=U6NbkbWTWft6JC9CJqqRGZqh7IGK6r.1','scheduled')
on conflict (zoom_meeting_id, occurrence_id) do update
  set start_time=excluded.start_time, topic=excluded.topic, join_url=excluded.join_url,
      duration_min=excluded.duration_min, timezone=excluded.timezone, fetched_at=now();
