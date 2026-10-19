// Open a URL in the user's default browser (Tauri shell plugin; capability
// "shell:allow-open" is already granted). Falls back to window.open in a plain browser.
export async function openExternal(url) {
  if (!url) return;
  try {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
  } catch {
    try { window.open(url, "_blank", "noopener"); } catch { /* nothing else to try */ }
  }
}
