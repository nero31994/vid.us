const API_KEY = '488eb36776275b8ae18600751059fb49';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const SERVERS = {
  movie: { url: 'https://autoembed.pro/embed/movie/' },
  tv: { url: 'https://autoembed.pro/embed/tv/' }
};

let currentPage = 1;
let currentQuery = '';
let isFetching = false;
let timeout = null;
let currentMode = 'movie';
let currentItem = null;

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

async function fetchAnime(page = 1) {
  if (isFetching) return;
  isFetching = true;
  document.getElementById("loading").style.display = "block";

  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=16&with_original_language=ja&page=${page}&sort_by=popularity.desc`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    document.getElementById("loading").style.display = "none";

    if (!data.results || data.results.length === 0) {
      if (page === 1) document.getElementById("movies").innerHTML = "";
      document.getElementById("error").innerText = "No anime found!";
      isFetching = false;
      return;
    }

    document.getElementById("error").innerText = "";
    displayMovies(data.results, page === 1);
  } catch (err) {
    document.getElementById("error").innerText = "Error fetching anime!";
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
    movieEl.onclick = () => openIframe(item);
    moviesDiv.appendChild(movieEl);

    lazyObserver.observe(movieEl.querySelector('img'));
  });
}

async function openIframe(item) {
  currentItem = item;
  const container = document.getElementById("videoContainer");
  const iframe = document.getElementById("videoFrame");
  const episodeSelector = document.getElementById("episodeSelector");

  if (currentMode === 'tv') {
    // fetch TV show details to get number of seasons
    const res = await fetch(`https://api.themoviedb.org/3/tv/${item.id}?api_key=${API_KEY}`);
    const data = await res.json();

    const seasons = data.seasons.filter(s => s.season_number > 0); // skip specials
    if (seasons.length > 0) {
      // load first season episodes
      loadEpisodes(item.id, seasons[0].season_number);
    }

    episodeSelector.style.display = "block";
  } else {
    // Movie mode
    const server = SERVERS.movie;
    iframe.src = `${server.url}${item.id}`;
    episodeSelector.style.display = "none";
  }

  container.style.display = "block";
}

async function loadEpisodes(showId, seasonNumber) {
  const episodeSelector = document.getElementById("episodeSelector");
  const res = await fetch(`https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}?api_key=${API_KEY}`);
  const data = await res.json();

  episodeSelector.innerHTML = "";
  data.episodes.forEach(ep => {
    const btn = document.createElement("button");
    btn.textContent = `Ep ${ep.episode_number}`;
    btn.onclick = () => playEpisode(showId, seasonNumber, ep.episode_number);
    episodeSelector.appendChild(btn);
  });

  // auto-play first episode
  if (data.episodes.length > 0) {
    playEpisode(showId, seasonNumber, 1);
  }
}

function playEpisode(showId, season, episode) {
  const iframe = document.getElementById("videoFrame");
  const server = SERVERS.tv;
  iframe.src = `${server.url}${showId}/${season}/${episode}`;
}

function closeIframe() {
  const container = document.getElementById("videoContainer");
  const iframe = document.getElementById("videoFrame");
  const episodeSelector = document.getElementById("episodeSelector");

  iframe.src = "";
  container.style.display = "none";
  episodeSelector.style.display = "none";
}

function debounceSearch() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    const query = document.getElementById("search").value.trim();
    currentQuery = query;
    currentPage = 1;

    if (currentMode === 'anime') {
      fetchAnime(currentPage);
    } else {
      fetchContent(currentQuery, currentPage);
    }
  }, 300);
}

function switchMode(mode) {
  currentMode = mode;
  currentQuery = '';
  currentPage = 1;
  document.getElementById("search").value = '';

  if (mode === 'anime') {
    fetchAnime();
  } else {
    fetchContent();
  }
}

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

const sentinelObserver = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting && !isFetching) {
    currentPage++;
    if (currentMode === 'anime') {
      await fetchAnime(currentPage);
    } else {
      await fetchContent(currentQuery, currentPage);
    }
  }
}, {
  rootMargin: "300px"
});

window.onload = async () => {
  await fetchContent(currentQuery, currentPage);

  const sentinel = document.getElementById("sentinel");
  sentinelObserver.observe(sentinel);

  const ensureFilled = async () => {
    while (document.body.scrollHeight <= window.innerHeight + 100) {
      currentPage++;
      if (currentMode === 'anime') {
        await fetchAnime(currentPage);
      } else {
        await fetchContent(currentQuery, currentPage);
      }
    }
  };
  await ensureFilled();
};
