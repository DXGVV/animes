'use strict';
/* =========================================================
   Animés · Tom  —  V2 « Néon Tokyo »
   PWA perso de suivi d'animés
   Sources : AniList (GraphQL), Jikan (MyAnimeList), Kitsu
   Données stockées uniquement sur le téléphone (localStorage)
   ========================================================= */

const APP_VERSION = '2.0.0';
const STORE_KEY = 'animes-tom-v1';
const UI_KEY = 'animes-tom-ui';
const WALL_KEY = 'animes-tom-wall';

const AL_URL = 'https://graphql.anilist.co';
const JIKAN_URL = 'https://api.jikan.moe/v4';
const KITSU_BASES = ['https://kitsu.app/api/edge', 'https://kitsu.io/api/edge'];

/* ---------------- Constantes « anime » ---------------- */
const STATUSES = {
  watching:  { label: 'En cours',  k: '視聴中', c: '#29e0ff' },
  planning:  { label: 'À voir',    k: '予定',   c: '#b78cff' },
  completed: { label: 'Terminé',   k: '完走',   c: '#3df2a0' },
  paused:    { label: 'En pause',  k: '保留',   c: '#ffc94a' },
  dropped:   { label: 'Abandonné', k: '断念',   c: '#ff4d6d' },
};
const STATUS_ORDER = ['watching', 'planning', 'completed', 'paused', 'dropped'];

const AIRING_LABEL = {
  RELEASING: 'En diffusion', FINISHED: 'Terminé', NOT_YET_RELEASED: 'À venir',
  CANCELLED: 'Annulé', HIATUS: 'En pause',
};

const TIERS = [
  { t: 'S', min: 9,   v: 9.5, c: '#ff4d6d', lbl: 'Chef-d\'œuvre' },
  { t: 'A', min: 8,   v: 8.5, c: '#ff9f43', lbl: 'Excellent' },
  { t: 'B', min: 7,   v: 7.5, c: '#ffd84d', lbl: 'Bon' },
  { t: 'C', min: 5,   v: 6,   c: '#6fe07a', lbl: 'Moyen' },
  { t: 'D', min: 0,   v: 4,   c: '#4fb3ff', lbl: 'Bof' },
];
const tierOf = (r) => (r == null ? null : TIERS.find((t) => r >= t.min));

const THEMES = {
  neon:      { name: 'Néon Tokyo', a1: '#ff3d8b', a2: '#29e0ff', bg: '#07060d' },
  sakura:    { name: 'Sakura',     a1: '#ff7eb6', a2: '#b78cff', bg: '#0d0710' },
  akatsuki:  { name: 'Akatsuki',   a1: '#ff3b3b', a2: '#ff9f43', bg: '#0b0505' },
  shinigami: { name: 'Shinigami',  a1: '#ff8c1a', a2: '#ffd23f', bg: '#090807' },
  mecha:     { name: 'Mecha',      a1: '#2bff88', a2: '#00b7ff', bg: '#040d0a' },
  dynamic:   { name: 'Dynamique',  a1: '#ff3d8b', a2: '#29e0ff', bg: '#07060d', dynamic: true },
};

const DEFAULT_CATS = [
  { name: 'Isekai',        emoji: '🌀', color: '#8b7cff', match: ['isekai'] },
  { name: 'Overpower',     emoji: '💪', color: '#ff3d8b', match: ['overpower'] },
  { name: 'Sport',         emoji: '⚽', color: '#3df2a0', match: ['sports'] },
  { name: 'Shōnen',        emoji: '🔥', color: '#ff8a3d', match: ['shounen', 'shonen'] },
  { name: 'Romance',       emoji: '💕', color: '#ff7eb6', match: ['romance'] },
  { name: 'Slice of life', emoji: '☕', color: '#e0b26b', match: ['slice of life'] },
  { name: 'Comédie',       emoji: '😂', color: '#ffd23f', match: ['comedy'] },
  { name: 'Dark',          emoji: '🌑', color: '#8c96c4', match: ['psychological', 'horror', 'tragedy'] },
];

/* Classe RPG selon la catégorie dominante (fenêtre de statut) */
const CLASSES = [
  { k: 'isekai', cls: 'Réincarné dans un autre monde' },
  { k: 'overpower', cls: 'Protagoniste OP (qui cache sa force)' },
  { k: 'sport', cls: 'Capitaine du club' },
  { k: 'shōnen', cls: 'Héros au cri de guerre' },
  { k: 'shonen', cls: 'Héros au cri de guerre' },
  { k: 'romance', cls: 'Héros de romcom indécis' },
  { k: 'slice', cls: 'Membre du club de thé' },
  { k: 'comédie', cls: 'Faire-valoir comique' },
  { k: 'dark', cls: 'Anti-héros torturé' },
  { k: 'mecha', cls: 'Pilote de robot géant' },
];
const RANKS = [
  { max: 5,   r: 'E',   t: 'Villageois niveau 1' },
  { max: 10,  r: 'D',   t: 'Aventurier novice de la guilde' },
  { max: 18,  r: 'C',   t: 'Chasseur confirmé' },
  { max: 28,  r: 'B',   t: 'Ninja d\'élite' },
  { max: 40,  r: 'A',   t: 'Capitaine de division' },
  { max: 55,  r: 'S',   t: 'Pilier de l\'otakuisme' },
  { max: 75,  r: 'SS',  t: 'Roi des binge-watchers' },
  { max: 1e9, r: 'SSS', t: 'Entité overpowered' },
];

const QUIPS = {
  loading: [
    'Camion-kun est en route…',
    'Ouverture d\'un portail vers un autre monde…',
    'Consultation des archives de la guilde…',
    'Chargement plus court qu\'un flashback, promis…',
    'Concentration du chakra…',
    'Le Wi-Fi s\'entraîne dans la salle de l\'esprit et du temps…',
  ],
  complete: [
    'Un arc de plus dans ta légende.',
    'Le générique de fin n\'a jamais été aussi beau.',
    'Ton niveau de puissance augmente !',
    'Pas de saison 2 annoncée ? On attend, comme d\'habitude.',
    'Le héros rentre au village, victorieux.',
  ],
  start: ['Ton aventure commence !', 'Premier épisode, premier pas dans l\'autre monde.', 'Ikuzo !'],
  drop: ['Abandonné. Même les meilleurs nindō ont leurs limites.', 'Retraite stratégique, pas une défaite.'],
  noResult: ['Même un détective de génie n\'a rien trouvé.', 'Aucune trace, comme un ninja en mission secrète.'],
  error: ['La base ne répond pas… elle a dû se faire one-shot.', 'Connexion perdue dans le Monde des Ombres.'],
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const ACHIEVEMENTS = [
  { id: 'first',    ic: '🌱', n: 'Le voyage commence',      d: 'Ajouter un premier animé',           ok: (s) => s.items >= 1 },
  { id: 'nakama',   ic: '🏴‍☠️', n: 'Nakama',               d: '10 animés dans la liste',            ok: (s) => s.items >= 10 },
  { id: 'backlog',  ic: '📚', n: 'Backlog infini',          d: '20 animés « À voir »',               ok: (s) => s.planning >= 20 },
  { id: 'done1',    ic: '🎬', n: 'Premier kansō',           d: 'Terminer un animé',                  ok: (s) => s.done >= 1 },
  { id: 'done10',   ic: '🏁', n: 'Chasseur de fins',        d: 'Terminer 10 animés',                 ok: (s) => s.done >= 10 },
  { id: 'ep100',    ic: '🏃', n: 'Marathonien',             d: '100 épisodes vus',                   ok: (s) => s.eps >= 100 },
  { id: 'ep1000',   ic: '🍥', n: 'Survivant des fillers',   d: '1000 épisodes vus',                  ok: (s) => s.eps >= 1000 },
  { id: 'over9000', ic: '💥', n: 'Plus de 9000 !',          d: '9000 minutes devant l\'écran',       ok: (s) => s.minutes > 9000 },
  { id: 'isekai',   ic: '🚚', n: 'Camion-kun',              d: '5 animés dans la catégorie Isekai',  ok: (s) => s.isekai >= 5 },
  { id: 'notes10',  ic: '✒️', n: 'Plume de mangaka',        d: 'Écrire 10 commentaires',             ok: (s) => s.notes >= 10 },
  { id: 'rate10',   ic: '⚖️', n: 'Critique de la guilde',   d: 'Noter 10 animés',                    ok: (s) => s.rated >= 10 },
  { id: 'perfect',  ic: '👑', n: 'Chef-d\'œuvre absolu',    d: 'Donner un 10/10',                    ok: (s) => s.perfect >= 1 },
  { id: 'balls',    ic: '🐉', n: 'Les 7 boules',            d: '7 animés en favoris',                ok: (s) => s.favs >= 7 },
  { id: 'gacha',    ic: '🎰', n: 'Accro au gacha',          d: '10 tirages du soir',                 ok: (s) => s.gacha >= 10 },
  { id: 'night',    ic: '🌙', n: 'Otaku nocturne',          d: 'Valider un épisode entre 0 h et 5 h', ok: (s) => s.night },
  { id: 'drop',     ic: '🏳️', n: 'Je n\'abandonne jamais… sauf là', d: 'Abandonner un animé',        ok: (s) => s.dropped >= 1 },
];

/* ---------------- Utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cssUrl = (u) => `url(&quot;${esc(String(u || '').replace(/["\\\n\r]/g, ''))}&quot;)`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const normKey = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const nowSec = () => Math.floor(Date.now() / 1000);

const fmtDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const KANJI_DAYS = ['日', '月', '火', '水', '木', '金', '土'];

function fmtIn(sec) {
  const d = sec - nowSec();
  if (d <= 0) return 'sorti';
  const days = Math.floor(d / 86400), h = Math.floor((d % 86400) / 3600), m = Math.floor((d % 3600) / 60);
  if (days > 0) return `dans ${days} j ${h} h`;
  if (h > 0) return `dans ${h} h ${m} min`;
  return `dans ${m} min`;
}
const fmtInShort = (sec) => fmtIn(sec).replace('dans ', '').replace(/ \d+ (h|min)$/, '');
function fmtDuration(min) {
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = Math.round(min % 60);
  if (d > 0) return `${d} j ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}
function cleanDesc(s) {
  if (!s) return '';
  return String(s)
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\[Written by MAL Rewrite\]/gi, '').replace(/\(Source:[^)]*\)\s*$/i, '')
    .replace(/\n{3,}/g, '\n\n').trim();
}

/* Couleurs */
function hexToRgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return '#' + [f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
/** Transforme la couleur d'une affiche en un couple de néons lisibles */
function neonPair(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [h, s] = rgbToHsl(rgb);
  const sat = Math.max(s, 0.7);
  return { a1: hslToHex(h, sat, 0.62), a2: hslToHex(h + 50, sat, 0.62) };
}
function accentVars(a1, a2) {
  const r1 = hexToRgb(a1), r2 = hexToRgb(a2);
  if (!r1 || !r2) return '';
  return `--a1:${a1};--a2:${a2};--a1-rgb:${r1.join(',')};--a2-rgb:${r2.join(',')};--grad:linear-gradient(120deg,${a1},${a2});`;
}

/* ---------------- Toasts & haptique ---------------- */
const toastQueue = [];
let toastBusy = false, toastCur = null, toastTimer = null;
function toast(msg, cls = '') {
  if (!cls) for (let i = toastQueue.length - 1; i >= 0; i--) if (!toastQueue[i].cls) toastQueue.splice(i, 1);
  toastQueue.push({ msg, cls });
  if (!toastBusy) nextToast();
  else if (toastCur && !toastCur.cls) { clearTimeout(toastTimer); nextToast(); }
}
function nextToast() {
  const t = $('#toast');
  const n = toastQueue.shift();
  toastCur = n || null;
  if (!n) { toastBusy = false; t.hidden = true; return; }
  toastBusy = true;
  t.className = 'toast ' + n.cls;
  t.textContent = n.msg;
  t.hidden = true; void t.offsetWidth; t.hidden = false;
  toastTimer = setTimeout(nextToast, n.cls ? 2600 : 1900);
}
function haptic() { try { navigator.vibrate?.(8); } catch (e) { /* rien */ } }

/* ---------------- Stockage ---------------- */
function freshDb() {
  return {
    version: 2,
    settings: {
      titleLang: 'romaji', theme: 'neon', heroName: 'Tom',
      wall: { mode: 'auto', uid: null, blur: 14, dim: 0.62 },
    },
    categories: DEFAULT_CATS.map((c) => ({ id: uid(), ...c })),
    items: [],
    achievements: {},
    stats: { gacha: 0, night: false },
    lastRefresh: 0,
  };
}
function normalizeDb(d) {
  const f = freshDb();
  d.settings = { ...f.settings, ...(d.settings || {}) };
  d.settings.wall = { ...f.settings.wall, ...(d.settings.wall || {}) };
  d.categories = Array.isArray(d.categories) ? d.categories : [];
  d.achievements = d.achievements || {};
  d.stats = { ...f.stats, ...(d.stats || {}) };
  d.items.forEach((i) => { i.categories = i.categories || []; i.notes = i.notes || []; i.ids = i.ids || {}; });
  d.version = 2;
  return d;
}
function loadDb() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.items)) return normalizeDb(d);
    }
  } catch (e) { console.warn(e); }
  return freshDb();
}
let db = loadDb();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
  catch (e) { toast('Sauvegarde impossible (stockage plein ?)'); }
}

