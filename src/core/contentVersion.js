export function contentSnapshot(metadata = {}) {
  return {
    version: String(metadata.contentVersion || metadata.scoreVersion || metadata.version || 'unknown'),
    programVersion: metadata.version || null,
    buildVersion: metadata.buildVersion || null,
    updatedAt: metadata.contentUpdatedAt || metadata.buildDate || null,
    source: metadata.contentSource || 'local versioned data packages',
    counts: { ...(metadata.data || {}) },
    updateLog: Array.isArray(metadata.updateLog) ? metadata.updateLog.map(item => ({ ...item })) : [],
    pending: null
  };
}

export function syncContentMetadata(state, metadata) {
  if (!state) return null;
  const incoming = contentSnapshot(metadata);
  state.content ??= {};
  if (!state.content.version) Object.assign(state.content, incoming);
  else if (state.content.version !== incoming.version) state.content.pending = incoming;
  state.content.counts ??= {};
  state.content.updateLog ??= [];
  state.content.pending ??= null;
  return state.content;
}

export function activatePendingContent(state) {
  const pending = state?.content?.pending;
  if (!pending) return null;
  state.content = { ...pending, pending: null };
  return state.content;
}

export function displayVersion(value) {
  const match = String(value || '').trim().match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return String(value || '0.0');
  return `${match[1]}.${match[2]}${Number(match[3] || 0) ? `.${Number(match[3])}` : ''}`;
}
