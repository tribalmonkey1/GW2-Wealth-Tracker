/**
 * Characters tab — view any character's equipment templates and bags without
 * logging in, browse bank / material storage / shared slots, and search the
 * whole account for an item.
 *
 * Self-contained: loads its own snapshot (src/lib/characterSnapshot.js) the
 * first time it's opened, caches it for 5 minutes, and only borrows itemMap
 * (names/icons, to avoid refetching) and priceMap (TP values) from App.jsx.
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Gold } from "../components/Gold.jsx";
import {
  fetchCharacterSnapshot, loadCachedSnapshot, flattenOwned, gearStatName, isBlockedOffhand,
  ARMOR_SLOTS, TRINKET_SLOTS, OTHER_SLOT_GROUPS,
} from "../lib/characterSnapshot.js";
import "../styles/characters.css";

const TP_TAX = 0.85;
const BANK_TAB_SIZE = 30;
const FIND_KINDS = ["All", "Characters", "Equipped", "Bank", "Materials", "Shared", "Armory"];
const PERM_LABEL = { characters: "Characters", inventories: "Inventories", builds: "Builds" };

// ── Small pieces ──────────────────────────────────────────────────────────────

function ItemSlot({ id, count, item, size, label, selected, match, dim, blocked, onSelect, still }) {
  if (!id) {
    return (
      <div className={`chr-slot chr-empty${blocked ? " chr-blocked" : ""}`} style={{ width: size, height: size }} title={label ? `${label}: empty` : "Empty"}>
        {label && <span className="chr-slot-lbl">{blocked ? "2H" : label}</span>}
      </div>
    );
  }
  const name = item?.name || `Item ${id}`;
  const cls = [
    "chr-slot", `chr-r-${item?.rarity || "Basic"}`,
    selected ? "chr-sel" : "", match ? "chr-match" : "", dim ? "chr-dim" : "",
  ].filter(Boolean).join(" ");
  if (still) {
    return (
      <div className={cls} style={{ width: size, height: size }} aria-hidden="true">
        {item?.icon ? <img src={item.icon} alt="" loading="lazy" draggable={false} /> : <span className="chr-slot-lbl">?</span>}
      </div>
    );
  }
  return (
    <button type="button" className={cls} style={{ width: size, height: size }} onClick={onSelect}
      title={`${label ? label + ": " : ""}${name}${count > 1 ? ` ×${count}` : ""}`}
      aria-label={`${label ? label + ", " : ""}${name}${count > 1 ? `, ${count}` : ""}`}>
      {item?.icon ? <img src={item.icon} alt="" loading="lazy" draggable={false} /> : <span className="chr-slot-lbl">?</span>}
      {count > 1 && <span className="chr-count">{count}</span>}
    </button>
  );
}

function timeAgo(ts, now) {
  const mins = Math.floor((now - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  return h === 1 ? "1 hour ago" : `${h} hours ago`;
}

// ── Tab ───────────────────────────────────────────────────────────────────────

export function CharactersTab({ data }) {
  const itemMap = data?.itemMap || {};
  const priceMap = data?.priceMap || {};

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());

  const [view, setView] = useState("gear"); // gear | find
  const [charName, setCharName] = useState(null);
  const [tabNo, setTabNo] = useState(null);
  const [invView, setInvView] = useState("bags"); // bags | bank | materials | shared
  const [invQuery, setInvQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [findQuery, setFindQuery] = useState("");
  const [findKind, setFindKind] = useState("All");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await fetchCharacterSnapshot(itemMap));
    } catch (e) {
      setError(`Couldn't load your characters (${e?.message || e}). Check that your API key is valid, then select Refresh.`);
    } finally {
      setLoading(false);
    }
  }, [itemMap]);

  // Cached snapshot first for an instant view, then refresh if it's stale.
  useEffect(() => {
    let alive = true;
    loadCachedSnapshot().then((c) => {
      if (!alive) return;
      if (c) setSnapshot(c.snapshot);
      if (!c || c.stale) refresh();
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const chars = snapshot?.characters || [];
  const char = chars.find((c) => c.name === charName) || chars[0] || null;
  const templates = char?.templates || [];
  const template = templates.find((t) => t.tab === tabNo) || templates.find((t) => t.active) || templates[0] || null;
  const items = snapshot?.items || {};
  const itemOf = (id) => items[id] || itemMap[id];

  const pickChar = (name) => { setCharName(name); setTabNo(null); setSelected(null); };

  if (!snapshot) {
    return (
      <div className="chr">
        {error ? <div className="errbar">⚠ {error}</div> : <div className="chr-note">Loading your characters…</div>}
        {error && <button className="rbtn" onClick={refresh} disabled={loading}>Refresh</button>}
      </div>
    );
  }

  return (
    <div className="chr">
      <div className="ctrl">
        <div className="chr-seg" role="group" aria-label="Characters view">
          <button className={view === "gear" ? "on" : ""} aria-pressed={view === "gear"} onClick={() => setView("gear")}>Gear &amp; bags</button>
          <button className={view === "find" ? "on" : ""} aria-pressed={view === "find"} onClick={() => setView("find")}>Find an item</button>
        </div>
        <div className="chr-sync">
          <span>{loading ? "Updating…" : `Updated ${timeAgo(snapshot.ts, now)}`}</span>
          <button className="rbtn" onClick={refresh} disabled={loading}>Refresh</button>
        </div>
      </div>

      {error && <div className="errbar">⚠ {error}</div>}
      {snapshot.missingPerms?.length > 0 && (
        <div className="alert-banner">
          <strong>API KEY PERMISSIONS</strong>
          Your API key is missing {snapshot.missingPerms.map((p) => PERM_LABEL[p] || p).join(" and ")}, so
          {snapshot.missingPerms.includes("builds") ? " equipment can't be shown" : " some data can't be shown"}.
          Create a new key at account.arena.net with {snapshot.missingPerms.map((p) => PERM_LABEL[p] || p).join(" and ")} checked
          (keep your existing permissions too), then paste it in Settings.
        </div>
      )}

      {view === "gear" ? (
        <>
          <nav className="chr-chars" aria-label="Characters">
            {chars.map((c) => (
              <button key={c.name} type="button" className={`chr-char${c === char ? " on" : ""}`} aria-pressed={c === char} onClick={() => pickChar(c.name)}>
                <span className="chr-char-badge" aria-hidden="true">{c.profession?.[0] || "?"}</span>
                <span className="chr-char-txt">
                  <span className="chr-char-name">{c.name}</span>
                  <span className="chr-char-sub">{c.profession} {c.level}</span>
                </span>
              </button>
            ))}
          </nav>
          {char ? (
            <div className="chr-body">
              <EquipmentPanel
                char={char} templates={templates} template={template} snapshot={snapshot} itemOf={itemOf}
                selected={selected} setSelected={setSelected} setTabNo={(n) => { setTabNo(n); setSelected(null); }}
              />
              <InventoryPanel
                char={char} snapshot={snapshot} itemOf={itemOf} priceMap={priceMap}
                invView={invView} setInvView={(v) => { setInvView(v); setSelected(null); }}
                query={invQuery} setQuery={setInvQuery}
                selected={selected} setSelected={setSelected}
                openFind={() => { setFindQuery(invQuery); setView("find"); }}
              />
            </div>
          ) : (
            <div className="chr-note">No characters found on this account.</div>
          )}
        </>
      ) : (
        <FindPanel
          snapshot={snapshot} itemOf={itemOf} priceMap={priceMap}
          query={findQuery} setQuery={setFindQuery} kind={findKind} setKind={setFindKind}
          openChar={(name) => { pickChar(name); setView("gear"); }}
        />
      )}
    </div>
  );
}

// ── Equipment ─────────────────────────────────────────────────────────────────

function EquipmentPanel({ char, templates, template, snapshot, itemOf, selected, setSelected, setTabNo }) {
  const gear = template?.gear || {};

  const slot = (slotKey, label, size) => {
    const g = gear[slotKey];
    const key = `gear|${char.name}|${template?.tab}|${slotKey}`;
    return (
      <ItemSlot key={slotKey} id={g?.id} item={g ? itemOf(g.id) : null} size={size} label={label}
        blocked={!g && isBlockedOffhand(gear, slotKey, snapshot.items)}
        selected={selected?.key === key}
        onSelect={() => setSelected({ key, kind: "gear", gear: g, label })} />
    );
  };

  const summary = useMemo(() => {
    const statCount = {};
    const runeCount = {};
    const sigils = new Set();
    const counted = [...ARMOR_SLOTS, ...TRINKET_SLOTS, ["WeaponA1"], ["WeaponA2"], ["WeaponB1"], ["WeaponB2"]].map(([k]) => k);
    for (const k of counted) {
      const g = gear[k];
      if (!g) continue;
      const s = gearStatName(g, snapshot);
      if (s) statCount[s] = (statCount[s] || 0) + 1;
    }
    for (const [k] of ARMOR_SLOTS) {
      for (const u of gear[k]?.upgrades || []) {
        const n = itemOf(u)?.name;
        if (n) runeCount[n] = (runeCount[n] || 0) + 1;
      }
    }
    for (const k of ["WeaponA1", "WeaponA2", "WeaponB1", "WeaponB2"]) {
      for (const u of gear[k]?.upgrades || []) { const n = itemOf(u)?.name; if (n) sigils.add(n); }
    }
    const fmt = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} ×${c}`).join(", ");
    return {
      stats: fmt(statCount) || "None",
      runes: fmt(runeCount) || "None",
      sigils: [...sigils].join(", ") || "None",
      relic: gear.Relic ? itemOf(gear.Relic.id)?.name || "Unknown relic" : "None",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, snapshot]);

  const otherGroups = OTHER_SLOT_GROUPS.filter((grp) => grp.label !== "Gathering" || grp.slots.some(([k]) => gear[k]));

  return (
    <section className="chr-panel" aria-label="Equipment">
      <div className="chr-panel-hdr">
        <h2>Equipment</h2>
        {templates.length > 1 && (
          <div className="chr-pills" role="group" aria-label="Equipment templates">
            {templates.map((t) => (
              <button key={t.tab} type="button" className={t === template ? "on" : ""} aria-pressed={t === template} onClick={() => setTabNo(t.tab)}
                title={t.active ? "Active in game" : undefined}>
                {t.name}{t.active ? " •" : ""}
              </button>
            ))}
          </div>
        )}
      </div>

      {!template ? (
        <div className="chr-note">No equipment data for this character. If your API key is missing the Builds permission, see the note above.</div>
      ) : (
        <>
          <div className="chr-doll">
            <div className="chr-col">{ARMOR_SLOTS.map(([k, l]) => slot(k, l, 52))}</div>
            <div className="chr-center">
              <div className="chr-name">{char.name}</div>
              <div className="chr-sub">{char.race} {char.profession}, level {char.level}</div>
              <dl className="chr-sum">
                <dt>Stats</dt><dd>{summary.stats}</dd>
                <dt>Runes</dt><dd>{summary.runes}</dd>
                <dt>Sigils</dt><dd>{summary.sigils}</dd>
                <dt>Relic</dt><dd>{summary.relic}</dd>
              </dl>
            </div>
            <div className="chr-col">{TRINKET_SLOTS.map(([k, l]) => slot(k, l, 52))}</div>
          </div>
          <div className="chr-groups">
            {otherGroups.map((grp) => (
              <div key={grp.label} className="chr-group">
                <span className="chr-group-lbl">{grp.label}</span>
                <div className="chr-group-slots">{grp.slots.map(([k, l]) => slot(k, l, 44))}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {selected?.kind !== "stack" && <DetailCard selected={selected} snapshot={snapshot} itemOf={itemOf} />}
    </section>
  );
}

function DetailCard({ selected, snapshot, itemOf, priceMap }) {
  if (!selected || (!selected.gear && !selected.id)) {
    return <div className="chr-detail chr-detail-empty">Select any slot to see its stats, upgrades and where it's stored.</div>;
  }
  if (selected.kind === "gear") {
    const g = selected.gear;
    const it = itemOf(g.id);
    const stat = gearStatName(g, snapshot);
    const names = (ids) => ids.map((u) => itemOf(u)?.name || `Item ${u}`);
    const skin = g.skin ? snapshot.skins[g.skin] : null;
    const fromArmory = g.location === "LegendaryArmory" || g.location === "EquippedFromLegendaryArmory";
    return (
      <div className="chr-detail">
        <div className={`chr-detail-name rar-${it?.rarity || "Basic"}`}>{it?.name || `Item ${g.id}`}</div>
        <div className="chr-detail-sub">{[it?.rarity, stat, selected.label].filter(Boolean).join(", ")}</div>
        {g.upgrades.length > 0 && <div>Upgrades: {names(g.upgrades).join(", ")}</div>}
        {g.infusions.length > 0 && <div>Infusions: {names(g.infusions).join(", ")}</div>}
        {skin && skin !== it?.name && <div>Skin: {skin}</div>}
        {fromArmory && <div className="chr-detail-note">From the Legendary Armory, available to every character.</div>}
      </div>
    );
  }
  const it = itemOf(selected.id);
  const sell = priceMap?.[selected.id]?.sells?.unit_price || 0;
  return (
    <div className="chr-detail">
      <div className={`chr-detail-name rar-${it?.rarity || "Basic"}`}>{it?.name || `Item ${selected.id}`}</div>
      <div className="chr-detail-sub">{[it?.rarity, it?.type].filter(Boolean).join(", ")}</div>
      <div>{selected.where}{selected.count > 1 ? `, stack of ${selected.count}` : ""}</div>
      {sell > 0 && (
        <div className="chr-detail-price">
          Sells for <Gold v={sell} /> each, <Gold v={Math.floor(sell * TP_TAX) * selected.count} /> for the stack after tax
        </div>
      )}
    </div>
  );
}

// ── Inventory ─────────────────────────────────────────────────────────────────

function InventoryPanel({ char, snapshot, itemOf, priceMap, invView, setInvView, query, setQuery, selected, setSelected, openFind }) {
  const sections = useMemo(() => {
    if (invView === "bags") {
      return char.bags.map((b, i) => b && {
        title: `Bag ${i + 1}: ${itemOf(b.id)?.name || "Bag"}`,
        where: `${char.name}, bag ${i + 1}`,
        slots: b.slots,
      }).filter(Boolean);
    }
    if (invView === "bank") {
      const out = [];
      for (let i = 0; i < snapshot.bank.length; i += BANK_TAB_SIZE) {
        const n = i / BANK_TAB_SIZE + 1;
        out.push({ title: `Bank tab ${n}`, where: `Bank tab ${n}`, slots: snapshot.bank.slice(i, i + BANK_TAB_SIZE) });
      }
      return out;
    }
    if (invView === "materials") {
      return snapshot.materials.map((g) => ({ title: g.name, where: `Material storage, ${g.name}`, slots: g.slots, counted: true }));
    }
    return [{ title: "Shared inventory slots", where: "Shared slots", slots: snapshot.shared }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invView, char, snapshot]);

  const q = query.trim().toLowerCase();
  const matches = (id) => !!q && (itemOf(id)?.name || "").toLowerCase().includes(q);

  let used = 0; let total = 0; let matchCount = 0; let value = 0;
  for (const sec of sections) {
    for (const s of sec.slots) {
      total++;
      if (!s) continue;
      used++;
      if (matches(s.id)) matchCount++;
      const sell = priceMap[s.id]?.sells?.unit_price || 0;
      if (sell > 0 && s.binding == null) value += Math.floor(sell * TP_TAX) * s.count;
    }
  }

  const views = [["bags", "Bags"], ["bank", "Bank"], ["materials", "Materials"], ["shared", "Shared"]];
  const scope = invView === "bags" ? `${char.name}'s bags` : invView === "bank" ? "Bank, shared by all characters"
    : invView === "materials" ? "Material storage, shared by all characters" : "Shared slots, available on every character";

  return (
    <section className="chr-panel chr-inv" aria-label="Inventory">
      <div className="chr-panel-hdr">
        <h2>Inventory</h2>
        <div className="chr-pills" role="group" aria-label="Inventory views">
          {views.map(([k, l]) => (
            <button key={k} type="button" className={invView === k ? "on" : ""} aria-pressed={invView === k} onClick={() => setInvView(k)}>{l}</button>
          ))}
        </div>
        <label className="chr-find">
          <span className="chr-visually-hidden">Highlight items in this view</span>
          <input className="si" type="search" placeholder="Highlight items" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      <div className="chr-inv-meta">
        <span>{scope}</span>
        {q ? <span>{matchCount} {matchCount === 1 ? "match" : "matches"} here</span> : <span />}
        <button type="button" className="chr-link" onClick={openFind}>Search every character</button>
      </div>

      <div className="chr-inv-scroll">
        {sections.length === 0 && <div className="chr-note">Nothing here. If your API key is missing the Inventories permission, see the note above.</div>}
        {sections.map((sec) => (
          <div key={sec.title} className="chr-sec">
            <div className="chr-sec-hdr">
              <span>{sec.title}</span>
              <span>{sec.counted ? `${sec.slots.length} types` : `${sec.slots.filter(Boolean).length} / ${sec.slots.length}`}</span>
            </div>
            <div className="chr-grid">
              {sec.slots.map((s, i) => {
                const key = `stack|${invView}|${sec.title}|${i}`;
                return (
                  <ItemSlot key={i} id={s?.id} count={s?.count} item={s ? itemOf(s.id) : null} size="100%"
                    selected={selected?.key === key} match={s && matches(s.id)} dim={!!q && !(s && matches(s.id))}
                    onSelect={() => setSelected({ key, kind: "stack", id: s.id, count: s.count, where: sec.counted ? sec.where : `${sec.where}, slot ${i + 1}` })} />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="chr-inv-foot">
        <span>{invView === "materials" ? `${used} material types` : `${used} of ${total} slots used`}</span>
        <span>Tradeable value after 15% TP tax: <Gold v={value} /></span>
      </div>
      {selected?.kind === "stack" && <DetailCard selected={selected} snapshot={snapshot} itemOf={itemOf} priceMap={priceMap} />}
    </section>
  );
}

// ── Find ──────────────────────────────────────────────────────────────────────

function FindPanel({ snapshot, itemOf, priceMap, query, setQuery, kind, setKind, openChar }) {
  const rows = useMemo(() => flattenOwned(snapshot), [snapshot]);
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (q.length < 2) return [];
    const map = {};
    for (const r of rows) {
      if (kind !== "All" && r.kind !== kind) continue;
      const name = itemOf(r.id)?.name || "";
      if (!name.toLowerCase().includes(q)) continue;
      (map[r.id] ||= { id: r.id, name, total: 0, rows: [] });
      map[r.id].total += r.count;
      map[r.id].rows.push(r);
    }
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 60)
      .map((g) => ({ ...g, rows: g.rows.sort((a, b) => b.count - a.count) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, kind]);

  return (
    <div className="chr-findview">
      <div className="ctrl">
        <label className="chr-find-big">
          <span className="chr-find-lbl">Item name, across every character, equipped gear, bank, material storage, shared slots and the Legendary Armory</span>
          <input className="si" type="search" autoFocus placeholder="e.g. Amalgamated Gemstone" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      <div className="chr-pills" role="group" aria-label="Filter by location">
        {FIND_KINDS.map((k) => (
          <button key={k} type="button" className={kind === k ? "on" : ""} aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>
        ))}
      </div>

      {q.length < 2 ? (
        <div className="chr-note">Type at least two letters of an item name.</div>
      ) : groups.length === 0 ? (
        <div className="chr-note">Nothing on this account matches “{query.trim()}”{kind !== "All" ? ` in ${kind}` : ""}.</div>
      ) : (
        <div className="chr-results">
          {groups.map((g) => {
            const it = itemOf(g.id);
            const sell = priceMap[g.id]?.sells?.unit_price || 0;
            return (
              <div key={g.id} className="chr-result">
                <div className="chr-result-hdr">
                  <ItemSlot id={g.id} item={it} size={40} still />
                  <div className="chr-result-title">
                    <div className={`rar-${it?.rarity || "Basic"}`}>{g.name}</div>
                    <div className="chr-result-sub">{it?.rarity}, {g.rows.length} {g.rows.length === 1 ? "location" : "locations"}</div>
                  </div>
                  <div className="chr-result-total">
                    <div className="chr-result-num">{g.total.toLocaleString()}</div>
                    {sell > 0 && <div className="chr-result-sub"><Gold v={Math.floor(sell * TP_TAX) * g.total} /> after tax</div>}
                  </div>
                </div>
                {g.rows.map((r, i) => (
                  <div key={i} className="chr-result-row">
                    <span>{r.where}</span>
                    <span className="chr-result-right">
                      {r.char && <button type="button" className="chr-link" onClick={() => openChar(r.char)}>Open character</button>}
                      <span className="chr-result-kind">{r.kind}</span>
                      <span className="chr-result-count">{r.count.toLocaleString()}</span>
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
