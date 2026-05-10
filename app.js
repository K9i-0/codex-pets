"use strict";

const TILE = 32;
const VIEW_W = 960;
const VIEW_H = 540;
const LEVEL_H = 15;
const EDIT_W = 72;
const CELL_W = 192;
const CELL_H = 208;
const PET_DB_NAME = "codex-pet-run-pets";
const PET_DB_VERSION = 1;

const BUILT_IN_PETS = [
  {
    id: "yumemin",
    name: "Yumemin",
    description: "Blue whale-like Codex pet",
    src: "assets/pets/yumemin/spritesheet.webp",
  },
  {
    id: "chikuwa",
    name: "Chikuwa",
    description: "Toasted chikuwa companion",
    src: "assets/pets/chikuwa/spritesheet.webp",
  },
  {
    id: "yametaro",
    name: "Yametaro",
    description: "Chibi coder with glasses",
    src: "assets/pets/yametaro/spritesheet.webp",
  },
  {
    id: "sobaya",
    name: "Sobaya",
    description: "Masked soba-bar buddy",
    src: "assets/pets/sobaya/spritesheet.webp",
  },
  {
    id: "tako-san",
    name: "tako-san",
    description: "Hooded void-octopus companion",
    src: "assets/pets/tako-san/spritesheet.webp",
  },
];

const ANIMS = {
  idle: { row: 0, frames: 6, speed: 160 },
  right: { row: 1, frames: 8, speed: 105 },
  left: { row: 2, frames: 8, speed: 105 },
  jump: { row: 4, frames: 5, speed: 130 },
  failed: { row: 5, frames: 8, speed: 130 },
  wait: { row: 6, frames: 6, speed: 150 },
};

const TILES = {
  ".": { name: "Erase", color: "transparent", solid: false },
  "#": { name: "Ground", color: "#6b4f35", solid: true },
  "B": { name: "Block", color: "#a65f38", solid: true },
  "^": { name: "Spike", color: "#ef626c", hazard: true },
  "o": { name: "Coin", color: "#f2c14e", coin: true },
};

const PALETTE = [
  ["#", "Ground"],
  ["B", "Block"],
  ["^", "Spike"],
  ["o", "Coin"],
  [".", "Erase"],
  ["S", "Start"],
  ["G", "Goal"],
];

const BUILT_IN_LEVELS = [
  buildLevel({
    id: "ridge-run",
    title: "Ridge Run",
    author: "Codex",
    width: 78,
    spawn: { x: 2, y: 9 },
    goal: { x: 73, y: 8 },
    rects: [
      [0, 13, 78, 2, "#"],
      [8, 10, 6, 1, "B"],
      [18, 12, 5, 1, "#"],
      [27, 10, 5, 1, "B"],
      [36, 11, 8, 1, "#"],
      [49, 9, 5, 1, "B"],
      [60, 11, 7, 1, "#"],
      [70, 10, 4, 1, "B"],
      [24, 13, 3, 1, "^"],
      [45, 13, 3, 1, "^"],
      [68, 13, 2, 1, "^"],
    ],
    coins: [
      [9, 8],
      [11, 8],
      [19, 10],
      [28, 8],
      [30, 8],
      [38, 9],
      [41, 9],
      [50, 7],
      [62, 9],
      [72, 8],
    ],
  }),
  buildLevel({
    id: "block-market",
    title: "Block Market",
    author: "Aoi",
    width: 86,
    spawn: { x: 2, y: 9 },
    goal: { x: 81, y: 5 },
    rects: [
      [0, 13, 20, 2, "#"],
      [23, 13, 16, 2, "#"],
      [43, 13, 16, 2, "#"],
      [63, 13, 23, 2, "#"],
      [8, 9, 4, 1, "B"],
      [15, 7, 4, 1, "B"],
      [25, 10, 4, 1, "B"],
      [32, 8, 4, 1, "B"],
      [45, 10, 5, 1, "B"],
      [54, 8, 3, 1, "B"],
      [64, 10, 5, 1, "B"],
      [73, 8, 5, 1, "B"],
      [20, 14, 3, 1, "^"],
      [39, 14, 4, 1, "^"],
      [59, 14, 4, 1, "^"],
    ],
    coins: [
      [9, 7],
      [16, 5],
      [26, 8],
      [33, 6],
      [46, 8],
      [55, 6],
      [65, 8],
      [74, 6],
      [82, 3],
    ],
  }),
  buildLevel({
    id: "pet-cup-01",
    title: "Pet Cup 01",
    author: "Mina",
    width: 96,
    spawn: { x: 2, y: 9 },
    goal: { x: 91, y: 9 },
    rects: [
      [0, 13, 96, 2, "#"],
      [10, 11, 8, 1, "#"],
      [24, 9, 4, 1, "B"],
      [33, 11, 6, 1, "#"],
      [45, 8, 6, 1, "B"],
      [57, 10, 5, 1, "#"],
      [68, 7, 4, 1, "B"],
      [78, 10, 8, 1, "#"],
      [20, 13, 3, 1, "^"],
      [40, 13, 3, 1, "^"],
      [52, 13, 4, 1, "^"],
      [74, 13, 3, 1, "^"],
      [87, 13, 3, 1, "^"],
    ],
    coins: [
      [11, 9],
      [13, 9],
      [25, 7],
      [35, 9],
      [47, 6],
      [49, 6],
      [59, 8],
      [69, 5],
      [80, 8],
      [84, 8],
      [92, 7],
    ],
  }),
];

