"use strict";

const W = 960;
const H = 540;
const TILE = 48;
const PET_CELL_W = 192;
const PET_CELL_H = 208;

const canvas = document.querySelector("#rpgCanvas");
const ctx = canvas.getContext("2d");
const questText = document.querySelector("#questText");
const inventoryList = document.querySelector("#inventoryList");
const dialogBox = document.querySelector("#dialogBox");
const speakerName = document.querySelector("#speakerName");
const dialogText = document.querySelector("#dialogText");
const nextDialogButton = document.querySelector("#nextDialogButton");
const nameGate = document.querySelector("#nameGate");
const playerNameForm = document.querySelector("#playerNameForm");
const playerNameInput = document.querySelector("#playerNameInput");

const DEFAULT_PLAYER_NAME = "新入社員";
const spriteSources = {
  sobaya: "assets/pets/sobaya/spritesheet.webp",
  yametaro: "assets/pets/yametaro/spritesheet.webp",
  yumemin: "assets/pets/yumemin/spritesheet.webp",
  chikuwa: "assets/pets/chikuwa/spritesheet.webp",
  tako: "assets/pets/tako-san/spritesheet.webp",
};

const sprites = new Map();
const keys = new Set();
const heldControls = { up: false, down: false, left: false, right: false, interact: false };

const player = {
  x: 128,
  y: 350,
  w: 34,
  h: 42,
  speed: 3.2,
  pet: "yumemin",
  frameTick: 0,
};

const state = {
  started: false,
  playerName: DEFAULT_PLAYER_NAME,
  chapter: 0,
  inventory: new Set(),
  dialogQueue: [],
  dialogSpeaker: "",
  pendingItem: null,
  pendingNext: undefined,
  ending: false,
  message: "名前を入力して開始する。",
};

const quests = [
  "{playerName}として窓際席に向かい、そば屋に声をかける。",
  "やめ太郎から窓際族物語の追体験パスを受け取る。",
  "窓際席を調べ、浅草と二日酔いの記憶を読む。",
  "社内酒場のカウンターで、そば屋が店を持った瞬間を辿る。",
  "たこさんと事故棚を片付け、窓際の居場所を直す。",
  "チクワをレジ係に迎え、静かな営業の形を整える。",
  "窓際族ノートを読み、そば屋とやめ太郎の視点を重ねる。",
  "{playerName}として、窓際族物語の続きを引き受ける。",
];

