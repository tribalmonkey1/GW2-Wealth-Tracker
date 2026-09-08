# App.jsx integration (3 small edits — nothing else changes)

## 1. Add the import, alongside your other `./lib/...` imports:

```js
import { useBossAlerts } from "./lib/useBossAlerts.js";
```

## 2. Mount the hook once, near your other top-level hooks (anywhere before
   the `timeGatedTabProps` useMemo is fine — e.g. right after the
   `friendFilter` state block):

```js
const bossAlerts = useBossAlerts(); // global — fires alerts regardless of active tab
```

## 3. Pass it into `timeGatedTabProps`:

```diff
 const timeGatedTabProps = useMemo(() => ({
     data, cacheRef, dailyCrafted, manualDailyCrafted, mySoldHistory,
     resetCountdown, weeklyKeyDone, setWeeklyKeyDone, extraDailyItems,
+    bossAlerts,
-  }), [data, dailyCrafted, manualDailyCrafted, mySoldHistory, resetCountdown, weeklyKeyDone, extraDailyItems]);
+  }), [data, dailyCrafted, manualDailyCrafted, mySoldHistory, resetCountdown, weeklyKeyDone, extraDailyItems, bossAlerts]);
```

That's it. `useBossAlerts` is self-contained — it loads its own prefs, runs
its own 1-second tick, and returns a memoized object (won't cause extra
re-renders of anything else in App.jsx).