const ui = Object.assign(
  { tab: 'list', status: 'all', cat: null, sort: 'updated', view: 'grid', q: '', disc: 'trending', day: null },
  (() => { try { return JSON.parse(localStorage.getItem(UI_KEY)) || {}; } catch (e) { return {}; } })()
);
function saveUi() {
  try { localStorage.setItem(UI_KEY, JSON.stringify({ tab: ui.tab, status: ui.status, cat: ui.cat, sort: ui.sort, view: ui.view, disc: ui.disc })); } catch (e) { /* rien */ }
}

/* ---------------- Modèle ---------------- */
const META_KEYS = ['title', 'cover', 'banner', 'color', 'synopsis', 'genres', 'tags', 'studio', 'format', 'year', 'season',
  'episodes', 'duration', 'airingStatus', 'nextEp', 'score', 'startDate', 'urls'];

function keyOf(m) {
  if (m.ids?.al) return 'al' + m.ids.al;
  if (m.ids?.mal) return 'mal' + m.ids.mal;
  return 'kt' + m.ids?.kitsu;
}
function titleOf(m) {
  const t = m.title || {};
  return db.settings.titleLang === 'english' ? (t.english || t.romaji || t.native || '?') : (t.romaji || t.english || t.native || '?');
}
function altTitleOf(m) {
  const t = m.title || {}, main = titleOf(m);
  return [t.english, t.romaji].filter((x) => x && x !== main).slice(0, 1).join(' · ');
}
function findItem(m) {
  if (!m) return null;
  return db.items.find((i) =>
    (m.ids.al && i.ids.al === m.ids.al) || (m.ids.mal && i.ids.mal === m.ids.mal) || (m.ids.kitsu && i.ids.kitsu === m.ids.kitsu)) || null;
}
const getItem = (k) => db.items.find((i) => i.uid === k);
const catById = (id) => db.categories.find((c) => c.id === id);

function autoCats(m) {
  const words = [...(m.genres || []), ...(m.tags || [])].map((x) => String(x).toLowerCase());
  return db.categories.filter((c) => (c.match || []).some((k) => words.some((w) => w.includes(k)))).map((c) => c.id);
}
function makeItem(m, status) {
  const t = Date.now();
  return {
    ...JSON.parse(JSON.stringify(m)),
    uid: keyOf(m), status, progress: status === 'completed' && m.episodes ? m.episodes : 0,
    rating: null, favorite: false, categories: autoCats(m), notes: [],
    addedAt: t, updatedAt: t,
    startedAt: status === 'watching' || status === 'completed' ? t : null,
    finishedAt: status === 'completed' ? t : null,
  };
}
function applyMeta(target, m) {
  for (const k of META_KEYS) {
    const v = m[k];
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && !v.length) continue;
    target[k] = v;
  }
  if (m.nextEp === null && m.sources?.includes('al')) target.nextEp = null;
  target.ids = { ...target.ids, ...Object.fromEntries(Object.entries(m.ids || {}).filter(([, v]) => v)) };
  target.sources = [...new Set([...(target.sources || []), ...(m.sources || [])])];
}
/** Épisodes déjà sortis (estimation) */
function releasedEps(i) {
  if (i.airingStatus === 'FINISHED') return i.episodes || null;
  if (i.nextEp) return i.nextEp.airingAt <= nowSec() ? i.nextEp.episode : i.nextEp.episode - 1;
  return null;
}
function behindOf(i) {
  if (i.status !== 'watching') return 0;
  const r = releasedEps(i);
  return r ? Math.max(0, r - (i.progress || 0)) : 0;
}

/* ---------------- Statistiques / RPG ---------------- */
function computeStats() {
  const items = db.items;
  const isekaiCat = db.categories.find((c) => normKey(c.name) === 'isekai');
  return {
    items: items.length,
    planning: items.filter((i) => i.status === 'planning').length,
    done: items.filter((i) => i.status === 'completed').length,
    dropped: items.filter((i) => i.status === 'dropped').length,
    eps: items.reduce((s, i) => s + (i.progress || 0), 0),
    minutes: items.reduce((s, i) => s + (i.progress || 0) * (i.duration || 24), 0),
    notes: items.reduce((s, i) => s + i.notes.length, 0),
    rated: items.filter((i) => i.rating != null).length,
    perfect: items.filter((i) => i.rating === 10).length,
    favs: items.filter((i) => i.favorite).length,
    isekai: isekaiCat ? items.filter((i) => i.categories.includes(isekaiCat.id)).length : 0,
    gacha: db.stats.gacha || 0,
    night: !!db.stats.night,
  };
}
function heroProfile(s = computeStats()) {
  const xp = s.eps * 10 + s.done * 120 + s.notes * 25 + s.rated * 15 + s.favs * 10 + s.items * 5 + Object.keys(db.achievements).length * 50;
  const lvlAt = (L) => Math.round(40 * Math.pow(L - 1, 1.7));
  let level = 1;
  while (lvlAt(level + 1) <= xp) level++;
  const cur = lvlAt(level), next = lvlAt(level + 1);
  const rank = RANKS.find((r) => level < r.max) || RANKS[RANKS.length - 1];
  const catCount = db.categories.map((c) => ({ c, n: db.items.filter((i) => i.categories.includes(c.id)).length })).sort((a, b) => b.n - a.n);
  const top = catCount[0]?.n ? catCount[0].c : null;
  const cls = top ? (CLASSES.find((x) => top.name.toLowerCase().includes(x.k))?.cls || `Spécialiste ${top.name}`) : 'Aventurier sans classe';
  return { xp, level, cur, next, rank, cls, topCat: top };
}
function checkAchievements() {
  const s = computeStats();
  for (const a of ACHIEVEMENTS) {
    if (!db.achievements[a.id] && a.ok(s)) {
      db.achievements[a.id] = Date.now();
      toast(`🏆 Succès débloqué : ${a.n}`, 'ach-toast');
    }
  }
}
function touch(it) { if (it) it.updatedAt = Date.now(); checkAchievements(); save(); }

/* =========================================================
   APIs publiques
   ========================================================= */
const AL_FIELDS = `id idMal type title{romaji english native} format status episodes duration season seasonYear
  startDate{year month day} coverImage{extraLarge large color} bannerImage genres tags{name rank}
  studios(isMain:true){nodes{name}} averageScore description(asHtml:false) siteUrl nextAiringEpisode{episode airingAt}`;

