(async function () {
  const base = "https://lookerstudio.google.com/embed/reporting/5c9aa62c-a673-4317-916f-589222f5cd09/page/";

  const frameA = document.getElementById("frameA");
  const frameB = document.getElementById("frameB");
  let pages = [];
  let current = 0;
  const DISPLAY_TIME_MS = 30_000; // 30s per page

  //fetch page json
  async function fetchPages(retryCount = 3) {
    try {
      const res = await fetch("pages.json?cachebust=" + Date.now());
      if (!res.ok) throw new Error("Failed to fetch pages.json");
      return await res.json();
    } catch (err) {
      console.warn(`pages.json fetch failed, retries left: ${retryCount}`, err);
      if (retryCount > 0) {
        await new Promise(r => setTimeout(r, 5000));
        return fetchPages(retryCount - 1);
      } else {
        alert("Failed to load pages.json after multiple attempts.");
        return [];
      }
    }
  }

  pages = await fetchPages();
  if (pages.length === 0) return;

  // rotation logic
  function showNextPage() {
    const currentFrame = current % 2 === 0 ? frameA : frameB;
    const nextFrame = current % 2 === 0 ? frameB : frameA;

    currentFrame.classList.remove("active");
    nextFrame.classList.add("active");

    current = (current + 1) % pages.length;
    setTimeout(showNextPage, DISPLAY_TIME_MS);
    preloadNextPage();
  }

  function preloadNextPage() {
    const pageToLoad = (current + 1) % pages.length;
    const frameToLoad = current % 2 === 0 ? frameB : frameA;
    frameToLoad.src = `${base}${pages[pageToLoad]}`;
  }

  // initial load
  frameA.src = `${base}${pages[0]}`;
  frameA.onload = () => {
    setTimeout(showNextPage, DISPLAY_TIME_MS);
    preloadNextPage();
    scheduleRefresh(); // start refresh timer only after first page is loaded
  };

  //6-hour forced page refresh
  const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
  function scheduleRefresh() {
    setTimeout(() => {
      console.log("Refreshing page...");
      const url = window.location.origin + window.location.pathname + "?t=" + Date.now();
      window.location.replace(url); // full hard reload
    }, REFRESH_INTERVAL_MS);
  }
})();



