(async function () {
  const base = "https://lookerstudio.google.com/embed/reporting/5c9aa62c-a673-4317-916f-589222f5cd09/page/";
  const frameA = document.getElementById("frameA");
  const frameB = document.getElementById("frameB");
  const DISPLAY_TIME_MS = 30_000; // 30s per page
  const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h

  let pages = [];
  let current = 0;
  let nextFrameLoading = false;

  // fetch page list
  async function fetchPages() {
    const res = await fetch("pages.json?cachebust=" + Date.now());
    return res.ok ? res.json() : [];
  }

  pages = await fetchPages();
  if (pages.length === 0) return;

  // load helper that waits until iframe is ready or timeout
  function loadFrame(frame, url, timeout = 15000) {
    return new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) resolve(false);
      }, timeout);

      frame.onload = () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(true);
        }
      };
      frame.src = url;
    });
  }

  async function showNextPage() {
    if (nextFrameLoading) return; // prevent overlap
    nextFrameLoading = true;

    const currentFrame = current % 2 === 0 ? frameA : frameB;
    const nextFrame = current % 2 === 0 ? frameB : frameA;
    const nextIndex = (current + 1) % pages.length;

    // preload next page and wait for it to be ready
    const ok = await loadFrame(nextFrame, `${base}${pages[nextIndex]}`);
    if (ok) {
      // small delay to ensure smooth switch
      await new Promise(r => setTimeout(r, 500));
      currentFrame.classList.remove("active");
      nextFrame.classList.add("active");
      current = nextIndex;
    }

    nextFrameLoading = false;
    setTimeout(showNextPage, DISPLAY_TIME_MS);
  }

  // start first page
  await loadFrame(frameA, `${base}${pages[0]}`);
  frameA.classList.add("active");
  setTimeout(showNextPage, DISPLAY_TIME_MS);

  // safe periodic full refresh
  setTimeout(() => {
    console.log("Refreshing page (hard reload)");
    const url = window.location.origin + window.location.pathname + "?t=" + Date.now();
    window.location.replace(url);
  }, REFRESH_INTERVAL_MS);
})();