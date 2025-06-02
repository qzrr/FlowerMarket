  // js/slider.js
function initHeroSlider() {
  // Ищем главный контейнер слайдера. Если его нет на странице, функция ничего не делает.
  const sliderWrapper = document.getElementById('hero-slider-container');
  if (!sliderWrapper) {
    // console.log("Hero slider container not found on this page.");
    return;
  }

  const slider = sliderWrapper.querySelector('.hero__slider');
  if (!slider) {
    // console.log("Hero slider element not found within the container.");
    return;
  }

  const slides = Array.from(slider.querySelectorAll('.hero__slide'));
  const dotsContainer = sliderWrapper.querySelector('.hero__dots');
  const prevButton = sliderWrapper.querySelector('.hero__control--prev');
  const nextButton = sliderWrapper.querySelector('.hero__control--next');

  // Если слайдов нет или только один, отключаем управление и точки
  if (slides.length <= 1) {
    if (slides.length === 1) {
      slides[0].classList.add('active'); // Активируем единственный слайд
    }
    if (dotsContainer) dotsContainer.style.display = 'none';
    if (prevButton) prevButton.style.display = 'none';
    if (nextButton) nextButton.style.display = 'none';
    return;
  }

  let currentSlide = 0;
  let autoSlideInterval;
  const slideIntervalTime = 5000; // 5 секунд

  function goToSlide(slideIndex) {
    // Убираем класс active с текущего слайда и точки
    slides[currentSlide]?.classList.remove('active');
    if (dotsContainer) dotsContainer.children[currentSlide]?.classList.remove('active');

    // Обновляем currentSlide с учетом границ массива
    currentSlide = (slideIndex + slides.length) % slides.length;

    // Добавляем класс active новому слайду и точке
    slides[currentSlide]?.classList.add('active');
    if (dotsContainer) dotsContainer.children[currentSlide]?.classList.add('active');
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  function startAutoSlide() {
    clearInterval(autoSlideInterval); // Очищаем предыдущий интервал, если он был
    autoSlideInterval = setInterval(nextSlide, slideIntervalTime);
  }

  // Создаем точки, если есть контейнер для них
  if (dotsContainer) {
    dotsContainer.innerHTML = ''; // Очищаем на случай повторной инициализации
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'hero__dot';
      if (index === 0) dot.classList.add('active'); // Первый дот активен
      dot.setAttribute('data-slide-to', index);
      dot.setAttribute('aria-label', `Переключить на слайд ${index + 1}`);
      dot.addEventListener('click', function () {
        goToSlide(parseInt(this.dataset.slideTo));
        startAutoSlide(); // Перезапускаем авто-слайд при ручном переключении
      });
      dotsContainer.appendChild(dot);
    });
  }

  // Навешиваем обработчики на кнопки < >
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      prevSlide();
      startAutoSlide();
    });
  }
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      nextSlide();
      startAutoSlide();
    });
  }

  // Активируем первый слайд и запускаем автоматическое пролистывание
  if (slides.length > 0) {
    slides[0].classList.add('active'); // Убедимся, что первый слайд активен
    startAutoSlide();
  }
}

// Функция initHeroSlider будет вызываться из app.js при загрузке DOM
// document.addEventListener('DOMContentLoaded', initHeroSlider); // Можно убрать, если вызывается из app.js
