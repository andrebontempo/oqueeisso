// Registro do Service Worker e Gerenciamento do Banner de Instalação PWA
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);
        })
        .catch((err) => {
          console.error('[PWA] Falha ao registrar Service Worker:', err);
        });
    });
  }

  let deferredPrompt;

  // Ouvir evento de instalação do Chrome/Android
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });

  // Mostrar banner de instalação PWA no rodapé
  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 440px;
        background: #FFFFFF;
        box-shadow: 0 10px 30px rgba(0,0,0,0.18);
        border: 1px solid var(--border-color, #E8DFD8);
        border-radius: 16px;
        padding: 16px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 14px;
        animation: pwaSlideUp 0.4s ease-out;
      ">
        <img src="/images/icons/icon-192.png" alt="O Que É Isso App" style="width: 48px; height: 48px; border-radius: 12px; object-fit: cover;">
        <div style="flex: 1;">
          <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #2C1810;">Instalar Aplicativo</h4>
          <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #666;">Acesse nosso artesanato direto da sua tela inicial!</p>
        </div>
        <button id="pwa-install-btn" style="
          background: var(--primary, #6B3A2A);
          color: #FFF;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s;
        ">Instalar</button>
        <button id="pwa-dismiss-btn" style="
          background: none;
          border: none;
          color: #999;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px;
        " title="Fechar">&times;</button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] Escolha de instalação do usuário:', outcome);
        deferredPrompt = null;
        banner.remove();
      }
    });

    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
      banner.remove();
    });
  }

  // Detectar se é dispositivo iOS e não está em modo standalone
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

  if (isIOS && !isStandalone) {
    window.addEventListener('load', () => {
      // Mostrar dica para iOS se não foi dispensado na sessão
      if (!sessionStorage.getItem('ios_pwa_prompt_dismissed')) {
        setTimeout(showIOSInstallTip, 3000);
      }
    });
  }

  function showIOSInstallTip() {
    if (document.getElementById('pwa-ios-tip')) return;

    const tip = document.createElement('div');
    tip.id = 'pwa-ios-tip';
    tip.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 440px;
        background: #2C1810;
        color: #FFFFFF;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        border-radius: 16px;
        padding: 14px 18px;
        z-index: 9999;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: pwaSlideUp 0.4s ease-out;
      ">
        <img src="/images/icons/icon-192.png" alt="O Que É Isso App" style="width: 40px; height: 40px; border-radius: 10px;">
        <div style="flex: 1;">
          <strong>Instalar no iPhone:</strong> Toque no ícone <i class="fas fa-share-nodes" style="color: #4A90E2;"></i> e escolha <strong>"Adicionar à Tela de Início"</strong>.
        </div>
        <button id="pwa-ios-dismiss" style="background: none; border: none; color: #FFF; font-size: 1.2rem; cursor: pointer;">&times;</button>
      </div>
    `;

    document.body.appendChild(tip);

    document.getElementById('pwa-ios-dismiss').addEventListener('click', () => {
      sessionStorage.setItem('ios_pwa_prompt_dismissed', 'true');
      tip.remove();
    });
  }
})();