async function alQuery(query, variables = {}) {
  const r = await fetch(AL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  let j = null;
  try { j = await r.json(); } catch (e) { /* rien */ }
  if (!r.ok || !j || !j.data) throw new Error(j?.errors?.[0]?.message || `AniList ${r.status}`);
  return j.data;
}
function fromAL(m) {
  const sd = m.startDate || {};
  return {
    ids: { al: m.id, mal: m.idMal || null, kitsu: null },
    title: { romaji: m.title?.romaji || null, english: m.title?.english || null, native: m.title?.native || null },
    cover: m.coverImage?.extraLarge || m.coverImage?.large || null,
    banner: m.bannerImage || null,
    color: m.coverImage?.color || null,
    synopsis: cleanDesc(m.description),
    genres: m.genres || [],
    tags: (m.tags || []).filter((t) => (t.rank ?? 100) >= 50).map((t) => t.name),
    studio: m.studios?.nodes?.[0]?.name || null,
    format: m.format ? m.format.replace('_', ' ') : null,
    year: m.seasonYear || sd.year || null,
    season: m.season || null,
    episodes: m.episodes || null,
    duration: m.duration || null,
    airingStatus: m.status || null,
    nextEp: m.nextAiringEpisode ? { episode: m.nextAiringEpisode.episode, airingAt: m.nextAiringEpisode.airingAt } : null,
    score: m.averageScore ? m.averageScore / 10 : null,
    startDate: sd.year ? `${sd.year}-${String(sd.month || 1).padStart(2, '0')}-${String(sd.day || 1).padStart(2, '0')}` : null,
    urls: { al: m.siteUrl || `https://anilist.co/anime/${m.id}`, ...(m.idMal ? { mal: `https://myanimelist.net/anime/${m.idMal}` } : {}) },
    sources: ['al'],
  };
}
async function searchAL(q) {
  const d = await alQuery(`query($s:String){Page(perPage:12){media(search:$s,type:ANIME,isAdult:false,sort:SEARCH_MATCH){${AL_FIELDS}}}}`, { s: q });
  return d.Page.media.map(fromAL);
}

function parseJikanDuration(s) {
  if (!s) return null;
  const h = /(\d+)\s*hr/.exec(s), m = /(\d+)\s*min/.exec(s);
  const v = (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
  return v || null;
}
const JIKAN_STATUS = { 'Finished Airing': 'FINISHED', 'Currently Airing': 'RELEASING', 'Not yet aired': 'NOT_YET_RELEASED' };
function fromJikan(a) {
  const from = a.aired?.from ? String(a.aired.from).slice(0, 10) : null;
  return {
    ids: { al: null, mal: a.mal_id, kitsu: null },
    title: { romaji: a.title || null, english: a.title_english || null, native: a.title_japanese || null },
    cover: a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || null,
    banner: null, color: null,
    synopsis: cleanDesc(a.synopsis),
    genres: (a.genres || []).map((g) => g.name),
    tags: [...(a.themes || []), ...(a.demographics || [])].map((g) => g.name),
    studio: a.studios?.[0]?.name || null,
    format: a.type || null,
    year: a.year || (from ? +from.slice(0, 4) : null),
    season: a.season ? a.season.toUpperCase() : null,
    episodes: a.episodes || null,
    duration: parseJikanDuration(a.duration),
    airingStatus: JIKAN_STATUS[a.status] || null,
    nextEp: null,
    score: a.score || null,
    startDate: from,
    urls: { mal: a.url || `https://myanimelist.net/anime/${a.mal_id}` },
    sources: ['mal'],
  };
}
async function searchJikan(q) {
  const r = await fetch(`${JIKAN_URL}/anime?q=${encodeURIComponent(q)}&limit=12&sfw=true`);
  if (!r.ok) throw new Error(`Jikan ${r.status}`);
  const j = await r.json();
  return (j.data || []).map(fromJikan);
}

async function kitsuFetch(path) {
  let lastErr;
  for (const base of KITSU_BASES) {
    try {
      const r = await fetch(base + path);
      if (r.ok) return await r.json();
      lastErr = new Error(`Kitsu ${r.status}`);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Kitsu indisponible');
}
const KITSU_STATUS = { current: 'RELEASING', finished: 'FINISHED', upcoming: 'NOT_YET_RELEASED', unreleased: 'NOT_YET_RELEASED', tba: 'NOT_YET_RELEASED' };
function fromKitsu(d, included) {
  const a = d.attributes || {};
  const ids = { al: null, mal: null, kitsu: +d.id };
  for (const ref of d.relationships?.mappings?.data || []) {
    const mp = included.find((x) => x.type === 'mappings' && x.id === ref.id);
    const site = mp?.attributes?.externalSite, ext = parseInt(mp?.attributes?.externalId, 10);
    if (!ext) continue;
    if (site === 'myanimelist/anime') ids.mal = ext;
    if (site === 'anilist/anime') ids.al = ext;
  }
  return {
    ids,
    title: { romaji: a.titles?.en_jp || a.canonicalTitle || null, english: a.titles?.en || a.titles?.en_us || null, native: a.titles?.ja_jp || null },
    cover: a.posterImage?.large || a.posterImage?.medium || a.posterImage?.original || null,
    banner: a.coverImage?.large || a.coverImage?.original || null,
    color: null,
    synopsis: cleanDesc(a.synopsis),
    genres: [], tags: [],
    studio: null,
    format: a.subtype ? a.subtype.toUpperCase() : null,
    year: a.startDate ? +a.startDate.slice(0, 4) : null,
    season: null,
    episodes: a.episodeCount || null,
    duration: a.episodeLength || null,
    airingStatus: KITSU_STATUS[a.status] || null,
    nextEp: null,
    score: a.averageRating ? Math.round(parseFloat(a.averageRating)) / 10 : null,
    startDate: a.startDate || null,
    urls: { kitsu: `https://kitsu.app/anime/${a.slug || d.id}` },
    sources: ['kt'],
  };
}
async function searchKitsu(q) {
  const j = await kitsuFetch(`/anime?filter%5Btext%5D=${encodeURIComponent(q)}&page%5Blimit%5D=10&include=mappings`);
  const inc = j.included || [];
  return (j.data || []).map((d) => fromKitsu(d, inc));
}

/** Fusionne les résultats des 3 sources (dédoublonnage par ID MAL/AniList puis par titre + année) */
function mergeResults(groups) {
  const out = [];
  const tkeys = (m) => [m.title?.romaji, m.title?.english].filter(Boolean).map(normKey);
  const same = (a, b) => {
    if (a.ids.al && b.ids.al) return a.ids.al === b.ids.al;
    if (a.ids.mal && b.ids.mal) return a.ids.mal === b.ids.mal;
    if (a.ids.kitsu && b.ids.kitsu) return a.ids.kitsu === b.ids.kitsu;
    const ka = tkeys(a), kb = tkeys(b);
    return ka.some((k) => kb.includes(k)) && (!a.year || !b.year || Math.abs(a.year - b.year) <= 1);
  };
  for (const list of groups) {
    for (const m of list) {
      const hit = out.find((x) => same(x, m));
      if (hit) {
        for (const k of META_KEYS) {
          const cur = hit[k];
          const empty = cur === null || cur === undefined || cur === '' || (Array.isArray(cur) && !cur.length);
          if (empty && m[k] != null) hit[k] = m[k];
        }
        hit.urls = { ...m.urls, ...hit.urls };
        hit.title = { ...m.title, ...Object.fromEntries(Object.entries(hit.title).filter(([, v]) => v)) };
        hit.ids = { ...hit.ids, ...Object.fromEntries(Object.entries(m.ids).filter(([k, v]) => v && !hit.ids[k])) };
        hit.sources = [...new Set([...hit.sources, ...m.sources])];
      } else out.push(JSON.parse(JSON.stringify(m)));
    }
  }
  return out;
}

/* ---------- Infos bonus d'une fiche (AniList) : bande-annonce, persos, suites, recos ---------- */
const extrasCache = new Map();
async function loadExtras(alId) {
  if (extrasCache.has(alId)) return extrasCache.get(alId);
  const variants = [
    `trailer{id site thumbnail}
     characters(sort:[ROLE,RELEVANCE],perPage:12){edges{role node{id name{full native} image{large medium}}}}
     relations{edges{relationType node{${AL_FIELDS}}}}
     recommendations(perPage:10,sort:[RATING_DESC]){nodes{mediaRecommendation{${AL_FIELDS}}}}`,
    `trailer{id site thumbnail}
     characters(perPage:12){edges{role node{id name{full native} image{large medium}}}}
     relations{edges{relationType node{${AL_FIELDS}}}}
     recommendations(perPage:10){nodes{mediaRecommendation{${AL_FIELDS}}}}`,
    `trailer{id site} relations{edges{relationType node{${AL_FIELDS}}}}`,
  ];
  let lastErr;
  for (const fields of variants) {
    try {
      const d = await alQuery(`query($id:Int){Media(id:$id,type:ANIME){${fields}}}`, { id: alId });
      const M = d.Media || {};
      const res = {
        trailer: M.trailer && M.trailer.id ? { id: M.trailer.id, site: M.trailer.site } : null,
        chars: (M.characters?.edges || []).filter((e) => e.node).map((e) => ({
          name: e.node.name?.full || '?', native: e.node.name?.native || '', img: e.node.image?.large || e.node.image?.medium || '', role: e.role,
        })),
        relations: (M.relations?.edges || []).filter((e) => e.node && e.node.type === 'ANIME').map((e) => ({ rel: e.relationType, m: fromAL(e.node) })),
        recos: (M.recommendations?.nodes || []).map((n) => n.mediaRecommendation).filter((x) => x && x.type !== 'MANGA').map(fromAL),
      };
      extrasCache.set(alId, res);
      return res;
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}
const REL_FR = {
  SEQUEL: 'Suite', PREQUEL: 'Préquelle', SIDE_STORY: 'Histoire parallèle', SPIN_OFF: 'Spin-off', ALTERNATIVE: 'Version alternative',
  PARENT: 'Œuvre principale', SUMMARY: 'Résumé', ADAPTATION: 'Adaptation', SOURCE: 'Source', CHARACTER: 'Persos communs',
  OTHER: 'Autre', COMPILATION: 'Compilation', CONTAINS: 'Contient',
};
const REL_ORDER = ['PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY', 'SPIN_OFF', 'ALTERNATIVE', 'SUMMARY', 'COMPILATION', 'CONTAINS', 'CHARACTER', 'OTHER', 'ADAPTATION', 'SOURCE'];

/* ---------- Découvrir ---------- */
const discCache = {};
function seasonNow(offset = 0) {
  const d = new Date(); const m = d.getMonth(); let y = d.getFullYear();
  const seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  let idx = m === 11 ? 0 : Math.floor((m + 1) / 3) % 4; // déc. = hiver de l'année suivante
  if (m === 11) y += 1;
  idx += offset;
  while (idx > 3) { idx -= 4; y += 1; }
  return { season: seasons[idx], year: y };
}
const SEASON_FR = { WINTER: 'Hiver', SPRING: 'Printemps', SUMMER: 'Été', FALL: 'Automne' };
const SEASON_K = { WINTER: '冬', SPRING: '春', SUMMER: '夏', FALL: '秋' };
const DISC_TABS = {
  trending: { label: () => '🔥 Tendances', args: () => ({ sort: 'TRENDING_DESC' }) },
  season:   { label: () => `${SEASON_K[seasonNow().season]} ${SEASON_FR[seasonNow().season]} ${seasonNow().year}`, args: () => ({ sort: 'POPULARITY_DESC', ...seasonNow() }) },
  next:     { label: () => `${SEASON_K[seasonNow(1).season]} ${SEASON_FR[seasonNow(1).season]} ${seasonNow(1).year}`, args: () => ({ sort: 'POPULARITY_DESC', ...seasonNow(1) }) },
  top:      { label: () => '🏆 Légendaires', args: () => ({ sort: 'SCORE_DESC' }) },
  popular:  { label: () => '👥 Les plus suivis', args: () => ({ sort: 'POPULARITY_DESC' }) },
};
async function loadDiscover(key) {
  if (Array.isArray(discCache[key])) return discCache[key];
  const a = DISC_TABS[key].args();
  const parts = ['type:ANIME', 'isAdult:false', `sort:${a.sort}`];
  const vars = {};
  if (a.season) { parts.push('season:$season', 'seasonYear:$year'); vars.season = a.season; vars.year = a.year; }
  const decl = a.season ? '($season:MediaSeason,$year:Int)' : '';
  const d = await alQuery(`query${decl}{Page(perPage:30){media(${parts.join(',')}){${AL_FIELDS}}}}`, vars);
  discCache[key] = d.Page.media.map(fromAL);
  return discCache[key];
}

/* ---------- Rafraîchissement des infos de la liste ---------- */
let refreshing = false;
async function refreshAll(manual) {
  if (refreshing || !db.items.length) return;
  if (!navigator.onLine) { if (manual) toast('Pas de connexion'); return; }
  refreshing = true;
  $('#btnRefresh').classList.add('spin');
  let updated = 0, failed = false;
  try {
    const withAl = db.items.filter((i) => i.ids.al);
    for (let k = 0; k < withAl.length; k += 50) {
      const ids = withAl.slice(k, k + 50).map((i) => i.ids.al);
      const d = await alQuery(`query($ids:[Int]){Page(perPage:50){media(id_in:$ids,type:ANIME){${AL_FIELDS}}}}`, { ids });
      for (const m of d.Page.media) {
        const it = db.items.find((i) => i.ids.al === m.id);
        if (it) { applyMeta(it, fromAL(m)); updated++; }
      }
    }
    // Animés trouvés seulement via MAL / Kitsu : on tente de les relier à AniList (pour le planning)
    const malOnly = db.items.filter((i) => !i.ids.al && i.ids.mal);
    for (let k = 0; k < malOnly.length; k += 50) {
      const ids = malOnly.slice(k, k + 50).map((i) => i.ids.mal);
      const d = await alQuery(`query($ids:[Int]){Page(perPage:50){media(idMal_in:$ids,type:ANIME){${AL_FIELDS}}}}`, { ids });
      for (const m of d.Page.media) {
        const it = db.items.find((i) => i.ids.mal === m.idMal);
        if (it) { applyMeta(it, fromAL(m)); updated++; }
      }
    }
    db.lastRefresh = Date.now();
    save();
  } catch (e) {
    console.warn(e); failed = true;
  } finally {
    refreshing = false;
    $('#btnRefresh').classList.remove('spin');
  }
  if (manual) toast(failed ? pick(QUIPS.error) : `${updated} animé(s) mis à jour`);
  sched.at = 0;
  if (!$('#sheet').hidden && openRef?.uid) renderDetail();
  render();
}
async function refreshOne(it) {
  try {
    const d = await alQuery(`query($id:Int){Media(idMal:$id,type:ANIME){${AL_FIELDS}}}`, { id: it.ids.mal });
    if (d.Media) { applyMeta(it, fromAL(d.Media)); save(); if (openRef?.uid === it.uid) renderDetail(); }
  } catch (e) { /* pas trouvé sur AniList, tant pis */ }
}

/* ---------- Simulcast ---------- */
let sched = { at: 0, list: [], ok: false };
function startOfDay(t = Date.now()) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
function planningItems() {
  return db.items.filter((i) => ['watching', 'planning', 'paused'].includes(i.status) && ['RELEASING', 'NOT_YET_RELEASED', 'HIATUS'].includes(i.airingStatus));
}
async function loadSchedule() {
  const ids = planningItems().filter((i) => i.ids.al).map((i) => i.ids.al);
  const from = Math.floor(startOfDay() / 1000), to = from + 7 * 86400;
  if (!ids.length) { sched = { at: Date.now(), list: [], ok: true }; return; }
  try {
    const list = [];
    for (let p = 1; p <= 4; p++) {
      const d = await alQuery(`query($ids:[Int],$from:Int,$to:Int,$p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage}
        airingSchedules(mediaId_in:$ids,airingAt_greater:$from,airingAt_lesser:$to,sort:TIME){episode airingAt mediaId}}}`, { ids, from, to, p });
      list.push(...d.Page.airingSchedules);
      if (!d.Page.pageInfo.hasNextPage) break;
    }
    sched = { at: Date.now(), list, ok: true };
  } catch (e) {
    console.warn(e);
    sched = {
      at: Date.now(), ok: false,
      list: planningItems().filter((i) => i.ids.al && i.nextEp && i.nextEp.airingAt >= from && i.nextEp.airingAt < to)
        .map((i) => ({ episode: i.nextEp.episode, airingAt: i.nextEp.airingAt, mediaId: i.ids.al })),
    };
  }
}

/* =========================================================
   Thèmes & fonds d'écran
   ========================================================= */
let wallColor = null;   // couleur de l'animé affiché en fond (thème Dynamique)
let wallTimer = null;
let wallFront = 'A';
let wallCurrent = null;

function applyTheme() {
  const th = THEMES[db.settings.theme] || THEMES.neon;
  let a1 = th.a1, a2 = th.a2;
  if (th.dynamic) {
    const p = neonPair(wallColor);
    if (p) { a1 = p.a1; a2 = p.a2; }
  }
  const root = document.documentElement;
  const r1 = hexToRgb(a1), r2 = hexToRgb(a2);
  root.style.setProperty('--a1', a1);
  root.style.setProperty('--a2', a2);
  root.style.setProperty('--a1-rgb', r1.join(','));
  root.style.setProperty('--a2-rgb', r2.join(','));
  root.style.setProperty('--grad', `linear-gradient(120deg, ${a1}, ${a2})`);
  root.style.setProperty('--bg', th.bg);
  root.style.setProperty('--wall-blur', `${db.settings.wall.blur}px`);
  root.style.setProperty('--wall-dim', String(db.settings.wall.dim));
  $('meta[name=theme-color]')?.setAttribute('content', th.bg);
}

function customWall() { try { return localStorage.getItem(WALL_KEY); } catch (e) { return null; } }

/** Liste des fonds possibles selon le réglage */
function wallCandidates() {
  const w = db.settings.wall;
  if (w.mode === 'none') return [];
  if (w.mode === 'custom') { const c = customWall(); return c ? [{ img: c, color: null }] : []; }
  if (w.mode === 'pick') {
    const it = getItem(w.uid);
    return it ? [{ img: it.banner || it.cover, color: it.color }] : [];
  }
  if (w.mode === 'trending') {
    const t = Array.isArray(discCache.trending) ? discCache.trending : [];
    return t.filter((m) => m.banner).slice(0, 12).map((m) => ({ img: m.banner, color: m.color }));
  }
  // auto : bannières de ma liste (en cours et favoris d'abord)
  const prio = (i) => (i.status === 'watching' ? 3 : 0) + (i.favorite ? 2 : 0) + (i.rating >= 8 ? 1 : 0);
  return db.items.filter((i) => i.banner || i.cover).sort((a, b) => prio(b) - prio(a)).slice(0, 15)
    .map((i) => ({ img: i.banner || i.cover, color: i.color }));
}
function showWall(c) {
  document.body.classList.toggle('no-wall', !c);
  const front = $('#wall' + wallFront), back = $('#wall' + (wallFront === 'A' ? 'B' : 'A'));
  if (!c) { front.classList.remove('on'); back.classList.remove('on'); wallColor = null; applyTheme(); return; }
  const img = new Image();
  img.referrerPolicy = 'no-referrer';
  img.onload = () => {
    back.style.backgroundImage = `url("${String(c.img).replace(/"/g, '')}")`;
    back.classList.add('on'); front.classList.remove('on');
    wallFront = wallFront === 'A' ? 'B' : 'A';
    wallColor = c.color; wallCurrent = c; applyTheme();
  };
  img.onerror = () => { /* image indisponible : on garde l'ancienne */ };
  img.src = c.img;
}
function startWall() {
  clearInterval(wallTimer);
  const w = db.settings.wall;
  if (w.mode === 'trending' && !Array.isArray(discCache.trending)) {
    loadDiscover('trending').then(startWall).catch(() => showWall(null));
    return;
  }
  const list = wallCandidates();
  if (!list.length) { showWall(null); return; }
  let k = Math.floor(Math.random() * list.length);
  showWall(list[k]);
  if (list.length > 1) {
    wallTimer = setInterval(() => {
      if (document.hidden) return;
      k = (k + 1) % list.length; showWall(list[k]);
    }, 40000);
  }
}
/** Image perso : redimensionnée pour tenir dans le stockage du téléphone */
function setCustomWall(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1600, sc = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      try {
        localStorage.setItem(WALL_KEY, cv.toDataURL('image/jpeg', 0.84));
        resolve();
      } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    img.src = url;
  });
}

/* =========================================================
   Effets : +1, arc terminé, gacha
   ========================================================= */
function burst(x, y, text = '+1') {
  const b = document.createElement('div');
  b.className = 'burst';
  b.style.left = x + 'px'; b.style.top = y + 'px';
  const cols = ['var(--a1)', 'var(--a2)', '#fff', '#ffd23f'];
  let html = `<b>${esc(text)}</b>`;
  for (let i = 0; i < 16; i++) {
    const ang = (Math.PI * 2 * i) / 16 + Math.random() * 0.3, dist = 40 + Math.random() * 40;
    html += `<i style="--c:${cols[i % 4]};--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist}px;--r:${Math.random() * 360}deg"></i>`;
  }
  b.innerHTML = html;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 900);
}
function burstFrom(el, text) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, text);
}
function petals(n = 26) {
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
    p.style.setProperty('--r', (Math.random() * 720) + 'deg');
    p.style.animationDuration = (2.4 + Math.random() * 2.2) + 's';
    p.style.animationDelay = (Math.random() * 0.8) + 's';
    p.style.background = ['#ffb7d5', '#ffd1e6', '#ff8fc7'][i % 3];
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 5600);
  }
}
function celebrate(it) {
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = `<div class="speedlines"></div><div class="cap"><div class="big-k">完走</div><b>ARC TERMINÉ</b>
    <span>${esc(titleOf(it))}</span><span class="small">${esc(pick(QUIPS.complete))}</span></div>`;
  o.addEventListener('click', () => o.remove());
  $('#fx').appendChild(o);
  petals();
  haptic();
  setTimeout(() => o.remove(), 3200);
}

