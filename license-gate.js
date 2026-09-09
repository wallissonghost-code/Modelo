(() => {
  const VALIDATE_URL = 'https://pa.wallissonghost.workers.dev/api/licenses/validate';
  const STORAGE_KEY = 'not_license_key';
  const DEVICE_KEY = 'not_device_id';

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

  window.NOT_LICENSE = Object.freeze({ authorized: false });

  function setAuthorized(data) {
    window.NOT_LICENSE = Object.freeze({
      authorized: true,
      plan: data.plan,
      expiresAt: data.expiresAt,
      deviceLimit: data.deviceLimit,
      activeDevices: data.activeDevices
    });
    overlay.remove();
    window.dispatchEvent(new CustomEvent('not-license-authorized', { detail: window.NOT_LICENSE }));
  }

  function blockedMessage(reason) {
    if (reason === 'DEVICE_LIMIT_REACHED') return 'Limite de dispositivos atingido para esta assinatura.';
    if (reason === 'INVALID_DEVICE') return 'Este dispositivo não pôde ser identificado.';
    if (reason === 'EXPIRED') return 'Assinatura expirada.';
    if (reason === 'SUSPENDED') return 'Assinatura suspensa.';
    if (reason === 'REVOKED') return 'Assinatura revogada.';
    if (reason === 'INVALID_KEY') return 'Chave inválida.';
    return reason || 'INVALID_KEY';
  }

  async function validate(rawKey, silent = false) {
    const key = String(rawKey || '').trim().toUpperCase();
    if (!key) return;
    button.disabled = true;
    if (!silent) message.textContent = 'Validando…';
    try {
      const res = await fetch(VALIDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, deviceId }),
        cache: 'no-store'
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        localStorage.removeItem(STORAGE_KEY);
        message.textContent = `Acesso bloqueado: ${blockedMessage(data.reason || data.status)}`;
        return;
      }
      localStorage.setItem(STORAGE_KEY, key);
      setAuthorized(data);
    } catch {
      message.textContent = 'Não foi possível validar a licença. Acesso bloqueado.';
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener('click', () => validate(input.value));
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') validate(input.value);
  });

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    input.value = saved;
    validate(saved, true);
  }
})();
