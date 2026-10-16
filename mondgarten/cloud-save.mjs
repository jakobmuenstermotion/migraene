const encoder = new TextEncoder(),
  decoder = new TextDecoder();
const to64 = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
const from64 = (s) =>
  Uint8Array.from(atob(s.replaceAll('-', '+').replaceAll('_', '/')), (c) =>
    c.charCodeAt(0),
  );
export function newSaveKey() {
  return 'mg1.' + to64(crypto.getRandomValues(new Uint8Array(32)));
}
export function saveServerURL(value) {
  const url = new URL(value);
  if (
    (url.protocol !== 'https:' &&
      !(
        url.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      )) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw Error('Bitte eine HTTPS-Adresse ohne Zugangsdaten verwenden.');
  return url.href.replace(/\/$/, '');
}
export async function saveIdentity(key) {
  if (!/^mg1\.[A-Za-z0-9_-]{43}$/.test(key))
    throw Error('Der Spielstandschlüssel ist ungültig.');
  const material = await crypto.subtle.importKey(
    'raw',
    from64(key.slice(4)),
    'HKDF',
    false,
    ['deriveBits', 'deriveKey'],
  );
  const options = (info) => ({
    name: 'HKDF',
    hash: 'SHA-256',
    salt: encoder.encode('mondgarten-save-v1'),
    info: encoder.encode(info),
  });
  const auth = to64(
    new Uint8Array(
      await crypto.subtle.deriveBits(options('authentication'), material, 256),
    ),
  );
  const hash = new Uint8Array(
    await crypto.subtle.digest('SHA-256', encoder.encode(auth)),
  );
  const id = Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
  const cipher = await crypto.subtle.deriveKey(
    options('encryption'),
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  return { id, auth, cipher };
}
export async function encryptSave(snapshot, identity) {
  const iv = crypto.getRandomValues(new Uint8Array(12)),
    bytes = encoder.encode(JSON.stringify(snapshot));
  if (bytes.length > 700000) throw Error('Der Spielstand ist zu groß.');
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: encoder.encode(identity.id) },
      identity.cipher,
      bytes,
    ),
  );
  let binary = '';
  for (let i = 0; i < cipher.length; i += 8192)
    binary += String.fromCharCode(...cipher.subarray(i, i + 8192));
  return {
    version: 1,
    iv: to64(iv),
    ciphertext: btoa(binary)
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', ''),
  };
}
export async function decryptSave(payload, identity) {
  if (
    payload?.version !== 1 ||
    typeof payload.ciphertext !== 'string' ||
    payload.ciphertext.length > 1000000
  )
    throw Error('Ungültige Online-Sicherung.');
  const plain = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: from64(payload.iv),
      additionalData: encoder.encode(identity.id),
    },
    identity.cipher,
    from64(payload.ciphertext),
  );
  return JSON.parse(decoder.decode(plain));
}
export function publicSupabaseKey(value) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return value;
  try {
    const parts = value.split('.');
    if (
      parts.length === 3 &&
      JSON.parse(decoder.decode(from64(parts[1]))).role === 'anon'
    )
      return value;
  } catch {}
  throw Error(
    'Bitte nur den öffentlichen Publishable-/anon-Key verwenden, keinen Secret-/service_role-Key.',
  );
}
export class SaveConflict extends Error {
  constructor() {
    super(
      'Auf einem anderen Gerät liegt ein neuerer Stand. Bitte wähle, welchen Stand du weiterverwenden möchtest.',
    );
    this.name = 'SaveConflict';
  }
}
export class CloudSave {
  constructor(
    config,
    { fetcher = fetch, onConfig = () => {}, onStatus = () => {} } = {},
  ) {
    this.config = { ...config, url: saveServerURL(config.url) };
    if (config.backend === 'supabase')
      this.config.publicKey = publicSupabaseKey(config.publicKey ?? '');
    this.fetcher = (...args) => fetcher(...args);
    this.onConfig = onConfig;
    this.onStatus = onStatus;
    this.identity = saveIdentity(config.key);
    this.paused = false;
    this.stopped = false;
    this.pending = null;
    this.busy = false;
  }
  async request(method, body, inviteCode) {
    if (this.config.backend === 'supabase')
      return this.supabaseRequest(method, body, inviteCode);
    const identity = await this.identity;
    const headers = { Authorization: 'Bearer ' + identity.auth };
    if (method === 'PUT') {
      headers['Content-Type'] = 'application/json';
      if (this.config.revision > 0)
        headers['If-Match'] = '"' + this.config.revision + '"';
      else headers['If-None-Match'] = '*';
      if (inviteCode) headers['X-Invite-Code'] = inviteCode;
    }
    const response = await this.fetcher(
      this.config.url + '/api/save/' + identity.id,
      {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'omit',
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      },
    );
    if (response.status === 409) throw new SaveConflict();
    if (response.status === 404) return null;
    if (!response.ok)
      throw Error(
        response.status === 403
          ? 'Der Einrichtungscode oder der Zugriff wurde abgelehnt.'
          : response.status === 503
            ? 'Der Speicherdienst ist noch nicht eingerichtet.'
            : 'Online-Sicherung nicht erreichbar (' + response.status + ').',
      );
    return response.json();
  }
  async supabaseRequest(method, payload, inviteCode) {
    const identity = await this.identity,
      args = { p_id: identity.id, p_token: identity.auth };
    if (method === 'PUT')
      Object.assign(args, {
        p_expected: this.config.revision ?? 0,
        p_payload: payload,
        p_invite: inviteCode ?? null,
      });
    const response = await this.fetcher(
      this.config.url +
        '/rest/v1/rpc/' +
        (method === 'GET' ? 'garden_read' : 'garden_write'),
      {
        method: 'POST',
        headers: {
          apikey: this.config.publicKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args),
        credentials: 'omit',
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      },
    );
    if (response.status === 409) throw new SaveConflict();
    if (!response.ok)
      throw Error(
        response.status === 404
          ? 'Bitte zuerst das Einrichtungs-SQL im Supabase-Projekt ausführen.'
          : response.status === 403
            ? 'Der Einrichtungscode oder der öffentliche Projekt-Key wurde abgelehnt.'
            : response.status === 503
              ? 'Bitte zuerst den Einrichtungscode im Supabase-Projekt setzen.'
              : 'Online-Sicherung nicht erreichbar (' + response.status + ').',
      );
    return response.json();
  }
  async read() {
    const remote = await this.request('GET');
    return remote
      ? {
          ...remote,
          snapshot: await decryptSave(remote.payload, await this.identity),
        }
      : null;
  }
  useRevision(revision) {
    this.config.revision = revision;
    if (this.stopped) return;
    this.paused = false;
    this.onConfig({ ...this.config });
  }
  async write(snapshot, inviteCode) {
    const payload = await encryptSave(snapshot, await this.identity),
      result = await this.request('PUT', payload, inviteCode);
    if (!result) throw Error('Online-Sicherung wurde nicht gefunden.');
    this.useRevision(result.revision);
    if (!this.stopped) this.onStatus('saved');
    return result;
  }
  queue(snapshot) {
    this.pending = structuredClone(snapshot);
  }
  async flush() {
    if (this.paused || this.busy || !this.pending) return;
    this.busy = true;
    const snapshot = this.pending;
    this.pending = null;
    try {
      await this.write(snapshot);
    } catch (e) {
      this.pending ??= snapshot;
      if (e instanceof SaveConflict) {
        this.paused = true;
        this.onStatus('conflict');
      } else this.onStatus('offline');
    } finally {
      this.busy = false;
    }
  }
  stop() {
    this.stopped = true;
    this.paused = true;
    this.pending = null;
  }
}
