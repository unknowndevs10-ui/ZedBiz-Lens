const KEY = 'zedbiz-lens:workspace-preferences:v1';
const DEFAULTS = { theme: 'light', density: 'comfortable', motion: 'full' };

export function readWorkspacePreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      theme: saved.theme === 'dark' ? 'dark' : DEFAULTS.theme,
      density: saved.density === 'compact' ? 'compact' : DEFAULTS.density,
      motion: saved.motion === 'reduced' ? 'reduced' : DEFAULTS.motion,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveWorkspacePreferences(preferences) {
  const safe = {
    theme: preferences.theme === 'dark' ? 'dark' : 'light',
    density: preferences.density === 'compact' ? 'compact' : 'comfortable',
    motion: preferences.motion === 'reduced' ? 'reduced' : 'full',
  };
  try { localStorage.setItem(KEY, JSON.stringify(safe)); } catch { /* current view still updates */ }
  window.dispatchEvent(new CustomEvent('zedbiz:workspace-preferences', { detail: safe }));
  return safe;
}

