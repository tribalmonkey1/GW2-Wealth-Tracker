/**
 * Waypoint copy-to-clipboard — mirrors the C# reference app's
 * BossTimerView.axaml.cs Cell_DoubleTapped handler: given a boss's
 * chatLink (a GW2 chat-code like "[&BKgBAAA=]"), copy it to the
 * clipboard so it can be pasted directly into the game's chat box as
 * a clickable waypoint link.
 *
 * navigator.clipboard.writeText requires a secure context (https or
 * localhost); the execCommand fallback covers older/non-secure
 * environments the same way a lot of copy buttons do.
 */
export async function copyWaypoint(chatLink) {
  if (!chatLink) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(chatLink);
      return true;
    } catch {
      // fall through to the execCommand fallback below
    }
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = chatLink;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
