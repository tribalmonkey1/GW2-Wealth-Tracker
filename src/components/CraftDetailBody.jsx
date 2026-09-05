/**
 * CraftDetailBody renders the full expanded card contents for a craft item —
 * ingredient tree (with intermediary crafting sub-trees), buy-order savings,
 * your active TP listings for the output, the "selling mats beats crafting"
 * warning, and the cheapest-acquisition path for missing materials.
 *
 * Shared by the Crafting Profits tab AND the Recommended tab, so a card for
 * the same recipe looks identical whether opened from its discipline tab or
 * from Recommended.
 * (Split out of App.jsx.)
 */
import React from "react";
import { Gold } from "./Gold.jsx";
import { VENDOR_PRICES } from "../lib/vendorPrices.js";
import { getRecipeDisciplines, checkFulfillment } from "../lib/craftingCalc.js";

export const forgeableOutputIds = new Set([
  19739,19741,19743,19748,19745, // wool/cotton/linen/silk/gossamer scrap
  19728,19730,19731,19729,19732, // leather sections thin-hardened
  19699,19698,19702,19700,19701, // iron/gold/platinum/mithril/orichalcum ore
  19726,19727,19724,19722,19725, // soft/seasoned/hard/elder/ancient wood log
  19740,19742,19744,19747,19746, // bolts wool-gossamer
  19733,19734,19736,19735,19737, // cured leather squares
  19687,19683,19682,19688,19686,19684,19685, // silver/iron/gold/steel/platinum/mithril/orichalcum ingot
  19713,19714,19711,19709,19712, // soft/seasoned/hard/elder/ancient wood plank
  24273,24274,24275,24276,24277, // shimmering-crystalline dust
  24343,24344,24345,24341,24358, // bone shard/bone/heavy bone/large bone/ancient bone
  24347,24348,24349,24350,24351, // small-vicious claw
  24353,24354,24355,24356,24357, // small-vicious fang
  24285,24286,24287,24288,24289, // small-armored scale
]);

