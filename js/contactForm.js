// js/contactForm.js
function setupContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    let isValid = true;

    const formData = {
      name: document.getElementById('contact-name')?.value.trim(),
      email: document.getElementById('contact-email')?.value.trim(),
      phone: document.getElementById('contact-phone')?.value.trim(),
      message: document.getElementById('contact-message')?.value.trim(),
      consent: document.getElementById('contact-consent')?.checked
    };

    if (!formData.name) {
      showError('contact-name', 'Пожалуйста, введите ваше имя.');
      isValid = false;
    }
    if (!formData.email) {
      showError('contact-email', 'Пожалуйста, введите ваш email.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('contact-email', 'Введите корректный email.');
      isValid = false;
    }
    if (formData.phone && !/^[0-9+\-() ]{7,20}$/.test(formData.phone)) {
      showError('contact-phone', 'Введите корректный телефон.');
      isValid = false;
    }
    if (!formData.message) {
      showError('contact-message', 'Пожалуйста, введите ваше сообщение.');
      isValid = false;
    }
    if (!formData.consent) {
      showError('contact-consent', 'Необходимо согласие на обработку данных.');
      isValid = false;
    }

    if (!isValid) return;

    const formStatusEl = document.getElementById('contact-form-status');
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    if (formStatusEl) {
      formStatusEl.textContent = 'Отправка...';
      formStatusEl.className = 'form-status info active';
    }

    try {
      // Имитация: await API.submitContactForm(formData);
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (formStatusEl) {
        formStatusEl.textContent = 'Сообщение успешно отправлено!';
        formStatusEl.className = 'form-status success active';
      }
      contactForm.reset();
      setTimeout(() => {
        if (formStatusEl) formStatusEl.classList.remove('active');
      }, 3000);

      const thankYouModal = document.getElementById('thank-you-modal');
      if (thankYouModal) {
        thankYouModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        thankYouModal.querySelector('.modal__close, .js-close-thank-you-modal')?.addEventListener('click', () => {
          thankYouModal.classList.remove('active');
          document.body.style.overflow = '';
        }, {once: true});
      }
    } catch (error) {
      if (formStatusEl) {
        formStatusEl.textContent = 'Ошибка отправки. Попробуйте позже.';
        formStatusEl.className = 'form-status error active';
      }
      showNotification('Ошибка отправки формы.', true);
      setTimeout(() => {
        if (formStatusEl) formStatusEl.classList.remove('active');
      }, 5000);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorContainer = field?.closest('.form-group')?.querySelector('.form-error') || document.getElementById(`${fieldId}-error`);
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
    }
    field?.classList.add('invalid');
  }

  function clearErrors() {
    contactForm.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
    contactForm.querySelectorAll('.form-field.invalid, input.invalid, textarea.invalid').forEach(el => el.classList.remove('invalid'));
  }
}

// Инициализация в app.js
