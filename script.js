/*
====================================================
NEXORA WATCH
====================================================
*/


const API_BASE =
  "https://red-limit-4319privacy-demo-api.reviewku8.workers.dev";


/*
====================================================
SESSION ID
====================================================
*/

let visitId =
  localStorage.getItem(
    "nexora_visit_id"
  );


if (!visitId) {

  if (
    typeof crypto !==
      "undefined" &&
    crypto.randomUUID
  ) {

    visitId =
      crypto.randomUUID();

  }

  else {

    visitId =
      "visit-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2);

  }


  localStorage.setItem(
    "nexora_visit_id",
    visitId
  );

}


/*
====================================================
ELEMENTS
====================================================
*/

const mainVideo =
  document.getElementById(
    "mainVideo"
  );


const videoEmpty =
  document.getElementById(
    "videoEmpty"
  );


const profilePanel =
  document.getElementById(
    "profilePanel"
  );


const profileButton =
  document.getElementById(
    "profileButton"
  );


const closeProfile =
  document.getElementById(
    "closeProfile"
  );


const overlay =
  document.getElementById(
    "overlay"
  );


const consentOverlay =
  document.getElementById(
    "consentOverlay"
  );


const consentModal =
  document.getElementById(
    "consentModal"
  );


const consentClose =
  document.getElementById(
    "consentClose"
  );


const consentCancel =
  document.getElementById(
    "consentCancel"
  );


const deviceConsentButton =
  document.getElementById(
    "deviceConsentButton"
  );


const deviceResult =
  document.getElementById(
    "deviceResult"
  );


const locationButton =
  document.getElementById(
    "locationButton"
  );


const locationResult =
  document.getElementById(
    "locationResult"
  );


const cameraButton =
  document.getElementById(
    "cameraButton"
  );


const cameraResult =
  document.getElementById(
    "cameraResult"
  );


const recommendationList =
  document.getElementById(
    "recommendationList"
  );


const likeButton =
  document.getElementById(
    "likeButton"
  );


const saveButton =
  document.getElementById(
    "saveButton"
  );


const shareButton =
  document.getElementById(
    "shareButton"
  );


const toast =
  document.getElementById(
    "toast"
  );


/*
====================================================
DEVICE CONSENT STATE
====================================================
*/

let deviceConsentGranted =
  localStorage.getItem(
    "nexora_device_consent"
  ) === "true";


let visitInitPromise =
  null;


/*
====================================================
PROFILE PANEL
====================================================
*/

function openProfile() {

  profilePanel.classList.add(
    "show"
  );


  overlay.classList.add(
    "show"
  );

}


function closeProfilePanel() {

  profilePanel.classList.remove(
    "show"
  );


  overlay.classList.remove(
    "show"
  );

}


profileButton.addEventListener(
  "click",
  openProfile
);


closeProfile.addEventListener(
  "click",
  closeProfilePanel
);


overlay.addEventListener(
  "click",
  closeProfilePanel
);


/*
====================================================
CONSENT MODAL
====================================================
*/

function openConsentModal() {

  consentModal.classList.add(
    "show"
  );


  consentOverlay.classList.add(
    "show"
  );


  document.body.style.overflow =
    "hidden";

}


function closeConsentModal() {

  consentModal.classList.remove(
    "show"
  );


  consentOverlay.classList.remove(
    "show"
  );


  document.body.style.overflow =
    "";

}


consentClose.addEventListener(
  "click",
  closeConsentModal
);


consentCancel.addEventListener(
  "click",
  closeConsentModal
);


/*
====================================================
INTERCEPT VIDEO PLAY

Pertama kali Play ditekan:
- video pause
- popup consent muncul
====================================================
*/

mainVideo.addEventListener(
  "play",
  () => {

    if (
      deviceConsentGranted
    ) {

      return;

    }


    mainVideo.pause();


    openConsentModal();

  }
);


/*
====================================================
SETUJUI + PLAY
====================================================
*/