const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const petList = document.querySelector("#petList");
const levelSelect = document.querySelector("#levelSelect");
const stageMeta = document.querySelector("#stageMeta");
const timerEl = document.querySelector("#timer");
const bestTimeEl = document.querySelector("#bestTime");
const leaderboardEl = document.querySelector("#leaderboard");
const statusText = document.querySelector("#statusText");
const coinText = document.querySelector("#coinText");
const editorPanel = document.querySelector("#editorPanel");
const libraryPanel = document.querySelector("#libraryPanel");
const paletteEl = document.querySelector("#palette");
const stageTitle = document.querySelector("#stageTitle");
const stageAuthor = document.querySelector("#stageAuthor");
const exportCode = document.querySelector("#exportCode");
const importCode = document.querySelector("#importCode");
const importPetsButton = document.querySelector("#importPetsButton");
const clearImportedPetsButton = document.querySelector("#clearImportedPetsButton");
const petDirectoryInput = document.querySelector("#petDirectoryInput");
const touchControlButtons = document.querySelectorAll("[data-control]");

const state = {
  mode: "play",
  pets: [...BUILT_IN_PETS],
  levels: [],
  level: null,
  levelIndex: 0,
  selectedPet: BUILT_IN_PETS[0],
  petImages: new Map(),
  importedPetUrls: [],
  keys: new Set(),
  controls: {
    left: false,
    right: false,
    jump: false,
  },
  player: null,
  cameraX: 0,
  startedAt: 0,
  elapsed: 0,
  finished: false,
  finishTime: null,
  runState: "ready",
  lastFinishWasBest: false,
  coins: new Set(),
  editorTool: "#",
  pointerDown: false,
  lastTime: 0,
};

function buildLevel(config) {
  const tiles = Array.from({ length: LEVEL_H }, () => ".".repeat(config.width).split(""));
  for (const [x, y, w, h, ch] of config.rects) {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        if (tiles[yy] && tiles[yy][xx] !== undefined) tiles[yy][xx] = ch;
      }
    }
  }
  for (const [x, y] of config.coins) {
    if (tiles[y] && tiles[y][x] !== undefined) tiles[y][x] = "o";
  }
  return {
    id: config.id,
    title: config.title,
    author: config.author,
    width: config.width,
    height: LEVEL_H,
    spawn: config.spawn,
    goal: config.goal,
    tiles: tiles.map((row) => row.join("")),
  };
}

function emptyLevel() {
  const tiles = Array.from({ length: LEVEL_H }, (_, y) => {
    const row = Array.from({ length: EDIT_W }, () => ".");
    if (y >= 13) row.fill("#");
    return row.join("");
  });
  return {
    id: `local-${Date.now()}`,
    title: "New Stage",
    author: "Local",
    width: EDIT_W,
    height: LEVEL_H,
    spawn: { x: 2, y: 9 },
    goal: { x: EDIT_W - 5, y: 9 },
    tiles,
  };
}

function loadLocalStages() {
  try {
    return JSON.parse(localStorage.getItem("codex-pet-run-levels") || "[]");
  } catch {
    return [];
  }
}

function saveLocalStages() {
  const localLevels = state.levels.filter((level) => level.id.startsWith("local-") || level.id.startsWith("import-"));
  localStorage.setItem("codex-pet-run-levels", JSON.stringify(localLevels));
}

function normalizeLevel(level) {
  const width = Math.max(20, Math.min(160, Number(level.width) || EDIT_W));
  const height = LEVEL_H;
  const tiles = Array.from({ length: height }, (_, y) => {
    const raw = String((level.tiles || [])[y] || "");
    return raw.padEnd(width, ".").slice(0, width);
  });
  return {
    id: String(level.id || `import-${Date.now()}`),
    title: String(level.title || "Untitled Stage").slice(0, 32),
    author: String(level.author || "Unknown").slice(0, 24),
    width,
    height,
    spawn: clampPoint(level.spawn || { x: 2, y: 9 }, width, height),
    goal: clampPoint(level.goal || { x: width - 4, y: 9 }, width, height),
    tiles,
  };
}

function clampPoint(point, width, height) {
  return {
    x: Math.max(0, Math.min(width - 1, Number(point.x) || 0)),
    y: Math.max(0, Math.min(height - 1, Number(point.y) || 0)),
  };
}

async function init() {
  state.levels = [...BUILT_IN_LEVELS, ...loadLocalStages()].map(normalizeLevel);
  makePalette();
  refreshLevels();
  bindEvents();
  selectLevel(0);
  await reloadPets();
  requestAnimationFrame(loop);
}

function makePetCards() {
  petList.innerHTML = "";
  for (const pet of state.pets) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pet-card";
    button.dataset.pet = pet.id;
    button.innerHTML = `<canvas width="46" height="50"></canvas><span><strong>${pet.name}</strong><span>${pet.description}</span></span>`;
    button.addEventListener("click", () => {
      state.selectedPet = pet;
      updatePetSelection();
    });
    petList.append(button);
  }
  updatePetSelection();
}

