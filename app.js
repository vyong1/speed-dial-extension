const STORAGE_KEY = "speedDials";
const THEME_KEY = "speedDialTheme";

const defaultDials = [
  { id: "google", name: "Google", url: "https://www.google.com/" },
  { id: "youtube", name: "YouTube", url: "https://www.youtube.com/" },
  { id: "github", name: "GitHub", url: "https://github.com/" }
];

const grid = document.getElementById("dialGrid");
const backdrop = document.getElementById("dialogBackdrop");
const form = document.getElementById("dialForm");
const nameInput = document.getElementById("nameInput");
const urlInput = document.getElementById("urlInput");
const formError = document.getElementById("formError");
const themeButton = document.getElementById("themeButton");
const themeIcon = document.getElementById("themeIcon");
const dialogTitle = document.getElementById("dialogTitle");
const submitButton = form.querySelector(".primary-button");
const importButton = document.getElementById("importButton");
const exportButton = document.getElementById("exportButton");
const importInput = document.getElementById("importInput");

let dials = [];
let editingId = null;

function normalizeUrl(value) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Enter a valid web address.");
  }
  return url.href;
}

function getStorage() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return {
      get: () => new Promise(resolve => chrome.storage.local.get([STORAGE_KEY, THEME_KEY], result => resolve(result))),
      set: value => new Promise(resolve => chrome.storage.local.set(value, resolve))
    };
  }

  return {
    get: () => Promise.resolve({
      [STORAGE_KEY]: JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"),
      [THEME_KEY]: localStorage.getItem(THEME_KEY)
    }),
    set: value => {
      if (value[STORAGE_KEY] !== undefined) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value[STORAGE_KEY]));
      }
      if (value[THEME_KEY] !== undefined) {
        localStorage.setItem(THEME_KEY, value[THEME_KEY]);
      }
      return Promise.resolve();
    }
  };
}

function applyTheme(theme) {
  const selectedTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = selectedTheme;
  themeIcon.textContent = selectedTheme === "dark" ? "\u2600" : "\u263D";
  themeButton.setAttribute("aria-label", `Switch to ${selectedTheme === "dark" ? "light" : "dark"} theme`);
  themeButton.title = `Switch to ${selectedTheme === "dark" ? "light" : "dark"} theme`;
}

async function loadTheme(storage) {
  const stored = await storage.get();
  applyTheme(stored[THEME_KEY] || "light");
  return stored;
}

themeButton.addEventListener("click", async () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  await getStorage().set({ [THEME_KEY]: nextTheme });
});

async function loadDials() {
  const storage = getStorage();
  const stored = await storage.get();
  dials = stored && stored[STORAGE_KEY] ? stored[STORAGE_KEY] : defaultDials;
  if (!stored || !stored[STORAGE_KEY]) {
    await storage.set({ [STORAGE_KEY]: dials });
  }
  renderDials();
}

async function saveDials() {
  await getStorage().set({ [STORAGE_KEY]: dials });
  renderDials();
}

function faviconUrl(url) {
  const parsed = new URL(url);
  return `${parsed.origin}/favicon.ico`;
}

function fallbackFavicon(url) {
  const origin = encodeURIComponent(new URL(url).origin);
  return `https://www.google.com/s2/favicons?domain_url=${origin}&sz=128`;
}

function renderDials() {
  grid.replaceChildren();

  dials.forEach(dial => {
    const article = document.createElement("article");
    article.className = "dial";

    const link = document.createElement("a");
    link.className = "dial-link";
    link.href = dial.url;
    link.setAttribute("aria-label", `Open ${dial.name}`);

    const icon = document.createElement("span");
    icon.className = "dial-icon";

    const image = document.createElement("img");
    image.src = dial.icon || faviconUrl(dial.url);
    image.alt = "";
    image.width = 48;
    image.height = 48;
    image.addEventListener("error", () => {
      if (!image.dataset.fallback) {
        image.dataset.fallback = "true";
        image.src = fallbackFavicon(dial.url);
      }
    }, { once: false });

    const name = document.createElement("span");
    name.className = "dial-name";
    name.textContent = dial.name;

    icon.appendChild(image);
    link.append(icon, name);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "\u00d7";
    deleteButton.setAttribute("aria-label", `Delete ${dial.name}`);
    deleteButton.addEventListener("click", async () => {
      dials = dials.filter(item => item.id !== dial.id);
      await saveDials();
    });

    const editButton = document.createElement("button");
    editButton.className = "edit-button";
    editButton.type = "button";
    editButton.textContent = "\u270E";
    editButton.setAttribute("aria-label", `Edit ${dial.name}`);
    editButton.addEventListener("click", () => openEditDialog(dial));

    article.append(link, editButton, deleteButton);
    grid.appendChild(article);
  });
}

function openDialog() {
  form.reset();
  formError.textContent = "";
  editingId = null;
  dialogTitle.textContent = "Add speed dial";
  submitButton.textContent = "Add";
  backdrop.hidden = false;
  nameInput.focus();
}

function openEditDialog(dial) {
  form.reset();
  formError.textContent = "";
  editingId = dial.id;
  dialogTitle.textContent = "Edit speed dial";
  submitButton.textContent = "Save";
  nameInput.value = dial.name;
  urlInput.value = dial.url;
  backdrop.hidden = false;
  nameInput.focus();
  nameInput.select();
}

function closeDialog() {
  backdrop.hidden = true;
}

document.getElementById("addButton").addEventListener("click", openDialog);
document.getElementById("cancelButton").addEventListener("click", closeDialog);

backdrop.addEventListener("click", event => {
  if (event.target === backdrop) closeDialog();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !backdrop.hidden) closeDialog();
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  formError.textContent = "";

  const name = nameInput.value.trim();
  if (!name) {
    formError.textContent = "Enter a name.";
    nameInput.focus();
    return;
  }

  let url;
  try {
    url = normalizeUrl(urlInput.value);
  } catch (error) {
    formError.textContent = error.message || "Enter a valid web address.";
    urlInput.focus();
    return;
  }

  if (editingId) {
    dials = dials.map(dial => dial.id === editingId ? { ...dial, name, url } : dial);
  } else {
    dials.push({
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now()),
      name,
      url
    });
  }
  await saveDials();
  closeDialog();
});

exportButton.addEventListener("click", () => {
  const exportData = dials.map(({ id, name, url }) => ({ id, name, url }));
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "speed-dials.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
});

importButton.addEventListener("click", () => importInput.click());

importInput.addEventListener("change", async () => {
  const file = importInput.files[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) {
      throw new Error("The imported file must contain a speed dial list.");
    }

    dials = imported.map((dial, index) => {
      if (!dial || typeof dial.name !== "string" || typeof dial.url !== "string") {
        throw new Error(`Invalid speed dial at position ${index + 1}.`);
      }
      const name = dial.name.trim();
      if (!name) throw new Error(`Speed dial ${index + 1} needs a name.`);
      return {
        id: typeof dial.id === "string" && dial.id ? dial.id : String(Date.now() + index),
        name,
        url: normalizeUrl(dial.url)
      };
    });
    await saveDials();
  } catch (error) {
    window.alert(error.message || "Could not import speed dials.");
  } finally {
    importInput.value = "";
  }
});

async function initialize() {
  const storage = getStorage();
  await loadTheme(storage);
  await loadDials();
}

initialize();