/* Gacha du soir */
function gachaRarity(m) {
  const s = m.score || 0;
  if (s >= 8.5) return { r: 'SSR', c: '#ffd23f' };
  if (s >= 7.5) return { r: 'SR', c: '#c77dff' };
  return { r: 'R', c: '#4fb3ff' };
}
function openGacha() {
  let pool = db.items.filter((i) => i.status === 'planning');
  if (!pool.length) pool = db.items.filter((i) => i.status === 'watching' || i.status === 'paused');
  if (!pool.length) { toast('Pas de tirage possible : ajoute des animés « À voir » d\'abord !'); return; }
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = `<div class="speedlines"></div><div class="gacha">
      <div class="gm">ガチャ · Tirage du soir</div>
      <div class="card rolling" id="gCard"></div>
      <div class="rarity" id="gRar">?</div>
      <div class="gt" id="gTitle">…</div>
      <div class="gm" id="gMeta"></div>
      <div class="row" id="gActs" style="opacity:0;pointer-events:none">
        <button class="btn" data-g="again">🎲 Relancer</button>
        <button class="btn primary" data-g="go">C'est parti</button>
      </div>
      <button class="btn ghost" data-g="close" style="margin-top:4px">Fermer</button>
    </div>`;
  $('#fx').appendChild(o);
  let chosen = null;
  const card = $('#gCard', o);
  const roll = () => {
    $('#gActs', o).style.opacity = 0; $('#gActs', o).style.pointerEvents = 'none';
    card.className = 'card rolling'; card.style.removeProperty('--rc');
    $('#gRar', o).textContent = '?'; $('#gTitle', o).textContent = '…'; $('#gMeta', o).textContent = '';
    let n = 0;
    const t = setInterval(() => {
      const it = pool[Math.floor(Math.random() * pool.length)];
      card.style.backgroundImage = it.cover ? `url("${String(it.cover).replace(/"/g, '')}")` : '';
      if (++n > 16) {
        clearInterval(t);
        chosen = pool[Math.floor(Math.random() * pool.length)];
        const rar = gachaRarity(chosen);
        card.style.backgroundImage = chosen.cover ? `url("${String(chosen.cover).replace(/"/g, '')}")` : '';
        card.className = 'card reveal';
        o.style.setProperty('--rc', rar.c);
        $('#gRar', o).textContent = rar.r;
        $('#gTitle', o).textContent = titleOf(chosen);
        $('#gMeta', o).textContent = `Ce soir : épisode ${(chosen.progress || 0) + 1}${chosen.episodes ? ' / ' + chosen.episodes : ''}`;
        $('#gActs', o).style.opacity = 1; $('#gActs', o).style.pointerEvents = 'auto';
        db.stats.gacha = (db.stats.gacha || 0) + 1; touch();
        if (rar.r === 'SSR') petals(18);
        haptic();
      }
    }, 95);
  };
  o.addEventListener('click', (e) => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    if (b.dataset.g === 'close') o.remove();
    if (b.dataset.g === 'again') roll();
    if (b.dataset.g === 'go' && chosen) { o.remove(); openDetail({ uid: chosen.uid }); }
  });
  roll();
}

/* =========================================================
   Vues
   ========================================================= */
