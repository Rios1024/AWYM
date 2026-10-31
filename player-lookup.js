/**
 * player-lookup.js — the "Player lookup" section of the Stats Desk dock
 * =====================================================================
 * Search for NBA players (or paste an espn.com player link), load them into
 * slot A or B, and send cards to the stats overlay: season or career
 * averages, season-by-season history, last 5 games, and A-vs-B comparison.
 *
 * Loaded by: stats-desk.html, after its main script (it needs both of these):
 *   window.AWYM_STATS_API   ESPN addresses: search[], athlete(id), athleteStats(id), gamelog(id)
 *   window.AWYM_DESK        helpers from the desk: getJSON, esc, colorCache, hex, customTitle,
 *                           show(card, kind, key, btn), isShowing(key), hideCard()
 * Data: ESPN's public (unofficial, no-key) athlete feed. ESPN can change it.
 *
 * Card objects sent to stats-card.html (type → fields):
 *   averages  name, jersey, team{abbr,color}, sub, big[[label,value]×3], small[[label,value]…], foot
 *   history   name, jersey, team, sub, cols[], rows[{season, team, vals{}}], career, best (row index), foot
 *   gamelog   name, jersey, team, sub, cols[], rows[{date, opp, result, vals{}}], foot
 *   h2h       away/home {abbr,color}, awaySub, homeSub, rows[{label, away, home, awayVal, homeVal, lowerBetter}]
 */
