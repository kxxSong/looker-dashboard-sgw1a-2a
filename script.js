(async function () {
  const base =
    "https://lookerstudio.google.com/embed/reporting/5c9aa62c-a673-4317-916f-589222f5cd09/page/";
  const frameA = document.getElementById("frameA");
  const frameB = document.getElementById("frameB");

  const DISPLAY_TIME_MS = 30_000;
  const VIDEO_DURATION_MS = 2 * 60 * 1000;
  const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

  let pages = [];
  let current = 0;
  let nextFrameLoading = false;

  async function fetchPages() {
    const res = await fetch("pages.json?cachebust=" + Date.now());
    return res.ok ? res.json() : [];
  }

  pages = await fetchPages();
  if (pages.length === 0) return;

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

      frame.setAttribute(
        "allow",
        "autoplay; fullscreen; accelerometer; encrypted-media; gyroscope; picture-in-picture"
      );
      frame.src = url;
    });
  }

  async function showNextPage() {
    if (nextFrameLoading) return;
    nextFrameLoading = true;

    const currentFrame = current % 2 === 0 ? frameA : frameB;
    const nextFrame = current % 2 === 0 ? frameB : frameA;
    const nextIndex = (current + 1) % pages.length;
    const nextPage = pages[nextIndex];

    // 🔹 If NOT video → load Looker Studio page
    if (nextPage !== "video") {
      const ok = await loadFrame(nextFrame, `${base}${nextPage}`);
      if (ok) {
        await new Promise((r) => setTimeout(r, 500));
        currentFrame.classList.remove("active");
        nextFrame.classList.add("active");
        current = nextIndex;
      }
      nextFrameLoading = false;
      setTimeout(showNextPage, DISPLAY_TIME_MS);
      return;
    }

    // 🔹 If page = "video" → load local MP4 player
    const ok = await loadFrame(nextFrame, "video.html");
    await new Promise((r) => setTimeout(r, 500));

    currentFrame.classList.remove("active");
    nextFrame.classList.add("active");
    current = nextIndex;
    nextFrameLoading = false;

    // This controls how long video stays before rotating
    setTimeout(showNextPage, VIDEO_DURATION_MS);
  }

  // Start automatically - no button needed
  await loadFrame(frameA, `${base}${pages[0]}`);
  frameA.classList.add("active");
  setTimeout(showNextPage, DISPLAY_TIME_MS);

  setTimeout(() => {
    console.log("Refreshing page (hard reload)");
    const url =
      window.location.origin + window.location.pathname + "?t=" + Date.now();
    window.location.replace(url);
  }, REFRESH_INTERVAL_MS);
})();
