
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
      movieEl.addEventListener("click", () => toggleEpisodeDropdown(movieEl, item));
    } else {
      movieEl.onclick = () => openIframe(item);
    }

    moviesDiv.appendChild(movieEl);
    lazyObserver.observe(movieEl.querySelector('img'));
  });
}

function openEpisodeModal(item) {
  let existingModal = document.getElementById('episodeModal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'episodeModal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;
    z-index: 1002; overflow-y: auto;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: #1e1e1e; padding: 20px; border-radius: 8px;
    width: 90%; max-width: 600px; color: white; position: relative;
  `;
  modalContent.innerHTML = '<p>Loading episodes...</p>';

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Ã—';
  closeBtn.style.cssText = `
    position: absolute; top: 10px; right: 15px; background: none; border: none;
    font-size: 24px; color: white; cursor: pointer;
  `;
  closeBtn.onclick = () => modal.remove();
  modalContent.appendChild(closeBtn);

  fetch(`https://api.themoviedb.org/3/tv/${item.id}?api_key=${API_KEY}`)
    .then(res => res.json())
    .then(async show => {
      let html = `<h2 style="margin-top:0">${show.name}</h2>`;
      for (const season of show.seasons) {
        const seasonRes = await fetch(`https://api.themoviedb.org/3/tv/${item.id}/season/${season.season_number}?api_key=${API_KEY}`);
        const seasonData = await seasonRes.json();
        html += `<details open><summary>Season ${season.season_number}</summary><ul style="list-style:none;padding-left:10px;">`;
        for (const ep of seasonData.episodes) {
          html += `<li style="margin:4px 0;"><button style="padding:4px 8px;" onclick="playEpisode(${item.id}, ${season.season_number}, ${ep.episode_number}); document.getElementById('episodeModal').remove();">Ep ${ep.episode_number}: ${ep.name}</button></li>`;
        }
        html += "</ul></details>";
      }
      modalContent.innerHTML += html;
    })
    .catch(err => {
      console.error(err);
      modalContent.innerHTML = "<p style='color:red;'>Failed to load episodes</p>";
    });
}

function toggleEpisodeDropdown(container, item) {
  openEpisodeModal(item);
}
