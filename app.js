const STORAGE_KEY = "speedDials";
const THEME_KEY = "speedDialTheme";
const DIAL_SIZE_KEY = "speedDialSize";
const DIAL_SIZES = ["small", "medium", "large"];

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
const iconUrlInput = document.getElementById("iconUrlInput");
const logoLookupButton = document.getElementById("logoLookupButton");
const iconFileInput = document.getElementById("iconFileInput");
const formError = document.getElementById("formError");
const themeButton = document.getElementById("themeButton");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");
const menu = document.getElementById("menu");
const menuButton = document.getElementById("menuButton");
const menuDropdown = document.getElementById("menuDropdown");
const dialogTitle = document.getElementById("dialogTitle");
const submitButton = form.querySelector(".primary-button");
const importButton = document.getElementById("importButton");
const exportButton = document.getElementById("exportButton");
const importInput = document.getElementById("importInput");
const dialSizeButtons = document.getElementById("dialSizeButtons");
const sizeInput = document.getElementById("sizeInput");

let dials = [];
let editingId = null;
let draggedDialId = null;

function normalizeUrl(value) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Enter a valid web address.");
  }
  return url.href;
}

function secondLevelDomain(url) {
  const hostname = new URL(url).hostname.replace(/^www\./i, "");
  const labels = hostname.split(".");
  const domain = labels.length > 1 ? labels[labels.length - 2] : hostname;
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

function normalizeIconUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Enter a valid icon URL.");
  }
  return url.href;
}

function readIconFile(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 750 * 1024) {
      reject(new Error("The icon image must be smaller than 750 KB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the icon image."));
    reader.readAsDataURL(file);
  });
}

function getStorage() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return {
      get: () => new Promise(resolve => chrome.storage.local.get([STORAGE_KEY, THEME_KEY, DIAL_SIZE_KEY], result => resolve(result))),
      set: value => new Promise(resolve => chrome.storage.local.set(value, resolve))
    };
  }

  return {
    get: () => Promise.resolve({
      [STORAGE_KEY]: JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"),
      [THEME_KEY]: localStorage.getItem(THEME_KEY),
      [DIAL_SIZE_KEY]: localStorage.getItem(DIAL_SIZE_KEY)
    }),
    set: value => {
      if (value[STORAGE_KEY] !== undefined) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value[STORAGE_KEY]));
      }
      if (value[THEME_KEY] !== undefined) {
        localStorage.setItem(THEME_KEY, value[THEME_KEY]);
      }
      if (value[DIAL_SIZE_KEY] !== undefined) {
        localStorage.setItem(DIAL_SIZE_KEY, value[DIAL_SIZE_KEY]);
      }
      return Promise.resolve();
    }
  };
}

function applyTheme(theme) {
  const selectedTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = selectedTheme;
  themeIcon.textContent = selectedTheme === "dark" ? "\u2600" : "\u263D";
  const nextTheme = selectedTheme === "dark" ? "light" : "dark";
  themeLabel.textContent = `${nextTheme[0].toUpperCase()}${nextTheme.slice(1)} theme`;
  themeButton.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
}

function normalizeDialSize(size) {
  return DIAL_SIZES.includes(size) ? size : "medium";
}

function applyDialSize(size) {
  const selectedSize = normalizeDialSize(size);
  document.body.dataset.dialSize = selectedSize;
  dialSizeButtons.querySelectorAll("[data-size]").forEach(button => {
    const selected = button.dataset.size === selectedSize;
    button.setAttribute("aria-checked", String(selected));
  });
}

async function loadTheme(storage) {
  const stored = await storage.get();
  applyTheme(stored[THEME_KEY] || "light");
  applyDialSize(stored[DIAL_SIZE_KEY]);
  return stored;
}

themeButton.addEventListener("click", async () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  await getStorage().set({ [THEME_KEY]: nextTheme });
  closeMenu();
});

dialSizeButtons.addEventListener("click", async event => {
  const button = event.target.closest("[data-size]");
  if (!button) return;
  const selectedSize = normalizeDialSize(button.dataset.size);
  applyDialSize(selectedSize);
  await getStorage().set({ [DIAL_SIZE_KEY]: selectedSize });
});

function closeMenu() {
  menuDropdown.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
}

menuButton.addEventListener("click", () => {
  const opening = menuDropdown.hidden;
  menuDropdown.hidden = !opening;
  menuButton.setAttribute("aria-expanded", String(opening));
});