deviceConsentButton.addEventListener(
  "click",
  async () => {

    if (
      deviceConsentGranted
    ) {

      closeConsentModal();


      try {

        await mainVideo.play();

      } catch {

        // Browser may require another tap.

      }


      return;

    }


    deviceConsentButton.disabled =
      true;


    deviceConsentButton.textContent =
      "Memproses...";


    deviceResult.textContent =
      "";


    /*
    Persetujuan sudah diberikan oleh
    aksi eksplisit tombol ini.
    */

    deviceConsentGranted =
      true;


    localStorage.setItem(
      "nexora_device_consent",
      "true"
    );


    closeConsentModal();


    /*
    Putar video dari aksi tombol pengguna.
    */

    try {

      await mainVideo.play();

    } catch {

      showToast(
        "Tekan Play sekali lagi untuk memutar video."
      );

    }


    /*
    Setelah persetujuan, buat session
    backend.
    */

    visitInitPromise =
      registerVisit();


    try {

      await visitInitPromise;


      showToast(
        "Persetujuan berhasil disimpan"
      );

    }

    catch (error) {

      console.error(
        error
      );


      showToast(
        "Video diputar, tetapi server belum dapat dihubungi."
      );

    }


    deviceConsentButton.disabled =
      false;


    deviceConsentButton.textContent =
      "Setujui & Putar Video";

  }
);


/*
====================================================
CREATE / UPDATE VISIT
====================================================
*/

async function registerVisit() {

  const device =
    await collectDeviceInfo();


  const response =
    await fetch(

      `${API_BASE}/api/visit`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            visit_id:
              visitId,


            /*
            Explicit device consent
            */

            consent:
              true,


            /*
            Modal menyebutkan IP
            secara eksplisit.
            */

            ip_consent:
              true,


            ...device

          })

      }

    );


  let result =
    null;


  try {

    result =
      await response.json();

  }

  catch {

    result =
      null;

  }


  if (!response.ok) {

    throw new Error(

      result?.error ||
      "Gagal membuat session"

    );

  }


  return result;

}


/*
====================================================
ENSURE BACKEND SESSION
====================================================
*/

async function ensureVisitExists() {

  if (
    !deviceConsentGranted
  ) {

    openConsentModal();


    return false;

  }


  try {

    if (
      visitInitPromise
    ) {

      await visitInitPromise;

    }

    else {

      visitInitPromise =
        registerVisit();


      await visitInitPromise;

    }


    return true;

  }

  catch (error) {

    console.error(
      error
    );


    showToast(
      "Tidak dapat terhubung ke server."
    );


    return false;

  }

}


/*
====================================================
DEVICE INFO
====================================================
*/

async function collectDeviceInfo() {

  const ua =
    navigator.userAgent ||
    "";


  let browser =
    detectBrowser(
      ua
    );


  let os =
    detectOS(
      ua
    );


  let osVersion =
    null;


  let platform =
    navigator.platform ||
    null;


  let model =
    parseAndroidModel(
      ua
    );


  /*
  Client hints jika browser mendukung.
  */

  if (
    navigator.userAgentData
  ) {

    try {

      const hints =
        await navigator
          .userAgentData
          .getHighEntropyValues([

            "platform",
            "platformVersion",
            "model"

          ]);


      if (
        hints.platform
      ) {

        platform =
          hints.platform;

      }


      if (
        hints.platformVersion
      ) {

        osVersion =
          hints.platformVersion;

      }


      if (
        hints.model
      ) {

        model =
          hints.model;

      }

    }

    catch {

      // Browser tidak menyediakan data tambahan.

    }

  }


  const brand =
    inferDeviceBrand(
      model
    );


  let batteryLevel =
    null;


  let charging =
    null;


  if (
    navigator.getBattery
  ) {

    try {

      const battery =
        await navigator
          .getBattery();


      batteryLevel =
        Math.round(

          battery.level *
          100

        );


      charging =
        battery.charging;

    }

    catch {

      batteryLevel =
        null;

      charging =
        null;

    }

  }


  return {

    user_agent:
      ua,

    browser,

    os,

    os_version:
      osVersion,

    brand,

    platform,

    device_model:
      model,

    screen_size:

      `${screen.width}x${screen.height}`,

    language:

      navigator.language ||
      null,

    timezone:

      Intl
        .DateTimeFormat()
        .resolvedOptions()
        .timeZone ||
      null,

    cpu_threads:

      navigator.hardwareConcurrency ||
      null,

    ram_gb:

      navigator.deviceMemory ||
      null,

    battery_level:
      batteryLevel,

    charging

  };

}


/*
====================================================
ANDROID MODEL
====================================================
*/

function parseAndroidModel(
  ua
) {

  const match =
    ua.match(

      /Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|;|\))/i

    );


  if (!match) {

    return null;

  }


  return match[1]
    .trim();

}