const TITLES = {
  list: ['Ma liste', 'マイリスト'], planning: ['Simulcast', 'スケジュール'], search: ['Invocation', 'さがす'],
  discover: ['Découvrir', 'ディスカバー'], stats: ['Statut', 'ステータス'],
};
let spotTimer = null;
function switchTab(tab) {
  ui.tab = tab; saveUi();
  $$('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  window.scrollTo(0, 0);
  render();
}
function render() {
  clearInterval(spotTimer);
  const [t, jp] = TITLES[ui.tab] || TITLES.list;
  $('#viewTitle').textContent = t;
  $('#viewJp').textContent = jp;
  const v = $('#view');
  v.style.animation = 'none'; void v.offsetWidth; v.style.animation = '';
  const fn = { list: renderList, planning: renderPlanning, search: renderSearch, discover: renderDiscover, stats: renderStats }[ui.tab] || renderList;
  fn(v);
}
const h2 = (t, jp, more = '') => `<div class="h2"><span>${t}</span><span class="jp">${jp}</span>${more ? `<span class="more">${more}</span>` : ''}</div>`;
const img = (src, cls = '', extra = '') => `<img class="${cls}" src="${esc(src || '')}" alt="" loading="lazy" referrerpolicy="no-referrer" ${extra}>`;

function srcBadges(m) {
  const map = { al: 'AL', mal: 'MAL', kt: 'KT' };
  return `<span class="src">${(m.sources || []).map((s) => `<span class="${s}">${map[s]}</span>`).join('')}</span>`;
}
const progressText = (i) => `Ép. ${i.progress || 0}${i.episodes ? '/' + i.episodes : ''}`;

/* ---------------- Ma liste ---------------- */
function sortItems(list) {
  const by = {
    updated: (a, b) => b.updatedAt - a.updatedAt,
    added: (a, b) => b.addedAt - a.addedAt,
    title: (a, b) => titleOf(a).localeCompare(titleOf(b), 'fr'),
    rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
    progress: (a, b) => ((b.progress || 0) / (b.episodes || 999)) - ((a.progress || 0) / (a.episodes || 999)),
    next: (a, b) => (a.nextEp?.airingAt || 9e12) - (b.nextEp?.airingAt || 9e12),
  }[ui.sort] || ((a, b) => b.updatedAt - a.updatedAt);
  return list.slice().sort(by);
}
function filteredItems() {
  const q = normKey(ui.q);
  return db.items.filter((i) => {
    if (ui.status !== 'all' && i.status !== ui.status) return false;
    if (ui.cat === 'fav' && !i.favorite) return false;
    if (ui.cat && ui.cat !== 'fav' && !i.categories.includes(ui.cat)) return false;
    if (q && ![i.title?.romaji, i.title?.english, i.title?.native].some((t) => normKey(t).includes(q))) return false;
    return true;
  });
}
function tileHTML(i) {
  const pct = i.episodes ? clamp((i.progress || 0) / i.episodes * 100, 0, 100) : 0;
  const behind = behindOf(i);
  const cats = i.categories.map(catById).filter(Boolean).slice(0, 4);
  const st = STATUSES[i.status], tr = tierOf(i.rating);
  return `<div class="tile ${i.favorite ? 'holo' : ''}" data-act="open" data-uid="${esc(i.uid)}" role="button">
    <div class="poster" style="background-color:${esc(i.color || '#1c1928')}">
      ${i.cover ? img(i.cover) : ''}
      ${behind ? `<span class="badge tl new">+${behind}</span>` : i.favorite ? `<span class="badge tl" style="color:#ffd23f">★</span>` : ''}
      ${tr ? `<span class="tier" style="--tc:${tr.c}">${tr.t}</span>` : ''}
      <span class="kanji-st" style="--sc:${st.c}">${st.k}</span>
      ${cats.length ? `<div class="cat-dots">${cats.map((c) => `<i style="--c:${esc(c.color)}"></i>`).join('')}</div>` : ''}
      ${i.episodes ? `<div class="pbar"><i style="width:${pct}%"></i></div>` : ''}
    </div>
    <div class="t">${esc(titleOf(i))}</div>
    <div class="sub">${progressText(i)}${i.rating != null ? ` · ${i.rating}/10` : ''}</div>
  </div>`;
}
function rowHTML(i, extra = '') {
  const pct = i.episodes ? clamp((i.progress || 0) / i.episodes * 100, 0, 100) : 0;
  const st = STATUSES[i.status];
  const behind = behindOf(i);
  const next = i.nextEp && i.nextEp.airingAt > nowSec() ? ` · Ép. ${i.nextEp.episode} ${fmtIn(i.nextEp.airingAt)}` : '';
  const canPlus = ['watching', 'planning', 'paused'].includes(i.status) && (!i.episodes || i.progress < i.episodes);
  const bimg = i.banner || i.cover;
  return `<div class="rowcard ${bimg ? 'bannered' : ''}" ${bimg ? `style="--bimg:${cssUrl(bimg)}"` : ''} data-act="open" data-uid="${esc(i.uid)}" role="button">
    ${img(i.cover, 'thumb')}
    <div class="grow">
      <div class="t">${esc(titleOf(i))}</div>
      <div class="meta"><span class="status-pill" style="--sc:${st.c}">${st.label}</span> · ${progressText(i)}${behind ? ` · <b style="color:var(--a1)">+${behind} dispo</b>` : ''}${next}${extra}</div>
      ${i.episodes ? `<div class="mini"><i style="width:${pct}%"></i></div>` : ''}
    </div>
    ${canPlus ? `<button class="plus1" data-act="plus1" data-uid="${esc(i.uid)}">+1</button>` : ''}
  </div>`;
}
function resumeCard(i) {
  const pct = i.episodes ? Math.round(clamp((i.progress || 0) / i.episodes * 100, 0, 100)) : 0;
  const behind = behindOf(i);
  const next = i.nextEp && i.nextEp.airingAt > nowSec() ? `Ép. ${i.nextEp.episode} ${fmtIn(i.nextEp.airingAt)}` : '';
  return `<div class="resume" style="background-image:${cssUrl(i.banner || i.cover)}" data-act="open" data-uid="${esc(i.uid)}" role="button">
    ${i.title?.native ? `<div class="vert">${esc(i.title.native)}</div>` : ''}
    <div class="in">
      ${img(i.cover, 'cv')}
      <div class="grow">
        <div class="t">${esc(titleOf(i))}</div>
        <div class="ep">${progressText(i)}${behind ? ` · <b style="color:var(--a1)">+${behind} dispo</b>` : ''}</div>
        ${next ? `<div class="ep" style="color:var(--a2)">${esc(next)}</div>` : ''}
        <div class="acts">
          <div class="ring" style="--p:${pct}">${i.episodes ? pct + '%' : '∞'}</div>
          ${!i.episodes || i.progress < i.episodes ? `<button class="plus1" data-act="plus1" data-uid="${esc(i.uid)}">+1 ÉP.</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}
function renderList(v) {
  if (!db.items.length) {
    v.innerHTML = `<div class="empty panel"><div class="speedlines"></div><div class="big">🍥</div><b>Ta liste est vide</b>
      Elle est aussi vide qu'un village de départ d'isekai. Invoque ton premier animé : AniList, MyAnimeList et Kitsu sont fouillés en même temps.<br><br>
      <button class="btn primary" data-act="tab" data-tab="search">Invoquer un animé</button>
      <br><br><button class="btn" data-act="tab" data-tab="discover">Voir les tendances</button></div>`;
    return;
  }
  const watching = db.items.filter((i) => i.status === 'watching').sort((a, b) => behindOf(b) - behindOf(a) || b.updatedAt - a.updatedAt);
  const planningN = db.items.filter((i) => i.status === 'planning').length;
  const counts = { all: db.items.length };
  STATUS_ORDER.forEach((s) => (counts[s] = db.items.filter((i) => i.status === s).length));
  const usedCats = db.categories.filter((c) => db.items.some((i) => i.categories.includes(c.id)));
  const favCount = db.items.filter((i) => i.favorite).length;
  const list = sortItems(filteredItems());

  v.innerHTML = `
    ${watching.length ? `${h2('Reprendre', 'つづき', watching.length > 1 ? `${watching.length} en cours ›` : '')}
      <div class="carousel">${watching.map(resumeCard).join('')}</div>` : ''}
    ${planningN >= 2 ? `<div class="panel row" style="margin-top:${watching.length ? 6 : 0}px;gap:12px">
      <div style="font-size:30px">🎰</div>
      <div class="grow"><b>Que regarder ce soir ?</b><div class="small muted">Lance le gacha parmi tes ${planningN} animés « À voir ».</div></div>
      <button class="btn primary" data-act="gacha">Tirer</button></div>` : ''}

    ${h2('Collection', 'コレクション', `${db.items.length} titres`)}
    <div class="searchbox"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input class="input" id="libSearch" type="search" placeholder="Filtrer ma liste…" value="${esc(ui.q)}" autocomplete="off"></div>
    <div class="chips" style="margin-top:12px">
      <button class="chip ${ui.status === 'all' ? 'on' : ''}" data-act="fstatus" data-v="all">Tous <span class="count">${counts.all}</span></button>
      ${STATUS_ORDER.filter((s) => counts[s]).map((s) => `<button class="chip ${ui.status === s ? 'on' : ''}" style="--c:${STATUSES[s].c}" data-act="fstatus" data-v="${s}"><span class="k" style="color:${STATUSES[s].c}">${STATUSES[s].k}</span>${STATUSES[s].label} <span class="count">${counts[s]}</span></button>`).join('')}
    </div>
    ${usedCats.length || favCount ? `<div class="chips" style="margin-top:6px">
      ${favCount ? `<button class="chip ${ui.cat === 'fav' ? 'on' : ''}" style="--c:#ffd23f" data-act="fcat" data-v="fav">★ Favoris</button>` : ''}
      ${usedCats.map((c) => `<button class="chip ${ui.cat === c.id ? 'on' : ''}" style="--c:${esc(c.color)}" data-act="fcat" data-v="${esc(c.id)}">${esc(c.emoji || '')} ${esc(c.name)}</button>`).join('')}
    </div>` : ''}
    <div class="toolbar">
      <select class="select" id="sortSel" aria-label="Trier">
        ${[['updated', 'Modifiés récemment'], ['added', 'Ajoutés récemment'], ['title', 'Titre A → Z'], ['rating', 'Ma note'], ['progress', 'Progression'], ['next', 'Prochain épisode']]
          .map(([k, l]) => `<option value="${k}" ${ui.sort === k ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <div class="seg">
        <button class="${ui.view === 'grid' ? 'on' : ''}" data-act="view" data-v="grid" aria-label="Grille"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></button>
        <button class="${ui.view === 'rows' ? 'on' : ''}" data-act="view" data-v="rows" aria-label="Liste"><svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg></button>
      </div>
    </div>
    <div id="libOut">${libOutHTML(list)}</div>
  `;
  const inp = $('#libSearch');
  inp.addEventListener('input', () => { ui.q = inp.value; $('#libOut').innerHTML = libOutHTML(sortItems(filteredItems())); });
  $('#sortSel').addEventListener('change', (e) => { ui.sort = e.target.value; saveUi(); $('#libOut').innerHTML = libOutHTML(sortItems(filteredItems())); });
}
function libOutHTML(list) {
  if (!list.length) return `<div class="empty"><div class="big">🔍</div><b>Rien ici</b>Aucun animé ne correspond à ces filtres.</div>`;
  return ui.view === 'grid' ? `<div class="grid">${list.map(tileHTML).join('')}</div>` : `<div class="rows">${list.map((i) => rowHTML(i)).join('')}</div>`;
}

/* ---------------- Recherche (invocation) ---------------- */
const mediaCache = new Map();
const search = { q: '', results: null, status: null, seq: 0, quip: '' };
let searchTimer;
function renderSearch(v) {
  v.innerHTML = `
    <form class="searchbox" id="searchForm" autocomplete="off">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input class="input" id="searchInput" type="search" enterkeyhint="search" placeholder="Nom de l'animé (même en romaji, on ne juge pas)" value="${esc(search.q)}">
    </form>
    <div id="searchOut"></div>`;
  const inp = $('#searchInput');
  $('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); inp.blur(); runSearch(inp.value, true); });
  inp.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => runSearch(inp.value), 650); });
  if (!search.q) setTimeout(() => inp.focus(), 60);
  renderSearchOut();
}
async function runSearch(q, force) {
  q = q.trim();
  if (q === search.q && !force && search.results) return;
  search.q = q;
  if (q.length < 2) { search.results = null; search.status = null; renderSearchOut(); return; }
  const seq = ++search.seq;
  const groups = { al: [], mal: [], kt: [] };
  search.status = { al: 'wait', mal: 'wait', kt: 'wait' };
  search.results = []; search.quip = pick(QUIPS.loading);
  renderSearchOut();
  const run = (k, fn) => fn()
    .then((r) => { groups[k] = r; search.status[k] = 'ok'; })
    .catch((e) => { console.warn(k, e); search.status[k] = 'ko'; })
    .finally(() => {
      if (seq !== search.seq) return;
      search.results = mergeResults([groups.al, groups.mal, groups.kt]);
      renderSearchOut();
    });
  await Promise.all([run('al', () => searchAL(q)), run('mal', () => searchJikan(q)), run('kt', () => searchKitsu(q))]);
}
function resultRowHTML(m) {
  mediaCache.set(keyOf(m), m);
  const inList = findItem(m);
  const meta = [m.format, m.year, m.episodes ? `${m.episodes} ép.` : null, AIRING_LABEL[m.airingStatus]].filter(Boolean).join(' · ');
  const bimg = m.banner;
  return `<div class="rowcard ${bimg ? 'bannered' : ''}" ${bimg ? `style="--bimg:${cssUrl(bimg)}"` : ''} data-act="${inList ? 'open' : 'preview'}" data-uid="${esc(inList ? inList.uid : keyOf(m))}" role="button">
    ${img(m.cover, 'thumb')}
    <div class="grow">
      <div class="t">${esc(titleOf(m))}</div>
      ${altTitleOf(m) ? `<div class="meta">${esc(altTitleOf(m))}</div>` : ''}
      <div class="meta">${esc(meta)}${m.score ? ` · ★ ${m.score.toFixed(1)}` : ''}</div>
      <div class="meta" style="margin-top:5px">${srcBadges(m)} ${inList ? `<span class="inlist">✓ ${STATUSES[inList.status].label}</span>` : ''}</div>
    </div>
    ${inList ? '' : `<button class="plus1" data-act="quickadd" data-uid="${esc(keyOf(m))}" aria-label="Ajouter">＋</button>`}
  </div>`;
}
function renderSearchOut() {
  const out = $('#searchOut');
  if (!out) return;
  if (!search.status) {
    out.innerHTML = `<div class="empty panel" style="margin-top:16px"><div class="speedlines"></div><div class="big">🔮</div><b>Invocation multi-bases</b>
      AniList, MyAnimeList (via Jikan) et Kitsu sont interrogés en même temps. Les doublons fusionnent comme une fusion de Saiyans.</div>`;
    return;
  }
  const s = search.status, lbl = { al: 'AniList', mal: 'MyAnimeList', kt: 'Kitsu' };
  const st = `<div class="src-status">${Object.keys(lbl).map((k) => `<span class="${s[k]}">${lbl[k]}</span>`).join('')}</div>`;
  const pending = Object.values(s).includes('wait');
  if (!search.results.length) {
    out.innerHTML = st + (pending
      ? `<div class="loading-quip">${esc(search.quip)}</div><div class="rows">${'<div class="rowcard skeleton" style="height:98px"></div>'.repeat(4)}</div>`
      : `<div class="empty"><div class="big">🕵️</div><b>Aucun résultat</b>${esc(pick(QUIPS.noResult))}<br>Essaie le titre japonais en romaji (ex. « Shingeki no Kyojin »).</div>`);
    return;
  }
  out.innerHTML = st + `<div class="rows">${search.results.map(resultRowHTML).join('')}</div>`;
}

/* ---------------- Simulcast ---------------- */
function renderPlanning(v) {
  const items = planningItems();
  const behindList = db.items.filter((i) => behindOf(i) > 0).sort((a, b) => behindOf(b) - behindOf(a));
  const byAl = new Map(db.items.filter((i) => i.ids.al).map((i) => [i.ids.al, i]));
  const today = startOfDay();
  let html = '';

  if (behindList.length) html += `${h2('À rattraper', 'おいつけ')}<div class="rows">${behindList.map((i) => rowHTML(i)).join('')}</div>`;

  html += h2('Cette semaine', 'こんしゅう', sched.at && !sched.ok ? 'hors ligne' : '');
  if (!sched.at) {
    html += `<div class="loading-quip">${esc(pick(QUIPS.loading))}</div><div class="rows">${'<div class="rowcard skeleton" style="height:100px"></div>'.repeat(3)}</div>`;
  } else {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const start = today + d * 86400000, end = start + 86400000;
      const eps = sched.list.filter((e) => e.airingAt * 1000 >= start && e.airingAt * 1000 < end && byAl.has(e.mediaId));
      days.push({ start, eps, d });
    }
    if (ui.day == null || !days[ui.day]) ui.day = Math.max(0, days.findIndex((x) => x.eps.length));
    html += `<div class="days">${days.map((x) => {
      const dt = new Date(x.start);
      return `<button class="${x.d === ui.day ? 'on' : ''} ${x.d === 0 ? 'today' : ''}" data-act="day" data-v="${x.d}">
        ${x.eps.length ? `<span class="n">${x.eps.length}</span>` : ''}<span class="k">${KANJI_DAYS[dt.getDay()]}</span><span class="d">${x.d === 0 ? 'auj.' : dt.getDate()}</span></button>`;
    }).join('')}</div>`;
    const day = days[ui.day];
    const label = ui.day === 0 ? "Aujourd'hui" : ui.day === 1 ? 'Demain' : fmtDay.format(day.start);
    html += `<div class="small muted" style="margin:-4px 0 10px;font-weight:800">${esc(label.charAt(0).toUpperCase() + label.slice(1))}${ui.day <= 1 ? ' · ' + esc(fmtDay.format(day.start)) : ''}</div>`;
    if (!day.eps.length) {
      html += `<div class="panel small muted" style="text-align:center">Aucun épisode ce jour-là. Le calme avant l'arc final.</div>`;
    } else {
      html += `<div class="rows">${day.eps.map((e) => {
        const i = byAl.get(e.mediaId);
        const past = e.airingAt <= nowSec();
        return `<div class="ep-card ${past ? 'past' : ''}" data-act="open" data-uid="${esc(i.uid)}" role="button">
          <div class="bg" style="background-image:${cssUrl(i.banner || i.cover)}"></div>
          <div class="time"><b>${fmtTime.format(e.airingAt * 1000)}</b><small>${past ? 'SORTI' : esc(fmtInShort(e.airingAt))}</small></div>
          <div class="body grow"><div class="t">${esc(titleOf(i))}</div>
            <div><span class="num">Épisode ${e.episode}${i.episodes ? '/' + i.episodes : ''}</span> <span class="status-pill" style="--sc:${STATUSES[i.status].c};margin-left:6px">${STATUSES[i.status].label}</span></div>
            <div class="tiny muted" style="margin-top:4px">Vu jusqu'à l'ép. ${i.progress || 0}</div></div>
        </div>`;
      }).join('')}</div>`;
    }
  }

  const weekEnd = Math.floor(today / 1000) + 7 * 86400;
  const later = items.filter((i) => (i.nextEp && i.nextEp.airingAt >= weekEnd) || (!i.nextEp && i.airingStatus === 'NOT_YET_RELEASED'))
    .sort((a, b) => (a.nextEp?.airingAt || Date.parse(a.startDate || '2999') / 1000) - (b.nextEp?.airingAt || Date.parse(b.startDate || '2999') / 1000));
  if (later.length) {
    html += `${h2('Plus tard', 'これから')}<div class="rows">${later.map((i) => {
      const when = i.nextEp ? `Ép. ${i.nextEp.episode} · ${fmtShort.format(i.nextEp.airingAt * 1000)}` : i.startDate ? `Sortie prévue ${fmtDate.format(new Date(i.startDate))}` : 'Date inconnue';
      const bimg = i.banner || i.cover;
      return `<div class="rowcard ${bimg ? 'bannered' : ''}" ${bimg ? `style="--bimg:${cssUrl(bimg)}"` : ''} data-act="open" data-uid="${esc(i.uid)}" role="button">
        ${img(i.cover, 'thumb')}<div class="grow"><div class="t">${esc(titleOf(i))}</div><div class="meta">${esc(when)}</div></div></div>`;
    }).join('')}</div>`;
  }

  if (!items.length && !behindList.length) {
    html = `<div class="empty panel"><div class="speedlines"></div><div class="big">📺</div><b>Rien à suivre pour l'instant</b>
      Ajoute des animés en cours de diffusion (« En cours » ou « À voir ») : leurs épisodes apparaîtront ici, à l'heure française.<br><br>
      <button class="btn primary" data-act="disc" data-v="season">Voir la saison en cours</button></div>`;
  }
  v.innerHTML = html;

  if (Date.now() - sched.at > 20 * 60 * 1000) {
    loadSchedule().then(() => { if (ui.tab === 'planning') renderPlanning($('#view')); });
  }
}

