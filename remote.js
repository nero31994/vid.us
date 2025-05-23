<script>
document.addEventListener("DOMContentLoaded", () => {
  const movies = Array.from(document.querySelectorAll(".movie"));
  let currentIndex = 0;

  const updateFocus = (index) => {
    movies.forEach(movie => movie.classList.remove("focused"));
    if (movies[index]) {
      movies[index].classList.add("focused");
      movies[index].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Initial focus
  updateFocus(currentIndex);

  const getCols = () => {
    const grid = document.querySelector(".movie-grid");
    const card = document.querySelector(".movie");
    return grid && card ? Math.floor(grid.offsetWidth / card.offsetWidth) : 5;
  };

  const handleNavigation = (key) => {
    const cols = getCols();
    switch (key) {
      case "ArrowRight": case "DPAD_RIGHT": currentIndex = Math.min(currentIndex + 1, movies.length - 1); break;
      case "ArrowLeft": case "DPAD_LEFT": currentIndex = Math.max(currentIndex - 1, 0); break;
      case "ArrowDown": case "DPAD_DOWN": currentIndex = Math.min(currentIndex + cols, movies.length - 1); break;
      case "ArrowUp": case "DPAD_UP": currentIndex = Math.max(currentIndex - cols, 0); break;
      case "Enter": case "DPAD_CENTER": case "A": movies[currentIndex]?.click(); return;
    }
    updateFocus(currentIndex);
  };

  document.addEventListener("keydown", (e) => handleNavigation(e.key));

  // Gamepad support
  let lastGamepadTime = 0;
  const pollGamepad = () => {
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0];
    if (gp && performance.now() - lastGamepadTime > 200) {
      const [lx, ly] = [gp.axes[0], gp.axes[1]];
      const btnPressed = gp.buttons.find(b => b.pressed);
      if (lx > 0.5) { handleNavigation("ArrowRight"); lastGamepadTime = performance.now(); }
      if (lx < -0.5) { handleNavigation("ArrowLeft"); lastGamepadTime = performance.now(); }
      if (ly > 0.5) { handleNavigation("ArrowDown"); lastGamepadTime = performance.now(); }
      if (ly < -0.5) { handleNavigation("ArrowUp"); lastGamepadTime = performance.now(); }
      if (gp.buttons[0]?.pressed) { handleNavigation("Enter"); lastGamepadTime = performance.now(); } // A button
    }
    requestAnimationFrame(pollGamepad);
  };

  pollGamepad();
});
</script>
