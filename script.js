const API_KEY = '488eb36776275b8ae18600751059fb49';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const MOVIE_PROXY = 'https://player.vidsrc.co/embed/movie/';
const TV_PROXY = 'https://player.vidsrc.co/embed/tv/';

let currentPage = 1;
let currentQuery = '';
let isFetching = false;
let timeout = null;
let currentMode = 'movie';

async function fetchContent(query = '', page = 1) {
  if (isFetching) return;
  isFetching = true;
  document.getElementById("loading").style.display = "block";

  const endpoint = currentMode === 'movie'
    ? (query ? 'search/movie' : 'movie/popular')
    : (query ? 'search/tv' : 'tv/popular');

  const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    document.getElementById("error").innerText = "";

    if (!data.results?.length) {
      if (page === 1) document.getElementById("movies").innerHTML = "";
      document.getElementById("error").innerText = "No results found!";
      return;
    }

    displayMovies(data.results, page === 1);
  } catch {
    document.getElementById("error").innerText = "Error fetching data!";
  } finally {
    document.getElementById("loading").style.display = "none";
    isFetching = false;
  }
}

function displayMovies(items, clear = false) {
  const moviesDiv = document.getElementById("movies");
  if (clear) moviesDiv.innerHTML = "";

  items.forEach(item => {
    if (!item.poster_path) return;

    const el = document.createElement("div");
    el.classList.add("movie");
    el.innerHTML = `
      <img data-src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}" class="lazy-image" loading="lazy">
      <div class="overlay">${item.title || item.name}</div>
    `;
    el.onclick = () => openIframe(item);
    moviesDiv.appendChild(el);

    lazyObserver.observe(el.querySelector('img'));
  });
}

function openIframe(item) {
  const iframe = document.getElementById("videoFrame");
  iframe.src = currentMode === 'movie'
    ? `${MOVIE_PROXY}${item.id}`
    : `${TV_PROXY}${item.id}/1/1`;

  document.getElementById("videoContainer").style.display = "block";
}

function closeIframe() {
  document.getElementById("videoFrame").src = "";
  document.getElementById("videoContainer").style.display = "none";
}

function debounceSearch() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    currentQuery = document.getElementById("search").value.trim();
    currentPage = 1;
    fetchContent(currentQuery, currentPage);
  }, 300);
}

function switchMode(mode) {
  currentMode = mode;
  currentQuery = '';
  currentPage = 1;
  document.getElementById("search").value = '';
  fetchContent();
}

const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      lazyObserver.unobserve(img);
    }
  });
}, { rootMargin: "100px" });

const sentinelObserver = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting && !isFetching) {
    currentPage++;
    await fetchContent(currentQuery, currentPage);
  }
}, { rootMargin: "300px" });

window.onload = async () => {
  await fetchContent(currentQuery, currentPage);
  sentinelObserver.observe(document.getElementById("sentinel"));

  while (document.body.scrollHeight <= window.innerHeight + 100) {
    currentPage++;
    await fetchContent(currentQuery, currentPage);
  }
};