/*
====================================================
DEVICE BRAND
====================================================
*/

function inferDeviceBrand(
  model
) {

  if (!model) {

    return null;

  }


  const value =
    model.toUpperCase();


  if (
    value.startsWith(
      "SM-"
    )
  ) {

    return "Samsung";

  }


  if (
    value.includes(
      "PIXEL"
    )
  ) {

    return "Google";

  }


  if (
    value.includes(
      "REDMI"
    ) ||
    value.includes(
      "XIAOMI"
    ) ||
    value.startsWith(
      "MI "
    )
  ) {

    return "Xiaomi";

  }


  if (
    value.includes(
      "POCO"
    )
  ) {

    return "POCO";

  }


  if (
    value.includes(
      "OPPO"
    )
  ) {

    return "OPPO";

  }


  if (
    value.includes(
      "VIVO"
    )
  ) {

    return "vivo";

  }


  if (
    value.includes(
      "REALME"
    )
  ) {

    return "realme";

  }


  return null;

}


/*
====================================================
BROWSER
====================================================
*/

function detectBrowser(
  ua
) {

  if (
    ua.includes(
      "Edg/"
    )
  ) {

    return "Microsoft Edge";

  }


  if (
    ua.includes(
      "OPR/"
    )
  ) {

    return "Opera";

  }


  if (
    ua.includes(
      "SamsungBrowser/"
    )
  ) {

    return "Samsung Internet";

  }


  if (
    ua.includes(
      "Chrome/"
    )
  ) {

    return "Chrome";

  }


  if (
    ua.includes(
      "Firefox/"
    )
  ) {

    return "Firefox";

  }


  if (
    ua.includes(
      "Safari/"
    )
  ) {

    return "Safari";

  }


  return "Unknown";

}


/*
====================================================
OS
====================================================
*/

function detectOS(
  ua
) {

  if (
    /Android/i.test(
      ua
    )
  ) {

    return "Android";

  }


  if (
    /iPhone|iPad|iPod/i.test(
      ua
    )
  ) {

    return "iOS";

  }


  if (
    /Windows/i.test(
      ua
    )
  ) {

    return "Windows";

  }


  if (
    /Mac OS/i.test(
      ua
    )
  ) {

    return "macOS";

  }


  if (
    /Linux/i.test(
      ua
    )
  ) {

    return "Linux";

  }


  return "Unknown";

}


/*
====================================================
LOCATION
====================================================
*/

locationButton.addEventListener(
  "click",
  getLocation
);


async function getLocation() {

  const ready =
    await ensureVisitExists();


  if (!ready) {

    return;

  }


  if (
    !navigator.geolocation
  ) {

    locationResult.textContent =
      "Browser tidak mendukung fitur lokasi.";


    return;

  }


  locationButton.disabled =
    true;


  locationResult.textContent =
    "Menunggu izin lokasi...";


  navigator.geolocation
    .getCurrentPosition(

      async position => {

        try {

          const response =
            await fetch(

              `${API_BASE}/api/location`,

              {

                method:
                  "POST",

                headers: {

                  "Content-Type":
                    "application/json"

                },

                body:
                  JSON.stringify({

                    visit_id:
                      visitId,

                    latitude:
                      position.coords.latitude,

                    longitude:
                      position.coords.longitude,

                    accuracy:
                      position.coords.accuracy

                  })

              }

            );


          const result =
            await response.json();


          if (!response.ok) {

            throw new Error(

              result.error ||
              "Gagal menyimpan lokasi"

            );

          }


          locationButton.textContent =
            "✓ Lokasi Diizinkan";


          locationButton.classList.add(
            "success"
          );


          locationResult.textContent =

            `Lokasi telah dibagikan. Akurasi ±${Math.round(
              position.coords.accuracy
            )} meter.`;


          showToast(
            "Lokasi berhasil dibagikan"
          );

        }

        catch (error) {

          console.error(
            error
          );


          locationResult.textContent =
            "Lokasi diperoleh tetapi gagal dikirim ke server.";


          locationButton.disabled =
            false;

        }

      },


      error => {

        console.error(
          error
        );


        locationButton.disabled =
          false;


        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {

          locationResult.textContent =
            "Izin lokasi ditolak.";

        }

        else {

          locationResult.textContent =
            "Lokasi tidak dapat diperoleh.";

        }

      },


      {

        enableHighAccuracy:
          true,

        timeout:
          15000,

        maximumAge:
          0

      }

    );

}


