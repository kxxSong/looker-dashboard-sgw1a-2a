(async function () {
  const base =
    "https://lookerstudio.google.com/embed/reporting/5c9aa62c-a673-4317-916f-589222f5cd09/page/";

  const res = await fetch("pages.json");
  const pages = await res.json();

  const frameA = document.getElementById("frameA");
  const frameB = document.getElementById("frameB");
  let current = 0;
  const DISPLAY_TIME_MS = 30_000;

  //Switches the 'active' class from current to next frame.
  function showNextPage() {
    const currentFrame = current % 2 === 0 ? frameA : frameB;
    const nextFrame = current % 2 === 0 ? frameB : frameA;

    currentFrame.classList.remove("active");
    nextFrame.classList.add("active");

    // Update current page index to the next visible page
    current = (current + 1) % pages.length;
    setTimeout(showNextPage, DISPLAY_TIME_MS);
    preloadNextPage();
  }

  //loading page in hidden iframe
  function preloadNextPage() {
    const pageToLoad = (current + 1) % pages.length;
    const frameToLoad = current % 2 === 0 ? frameB : frameA;
    // const loadingOverlay = document.getElementById("loadingOverlay");

    //loading overlay screen
    // loadingOverlay.classList.add("active");

    // Set the src to start preloading
    frameToLoad.src = `${base}${pages[pageToLoad]}`;
    frameToLoad.onload = () => {
      // Hide overlay once fully loaded
      // loadingOverlay.classList.remove("active");
      // The page is loaded. It will sit here hidden until showNextPage is triggered
    };
  }

  frameA.src = `${base}${pages[0]}`;
  frameA.onload = () => {
    setTimeout(showNextPage, DISPLAY_TIME_MS);
    preloadNextPage();
  };
})();

const REFRESH_INTERVAL_MS = 6*60*60*1000;

setTimeout(() => {
    console.log("Refreshing...");
    window.location.reload (true);
}, REFRESH_INTERVAL_MS); 
