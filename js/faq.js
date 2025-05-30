document.addEventListener('DOMContentLoaded', function () {
  // Находим все FAQ элементы
  const faqItems = document.querySelectorAll('.faq-item');

  console.log("FAQ.js script loaded and running.", faqItems.length);
  // Добавляем обработчик события для каждого вопроса
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    if (question) {
      question.addEventListener('click', () => {
        // Проверяем, активен ли текущий элемент
        item.classList.toggle('active');
        console.log('Clicked:', question.textContent);
      });
    }
  });
});


