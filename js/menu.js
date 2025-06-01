// js/menu.js
function initMobileMenu() {
  const burgerButton = document.querySelector('.burger-menu');
  const closeButton = document.querySelector('.mobile-menu__close');
  const mobileMenu = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.overlay');

  if (!burgerButton || !closeButton || !mobileMenu || !overlay) return;

  function openMenu() {
    mobileMenu.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  burgerButton.addEventListener('click', openMenu);
  closeButton.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (link.href && link.href !== '#' && !link.href.startsWith(window.location.href + '#')) {
        closeMenu();
      } else if (link.hash) {
        closeMenu();
      }
    });
  });
}

// Инициализация в app.js
