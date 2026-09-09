(() => {
  const VALIDATE_URL = 'https://pa.wallissonghost.workers.dev/api/licenses/validate';
  const STORAGE_KEY = 'not_license_key';

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
      deviceLimit: data.deviceLimit
    });
    overlay.remove();
    window.dispatchEvent(new CustomEvent('not-license-authorized', { detail: window.NOT_LICENSE }));
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
        body: JSON.stringify({ key }),
        cache: 'no-store'
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        localStorage.removeItem(STORAGE_KEY);
        message.textContent = `Acesso bloqueado: ${data.reason || data.status || 'INVALID_KEY'}`;
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
