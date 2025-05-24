// external.js - Add interactive and animated effects for the movie grid and search

document.addEventListener('DOMContentLoaded', () => {
  // Intro screen removal
  const introScreen = document.querySelector('.intro-screen');
  setTimeout(() => {
    introScreen.classList.add('fade-out');
    setTimeout(() => introScreen.classList.add('hidden'), 1000);
  }, 2000);

  // Toggle search input
  const searchContainer = document.querySelector('.search-container');
  const searchToggle = document.querySelector('.search-toggle');

  searchToggle.addEventListener('click', () => {
    searchContainer.classList.toggle('active');
  });

  // Reveal movies with animation
  const movies = document.querySelectorAll('.movie');
  movies.forEach((movie, index) => {
    setTimeout(() => {
      movie.style.opacity = '1';
    }, index * 100);
  });

  // Hover audio (optional)
  const hoverSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.wav');
  document.querySelectorAll('.movie').forEach(card => {
    card.addEventListener('mouseenter', () => hoverSound.play());
  });

  // Neon glow effect on hover
  document.querySelectorAll('.movie').forEach(movie => {
    movie.addEventListener('mouseover', () => {
      movie.style.boxShadow = '0 0 15px rgba(255, 0, 150, 0.6)';
    });
    movie.addEventListener('mouseout', () => {
      movie.style.boxShadow = '';
    });
  });

  // Background parallax (optional)
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    const bg = document.querySelector('.background-overlay');
    if (bg) bg.style.transform = `translate(${x}px, ${y}px)`;
  });
});
