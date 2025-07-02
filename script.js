
const API_KEY = '488eb36776275b8ae18600751059fb49';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const SERVERS = {
  movie: [
    { name: 'MainServer', url: 'https://vidify.top//embed/movie/' },
    { name: 'MainServer2', url: 'https://nerflixprox.arenaofvalorph937.workers.dev/proxy?id=' },
    { name: 'Server1', url: 'https://spencerdevs.xyz/movie/' },
    { name: 'Server2', url: 'https://autoembed.pro/embed/movie/' }
  ],
  tv: [
    { name: 'MainServer', url: 'https://vidify.top/embed/tv/' },
    { name: 'MainServer2', url: 'https://nerflixprox.arenaofvalorph937.workers.dev/proxy?id=' },
    { name: 'Server1', url: 'https://spencerdevs.xyz/tv/' },
    { name: 'Server2', url: 'https://autoembed.pro/embed/tv/' }
  ]
};

let currentPage = 1;
let currentQuery = '';
let isFetching = false;
let timeout = null;
let currentMode = 'movie';
let currentItem = null;

function createEpisodeModal() {
  const modal = document.createElement('div');
  modal.id = 'episodeModal';
  modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:2000;background-color:rgba(0,0,0,0.95);color:#fff;overflow:auto;padding:20px;';
  modal.innerHTML = '<button onclick="closeEpisodeModal()" style="position:absolute;top:10px;right:20px;font-size:2em;background:none;color:#fff;border:none;">&times;</button><div id="episodeContent"></div>';
  document.body.appendChild(modal);
}
createEpisodeModal();

function closeEpisodeModal() {
  document.getElementById("episodeModal").style.display = "none";
  document.getElementById("episodeContent").innerHTML = "";
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

    if (currentMode === 'tv') {
      movieEl.addEventListener("click", () => showEpisodesInModal(item));
    } else {
      movieEl.onclick = () => openIframe(item);
    }

    moviesDiv.appendChild(movieEl);
    lazyObserver.observe(movieEl.querySelector('img'));
  });
}

async function showEpisodesInModal(item) {
  const contentDiv = document.getElementById("episodeContent");
  contentDiv.innerHTML = `<p>Loading episodes...</p>`;
  document.getElementById("episodeModal").style.display = "block";

  try {
    const showRes = await fetch(`https://api.themoviedb.org/3/tv/${item.id}?api_key=${API_KEY}`);
    const show = await showRes.json();

    let html = `<h2>${show.name} - Episodes</h2>`;
    for (const season of show.seasons) {
      const seasonRes = await fetch(`https://api.themoviedb.org/3/tv/${item.id}/season/${season.season_number}?api_key=${API_KEY}`);
      const seasonData = await seasonRes.json();

      html += `<details><summary><strong>Season ${season.season_number}</strong></summary><ul style="list-style:none;padding-left:10px;">`;
      for (const ep of seasonData.episodes) {
        html += `<li style="margin:6px 0;"><button style="padding:5px 10px;" onclick="playEpisode(${item.id}, ${season.season_number}, ${ep.episode_number}); event.stopPropagation();">Ep ${ep.episode_number}: ${ep.name}</button></li>`;
      }
      html += `</ul></details>`;
    }

    contentDiv.innerHTML = html;
  } catch (err) {
    contentDiv.innerHTML = "<p style='color:red;'>Failed to load episodes</p>";
    console.error(err);
  }
}

function playEpisode(showId, season, episode) {
  currentItem = { id: showId };
  currentMode = "tv";

  const container = document.getElementById("videoContainer");
  const iframe = document.getElementById("videoFrame");
  const serverList = SERVERS.tv;

  let serverSwitcher = document.getElementById("serverSwitcher");
  if (!serverSwitcher) {
    serverSwitcher = document.createElement("div");
    serverSwitcher.id = "serverSwitcher";
    serverSwitcher.style.cssText = "position: absolute;top: 10px;left: 50%;transform: translateX(-50%);z-index: 1001;";

    const select = document.createElement("select");
    select.id = "serverSelect";
    select.style.cssText = "padding: 6px 12px;font-size: 6px;border-radius: 6px;border: 1px solid #ccc;background: #000;color: #fff;";
    select.onchange = () => switchEpisodeServer(select.selectedIndex, showId, season, episode);

    serverList.forEach((s, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = s.name;
      select.appendChild(option);
    });

    serverSwitcher.appendChild(select);
    container.appendChild(serverSwitcher);
  }

  document.getElementById("serverSelect").selectedIndex = 0;
  switchEpisodeServer(0, showId, season, episode);
  container.style.display = "block";
}

function switchEpisodeServer(index, showId, season, episode) {
  const iframe = document.getElementById("videoFrame");
  const server = SERVERS.tv[index];
  iframe.src = `${server.url}${showId}/${season}/${episode}`;
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
    serverSwitcher.style.cssText = "position: absolute;top: 10px;left: 50%;transform: translateX(-50%);z-index: 1001;";

    const select = document.createElement("select");
    select.id = "serverSelect";
    select.style.cssText = "padding: 6px 12px;font-size: 6px;border-radius: 6px;border: 1px solid #ccc;background: #000;color: #fff;";
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

  switchServer(0);
  document.getElementById("serverSelect").selectedIndex = 0;
  container.style.display = "block";
}

function switchServer(index) {
  const iframe = document.getElementById("videoFrame");
  const item = currentItem;
  const mode = currentMode === 'anime' ? 'movie' : currentMode;
  const server = SERVERS[mode][index];
  iframe.src = mode === 'tv' ? `${server.url}${item.id}/1/1` : `${server.url}${item.id}`;
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
}, { rootMargin: "100px" });

const sentinelObserver = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting && !isFetching) {
    currentPage++;
    if (currentMode === 'anime') {
      await fetchAnime(currentPage);
    } else {
      await fetchContent(currentQuery, currentPage);
    }
  }
}, { rootMargin: "300px" });

window.onload = async () => {
  await fetchContent(currentQuery, currentPage);
  sentinelObserver.observe(document.getElementById("sentinel"));

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
