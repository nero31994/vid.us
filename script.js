const API_KEY = '488eb36776275b8ae18600751059fb49';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const SERVERS = {
  movie: [
      { name: 'MainServer', url: 'https://spencerdevs.xyz/movie/' },
    { name: 'Server1', url: 'https://vidify.top//embed/movie/' },
    { name: 'Server2', url: 'https://autoembed.pro/embed/movie/' }
  
  ],
  tv: [
    { name: 'MainServer', url: 'https://spencerdevs.xyz/tv/' },
    { name: 'Server1', url: 'https://vidify.top/embed/tv/' },
    { name: 'Server2', url: 'https://autoembed.pro/embed/tv/' }
      ]
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
function openIframe(item) {
  currentItem = item;
  const container = document.getElementById("videoContainer");
  const iframe = document.getElementById("videoFrame");

  const serverList = SERVERS[currentMode === 'anime' ? 'movie' : currentMode];

  let serverSwitcher = document.getElementById("serverSwitcher");
  if (!serverSwitcher) {
    serverSwitcher = document.createElement("div");
    serverSwitcher.id = "serverSwitcher";
    serverSwitcher.style.cssText = `
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1001;
    `;

    const select = document.createElement("select");
    select.id = "serverSelect";
    select.style.cssText = `
      padding: 6px 12px;
      font-size: 10px;
      border-radius: 6px;
      border: 1px solid #ccc;
      background: #000;
      color: #fff;
    `;
    select.onchange = () => switchServer(select.selectedIndex);

    serverList.forEach((s, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = s.name;
      select.appendChild(option);
    });

    serverSwitcher.appendChild(select);
    container.appendChild(serverSwitcher);
  }

  // Set iframe to default server (index 0)
  switchServer(0);
  document.getElementById("serverSelect").selectedIndex = 0;
  container.style.display = "block";
}

function switchServer(index) {
  const iframe = document.getElementById("videoFrame");
  const item = currentItem;
  const mode = currentMode === 'anime' ? 'movie' : currentMode;
  const server = SERVERS[mode][index];
  iframe.src = mode === 'tv'
    ? `${server.url}${item.id}/1/1`
    : `${server.url}${item.id}`;
}

function closeIframe() {
  const container = document.getElementById("videoContainer");
  const iframe = document.getElementById("videoFrame");

  iframe.src = "";
  container.style.display = "none";
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
