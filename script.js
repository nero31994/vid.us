const API_KEY = "488eb36776275b8ae18600751059fb49";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const PROXY_URL = "https://nerflixprox.arenaofvalorph937.workers.dev/proxy?id=";

const moviesDiv = document.getElementById("movies");
let currentPage = 1;
let totalPages = 1;
let currentQuery = "";
let currentMode = "movie";
let debounceTimer;
let genreMap = {};
let selectedGenre = "";

window.onload = async () => {
  await fetchGenres();
  fetchContent();

  const searchInput = document.getElementById("search");
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentQuery = searchInput.value.trim();
      currentPage = 1;
      fetchContent(currentQuery);
    }, 500);
  });

  document.getElementById("genreFilter").addEventListener("change", (e) => {
    selectedGenre = e.target.value;
    currentPage = 1;
    fetchContent(currentQuery, currentPage);
  });

  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && currentPage < totalPages) {
      currentPage++;
      fetchContent(currentQuery, currentPage, true);
    }
  });
};

function switchMode(mode) {
  currentMode = mode;
  currentQuery = "";
  currentPage = 1;
  document.getElementById("search").value = "";
  fetchGenres();
  fetchContent();
}

async function fetchGenres() {
  const res = await fetch(`${BASE_URL}/genre/${currentMode}/list?api_key=${API_KEY}`);
  const data = await res.json();
  genreMap = {};
  const genreFilter = document.getElementById("genreFilter");
  genreFilter.innerHTML = `<option value="">All</option>`;
  data.genres.forEach(genre => {
    genreMap[genre.id] = genre.name;
    const option = document.createElement("option");
    option.value = genre.id;
    option.textContent = genre.name;
    genreFilter.appendChild(option);
  });
}

async function fetchContent(query = "", page = 1, append = false) {
  const endpoint = query ? "/search/" : `/discover/`;
  const url = `${BASE_URL}${endpoint}${currentMode}?api_key=${API_KEY}&page=${page}&query=${query}`;
  const response = await fetch(url);
  const data = await response.json();
  totalPages = data.total_pages;
  displayMovies(data.results, append);
}

function displayMovies(items, append = false) {
  if (!append) moviesDiv.innerHTML = "";

  items.forEach(item => {
    if (!item.poster_path) return;
    if (selectedGenre && !item.genre_ids.includes(parseInt(selectedGenre))) return;

    const movieEl = document.createElement("div");
    movieEl.classList.add("movie");
    movieEl.innerHTML = `
      <img data-src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}" class="lazy-image" loading="lazy">
      <div class="overlay">${item.title || item.name}</div>
    `;
    movieEl.onclick = () => openModal(item);
    moviesDiv.appendChild(movieEl);

    lazyObserver.observe(movieEl.querySelector("img"));
  });
}

function openModal(movie) {
  const modal = document.getElementById("modal");
  const iframe = document.getElementById("moviePlayer");
  const title = movie.title || movie.name;
  const id = movie.id;

  let embedUrl = "";
  if (currentMode === "movie") {
    embedUrl = `https://vidsrc.to/embed/movie/${id}?autoPlay=false`;
  } else if (currentMode === "tv") {
    embedUrl = `https://vidsrc.cc/v2/embed/tv/${id}?autoPlay=false`;
  } else if (currentMode === "anime") {
    embedUrl = `https://vidsrc.cc/v2/embed/anime/${id}/1/sub?autoPlay=false`;
  }

  iframe.src = PROXY_URL + encodeURIComponent(embedUrl);
  modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("modal");
  const iframe = document.getElementById("moviePlayer");
  iframe.src = "";
  modal.style.display = "none";
}

// Lazy Load
const lazyObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      lazyObserver.unobserve(img);
    }
  });
});