document.addEventListener("click", event => {
  if (!menu.contains(event.target)) closeMenu();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenu();
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

function renderDials() {
  grid.replaceChildren();

  dials.forEach(dial => {
    const article = document.createElement("article");
    article.className = "dial";
    if (DIAL_SIZES.includes(dial.size)) {
      article.classList.add(`dial-${dial.size}`);
    }
    article.dataset.dialId = dial.id;
    article.draggable = true;
    article.addEventListener("dragstart", event => {
      draggedDialId = dial.id;
      article.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", dial.id);
    });
    article.addEventListener("dragover", event => {
      if (!draggedDialId || draggedDialId === dial.id) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      grid.querySelectorAll(".drag-over").forEach(item => item.classList.remove("drag-over"));
      article.classList.add("drag-over");
    });
    article.addEventListener("dragleave", event => {
      if (!article.contains(event.relatedTarget)) article.classList.remove("drag-over");
    });
    article.addEventListener("drop", async event => {
      event.preventDefault();
      article.classList.remove("drag-over");
      if (!draggedDialId || draggedDialId === dial.id) return;

      const fromIndex = dials.findIndex(item => item.id === draggedDialId);
      if (fromIndex === -1) return;
      const [movedDial] = dials.splice(fromIndex, 1);
      const targetIndex = dials.findIndex(item => item.id === dial.id);
      const insertBefore = event.offsetX <= article.offsetWidth / 2;
      dials.splice(targetIndex + (insertBefore ? 0 : 1), 0, movedDial);
      draggedDialId = null;
      await saveDials();
    });
    article.addEventListener("dragend", () => {
      draggedDialId = null;
      grid.querySelectorAll(".dragging, .drag-over").forEach(item => {
        item.classList.remove("dragging", "drag-over");
      });
    });

    const link = document.createElement("a");
    link.className = "dial-link";
    link.href = dial.url;
    link.setAttribute("aria-label", `Open ${dial.name}`);

    const icon = document.createElement("span");
    icon.className = "dial-icon";

    const name = document.createElement("span");
    name.className = "dial-name";
    name.textContent = dial.name;

    if (dial.icon) {
      const image = document.createElement("img");
      image.src = dial.icon;
      image.alt = "";
      image.width = 48;
      image.height = 48;
      icon.appendChild(image);
    }
    link.append(icon, name);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "\u00d7";
    deleteButton.setAttribute("aria-label", `Delete ${dial.name}`);
    deleteButton.addEventListener("click", async () => {
      if (!window.confirm(`Delete "${dial.name}"?`)) return;
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
  sizeInput.value = "";
  logoLookupButton.hidden = true;
  dialogTitle.textContent = "Add speed dial";
  submitButton.textContent = "Add";
  backdrop.hidden = false;
  urlInput.focus();
}

function openEditDialog(dial) {
  form.reset();
  formError.textContent = "";
  editingId = dial.id;
  sizeInput.value = DIAL_SIZES.includes(dial.size) ? dial.size : "";
  logoLookupButton.hidden = false;
  dialogTitle.textContent = "Edit speed dial";
  submitButton.textContent = "Save";
  nameInput.value = dial.name;
  urlInput.value = dial.url;
  iconUrlInput.value = dial.icon && !dial.icon.startsWith("data:image/") ? dial.icon : "";
  backdrop.hidden = false;
  urlInput.focus();
  urlInput.select();
}

logoLookupButton.addEventListener("click", () => {
  const webAddress = urlInput.value.trim();
  if (!webAddress) {
    formError.textContent = "Type a web address first.";
    urlInput.focus();
    return;
  }

  let domain;
  try {
    domain = new URL(normalizeUrl(webAddress)).hostname.replace(/^www\./i, "");
  } catch (error) {
    formError.textContent = error.message || "Enter a valid web address.";
    urlInput.focus();
    return;
  }

  formError.textContent = "";
  const query = encodeURIComponent(`${domain} logo`);
  window.open(`https://www.google.com/search?q=${query}`, "_blank", "noopener,noreferrer");
});

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

  let url;
  try {
    url = normalizeUrl(urlInput.value);
  } catch (error) {
    formError.textContent = error.message || "Enter a valid web address.";
    urlInput.focus();
    return;
  }

  const dialName = name || secondLevelDomain(url);

  let icon = "";
  try {
    icon = normalizeIconUrl(iconUrlInput.value);
  } catch (error) {
    formError.textContent = error.message;
    iconUrlInput.focus();
    return;
  }

  if (iconFileInput.files[0]) {
    try {
      icon = await readIconFile(iconFileInput.files[0]);
    } catch (error) {
      formError.textContent = error.message;
      iconFileInput.focus();
      return;
    }
  }

  const dialSize = normalizeDialSize(sizeInput.value);
  const perDialSize = sizeInput.value && DIAL_SIZES.includes(sizeInput.value)
    ? dialSize
    : undefined;

  if (editingId) {
    dials = dials.map(dial => dial.id === editingId
      ? { ...dial, name: dialName, url, icon: icon || undefined, size: perDialSize }
      : dial);
  } else {
    dials.push({
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now()),
      name: dialName,
      url,
      icon: icon || undefined,
      size: perDialSize
    });
  }
  await saveDials();
  closeDialog();
});

exportButton.addEventListener("click", () => {
  closeMenu();
  const exportData = dials.map(({ id, name, url, icon, size }) => ({ id, name, url, icon, size }));
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

importButton.addEventListener("click", () => {
  closeMenu();
  importInput.click();
});

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
        url: normalizeUrl(dial.url),
        icon: typeof dial.icon === "string" && dial.icon
          ? dial.icon.startsWith("data:image/")
            ? dial.icon
            : normalizeIconUrl(dial.icon)
          : undefined,
        size: DIAL_SIZES.includes(dial.size) ? dial.size : undefined
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
