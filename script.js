document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("overlay");
  const audio = document.getElementById("audio");

  const playBtn = document.getElementById("play");
  const nextBtn = document.getElementById("next");
  const prevBtn = document.getElementById("prev");

  const seek = document.getElementById("seek");
  const volume = document.getElementById("volume");
  const trackName = document.getElementById("trackName");

  const volPercent = document.getElementById("volPercent");
  const currentTimeText = document.getElementById("currentTime");
  const durationText = document.getElementById("duration");

  const tracks = [
    "music/Выше Облаков.mp3",
    "music/На трапе.mp3",
    "music/эклеры.mp3",
    "music/Рэйман.mp3",
    "music/Катюха.mp3",
    "music/Биг Сити Лайф.mp3",
    "music/Пошлая Блондинка.mp3",
    "music/Юморист.mp3",
    "music/Русская Кукла.mp3",
  ];

  let index = Math.floor(Math.random() * tracks.length);
  let isSeeking = false;
  let unlocked = false;

  function formatName(p){
    return p.split("/").pop().replace(".mp3","");
  }

  function formatTime(secs) {
    if (!isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = String(Math.floor(secs % 60)).padStart(2, "0");
    return `${m}:${s}`;
  }

  /* ===================================================
     ЭФФЕКТЫ CANVAS (ЗВЕЗДЫ И КУРСОР)
     =================================================== */
  const canvas = document.getElementById("fx");
  const ctx = canvas.getContext("2d");
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  // Адаптация размера экрана
  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const trailParticles = [];
  const stars = [];

  // Класс частицы, которая сыпется за курсором
  class TrailParticle {
    constructor(x, y) {
      this.x = x + (Math.random() - 0.5) * 6;
      this.y = y + (Math.random() - 0.5) * 6;
      this.size = Math.random() * 2 + 0.5; // Маленькие белые песчинки
      this.speedX = (Math.random() - 0.5) * 0.8;
      this.speedY = Math.random() * 1.2 + 0.4; // Падают вниз
      this.alpha = 1;
      this.decay = Math.random() * 0.02 + 0.015; // Скорость исчезновения
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.alpha -= this.decay;
    }
    draw() {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Класс мерцающей и двигающейся звезды для фона
  class Star {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 1.5 + 0.2;
      this.speedX = (Math.random() - 0.5) * 0.15; // Медленное движение по X
      this.speedY = (Math.random() - 0.5) * 0.15; // Медленное движение по Y
      this.alpha = Math.random();
      this.twinkleSpeed = Math.random() * 0.015 + 0.005; // Скорость мерцания
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.alpha += this.twinkleSpeed;

      // Реверс мерцания при достижении лимитов
      if (this.alpha > 1 || this.alpha < 0.1) {
        this.twinkleSpeed = -this.twinkleSpeed;
      }

      // Если звезда улетела за экран, возвращаем её с другой стороны
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
    }
    draw() {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Инициализация звездного неба
  function initStars() {
    for (let i = 0; i < 100; i++) {
      stars.push(new Star());
    }
  }

  // Слежение за мышкой для создания шлейфа
  window.addEventListener("mousemove", (e) => {
    if (unlocked) {
      // Спавним по 2 песчинки при каждом микро-движении
      for (let i = 0; i < 2; i++) {
        trailParticles.push(new TrailParticle(e.clientX, e.clientY));
      }
    }
  });

  // Главный цикл анимации Canvas
  function animateFX() {
    ctx.clearRect(0, 0, width, height);

    // Рисуем звезды только ПОСЛЕ первого клика
    if (unlocked) {
      stars.forEach(star => {
        star.update();
        star.draw();
      });
    }

    // Обработка шлейфа курсора
    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const p = trailParticles[i];
      p.update();
      p.draw();
      if (p.alpha <= 0) {
        trailParticles.splice(i, 1); // Удаляем невидимые частицы
      }
    }

    requestAnimationFrame(animateFX);
  }
  animateFX(); // Запускаем цикл отрисовки


  /* ===================================================
     ЛОГИКА ПЛЕЕРА И КНОПОК
     =================================================== */

  /* LOAD TRACK */
  function loadTrack(i){
    audio.src = tracks[i];
    trackName.textContent = formatName(tracks[i]);
    seek.value = 0;
    currentTimeText.textContent = "0:00";
    durationText.textContent = "0:00";
  }

  /* PLAY */
  function playAudio(){
    const p = audio.play();
    if (p) p.catch(()=>{});
    playBtn.textContent = "⏸";
  }

  /* START SYSTEM (OVERLAY) */
  overlay.addEventListener("click", () => {
    overlay.classList.add("hidden");
    document.body.classList.add("started");
    unlocked = true;

    // Включаем генерацию фоновых звезд при клике
    initStars();

    // ХИТРАЯ ГРОМКОСТЬ: UI (0.50) * 0.1 = реальные 5% звука
    audio.volume = parseFloat(volume.value) * 0.1;
    
    loadTrack(index);
    playAudio();
  });

  /* PLAY / PAUSE */
  playBtn.addEventListener("click", () => {
    if(audio.paused){
      if(!unlocked) return;
      playAudio();
    } else {
      audio.pause();
      playBtn.textContent = "▶";
    }
  });

  /* NEXT / PREV */
  nextBtn.addEventListener("click", () => {
    index = (index + 1) % tracks.length;
    loadTrack(index);
    if(unlocked) playAudio();
  });

  prevBtn.addEventListener("click", () => {
    index = (index - 1 + tracks.length) % tracks.length;
    loadTrack(index);
    if(unlocked) playAudio();
  });

  /* VOLUME CONTROL */
  volume.value = 0.50;
  volPercent.textContent = "50%";

  volume.addEventListener("input", (e) => {
    const v = parseFloat(e.target.value);
    audio.volume = v * 0.1; 
    volPercent.textContent = Math.round(v * 100) + "%";
  });

  /* DURATION */
  audio.addEventListener("loadedmetadata", () => {
    durationText.textContent = formatTime(audio.duration);
  });

  /* SEEK */
  seek.addEventListener("input", () => {
    if(!audio.duration) return;
    audio.currentTime = (seek.value / 100) * audio.duration;
  });

  seek.addEventListener("pointerdown", () => isSeeking = true);
  seek.addEventListener("pointerup", () => isSeeking = false);

  /* LIVE TIME & PROGRESS SYNC */
  audio.addEventListener("timeupdate", () => {
    if(audio.duration && !isSeeking){
      seek.value = (audio.currentTime / audio.duration) * 100 || 0;
      currentTimeText.textContent = formatTime(audio.currentTime);
    }
  });

  /* AUTO NEXT */
  audio.addEventListener("ended", () => {
    index = (index + 1) % tracks.length;
    loadTrack(index);
    if(unlocked) playAudio();
  });

  /* ONLINE VISITS COUNTER */
  const NAMESPACE = "lzvrt_github_project"; 
  const COUNTER_KEY = "visits_main";

  fetch(`https://api.counterapi.dev/v1/${NAMESPACE}/${COUNTER_KEY}/up`)
    .then(r => r.json())
    .then(d => {
      if (d && d.count !== undefined) {
        document.getElementById("visits").textContent = d.count;
      }
    })
    .catch(err => {
      console.error("Ошибка онлайн-счетчика:", err);
      document.getElementById("visits").textContent = "1";
    });
});