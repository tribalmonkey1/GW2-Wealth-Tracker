/**
 * DRF (Drop Research Facilities) live feed — frontend half.
 *
 * Talks to the Rust commands in drf_client.rs (drf_connect/drf_disconnect) and
 * the events they emit (drf://drop, drf://status). Purely additive: if this
 * is never enabled, or the connection never succeeds, nothing here runs and
 * the app behaves exactly as it does today (GW2-API polling in App.jsx's
 * refreshPrices/doLiveUpdate is completely untouched).
 *
 * What a "drop" event patches, instantly, with no network round-trip:
 *   - data.goldCopper           (currency id 1 = Coin)
 *   - forgeWallet.{spirit_shards,volatile_magic,unbound_magic,karma,laurels}
 *   - cacheRef.current.ownedMap + data.materialRows (for any item DRF reports
 *     a change for that we already have itemMap/priceMap data for)
 *   - a debounced recompute of craftItems/byDisc (via the same worker path
 *     refreshPrices already uses) so canCraft/profit numbers catch up too,
 *     without recomputing on every single event in a farming burst.
 */
import { useEffect, useRef, useCallback, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { computeCraftItems } from "./storage.js";
import { CURRENCY_IDS } from "./characterData.js";

// Reverse of characterData.js's CURRENCY_IDS — GW2 wallet currency id -> the
// forgeWallet field MysticForgeTab's CurrencyBar already reads. Coin (id 1)
// is handled separately since it patches data.goldCopper, not the wallet.
const GOLD_CURRENCY_ID = 1;
const CURRENCY_ID_TO_WALLET_FIELD = Object.fromEntries(
  Object.entries(CURRENCY_IDS).map(([field, id]) => [id, field])
);

// Batches a burst of drop events (e.g. an AoE farm pull triggering many
// pickups in under a second) into one worker recompute instead of one per event.
const RECOMPUTE_DEBOUNCE_MS = 400;

export function useDrfLiveFeed({ cacheRef, setData, setForgeWallet, token, enabled }) {
  const [status, setStatus] = useState("disconnected"); // connecting | connected | reconnecting | disconnected | error
  const [statusDetail, setStatusDetail] = useState(null);
  const recomputeTimerRef = useRef(null);
  const pendingRecomputeRef = useRef(false);

  const scheduleRecompute = useCallback(() => {
    pendingRecomputeRef.current = true;
    if (recomputeTimerRef.current) return;
    recomputeTimerRef.current = setTimeout(async () => {
      recomputeTimerRef.current = null;
      if (!pendingRecomputeRef.current) return;
      pendingRecomputeRef.current = false;
      const { recipes, resolvedRecipes, itemMap, priceMap, ownedMap } = cacheRef.current || {};
      if (!recipes || !resolvedRecipes || !itemMap || !priceMap || !ownedMap) return;
      try {
        const result = await computeCraftItems(recipes, resolvedRecipes, itemMap, priceMap, ownedMap);
        if (result) {
          cacheRef.current.craftItems = result.craftItems;
          setData(prev => prev ? { ...prev, craftItems: result.craftItems, byDisc: result.byDisc } : prev);
        }
      } catch (e) {
        console.warn("[drf] post-drop recompute failed:", e);
      }
    }, RECOMPUTE_DEBOUNCE_MS);
  }, [cacheRef, setData]);

  const applyDrop = useCallback((evt) => {
    const itemMap = cacheRef.current?.itemMap;
    const priceMap = cacheRef.current?.priceMap;
    if (!cacheRef.current) return;
    if (!cacheRef.current.ownedMap) cacheRef.current.ownedMap = {};
    const ownedMap = cacheRef.current.ownedMap;

    let touchedAnyItem = false;
    const matRowPatches = {}; // itemId -> fresh materialRows row, only when we can fully resolve it

    for (const [idStr, delta] of Object.entries(evt.items || {})) {
      const id = Number(idStr);
      if (!delta) continue;
      // Clamped at 0 defensively — a delta arriving slightly out of order
      // relative to a fresh GW2-API ownedMap snapshot should never show a
      // negative count in the UI.
      const next = Math.max(0, (ownedMap[id] || 0) + delta);
      ownedMap[id] = next;
      touchedAnyItem = true;

      const item = itemMap?.[id];
      if (item) {
        const price = priceMap?.[id];
        const sp = price?.sells?.unit_price || 0;
        const spNet = Math.floor(sp * 0.85);
        matRowPatches[id] = {
          id, name: item.name || `Item ${id}`, icon: item.icon, rarity: item.rarity,
          count: next, sellPrice: sp, sellPriceNet: spNet,
          buyPrice: price?.buys?.unit_price || 0, totalValue: spNet * next,
        };
      }
      // else: item not in itemMap yet (brand-new pickup this session) — ownedMap
      // is still correct, materialRows just won't show it until the next normal
      // GW2 API refresh resolves its name/icon/price, same as any other new item.
    }

    let goldDelta = 0;
    const walletDeltas = {};
    for (const [idStr, delta] of Object.entries(evt.currencies || {})) {
      const id = Number(idStr);
      if (!delta) continue;
      if (id === GOLD_CURRENCY_ID) { goldDelta += delta; continue; }
      const field = CURRENCY_ID_TO_WALLET_FIELD[id];
      if (field) walletDeltas[field] = (walletDeltas[field] || 0) + delta;
      // Unrecognized currency ids (guild commendations, WvW tickets, etc.) are
      // silently ignored here — this feed only drives gold + the 5 Mystic
      // Forge wallet currencies; everything else stays GW2-API-sourced.
    }

    if (goldDelta !== 0 || Object.keys(matRowPatches).length > 0) {
      setData(prev => {
        if (!prev) return prev;
        let materialRows = prev.materialRows;
        let totalMaterialValue = prev.totalMaterialValue;
        if (Object.keys(matRowPatches).length > 0) {
          const byId = new Map(materialRows.map(r => [r.id, r]));
          for (const [idStr, patch] of Object.entries(matRowPatches)) byId.set(Number(idStr), patch);
          materialRows = [...byId.values()];
          totalMaterialValue = materialRows.reduce((s, r) => s + r.totalValue, 0);
        }
        return {
          ...prev,
          goldCopper: prev.goldCopper + goldDelta,
          materialRows,
          totalMaterialValue,
          ownedMap: { ...ownedMap }, // new reference so anything keyed on data.ownedMap re-renders
        };
      });
    }

    if (Object.keys(walletDeltas).length > 0) {
      setForgeWallet(prev => {
        const next = { ...prev };
        for (const [field, delta] of Object.entries(walletDeltas)) next[field] = (next[field] || 0) + delta;
        return next;
      });
    }

    if (touchedAnyItem) scheduleRecompute();
  }, [cacheRef, setData, setForgeWallet, scheduleRecompute]);

  useEffect(() => {
    if (!enabled || !token) {
      invoke("drf_disconnect").catch(() => {});
      setStatus("disconnected");
      setStatusDetail(null);
      return;
    }

    let cancelled = false;
    let unlistenDrop, unlistenStatus;

    (async () => {
      unlistenDrop = await listen("drf://drop", (e) => { if (!cancelled) applyDrop(e.payload); });
      unlistenStatus = await listen("drf://status", (e) => {
        if (cancelled) return;
        setStatus(e.payload.status);
        setStatusDetail(e.payload.detail || null);
      });
      try {
        await invoke("drf_connect", { token });
      } catch (e) {
        if (!cancelled) { setStatus("error"); setStatusDetail(String(e)); }
      }
    })();

    return () => {
      cancelled = true;
      unlistenDrop?.();
      unlistenStatus?.();
      invoke("drf_disconnect").catch(() => {});
    };
  }, [enabled, token, applyDrop]);

  return { status, statusDetail };
}
