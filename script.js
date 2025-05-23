const API_KEY = '488eb36776275b8ae18600751059fb49';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const MOVIE_PROXY = 'https://player.vidsrc.co/embed/movie/';
const TV_PROXY = 'https://player.vidsrc.co/embed/tv/';

let currentPage = 1;
let currentQuery = '';
let isFetching = false;
let timeout = null;
let currentMode = 'movie';
let selectedTV = null;

const ANIME_PROXY = 'https://player.vidsrc.co/embed/anime/';

async function openModal(item) {
  document.getElementById("modalTitle").innerText = item.title || item.name;
  showModal();

  const iframe = document.getElementById("videoFrame");
  const selectorGroup = document.getElementById("seasonEpisodes");
  selectorGroup.innerHTML = "";

  if (currentMode === 'movie') {
    iframe.src = `${MOVIE_PROXY}${item.id}`;
  } else if (currentMode === 'tv') {
    selectedTV = item;
    const tvDetails = await fetch(`https://api.themoviedb.org/3/tv/${item.id}?api_key=${API_KEY}`);
    const tvData = await tvDetails.json();
    if (!tvData.seasons || tvData.seasons.length === 0) return;

    const seasonSelect = document.createElement("select");
    seasonSelect.id = "seasonSelect";

    tvData.seasons.forEach(season => {
      const option = document.createElement("option");
      option.value = season.season_number;
      option.textContent = `Season ${season.season_number}`;
      seasonSelect.appendChild(option);
    });

    const episodeSelect = document.createElement("select");
    episodeSelect.id = "episodeSelect";

    selectorGroup.appendChild(seasonSelect);
    selectorGroup.appendChild(episodeSelect);

    seasonSelect.addEventListener("change", () => {
      loadEpisodes(item.id, seasonSelect.value, episodeSelect);
    });

    episodeSelect.addEventListener("change", () => {
      iframe.src = `${TV_PROXY}${item.id}/${seasonSelect.value}/${episodeSelect.value}`;
    });

    seasonSelect.value = "1";
    await loadEpisodes(item.id, "1", episodeSelect);
    episodeSelect.value = "1";
    iframe.src = `${TV_PROXY}${item.id}/1/1`;
  } else if (currentMode === 'anime') {
    // Crude anime movie check: usually anime movies have `title` but no `seasons`
    const isAnimeMovie = item.media_type === 'movie' || item.title;

    if (isAnimeMovie) {
      iframe.src = `${MOVIE_PROXY}${item.id}`;
    } else {
      iframe.src = `${ANIME_PROXY}${item.id}/1/sub?autoPlay=false`;
    }
  }
}

async function fetchContent(query = '', page = 1) {
  if (isFetching) return;
  isFetching = true;
  document.getElementById("loading").style.display = "block";

  let endpoint = currentMode === 'movie'
    ? (query ? `search/movie` : `movie/popular`)
    : (query ? `search/tv` : `tv/popular`);

  const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    document.getElementById("loading").style.display = "none";

    if (!data.results || data.results.length === 0) {
      if (page === 1) document.getElementById("movies").innerHTML = "";
      document.getElementById("error").innerText = "No results found!";
      isFetching = false;
      return;
    }

    document.getElementById("error").innerText = "";
    displayMovies(data.results, page === 1);
  } catch (err) {
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

    const movieEl = document.createElement("div");
    movieEl.classList.add("movie");
    movieEl.innerHTML = `
      <img data-src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}" class="lazy-image" loading="lazy">
      <div class="overlay">${item.title || item.name}</div>
    `;
    movieEl.onclick = () => openModal(item);
    moviesDiv.appendChild(movieEl);

    // Observe image for lazy load
    lazyObserver.observe(movieEl.querySelector('img'));
  });
}

async function openModal(item) {
  document.getElementById("modalTitle").innerText = item.title || item.name;
  showModal();

  const iframe = document.getElementById("videoFrame");
  const selectorGroup = document.getElementById("seasonEpisodes");
  selectorGroup.innerHTML = "";

  if (currentMode === 'movie') {
    iframe.src = `${MOVIE_PROXY}${item.id}`;
  } else {
    selectedTV = item;
    const tvDetails = await fetch(`https://api.themoviedb.org/3/tv/${item.id}?api_key=${API_KEY}`);
    const tvData = await tvDetails.json();
    if (!tvData.seasons || tvData.seasons.length === 0) return;

    const seasonSelect = document.createElement("select");
    seasonSelect.id = "seasonSelect";

    tvData.seasons.forEach(season => {
      const option = document.createElement("option");
      option.value = season.season_number;
      option.textContent = `Season ${season.season_number}`;
      seasonSelect.appendChild(option);
    });

    const episodeSelect = document.createElement("select");
    episodeSelect.id = "episodeSelect";

    selectorGroup.appendChild(seasonSelect);
    selectorGroup.appendChild(episodeSelect);

    seasonSelect.addEventListener("change", () => {
      loadEpisodes(item.id, seasonSelect.value, episodeSelect);
    });

    episodeSelect.addEventListener("change", () => {
      iframe.src = `${TV_PROXY}${item.id}/${seasonSelect.value}/${episodeSelect.value}`;
    });

    // Set default to Season 1 and load its episodes
    seasonSelect.value = "1";
    await loadEpisodes(item.id, "1", episodeSelect);
    episodeSelect.value = "1";
    iframe.src = `${TV_PROXY}${item.id}/1/1`;
  }
}
async function loadEpisodes(tvId, seasonNumber, episodeSelect) {
  episodeSelect.innerHTML = "";
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
    const data = await res.json();
    data.episodes.forEach(ep => {
      const option = document.createElement("option");
      option.value = ep.episode_number;
      option.textContent = `Episode ${ep.episode_number}`;
      episodeSelect.appendChild(option);
    });

    const iframe = document.getElementById("videoFrame");
    iframe.src = `${TV_PROXY}${tvId}/${seasonNumber}/${data.episodes[0].episode_number}`;
  } catch (err) {
    console.error("Failed to load episodes", err);
  }
}

function closeModal() {
  document.getElementById("movieModal").style.display = "none";
  document.getElementById("videoFrame").src = "";
  document.getElementById("seasonEpisodes").innerHTML = "";
}

function debounceSearch() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    const query = document.getElementById("search").value.trim();
    currentQuery = query;
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

// Lazy image loader using IntersectionObserver
const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      lazyObserver.unobserve(img);
    }
  });
}, {
  rootMargin: "100px"
});

// Infinite scroll using IntersectionObserver
const sentinelObserver = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting && !isFetching) {
    currentPage++;
    await fetchContent(currentQuery, currentPage);
  }
}, {
  rootMargin: "300px"
});

window.onload = async () => {
  await fetchContent(currentQuery, currentPage);

  const sentinel = document.getElementById("sentinel");
  sentinelObserver.observe(sentinel);

  // Ensure content fills viewport
  const ensureFilled = async () => {
    while (document.body.scrollHeight <= window.innerHeight + 100) {
      currentPage++;
      await fetchContent(currentQuery, currentPage);
    }
  };
  await ensureFilled();
};
const modalTop = document.getElementById("modalTop");

// Permanently hide the modalTop
modalTop.classList.add("hidden");

// Show the modal without triggering any timer
function showModal() {
  document.getElementById("movieModal").style.display = "flex";
  // modalTop stays hidden permanently
}