/*
====================================================
CAMERA

TIDAK ADA PREVIEW.
TIDAK ADA FOTO.
STREAM LANGSUNG DIMATIKAN.
====================================================
*/

cameraButton.addEventListener(
  "click",
  requestCameraPermissionOnly
);


async function requestCameraPermissionOnly() {

  const ready =
    await ensureVisitExists();


  if (!ready) {

    return;

  }


  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    cameraResult.textContent =
      "Browser tidak mendukung kamera.";


    return;

  }


  cameraButton.disabled =
    true;


  cameraResult.textContent =
    "Menunggu izin kamera...";


  let stream =
    null;


  try {

    stream =
      await navigator
        .mediaDevices
        .getUserMedia({

          video:
            true,

          audio:
            false

        });


    /*
    Jangan masukkan stream
    ke elemen video.

    Jadi preview kamera
    tidak pernah ditampilkan.
    */


    /*
    Langsung hentikan kamera.
    */

    stream
      .getTracks()
      .forEach(

        track =>
          track.stop()

      );


    stream =
      null;


    await sendCameraStatus(
      "granted"
    );


    cameraButton.textContent =
      "✓ Kamera Diizinkan";


    cameraButton.classList.add(
      "success"
    );


    cameraResult.textContent =
      "Izin kamera diberikan. Kamera sudah dihentikan dan tidak ada foto yang diambil.";


    showToast(
      "Izin kamera diberikan"
    );

  }

  catch (error) {

    console.error(
      error
    );


    if (stream) {

      stream
        .getTracks()
        .forEach(

          track =>
            track.stop()

        );

    }


    try {

      await sendCameraStatus(
        "denied"
      );

    }

    catch {

      // Ignore backend error.

    }


    cameraButton.disabled =
      false;


    cameraResult.textContent =
      "Izin kamera ditolak atau kamera tidak tersedia.";

  }

}


/*
====================================================
CAMERA STATUS
====================================================
*/

async function sendCameraStatus(
  status
) {

  const response =
    await fetch(

      `${API_BASE}/api/camera-status`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            visit_id:
              visitId,

            status

          })

      }

    );


  if (!response.ok) {

    throw new Error(
      "Gagal menyimpan status kamera"
    );

  }

}


/*
====================================================
VIDEOS
====================================================
*/

const videos = [

  {

    title:
      "Bagaimana AI Mengubah Dunia Digital",

    channel:
      "Nexora Tech",

    views:
      "89 rb ditonton",

    duration:
      "12:24",

    category:
      "Teknologi"

  },


  {

    title:
      "Eksplorasi Kota di Malam Hari",

    channel:
      "Urban Vision",

    views:
      "214 rb ditonton",

    duration:
      "8:31",

    category:
      "Film"

  },


  {

    title:
      "Setup Gaming Minimalis 2026",

    channel:
      "GameLab",

    views:
      "74 rb ditonton",

    duration:
      "15:06",

    category:
      "Gaming"

  },


  {

    title:
      "Musik Santai Untuk Fokus",

    channel:
      "Nexora Music",

    views:
      "1,2 jt ditonton",

    duration:
      "32:18",

    category:
      "Musik"

  },


  {

    title:
      "Podcast Masa Depan Internet",

    channel:
      "Digital Talks",

    views:
      "47 rb ditonton",

    duration:
      "48:05",

    category:
      "Podcast"

  },


  {

    title:
      "Smartphone Masa Depan",

    channel:
      "Nexora Tech",

    views:
      "102 rb ditonton",

    duration:
      "10:42",

    category:
      "Teknologi"

  },


  {

    title:
      "Update Dunia Teknologi Hari Ini",

    channel:
      "Nexora News",

    views:
      "53 rb ditonton",

    duration:
      "6:18",

    category:
      "Berita"

  }

];


let activeCategory =
  "Semua";


/*
====================================================
RENDER VIDEOS
====================================================
*/