/* ---------------- Découvrir ---------------- */
function renderDiscover(v) {
  const key = DISC_TABS[ui.disc] ? ui.disc : 'trending';
  const data = discCache[key];
  const chips = `<div class="chips">${Object.entries(DISC_TABS).map(([k, t]) => `<button class="chip ${k === key ? 'on' : ''}" data-act="disc" data-v="${k}">${esc(t.label())}</button>`).join('')}</div>`;
  let body;
  if (data === 'error') {
    body = `<div class="empty"><div class="big">📡</div><b>AniList ne répond pas</b>${esc(pick(QUIPS.error))}<br><br><button class="btn" data-act="disc" data-v="${key}">Réessayer</button></div>`;
  } else if (Array.isArray(data)) {
    data.forEach((m) => mediaCache.set(keyOf(m), m));
    const spots = data.filter((m) => m.banner).slice(0, 5);
    body = `${spots.length ? `<div class="spot" id="spot">
        ${spots.map((m, k) => `<div class="slide ${k === 0 ? 'on' : ''}" style="background-image:${cssUrl(m.banner)}" data-act="${findItem(m) ? 'open' : 'preview'}" data-uid="${esc(findItem(m)?.uid || keyOf(m))}">
          <div class="cap"><div class="rank">#${data.indexOf(m) + 1}</div><div class="t">${esc(titleOf(m))}</div>
          <div class="m">${esc([m.studio, m.episodes ? m.episodes + ' ép.' : null, m.score ? '★ ' + m.score.toFixed(1) : null].filter(Boolean).join(' · '))}</div></div></div>`).join('')}
        <div class="dots">${spots.map((_, k) => `<i class="${k === 0 ? 'on' : ''}"></i>`).join('')}</div></div>` : ''}
      ${h2('Classement', 'ランキング')}
      <div class="grid">${data.map((m, idx) => {
        const it = findItem(m);
        return `<div class="tile" data-act="${it ? 'open' : 'preview'}" data-uid="${esc(it ? it.uid : keyOf(m))}" role="button">
          <div class="poster" style="background-color:${esc(m.color || '#1c1928')}">
            ${m.cover ? img(m.cover) : ''}
            <span class="badge tl" ${it ? 'style="color:var(--ok)"' : ''}>${it ? '✓' : '#' + (idx + 1)}</span>
            ${m.score ? `<span class="badge tr">★ ${m.score.toFixed(1)}</span>` : ''}
            ${m.nextEp ? `<span class="badge bl">Ép. ${m.nextEp.episode} · ${esc(fmtInShort(m.nextEp.airingAt))}</span>` : m.format ? `<span class="badge bl">${esc(m.format)}</span>` : ''}
          </div>
          <div class="t">${esc(titleOf(m))}</div>
          <div class="sub">${esc([m.studio, m.episodes ? m.episodes + ' ép.' : null].filter(Boolean).join(' · '))}</div>
        </div>`;
      }).join('')}</div>`;
  } else {
    body = `<div class="loading-quip" style="margin-top:14px">${esc(pick(QUIPS.loading))}</div><div class="skeleton" style="height:230px;border-radius:24px"></div>
      <div class="grid" style="margin-top:20px">${'<div><div class="skeleton" style="aspect-ratio:2/3"></div></div>'.repeat(6)}</div>`;
  }
  v.innerHTML = chips + `<div style="margin-top:14px">${body}</div>`;
  if (!data) {
    loadDiscover(key).catch((e) => { console.warn(e); discCache[key] = 'error'; })
      .finally(() => { if (ui.tab === 'discover' && ui.disc === key) renderDiscover($('#view')); });
  }
  const spot = $('#spot');
  if (spot) {
    let k = 0;
    const slides = $$('.slide', spot), dots = $$('.dots i', spot);
    clearInterval(spotTimer);
    spotTimer = setInterval(() => {
      slides[k].classList.remove('on'); dots[k].classList.remove('on');
      k = (k + 1) % slides.length;
      slides[k].classList.add('on'); dots[k].classList.add('on');
    }, 5000);
  }
}

