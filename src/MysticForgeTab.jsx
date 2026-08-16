import React, { useState, useMemo, useCallback } from "react";
import {
  MATERIAL_PROMOTION_RECIPES,
  EQUIPMENT_RECIPES_GENERIC,
  EQUIPMENT_RECIPES_STANDARD,
  EQUIPMENT_RECIPES_TRINKETS,
  MINIATURE_PROMOTION_RECIPES,
  MYSTIC_CLOVER_RECIPES,
  buildForgeItems,
  resolveForgeIds,
  FORGE_IDS,
  SPIRIT_SHARD_COSTS,
  ELONIAN_WINE_VENDOR_PRICE,
  getObsidianAcquisition,
  buildForgeRecipeMap,
  getIngredientEffectiveCost,
} from "./mystic-forge-data.js";
import {
  LEGENDARY_RECIPES,
  LEGENDARY_WEAPON_TYPES,
  resolveLegendaryIds,
  calcLegendaryMissingCost,
} from "./legendary-data.js";
import {
  LEGENDARY_RECIPES_GEN2,
  LEGENDARY_GEN2_EXPANSIONS,
} from "./legendary-data-gen2.js";
import {
  LEGENDARY_RECIPES_GEN3,
  LEGENDARY_GEN3_EXPANSIONS,
} from "./legendary-data-gen3.js";
import {
  LEGENDARY_ARMOR_RECIPES,
  ARMOR_WEIGHT_CLASSES,
  ARMOR_SLOTS_LIST,
  ARMOR_GENERATIONS,
} from "./legendary-data-armor.js";
import {
  LEGENDARY_OTHER_RECIPES,
  LEGENDARY_OTHER_CATEGORIES,
} from "./legendary-data-other.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const Gold = ({ v, size = 14 }) => {
  if (v == null || isNaN(v)) return <span style={{ color: "var(--text3)" }}>—</span>;
  const neg = v < 0;
  const abs = Math.abs(Math.round(v));
  const g = Math.floor(abs / 10000);
  const s = Math.floor((abs % 10000) / 100);
  const c = abs % 100;
  const col = neg ? "var(--red)" : undefined;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: size, color: col }}>
      {neg && <span>−</span>}
      {g > 0 && <><b>{g}</b><span style={{ fontSize: 10, background: "#3a2e00", color: "var(--gold2)", padding: "0 3px", borderRadius: 2 }}>g</span></>}
      {s > 0 && <><b>{s}</b><span style={{ fontSize: 10, background: "#2a2a3a", color: "#c0c0d8", padding: "0 3px", borderRadius: 2 }}>s</span></>}
      <b>{c}</b><span style={{ fontSize: 10, background: "#2a1a0a", color: "var(--copper)", padding: "0 3px", borderRadius: 2 }}>c</span>
    </span>
  );
};