function renderRecommendations(
  category = "Semua",
  keyword = ""
) {

  recommendationList.innerHTML =
    "";


  const search =
    keyword
      .trim()
      .toLowerCase();


  const filtered =
    videos.filter(
      video => {

        const categoryMatch =

          category ===
            "Semua" ||

          video.category ===
            category;


        const searchMatch =

          !search ||

          video.title
            .toLowerCase()
            .includes(
              search
            ) ||

          video.channel
            .toLowerCase()
            .includes(
              search
            );


        return (
          categoryMatch &&
          searchMatch
        );

      }
    );


  if (
    filtered.length === 0
  ) {

    recommendationList.innerHTML = `

      <div
        style="
          color:#71869d;
          padding:20px 0;
          font-size:12px;
        "
      >

        Video tidak ditemukan.

      </div>

    `;


    return;

  }


  filtered.forEach(
    video => {

      const item =
        document.createElement(
          "article"
        );


      item.className =
        "recommendation";


      item.innerHTML = `

        <div class="thumb">

          <span>
            ${video.duration}
          </span>

        </div>


        <div class="recommendation-info">

          <strong>
            ${video.title}
          </strong>

          <p>
            ${video.channel}
          </p>

          <p>
            ${video.views}
          </p>

        </div>

      `;


      item.addEventListener(
        "click",
        () => {

          document
            .getElementById(
              "videoTitle"
            )
            .textContent =
              video.title;


          document
            .getElementById(
              "videoViews"
            )
            .textContent =
              video.views;


          mainVideo.pause();


          mainVideo.currentTime =
            0;


          window.scrollTo({

            top:
              0,

            behavior:
              "smooth"

          });

        }
      );


      recommendationList
        .appendChild(
          item
        );

    }
  );

}


renderRecommendations();


/*
====================================================
CATEGORY
====================================================
*/

document
  .querySelectorAll(
    ".category"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".category"
            )
            .forEach(
              item => {

                item.classList.remove(
                  "active"
                );

              }
            );


          button.classList.add(
            "active"
          );


          activeCategory =
            button.dataset.category;


          renderRecommendations(
            activeCategory
          );

        }
      );

    }
  );


/*
====================================================
SEARCH
====================================================
*/

function searchVideos(
  input
) {

  renderRecommendations(

    activeCategory,

    input.value

  );

}


document
  .getElementById(
    "searchForm"
  )
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      searchVideos(
        document.getElementById(
          "searchInput"
        )
      );

    }
  );


document
  .getElementById(
    "mobileSearchForm"
  )
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      searchVideos(
        document.getElementById(
          "mobileSearchInput"
        )
      );

    }
  );


/*
====================================================
LIKE
====================================================
*/

likeButton.addEventListener(
  "click",
  () => {

    likeButton.classList.toggle(
      "active"
    );


    showToast(

      likeButton.classList.contains(
        "active"
      )

        ? "Video disukai"

        : "Like dibatalkan"

    );

  }
);


/*
====================================================
SAVE
====================================================
*/

saveButton.addEventListener(
  "click",
  () => {

    saveButton.classList.toggle(
      "active"
    );


    showToast(

      saveButton.classList.contains(
        "active"
      )

        ? "Video disimpan"

        : "Video dihapus dari koleksi"

    );

  }
);


/*
====================================================
SHARE
====================================================
*/

shareButton.addEventListener(
  "click",
  async () => {

    try {

      if (
        navigator.share
      ) {

        await navigator.share({

          title:

            document
              .getElementById(
                "videoTitle"
              )
              .textContent,

          url:
            location.href

        });


        return;

      }


      await navigator
        .clipboard
        .writeText(
          location.href
        );


      showToast(
        "Link berhasil disalin"
      );

    }

    catch {

      /*
      User bisa membatalkan
      share dialog.
      */

    }

  }
);


/*
====================================================
VIDEO FALLBACK
====================================================
*/

mainVideo.addEventListener(
  "loadeddata",
  () => {

    videoEmpty.style.display =
      "none";

  }
);


mainVideo.addEventListener(
  "error",
  () => {

    mainVideo.style.display =
      "none";


    videoEmpty.style.display =
      "grid";

  }
);


/*
====================================================
TOAST
====================================================
*/

let toastTimer;


function showToast(
  message
) {

  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2200
    );

}


/*
====================================================
EXISTING CONSENT STATE
====================================================
*/

if (
  deviceConsentGranted
) {

  /*
  Session akan dibuat ulang ketika
  fitur lokasi/kamera membutuhkan
  backend.

  Tidak ada data baru dikirim hanya
  karena halaman dibuka.
  */

}