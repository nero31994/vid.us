
/* === Modal CSS for TV Episodes === */
const style = document.createElement("style");
style.innerHTML = `
#episodeModal {
  backdrop-filter: blur(5px);
  font-family: sans-serif;
}
#episodeModal h2 {
  margin-top: 40px;
  font-size: 24px;
  text-align: center;
  color: #00bcd4;
}
#episodeModal summary {
  font-weight: bold;
  color: #00bcd4;
  cursor: pointer;
  font-size: 18px;
  margin: 10px 0;
}
#episodeModal ul {
  padding: 0 0 10px 20px;
}
#episodeModal li button {
  background-color: #00bcd4;
  border: none;
  color: #fff;
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
}
#episodeModal li button:hover {
  background-color: #0097a7;
}
#episodeModal button[onclick*="closeEpisodeModal"] {
  font-size: 32px;
  color: #fff;
  background: none;
  border: none;
  cursor: pointer;
}`;
document.head.appendChild(style);

// Ensure the modal container exists
const episodeModal = document.createElement("div");
episodeModal.id = "episodeModal";
episodeModal.style.cssText = "display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:2000;background-color:rgba(0,0,0,0.95);color:#fff;overflow:auto;padding:20px;";
episodeModal.innerHTML = '<button onclick="closeEpisodeModal()" style="position:absolute;top:10px;right:20px;font-size:2em;background:none;color:#fff;border:none;">&times;</button><div id="episodeContent"></div>';
document.body.appendChild(episodeModal);

function closeEpisodeModal() {
  document.getElementById("episodeModal").style.display = "none";
  document.getElementById("episodeContent").innerHTML = "";
}

function playEpisode(showId, season, episode) {
  closeEpisodeModal(); // ✅ Auto-close modal

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
 
