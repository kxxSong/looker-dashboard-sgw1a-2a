(async function () {
  const base =
    "https://lookerstudio.google.com/embed/reporting/5c9aa62c-a673-4317-916f-589222f5cd09/page/";
  const frameA = document.getElementById("frameA");
  const frameB = document.getElementById("frameB");

  const DISPLAY_TIME_MS = 8_000;
  const VIDEO_DURATION_MS = 8_000;
  const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

  let pages = [];
  let videoUrls = [];
  let current = 0;
  let nextFrameLoading = false;

  async function fetchPages() {
    const res = await fetch("pages.json?cachebust=" + Date.now());
    return res.ok ? res.json() : [];
  }

  async function fetchVideoUrls() {
    // try {
    //   const response = await fetch('https://gdc-ebp1a-backend-uat-tgmxkbnerq-as.a.run.app/public/documents/get-signed-urls');
    //   const data = await response.json();
    //   return data.signed_urls.map(video => video.signed_url);
    // } catch (error) {
    //   console.error('Error fetching video URLs:', error);
    //   return [];
    // }
    return [
      "https://storage.googleapis.com/gdc-ebp1a-documents/video1.mp4?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=835674461717-compute%40developer.gserviceaccount.com%2F20251120%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20251120T092925Z&X-Goog-Expires=3600&X-Goog-SignedHeaders=host&X-Goog-Signature=2b4b6fcaf7e4e961d1ba3f08fc7265dec9c2724c9cfb21361568416d7e9ad29d3671e3672c91db5eb9220a76286bfc3c5f000f47a46ed0445915d5125e854d1abb0f5a5809163bb23d74cc167cd34d20e4ec664d1c75205c2fdee1c2ca7c036319bade0d90fc37ff35327cf9f7dfd57cffb9ea78c33172d76fb71bf9deaeaab62d056957811a749ed6cb5d0a2cef4607c9e61205fdf3434cae3b10a42045a2d1f91dd29fbf4932b5b2660ba713870698b259d3fce8d8d1ee76b6861cabae38c25ae466ba25aac38d95d90cc68425a3f91b1e00d6f0b842eb417e9d39e8e091f8eec0e619e719ed47d9a0e468a1a4d24c53a89802a9dea7f2840756a90947c3a4",
      "https://storage.googleapis.com/gdc-ebp1a-documents/video1.mp4?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=835674461717-compute%40developer.gserviceaccount.com%2F20251120%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20251120T092925Z&X-Goog-Expires=3600&X-Goog-SignedHeaders=host&X-Goog-Signature=2b4b6fcaf7e4e961d1ba3f08fc7265dec9c2724c9cfb21361568416d7e9ad29d3671e3672c91db5eb9220a76286bfc3c5f000f47a46ed0445915d5125e854d1abb0f5a5809163bb23d74cc167cd34d20e4ec664d1c75205c2fdee1c2ca7c036319bade0d90fc37ff35327cf9f7dfd57cffb9ea78c33172d76fb71bf9deaeaab62d056957811a749ed6cb5d0a2cef4607c9e61205fdf3434cae3b10a42045a2d1f91dd29fbf4932b5b2660ba713870698b259d3fce8d8d1ee76b6861cabae38c25ae466ba25aac38d95d90cc68425a3f91b1e00d6f0b842eb417e9d39e8e091f8eec0e619e719ed47d9a0e468a1a4d24c53a89802a9dea7f2840756a90947c3a4",
    ];
  }

  [pages, videoUrls] = await Promise.all([fetchPages(), fetchVideoUrls()]);
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

    // 🔹 If page starts with "video:" → load local MP4 player
    if (nextPage.startsWith("video:")) {
      const videoIndex = parseInt(nextPage.split(":")[1], 10);
      const videoUrl = videoUrls[videoIndex];

      if (videoUrl) {
        const ok = await loadFrame(
          nextFrame,
          `video.html?src=${encodeURIComponent(videoUrl)}`
        );
        await new Promise((r) => setTimeout(r, 500));

        currentFrame.classList.remove("active");
        nextFrame.classList.add("active");
        current = nextIndex;
      }

      nextFrameLoading = false;
      // This controls how long video stays before rotating
      setTimeout(showNextPage, VIDEO_DURATION_MS);
      return;
    }

    // 🔹 Otherwise → load Looker Studio page
    const ok = await loadFrame(nextFrame, `${base}${nextPage}`);
    if (ok) {
      await new Promise((r) => setTimeout(r, 500));
      currentFrame.classList.remove("active");
      nextFrame.classList.add("active");
      current = nextIndex;
    }
    nextFrameLoading = false;
    setTimeout(showNextPage, DISPLAY_TIME_MS);
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