const npcs = [
  {
    id: "sobaya-guide",
    name: "そば屋",
    pet: "sobaya",
    x: 200,
    y: 362,
    w: 56,
    h: 58,
    chapter: 0,
    lines: [
      "そば屋: {playerName}、だったな。よし、今度は覚えた。たぶん。",
      "そば屋: ようこそ窓際へ。ここは端っこだけど、物語の入口でもある。",
      "そば屋: 今日は俺たち窓際族の記録を追体験してもらう。まずは、やめ太郎に会ってくれ。",
      "{playerName}: 研修資料より濃そうですね。窓際族物語、読ませてもらいます。",
    ],
    item: "窓際研修メモ",
    next: 1,
  },
  {
    id: "yametaro",
    name: "やめ太郎",
    pet: "yametaro",
    x: 574,
    y: 178,
    w: 54,
    h: 58,
    chapter: 1,
    lines: [
      "やめ太郎: 指名手配犯という肩書きはさておき、窓際族物語の案内はできる。",
      "やめ太郎: これは端に追いやられた人が、端っこを居場所に作り替える話だ。",
      "やめ太郎: 追体験パスを渡す。そば屋の机を調べれば、最初の記憶に入れる。",
    ],
    item: "追体験パス",
    next: 2,
  },
  {
    id: "desk",
    name: "窓際席",
    pet: null,
    x: 112,
    y: 122,
    w: 110,
    h: 70,
    color: "#8f653d",
    chapter: 2,
    lines: [
      "窓際席の記録: 浅草に落ちた朝。二日酔いの重さと、なぜか冷えたビールの記憶が残っている。",
      "そば屋: きれいな武勇伝じゃない。けど、ここから社内に店を持つ発想が生まれた。",
      "{playerName}: 失敗を隠すんじゃなくて、物語として置き直すんですね。",
    ],
    item: "冷えたビールの記憶",
    next: 3,
  },
  {
    id: "counter-memory",
    name: "窓際酒場",
    pet: null,
    x: 322,
    y: 306,
    w: 180,
    h: 80,
    color: "#a65f38",
    chapter: 3,
    lines: [
      "窓際酒場の記録: 社内に店を持つ。冗談みたいな言葉が、誰かの逃げ場を作りはじめた。",
      "やめ太郎: 許可より先に必要なのは、戻ってきてもいいと思えるカウンターだ。",
      "そば屋: {playerName}、ここを拭いてくれ。追体験は見るだけじゃなく、少し手を動かす。",
    ],
    item: "社内酒場の設計図",
    next: 4,
  },
  {
    id: "tako",
    name: "たこさん",
    pet: "tako",
    x: 654,
    y: 406,
    w: 56,
    h: 58,
    chapter: 4,
    lines: [
      "たこさん: 落ちた棚は、支えればだいたい直る。支える係がいるだけで場所は保てる。",
      "そば屋: 窓際族は派手に勝たない。落ちたものを拾って、また座れるようにする。",
      "床の散らばりが消えて、窓際に小さな通路が戻ってきた。",
    ],
    item: "直った事故棚",
    next: 5,
  },
  {
    id: "chikuwa",
    name: "チクワ",
    pet: "chikuwa",
    x: 518,
    y: 352,
    w: 56,
    h: 58,
    chapter: 5,
    lines: [
      "チクワ: 顔はない。でも会計はできる。",
      "やめ太郎: しゃべる人だけが仲間じゃない。何も言わずに場を成立させる役もある。",
      "{playerName}はレジ札を置き、静かな営業の形を覚えた。",
    ],
    item: "無言のレジ係",
    next: 6,
  },
  {
    id: "window-note",
    name: "窓際族ノート",
    pet: null,
    x: 392,
    y: 170,
    w: 116,
    h: 62,
    color: "#43525f",
    chapter: 6,
    lines: [
      "窓際族ノート: そば屋、やめ太郎、名前のある仲間たち。端の席に集まった記録が重なっている。",
      "そば屋: 窓際は終点じゃない。そこで何を見つけるかで、物語の意味が変わる。",
      "やめ太郎: {playerName}、お前のページも空けてある。最後にカウンターへ行こう。",
    ],
    item: "空白のページ",
    next: 7,
  },
  {
    id: "final-counter",
    name: "窓際酒場",
    pet: null,
    x: 322,
    y: 306,
    w: 180,
    h: 80,
    color: "#a65f38",
    chapter: 7,
    lines: [
      "{playerName}は窓際酒場の前に立ち、研修メモの最後の欄に自分の名前を書いた。",
      "そば屋: よし。これで窓際族物語は、追体験から引き継ぎに変わった。",
      "やめ太郎: 端っこに来たら、またここを開ければいい。窓辺の席は空けておく。",
      "窓際族物語、完。けれど昼休みのチャイムが鳴れば、次のページが始まる。",
    ],
    next: 8,
  },
];

const colliders = [
  { x: 80, y: 92, w: 170, h: 118 },
  { x: 310, y: 292, w: 210, h: 108 },
  { x: 640, y: 96, w: 140, h: 120 },
  { x: 720, y: 340, w: 130, h: 116 },
];

function loadSprites() {
  return Promise.all(
    Object.entries(spriteSources).map(
      ([id, src]) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = src;
          sprites.set(id, img);
        }),
    ),
  );
}

function resetGame(showNameGate = true) {
  player.x = 128;
  player.y = 350;
  state.chapter = 0;
  state.started = !showNameGate;
  state.inventory.clear();
  state.dialogQueue = [];
  state.dialogSpeaker = "";
  state.pendingItem = null;
  state.pendingNext = undefined;
  state.ending = false;
  state.message = showNameGate ? "名前を入力して開始する。" : "Space / Talk で会話。そば屋に声をかける。";
  dialogBox.classList.add("hidden");
  nameGate.classList.toggle("hidden", !showNameGate);
  keys.clear();
  for (const key of Object.keys(heldControls)) heldControls[key] = false;
  updatePanels();
}

