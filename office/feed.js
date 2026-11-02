// Reads bot status directly from ntfy.sh (or a self-hosted ntfy named in the URL).
// The link is …/#<topic>. #<topic>@<host> or ?feed=<host> name a custom ntfy server.
// The topic lives in the hash, so it never reaches any server but ntfy.
// The same reducer (lib/state.js) turns the lines into the office's state. ntfy keeps 12 hours,
// so the newest lines are cached per topic in localStorage and replayed first.
import { StateStore, botIdFor } from './lib/state.js';
import { feedFromLink } from './lib/feedbase.js';

const MAX_LINE = 4096, KEEP = 600, TICK_MS = 30e3, DAY_MS = 24 * 3600e3;
const QUIET_MS = 20 * 60e3, CHECK_MS = 6 * 3600e3;
const HANDMADE = new Set();

/** The page's hash and query -> { topic, servers: [server, no trailing slash] }, or null without a topic. */
export function feedFromHash(hash, search = '') {
  const f = feedFromLink({ hash: hash || '', search });
  if (!f) return null;
  return { topic: f.topic, servers: [f.base.replace(/\/$/, '')] };
}

/** Rebuild from cache + the server's last 12 h, then follow it live. Calls onState(state) on every change. */
export async function connectFeed({ topic, servers }, onState) {
  const sources = servers.map((server) => ({ server, tag: 'ntfy', base: `${server}/${encodeURIComponent(topic)}`, lastId: null }));
  const cacheKey = `bothq.feed.${servers[0]}.${topic}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Sofia';
  const store = new StateStore({ tz, quietIdleMs: QUIET_MS, hasAvatar: (id) => HANDMADE.has(id) });
  const cfg = {};
  const routines = new Map();
  let check = null;
  let lines = [], saveTimer = 0;
  const seen = new Set();

  lines = cached(cacheKey).map((l) => ({ ...l, src: l.src || sources[0].tag }));
  await Promise.all(sources.map(async (s) => {
    try {
      const text = await (await fetch(`${s.base}/json?poll=1&since=12h`, { cache: 'no-store' })).text();
      for (const row of text.split('\n')) if (row) keep(s, JSON.parse(row));
    } catch { /* offline or down: the cache still shows the office */ }
  }));
  lines = lines.filter(fresh).sort((a, b) => a.time - b.time);
  for (const l of lines) ingest(l, true);
  for (const s of sources) s.lastId = lines.findLast((l) => l.src === s.tag)?.id ?? null;
  save();
  publish();

  for (const s of sources) follow(s);
  setInterval(() => { const v = store.version, s = store.snapshot(); if (store.version !== v) onState(extras(s)); }, TICK_MS);

  function cached(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  }
  function fresh(l) {                                    // once per mailbox id, and once per (time, text) across mailboxes
    const a = `${l.src} ${l.id}`, b = `${l.time} ${l.message}`;
    if (seen.has(a) || seen.has(b)) return false;
    seen.add(a).add(b);
    return true;
  }
  function keep(s, m) {                                  // a message of a history request, into `lines`
    if (m?.event === 'message' && typeof m.id === 'string') lines.push({ id: m.id, time: Number(m.time) || 0, message: m.message, src: s.tag });
  }
  function take(s, m) {                                  // a live message: new -> ingest; true if the office changed
    if (m?.event !== 'message' || typeof m.id !== 'string') return false;
    s.lastId = m.id;
    const l = { id: m.id, time: Number(m.time) || Date.now() / 1000, message: m.message, src: s.tag };
    if (!fresh(l)) return false;
    lines.push(l);
    if (lines.length > KEEP * 1.5) lines = lines.slice(-KEEP);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 2000);
    return ingest(l, false);
  }
  function follow(s) {
    const on = (data) => { try { if (take(s, JSON.parse(data))) publish(); } catch { /* keepalive or junk */ } };
    const live = new EventSource(`${s.base}/sse`);
    live.onopen = () => catchUp(s);
    live.onmessage = (e) => on(e.data);
  }
  async function catchUp(s) {
    try {
      const text = await (await fetch(`${s.base}/json?poll=1&since=${s.lastId ?? '12h'}`, { cache: 'no-store' })).text();
      let changed = false;
      for (const row of text.split('\n')) if (row && take(s, JSON.parse(row))) changed = true;
      if (changed) publish();
    } catch { /* the stream retries by itself */ }
  }
  function ingest({ message, time }, replay) {
    if (typeof message !== 'string' || message.length > MAX_LINE) return false;
    let rec;
    try { rec = JSON.parse(message); } catch { return false; }
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return false;
    const t = typeof rec.t === 'string' ? rec.t : new Date(time * 1000).toISOString();
    if (Array.isArray(rec.roster)) {
      for (const name of rec.roster.slice(0, 400)) {
        if (typeof name === 'string' && name.trim() && !store.bots.has(botIdFor(name))) store.apply({ t, bot: name, status: 'idle', step: '', listed: true }, { replay });
      }
      return true;
    }
    if (isMap(rec.looks)) {
      for (const [name, look] of Object.entries(rec.looks).slice(0, 400)) (cfg[name] ||= {}).look = look;
      store.setBotsConfig(cfg);
      return true;
    }
    if (isMap(rec.groups)) {                             // {"groups":{"Bot A":"Content"}}: the main bot's teams = floors
      for (const [name, team] of Object.entries(rec.groups).slice(0, 400)) {
        if (typeof team === 'string' && team.trim()) (cfg[name] ||= {}).floor = team.trim().slice(0, 40);
      }
      store.setBotsConfig(cfg);
      return true;
    }
    if (isMap(rec.chat)) {                               // only app deep links and web pages (the store refuses scripts)
      for (const [name, url] of Object.entries(rec.chat).slice(0, 400)) {
        if (typeof url === 'string' && /^(grokbot|https):\/\//i.test(url.trim())) (cfg[name] ||= {}).chat_url = url.trim();
      }
      store.setBotsConfig(cfg);
      return true;
    }
    if (isMap(rec.routines)) {
      const name = typeof rec.routines.bot === 'string' ? rec.routines.bot.trim().slice(0, 80) : '';
      if (!name || !Array.isArray(rec.routines.items)) return false;
      const items = rec.routines.items.slice(0, 50).filter(isMap).map((r) => ({
        routine: String(r.name ?? '').slice(0, 80), schedule: String(r.schedule ?? '').slice(0, 80),
        next_run: Number.isFinite(Date.parse(r.next_run)) ? new Date(r.next_run).toISOString() : null,
      })).filter((r) => r.routine);
      routines.set(botIdFor(name), { name, items });      // a bot's latest list replaces its previous one
      return true;
    }
    if (isMap(rec.check)) {                              // the setup bot asks every bot for a status line: who answers?
      const names = (Array.isArray(rec.check.bots) ? rec.check.bots : []).filter((n) => typeof n === 'string' && n.trim())
        .slice(0, 400).map((n) => n.trim().slice(0, 80));
      if (!names.length) return false;
      const ms = Number.isFinite(Date.parse(t)) ? Date.parse(t) : time * 1000;
      if (!check || ms >= check.ms) check = { ms, names };
      return true;
    }
    store.apply({ ...rec, t }, { replay });
    return true;
  }
  function extras(s) {                                   // the panels' data on top of the server-shaped state
    const since = Date.now() - DAY_MS, finished = [];
    for (let i = lines.length - 1; i >= 0 && finished.length < 100; i--) {
      const l = lines[i];
      if (l.time * 1000 < since) break;
      if (typeof l.message !== 'string' || l.message.length > MAX_LINE || !l.message.includes('"done"')) continue;
      let rec;
      try { rec = JSON.parse(l.message); } catch { continue; }
      if (rec?.status !== 'done' || typeof rec.bot !== 'string') continue;
      finished.push({ t: typeof rec.t === 'string' ? rec.t : new Date(l.time * 1000).toISOString(), bot: botIdFor(rec.bot), name: rec.bot.slice(0, 80), step: String(rec.step ?? '').slice(0, 80) });
    }
    s.finished = finished;
    s.routines = [...routines].flatMap(([bot, { name, items }]) => items.map((r) => ({ bot, name, ...r })))
      .sort((a, b) => (a.next_run ? Date.parse(a.next_run) : Infinity) - (b.next_run ? Date.parse(b.next_run) : Infinity));
    s.check = check && Date.now() - check.ms < CHECK_MS ? {
      t: new Date(check.ms).toISOString(),
      bots: check.names.map((name) => {                  // answered = a status line of its own at or after the check
        const id = botIdFor(name), seen = Date.parse(s.bots[id]?.last_seen ?? '');
        return { id, name, at: seen >= check.ms ? new Date(seen).toISOString() : null };
      }),
    } : null;
    return s;
  }
  function publish() { store.commit(); onState(extras(store.snapshot())); }
  function save() { try { localStorage.setItem(cacheKey, JSON.stringify(lines.slice(-KEEP))); } catch { /* private mode: not cached */ } }
}

function isMap(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
