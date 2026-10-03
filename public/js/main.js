/* Interactive Scripts for O Que É Isso? E-commerce */

document.addEventListener('DOMContentLoaded', () => {
  // Configuração de envio do formulário Adicionar ao Carrinho via AJAX
  const addCartForms = document.querySelectorAll('.form-add-cart-ajax');

  addCartForms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const productId = form.querySelector('[name="productId"]').value;
      const quantity = form.querySelector('[name="quantity"]')?.value || 1;
      const submitBtn = form.querySelector('button[type="submit"]');

      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      try {
        const response = await fetch('/carrinho/adicionar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ productId, quantity }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Atualiza contador do carrinho
          const badge = document.querySelector('.cart-badge');
          if (badge) {
            badge.textContent = data.cartCount;
            badge.style.transform = 'scale(1.3)';
            setTimeout(() => (badge.style.transform = 'scale(1)'), 300);
          }

          showToast('Produto adicionado ao carrinho!', 'success');
        } else {
          showToast(data.error || 'Erro ao adicionar produto.', 'error');
        }
      } catch (err) {
        console.error('Erro AJAX carrinho:', err);
        showToast('Não foi possível adicionar ao carrinho.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  });
});

// Toast notification helper
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '24px';
    toastContainer.style.right = '24px';
    toastContainer.style.zIndex = '9999';
    toastContainer.style.display = 'flex';
    toastContainer.style.flexDirection = 'column';
    toastContainer.style.gap = '10px';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.background = type === 'success' ? '#2C1A11' : '#991B1B';
  toast.style.color = '#FFF';
  toast.style.padding = '14px 22px';
  toast.style.borderRadius = '12px';
  toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
  toast.style.fontWeight = '600';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.style.animation = 'fadeInUp 0.3s ease';

  toast.innerHTML = `
    <i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}" style="color: ${type === 'success' ? '#FFBA08' : '#FCA5A5'}"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Helper para copiar código PIX
function copyPixCode() {
  const pixInput = document.getElementById('pix-code-input');
  if (pixInput) {
    pixInput.select();
    pixInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(pixInput.value);
    showToast('Código PIX copiado para a área de transferência!', 'success');
  }
}
