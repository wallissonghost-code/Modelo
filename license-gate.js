(() => {
  const VALIDATE_URL = 'https://pa.wallissonghost.workers.dev/api/licenses/validate';
  const STORAGE_KEY = 'not_license_key';
  const DEVICE_KEY = 'not_device_id';
  const REVALIDATE_MS = 5 * 60 * 1000;
  const NETWORK_GRACE_MS = 3 * 60 * 1000;
  let revalidateTimer = null;
  let graceTimer = null;
  let lastConfirmedAt = 0;

  function makeDeviceId() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_KEY);
    if (!deviceId || !/^[A-Za-z0-9_-]{16,128}$/.test(deviceId)) {
      deviceId = makeDeviceId();
      localStorage.setItem(DEVICE_KEY, deviceId);
    }
    return deviceId;
  }

  const deviceId = getDeviceId();
  const overlay = document.createElement('div');
  overlay.id = 'notLicenseGate';
  overlay.innerHTML = `
    <div class="not-license-card">
      <div class="not-license-brand">NOT / ACESSO</div>
      <h1>Licença necessária</h1>
      <p>Digite a chave privada gerada no painel Pa para liberar este jogo.</p>
      <input id="notLicenseInput" type="password" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="NOT-XXXX-XXXX-XXXX-XXXX-XXXX" />
      <button id="notLicenseButton" type="button">Validar chave</button>
      <div id="notLicenseMessage">Aguardando uma licença válida.</div>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#notLicenseInput');
  const button = overlay.querySelector('#notLicenseButton');
  const message = overlay.querySelector('#notLicenseMessage');

  function showGate(text) {
    if (!document.body.contains(overlay)) document.body.appendChild(overlay);
    if (text) message.textContent = text;
  }

  function publish(state) {
    window.NOT_LICENSE = Object.freeze(state);
  }
  publish({ authorized: false, status: 'LOCKED' });

  function blockedMessage(reason) {
    if (reason === 'DEVICE_LIMIT_REACHED') return 'Limite de dispositivos atingido para esta assinatura.';
    if (reason === 'INVALID_DEVICE') return 'Este dispositivo não pôde ser identificado.';
    if (reason === 'EXPIRED') return 'Assinatura expirada.';
    if (reason === 'SUSPENDED') return 'Assinatura suspensa.';
    if (reason === 'REVOKED') return 'Assinatura revogada.';
    if (reason === 'TOO_MANY_ATTEMPTS') return 'Muitas tentativas. Aguarde e tente novamente.';
    if (reason === 'INVALID_KEY') return 'Chave inválida.';
    return 'Licença não autorizada.';
  }

  function stopTimers() {
    if (revalidateTimer) clearInterval(revalidateTimer);
    if (graceTimer) clearTimeout(graceTimer);
    revalidateTimer = null;
    graceTimer = null;
  }

  function lock(reason, removeKey = false) {
    stopTimers();
    if (removeKey) localStorage.removeItem(STORAGE_KEY);
    publish({ authorized: false, status: 'LOCKED', reason });
    showGate(`Acesso bloqueado: ${blockedMessage(reason)}`);
    window.dispatchEvent(new CustomEvent('not-license-locked', { detail: window.NOT_LICENSE }));
  }

  function setAuthorized(data, key) {
    lastConfirmedAt = Date.now();
    if (graceTimer) clearTimeout(graceTimer);
    graceTimer = null;
    publish({ authorized: true, status: 'AUTHORIZED', plan: data.plan, expiresAt: data.expiresAt, deviceLimit: data.deviceLimit, activeDevices: data.activeDevices, lastConfirmedAt });
    localStorage.setItem(STORAGE_KEY, key);
    overlay.remove();
    window.dispatchEvent(new CustomEvent('not-license-authorized', { detail: window.NOT_LICENSE }));
    if (!revalidateTimer) revalidateTimer = setInterval(() => revalidate(key), REVALIDATE_MS);
  }

  function enterGrace(key) {
    if (!window.NOT_LICENSE?.authorized) return lock('VALIDATION_UNAVAILABLE');
    publish({ ...window.NOT_LICENSE, authorized: true, status: 'GRACE_PERIOD', graceUntil: Date.now() + NETWORK_GRACE_MS });
    window.dispatchEvent(new CustomEvent('not-license-grace', { detail: window.NOT_LICENSE }));
    if (graceTimer) clearTimeout(graceTimer);
    graceTimer = setTimeout(async () => {
      const ok = await revalidate(key, true);
      if (!ok && window.NOT_LICENSE?.status === 'GRACE_PERIOD') lock('VALIDATION_UNAVAILABLE');
    }, NETWORK_GRACE_MS);
  }

  async function requestValidation(key) {
    const res = await fetch(VALIDATE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, deviceId }), cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  async function revalidate(rawKey, finalGraceCheck = false) {
    const key = String(rawKey || '').trim().toUpperCase();
    if (!key) { lock('INVALID_KEY', true); return false; }
    try {
      const { res, data } = await requestValidation(key);
      if (!res.ok || !data.authorized) { lock(data.reason || data.status || 'INVALID_KEY', true); return false; }
      setAuthorized(data, key);
      return true;
    } catch {
      if (finalGraceCheck) return false;
      enterGrace(key);
      return false;
    }
  }

  async function validate(rawKey, silent = false) {
    const key = String(rawKey || '').trim().toUpperCase();
    if (!key) return;
    button.disabled = true;
    if (!silent) message.textContent = 'Validando…';
    try {
      const { res, data } = await requestValidation(key);
      if (!res.ok || !data.authorized) { lock(data.reason || data.status || 'INVALID_KEY', true); return; }
      setAuthorized(data, key);
    } catch {
      lock('VALIDATION_UNAVAILABLE');
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener('click', () => validate(input.value));
  input.addEventListener('keydown', event => { if (event.key === 'Enter') validate(input.value); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && window.NOT_LICENSE?.authorized && Date.now() - lastConfirmedAt >= REVALIDATE_MS) revalidate(localStorage.getItem(STORAGE_KEY)); });
  window.addEventListener('online', () => { if (window.NOT_LICENSE?.status === 'GRACE_PERIOD') revalidate(localStorage.getItem(STORAGE_KEY)); });

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) { input.value = saved; validate(saved, true); }
})();