function updatePanels() {
  if (!state.started) {
    questText.textContent = "新入社員の名前を入力して、窓際族物語を始める。";
  } else {
    questText.textContent = state.ending
      ? `${state.playerName}は窓際族物語を引き継いだ。`
      : formatText(quests[Math.min(state.chapter, quests.length - 1)]);
  }
  inventoryList.innerHTML = "";
  const items = Array.from(state.inventory);
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "なし";
    inventoryList.append(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    inventoryList.append(li);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function update() {
  player.frameTick += 1;
  if (!state.started) return;
  if (state.dialogQueue.length) return;
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("KeyA") || heldControls.left) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD") || heldControls.right) dx += 1;
  if (keys.has("ArrowUp") || keys.has("KeyW") || heldControls.up) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS") || heldControls.down) dy += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    movePlayer((dx / len) * player.speed, (dy / len) * player.speed);
  }
}

function movePlayer(dx, dy) {
  const next = { x: player.x + dx, y: player.y + dy, w: player.w, h: player.h };
  if (next.x < 30 || next.y < 64 || next.x + next.w > W - 30 || next.y + next.h > H - 34) return;
  if (colliders.some((rect) => rectsOverlap(next, rect))) return;
  player.x = next.x;
  player.y = next.y;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawOffice();
  for (const npc of npcs) drawNpc(npc);
  drawPet(player.pet, player.x - 24, player.y - 50, 82, 88);
  drawHud();
  if (state.ending) drawEnding();
}

function drawOffice() {
  ctx.fillStyle = "#27313a";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#8fd0ff";
  ctx.fillRect(40, 42, 880, 82);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let x = 54; x < 900; x += 92) ctx.fillRect(x, 52, 54, 58);
  ctx.fillStyle = "#2f3a44";
  ctx.fillRect(0, 124, W, 20);
  ctx.fillStyle = "#33404a";
  for (let y = 144; y < H; y += TILE) {
    for (let x = 0; x < W; x += TILE) {
      ctx.fillStyle = (x / TILE + y / TILE) % 2 ? "#303a43" : "#35414b";
      ctx.fillRect(x, y, TILE, TILE);
    }
  }
  drawFurniture(80, 92, 170, 118, "#8f653d", "窓際席");
  drawFurniture(310, 292, 210, 108, "#a65f38", "窓際酒場");
  drawFurniture(640, 96, 140, 120, "#635246", "申請机");
  drawFurniture(720, 340, 130, 116, "#5e4b3f", "事故棚");
  if (state.chapter < 4) drawDebris();
}

function drawFurniture(x, y, w, h, color, label) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(x + 8, y + 8, w - 16, 14);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = "#edf2f4";
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.fillText(label, x + 14, y + h - 14);
}

function drawDebris() {
  ctx.fillStyle = "#ef626c";
  ctx.fillRect(704, 454, 38, 14);
  ctx.fillRect(770, 464, 54, 12);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(742, 438, 18, 18);
}

function drawNpc(npc) {
  if (npc.chapter > state.chapter) return;
  if (npc.pet) drawPet(npc.pet, npc.x - 18, npc.y - 46, 78, 84);
  else if (npc.color) {
    ctx.fillStyle = npc.color;
    ctx.fillRect(npc.x, npc.y, npc.w, npc.h);
  }
  if (npc.chapter === state.chapter) drawMarker(npc.x + npc.w / 2, npc.y - 18);
}

function drawMarker(x, y) {
  ctx.fillStyle = "#f2c14e";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 10, y - 18);
  ctx.lineTo(x + 10, y - 18);
  ctx.closePath();
  ctx.fill();
}

function drawPet(id, x, y, w, h) {
  const img = sprites.get(id);
  if (img && img.complete && img.naturalWidth) {
    const frame = Math.floor(player.frameTick / 14) % 6;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, frame * PET_CELL_W, 0, PET_CELL_W, PET_CELL_H, x, y, w, h);
    return;
  }
  ctx.fillStyle = "#48bf84";
  ctx.fillRect(x, y, w, h);
}

