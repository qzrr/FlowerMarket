// js/faq.js
document.addEventListener('DOMContentLoaded', function () {
  const faqItems = document.querySelectorAll('.faq-item');

  if (faqItems.length === 0) {
    // console.log("FAQ.js: Элементы .faq-item не найдены на странице.");
    return;
  }

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer'); // Для управления высотой, если нужно

    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Можно закрывать другие открытые ответы, если нужно поведение аккордеона
        item.classList.toggle('active');

        if (answer) {
          if (item.classList.contains('active')) {
            answer.style.maxHeight = answer.scrollHeight + "px";
          } else {
            answer.style.maxHeight = null;
          }
        }
      });
    }
  });
});
