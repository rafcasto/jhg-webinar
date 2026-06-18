/** Convert a YouTube/Vimeo/raw URL into an embeddable iframe src (or null). */
export function toEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
    return url;
  } catch {
    return null;
  }
}

/** Human-friendly date/time for a webinar event. */
export function formatEvent(event) {
  if (!event?.start_time) return null;
  const d = new Date(event.start_time);
  const date = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const tz = event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return { date, time, tz };
}