/* ---------------- Statut (fenêtre RPG) ---------------- */
function renderStats(v) {
  const items = db.items;
  const s = computeStats();
  const p = heroProfile(s);
  const pctLvl = p.next > p.cur ? clamp((p.xp - p.cur) / (p.next - p.cur) * 100, 0, 100) : 100;
  const rated = items.filter((i) => i.rating != null);
  const avg = rated.length ? (rated.reduce((a, i) => a + i.rating, 0) / rated.length).toFixed(1) : '–';
  const gmap = {};
  items.forEach((i) => (i.genres || []).forEach((g) => (gmap[g] = (gmap[g] || 0) + 1)));
  const skills = Object.entries(gmap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const stack = STATUS_ORDER.map((st) => ({ st, n: items.filter((i) => i.status === st).length })).filter((x) => x.n);
  const catRows = db.categories.map((c) => ({ c, n: items.filter((i) => i.categories.includes(c.id)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  const got = ACHIEVEMENTS.filter((a) => db.achievements[a.id]).length;
  const bars = (rows, max) => `<div class="bars">${rows.map((r) => `<div class="bar"><span class="lbl">${r.l}</span><span class="track"><i style="width:${(r.n / max) * 100}%;--c:${r.c || 'var(--a1)'}"></i></span><span class="n">${r.n}</span></div>`).join('')}</div>`;

  v.innerHTML = `
    <div class="status-win">
      <div class="ttl"><span>STATUS</span><span>ステータス</span></div>
      <div class="who">
        <div class="rankbig">${p.rank.r}</div>
        <div class="grow">
          <div class="name">${esc(db.settings.heroName || 'Tom')}</div>
          <div class="cls">Classe : ${esc(p.cls)}</div>
          <span class="title-flair">${esc(p.rank.t)}</span>
        </div>
      </div>
      <div class="xp"><div class="lbl"><span>Niveau ${p.level}</span><span>${p.xp - p.cur} / ${p.next - p.cur} XP</span></div><div class="bar"><i style="width:${pctLvl}%"></i></div></div>
      <div class="attrs">
        <div class="attr"><span>FOR · épisodes</span><b>${s.eps}</b></div>
        <div class="attr"><span>END · temps</span><b>${fmtDuration(s.minutes)}</b></div>
        <div class="attr"><span>INT · avis</span><b>${s.notes}</b></div>
        <div class="attr"><span>SAG · note moy.</span><b>${avg}</b></div>
        <div class="attr"><span>CHA · favoris</span><b>${s.favs}</b></div>
        <div class="attr"><span>CHC · gacha</span><b>${s.gacha}</b></div>
        <div class="attr"><span>Animés</span><b>${s.items}</b></div>
        <div class="attr"><span>Terminés</span><b>${s.done}</b></div>
      </div>
      ${s.minutes > 9000 ? `<div class="over9000">⚡ Son niveau de puissance… il dépasse les 9000 ! ⚡</div>` : ''}
    </div>

    ${skills.length ? `${h2('Compétences', 'スキル')}<div class="panel skills">${skills.map(([g, n]) => `<div class="sk"><span>${esc(g)}</span><span class="lv">Lv. ${n}</span></div>`).join('')}</div>` : ''}

    ${h2('Tier list', 'ティア', rated.length ? `${rated.length} notés` : '')}
    ${rated.length ? `<div class="tierlist">${TIERS.map((t) => {
      const its = rated.filter((i) => tierOf(i.rating).t === t.t).sort((a, b) => b.rating - a.rating);
      return `<div class="tierrow"><div class="lab" style="--tc:${t.c}">${t.t}</div><div class="items">${its.length ? its.map((i) => img(i.cover, '', `data-act="open" data-uid="${esc(i.uid)}" title="${esc(titleOf(i))}"`)).join('') : '<span class="none">—</span>'}</div></div>`;
    }).join('')}</div>` : `<div class="panel small muted">Note tes animés (S, A, B, C, D) depuis leur fiche pour remplir ta tier list.</div>`}

    ${h2('Succès', 'じっせき', `${got}/${ACHIEVEMENTS.length}`)}
    <div class="achs">${ACHIEVEMENTS.map((a) => {
      const ok = db.achievements[a.id];
      return `<div class="ach ${ok ? 'got' : 'locked'}"><div class="ic">${a.ic}</div><div><b>${esc(a.n)}</b><small>${esc(a.d)}${ok ? ` · ${esc(fmtDate.format(ok))}` : ''}</small></div></div>`;
    }).join('')}</div>

    ${items.length ? `${h2('Répartition', 'ぶんぷ')}
    <div class="panel">
      <div class="stack">${stack.map((x) => `<i style="--sc:${STATUSES[x.st].c};width:${(x.n / items.length) * 100}%"></i>`).join('')}</div>
      <div class="legend">${stack.map((x) => `<span class="status-pill" style="--sc:${STATUSES[x.st].c}">${STATUSES[x.st].label} · ${x.n}</span>`).join('')}</div>
      ${catRows.length ? `<div style="margin-top:16px">${bars(catRows.map((x) => ({ l: esc(`${x.c.emoji || ''} ${x.c.name}`), n: x.n, c: esc(x.c.color) })), catRows[0].n)}</div>` : ''}
    </div>` : ''}
  `;
}

/* =========================================================
   Fiche détaillée
   ========================================================= */
let openRef = null; // { uid } pour un animé de la liste, { key } pour un aperçu, { settings: true }
let noteDraft = '';
let showTrailer = false;
function openSheet(html, style = '') {
  $('#sheetBody').innerHTML = html;
  const s = $('#sheet'), panel = $('.sheet-panel');
  panel.style.cssText = style;
  if (s.hidden) { s.hidden = false; panel.scrollTop = 0; document.body.style.overflow = 'hidden'; }
}
function closeSheet() {
  $('#sheet').hidden = true; openRef = null; noteDraft = ''; showTrailer = false;
  document.body.style.overflow = '';
  render();
}
function openDetail(ref) {
  openRef = ref; noteDraft = ''; showTrailer = false;
  if (!$('#sheet').hidden) $('.sheet-panel').scrollTop = 0;
  renderDetail();
}

function miniTileHTML(m, label) {
  mediaCache.set(keyOf(m), m);
  const it = findItem(m);
  return `<div class="mini-tile" data-act="${it ? 'open' : 'preview'}" data-uid="${esc(it ? it.uid : keyOf(m))}" role="button">
    <div class="p">${img(m.cover)}${label ? `<div class="rel">${esc(label)}</div>` : ''}${it ? `<span class="badge tl" style="color:var(--ok)">✓</span>` : ''}</div>
    <div class="t">${esc(titleOf(m))}</div></div>`;
}

function renderDetail() {
  if (!openRef) return;
  if (openRef.settings) return renderSettings();
  const item = openRef.uid ? getItem(openRef.uid) : null;
  const m = item || mediaCache.get(openRef.key);
  if (!m) return closeSheet();
  const scroller = $('.sheet-panel'); const keep = $('#sheet').hidden ? 0 : scroller.scrollTop;
  const pair = neonPair(m.color);
  const style = pair ? accentVars(pair.a1, pair.a2) : '';
  const ex = m.ids.al ? extrasCache.get(m.ids.al) : null;

  const meta = [m.format, m.season && m.year ? `${SEASON_K[m.season] || ''} ${SEASON_FR[m.season] || ''} ${m.year}` : m.year, m.episodes ? `${m.episodes} ép.` : null,
    m.duration ? `${m.duration} min` : null, m.studio, AIRING_LABEL[m.airingStatus], m.score ? `★ ${m.score.toFixed(1)}` : null].filter(Boolean);
  const links = Object.entries({ al: 'AniList', mal: 'MyAnimeList', kitsu: 'Kitsu' }).filter(([k]) => m.urls?.[k])
    .map(([k, l]) => `<a href="${esc(m.urls[k])}" target="_blank" rel="noopener">${l} ↗</a>`).join('');

  let airing = '';
  if (m.nextEp && m.nextEp.airingAt > nowSec()) {
    airing = `<div class="airing">📡 Épisode ${m.nextEp.episode}${m.episodes ? '/' + m.episodes : ''}<span class="cd">${esc(fmtIn(m.nextEp.airingAt))}</span><div class="small muted">${esc(fmtShort.format(m.nextEp.airingAt * 1000))}</div></div>`;
  } else if (m.airingStatus === 'NOT_YET_RELEASED' && m.startDate) {
    airing = `<div class="airing">🗓️ Sortie prévue<span class="cd">${esc(fmtDate.format(new Date(m.startDate)))}</span></div>`;
  }

  const trailerUrl = ex?.trailer ? (ex.trailer.site === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(ex.trailer.id)}?autoplay=1&playsinline=1&rel=0`
    : ex.trailer.site === 'dailymotion' ? `https://www.dailymotion.com/embed/video/${encodeURIComponent(ex.trailer.id)}?autoplay=1` : null) : null;

  let body = `
    ${showTrailer && trailerUrl
      ? `<div class="trailer"><iframe src="${esc(trailerUrl)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Bande-annonce"></iframe></div><div style="height:120px"></div>`
      : `<div class="hero" style="background-image:${cssUrl(m.banner || m.cover)}"><div class="tone"></div>
          ${m.title?.native ? `<div class="vert">${esc(m.title.native)}</div>` : ''}
          ${trailerUrl ? `<button class="trailer-btn" data-act="trailer"><svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>Bande-annonce</button>` : ''}
        </div>`}
    <div class="detail-head">
      ${img(m.cover, 'cover')}
      <div class="grow" style="padding-bottom:4px">
        <h2>${esc(titleOf(m))}</h2>
        ${altTitleOf(m) ? `<div class="alt">${esc(altTitleOf(m))}</div>` : ''}
        <div style="margin-top:7px">${srcBadges(m)}</div>
      </div>
    </div>
    <div class="detail-body">
      <div class="meta-line">${meta.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
      ${airing}`;

  if (!item) {
    body += `
      ${h2('Ajouter à ma liste', 'ついか')}
      <div class="statusbar" style="grid-template-columns:repeat(3,1fr)">${['planning', 'watching', 'completed'].map((s) => `<button data-act="add" data-v="${s}" style="--sc:${STATUSES[s].c}"><span class="k">${STATUSES[s].k}</span>${STATUSES[s].label}</button>`).join('')}</div>`;
  } else {
    const behind = behindOf(item), tr = tierOf(item.rating);
    body += `
      ${behind ? `<div class="airing" style="border-color:rgba(var(--a1-rgb),.7)">🍿 <b>${behind}</b> épisode${behind > 1 ? 's' : ''} sorti${behind > 1 ? 's' : ''} pas encore vu${behind > 1 ? 's' : ''}</div>` : ''}
      ${h2('Statut', 'じょうたい')}
      <div class="statusbar">${STATUS_ORDER.map((s) => `<button class="${item.status === s ? 'on' : ''}" data-act="setstatus" data-v="${s}" style="--sc:${STATUSES[s].c}"><span class="k">${STATUSES[s].k}</span>${STATUSES[s].label}</button>`).join('')}</div>

      ${h2('Progression', 'しんこう')}
      <div class="stepper">
        <button data-act="step" data-v="-1" aria-label="Moins un épisode">−</button>
        <div class="val">${item.progress || 0}<small> / ${item.episodes || '?'} ép.</small></div>
        <button class="plus" data-act="step" data-v="1" aria-label="Plus un épisode">+</button>
      </div>
      ${item.episodes && item.progress < item.episodes ? `<button class="btn ghost block" style="margin-top:10px" data-act="allseen">Tout vu · 完走</button>` : ''}

      ${h2('Ma note', 'ひょうか', tr ? esc(tr.lbl) : '')}
      <div class="tiers">
        ${TIERS.map((t) => `<button class="${tr && tr.t === t.t ? 'on' : ''}" style="--tc:${t.c}" data-act="tier" data-v="${t.v}">${t.t}<small>${t.min}+</small></button>`).join('')}
        <button data-act="clearrate" style="--tc:var(--muted)">–<small>aucune</small></button>
      </div>
      <div class="rating">
        <input type="range" id="rateIn" min="0" max="10" step="0.5" value="${item.rating ?? 5}" aria-label="Note sur 10" style="${item.rating == null ? 'opacity:.4' : ''}">
        <div class="score" id="rateOut">${item.rating ?? '–'}<small>/10</small></div>
      </div>
      <button class="btn block" style="margin-top:10px;${item.favorite ? 'border-color:#ffd23f;color:#ffd23f' : ''}" data-act="fav">${item.favorite ? '★ Carte holo · dans mes favoris' : '☆ Ajouter aux favoris'}</button>

      ${h2('Catégories', 'カテゴリー')}
      <div class="chips wrap">
        ${db.categories.map((c) => `<button class="chip ${item.categories.includes(c.id) ? 'on' : ''}" style="--c:${esc(c.color)}" data-act="togglecat" data-v="${esc(c.id)}">${esc(c.emoji || '')} ${esc(c.name)}</button>`).join('')}
        <button class="chip add" data-act="newcat">＋ Nouvelle</button>
      </div>
      <div id="newCatRow" class="row" style="margin-top:8px" hidden>
        <input class="input" id="newCatName" placeholder="Nom de la catégorie (ex. Mecha)" maxlength="30">
        <button class="btn primary" data-act="newcatok">OK</button>
      </div>

      ${h2('Mon journal', 'にっき', item.notes.length ? `${item.notes.length} bulle${item.notes.length > 1 ? 's' : ''}` : '')}
      <textarea class="input" id="noteIn" placeholder="Ce que j'en ai pensé… (« Cet épisode m'a fait pleurer comme à la mort de… »)" maxlength="4000">${esc(noteDraft)}</textarea>
      <div class="row" style="margin-top:8px">
        <label class="small muted grow row" style="gap:6px"><input type="checkbox" id="noteEp" ${item.progress ? 'checked' : ''}> Lier à l'épisode ${item.progress || 0}</label>
        <button class="btn primary" data-act="addnote">Publier</button>
      </div>
      <div style="margin-top:16px">${item.notes.slice().sort((a, b) => b.date - a.date).map((n) => `
        <div class="bubble"><div class="head"><span>${esc(fmtDate.format(n.date))}${n.ep ? ` · Ép. ${n.ep}` : ''}</span>
          <button class="del" data-act="delnote" data-v="${esc(n.id)}" aria-label="Supprimer"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button></div>
          <div class="txt">${esc(n.text)}</div></div>`).join('')}</div>`;
  }

  // Bonus AniList
  if (ex) {
    if (ex.chars.length) {
      body += `${h2('Personnages', 'キャラクター')}<div class="hscroll">${ex.chars.map((c) => `
        <div class="char ${c.role === 'MAIN' ? 'main' : ''}">${img(c.img)}<div class="n">${esc(c.name)}</div><div class="r">${c.role === 'MAIN' ? 'Principal' : c.role === 'SUPPORTING' ? 'Secondaire' : 'Figurant'}</div></div>`).join('')}</div>`;
    }
    const rels = ex.relations.slice().sort((a, b) => REL_ORDER.indexOf(a.rel) - REL_ORDER.indexOf(b.rel));
    if (rels.length) body += `${h2('Univers', 'シリーズ')}<div class="hscroll">${rels.map((r) => miniTileHTML(r.m, REL_FR[r.rel] || r.rel)).join('')}</div>`;
    if (ex.recos.length) body += `${h2('Si tu as aimé', 'おすすめ')}<div class="hscroll">${ex.recos.map((r) => miniTileHTML(r)).join('')}</div>`;
  } else if (m.ids.al) {
    body += `<div class="loading-quip" style="margin-top:20px" id="exLoading">${esc(pick(QUIPS.loading))}</div>`;
  }

  body += `
      ${m.synopsis ? `${h2('Synopsis', 'あらすじ', 'en anglais')}<div class="synopsis clamp" data-act="expand">${esc(m.synopsis)}</div>` : ''}
      ${(m.genres || []).length ? `${h2('Genres', 'ジャンル')}<div class="chips wrap">${m.genres.map((g) => `<span class="chip">${esc(g)}</span>`).join('')}</div>` : ''}
      ${links ? `${h2('Liens', 'リンク')}<div class="links">${links}</div>` : ''}
      ${item ? `<p class="tiny muted" style="margin-top:22px">Ajouté le ${esc(fmtDate.format(item.addedAt))}${item.startedAt ? ` · commencé le ${esc(fmtDate.format(item.startedAt))}` : ''}${item.finishedAt ? ` · terminé le ${esc(fmtDate.format(item.finishedAt))}` : ''}</p>
        <button class="btn danger block" data-act="remove">Retirer de ma liste</button>` : ''}
    </div>`;

  openSheet(body, style);
  scroller.scrollTop = keep;

  const ta = $('#noteIn');
  if (ta) ta.addEventListener('input', () => (noteDraft = ta.value));
  const r = $('#rateIn');
  if (r) {
    r.addEventListener('input', () => { $('#rateOut').innerHTML = `${r.value}<small>/10</small>`; r.style.opacity = 1; });
    r.addEventListener('change', () => { const it = getItem(openRef.uid); it.rating = +r.value; touch(it); renderDetail(); });
  }
  if (!ex && m.ids.al) {
    const ref = openRef;
    loadExtras(m.ids.al).then(() => { if (openRef === ref) renderDetail(); })
      .catch(() => { const l = $('#exLoading'); if (l) l.remove(); });
  }
}

function setProgress(it, val, el) {
  const max = it.episodes || Infinity;
  const before = it.progress || 0;
  it.progress = clamp(val, 0, max);
  if (it.progress > before) {
    const h = new Date().getHours();
    if (h < 5) db.stats.night = true;
    if (el) burstFrom(el, `+${it.progress - before}`);
  }
  if (it.progress > 0 && it.status === 'planning') { it.status = 'watching'; it.startedAt = it.startedAt || Date.now(); toast(pick(QUIPS.start)); }
  if (it.episodes && it.progress >= it.episodes && before < it.episodes && it.status !== 'completed') {
    it.status = 'completed'; it.finishedAt = Date.now();
    celebrate(it);
  }
  touch(it);
}
function setStatus(it, s) {
  const was = it.status;
  it.status = s;
  if (s === 'watching' && !it.startedAt) it.startedAt = Date.now();
  if (s === 'completed' && was !== 'completed') { it.finishedAt = Date.now(); if (it.episodes) it.progress = it.episodes; celebrate(it); }
  if (s === 'dropped' && was !== 'dropped') toast(pick(QUIPS.drop));
  touch(it);
}

/* =========================================================
   Réglages
   ========================================================= */
function openSettings() { openRef = { settings: true }; renderSettings(); }
function renderSettings() {
  const scroller = $('.sheet-panel'); const keep = $('#sheet').hidden ? 0 : scroller.scrollTop;
  const last = db.lastRefresh ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(db.lastRefresh) : 'jamais';
  const w = db.settings.wall;
  const modes = [['auto', 'Ma liste'], ['trending', 'Tendances'], ['pick', 'Un animé'], ['custom', 'Ma photo'], ['none', 'Aucun']];
  const pickable = db.items.filter((i) => i.banner || i.cover);
  openSheet(`<div class="detail-body" style="padding-top:22px">
    <h2 style="margin:0 0 2px;font:400 24px var(--font-title)">Réglages <span class="jp-sub">せってい</span></h2>
    <div class="muted small">Animés · Tom v${APP_VERSION}</div>

    ${h2('Héros', 'なまえ')}
    <input class="input" id="heroName" value="${esc(db.settings.heroName || '')}" maxlength="24" placeholder="Ton nom d'aventurier">

    ${h2('Thème', 'テーマ')}
    <div class="themes">${Object.entries(THEMES).map(([k, t]) => `
      <button class="theme-sw ${db.settings.theme === k ? 'on' : ''}" data-act="theme" data-v="${k}">
        <div class="sw" style="background:${t.dynamic ? 'conic-gradient(#ff3d8b,#ffd23f,#2bff88,#29e0ff,#b78cff,#ff3d8b)' : `linear-gradient(120deg,${t.a1},${t.a2})`}"></div>${esc(t.name)}</button>`).join('')}</div>
    <p class="tiny muted">« Dynamique » prend les couleurs de l'animé affiché en fond d'écran.</p>

    ${h2('Fond d\'écran', 'かべがみ')}
    <div class="chips wrap">${modes.map(([k, l]) => `<button class="chip ${w.mode === k ? 'on' : ''}" data-act="wallmode" data-v="${k}">${l}</button>`).join('')}</div>
    ${w.mode === 'auto' ? `<p class="tiny muted">Les bannières de tes animés (en cours et favoris en priorité) défilent toutes les 40 secondes.</p>` : ''}
    ${w.mode === 'trending' ? `<p class="tiny muted">Les bannières des animés tendance du moment sur AniList.</p>` : ''}
    ${w.mode === 'pick' ? (pickable.length ? `<div class="wall-pick">${pickable.map((i) => `<button class="${w.uid === i.uid ? 'on' : ''}" style="background-image:${cssUrl(i.banner || i.cover)}" data-act="wallpick" data-v="${esc(i.uid)}" aria-label="${esc(titleOf(i))}"></button>`).join('')}</div>` : `<p class="tiny muted">Ajoute d'abord des animés à ta liste.</p>`) : ''}
    ${w.mode === 'custom' ? `<div class="row" style="margin-top:10px"><label class="btn grow">🖼️ Choisir une image<input type="file" id="wallFile" accept="image/*" hidden></label>
      ${customWall() ? '<button class="btn danger" data-act="wallclear">Retirer</button>' : ''}</div>
      <p class="tiny muted">Ton fond d'écran préféré depuis tes photos. Il reste sur le téléphone.</p>` : ''}
    <div class="slider-row"><span>Flou</span><input type="range" id="wallBlur" min="0" max="30" step="1" value="${w.blur}"><span>${w.blur}px</span></div>
    <div class="slider-row"><span>Assombrir</span><input type="range" id="wallDim" min="0.2" max="0.9" step="0.02" value="${w.dim}"><span>${Math.round(w.dim * 100)}%</span></div>

    ${h2('Titres', 'タイトル')}
    <div class="seg">
      <button class="${db.settings.titleLang === 'romaji' ? 'on' : ''}" data-act="lang" data-v="romaji" style="padding:8px 14px">Romaji</button>
      <button class="${db.settings.titleLang === 'english' ? 'on' : ''}" data-act="lang" data-v="english" style="padding:8px 14px">Anglais</button>
    </div>
    <div class="tiny muted" style="margin-top:6px">Ex. « Shingeki no Kyojin » ou « Attack on Titan »</div>

    ${h2('Catégories', 'カテゴリー')}
    <p class="small muted" style="margin-top:-4px">Cochées automatiquement à l'ajout quand un genre ou un tag correspond.</p>
    <div id="catList">${db.categories.map((c) => `
      <div class="cat-edit" data-id="${esc(c.id)}">
        <input type="color" value="${esc(c.color)}" data-f="color">
        <input class="input emoji" value="${esc(c.emoji || '')}" data-f="emoji" maxlength="4" placeholder="🙂">
        <input class="input" value="${esc(c.name)}" data-f="name" maxlength="30">
        <button class="icon-btn" data-act="delcat" data-v="${esc(c.id)}" aria-label="Supprimer"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>
      </div>`).join('')}</div>
    <button class="btn block" data-act="addcat">＋ Ajouter une catégorie</button>

    ${h2('Données', 'データ')}
    <div class="panel">
      <div class="set-item"><div class="grow"><b>Actualiser les infos</b><div class="small muted">Épisodes, diffusion, prochains épisodes. Dernière mise à jour : ${esc(last)}</div></div>
        <button class="btn" data-act="refresh">Go</button></div>
      <div class="set-item"><div class="grow"><b>Exporter une sauvegarde</b><div class="small muted">Fichier JSON avec ta liste, tes notes, ton journal et tes succès</div></div>
        <button class="btn" data-act="export">Exporter</button></div>
      <div class="set-item"><div class="grow"><b>Importer une sauvegarde</b><div class="small muted">Remplace la liste actuelle</div></div>
        <label class="btn">Importer<input type="file" id="importIn" accept="application/json,.json" hidden></label></div>
    </div>
    <p class="small muted">Tout est stocké sur ce téléphone. Exporte de temps en temps : si les données de Safari sont effacées, la liste part avec.</p>

    ${h2('Sources', 'ソース')}
    <p class="small muted">Recherche et infos : <a href="https://anilist.co" target="_blank" rel="noopener">AniList</a>,
      <a href="https://jikan.moe" target="_blank" rel="noopener">Jikan</a> (MyAnimeList) et
      <a href="https://kitsu.app" target="_blank" rel="noopener">Kitsu</a>. Simulcast, bannières, personnages et bandes-annonces viennent d'AniList.</p>

    ${h2('Zone dangereuse', 'きけん')}
    <button class="btn danger block" data-act="wipe">Tout effacer</button>
  </div>`);
  scroller.scrollTop = keep;

  $$('#catList .cat-edit').forEach((row) => {
    $$('[data-f]', row).forEach((inp) => inp.addEventListener('change', () => {
      const c = catById(row.dataset.id); if (!c) return;
      const f = inp.dataset.f, val = inp.value.trim();
      if (f === 'name' && !val) { inp.value = c.name; return; }
      c[f] = val; save();
    }));
  });
  $('#heroName').addEventListener('change', (e) => { db.settings.heroName = e.target.value.trim() || 'Tom'; save(); });
  $('#importIn').addEventListener('change', importFile);
  const wf = $('#wallFile');
  if (wf) wf.addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { await setCustomWall(f); toast('Fond d\'écran appliqué'); startWall(); renderSettings(); }
    catch (err) { toast('Image trop lourde ou illisible'); }
  });
  const bl = $('#wallBlur'), dm = $('#wallDim');
  bl.addEventListener('input', () => { db.settings.wall.blur = +bl.value; bl.nextElementSibling.textContent = bl.value + 'px'; applyTheme(); });
  dm.addEventListener('input', () => { db.settings.wall.dim = +dm.value; dm.nextElementSibling.textContent = Math.round(dm.value * 100) + '%'; applyTheme(); });
  bl.addEventListener('change', save); dm.addEventListener('change', save);
}
async function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'animes-tom', exportedAt: new Date().toISOString(), ...db }, null, 2)], { type: 'application/json' });
  const name = `animes-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Sauvegarde Animés' }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function importFile(e) {
  const f = e.target.files?.[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!d || !Array.isArray(d.items) || !Array.isArray(d.categories)) throw new Error('format');
    if (!confirm(`Importer ${d.items.length} animé(s) ? La liste actuelle sera remplacée.`)) return;
    delete d.app; delete d.exportedAt;
    db = normalizeDb(d);
    save(); toast('Sauvegarde importée'); applyTheme(); startWall(); closeSheet();
  } catch (err) { toast('Fichier invalide'); }
}

/* =========================================================
   Actions (délégation de clics)
   ========================================================= */
function addFromMedia(key, status, el) {
  const m = mediaCache.get(key); if (!m) return null;
  const exist = findItem(m); if (exist) return exist;
  const it = makeItem(m, status);
  db.items.push(it); haptic();
  if (el) burstFrom(el, '召喚!');
  toast(`Invoqué : ${titleOf(it)}`);
  if (status === 'completed') celebrate(it);
  touch(it);
  sched.at = 0;
  if (!it.ids.al && it.ids.mal) setTimeout(() => refreshOne(it), 300);
  if (db.settings.wall.mode === 'auto' && db.items.length <= 2) startWall();
  return it;
}

const actions = {
  tab: (el) => switchTab(el.dataset.tab),
  open: (el) => openDetail({ uid: el.dataset.uid }),
  preview: (el) => openDetail({ key: el.dataset.uid }),
  quickadd: (el) => { addFromMedia(el.dataset.uid, 'planning', el); renderSearchOut(); },
  plus1: (el) => {
    const it = getItem(el.dataset.uid); if (!it) return;
    setProgress(it, (it.progress || 0) + 1, el); haptic();
    if (!$('#sheet').hidden) renderDetail(); else setTimeout(render, 250);
  },
  gacha: () => openGacha(),
  fstatus: (el) => { ui.status = el.dataset.v; saveUi(); render(); },
  fcat: (el) => { ui.cat = ui.cat === el.dataset.v ? null : el.dataset.v; saveUi(); render(); },
  view: (el) => { ui.view = el.dataset.v; saveUi(); render(); },
  day: (el) => { ui.day = +el.dataset.v; render(); },
  disc: (el) => {
    ui.disc = el.dataset.v;
    if (discCache[ui.disc] === 'error') delete discCache[ui.disc];
    saveUi();
    if (ui.tab !== 'discover') switchTab('discover'); else render();
  },
  add: (el) => {
    const it = addFromMedia(openRef.key, el.dataset.v, el);
    if (it) { openRef = { uid: it.uid }; renderDetail(); }
  },
  trailer: () => { showTrailer = true; $('.sheet-panel').scrollTop = 0; renderDetail(); },
  setstatus: (el) => { const it = getItem(openRef.uid); setStatus(it, el.dataset.v); haptic(); renderDetail(); },
  step: (el) => { const it = getItem(openRef.uid); setProgress(it, (it.progress || 0) + (+el.dataset.v), +el.dataset.v > 0 ? el : null); haptic(); renderDetail(); },
  allseen: (el) => { const it = getItem(openRef.uid); setProgress(it, it.episodes, el); renderDetail(); },
  tier: (el) => { const it = getItem(openRef.uid); it.rating = +el.dataset.v; burstFrom(el, tierOf(it.rating).t); touch(it); haptic(); renderDetail(); },
  fav: (el) => { const it = getItem(openRef.uid); it.favorite = !it.favorite; if (it.favorite) burstFrom(el, '★'); touch(it); haptic(); renderDetail(); },
  clearrate: () => { const it = getItem(openRef.uid); it.rating = null; touch(it); renderDetail(); },
  togglecat: (el) => {
    const it = getItem(openRef.uid), id = el.dataset.v;
    it.categories = it.categories.includes(id) ? it.categories.filter((x) => x !== id) : [...it.categories, id];
    touch(it); renderDetail();
  },
  newcat: () => { $('#newCatRow').hidden = false; $('#newCatName').focus(); },
  newcatok: () => {
    const name = $('#newCatName').value.trim(); if (!name) return;
    const palette = ['#8b7cff', '#ff3d8b', '#3df2a0', '#ff8a3d', '#29e0ff', '#ffd23f', '#c77dff', '#5ee6d0'];
    const c = { id: uid(), name, emoji: '🏷️', color: palette[db.categories.length % palette.length], match: [] };
    db.categories.push(c);
    const it = getItem(openRef.uid); it.categories.push(c.id); touch(it); renderDetail();
  },
  addnote: (el) => {
    const it = getItem(openRef.uid), text = ($('#noteIn').value || '').trim();
    if (!text) { $('#noteIn').focus(); return; }
    it.notes.push({ id: uid(), date: Date.now(), text, ep: $('#noteEp').checked ? it.progress || null : null });
    noteDraft = ''; burstFrom(el, '✒️'); touch(it); renderDetail();
  },
  delnote: (el) => {
    if (!confirm('Supprimer cette bulle ?')) return;
    const it = getItem(openRef.uid); it.notes = it.notes.filter((n) => n.id !== el.dataset.v); touch(it); renderDetail();
  },
  remove: () => {
    const it = getItem(openRef.uid);
    if (!confirm(`Retirer « ${titleOf(it)} » de ta liste ? Tes notes et ton journal seront perdus.`)) return;
    db.items = db.items.filter((x) => x !== it); save(); toast('Retiré de la liste. Sayonara.'); closeSheet();
  },
  expand: (el) => el.classList.toggle('clamp'),
  lang: (el) => { db.settings.titleLang = el.dataset.v; save(); renderSettings(); },
  theme: (el) => { db.settings.theme = el.dataset.v; save(); applyTheme(); renderSettings(); },
  wallmode: (el) => {
    db.settings.wall.mode = el.dataset.v;
    if (el.dataset.v === 'pick' && !getItem(db.settings.wall.uid)) db.settings.wall.uid = db.items.find((i) => i.banner)?.uid || db.items[0]?.uid || null;
    save(); startWall(); renderSettings();
  },
  wallpick: (el) => { db.settings.wall.uid = el.dataset.v; save(); startWall(); renderSettings(); },
  wallclear: () => { try { localStorage.removeItem(WALL_KEY); } catch (e) { /* rien */ } startWall(); renderSettings(); },
  addcat: () => {
    db.categories.push({ id: uid(), name: 'Nouvelle catégorie', emoji: '🏷️', color: '#5ee6d0', match: [] });
    save(); renderSettings();
    const inputs = $$('#catList .cat-edit input[data-f=name]');
    const last = inputs[inputs.length - 1]; last?.focus(); last?.select();
  },
  delcat: (el) => {
    const c = catById(el.dataset.v); if (!c) return;
    const n = db.items.filter((i) => i.categories.includes(c.id)).length;
    if (!confirm(`Supprimer la catégorie « ${c.name} »${n ? ` (utilisée par ${n} animé${n > 1 ? 's' : ''})` : ''} ?`)) return;
    db.categories = db.categories.filter((x) => x.id !== c.id);
    db.items.forEach((i) => (i.categories = i.categories.filter((x) => x !== c.id)));
    if (ui.cat === c.id) ui.cat = null;
    save(); renderSettings();
  },
  refresh: () => refreshAll(true),
  export: () => exportData(),
  wipe: () => {
    if (!confirm('Effacer TOUTE ta liste, ton journal, tes succès et tes catégories ?')) return;
    if (!confirm('Vraiment sûr ? Exporte une sauvegarde avant si besoin.')) return;
    db = freshDb(); save(); applyTheme(); startWall(); closeSheet(); toast('Tout est effacé. Nouveau départ, comme après une réincarnation.');
  },
};

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) { closeSheet(); return; }
  const tabBtn = e.target.closest('.tabbar button');
  if (tabBtn) { switchTab(tabBtn.dataset.tab); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet();
  if (e.key === 'Enter' && e.target.id === 'newCatName') actions.newcatok();
});
$('#btnSettings').addEventListener('click', openSettings);
$('#btnGacha').addEventListener('click', openGacha);
$('#btnRefresh').addEventListener('click', () => {
  if (ui.tab === 'discover') { delete discCache[ui.disc]; render(); }
  if (ui.tab === 'planning') sched.at = 0;
  if (db.items.length) refreshAll(true); else render();
});
// Comptes à rebours du Simulcast
setInterval(() => { if ($('#sheet').hidden && ui.tab === 'planning') render(); }, 60000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && Date.now() - (db.lastRefresh || 0) > 3 * 3600 * 1000) refreshAll(false);
});

/* =========================================================
   Démarrage
   ========================================================= */
applyTheme();
startWall();
switchTab(ui.tab in TITLES ? ui.tab : 'list');
setTimeout(() => $('#splash').classList.add('gone'), 750);
setTimeout(() => $('#splash').remove(), 1400);
if (Date.now() - (db.lastRefresh || 0) > 3 * 3600 * 1000) setTimeout(() => refreshAll(false), 900);
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
}
try { navigator.storage?.persist?.(); } catch (e) { /* rien */ }