(function () {
  const D = window.AWYM_DESK, API = window.AWYM_STATS_API;
  if (!D || !API) return;
  const $ = (id) => document.getElementById(id);
  const esc = D.esc;
  const msg = (t, err) => { $("playerMsg").textContent = t || ""; $("playerMsg").className = "msg" + (err ? " err" : ""); };

  /* Team slugs → abbreviations, for seasons where ESPN only gives a slug */
  const SLUGS = {
    "atlanta-hawks": "ATL", "boston-celtics": "BOS", "brooklyn-nets": "BKN", "new-jersey-nets": "NJ", "charlotte-hornets": "CHA",
    "charlotte-bobcats": "CHA", "chicago-bulls": "CHI", "cleveland-cavaliers": "CLE", "dallas-mavericks": "DAL", "denver-nuggets": "DEN",
    "detroit-pistons": "DET", "golden-state-warriors": "GS", "houston-rockets": "HOU", "indiana-pacers": "IND", "la-clippers": "LAC",
    "los-angeles-clippers": "LAC", "los-angeles-lakers": "LAL", "memphis-grizzlies": "MEM", "miami-heat": "MIA", "milwaukee-bucks": "MIL",
    "minnesota-timberwolves": "MIN", "new-orleans-pelicans": "NO", "new-orleans-hornets": "NO", "new-york-knicks": "NY",
    "oklahoma-city-thunder": "OKC", "seattle-supersonics": "SEA", "orlando-magic": "ORL", "philadelphia-76ers": "PHI", "phoenix-suns": "PHX",
    "portland-trail-blazers": "POR", "sacramento-kings": "SAC", "san-antonio-spurs": "SA", "toronto-raptors": "TOR", "utah-jazz": "UTAH",
    "washington-wizards": "WSH", "vancouver-grizzlies": "VAN"
  };

  /* label aliases → one key we use everywhere */
  const ALIAS = { "3P": "3PT", "3PM-A": "3PT", "FG3%": "3P%", "3PT%": "3P%", "FT%": "FT%", "OR": "OREB", "DR": "DREB", "TOV": "TO" };
  /** Normalise an ESPN stat label to one name, e.g. "3P" → "3PT", "TOV" → "TO". */
  const key = (l) => { const u = String(l || "").toUpperCase().trim(); return ALIAS[u] || u; };
  /** First number in a value ("48.1%" → 48.1); NaN if there isn't one. */
  const num = (v) => { const n = parseFloat(String(v).replace(/[^\d.\-]/g, "")); return isFinite(n) ? n : NaN; };
  /** ESPN names seasons by the year they end: 2026 → "2025-26". */
  const seasonName = (y) => `${y - 1}-${String(y).slice(2)}`;
  const today = new Date();
  const currentSeasonYear = today.getMonth() >= 8 ? today.getFullYear() + 1 : today.getFullYear(); // season named by the year it ends

  /* ---------- search ---------- */
  /**
   * Pull NBA players out of an ESPN search response, whatever shape it has
   * (walks the whole object looking for player entries with an NBA uid).
   * @returns {Array<{id:string, name:string, sub:string}>}
   */
  function collectPlayers(json) {
    const out = new Map();
    const walk = (o, depth) => {
      if (!o || typeof o !== "object" || depth > 7) return;
      if (Array.isArray(o)) { o.forEach((x) => walk(x, depth + 1)); return; }
      const uid = String(o.uid || "");
      const name = o.displayName || o.name;
      const isPlayer = o.type === "player" || /~a:\d+/.test(uid);
      const isNBA = /l:46(~|$)/.test(uid) || String(o.league || o.leagueAbbreviation || "").toLowerCase() === "nba" ||
                    /nba/i.test(String(o.defaultLeagueSlug || o.leagueSlug || "")) || /\/nba\/player\//.test(JSON.stringify(o.link || o.links || ""));
      if (name && isPlayer && isNBA) {
        const id = (uid.match(/~a:(\d+)/) || [])[1] || (String(o.id || "").match(/^\d+$/) ? String(o.id) : "");
        if (id && !out.has(id)) out.set(id, { id, name, sub: o.subtitle || o.description || o.teamName || (o.team && o.team.displayName) || "" });
      }
      for (const k in o) if (o[k] && typeof o[k] === "object") walk(o[k], depth + 1);
    };
    walk(json, 0);
    return [...out.values()];
  }

  /** Search by name (trying each address in API.search), or accept a pasted ESPN link/id. */
  async function search() {
    const q = $("pq").value.trim();
    if (!q) return;
    // pasted ESPN link or bare id
    const linkId = (q.match(/\/id\/(\d+)/) || [])[1] || (/^\d{2,}$/.test(q) ? q : "");
    if (linkId) { paintResults([{ id: linkId, name: "ESPN player " + linkId, sub: "from link" }]); msg("Pick A or B to load this player."); return; }
    msg("Searching…");
    let found = [], lastErr = null;
    for (const make of API.search) {
      try {
        found = collectPlayers(await D.getJSON(make(q)));
        if (found.length) break;
      } catch (e) { lastErr = e; }
    }
    paintResults(found);
    if (found.length) msg("");
    else if (lastErr) msg(lastErr.message + " You can also paste the player's ESPN page link (espn.com/nba/player/_/id/…).", true);
    else msg("No NBA players found. Check the spelling, or paste the player's ESPN page link.", true);
  }
  /** Show search results with "A" and "B" buttons that load the player into a slot. */
  function paintResults(list) {
    $("presults").innerHTML = list.slice(0, 10).map((p) => `<div class="presult">
      <span class="n">${esc(p.name)}<small>${esc(p.sub)}</small></span>
      <button class="primary" data-slot="A" data-id="${esc(p.id)}">A</button><button class="accent" data-slot="B" data-id="${esc(p.id)}">B</button></div>`).join("");
    $("presults").querySelectorAll("button").forEach((b) => b.onclick = () => {
      const p = list.find((x) => x.id === b.dataset.id);
      loadPlayer(b.dataset.slot, p);
    });
  }
  $("psearch").onclick = search;
  $("pq").addEventListener("keydown", (e) => { if (e.key === "Enter") search(); });

  /* ---------- loading a player ---------- */
  const slots = { A: null, B: null };
  const cache = {};

  /**
   * Turn ESPN's athlete stats response into per-season rows + a career row.
   * Uses the "averages" category (per-game numbers, regular season).
   * @returns {{seasons: Array<{year, season, team, vals}>, career: Object|null}}
   */
  function parseStats(json) {
    const cats = json.categories || (json.statistics && json.statistics.categories) || [];
    const avg = cats.find((c) => /^averages$/i.test(c.name || "")) || cats.find((c) => /average/i.test(c.displayName || c.name || "")) || cats[0];
    if (!avg) throw new Error("ESPN didn't return season stats for this player.");
    const labels = (avg.labels || avg.names || []).map(key);
    const teams = json.teams || {};
    const teamAbbr = (st) => {
      const t = teams[st.teamId] || (Array.isArray(teams) ? teams.find((x) => String(x.id) === String(st.teamId)) : null);
      return (t && (t.abbreviation || t.abbrev)) || SLUGS[st.teamSlug] || (st.teamSlug || "").split("-").pop().slice(0, 3).toUpperCase() || "";
    };
    const toVals = (arr) => { const v = {}; labels.forEach((l, i) => { if (arr && arr[i] != null) v[l] = arr[i]; }); return v; };
    const seasons = (avg.statistics || []).map((st) => {
      const y = Number(st.season && st.season.year) || Number(st.year) || 0;
      return { year: y, season: (st.season && st.season.displayName) || (y ? seasonName(y) : "?"), team: teamAbbr(st), vals: toVals(st.stats) };
    }).filter((r) => Object.keys(r.vals).length);
    seasons.sort((a, b) => a.year - b.year);
    const career = avg.totals ? { season: "Career", team: "", vals: toVals(avg.totals) } : null;
    if (!seasons.length) throw new Error("No regular-season stats found for this player.");
    return { seasons, career };
  }

  /** Fetch a player's stats and bio (cached by id) and put them in slot "A" or "B". */
  async function loadPlayer(slot, pick) {
    const el = $("slot" + slot);
    el.querySelector(".pnm").textContent = "Loading " + pick.name + "…";
    msg("");
    try {
      if (!cache[pick.id]) {
        const [stats, bio] = await Promise.all([
          D.getJSON(API.athleteStats(pick.id)),
          D.getJSON(API.athlete(pick.id)).catch(() => null)
        ]);
        const a = (bio && (bio.athlete || bio)) || {};
        const team = a.team || {};
        const parsed = parseStats(stats);
        cache[pick.id] = {
          id: pick.id,
          name: a.displayName || a.fullName || pick.name,
          jersey: a.jersey || "",
          pos: (a.position && (a.position.abbreviation || a.position.name)) || "",
          team: { abbr: team.abbreviation || (parsed.seasons[parsed.seasons.length - 1] || {}).team || "", color: D.hex(team.color) || "" },
          active: a.active !== false,
          ...parsed
        };
        const c = cache[pick.id];
        if (!c.team.color && c.team.abbr) c.team.color = D.colorCache[c.team.abbr] || "";
      }
      slots[slot] = cache[pick.id];
      paintSlot(slot);
    } catch (e) {
      el.querySelector(".pnm").textContent = pick.name;
      msg(e.message, true);
    }
  }

  /** Fill a slot's season dropdown: latest season, career, then every past season. */
  function paintSlot(slot) {
    const p = slots[slot], el = $("slot" + slot);
    el.classList.toggle("empty", !p);
    if (!p) return;
    el.querySelector(".pnm").textContent = `${p.name}${p.team.abbr ? " · " + p.team.abbr : ""}`;
    const last = p.seasons[p.seasons.length - 1];
    const isCurrent = last.year === currentSeasonYear;
    const opts = [`<option value="latest">${isCurrent ? "This season" : "Latest season"} (${esc(last.season)})</option>`];
    if (p.career) opts.push(`<option value="career">Career (${p.seasons.length} seasons)</option>`);
    p.seasons.slice().reverse().forEach((s, i) => {
      const idx = p.seasons.length - 1 - i;
      opts.push(`<option value="${idx}">${esc(s.season)}${s.team ? " · " + esc(s.team) : ""}</option>`);
    });
    el.querySelector(".pseason").innerHTML = opts.join("");
  }
  ["A", "B"].forEach((slot) => {
    paintSlot(slot);
    $("slot" + slot).querySelectorAll("button[data-act]").forEach((b) => b.onclick = () => act(slot, b.dataset.act, b));
  });

  /** The stat row picked in a slot's dropdown → {row, label, teamAbbr, career?, current?}. */
  function chosen(slot) {
    const p = slots[slot];
    const v = $("slot" + slot).querySelector(".pseason").value;
    if (v === "career" && p.career) return { row: p.career, label: "Career", teamAbbr: p.team.abbr, career: true };
    const row = v === "latest" ? p.seasons[p.seasons.length - 1] : p.seasons[Number(v)];
    const isCurrent = row.year === currentSeasonYear;
    return { row, label: row.season, teamAbbr: row.team || p.team.abbr, current: isCurrent };
  }
  /** Team chip {abbr, color} for a season (uses that season's team colors when they differ). */
  const teamFor = (p, abbr) => ({ abbr: abbr || p.team.abbr, color: (abbr && abbr !== p.team.abbr ? D.colorCache[abbr] : p.team.color) || D.colorCache[abbr] || p.team.color || "" });

  /* ---------- cards ---------- */
  /** Build an "averages" card for the selected season or career. */
  function averagesCard(slot) {
    const p = slots[slot], c = chosen(slot), v = c.row.vals;
    const pct = (x) => (x == null || x === "" ? null : /%/.test(String(x)) ? x : x + "%");
    return {
      type: "averages",
      title: D.customTitle() || (c.career ? "Career averages" : c.current ? "This season · " + c.label : c.label + " season"),
      name: p.name, jersey: c.career || c.current ? p.jersey : "", team: teamFor(p, c.teamAbbr),
      sub: [c.teamAbbr, p.pos, c.career ? p.seasons.length + " seasons" : (v.GP != null ? v.GP + " games" : "")].filter(Boolean).join(" · "),
      big: [["PPG", v.PTS], ["RPG", v.REB], ["APG", v.AST]],
      small: [["MIN", v.MIN], ["FG%", pct(v["FG%"])], ["3P%", pct(v["3P%"])], ["FT%", pct(v["FT%"])], ["STL", v.STL], ["BLK", v.BLK], ["TO", v.TO]],
      foot: "Regular season per-game averages · ESPN"
    };
  }

  /** Build a "history" card: last/first/best 10 seasons (or all, up to 15) + career; ★ marks the top scoring season. */
  function historyCard(slot) {
    const p = slots[slot];
    const mode = $("histMode").value;
    let rows = p.seasons.slice();
    if (mode === "last") rows = rows.slice(-10);
    else if (mode === "first") rows = rows.slice(0, 10);
    else if (mode === "best") rows = rows.slice().sort((a, b) => (num(b.vals.PTS) || 0) - (num(a.vals.PTS) || 0)).slice(0, 10).sort((a, b) => a.year - b.year);
    else rows = rows.slice(-15);
    let best = -1, bestPts = -1;
    rows.forEach((r, i) => { const n = num(r.vals.PTS); if (n > bestPts) { bestPts = n; best = i; } });
    const cols = ["GP", "PTS", "REB", "AST", "FG%", "3P%"];
    const total = p.seasons.length;
    const label = { last: "last", first: "first", best: "best", all: "last" }[mode];
    return {
      type: "history",
      title: D.customTitle() || "Season by season",
      name: p.name, jersey: p.jersey, team: p.team,
      sub: [p.pos, total + (total === 1 ? " season" : " seasons")].filter(Boolean).join(" · "),
      cols, rows, career: p.career, best,
      foot: (rows.length < total ? `Showing ${label} ${rows.length} of ${total} seasons · ` : "") + "★ = most points per game · Per-game averages · ESPN"
    };
  }

  /** Build a "gamelog" card with the player's five most recent games (fetched fresh). */
  async function gamelogCard(slot) {
    const p = slots[slot];
    const json = await D.getJSON(API.gamelog(p.id));
    const labels = (json.labels || json.names || []).map(key);
    const evMeta = json.events || {};
    const list = [];
    (json.seasonTypes || []).forEach((stype) => {
      (stype.categories || []).forEach((cat) => {
        (cat.events || []).forEach((e) => { if (e && e.eventId && e.stats) list.push(e); });
      });
    });
    if (!labels.length || !list.length) throw new Error("ESPN has no recent games for this player yet.");
    const rows = list.map((e) => {
      const m = evMeta[e.eventId] || {};
      const vals = {}; labels.forEach((l, i) => { if (e.stats[i] != null) vals[l] = e.stats[i]; });
      const d = new Date(m.gameDate || 0);
      const opp = m.opponent || {};
      return {
        t: d.getTime() || 0,
        date: isNaN(d) || !m.gameDate ? "" : d.toLocaleDateString([], { month: "short", day: "numeric" }),
        opp: `${m.atVs || "vs"} ${opp.abbreviation || opp.displayName || ""}`.trim(),
        result: [m.gameResult, m.score].filter(Boolean).join(" "),
        vals
      };
    });
    const seen = new Set();
    const recent = rows.sort((a, b) => b.t - a.t).filter((r) => { const k = r.t + r.opp; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 5);
    return {
      type: "gamelog", title: D.customTitle() || "Last " + recent.length + " games",
      name: p.name, jersey: p.jersey, team: p.team, sub: [p.team.abbr, p.pos].filter(Boolean).join(" · "),
      cols: ["MIN", "PTS", "REB", "AST", "FG"].filter((c) => recent.some((r) => r.vals[c] != null)), rows: recent,
      foot: "Most recent games · ESPN"
    };
  }

  /** Build an "h2h" card comparing A and B, each in the season picked for them. */
  function h2hCard() {
    const a = slots.A, b = slots.B;
    if (!a || !b) throw new Error("Load a player into both A and B first.");
    const ca = chosen("A"), cb = chosen("B");
    const lastName = (n) => { const parts = String(n).split(" "); const l = parts.length > 1 ? parts.slice(1).join(" ") : n; return l.replace(/\b(Jr\.?|Sr\.?|II|III|IV)$/i, "").trim().toUpperCase(); };
    const ROWS = [["Points", "PTS"], ["Rebounds", "REB"], ["Assists", "AST"], ["Steals", "STL"], ["Blocks", "BLK"], ["FG%", "FG%"], ["3P%", "3P%"], ["FT%", "FT%"], ["Turnovers", "TO", true]];
    const rows = [];
    ROWS.forEach(([label, k, lowerBetter]) => {
      const x = ca.row.vals[k], y = cb.row.vals[k];
      if (x == null || y == null) return;
      const fmt = (v) => /%/.test(label) && !/%/.test(String(v)) ? v + "%" : v;
      rows.push({ label, away: fmt(x), home: fmt(y), awayVal: num(x), homeVal: num(y), lowerBetter: !!lowerBetter });
    });
    if (!rows.length) throw new Error("Couldn't line up those two stat lines.");
    const sub = (c) => (c.career ? "Career" : c.label + (c.teamAbbr ? " · " + c.teamAbbr : ""));
    return {
      type: "h2h", title: D.customTitle() || "Player vs player",
      away: { abbr: lastName(a.name), color: teamFor(a, ca.teamAbbr).color },
      home: { abbr: lastName(b.name), color: teamFor(b, cb.teamAbbr).color },
      awaySub: sub(ca), homeSub: sub(cb), rows: rows.slice(0, 8),
      gameLine: `${a.name} vs ${b.name} · per-game averages · ESPN`
    };
  }

  /**
   * A slot button was pressed: show that card, or hide it if it's already on screen.
   * @param {"A"|"B"} slot
   * @param {"avg"|"hist"|"log"} what
   * @param {HTMLElement} btn  highlighted while its card is showing
   */
  async function act(slot, what, btn) {
    if (!slots[slot]) { msg("Load a player into " + slot + " first.", true); return; }
    const key = ["p", what, slot, slots[slot].id, $("slot" + slot).querySelector(".pseason").value, what === "hist" ? $("histMode").value : "", D.customTitle()].join("|");
    if (D.isShowing(key)) { D.hideCard(); return; }   // pressed again: hide it
    try {
      msg(what === "log" ? "Loading recent games…" : "");
      const card = what === "avg" ? averagesCard(slot) : what === "hist" ? historyCard(slot) : await gamelogCard(slot);
      D.show(card, "player-" + what, key, btn);
      msg("");
    } catch (e) { msg(e.message, true); }
  }
  $("h2h").onclick = (e) => {
    const btn = e.currentTarget;
    const key = slots.A && slots.B ? ["h2h", slots.A.id, $("slotA").querySelector(".pseason").value, slots.B.id, $("slotB").querySelector(".pseason").value, D.customTitle()].join("|") : "";
    if (D.isShowing(key)) { D.hideCard(); return; }
    try { D.show(h2hCard(), "player-h2h", key, btn); msg(""); } catch (err) { msg(err.message, true); }
  };
})();