export function CraftDetailBody({ ci, itemMap, priceMap, ownedMap, resolvedRecipes, charInventoryByChar, charDisciplines, myListings, velocitySummary, setActiveTab }) {
  // Characters able to craft this recipe — any character with at least one of
  // the recipe's disciplines. Used to figure out which OTHER characters are
  // sitting on ingredients the crafter(s) don't have in their own bags.
  const recipeDiscs = getRecipeDisciplines(ci);
  const crafterNames = charDisciplines
    ? Object.entries(charDisciplines)
        .filter(([, discs]) => discs.some(d => recipeDiscs.includes(d)))
        .map(([name]) => name)
    : [];

  const findItemOnOtherChar = (itemId, needed) => {
    if (!charInventoryByChar) return null;
    const crafterHas = crafterNames.reduce((sum, n) => sum + (charInventoryByChar[n]?.[itemId] || 0), 0);
    if (crafterHas >= needed) return null; // crafters have enough, no note needed
    const others = Object.entries(charInventoryByChar)
      .filter(([name]) => !crafterNames.includes(name))
      .map(([name, inv]) => ({ name, count: inv[itemId] || 0 }))
      .filter(c => c.count > 0);
    if (others.length === 0) return null;
    return others;
  };

  const matDetailMap = Object.fromEntries(ci.matDetails.map(m => [m.itemId, m]));
  const renderNode = (node, depth = 0) => {
    const rows = [];
    for (const [idx, child] of node.children.entries()) {
      const item = itemMap[child.itemId];
      const isIntermediary = !child.isLeaf; // has a recipe (craftable intermediary)
      const m = matDetailMap[child.itemId]; // leaf status info if it's a base mat
      const owned = ownedMap?.[child.itemId] || 0;

      if (isIntermediary) {
        const canMakeIt = checkFulfillment(child.itemId, child.count, resolvedRecipes, ownedMap);
        const fulfilledFromOwned = owned >= child.count;
        const statusCol = fulfilledFromOwned ? "var(--green)" : canMakeIt.canFulfill ? "var(--gold)" : "var(--red)";
        const statusLabel = fulfilledFromOwned
          ? `✓ ${owned}`
          : canMakeIt.canFulfill
          ? owned > 0 ? `⚒ ${owned}/${child.count}` : `⚒ 0/${child.count} (craftable)`
          : owned > 0 ? `✗ ${owned}/${child.count}` : `✗ 0/${child.count}`;
        rows.push(
          <div key={`int-${child.itemId}-${depth}-${idx}`} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 10px",
            marginLeft: depth * 20,
            borderRadius: 3,
            background: depth === 0 ? "rgba(200,150,42,0.06)" : "rgba(200,150,42,0.03)",
            borderLeft: `2px solid rgba(200,150,42,${0.5 - depth * 0.15})`,
            marginBottom: 2,
          }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              {item?.icon && <img className="iico-sm" src={item.icon} alt="" />}
              <span className={`rar-${item?.rarity}`} style={{ fontWeight: 600 }}>{item?.name || `Item ${child.itemId}`}</span>
              {!fulfilledFromOwned && <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, color: canMakeIt.canFulfill ? "var(--gold2)" : "var(--red)", padding: "1px 6px", borderRadius: 2, border: `1px solid ${canMakeIt.canFulfill ? "rgba(200,150,42,0.4)" : "rgba(200,80,80,0.4)"}`, background: canMakeIt.canFulfill ? "rgba(200,150,42,0.1)" : "rgba(200,80,80,0.1)" }}>CRAFT</span>}
            </div>
            <span style={{ width: 60, color: "var(--text3)", fontSize: 14 }}>×{child.count}</span>
            <span style={{ width: 110, fontSize: 13, color: statusCol }}>{statusLabel}</span>
            <span style={{ width: 130 }} />
            <span style={{ width: 130 }} />
          </div>
        );
        // Only show sub-ingredients if we don't already have enough of this intermediary
        if (!fulfilledFromOwned) {
          rows.push(...renderNode(child, depth + 1));
        }
      } else {
        // Leaf: base material
        const effectiveNeeded = m ? m.needed : child.count;
        const effectiveStatus = m?.status ?? (owned >= child.count ? "have" : "mustBuy");
        const col = effectiveStatus === "have" ? "var(--green)" : effectiveStatus === "hasMaterials" ? "var(--gold)" : "var(--red)";
        const label = effectiveStatus === "have" ? `✓ ${owned}` : effectiveStatus === "hasMaterials" ? `⚒ ${owned}/${effectiveNeeded}` : `✗ ${owned}/${effectiveNeeded}`;
        const isMustBuy = effectiveStatus === "mustBuy";
        const shortage = Math.max(0, effectiveNeeded - owned);
        const onOther = shortage > 0 ? findItemOnOtherChar(child.itemId, child.count) : null;
        rows.push(
          <div key={`leaf-${child.itemId}-${depth}-${idx}`} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "6px 10px",
            marginLeft: depth * 20,
            borderRadius: 3,
            borderLeft: depth > 0 ? "2px solid rgba(255,255,255,0.05)" : "none",
            marginBottom: 1,
          }}
          className="r-row"
          >
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {item?.icon && <img className="iico-sm" src={item.icon} alt="" />}
              <span className={`rar-${item?.rarity}`}>{item?.name || `Item ${child.itemId}`}</span>
              {m?.vendorPrice && m?.tpSell > 0 && isMustBuy && m?.bestSource === "tp" && (
                <span className="src-tp">📊 TP cheaper than vendor</span>
              )}
              {isMustBuy && forgeableOutputIds.has(child.itemId) && (
                <span
                  title="This item can be made cheaper in the Mystic Forge — check the ⚗ Mystic Forge tab"
                  onClick={e => { e.stopPropagation(); setActiveTab("mysticforge"); }}
                  style={{ fontSize: 10, color: "#a060e0", background: "rgba(160,90,220,.15)", border: "1px solid rgba(160,90,220,.35)", borderRadius: 3, padding: "1px 6px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 0.5 }}>
                  ⚗ Mystic Forge
                </span>
              )}
              {onOther && onOther.map(c => (
                <span key={c.name} style={{ fontSize: 11, color: "var(--gold2)", background: "rgba(200,150,42,0.1)", border: "1px solid rgba(200,150,42,0.3)", borderRadius: 3, padding: "1px 6px", fontFamily: "Cinzel,serif", letterSpacing: 0.5 }}>
                  📦 {c.count} on {c.name}
                </span>
              ))}
            </div>
            <span style={{ width: 60, color: "var(--text3)", fontSize: 14 }}>×{child.count}</span>
            <span style={{ width: 110, fontSize: 13, color: col || "var(--text3)" }}>
              {label || `${owned}`}
              {m?.status === "hasMaterials" && <span style={{ fontSize: 11, marginLeft: 4, opacity: .7 }}>(craftable)</span>}
            </span>
            <span style={{ width: 130, textAlign: "right" }}>{isMustBuy && m?.bestBuyPrice ? <Gold v={m.bestBuyPrice} /> : <span style={{ color: "var(--text3)" }}>—</span>}</span>
            <span style={{ width: 130, textAlign: "right" }}>{isMustBuy && m?.bestBuyPrice ? <Gold v={m.bestBuyPrice * child.count} /> : <span style={{ color: "var(--text3)" }}>—</span>}</span>
          </div>
        );
      }
    }
    return rows;
  };

  return (
    <div className="ci-body">
      {/* Ingredient tree — shows intermediary crafts with sub-ingredients indented */}
      <div className="r-tree">
        <div className="r-hdr">
          <span style={{ flex: 1 }}>Ingredient</span>
          <span style={{ width: 60 }}>Need</span>
          <span style={{ width: 110 }}>Status</span>
          <span style={{ width: 130, textAlign: "right" }}>Unit Price</span>
          <span style={{ width: 130, textAlign: "right" }}>Total</span>
        </div>
        {ci.tree ? renderNode(ci.tree) : ci.matDetails.map(m => {
          // Fallback to flat list if no tree
          const item = itemMap[m.itemId];
          const col = m.status === "have" ? "var(--green)" : m.status === "hasMaterials" ? "var(--gold)" : "var(--red)";
          const label = m.status === "have" ? `✓ ${m.owned}` : m.status === "hasMaterials" ? `⚒ ${m.owned}/${m.needed}` : `✗ ${m.owned}/${m.needed}`;
          const isMustBuy = m.status === "mustBuy";
          return (
            <div key={m.itemId} className="r-row">
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                {item?.icon && <img className="iico-sm" src={item.icon} alt="" />}
                <span className={`rar-${m.rarity}`}>{m.name}</span>
              </div>
              <span style={{ width: 60, color: "var(--text3)", fontSize: 14 }}>×{m.needed}</span>
              <span style={{ width: 110, fontSize: 13, color: col }}>{label}</span>
              <span style={{ width: 130, textAlign: "right" }}>{isMustBuy ? <Gold v={m.bestBuyPrice} /> : <span style={{ color: "var(--text3)" }}>—</span>}</span>
              <span style={{ width: 130, textAlign: "right" }}>{isMustBuy ? <Gold v={m.bestBuyPrice * m.needed} /> : <span style={{ color: "var(--text3)" }}>—</span>}</span>
            </div>
          );
        })}
        <div className="r-row r-tot">
          <span style={{ flex: 1, fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: 1, color: "var(--text3)" }}>TOTAL MUST-BUY COST</span>
          <span style={{ width: 60 }} /><span style={{ width: 110 }} /><span style={{ width: 130 }} />
          <span style={{ width: 130, textAlign: "right", color: "var(--red)" }}><Gold v={ci.totalMustBuyCostSell} /></span>
        </div>
      </div>

      {/* Buy order suggestions: ingredients where placing a buy order saves gold ──
          Only shown for ingredients that need to be purchased AND have active buy fills */}
      {(() => {
        const mustBuyMats = ci.matDetails.filter(m => m.status === "mustBuy" && m.bestBuyPrice > 0);
        const suggestions = mustBuyMats.map(m => {
          const priceData = priceMap[m.itemId];
          const askPrice = priceData?.sells?.unit_price || m.bestBuyPrice;
          const bidPrice = priceData?.buys?.unit_price || 0;
          if (!bidPrice || bidPrice <= 0) return null;
          const savingPer = askPrice - bidPrice;
          const savingTotal = savingPer * m.needed;
          if (savingPer <= 1) return null; // no meaningful savings
          const vel = velocitySummary[m.itemId];
          const buyFills = vel?.observations >= 5 ? vel.buyFillsPerHr : null;
          if (buyFills != null && buyFills < 0.05) return null; // bids never get filled
          const savingPct = askPrice > 0 ? (savingPer / askPrice) * 100 : 0;
          if (savingPct < 2) return null; // less than 2% savings not worth mentioning
          return { ...m, askPrice, bidPrice, savingPer, savingTotal, savingPct, buyFills };
        }).filter(Boolean).sort((a,b) => b.savingTotal - a.savingTotal);

        if (suggestions.length === 0) return null;
        return (
          <div style={{ margin:"10px 0", padding:"10px 14px", borderRadius:4, background:"rgba(90,160,90,0.07)", border:"1px solid rgba(90,160,90,0.25)" }}>
            <div style={{ fontFamily:"Cinzel,serif", fontSize:11, letterSpacing:1, color:"var(--green)", marginBottom:8 }}>
              💡 BUY ORDER SAVINGS
              <span style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text3)", letterSpacing:0, marginLeft:8, fontStyle:"italic" }}>
                Place buy orders instead of buying at ask price:
              </span>
            </div>
            {suggestions.map(s => {
              const item = itemMap[s.itemId];
              return (
                <div key={s.itemId} style={{ display:"flex", alignItems:"center", gap:12, fontSize:13, padding:"4px 0", borderBottom:"1px solid rgba(90,160,90,0.12)" }}>
                  {item?.icon && <img className="iico-sm" src={item.icon} alt="" />}
                  <span style={{ flex:1, color:"var(--text2)" }}>{s.name} ×{s.needed}</span>
                  <span style={{ color:"var(--text3)", fontSize:12 }}>ask <Gold v={s.askPrice} size={12} /></span>
                  <span style={{ color:"var(--green2)", fontSize:12 }}>bid <Gold v={s.bidPrice} size={12} /></span>
                  <span style={{ color:"var(--green2)", fontWeight:600 }}>save <Gold v={s.savingTotal} size={12} /></span>
                  <span style={{ color:"var(--text3)", fontSize:11 }}>({s.savingPct.toFixed(1)}%)</span>
                  {s.buyFills != null && <span style={{ fontSize:11, color:"var(--text3)" }}>{s.buyFills.toFixed(2)} fills/hr</span>}
                </div>
              );
            })}
            <div style={{ marginTop:6, paddingTop:6, borderTop:"1px solid rgba(90,160,90,0.15)", fontSize:12, color:"var(--green2)" }}>
              Total potential savings: <Gold v={suggestions.reduce((s,x)=>s+x.savingTotal,0)} size={12} />
              <span style={{ color:"var(--text3)", marginLeft:8 }}>— buy orders may take time to fill</span>
            </div>
          </div>
        );
      })()}

      {/* My TP listings for this item */}
      {(() => {
        const listings = myListings[ci.outputId] || [];
        if (listings.length === 0) return null;
        const now = Date.now();
        return (
          <div style={{ margin: "12px 0", padding: "10px 14px", borderRadius: 4, background: "rgba(80,120,200,0.08)", border: "1px solid rgba(80,120,200,0.3)" }}>
            <div style={{ fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: 1, color: "#8aabee", marginBottom: 8 }}>🏪 YOUR TP LISTINGS</div>
            {listings.map((l, i) => {
              const listedMs = now - new Date(l.created).getTime();
              const listedDays = Math.floor(listedMs / 86400000);
              const listedHrs = Math.floor((listedMs % 86400000) / 3600000);
              const age = listedDays > 0 ? `${listedDays}d ${listedHrs}h ago` : `${listedHrs}h ago`;
              return (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13, padding: "3px 0", borderBottom: i < listings.length - 1 ? "1px solid rgba(80,120,200,0.15)" : "none" }}>
                  <span style={{ color: "var(--text2)" }}>×{l.quantity}</span>
                  <Gold v={l.price} size={13} />
                  <span style={{ color: "var(--text3)", fontSize: 12 }}>listed {age}</span>
                  {listedDays >= 7 && <span style={{ fontSize: 11, color: "var(--red)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>⚠ EXPIRING SOON</span>}
                </div>
              );
            })}
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(80,120,200,0.2)", fontSize: 12, color: "#8aabee" }}>
              {listings.reduce((s,l) => s+l.quantity, 0)} total listed · est. value <Gold v={listings.reduce((s,l) => s + Math.floor(l.price * l.quantity * 0.85), 0)} size={12} /> after tax
            </div>
          </div>
        );
      })()}

      {/* Best sell path — only itemize if selling mats beats crafting */}
      {ci.matSellPaths.length > 0 && ci.matSellNet > ci.profitNet && (
        <div className="sell-path">
          <div className="sell-path-lbl">⚠ SELLING MATS IS MORE PROFITABLE THAN CRAFTING</div>
          {ci.matSellPaths.map((p, i) => (
            <div key={i}>
              {(p.path || []).map((it, j) => (
                <div key={j} className="sell-path-item">
                  <span className={`rar-${itemMap[it.itemId]?.rarity}`}>{it.name} ×{it.count}</span>
                  <Gold v={Math.floor(it.sellPrice * it.count * 0.85)} size={13} />
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(200,150,42,.2)", fontWeight: 600 }}>
            <span style={{ fontSize: 12, color: "var(--gold)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>TOTAL</span>
            <Gold v={ci.matSellNet} />
          </div>
        </div>
      )}

      {/* Cheapest acquire path */}
      {!ci.canCraft && ci.cheapAcquire.path.filter(p => p.needed > 0).length > 0 && (
        <div className="cheap-path">
          <div className="cheap-path-lbl">CHEAPEST WAY TO ACQUIRE MISSING MATERIALS</div>
          {ci.cheapAcquire.path.filter(p => p.needed > 0 && (p.name || p.unitPrice > 0)).map((p, i) => {
            const displayName = itemMap[p.itemId]?.name || VENDOR_PRICES[p.itemId]?.name || p.name || `Item ${p.itemId}`;
            return (
              <div key={i} className="r-row" style={{ padding: "5px 0" }}>
                <span style={{ flex: 1, fontSize: 14, color: "var(--text2)" }}>{displayName} ×{p.needed}</span>
                {p.source === "tp" && <span className="src-tp">📊 TP</span>}
                {p.source === "owned" && <span className="src-owned">✓ owned</span>}
                {p.source === "vendor" && p.tpPrice > 0 && p.tpPrice < p.unitPrice && (
                  <span className="src-tp">📊 TP cheaper</span>
                )}
                <span style={{ marginLeft: 10, minWidth: 100, textAlign: "right" }}><Gold v={p.unitPrice * p.needed} size={14} /></span>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(90,160,90,.2)", fontWeight: 600 }}>
            <span style={{ fontSize: 12, color: "var(--green)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>TOTAL ACQUISITION COST</span>
            <Gold v={ci.cheapAcquire.cost} />
          </div>
        </div>
      )}
    </div>
  );
}