function drawHud() {
  ctx.fillStyle = "rgba(17,19,22,0.82)";
  ctx.fillRect(18, 16, 430, 58);
  ctx.fillStyle = "#f2c14e";
  ctx.font = "800 16px system-ui, sans-serif";
  ctx.fillText(state.started ? `${state.playerName} / 第${Math.min(state.chapter + 1, quests.length)}章 / ${quests.length}` : "名前入力", 38, 40);
  ctx.fillStyle = "#edf2f4";
  ctx.font = "600 15px system-ui, sans-serif";
  ctx.fillText(formatText(state.message), 38, 62);
}

function drawEnding() {
  ctx.fillStyle = "rgba(17,19,22,0.65)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1b2026";
  ctx.fillRect(250, 142, 460, 246);
  ctx.strokeStyle = "#48bf84";
  ctx.strokeRect(250.5, 142.5, 459, 245);
  ctx.textAlign = "center";
  ctx.fillStyle = "#edf2f4";
  ctx.font = "900 38px system-ui, sans-serif";
  ctx.fillText("窓際族物語 完", W / 2, 218);
  ctx.fillStyle = "#c5ced8";
  ctx.font = "600 18px system-ui, sans-serif";
  ctx.fillText(`${state.playerName}は、そば屋とやめ太郎の物語を引き継いだ。`, W / 2, 270);
  ctx.fillText("端っこの席から、次のページが始まる。", W / 2, 306);
  ctx.textAlign = "start";
}

function tryInteract() {
  if (!state.started) {
    playerNameInput.focus();
    return;
  }
  if (state.dialogQueue.length) {
    advanceDialog();
    return;
  }
  const target = npcs.find((npc) => npc.chapter === state.chapter && distanceToNpc(npc) < 86);
  if (!target) {
    state.message = "黄色いマーカーの近くで話す / 調べる。";
    return;
  }
  state.dialogSpeaker = target.name;
  state.dialogQueue = [...target.lines];
  if (target.item) state.pendingItem = target.item;
  state.pendingNext = target.next;
  advanceDialog();
}

function advanceDialog() {
  if (!state.dialogQueue.length) {
    dialogBox.classList.add("hidden");
    if (state.pendingItem) state.inventory.add(state.pendingItem);
    if (state.pendingNext !== undefined && state.pendingNext > state.chapter) state.chapter = state.pendingNext;
    state.ending = state.chapter >= quests.length;
    state.message = state.ending ? "窓際族物語を引き継いだ。" : quests[state.chapter];
    state.pendingItem = null;
    state.pendingNext = undefined;
    updatePanels();
    return;
  }
  speakerName.textContent = state.dialogSpeaker;
  dialogText.textContent = formatText(state.dialogQueue.shift());
  dialogBox.classList.remove("hidden");
}

function formatText(text) {
  return text.replaceAll("{playerName}", state.playerName);
}

function startGame() {
  const name = playerNameInput.value.trim().replace(/\s+/g, " ").slice(0, 12);
  state.playerName = name || DEFAULT_PLAYER_NAME;
  playerNameInput.value = state.playerName;
  resetGame(false);
  playerNameInput.blur();
}

function distanceToNpc(npc) {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  const nx = npc.x + npc.w / 2;
  const ny = npc.y + npc.h / 2;
  return Math.hypot(cx - nx, cy - ny);
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function setHeld(key, value) {
  if (key === "interact" && value) tryInteract();
  if (key in heldControls) heldControls[key] = value;
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
  if (event.code === "Space" || event.code === "Enter") tryInteract();
  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

for (const button of document.querySelectorAll("[data-key]")) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    setHeld(button.dataset.key, true);
  });
  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    setHeld(button.dataset.key, false);
  });
  button.addEventListener("pointercancel", () => setHeld(button.dataset.key, false));
  button.addEventListener("touchstart", (event) => {
    event.preventDefault();
    setHeld(button.dataset.key, true);
  }, { passive: false });
  button.addEventListener("touchend", (event) => {
    event.preventDefault();
    setHeld(button.dataset.key, false);
  }, { passive: false });
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

nextDialogButton.addEventListener("click", advanceDialog);
document.querySelector("#newGameButton").addEventListener("click", () => resetGame(true));
playerNameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  startGame();
});

loadSprites().then(() => {
  resetGame();
  requestAnimationFrame(loop);
});
