// js/utils.js
function showNotification(message, isError = false) {
  let notificationContainer = document.querySelector('.notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    // Стили можно вынести в CSS
    Object.assign(notificationContainer.style, {
      position: 'fixed', top: '20px', right: '20px', zIndex: '10001',
      display: 'flex', flexDirection: 'column', gap: '10px'
    });
    document.body.appendChild(notificationContainer);
  }

  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'notification--error' : 'notification--success'}`;
  notification.textContent = message;
  Object.assign(notification.style, {
    padding: '12px 20px', borderRadius: '5px', color: '#fff',
    backgroundColor: isError ? '#e74c3c' : '#27ae60', // Красный / Зеленый
    boxShadow: '0 3px 15px rgba(0,0,0,0.15)', opacity: '0',
    transform: 'translateX(110%)', transition: 'opacity 0.3s ease-out, transform 0.4s ease-out',
    minWidth: '250px', textAlign: 'center'
  });
  notificationContainer.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(110%)';
    setTimeout(() => {
      notification.remove();
      // if (notificationContainer.children.length === 0 && notificationContainer.parentNode) {
      //   notificationContainer.remove(); // Можно удалять контейнер, если он пуст
      // }
    }, 400);
  }, 3000);
}

function formatPrice(price) {
  const numPrice = parseFloat(String(price).replace(',', '.'));
  if (isNaN(numPrice)) return '0 ₽';
  return `${numPrice.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽`;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

window.showNotification = showNotification;
window.formatPrice = formatPrice;
window.debounce = debounce;