// ── Receipt-style hover stat ────────────────────────────────────────────────
// Mirrors the ReceiptStat component in App.jsx — renders a stat with a
// vertical receipt breakdown shown on hover (desktop only). Kept as a local
// copy since MysticForgeTab.jsx has no shared UI module with App.jsx.
function ReceiptStat({ label, value, lines, size = 14 }) {
  const positive = value >= 0;
  return (
    <div className="ci-stat tt-wrap">
      <span className="ci-stat-lbl">{label}</span>
      <span className={positive ? "pp" : "pn"} style={{ fontSize: size }}>
        {positive ? "+" : ""}<Gold v={value} size={size} />
      </span>
      <div className="tt" style={{ minWidth: 260, textAlign: "left" }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", gap: 20,
            padding: l.isTotal ? "6px 0 0" : "3px 0",
            marginTop: l.isTotal ? 6 : 0,
            borderTop: l.isTotal ? "1px solid var(--border2)" : "none",
          }}>
            <span style={{ fontSize: 13, fontWeight: l.isTotal ? 600 : 400, color: l.isTotal ? "var(--text1)" : "var(--text3)" }}>{l.label}</span>
            <span style={{ fontSize: 13, fontWeight: l.isTotal ? 600 : 400, color: l.isTotal ? (l.value >= 0 ? "var(--green2)" : "var(--red2)") : "var(--text2)" }}>
              <Gold v={l.value} size={13} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrencyBar({ wallet }) {
  const items = [
    { label: "Spirit Shards", value: wallet.spirit_shards, color: "var(--blue2)" },
    { label: "Volatile Magic", value: wallet.volatile_magic, color: "#a060e0" },
    { label: "Unbound Magic", value: wallet.unbound_magic, color: "#60a0e0" },
    { label: "Karma", value: wallet.karma, color: "#c06090" },
    { label: "Laurels", value: wallet.laurels, color: "var(--green2)" },
  ];
  return (
    <div style={{ display: "flex", gap: 20, padding: "10px 16px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 5, marginBottom: 16, flexWrap: "wrap" }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--text3)" }}>{label.toUpperCase()}</span>
          <span style={{ fontSize: 14, color, fontWeight: 600 }}>
            {value != null ? value.toLocaleString() : <span style={{ color: "var(--text3)" }}>—</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Ingredient Row ─────────────────────────────────────────────────────────────
function IngredientRow({ inp, itemMap, ownedMap, spiritShards }) {
  const item = inp.itemId ? itemMap[inp.itemId] : null;
  const owned = inp.itemId ? (ownedMap[inp.itemId] || 0) : 0;
  const haveEnough = owned >= inp.count;

  const sourceBadge = (() => {
    if (inp.effectiveSource === 'spirit_shard') {
      const canAfford = inp.canAfford !== false; // default true if field missing
      return <span style={{ fontSize: 10, color: canAfford ? "var(--blue2)" : "var(--red)", background: canAfford ? "rgba(90,160,210,.15)" : "rgba(200,60,60,.15)", padding: "1px 6px", borderRadius: 3 }}>
        🔮 {inp.shardsNeeded ?? '?'} Spirit Shard{(inp.shardsNeeded ?? 1) !== 1 ? 's' : ''}
        {!canAfford && <span style={{ marginLeft: 4, opacity: .8 }}>(need more)</span>}
      </span>;
    }
    if (inp.effectiveSource === 'vendor') return <span style={{ fontSize: 10, color: "var(--gold2)", background: "rgba(200,150,42,.15)", padding: "1px 6px", borderRadius: 3 }}>🏪 Vendor</span>;
    if (inp.effectiveSource === 'owned') return <span style={{ fontSize: 10, color: "var(--green2)", background: "rgba(60,160,60,.15)", padding: "1px 6px", borderRadius: 3 }}>✓ Owned</span>;
    if (inp.effectiveSource === 'forge') return <span style={{ fontSize: 10, color: "#a060e0", background: "rgba(160,90,220,.15)", padding: "1px 6px", borderRadius: 3 }}>⚗ Mystic Forge</span>;
    return null;
  })();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 10px", borderBottom: "1px solid var(--border)", transition: "background .1s" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
      onMouseLeave={e => e.currentTarget.style.background = ""}>
      {item?.icon
        ? <img src={item.icon} style={{ width: 22, height: 22, borderRadius: 2, border: "1px solid var(--border2)", flexShrink: 0 }} alt="" />
        : <div style={{ width: 22, height: 22, background: "var(--bg4)", borderRadius: 2, flexShrink: 0 }} />
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className={`rar-${item?.rarity || ''}`} style={{ fontSize: 13 }}>{inp.name}</span>
        <span style={{ fontSize: 12, color: "var(--text3)", marginLeft: 8 }}>×{inp.count}</span>
      </div>
      <span style={{ fontSize: 12, color: haveEnough ? "var(--green2)" : "var(--red)", minWidth: 60, textAlign: "right" }}>
        {owned}/{inp.count}
      </span>
      {sourceBadge}
      {inp.effectiveCost > 0 && (
        <span style={{ minWidth: 100, textAlign: "right" }}><Gold v={inp.effectiveCost} size={12} /></span>
      )}
    </div>
  );
}

// ── Miniature Chain Node ───────────────────────────────────────────────────────
function MiniChainNode({ recipe, depth = 0, forgeRecipeMap, itemMap, priceMap, ownedMap }) {
  const [expanded, setExpanded] = useState(false);
  const hasForgeInputs = recipe.inputs.some(inp => inp.itemId && forgeRecipeMap[inp.itemId]);
  const icon = recipe.itemData?.icon;
  const rarity = recipe.itemData?.rarity || recipe.rarity;

  return (
    <div style={{ marginLeft: depth * 20, borderLeft: depth > 0 ? "2px solid rgba(200,150,42,.25)" : "none", paddingLeft: depth > 0 ? 12 : 0, marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: hasForgeInputs ? "pointer" : "default", padding: "4px 0" }}
        onClick={() => hasForgeInputs && setExpanded(e => !e)}>
        {icon ? <img src={icon} style={{ width: 28, height: 28, borderRadius: 3, border: "1px solid var(--border2)" }} alt="" /> : <div style={{ width: 28, height: 28, background: "var(--bg4)", borderRadius: 3 }} />}
        <span className={`rar-${rarity}`} style={{ fontSize: 14, fontWeight: 600 }}>{recipe.name}</span>
        {hasForgeInputs && <span style={{ fontSize: 12, color: "var(--text3)" }}>{expanded ? "▲" : "▼"}</span>}
      </div>
      {expanded && recipe.inputs.map((inp, i) => {
        const subRecipe = inp.itemId && forgeRecipeMap[inp.itemId];
        if (subRecipe) {
          return <MiniChainNode key={i} recipe={subRecipe} depth={depth + 1} forgeRecipeMap={forgeRecipeMap} itemMap={itemMap} priceMap={priceMap} ownedMap={ownedMap} />;
        }
        const item = inp.itemId ? itemMap[inp.itemId] : null;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 16, padding: "3px 0", fontSize: 13 }}>
            {item?.icon ? <img src={item.icon} style={{ width: 20, height: 20, borderRadius: 2, border: "1px solid var(--border2)" }} alt="" /> : <div style={{ width: 20, height: 20, background: "var(--bg4)", borderRadius: 2 }} />}
            <span>{inp.name}</span>
            <span style={{ color: "var(--text3)" }}>×{inp.count}</span>
            {inp.itemId && priceMap[inp.itemId]?.sells?.unit_price > 0 && (
              <Gold v={priceMap[inp.itemId].sells.unit_price * inp.count} size={12} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Recipe Card ────────────────────────────────────────────────────────────────
function ForgeRecipeCard({ item, itemMap, priceMap, ownedMap, spiritShards, trendSummary, velocitySummary, forgeRecipeMap }) {
  const [open, setOpen] = useState(false);

  const trend = trendSummary[item.outputId];
  const vel = velocitySummary[item.outputId];
  const sellFills = vel?.observations >= 5 ? vel.sellFillsPerHr : null;

  return (
    <div className="ci">
      <div className="ci-hdr" onClick={() => setOpen(o => !o)}>
        {item.itemData?.icon
          ? <img className="iico" src={item.itemData.icon} alt="" />
          : <div className="iico-ph" />
        }
        <div className="ci-name">
          <span className={`rar-${item.itemData?.rarity || ''}`}>{item.name}</span>
          {item.outputIsAverage && (
            <span style={{ fontSize: 10, color: "var(--text3)", marginLeft: 8, fontStyle: "italic" }}>avg ×{item.outputCount}</span>
          )}
          {item.subcategory && (
            <span style={{ fontSize: 10, color: "var(--text3)", marginLeft: 8, fontFamily: "Cinzel,serif" }}>{item.subcategory}</span>
          )}
        </div>
        {item.hasUnresolved && (
          <span style={{ fontSize: 10, color: "var(--gold)", background: "rgba(200,150,42,.1)", border: "1px solid rgba(200,150,42,.3)", borderRadius: 3, padding: "1px 6px" }}>⚠ Some IDs pending</span>
        )}
        <div className="ci-stats">
          {(() => {
            const sellPrice = item.outSell * item.outputCount;
            const taxAmt = sellPrice - item.outSellNet;
            return (
              <>
              <div className="ci-stat">
                <span className="ci-stat-lbl">SELL PRICE</span>
                <span style={{ fontSize: 14 }}><Gold v={sellPrice} size={14} /></span>
                {item.outputIsAverage && <span style={{ fontSize: 9, color: "var(--text3)", fontStyle: "italic" }}>avg</span>}
              </div>
              <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
                <ReceiptStat
                  label="NET PROFIT"
                  value={item.profitNet}
                  size={14}
                  lines={[
                    { label: "Sell Price", value: sellPrice },
                    { label: "− 15% TP Tax", value: -taxAmt },
                    { label: "− Must-Buy Mats", value: -item.totalInputCost },
                    { label: "Net Profit", value: item.profitNet, isTotal: true },
                  ]}
                />
              </div>
              <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
                <ReceiptStat
                  label="CRAFT ADVANTAGE"
                  value={item.craftAdvantage}
                  size={14}
                  lines={[
                    { label: "Net Profit", value: item.profitNet },
                    { label: "− Owned Mats Cost", value: -(item.matSellNet || 0) },
                    { label: "Craft Advantage", value: item.craftAdvantage, isTotal: true },
                  ]}
                />
                {trend && <span style={{ fontSize: 10, color: trend.pct > 0 ? "var(--green2)" : "var(--red2)" }}>{trend.pct > 0 ? "▲" : "▼"} {Math.abs(trend.pct).toFixed(1)}%</span>}
              </div>
              {sellFills != null && (
                <div className="ci-stat" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 12 }}
                title="Buyers paying ask price per hour. High fills + few listings = low undercutting competition.">
                  <span className="ci-stat-lbl">BUYING HIGH</span>
                  <span style={{ fontSize: 13, color: sellFills >= 2 ? "var(--green2)" : sellFills === 0 ? "var(--red)" : "var(--gold2)" }}>
                    {sellFills.toFixed(1)}/hr
                  </span>
                </div>
              )}
              </>
            );
          })()}
        </div>
        <span style={{ color: "var(--text3)", fontSize: 13, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="ci-body">
          {/* Ingredient list */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: "Cinzel,serif", fontSize: 10, letterSpacing: 2, color: "var(--text3)", padding: "6px 10px", borderBottom: "1px solid var(--border)" }}>
              INGREDIENTS
            </div>
            {item.inputDetails.map((inp, i) => (
              <IngredientRow key={i} inp={inp} itemMap={itemMap} ownedMap={ownedMap} spiritShards={spiritShards} />
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderTop: "1px solid var(--border2)", fontWeight: 600 }}>
              <span style={{ fontSize: 11, fontFamily: "Cinzel,serif", color: "var(--text3)" }}>TOTAL INPUT COST</span>
              <Gold v={item.totalInputCost} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Equipment Reference Card ───────────────────────────────────────────────────
function EquipmentRefCard({ recipe, itemMap, priceMap, ownedMap, spiritShards }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ci" style={{ marginBottom: 6 }}>
      <div className="ci-hdr" onClick={() => setOpen(o => !o)} style={{ minHeight: 52 }}>
        <div className="ci-name">
          <span className="rar-Exotic">{recipe.name}</span>
          {recipe.weaponType && <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 8 }}>{recipe.weaponType}</span>}
          {recipe.type && <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 8 }}>{recipe.type}</span>}
        </div>
        <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "2px 8px", borderRadius: 3, background: `rgba(${recipe.rarity === 'Ascended' ? '251,62,141' : '255,164,5'},.15)`, color: recipe.rarity === 'Ascended' ? "#fb3e8d" : "#ffa405", border: `1px solid ${recipe.rarity === 'Ascended' ? 'rgba(251,62,141,.4)' : 'rgba(255,164,5,.4)'}` }}>
          {recipe.rarity}
        </span>
        {recipe.isGenericInput && <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif" }}>⚠ Generic Input</span>}
        <span style={{ color: "var(--text3)", fontSize: 13, marginLeft: "auto" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="ci-body">
          <div style={{ fontFamily: "Cinzel,serif", fontSize: 10, letterSpacing: 2, color: "var(--text3)", padding: "6px 10px", borderBottom: "1px solid var(--border)" }}>
            {recipe.isGenericInput ? "INGREDIENTS (REFERENCE ONLY — generic input required)" : "INGREDIENTS"}
          </div>
          {recipe.inputs.map((inp, i) => {
            const item = inp.itemId ? itemMap[inp.itemId] : null;
            const tpSell = inp.itemId ? (priceMap[inp.itemId]?.sells?.unit_price || 0) : 0;
            const owned = inp.itemId ? (ownedMap[inp.itemId] || 0) : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 10px", borderBottom: "1px solid var(--border)" }}>
                {item?.icon ? <img src={item.icon} style={{ width: 22, height: 22, borderRadius: 2, border: "1px solid var(--border2)" }} alt="" /> : <div style={{ width: 22, height: 22, background: "var(--bg4)", borderRadius: 2 }} />}
                <span style={{ flex: 1, fontSize: 13 }}>
                  {inp.isGeneric
                    ? <span style={{ color: "var(--gold)", fontStyle: "italic" }}>{inp.name}</span>
                    : <span className={`rar-${item?.rarity || ''}`}>{inp.name}</span>
                  }
                  <span style={{ color: "var(--text3)", marginLeft: 8 }}>×{inp.count}</span>
                  {inp.spiritShards && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: "var(--blue2)", background: "rgba(90,160,210,.15)", padding: "1px 6px", borderRadius: 3 }}>
                      🔮 {inp.spiritShards * inp.count} Spirit Shards
                    </span>
                  )}
                </span>
                {inp.itemId && <span style={{ fontSize: 12, color: owned >= inp.count ? "var(--green2)" : "var(--red)" }}>{owned}/{inp.count}</span>}
                {tpSell > 0 && <Gold v={tpSell * inp.count} size={12} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

// ── Source badge helper ────────────────────────────────────────────────────────
const SOURCE_BADGE = {
  wvw:         { label: '⚔ WvW',              color: '#e07830', bg: 'rgba(224,120,48,.15)' },
  exploration: { label: '🗺 Map Completion',   color: '#7ac878', bg: 'rgba(122,200,120,.15)' },
  heroics:     { label: '⚡ Hero Points',       color: 'var(--blue2)', bg: 'rgba(90,160,210,.15)' },
  collection:  { label: '📜 Collection',        color: 'var(--gold2)', bg: 'rgba(200,150,42,.15)' },
  karma:       { label: '🔮 Karma',             color: '#9855c8', bg: 'rgba(152,85,200,.15)' },
  forge:       { label: '⚗ Mystic Forge',       color: '#a060e0', bg: 'rgba(160,90,220,.15)' },
};

function SourceBadge({ source, accountBound }) {
  const s = SOURCE_BADGE[source];
  if (!s) return null;
  return (
    <span style={{ fontSize: 10, color: s.color, background: s.bg,
      border: `1px solid ${s.color}55`, borderRadius: 3, padding: '1px 6px',
      fontFamily: 'Cinzel,serif', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// ── Single ingredient node in the legendary tree ───────────────────────────────
function LegendaryIngredientNode({ node, priceMap, ownedMap, depth = 0, parentShortfall = 1, legendaryAchievements = {} }) {
  const [open, setOpen] = React.useState(depth === 0);

  const itemId = node.itemId;
  const owned  = itemId ? (ownedMap[itemId] || 0) : 0;
  const needed = (node.count || 1) * parentShortfall;
  const shortfall = Math.max(0, needed - owned);
  const hasChildren = node.inputs?.length > 0;

  // Cumulative cost for this node (includes all descendants)
  const totalMissingCost = React.useMemo(() =>
    calcLegendaryMissingCost(node, needed, priceMap, ownedMap),
    [node, needed, priceMap, ownedMap]
  );

  const tpSell = itemId ? (priceMap[itemId]?.sells?.unit_price || 0) : 0;
  const haveEnough = shortfall === 0;
  const isNoGold = ['wvw', 'exploration', 'heroics', 'collection', 'karma'].includes(node.source);

  // Color coding
  const nameColor = haveEnough ? 'var(--green2)'
    : shortfall > 0 && tpSell === 0 && !hasChildren && !isNoGold ? 'var(--red)'
    : 'var(--text2)';

  const costColor = totalMissingCost > 100000 ? 'var(--red)'
    : totalMissingCost > 10000 ? 'var(--gold2)'
    : 'var(--green2)';

  return (
    <div style={{ marginLeft: depth * 18, borderLeft: depth > 0 ? '2px solid rgba(200,150,42,.2)' : 'none', paddingLeft: depth > 0 ? 10 : 0, marginTop: 3 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 3, cursor: hasChildren ? 'pointer' : 'default', transition: 'background .1s' }}
        onMouseEnter={e => { if (hasChildren) e.currentTarget.style.background = 'var(--bg3)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = ''; }}
        onClick={() => hasChildren && setOpen(o => !o)}
      >
        {/* Icon */}
        {node.icon
          ? <img src={node.icon} style={{ width: 24, height: 24, borderRadius: 3, border: '1px solid var(--border2)', flexShrink: 0 }} alt="" />
          : <div style={{ width: 24, height: 24, background: 'var(--bg4)', borderRadius: 3, border: '1px solid var(--border2)', flexShrink: 0 }} />
        }

        {/* Name + count */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: depth === 0 ? 14 : 13, fontWeight: depth === 0 ? 600 : 400, color: nameColor }}>
            {node.name}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 6 }}>×{needed}</span>
          {node.note && <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 8, fontStyle: 'italic' }}>{node.note}</span>}
        </div>

        {/* Source badge */}
        <SourceBadge source={node.source} accountBound={node.accountBound} />

        {/* Achievement progress (for Spark of Sentience, Gift of Valor) */}
        {node.achievementId && (() => {
          const ach = legendaryAchievements[node.achievementId];
          const done = ach?.done || false;
          const current = ach?.current ?? null;
          const max = node.achievementBitCount || ach?.max || null;
          if (current === null && !done) return (
            <span style={{ fontSize:10, fontFamily:'Cinzel,serif', letterSpacing:1, padding:'1px 7px', borderRadius:3, background:'rgba(200,150,42,.1)', border:'1px solid rgba(200,150,42,.3)', color:'var(--gold2)', whiteSpace:'nowrap' }}>
              Achievement — {max ? `0/${max}` : 'progress unknown'}
            </span>
          );
          return done
            ? <span style={{ fontSize:10, fontFamily:'Cinzel,serif', letterSpacing:1, padding:'1px 7px', borderRadius:3, background:'rgba(60,160,60,.15)', border:'1px solid rgba(60,160,60,.4)', color:'var(--green2)', whiteSpace:'nowrap' }}>✓ Achievement Done</span>
            : <span style={{ fontSize:10, fontFamily:'Cinzel,serif', letterSpacing:1, padding:'1px 7px', borderRadius:3, background:'rgba(200,150,42,.1)', border:'1px solid rgba(200,150,42,.3)', color:'var(--gold2)', whiteSpace:'nowrap' }}>
                Achievement: {current}/{max} — {max - current} more needed
              </span>;
        })()}

        {/* Owned / needed */}
        <span style={{ fontSize: 12, color: haveEnough ? 'var(--green2)' : 'var(--red)', minWidth: 60, textAlign: 'right', flexShrink: 0 }}>
          {owned}/{needed}
        </span>

        {/* Total missing cost (cumulative) */}
        {isNoGold
          ? <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 100, textAlign: 'right' }}>no gold cost</span>
          : haveEnough
            ? <span style={{ fontSize: 12, color: 'var(--green2)', minWidth: 100, textAlign: 'right' }}>✓ owned</span>
            : totalMissingCost > 0
              ? <span style={{ minWidth: 100, textAlign: 'right' }}><Gold v={totalMissingCost} size={12} /></span>
              : <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 100, textAlign: 'right' }}>—</span>
        }

        {/* Expand toggle */}
        {hasChildren && <span style={{ color: 'var(--text3)', fontSize: 11, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>}
      </div>

      {/* Children */}
      {open && hasChildren && node.inputs.map((child, i) => (
        <LegendaryIngredientNode
          key={i}
          node={child}
          priceMap={priceMap}
          ownedMap={ownedMap}
          depth={depth + 1}
          parentShortfall={shortfall > 0 ? 1 : 0}
          legendaryAchievements={legendaryAchievements}
        />
      ))}
    </div>
  );
}

// ── Full legendary recipe card ─────────────────────────────────────────────────
function LegendaryRecipeCard({ recipe, itemMap, priceMap, ownedMap, legendaryAchievements = {} }) {
  const [open, setOpen] = React.useState(false);

  const totalCost = React.useMemo(() =>
    recipe.inputs.reduce((sum, inp) => sum + calcLegendaryMissingCost(inp, inp.count, priceMap, ownedMap), 0),
    [recipe, priceMap, ownedMap]
  );

  const outputId = recipe.itemId;
  const outputSell = outputId ? (priceMap[outputId]?.sells?.unit_price || 0) : 0;
  const icon = outputId ? itemMap[outputId]?.icon : null;

  return (
    <div className="ci" style={{ marginBottom: 8 }}>
      {/* Header */}
      <div className="ci-hdr" onClick={() => setOpen(o => !o)}>
        {icon
          ? <img className="iico" src={icon} alt="" />
          : <div className="iico-ph" style={{ background: 'linear-gradient(135deg, #3a2060, #9855c8)' }} />
        }
        <div className="ci-name">
          <span className="rar-Legendary">{recipe.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 10, fontFamily: 'Cinzel,serif' }}>{recipe.weaponType}</span>
          {recipe.note && <span style={{ fontSize: 10, color: 'var(--gold)', marginLeft: 10, fontStyle: 'italic' }}>{recipe.note}</span>}
        </div>
        <span style={{ fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: 1, padding: '2px 8px', borderRadius: 3, background: 'rgba(159,77,255,.15)', border: '1px solid rgba(159,77,255,.4)', color: '#9f4dff', flexShrink: 0 }}>
          Gen {recipe.generation}
        </span>
        {recipe.expansion && (
          <span style={{ fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: 1, padding: '2px 8px', borderRadius: 3, background: 'rgba(200,150,42,.1)', border: '1px solid rgba(200,150,42,.3)', color: 'var(--gold2)', flexShrink: 0 }}>
            {recipe.expansion}
          </span>
        )}

        {/* Cost summary */}
        <div className="ci-stats">
          <div className="ci-stat">
            <span className="ci-stat-lbl">TOTAL MISSING COST</span>
            {totalCost > 0
              ? <span style={{ color: totalCost > 5000000 ? 'var(--red)' : totalCost > 1000000 ? 'var(--gold2)' : 'var(--green2)', fontSize: 14 }}>
                  <Gold v={totalCost} size={14} />
                </span>
              : <span style={{ color: 'var(--green2)', fontSize: 14 }}>✓ Have all mats</span>
            }
          </div>
          {outputSell > 0 && (
            <div className="ci-stat" style={{ borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
              <span className="ci-stat-lbl">TP SELL PRICE</span>
              <Gold v={outputSell} size={14} />
            </div>
          )}
        </div>
        <span style={{ color: 'var(--text3)', fontSize: 13, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Expanded ingredient tree */}
      {open && (
        <div className="ci-body" style={{ padding: '12px 16px' }}>
          {/* Column headers */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '4px 8px', marginBottom: 4, fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: 1, color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
            <span style={{ flex: 1 }}>INGREDIENT</span>
            <span style={{ width: 120 }}>SOURCE</span>
            <span style={{ width: 60, textAlign: 'right' }}>OWNED</span>
            <span style={{ width: 100, textAlign: 'right' }}>MISSING COST</span>
            <span style={{ width: 20 }} />
          </div>
          {recipe.inputs.map((inp, i) => (
            <LegendaryIngredientNode
              key={i}
              node={inp}
              priceMap={priceMap}
              ownedMap={ownedMap}
              depth={0}
              parentShortfall={1}
              legendaryAchievements={legendaryAchievements}
            />
          ))}
          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '2px solid var(--border2)', fontWeight: 600 }}>
            <span style={{ fontFamily: 'Cinzel,serif', fontSize: 11, letterSpacing: 1, color: 'var(--text3)' }}>TOTAL MISSING COST (all levels)</span>
            {totalCost > 0
              ? <Gold v={totalCost} size={14} />
              : <span style={{ color: 'var(--green2)', fontSize: 13 }}>✓ You have all materials</span>
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default function MysticForgeTab({ data, priceMap, ownedMap, velocitySummary, trendSummary, wallet, legendaryAchievements = {} }) {
  const [subTab, setSubTab] = useState("material");
  const [matSubcat, setMatSubcat] = useState("All");
  const [searchForge, setSearchForge] = useState("");
  const [legendaryWeaponType, setLegendaryWeaponType] = useState("All");
  const [searchLegendary, setSearchLegendary] = useState("");
  const [legendaryGen, setLegendaryGen] = useState("All"); // "All", "1", "2", "3"
  const [legendaryExpansion, setLegendaryExpansion] = useState("All");
  const [armorWeightFilter, setArmorWeightFilter] = useState("All");
  const [armorSlotFilter, setArmorSlotFilter] = useState("All");
  const [armorGenFilter, setArmorGenFilter] = useState("All");
  const [otherCategoryFilter, setOtherCategoryFilter] = useState("Back Items");

  const itemMap = data?.itemMap || {};
  const spiritShards = wallet?.spirit_shards || 0;

  // Resolve NAME_LOOKUP IDs from itemMap
  const resolvedIds = useMemo(() => resolveForgeIds(itemMap), [itemMap]);

  // Patch null IDs in recipes using resolved names
  const resolvedRecipes = useMemo(() => {
    const nameToId = {};
    for (const [id, item] of Object.entries(itemMap)) {
      if (item?.name) nameToId[item.name] = Number(id);
    }
    return MATERIAL_PROMOTION_RECIPES.map(r => {
      const outputId = r.outputId ?? (r.outputIdName ? nameToId[r.outputIdName] : null) ?? null;
      const inputs = r.inputs.map(inp => ({
        ...inp,
        itemId: inp.itemId ?? (inp.name ? nameToId[inp.name] : null) ?? null,
      }));
      return { ...r, outputId, inputs };
    });
  }, [itemMap]);

  const forgeRecipeMap = useMemo(() => buildForgeRecipeMap(resolvedRecipes), [resolvedRecipes]);

  // Resolve NAME_LOOKUP IDs for legendary recipes (gen1 + gen2 + gen3 merged)
  const resolvedLegendaryRecipes = useMemo(() => {
    if (!itemMap || Object.keys(itemMap).length === 0) return [];
    // Deduplicate by id to prevent duplicates when same weapon appears in multiple gen files
    const seen = new Set();
    const allRecipes = [...LEGENDARY_RECIPES, ...LEGENDARY_RECIPES_GEN2, ...LEGENDARY_RECIPES_GEN3]
      .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
    return resolveLegendaryIds(allRecipes, itemMap);
  }, [itemMap]);

  const resolvedArmorRecipes = useMemo(() => {
    if (!itemMap || Object.keys(itemMap).length === 0) return [];
    return resolveLegendaryIds(LEGENDARY_ARMOR_RECIPES, itemMap);
  }, [itemMap]);

  const resolvedOtherRecipes = useMemo(() => {
    if (!itemMap || Object.keys(itemMap).length === 0) return LEGENDARY_OTHER_RECIPES;
    const resolveList = (list) => resolveLegendaryIds(list, itemMap);
    return {
      backItems: resolveList(LEGENDARY_OTHER_RECIPES.backItems),
      trinkets:  resolveList(LEGENDARY_OTHER_RECIPES.trinkets),
      relics:    resolveList(LEGENDARY_OTHER_RECIPES.relics),
      runes:     resolveList(LEGENDARY_OTHER_RECIPES.runes),
      sigils:    resolveList(LEGENDARY_OTHER_RECIPES.sigils),
    };
  }, [itemMap]);

  // Build forge items with profit calculations
  const forgeItems = useMemo(() => {
    if (!priceMap || !ownedMap) return [];
    return buildForgeItems(resolvedRecipes, itemMap, priceMap, ownedMap, spiritShards);
  }, [resolvedRecipes, itemMap, priceMap, ownedMap, spiritShards]);

  // Subcategories for material promotion
  const subcats = useMemo(() => {
    const s = new Set(["All"]);
    resolvedRecipes.forEach(r => { if (r.subcategory) s.add(r.subcategory); });
    return [...s];
  }, [resolvedRecipes]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = forgeItems;
    if (matSubcat !== "All") items = items.filter(i => i.subcategory === matSubcat);
    if (searchForge) items = items.filter(i => i.name.toLowerCase().includes(searchForge.toLowerCase()));
    return items;
  }, [forgeItems, matSubcat, searchForge]);

  const subTabs = [
    { key: "material",    label: "Material Promotion" },
    { key: "mysticclover", label: "🍀 Mystic Clover" },
    { key: "equipment",   label: "Equipment" },
    { key: "miniatures",  label: "Miniatures" },
    { key: "legendary",   label: "⚜ Legendary Weapons" },
    { key: "armor",       label: "⚜ Legendary Armor" },
    { key: "other",       label: "⚜ Back / Trinkets / More" },
  ];

  return (
    <div>
      {/* Currency bar */}
      <CurrencyBar wallet={wallet} />

      {/* Sub-tab nav */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 10, flexWrap: "wrap" }}>
        {subTabs.map(({ key, label }) => (
          <button key={key} onClick={() => setSubTab(key)}
            style={{ fontSize: 12, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "6px 16px", borderRadius: 4, cursor: "pointer",
              border: subTab === key ? "1px solid var(--gold2)" : "1px solid var(--border)",
              background: subTab === key ? "rgba(200,150,42,.15)" : "transparent",
              color: subTab === key ? "var(--gold2)" : "var(--text3)" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Material Promotion ── */}
      {subTab === "material" && (
        <div>
          <div style={{ marginBottom: 12, fontSize: 13, color: "var(--text3)", fontStyle: "italic" }}>
            Recipes sorted by craft advantage · Average outputs labeled · Seed ingredient (1× output) is included in cost — excluded when you own enough
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <input className="si" placeholder="Search forge recipes..." value={searchForge} onChange={e => setSearchForge(e.target.value)} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {subcats.map(sc => (
                <button key={sc} onClick={() => setMatSubcat(sc)}
                  style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "4px 10px", borderRadius: 3, cursor: "pointer",
                    border: matSubcat === sc ? "1px solid var(--gold)" : "1px solid var(--border)",
                    background: matSubcat === sc ? "rgba(200,150,42,.1)" : "transparent",
                    color: matSubcat === sc ? "var(--gold2)" : "var(--text3)" }}>
                  {sc}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 && (
            <div className="empty">No recipes found. Some items may not have TP prices yet.</div>
          )}

          {filteredItems.map(item => (
            <ForgeRecipeCard key={item.id} item={item} itemMap={itemMap} priceMap={priceMap}
              ownedMap={ownedMap} spiritShards={spiritShards}
              trendSummary={trendSummary} velocitySummary={velocitySummary}
              forgeRecipeMap={forgeRecipeMap} />
          ))}
        </div>
      )}

      {/* ── Mystic Clover ── */}
      {subTab === "mysticclover" && (() => {
        const cloverPrice = priceMap[19675];
        const cloverSell  = cloverPrice?.sells?.unit_price || 0;
        const cloverSellNet = Math.floor(cloverSell * 0.85);
        const cloverBuy   = cloverPrice?.buys?.unit_price  || 0;
        const cloverItem  = itemMap[19675];

        // ── Guaranteed recipe cost calculation ──
        const g = MYSTIC_CLOVER_RECIPES.guaranteed;
        const coinSell   = priceMap[19976]?.sells?.unit_price || 0;
        const ectoSell   = priceMap[19721]?.sells?.unit_price || 0;
        // Obsidian Shard: use cheapest acquisition (volatile/unbound/karma/TP)
        const obsidianSell = priceMap[19925]?.sells?.unit_price || 0;
        const obsidianKarmaGold = 96; // 100 Volatile/Unbound Magic + 96c per shard
        const obsidianCostPer = obsidianKarmaGold; // always use magic+gold path, cheaper than TP typically
        const guaranteedGoldCost = (coinSell * 3) + (obsidianCostPer * 3) + (ectoSell * 5);
        const guaranteedProfit   = cloverSellNet - guaranteedGoldCost;
        // Weekly cap value
        const weeklyCap = g.weeklyLimit; // 10
        const weeklyGoldCost  = guaranteedGoldCost * weeklyCap;
        const weeklyNetRevenue = cloverSellNet * weeklyCap;
        const weeklyProfit    = guaranteedProfit * weeklyCap;

        // ── Random recipe cost calculation ──
        const r = MYSTIC_CLOVER_RECIPES.random;
        // Philosopher's Stone: 10 for 1 Spirit Shard — treat as 0 gold (shard currency)
        const randomGoldCost = (coinSell * 10) + (obsidianCostPer * 10) + (ectoSell * 10);
        // Expected 1.33 clovers per attempt
        const randomGoldPerClover = randomGoldCost / 1.33;
        const randomProfitPerAttempt = (cloverSellNet * 1.33) - randomGoldCost;

        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text3)", fontStyle: "italic", lineHeight: 1.7 }}>
              Mystic Clovers are required for every legendary — they're always the biggest cost bottleneck.
              The guaranteed method is weekly-capped but costs Spirit Shards. The random forge has no cap.
            </div>

            {/* Clover price header */}
            {cloverItem && (
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 6, marginBottom: 20 }}>
                {cloverItem.icon
                  ? <img src={cloverItem.icon} style={{ width: 40, height: 40, borderRadius: 4, border: "1px solid var(--border2)" }} alt="" />
                  : <div style={{ width: 40, height: 40, background: "var(--bg4)", borderRadius: 4 }} />
                }
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#9f4dff" }}>Mystic Clover</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Required for all legendary items · 77 per weapon typically</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 24 }}>
                  <div className="stat-cell" style={{ textAlign: "right" }}>
                    <span className="stat-lbl">TP SELL (net)</span>
                    <Gold v={cloverSellNet} size={16} />
                    {cloverSell > 0 && <div style={{ fontSize: 11, color: "var(--text3)" }}><Gold v={cloverSell} size={11} /> before tax</div>}
                  </div>
                  <div className="stat-cell" style={{ textAlign: "right" }}>
                    <span className="stat-lbl">BUY ORDER</span>
                    <Gold v={cloverBuy} size={16} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Guaranteed Method ── */}
            <div className="ci" style={{ marginBottom: 12 }}>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(60,160,60,0.15)", border: "2px solid var(--green2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    ✓
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--green2)", marginBottom: 4 }}>
                      Guaranteed Method — 1 clover per craft
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.6 }}>
                      Purchase from <strong style={{ color: "var(--text2)" }}>Miyani</strong> at Trader's Forum or Memory of Old Lion's Arch.
                      Costs <strong style={{ color: "#7ab4d4" }}>3 Spirit Shards</strong> + gold ingredients per clover.
                      <span style={{ marginLeft: 8, padding: "1px 8px", borderRadius: 3, background: "rgba(200,150,42,0.12)", border: "1px solid rgba(200,150,42,0.35)", color: "var(--gold2)", fontSize: 11, fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
                        LIMIT {weeklyCap}/WEEK
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", flexShrink: 0 }}>
                    <div className="stat-cell" style={{ textAlign: "right" }}>
                      <span className="stat-lbl">GOLD COST/CLOVER</span>
                      {guaranteedGoldCost > 0
                        ? <Gold v={guaranteedGoldCost} size={14} />
                        : <span style={{ color: "var(--text3)", fontSize: 12 }}>no price data</span>}
                    </div>
                    <div className="stat-cell" style={{ textAlign: "right" }}>
                      <span className="stat-lbl">SPIRIT SHARDS</span>
                      <span style={{ fontSize: 14, color: "var(--blue2)", fontWeight: 600 }}>
                        🔮 3 / clover
                      </span>
                    </div>
                    <div className="stat-cell" style={{ textAlign: "right" }}>
                      <span className="stat-lbl">VS BUYING ON TP</span>
                      {cloverSell > 0 && guaranteedGoldCost > 0
                        ? <span className={guaranteedGoldCost <= cloverSell ? "pp" : "pn"}>
                            {guaranteedGoldCost <= cloverSell ? "✓ Cheaper to craft" : "Cheaper to buy"}
                          </span>
                        : <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>}
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bg2)", borderRadius: 4, border: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "Cinzel,serif", fontSize: 10, letterSpacing: 2, color: "var(--text3)", marginBottom: 8 }}>INGREDIENTS PER CLOVER</div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                    {/* Spirit Shards */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                      <span style={{ fontSize: 16 }}>🔮</span>
                      <span style={{ color: "var(--blue2)", fontWeight: 600 }}>3× Spirit Shard</span>
                      <span style={{ fontSize: 11, color: "var(--text3)", background: "rgba(90,160,210,.12)", border: "1px solid rgba(90,160,210,.3)", padding: "1px 6px", borderRadius: 3 }}>currency</span>
                    </div>
                    {/* Mystic Coin */}
                    {(() => { const item = itemMap[19976]; const price = priceMap[19976]?.sells?.unit_price || 0; return (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                        {item?.icon && <img src={item.icon} style={{ width: 22, height: 22, borderRadius: 2, border: "1px solid var(--border2)" }} alt="" />}
                        <span style={{ color: "var(--text2)" }}>3× Mystic Coin</span>
                        {price > 0 && <Gold v={price * 3} size={12} />}
                      </div>
                    ); })()}
                    {/* Obsidian Shard */}
                    {(() => { const item = itemMap[19925]; return (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                        {item?.icon && <img src={item.icon} style={{ width: 22, height: 22, borderRadius: 2, border: "1px solid var(--border2)" }} alt="" />}
                        <span style={{ color: "var(--text2)" }}>3× Obsidian Shard</span>
                        <span style={{ fontSize: 11, color: "#9855c8", background: "rgba(152,85,200,.12)", border: "1px solid rgba(152,85,200,.3)", padding: "1px 6px", borderRadius: 3 }}>
                          🔮 Karma / Magic
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>({obsidianCostPer * 3}c)</span>
                      </div>
                    ); })()}
                    {/* Glob of Ectoplasm */}
                    {(() => { const item = itemMap[19721]; const price = priceMap[19721]?.sells?.unit_price || 0; return (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                        {item?.icon && <img src={item.icon} style={{ width: 22, height: 22, borderRadius: 2, border: "1px solid var(--border2)" }} alt="" />}
                        <span style={{ color: "var(--text2)" }}>5× Glob of Ectoplasm</span>
                        {price > 0 && <Gold v={price * 5} size={12} />}
                      </div>
                    ); })()}
                  </div>
                </div>

                {/* Weekly summary */}
                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(60,160,60,0.05)", border: "1px solid rgba(60,160,60,0.2)", borderRadius: 4, display: "flex", gap: 32, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: "Cinzel,serif", fontSize: 10, letterSpacing: 1, color: "var(--green)", width: "100%", marginBottom: 4 }}>
                    WEEKLY CAP SUMMARY — {weeklyCap} CLOVERS / WEEK
                  </div>
                  <div className="stat-cell">
                    <span className="stat-lbl">TOTAL GOLD COST</span>
                    {weeklyGoldCost > 0 ? <Gold v={weeklyGoldCost} size={14} /> : <span style={{ color: "var(--text3)" }}>—</span>}
                  </div>
                  <div className="stat-cell">
                    <span className="stat-lbl">TOTAL SPIRIT SHARDS</span>
                    <span style={{ fontSize: 14, color: "var(--blue2)", fontWeight: 600 }}>🔮 {weeklyCap * 3}</span>
                  </div>
                  <div className="stat-cell">
                    <span className="stat-lbl">SELL VALUE (net)</span>
                    {weeklyNetRevenue > 0 ? <Gold v={weeklyNetRevenue} size={14} /> : <span style={{ color: "var(--text3)" }}>—</span>}
                  </div>
                  <div className="stat-cell">
                    <span className="stat-lbl">GOLD PROFIT</span>
                    {weeklyProfit !== 0 && weeklyGoldCost > 0
                      ? <span className={weeklyProfit >= 0 ? "pp" : "pn"}>{weeklyProfit >= 0 ? "+" : ""}<Gold v={weeklyProfit} size={14} /></span>
                      : <span style={{ color: "var(--text3)" }}>—</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Random Forge Method ── */}
            <div className="ci" style={{ marginBottom: 12 }}>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(200,150,42,0.12)", border: "2px solid var(--gold2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    🎲
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gold2)", marginBottom: 4 }}>
                      Random Mystic Forge — ~1.33 clovers / attempt
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.6 }}>
                      No weekly cap. Output is random — each attempt yields either <strong style={{ color: "#9f4dff" }}>10 Mystic Clovers</strong> or
                      {" "}<strong style={{ color: "var(--red)" }}>10 T6 fine materials</strong> (roughly 1-in-3 gives clovers).
                      Expected average: 1.33 clovers per attempt.
                      Costs <strong style={{ color: "#7ab4d4" }}>1 Spirit Shard</strong> (via 10 Philosopher's Stones) per attempt.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", flexShrink: 0 }}>
                    <div className="stat-cell" style={{ textAlign: "right" }}>
                      <span className="stat-lbl">GOLD COST/ATTEMPT</span>
                      {randomGoldCost > 0
                        ? <Gold v={randomGoldCost} size={14} />
                        : <span style={{ color: "var(--text3)", fontSize: 12 }}>no price data</span>}
                    </div>
                    <div className="stat-cell" style={{ textAlign: "right" }}>
                      <span className="stat-lbl">GOLD/CLOVER (avg)</span>
                      {randomGoldPerClover > 0
                        ? <Gold v={Math.round(randomGoldPerClover)} size={14} />
                        : <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>}
                    </div>
                    <div className="stat-cell" style={{ textAlign: "right" }}>
                      <span className="stat-lbl">VS GUARANTEED</span>
                      {guaranteedGoldCost > 0 && randomGoldPerClover > 0
                        ? <span className={randomGoldPerClover <= guaranteedGoldCost ? "pp" : "pn"}>
                            {randomGoldPerClover <= guaranteedGoldCost ? "✓ Cheaper avg" : `+${Math.round(randomGoldPerClover - guaranteedGoldCost)}c/clover`}
                          </span>
                        : <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>}
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bg2)", borderRadius: 4, border: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "Cinzel,serif", fontSize: 10, letterSpacing: 2, color: "var(--text3)", marginBottom: 8 }}>INGREDIENTS PER ATTEMPT</div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                    {(() => { const item = itemMap[19976]; const price = priceMap[19976]?.sells?.unit_price || 0; return (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                        {item?.icon && <img src={item.icon} style={{ width: 22, height: 22, borderRadius: 2, border: "1px solid var(--border2)" }} alt="" />}
                        <span style={{ color: "var(--text2)" }}>10× Mystic Coin</span>
                        {price > 0 && <Gold v={price * 10} size={12} />}
                      </div>
                    ); })()}
                    {(() => { const item = itemMap[19925]; return (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                        {item?.icon && <img src={item.icon} style={{ width: 22, height: 22, borderRadius: 2, border: "1px solid var(--border2)" }} alt="" />}
                        <span style={{ color: "var(--text2)" }}>10× Obsidian Shard</span>
                        <span style={{ fontSize: 11, color: "#9855c8", background: "rgba(152,85,200,.12)", border: "1px solid rgba(152,85,200,.3)", padding: "1px 6px", borderRadius: 3 }}>🔮 Karma</span>
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>({obsidianCostPer * 10}c)</span>
                      </div>
                    ); })()}
                    {(() => { const item = itemMap[19721]; const price = priceMap[19721]?.sells?.unit_price || 0; return (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                        {item?.icon && <img src={item.icon} style={{ width: 22, height: 22, borderRadius: 2, border: "1px solid var(--border2)" }} alt="" />}
                        <span style={{ color: "var(--text2)" }}>10× Glob of Ectoplasm</span>
                        {price > 0 && <Gold v={price * 10} size={12} />}
                      </div>
                    ); })()}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                      <span style={{ fontSize: 16 }}>🔮</span>
                      <span style={{ color: "var(--text2)" }}>10× Philosopher's Stone</span>
                      <span style={{ fontSize: 11, color: "var(--blue2)", background: "rgba(90,160,210,.12)", border: "1px solid rgba(90,160,210,.3)", padding: "1px 6px", borderRadius: 3 }}>1 Spirit Shard</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(200,150,42,.06)", borderRadius: 4, border: "1px solid rgba(200,150,42,.2)", fontSize: 12, color: "var(--text3)" }}>
                  ⚠ Output is <strong style={{ color: "var(--gold2)" }}>random</strong>. Each attempt: ~33% chance of 10 Mystic Clovers, ~67% chance of 10 T6 materials.
                  The 1.33 average is over many attempts — short runs can be very unlucky.
                  Use the guaranteed method weekly first, then random forge for the remainder.
                </div>
              </div>
            </div>

            {/* Guidance footer */}
            <div style={{ marginTop: 8, padding: "12px 16px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 5, fontSize: 13, color: "var(--text3)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--gold2)", fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: 1 }}>CLOVER STRATEGY</strong><br />
              1. Do the <span style={{ color: "var(--green2)" }}>guaranteed method</span> every week (10/week cap). At 3 Spirit Shards each, 77 clovers costs 231 Spirit Shards over ~8 weeks.<br />
              2. Use the <span style={{ color: "var(--gold2)" }}>random forge</span> to top up without a cap — best when Spirit Shards are plentiful or you're in a hurry.
            </div>
          </div>
        );
      })()}

      {/* ── Miniatures ── */}
      {subTab === "miniatures" && (
        <div>
          <div style={{ marginBottom: 14, fontSize: 13, color: "var(--text3)", lineHeight: 1.7 }}>
            Miniature promotion uses 4× minis of one tier to produce 1× <strong>random</strong> mini of the next tier.
            The output is random — you cannot target a specific miniature. Best used to convert excess commons into uncommons/rares for resale.
          </div>

          {/* Promotion recipes */}
          {MINIATURE_PROMOTION_RECIPES.map(recipe => {
            // Find average sell price of minis in output tier from priceMap
            const tierRarity = recipe.outputTier === 'Uncommon' ? 'Fine' : recipe.outputTier === 'Rare' ? 'Rare' : 'Basic';
            // Collect all miniature prices from itemMap + priceMap for this tier
            const miniPrices = Object.entries(itemMap)
              .filter(([id, item]) => item?.name?.startsWith('Miniature ') && item?.rarity === tierRarity)
              .map(([id]) => priceMap[Number(id)]?.sells?.unit_price || 0)
              .filter(p => p > 0);
            const avgOutputPrice = miniPrices.length > 0
              ? Math.round(miniPrices.reduce((s, p) => s + p, 0) / miniPrices.length)
              : 0;
            const avgOutputNet = Math.floor(avgOutputPrice * 0.85);

            // Average input cost — average common/uncommon mini sell price × 4
            const inputTierRarity = recipe.outputTier === 'Uncommon' ? 'Basic' : 'Fine';
            const inputPrices = Object.entries(itemMap)
              .filter(([id, item]) => item?.name?.startsWith('Miniature ') && item?.rarity === inputTierRarity)
              .map(([id]) => priceMap[Number(id)]?.sells?.unit_price || 0)
              .filter(p => p > 0);
            const avgInputPrice = inputPrices.length > 0
              ? Math.round(inputPrices.reduce((s, p) => s + p, 0) / inputPrices.length)
              : 0;
            const totalInputCost = avgInputPrice * 4;
            const avgProfit = avgOutputNet - totalInputCost;

            return (
              <div key={recipe.id} className="ci" style={{ marginBottom: 8 }}>
                <div style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: recipe.outputTier === 'Rare' ? "rgba(252,208,11,.15)" : "rgba(98,164,218,.15)", border: `2px solid ${recipe.outputTier === 'Rare' ? "#fcd00b" : "#62a4da"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                      🪆
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: recipe.outputTier === 'Rare' ? "#fcd00b" : "#62a4da", marginBottom: 4 }}>
                        {recipe.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>{recipe.description}</div>
                    </div>
                    <div style={{ display: "flex", gap: 20, alignItems: "center", flexShrink: 0 }}>
                      <div className="stat-cell" style={{ textAlign: "right" }}>
                        <span className="stat-lbl">AVG INPUT COST (×4)</span>
                        {avgInputPrice > 0
                          ? <Gold v={totalInputCost} size={13} />
                          : <span style={{ color: "var(--text3)", fontSize: 12 }}>no data</span>}
                        {inputPrices.length > 0 && <span style={{ fontSize: 10, color: "var(--text3)" }}>{inputPrices.length} minis sampled</span>}
                      </div>
                      <div className="stat-cell" style={{ textAlign: "right" }}>
                        <span className="stat-lbl">AVG OUTPUT (net)</span>
                        {avgOutputPrice > 0
                          ? <Gold v={avgOutputNet} size={13} />
                          : <span style={{ color: "var(--text3)", fontSize: 12 }}>no data</span>}
                        {miniPrices.length > 0 && <span style={{ fontSize: 10, color: "var(--text3)" }}>{miniPrices.length} minis sampled</span>}
                      </div>
                      <div className="stat-cell" style={{ textAlign: "right" }}>
                        <span className="stat-lbl">AVG PROFIT</span>
                        {avgOutputPrice > 0 && avgInputPrice > 0
                          ? <span className={avgProfit >= 0 ? "pp" : "pn"}>{avgProfit >= 0 ? "+" : ""}<Gold v={avgProfit} size={14} /></span>
                          : <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(200,150,42,.06)", borderRadius: 4, border: "1px solid rgba(200,150,42,.2)", fontSize: 12, color: "var(--text3)" }}>
                    ⚠ Output is <strong style={{ color: "var(--gold2)" }}>random</strong> — profit shown is the average across all {recipe.outputTier.toLowerCase()} miniatures.
                    Individual rare minis vary widely in price. This is a speculation play, not guaranteed profit.
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 5, fontSize: 13, color: "var(--text3)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--gold2)", fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: 1 }}>TIPS</strong><br />
            • Average profit is calculated from current TP prices of all minis in that rarity tier.<br />
            • Uncommon minis = Fine rarity (blue), Rare minis = Rare rarity (yellow).<br />
            • The best mini promotion strategy is to buy cheap commons in bulk and promote when rare minis are expensive.<br />
            • Check individual rare mini prices before promoting — some are worth 10× more than others.
          </div>
        </div>
      )}

      {/* ── Equipment ── */}
      {subTab === "equipment" && (
        <div>
          {/* Generic input section */}
          <div style={{ fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: 2, color: "var(--gold2)", marginBottom: 10, marginTop: 4 }}>
            GENERIC INPUT RECIPES — REFERENCE ONLY
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12, fontStyle: "italic" }}>
            These recipes require any exotic weapon of the specified type. No cost calculation shown.
          </div>
          {EQUIPMENT_RECIPES_GENERIC.map(r => (
            <EquipmentRefCard key={r.id} recipe={r} itemMap={itemMap} priceMap={priceMap} ownedMap={ownedMap} spiritShards={spiritShards} />
          ))}

          {/* Standard recipes */}
          <div style={{ fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: 2, color: "var(--gold2)", marginBottom: 10, marginTop: 20 }}>
            EXOTIC WEAPONS — ELDRITCH SCROLL RECIPES
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12, fontStyle: "italic" }}>
            Eldritch Scroll costs 50 Spirit Shards from Miyani — shown as 0g if you have enough.
          </div>
          {EQUIPMENT_RECIPES_STANDARD.map(r => (
            <EquipmentRefCard key={r.id} recipe={r} itemMap={itemMap} priceMap={priceMap} ownedMap={ownedMap} spiritShards={spiritShards} />
          ))}

          {/* Trinkets */}
          <div style={{ fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: 2, color: "var(--gold2)", marginBottom: 10, marginTop: 20 }}>
            TRINKETS
          </div>
          {EQUIPMENT_RECIPES_TRINKETS.map(r => (
            <EquipmentRefCard key={r.id} recipe={r} itemMap={itemMap} priceMap={priceMap} ownedMap={ownedMap} spiritShards={spiritShards} />
          ))}
        </div>
      )}

      {/* ── Legendary Weapons ── */}
      {subTab === "legendary" && (
        <div>
          <div style={{ marginBottom: 14, fontSize: 13, color: "var(--text3)", fontStyle: "italic", lineHeight: 1.6 }}>
            Full ingredient chains for Gen 1 Legendary weapons. Missing cost is cumulative — each ingredient
            shows the total gold needed for it and all its sub-components you don't own.
            Account-bound steps (WvW, Map Completion, Hero Points) show no gold cost.
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap" }}>
            <input className="si" placeholder="Search legendaries..." value={searchLegendary}
              onChange={e => setSearchLegendary(e.target.value)} />
          </div>

          {/* Generation filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--text3)", marginRight: 4 }}>GENERATION:</span>
            {["All", "1", "2", "3"].map(g => (
              <button key={g} onClick={() => { setLegendaryGen(g); setLegendaryExpansion("All"); }}
                style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "4px 12px",
                  borderRadius: 3, cursor: "pointer",
                  border: legendaryGen === g ? "1px solid #9f4dff" : "1px solid var(--border)",
                  background: legendaryGen === g ? "rgba(159,77,255,.12)" : "transparent",
                  color: legendaryGen === g ? "#9f4dff" : "var(--text3)" }}>
                {g === "All" ? "All" : `Gen ${g}`}
              </button>
            ))}
            {(legendaryGen === "2" || legendaryGen === "3") && (
              <>
                <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--text3)", marginLeft: 12, marginRight: 4 }}>EXPANSION:</span>
                {(legendaryGen === "2" ? LEGENDARY_GEN2_EXPANSIONS : LEGENDARY_GEN3_EXPANSIONS).map(exp => (
                  <button key={exp} onClick={() => setLegendaryExpansion(exp)}
                    style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "4px 10px",
                      borderRadius: 3, cursor: "pointer",
                      border: legendaryExpansion === exp ? "1px solid var(--gold2)" : "1px solid var(--border)",
                      background: legendaryExpansion === exp ? "rgba(200,150,42,.1)" : "transparent",
                      color: legendaryExpansion === exp ? "var(--gold2)" : "var(--text3)" }}>
                    {exp}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Weapon type filter */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            {LEGENDARY_WEAPON_TYPES.map(wt => (
              <button key={wt} onClick={() => setLegendaryWeaponType(wt)}
                style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "4px 10px",
                  borderRadius: 3, cursor: "pointer",
                  border: legendaryWeaponType === wt ? "1px solid #9f4dff" : "1px solid var(--border)",
                  background: legendaryWeaponType === wt ? "rgba(159,77,255,.12)" : "transparent",
                  color: legendaryWeaponType === wt ? "#9f4dff" : "var(--text3)" }}>
                {wt}
              </button>
            ))}
          </div>

          {/* Recipe list */}
          {resolvedLegendaryRecipes
            .filter(r => legendaryGen === "All" || String(r.generation) === legendaryGen)
            .filter(r => legendaryExpansion === "All" || r.expansion === legendaryExpansion)
            .filter(r => legendaryWeaponType === "All" || r.weaponType === legendaryWeaponType)
            .filter(r => !searchLegendary || r.name.toLowerCase().includes(searchLegendary.toLowerCase()))
            .map(recipe => (
              <LegendaryRecipeCard
                key={recipe.id}
                recipe={recipe}
                itemMap={itemMap}
                priceMap={priceMap}
                ownedMap={ownedMap}
              />
            ))
          }
        </div>
      )}

      {/* ── Legendary Armor ── */}
      {subTab === "armor" && (
        <div>
          <div style={{ marginBottom: 14, fontSize: 13, color: "var(--text3)", fontStyle: "italic", lineHeight: 1.6 }}>
            Legendary armor allows free stat-swapping. Gen 1 (PvE) requires Mystic Forge crafting.
            Gen 2 (WvW) requires WvW reward track progression. Gen 3 (Raids) requires Envoy collections.
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--text3)" }}>GEN:</span>
              {ARMOR_GENERATIONS.map(g => (
                <button key={g} onClick={() => setArmorGenFilter(g)}
                  style={{ fontSize: 10, fontFamily: "Cinzel,serif", padding: "3px 8px", borderRadius: 3, cursor: "pointer",
                    border: armorGenFilter === g ? "1px solid #9f4dff" : "1px solid var(--border)",
                    background: armorGenFilter === g ? "rgba(159,77,255,.12)" : "transparent",
                    color: armorGenFilter === g ? "#9f4dff" : "var(--text3)" }}>
                  {g}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--text3)" }}>WEIGHT:</span>
              {ARMOR_WEIGHT_CLASSES.map(w => (
                <button key={w} onClick={() => setArmorWeightFilter(w)}
                  style={{ fontSize: 10, fontFamily: "Cinzel,serif", padding: "3px 8px", borderRadius: 3, cursor: "pointer",
                    border: armorWeightFilter === w ? "1px solid var(--gold2)" : "1px solid var(--border)",
                    background: armorWeightFilter === w ? "rgba(200,150,42,.1)" : "transparent",
                    color: armorWeightFilter === w ? "var(--gold2)" : "var(--text3)" }}>
                  {w}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--text3)" }}>SLOT:</span>
              {ARMOR_SLOTS_LIST.map(s => (
                <button key={s} onClick={() => setArmorSlotFilter(s)}
                  style={{ fontSize: 10, fontFamily: "Cinzel,serif", padding: "3px 8px", borderRadius: 3, cursor: "pointer",
                    border: armorSlotFilter === s ? "1px solid var(--blue2)" : "1px solid var(--border)",
                    background: armorSlotFilter === s ? "rgba(90,160,210,.12)" : "transparent",
                    color: armorSlotFilter === s ? "var(--blue2)" : "var(--text3)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {resolvedArmorRecipes
            .filter(r => armorGenFilter === "All" || String(r.generation) === armorGenFilter.charAt(0))
            .filter(r => armorWeightFilter === "All" || r.weightClass === armorWeightFilter)
            .filter(r => armorSlotFilter === "All" || r.armorSlot === armorSlotFilter)
            .map(recipe => (
              <LegendaryRecipeCard key={recipe.id} recipe={recipe} itemMap={itemMap} priceMap={priceMap} ownedMap={ownedMap} legendaryAchievements={legendaryAchievements} />
            ))
          }
        </div>
      )}

      {/* ── Back Items / Trinkets / Other ── */}
      {subTab === "other" && (
        <div>
          <div style={{ marginBottom: 14, fontSize: 13, color: "var(--text3)", fontStyle: "italic" }}>
            Legendary back items, trinkets, relics, runes, and sigils. Most are fully account-bound collection paths.
          </div>

          {/* Category filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
            {LEGENDARY_OTHER_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setOtherCategoryFilter(cat)}
                style={{ fontSize: 11, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "5px 14px", borderRadius: 4, cursor: "pointer",
                  border: otherCategoryFilter === cat ? "1px solid #9f4dff" : "1px solid var(--border)",
                  background: otherCategoryFilter === cat ? "rgba(159,77,255,.12)" : "transparent",
                  color: otherCategoryFilter === cat ? "#9f4dff" : "var(--text3)" }}>
                {cat}
              </button>
            ))}
          </div>

          {(() => {
            const categoryMap = {
              "Back Items": resolvedOtherRecipes.backItems,
              "Trinkets":   resolvedOtherRecipes.trinkets,
              "Relics":     resolvedOtherRecipes.relics,
              "Runes":      resolvedOtherRecipes.runes,
              "Sigils":     resolvedOtherRecipes.sigils,
            };
            const recipes = categoryMap[otherCategoryFilter] || [];
            if (recipes.length === 0) return <div className="empty">No items in this category.</div>;
            return recipes.map(recipe => (
              <LegendaryRecipeCard key={recipe.id} recipe={recipe} itemMap={itemMap} priceMap={priceMap} ownedMap={ownedMap} legendaryAchievements={legendaryAchievements} />
            ));
          })()}
        </div>
      )}
    </div>
  );
}