function updatePetSelection() {
  for (const button of petList.querySelectorAll(".pet-card")) {
    button.classList.toggle("active", button.dataset.pet === state.selectedPet.id);
  }
}

async function loadPetImages() {
  state.petImages.clear();
  await Promise.all(
    state.pets.map(
      (pet) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = pet.src;
          state.petImages.set(pet.id, img);
        }),
    ),
  );
}

function drawPetCards() {
  for (const button of petList.querySelectorAll(".pet-card")) {
    const pet = state.pets.find((item) => item.id === button.dataset.pet);
    if (!pet) continue;
    const preview = button.querySelector("canvas");
    const pctx = preview.getContext("2d");
    pctx.clearRect(0, 0, preview.width, preview.height);
    const img = state.petImages.get(pet.id);
    if (img && img.complete) {
      pctx.imageSmoothingEnabled = false;
      pctx.drawImage(img, 0, 0, CELL_W, CELL_H, 1, 0, 44, 48);
    }
  }
}

function makePalette() {
  paletteEl.innerHTML = "";
  for (const [tool, label] of PALETTE) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.tool = tool;
    const color = TILES[tool]?.color || (tool === "S" ? "#5aa9e6" : "#48bf84");
    button.innerHTML = `<span class="swatch" style="background:${color}"></span>${label}`;
    button.addEventListener("click", () => {
      state.editorTool = tool;
      updatePalette();
    });
    paletteEl.append(button);
  }
  updatePalette();
}

function updatePalette() {
  for (const button of paletteEl.querySelectorAll("button")) {
    button.classList.toggle("active", button.dataset.tool === state.editorTool);
  }
}

function refreshLevels() {
  levelSelect.innerHTML = "";
  for (const [index, level] of state.levels.entries()) {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${level.title} / ${level.author}`;
    levelSelect.append(option);
  }
}

function selectLevel(index) {
  state.levelIndex = Math.max(0, Math.min(state.levels.length - 1, index));
  state.level = cloneLevel(state.levels[state.levelIndex]);
  levelSelect.value = String(state.levelIndex);
  stageTitle.value = state.level.title;
  stageAuthor.value = state.level.author;
  resetRun();
  updateExport();
  updateStageMeta();
}

function cloneLevel(level) {
  return JSON.parse(JSON.stringify(level));
}

function bindEvents() {
  document.querySelector("#playModeButton").addEventListener("click", () => setMode("play"));
  document.querySelector("#editorModeButton").addEventListener("click", () => setMode("editor"));
  document.querySelector("#libraryModeButton").addEventListener("click", () => setMode("library"));
  document.querySelector("#restartButton").addEventListener("click", resetRun);
  document.querySelector("#newStageButton").addEventListener("click", () => {
    state.level = emptyLevel();
    stageTitle.value = state.level.title;
    stageAuthor.value = state.level.author;
    resetRun();
    updateExport();
    setMode("editor");
  });
  document.querySelector("#saveStageButton").addEventListener("click", saveEditedStage);
  document.querySelector("#copyExportButton").addEventListener("click", copyExport);
  document.querySelector("#importStageButton").addEventListener("click", importStage);
  importPetsButton.addEventListener("click", () => petDirectoryInput.click());
  clearImportedPetsButton.addEventListener("click", clearImportedPets);
  petDirectoryInput.addEventListener("change", () => importPetDirectory(Array.from(petDirectoryInput.files || [])));
  levelSelect.addEventListener("change", () => selectLevel(Number(levelSelect.value)));
  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
    if (event.code === "KeyR") resetRun();
    state.keys.add(event.code);
  });
  window.addEventListener("keyup", (event) => state.keys.delete(event.code));
  canvas.addEventListener("pointerdown", handlePointer);
  canvas.addEventListener("pointermove", handlePointer);
  canvas.addEventListener("pointerup", (event) => {
    releaseCanvasPointer(event);
  });
  canvas.addEventListener("pointercancel", (event) => {
    releaseCanvasPointer(event);
  });
  canvas.addEventListener("pointerleave", (event) => {
    releaseCanvasPointer(event);
  });
  canvas.addEventListener("click", () => {
    if (state.mode === "play") startRun();
  });
  for (const button of touchControlButtons) {
    button.addEventListener("pointerdown", pressTouchControl);
    button.addEventListener("pointerup", releaseTouchControl);
    button.addEventListener("pointercancel", releaseTouchControl);
    button.addEventListener("pointerleave", releaseTouchControl);
    button.addEventListener("touchstart", pressTouchControl, { passive: false });
    button.addEventListener("touchend", releaseTouchControl, { passive: false });
    button.addEventListener("touchcancel", releaseTouchControl, { passive: false });
    button.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  }
  window.addEventListener("blur", () => {
    clearHeldControls();
    state.pointerDown = false;
  });
}

function pressTouchControl(event) {
  event.preventDefault();
  const control = event.currentTarget.dataset.control;
  if (event.pointerId !== undefined) event.currentTarget.setPointerCapture?.(event.pointerId);
  if (control === "restart") {
    resetRun();
    return;
  }
  startRun();
  setControl(control, true);
}

function releaseTouchControl(event) {
  event.preventDefault();
  const control = event.currentTarget.dataset.control;
  if (event.pointerId !== undefined) event.currentTarget.releasePointerCapture?.(event.pointerId);
  setControl(control, false);
}

function setControl(control, pressed) {
  if (control in state.controls) state.controls[control] = pressed;
  updateTouchButtons();
}

function updateTouchButtons() {
  for (const button of touchControlButtons) {
    const control = button.dataset.control;
    button.classList.toggle("pressed", Boolean(state.controls[control]));
  }
}

function clearHeldControls() {
  state.controls.left = false;
  state.controls.right = false;
  state.controls.jump = false;
  updateTouchButtons();
}

async function reloadPets() {
  state.importedPetUrls.forEach((url) => URL.revokeObjectURL(url));
  state.importedPetUrls = [];
  const imported = await loadImportedPetRecords();
  const importedPets = imported.map((record) => {
    const src = URL.createObjectURL(record.sprite);
    state.importedPetUrls.push(src);
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      src,
      imported: true,
    };
  });
  state.pets = [...BUILT_IN_PETS, ...importedPets];
  if (!state.pets.some((pet) => pet.id === state.selectedPet.id)) state.selectedPet = state.pets[0];
  makePetCards();
  await loadPetImages();
  drawPetCards();
}

async function importPetDirectory(files) {
  if (!files.length) return;
  try {
    const groups = groupPetFiles(files);
    let importedCount = 0;
    for (const group of groups.values()) {
      if (!group.petJson) continue;
      const petJson = JSON.parse(await group.petJson.text());
      const spritePath = String(petJson.spritesheetPath || "spritesheet.webp").replace(/^\.\//, "");
      const sprite = group.filesByRelativePath.get(spritePath) || group.filesByName.get(spritePath.split("/").pop());
      if (!sprite) continue;
      const slug = slugify(petJson.id || petJson.displayName || group.dir || "codex-pet");
      await saveImportedPetRecord({
        id: `imported-${slug}-${hashString(group.dir || sprite.name)}`,
        name: String(petJson.displayName || petJson.id || slug).slice(0, 32),
        description: String(petJson.description || "Imported Codex pet").slice(0, 90),
        sourceDir: group.dir,
        sprite,
      });
      importedCount += 1;
    }
    await reloadPets();
    statusText.textContent = importedCount
      ? `Imported ${importedCount} local Codex pet${importedCount === 1 ? "" : "s"}.`
      : "No pet.json + spritesheet.webp pairs were found.";
  } catch (error) {
    statusText.textContent = `Pet import failed: ${error.message}`;
  } finally {
    petDirectoryInput.value = "";
  }
}

function groupPetFiles(files) {
  const groups = new Map();
  for (const file of files) {
    const relativePath = file.webkitRelativePath || file.name;
    const parts = relativePath.split("/").filter(Boolean);
    const fileName = parts.at(-1) || file.name;
    const dirParts = parts.slice(0, -1);
    const dir = fileName === "pet.json" ? dirParts.join("/") : dirParts.join("/");
    if (!groups.has(dir)) {
      groups.set(dir, {
        dir,
        petJson: null,
        filesByName: new Map(),
        filesByRelativePath: new Map(),
      });
    }
    const group = groups.get(dir);
    group.filesByName.set(fileName, file);
    group.filesByRelativePath.set(fileName, file);
    if (fileName === "pet.json") group.petJson = file;
  }
  return groups;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "codex-pet";
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function openPetDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support IndexedDB."));
      return;
    }
    const request = indexedDB.open(PET_DB_NAME, PET_DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("pets", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runPetDb(mode, callback) {
  return openPetDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction("pets", mode);
        const store = tx.objectStore("pets");
        const result = callback(store);
        tx.oncomplete = () => {
          db.close();
          resolve(result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

function saveImportedPetRecord(record) {
  return runPetDb("readwrite", (store) => {
    store.put({
      id: record.id,
      name: record.name,
      description: record.description,
      sourceDir: record.sourceDir,
      sprite: record.sprite,
      importedAt: Date.now(),
    });
  });
}

function loadImportedPetRecords() {
  return runPetDb(
    "readonly",
    (store) =>
      new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      }),
  ).catch(() => []);
}

async function clearImportedPets() {
  await runPetDb("readwrite", (store) => store.clear()).catch(() => {});
  state.selectedPet = BUILT_IN_PETS[0];
  await reloadPets();
  statusText.textContent = "Imported pets cleared.";
}

function setMode(mode) {
  state.mode = mode;
  clearHeldControls();
  editorPanel.classList.toggle("hidden", mode !== "editor");
  libraryPanel.classList.toggle("hidden", mode !== "library");
  document.querySelector("#playModeButton").classList.toggle("primary", mode === "play");
  document.querySelector("#editorModeButton").classList.toggle("primary", mode === "editor");
  document.querySelector("#libraryModeButton").classList.toggle("primary", mode === "library");
  statusText.textContent =
    mode === "editor"
      ? "Paint the canvas to build a stage."
      : mode === "library"
        ? "Export or import stages created by other players."
        : "Reach the flag as fast as possible.";
  updateExport();
}

function resetRun() {
  if (!state.level) return;
  const spawn = state.level.spawn;
  state.player = {
    x: spawn.x * TILE,
    y: spawn.y * TILE,
    w: 25,
    h: 31,
    vx: 0,
    vy: 0,
    onGround: false,
    face: 1,
    dead: false,
    animTime: 0,
  };
  state.cameraX = 0;
  state.startedAt = 0;
  state.elapsed = 0;
  state.finished = false;
  state.finishTime = null;
  state.runState = "ready";
  state.lastFinishWasBest = false;
  state.coins = collectCoinKeys(state.level);
  clearHeldControls();
  statusText.textContent = "Ready. Move or jump to start the clock.";
  updateCompetition();
  updateStageMeta();
}

function startRun() {
  if (state.mode !== "play" || state.runState !== "ready" || !state.player) return;
  state.runState = "running";
  state.startedAt = performance.now();
  state.elapsed = 0;
  statusText.textContent = "Run started. Reach the flag.";
}

function collectCoinKeys(level) {
  const coins = new Set();
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      if (tileAt(level, x, y) === "o") coins.add(`${x},${y}`);
    }
  }
  return coins;
}

function loop(now) {
  const dt = Math.min(32, now - (state.lastTime || now));
  state.lastTime = now;
  if (state.mode === "editor") updateEditor(dt);
  else updateGame(dt);
  draw();
  requestAnimationFrame(loop);
}

function updateEditor(dt) {
  if (!state.level) return;
  const left = isLeftPressed();
  const right = isRightPressed();
  const speed = 0.55 * dt;
  const maxCamera = Math.max(0, state.level.width * TILE - VIEW_W);
  if (left) state.cameraX = Math.max(0, state.cameraX - speed);
  if (right) state.cameraX = Math.min(maxCamera, state.cameraX + speed);
}

function updateGame(dt) {
  if (!state.player || !state.level || state.finished) return;
  const p = state.player;
  p.animTime += dt;
  if (state.runState === "ready") {
    if (isLeftPressed() || isRightPressed() || isJumpPressed()) startRun();
    if (state.runState === "ready") {
      updateCompetition();
      return;
    }
  }
  if (p.dead) {
    p.vy += 0.0017 * dt;
    p.y += p.vy * dt;
    if (p.y > VIEW_H + 120) resetRun();
    return;
  }

  const left = isLeftPressed();
  const right = isRightPressed();
  const jump = isJumpPressed();
  const accel = 0.0024 * dt;
  const maxVx = 0.34;

  if (left) {
    p.vx = Math.max(-maxVx, p.vx - accel);
    p.face = -1;
  }
  if (right) {
    p.vx = Math.min(maxVx, p.vx + accel);
    p.face = 1;
  }
  if (!left && !right) p.vx *= 0.82;
  if (jump && p.onGround) {
    p.vy = -0.68;
    p.onGround = false;
  }

  p.vy += 0.0022 * dt;
  p.vy = Math.min(p.vy, 0.74);

  const previousRect = { x: p.x, y: p.y, w: p.w, h: p.h };
  movePlayer(p.vx * dt, 0);
  movePlayer(0, p.vy * dt);
  checkHazardsAndCoins(previousRect);
  checkGoal();
  if (p.y > LEVEL_H * TILE + 80) killPlayer();

  const maxCamera = Math.max(0, state.level.width * TILE - VIEW_W);
  state.cameraX = Math.max(0, Math.min(maxCamera, p.x - VIEW_W * 0.42));
  state.elapsed = (performance.now() - state.startedAt) / 1000;
  updateCompetition();
}

function isLeftPressed() {
  return state.controls.left || state.keys.has("ArrowLeft") || state.keys.has("KeyA");
}

function isRightPressed() {
  return state.controls.right || state.keys.has("ArrowRight") || state.keys.has("KeyD");
}

function isJumpPressed() {
  return state.controls.jump || state.keys.has("ArrowUp") || state.keys.has("KeyW") || state.keys.has("Space");
}

function movePlayer(dx, dy) {
  const p = state.player;
  p.x += dx;
  if (dx !== 0) {
    for (const tile of solidTilesAround(p)) {
      if (rectsOverlap(p, tile)) {
        if (dx > 0) p.x = tile.x - p.w;
        if (dx < 0) p.x = tile.x + TILE;
        p.vx = 0;
      }
    }
  }

  p.y += dy;
  p.onGround = false;
  if (dy !== 0) {
    for (const tile of solidTilesAround(p)) {
      if (rectsOverlap(p, tile)) {
        if (dy > 0) {
          p.y = tile.y - p.h;
          p.onGround = true;
        }
        if (dy < 0) p.y = tile.y + TILE;
        p.vy = 0;
      }
    }
  }
}

function solidTilesAround(rect) {
  const tiles = [];
  const minX = Math.floor((rect.x - TILE) / TILE);
  const maxX = Math.floor((rect.x + rect.w + TILE) / TILE);
  const minY = Math.floor((rect.y - TILE) / TILE);
  const maxY = Math.floor((rect.y + rect.h + TILE) / TILE);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (TILES[tileAt(state.level, x, y)]?.solid) tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE });
    }
  }
  return tiles;
}

function checkHazardsAndCoins(previousRect = state.player) {
  const p = state.player;
  const swept = {
    x: Math.min(previousRect.x, p.x),
    y: Math.min(previousRect.y, p.y),
    w: Math.max(previousRect.x + previousRect.w, p.x + p.w) - Math.min(previousRect.x, p.x),
    h: Math.max(previousRect.y + previousRect.h, p.y + p.h) - Math.min(previousRect.y, p.y),
  };
  const pickup = inflateRect(swept, 8);
  const minX = Math.floor(pickup.x / TILE);
  const maxX = Math.floor((pickup.x + pickup.w) / TILE);
  const minY = Math.floor(pickup.y / TILE);
  const maxY = Math.floor((pickup.y + pickup.h) / TILE);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const key = `${x},${y}`;
      const ch = tileAt(state.level, x, y);
      const tileRect = { x: x * TILE, y: y * TILE, w: TILE, h: TILE };
      if (ch === "^" && rectsOverlap(p, tileRect)) killPlayer();
      if (ch === "o" && state.coins.has(key) && rectsOverlap(pickup, coinPickupRect(x, y))) state.coins.delete(key);
    }
  }
}

function coinPickupRect(x, y) {
  return {
    x: x * TILE + 3,
    y: y * TILE + 2,
    w: TILE - 6,
    h: TILE - 4,
  };
}

function inflateRect(rect, amount) {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    w: rect.w + amount * 2,
    h: rect.h + amount * 2,
  };
}

function killPlayer() {
  if (!state.player || state.player.dead) return;
  state.player.dead = true;
  state.player.vx = 0;
  state.player.vy = -0.35;
  statusText.textContent = "Miss. Restarting...";
}

function checkGoal() {
  const p = state.player;
  const goal = { x: state.level.goal.x * TILE + 6, y: state.level.goal.y * TILE - 42, w: 28, h: 76 };
  if (rectsOverlap(p, goal)) {
    state.finished = true;
    state.runState = "finished";
    const time = (performance.now() - state.startedAt) / 1000;
    const bestBefore = getScores(state.level.id)[0];
    state.finishTime = time;
    state.lastFinishWasBest = !bestBefore || time < bestBefore.time;
    saveScore(time);
    timerEl.textContent = formatTime(time);
    statusText.textContent = `Clear! ${formatTime(time)}${state.lastFinishWasBest ? " New best!" : ""}`;
    updateCompetition();
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function tileAt(level, x, y) {
  if (!level || x < 0 || y < 0 || x >= level.width || y >= level.height) return ".";
  return level.tiles[y][x] || ".";
}

function setTile(level, x, y, value) {
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return;
  const row = level.tiles[y].split("");
  row[x] = value;
  level.tiles[y] = row.join("");
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawSky();
  if (!state.level) return;
  drawLevel();
  drawGoal();
  drawPlayer();
  if (state.mode === "editor") drawEditorGrid();
  drawRaceHud();
  drawRunOverlay();
  const totalCoins = collectCoinKeys(state.level).size;
  coinText.textContent = `Coins ${totalCoins - state.coins.size}/${totalCoins}`;
}

function drawRaceHud() {
  const totalCoins = collectCoinKeys(state.level).size;
  const collectedCoins = totalCoins - state.coins.size;
  drawHudPill(18, 16, 168, "TIME", formatTime(state.finishTime ?? state.elapsed));
  drawHudPill(VIEW_W - 178, 16, 160, "COINS", `${collectedCoins}/${totalCoins}`);
}

function drawHudPill(x, y, w, label, value) {
  ctx.save();
  ctx.fillStyle = "rgba(17, 19, 22, 0.76)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  roundRect(x, y, w, 48, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#aeb8c2";
  ctx.font = "700 11px system-ui, sans-serif";
  ctx.fillText(label, x + 14, y + 17);
  ctx.fillStyle = "#edf2f4";
  ctx.font = "800 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(value, x + 14, y + 39);
  ctx.restore();
}

function drawRunOverlay() {
  if (state.mode === "editor" || state.runState === "running") return;
  ctx.save();
  ctx.fillStyle = "rgba(17, 19, 22, 0.34)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (state.runState === "finished") drawFinishOverlay();
  else drawReadyOverlay();
  ctx.restore();
}

function drawReadyOverlay() {
  const best = getScores(state.level?.id || "")[0];
  drawOverlayPanel(270, 150, 420, 206);
  ctx.textAlign = "center";
  ctx.fillStyle = "#edf2f4";
  ctx.font = "900 40px system-ui, sans-serif";
  ctx.fillText("READY", VIEW_W / 2, 210);
  ctx.fillStyle = "#f2c14e";
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.fillText(state.level?.title || "Stage", VIEW_W / 2, 246);
  ctx.fillStyle = "#c5ced8";
  ctx.font = "600 16px system-ui, sans-serif";
  ctx.fillText("Move or jump to start the timer", VIEW_W / 2, 284);
  ctx.fillStyle = "#aeb8c2";
  ctx.font = "600 14px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(`BEST ${best ? formatTime(best.time) : "--"}`, VIEW_W / 2, 318);
}

function drawFinishOverlay() {
  drawOverlayPanel(250, 126, 460, 274);
  ctx.textAlign = "center";
  ctx.fillStyle = "#48bf84";
  ctx.font = "900 28px system-ui, sans-serif";
  ctx.fillText(state.lastFinishWasBest ? "NEW BEST" : "CLEAR", VIEW_W / 2, 184);
  ctx.fillStyle = "#edf2f4";
  ctx.font = "900 56px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(formatTime(state.finishTime ?? state.elapsed), VIEW_W / 2, 250);
  ctx.fillStyle = "#c5ced8";
  ctx.font = "600 16px system-ui, sans-serif";
  ctx.fillText(`${state.selectedPet.name} finished ${state.level?.title || "the stage"}`, VIEW_W / 2, 292);
  ctx.fillStyle = "#aeb8c2";
  ctx.font = "600 14px system-ui, sans-serif";
  ctx.fillText("Restart to run again", VIEW_W / 2, 334);
}

function drawOverlayPanel(x, y, w, h) {
  ctx.fillStyle = "rgba(28, 32, 38, 0.92)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 2;
  roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  gradient.addColorStop(0, "#86c8f2");
  gradient.addColorStop(0.64, "#d7eef5");
  gradient.addColorStop(1, "#c1d58c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  drawCloud(110 - state.cameraX * 0.18, 70, 70);
  drawCloud(520 - state.cameraX * 0.12, 105, 55);
  drawCloud(850 - state.cameraX * 0.16, 55, 65);
}

function drawCloud(x, y, s) {
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.55, s * 0.22, 0, 0, Math.PI * 2);
  ctx.ellipse(x + s * 0.28, y - s * 0.12, s * 0.4, s * 0.27, 0, 0, Math.PI * 2);
  ctx.ellipse(x - s * 0.28, y - s * 0.05, s * 0.38, s * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLevel() {
  const startX = Math.max(0, Math.floor(state.cameraX / TILE) - 1);
  const endX = Math.min(state.level.width - 1, Math.floor((state.cameraX + VIEW_W) / TILE) + 1);
  for (let y = 0; y < state.level.height; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const ch = tileAt(state.level, x, y);
      const px = x * TILE - state.cameraX;
      const py = y * TILE + 38;
      if (ch === "#" || ch === "B") drawBlock(px, py, ch);
      if (ch === "^") drawSpike(px, py);
      if (ch === "o" && state.coins.has(`${x},${y}`)) drawCoin(px, py);
    }
  }
}

function drawBlock(x, y, ch) {
  ctx.fillStyle = ch === "#" ? "#6b4f35" : "#a65f38";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = ch === "#" ? "#836445" : "#c87845";
  ctx.fillRect(x + 2, y + 2, TILE - 4, 7);
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
}

function drawSpike(x, y) {
  ctx.fillStyle = "#ef626c";
  ctx.beginPath();
  ctx.moveTo(x + 2, y + TILE);
  ctx.lineTo(x + TILE / 2, y + 5);
  ctx.lineTo(x + TILE - 2, y + TILE);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#722832";
  ctx.stroke();
}

function drawCoin(x, y) {
  ctx.fillStyle = "#f2c14e";
  ctx.beginPath();
  ctx.ellipse(x + TILE / 2, y + TILE / 2, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#805d19";
  ctx.stroke();
}

function drawGoal() {
  const gx = state.level.goal.x * TILE - state.cameraX + 16;
  const gy = state.level.goal.y * TILE + 6 + 38;
  ctx.fillStyle = "#f7f1d4";
  ctx.fillRect(gx, gy, 5, 78);
  ctx.fillStyle = "#48bf84";
  ctx.beginPath();
  ctx.moveTo(gx + 5, gy + 4);
  ctx.lineTo(gx + 52, gy + 17);
  ctx.lineTo(gx + 5, gy + 31);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer() {
  if (!state.player) return;
  const p = state.player;
  const img = state.petImages.get(state.selectedPet.id);
  const anim = currentAnim();
  const frame = Math.floor(p.animTime / anim.speed) % anim.frames;
  const dx = Math.round(p.x - state.cameraX - 12);
  const dy = Math.round(p.y + 38 - 18);
  if (img && img.complete && img.naturalWidth) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, frame * CELL_W, anim.row * CELL_H, CELL_W, CELL_H, dx - 20, dy - 28, 72, 78);
  } else {
    ctx.fillStyle = "#5aa9e6";
    ctx.fillRect(dx, dy, p.w, p.h);
  }
}

function currentAnim() {
  const p = state.player;
  if (!p || p.dead) return ANIMS.failed;
  if (!p.onGround) return ANIMS.jump;
  if (Math.abs(p.vx) > 0.04) return p.face < 0 ? ANIMS.left : ANIMS.right;
  return ANIMS.idle;
}

function drawEditorGrid() {
  ctx.save();
  ctx.translate(-state.cameraX, 38);
  ctx.strokeStyle = "rgba(17,19,22,0.22)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= state.level.width; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * TILE + 0.5, 0);
    ctx.lineTo(x * TILE + 0.5, state.level.height * TILE);
    ctx.stroke();
  }
  for (let y = 0; y <= state.level.height; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * TILE + 0.5);
    ctx.lineTo(state.level.width * TILE, y * TILE + 0.5);
    ctx.stroke();
  }
  ctx.fillStyle = "#5aa9e6";
  ctx.fillRect(state.level.spawn.x * TILE + 9, state.level.spawn.y * TILE + 7, 14, 22);
  ctx.restore();
}

function handlePointer(event) {
  if (state.mode !== "editor") return;
  event.preventDefault();
  if (event.type === "pointerdown") {
    state.pointerDown = true;
    canvas.setPointerCapture?.(event.pointerId);
  }
  if (!state.pointerDown) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = VIEW_W / rect.width;
  const scaleY = VIEW_H / rect.height;
  const x = Math.floor(((event.clientX - rect.left) * scaleX + state.cameraX) / TILE);
  const y = Math.floor(((event.clientY - rect.top) * scaleY - 38) / TILE);
  if (state.editorTool === "S") state.level.spawn = clampPoint({ x, y }, state.level.width, state.level.height);
  else if (state.editorTool === "G") state.level.goal = clampPoint({ x, y }, state.level.width, state.level.height);
  else setTile(state.level, x, y, state.editorTool);
  syncEditedRun();
  updateExport();
}

function releaseCanvasPointer(event) {
  if (state.mode === "editor") event.preventDefault();
  canvas.releasePointerCapture?.(event.pointerId);
  state.pointerDown = false;
}

function syncEditedRun() {
  state.coins = collectCoinKeys(state.level);
  if (state.player) {
    state.player.x = state.level.spawn.x * TILE;
    state.player.y = state.level.spawn.y * TILE;
    state.player.vx = 0;
    state.player.vy = 0;
  }
}

function saveEditedStage() {
  const level = normalizeLevel({
    ...state.level,
    id: state.level.id.startsWith("local-") || state.level.id.startsWith("import-") ? state.level.id : `local-${Date.now()}`,
    title: stageTitle.value || "Untitled Stage",
    author: stageAuthor.value || "Local",
  });
  state.level = cloneLevel(level);
  const existing = state.levels.findIndex((item) => item.id === level.id);
  if (existing >= 0) state.levels[existing] = cloneLevel(level);
  else {
    state.levels.push(cloneLevel(level));
    state.levelIndex = state.levels.length - 1;
  }
  saveLocalStages();
  refreshLevels();
  levelSelect.value = String(state.levelIndex);
  updateExport();
  updateStageMeta();
  statusText.textContent = "Stage saved locally.";
}

function updateExport() {
  if (!state.level) return;
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(normalizeLevel(state.level)))));
  exportCode.value = payload;
}

function copyExport() {
  exportCode.select();
  document.execCommand("copy");
  statusText.textContent = "Stage code copied.";
}

function importStage() {
  try {
    const raw = decodeURIComponent(escape(atob(importCode.value.trim())));
    const level = normalizeLevel({ ...JSON.parse(raw), id: `import-${Date.now()}` });
    state.levels.push(level);
    state.levelIndex = state.levels.length - 1;
    saveLocalStages();
    refreshLevels();
    selectLevel(state.levelIndex);
    setMode("play");
    statusText.textContent = `Imported ${level.title}.`;
  } catch {
    statusText.textContent = "Import failed. Check the stage code.";
  }
}

function saveScore(time) {
  const key = scoreKey(state.level.id);
  const scores = getScores(state.level.id);
  scores.push({ time, pet: state.selectedPet.name, at: Date.now() });
  scores.sort((a, b) => a.time - b.time);
  localStorage.setItem(key, JSON.stringify(scores.slice(0, 8)));
}

function getScores(levelId) {
  try {
    return JSON.parse(localStorage.getItem(scoreKey(levelId)) || "[]");
  } catch {
    return [];
  }
}

function scoreKey(levelId) {
  return `codex-pet-run-scores:${levelId}`;
}

function updateCompetition() {
  timerEl.textContent = formatTime(state.finishTime ?? state.elapsed);
  const scores = getScores(state.level?.id || "");
  bestTimeEl.textContent = scores[0] ? formatTime(scores[0].time) : "--";
  leaderboardEl.innerHTML = "";
  if (!scores.length) {
    const li = document.createElement("li");
    li.textContent = "No clears yet";
    leaderboardEl.append(li);
    return;
  }
  for (const score of scores.slice(0, 5)) {
    const li = document.createElement("li");
    li.textContent = `${formatTime(score.time)} - ${score.pet}`;
    leaderboardEl.append(li);
  }
}

function updateStageMeta() {
  if (!state.level) return;
  const local = state.level.id.startsWith("local-") || state.level.id.startsWith("import-");
  stageMeta.textContent = `${state.level.width} x ${state.level.height} tiles. ${local ? "Local/shared stage." : "Community stage."}`;
}

function formatTime(value) {
  return Number.isFinite(value) && value > 0 ? value.toFixed(3) : "0.000";
}

init();
