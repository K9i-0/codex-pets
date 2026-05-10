"use strict";

const W = 960;
const H = 540;
const TILE = 48;
const PET_CELL_W = 192;
const PET_CELL_H = 208;
const SAVE_KEY = "madogiwa-rpg-save-v2";
const DEFAULT_PLAYER_NAME = "新入社員";

const canvas = document.querySelector("#rpgCanvas");
const ctx = canvas.getContext("2d");
const questText = document.querySelector("#questText");
const inventoryList = document.querySelector("#inventoryList");
const progressText = document.querySelector("#progressText");
const moodText = document.querySelector("#moodText");
const saveText = document.querySelector("#saveText");
const dialogBox = document.querySelector("#dialogBox");
const speakerName = document.querySelector("#speakerName");
const dialogText = document.querySelector("#dialogText");
const nextDialogButton = document.querySelector("#nextDialogButton");
const nameGate = document.querySelector("#nameGate");
const playerNameForm = document.querySelector("#playerNameForm");
const playerNameInput = document.querySelector("#playerNameInput");
const continueButton = document.querySelector("#continueButton");

const spriteSources = {
  sobaya: "assets/pets/sobaya/spritesheet.webp",
  yametaro: "assets/pets/yametaro/spritesheet.webp",
  yumemin: "assets/pets/yumemin/spritesheet.webp",
  chikuwa: "assets/pets/chikuwa/spritesheet.webp",
  tako: "assets/pets/tako-san/spritesheet.webp",
};

const sprites = new Map();
const keys = new Set();
const heldControls = { up: false, down: false, left: false, right: false, interact: false, guide: false };

const player = {
  x: 128,
  y: 350,
  w: 34,
  h: 42,
  speed: 3.25,
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
  pathTarget: null,
  chapterFlash: 0,
};

const actors = {
  sobaya: {
    name: "そば屋",
    pet: "sobaya",
    x: 200,
    y: 362,
    w: 56,
    h: 58,
    approachX: 172,
    approachY: 376,
    visibleFrom: 0,
  },
  yametaro: {
    name: "やめ太郎",
    pet: "yametaro",
    x: 574,
    y: 178,
    w: 54,
    h: 58,
    approachX: 552,
    approachY: 250,
    visibleFrom: 1,
  },
  desk: {
    name: "窓際席",
    color: "#8f653d",
    x: 112,
    y: 122,
    w: 110,
    h: 70,
    approachX: 150,
    approachY: 226,
    visibleFrom: 2,
  },
  beer: {
    name: "冷えた記憶",
    color: "#5aa9e6",
    x: 256,
    y: 404,
    w: 70,
    h: 34,
    approachX: 290,
    approachY: 462,
    visibleFrom: 3,
  },
  counter: {
    name: "窓際酒場",
    color: "#a65f38",
    x: 322,
    y: 306,
    w: 180,
    h: 80,
    approachX: 382,
    approachY: 426,
    visibleFrom: 4,
  },
  yumemin: {
    name: "ゆめみん",
    pet: "yumemin",
    x: 530,
    y: 344,
    w: 56,
    h: 58,
    approachX: 596,
    approachY: 390,
    visibleFrom: 5,
  },
  tako: {
    name: "たこさん",
    pet: "tako",
    x: 654,
    y: 406,
    w: 56,
    h: 58,
    approachX: 628,
    approachY: 454,
    visibleFrom: 6,
  },
  chikuwa: {
    name: "チクワ",
    pet: "chikuwa",
    x: 518,
    y: 352,
    w: 56,
    h: 58,
    approachX: 492,
    approachY: 414,
    visibleFrom: 7,
  },
  note: {
    name: "窓際族ノート",
    color: "#43525f",
    x: 392,
    y: 170,
    w: 116,
    h: 62,
    approachX: 444,
    approachY: 252,
    visibleFrom: 8,
  },
  window: {
    name: "窓辺",
    color: "#76c7ff",
    x: 722,
    y: 154,
    w: 82,
    h: 52,
    approachX: 760,
    approachY: 240,
    visibleFrom: 10,
  },
};

const story = [
  {
    title: "配属初日",
    mood: "酔い覚まし",
    target: "sobaya",
    item: "窓際研修メモ",
    quest: "{playerName}として窓際席に向かい、そば屋に声をかける。",
    lines: [
      "そば屋: {playerName}、だったな。よし、今度は覚えた。たぶん。",
      "そば屋: 上司から聞いた時は、ちょうど麦茶みたいな色の飲み物を飲んでいてな。",
      "そば屋: ここは窓際席。会社の端っこで、物語の入口でもある。",
      "そば屋: 今日は俺たち窓際族の記録を追体験してもらう。まずは、やめ太郎に会ってくれ。",
      "{playerName}: 研修資料より濃そうですね。窓際族物語、読ませてもらいます。",
    ],
  },
  {
    title: "指名手配の案内人",
    mood: "不穏な親切",
    target: "yametaro",
    item: "追体験パス",
    quest: "やめ太郎から窓際族物語の追体験パスを受け取る。",
    lines: [
      "やめ太郎: 指名手配犯という肩書きはさておき、窓際族物語の案内はできる。",
      "やめ太郎: これは端に追いやられた人が、端っこを居場所に作り替える話だ。",
      "やめ太郎: 追体験パスを渡す。使い方は簡単、黄色い印の近くで話すだけ。",
      "やめ太郎: 迷ったらGuideを押せ。窓際族は迷子にも席を用意する。",
    ],
  },
  {
    title: "窓際席の記録",
    mood: "すきま風",
    target: "desk",
    item: "浅草の記録",
    quest: "窓際席を調べ、浅草と二日酔いの記憶を読む。",
    lines: [
      "窓際席の記録: 浅草に落ちた朝。二日酔いの重さと、妙に青い空だけが残っている。",
      "そば屋: きれいな武勇伝じゃない。けど、失敗も置き場所を変えると物語になる。",
      "{playerName}: 反省文ではなく、地図にするんですね。",
      "机の引き出しから、古いメモが出てきた。端の席ほど、書き込みは多い。",
    ],
  },
  {
    title: "冷えたビールの記憶",
    mood: "妙に冷たい",
    target: "beer",
    item: "冷えたビールの記憶",
    quest: "窓際の冷気から、社内酒場の原点を拾う。",
    lines: [
      "冷えた記憶: 窓のすきま風で、缶だけが完璧に冷えている。",
      "そば屋: 福利厚生ではない。偶然だ。たぶん。",
      "やめ太郎: 偶然を店の設備と言い張れるなら、それはもう才能だ。",
      "{playerName}: 会社の端っこに、最初のカウンターが見えてきました。",
    ],
  },
  {
    title: "社内に店を持つ",
    mood: "開業準備",
    target: "counter",
    item: "社内酒場の設計図",
    quest: "社内酒場のカウンターで、そば屋が店を持った瞬間を辿る。",
    lines: [
      "窓際酒場の記録: 社内に店を持つ。冗談みたいな言葉が、誰かの逃げ場を作りはじめた。",
      "やめ太郎: 許可より先に必要なのは、戻ってきてもいいと思えるカウンターだ。",
      "そば屋: {playerName}、ここを拭いてくれ。追体験は見るだけじゃなく、少し手を動かす。",
      "布巾が机を一往復すると、窓際席が少しだけ店らしくなった。",
    ],
  },
  {
    title: "静かな看板",
    mood: "小さな灯り",
    target: "yumemin",
    item: "静かな看板",
    quest: "ゆめみんから、目立ちすぎない看板を受け取る。",
    lines: [
      "ゆめみん: 大きすぎる看板は疲れるから、静かに目に入るくらいがいい。",
      "ゆめみんは窓際酒場の札を差し出した。派手ではないが、帰る場所の顔をしている。",
      "そば屋: 目立つためじゃない。ここにある、と知らせるための看板だ。",
      "{playerName}: 居場所って、声が大きくなくても伝えられるんですね。",
    ],
  },
  {
    title: "事故棚の片付け",
    mood: "再建作業",
    target: "tako",
    item: "直った事故棚",
    quest: "たこさんと事故棚を片付け、窓際の通路を取り戻す。",
    lines: [
      "たこさん: 落ちた棚は、支えればだいたい直る。支える係がいるだけで場所は保てる。",
      "そば屋: 窓際族は派手に勝たない。落ちたものを拾って、また座れるようにする。",
      "床の散らばりが消えて、窓際に小さな通路が戻ってきた。",
      "やめ太郎: いい通路だ。逃走経路としても、帰り道としても使える。",
    ],
  },
  {
    title: "無言のレジ係",
    mood: "営業開始前",
    target: "chikuwa",
    item: "無言のレジ係",
    quest: "チクワをレジ係に迎え、静かな営業の形を整える。",
    lines: [
      "チクワ: 顔はない。でも会計はできる。",
      "やめ太郎: しゃべる人だけが仲間じゃない。何も言わずに場を成立させる役もある。",
      "{playerName}はレジ札を置き、静かな営業の形を覚えた。",
      "そば屋: 店は人の声だけでできていない。そこにいてくれるもの全部でできている。",
    ],
  },
  {
    title: "窓際族ノート",
    mood: "記録の熱",
    target: "note",
    item: "空白のページ",
    quest: "窓際族ノートを読み、そば屋とやめ太郎の視点を重ねる。",
    lines: [
      "窓際族ノート: そば屋、やめ太郎、名前のある仲間たち。端の席に集まった記録が重なっている。",
      "メモの隅に『窓際族ってメルカリやってんの？』と書いてある。誰も答えていない。",
      "そば屋: 答えがない問いも、置いておけば誰かが笑える。",
      "やめ太郎: {playerName}、お前のページも空けてある。まだ何も書かれていないのがいい。",
    ],
  },
  {
    title: "名前を書く",
    mood: "引き継ぎ",
    target: "note",
    item: "{playerName}のページ",
    quest: "空白のページに、自分の名前と今日の出来事を書く。",
    lines: [
      "{playerName}は窓際族ノートの空白に、自分の名前を書いた。",
      "{playerName}: 端に来たのに、中心より人の顔が見える気がします。",
      "そば屋: いい観察だ。窓際は外も中も見える。だから物語が増える。",
      "やめ太郎: その一文、あとで指名手配書にも使えるな。",
    ],
  },
  {
    title: "窓辺を見る",
    mood: "夕方の光",
    target: "window",
    item: "窓辺の視点",
    quest: "窓辺に立ち、端っこの席から見える景色を確かめる。",
    lines: [
      "窓辺に立つと、社内の音が少し遠くなり、外の光が机の端まで伸びている。",
      "そば屋: 追いやられた場所でも、見えるものがある。見えたものをどう扱うかは自分で決める。",
      "{playerName}: 窓際族物語は、負けた人の話ではないんですね。",
      "やめ太郎: そうだ。負けた顔で開店準備をする人たちの話だ。",
    ],
  },
  {
    title: "窓際酒場、開店",
    mood: "営業中",
    target: "counter",
    item: "窓際族物語",
    quest: "{playerName}として、窓際族物語の続きを引き受ける。",
    lines: [
      "{playerName}は窓際酒場の前に立ち、看板の下に自分のページを差し込んだ。",
      "そば屋: よし。これで窓際族物語は、追体験から引き継ぎに変わった。",
      "やめ太郎: 端っこに来たら、またここを開ければいい。窓辺の席は空けておく。",
      "全員が少しだけ静かになったあと、昼休みのチャイムが鳴った。",
      "窓際族物語、完。けれどチャイムが鳴れば、次のページが始まる。",
    ],
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
  state.pathTarget = null;
  state.chapterFlash = 18;
  state.message = showNameGate ? "名前を入力して開始する。" : "Space / Talk で会話。そば屋に声をかける。";
  dialogBox.classList.add("hidden");
  nameGate.classList.toggle("hidden", !showNameGate);
  keys.clear();
  for (const key of Object.keys(heldControls)) heldControls[key] = false;
  if (!showNameGate) saveProgress();
  updatePanels();
}

function startGame() {
  const name = playerNameInput.value.trim().replace(/\s+/g, " ").slice(0, 12);
  state.playerName = name || DEFAULT_PLAYER_NAME;
  playerNameInput.value = state.playerName;
  clearSave();
  resetGame(false);
  playerNameInput.blur();
}

function continueGame() {
  const save = readSave();
  if (!save) return;
  state.playerName = save.playerName || DEFAULT_PLAYER_NAME;
  playerNameInput.value = state.playerName;
  resetGame(false);
  state.chapter = clamp(save.chapter || 0, 0, story.length);
  state.ending = Boolean(save.ending) || state.chapter >= story.length;
  state.inventory = new Set(Array.isArray(save.inventory) ? save.inventory : []);
  state.message = state.ending ? "窓際族物語を引き継いだ。" : currentStory().quest;
  saveProgress();
  updatePanels();
}

function updatePanels() {
  if (!state.started) {
    questText.textContent = "そば屋に名前を教えて、窓際族物語を始める。";
    progressText.textContent = "--";
    moodText.textContent = "開始前";
  } else {
    questText.textContent = state.ending
      ? `${state.playerName}は窓際族物語を引き継いだ。`
      : formatText(currentStory().quest);
    progressText.textContent = state.ending ? "完" : `${state.chapter + 1}/${story.length}`;
    moodText.textContent = state.ending ? "余韻" : currentStory().mood;
  }

  inventoryList.innerHTML = "";
  const items = Array.from(state.inventory);
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "なし";
    inventoryList.append(li);
  } else {
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = formatText(item);
      inventoryList.append(li);
    }
  }

  const save = readSave();
  continueButton.classList.toggle("hidden", !save);
  saveText.textContent = save
    ? `${save.playerName || DEFAULT_PLAYER_NAME} / ${save.ending ? "完" : `${(save.chapter || 0) + 1}章`} まで保存`
    : state.started
      ? "このブラウザに自動保存中"
      : "未開始";
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function update() {
  player.frameTick += 1;
  if (state.chapterFlash > 0) state.chapterFlash -= 1;
  if (!state.started || state.ending) return;
  if (state.dialogQueue.length) return;

  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("KeyA") || heldControls.left) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD") || heldControls.right) dx += 1;
  if (keys.has("ArrowUp") || keys.has("KeyW") || heldControls.up) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS") || heldControls.down) dy += 1;

  if (dx || dy) {
    state.pathTarget = null;
    const len = Math.hypot(dx, dy);
    movePlayer((dx / len) * player.speed, (dy / len) * player.speed);
    return;
  }

  if (state.pathTarget) {
    walkTowardPathTarget();
  }
}

function movePlayer(dx, dy) {
  const nextX = { x: player.x + dx, y: player.y, w: player.w, h: player.h };
  if (canMoveTo(nextX)) player.x = nextX.x;
  const nextY = { x: player.x, y: player.y + dy, w: player.w, h: player.h };
  if (canMoveTo(nextY)) player.y = nextY.y;
}

function canMoveTo(rect) {
  if (rect.x < 30 || rect.y < 64 || rect.x + rect.w > W - 30 || rect.y + rect.h > H - 34) return false;
  return !colliders.some((collider) => rectsOverlap(rect, collider));
}

function walkTowardPathTarget() {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  const dx = state.pathTarget.x - cx;
  const dy = state.pathTarget.y - cy;
  const distance = Math.hypot(dx, dy);
  if (distance < 7) {
    const shouldInteract = state.pathTarget.autoInteract;
    state.pathTarget = null;
    if (shouldInteract) tryInteract();
    return;
  }
  const speed = Math.min(player.speed * 1.08, distance);
  movePlayer((dx / distance) * speed, (dy / distance) * speed);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawOffice();
  drawActors();
  drawPathTarget();
  drawPet(player.pet, player.x - 24, player.y - 50, 82, 88);
  drawHud();
  if (state.ending) drawEnding();
}

function drawOffice() {
  const chapterRatio = state.started ? state.chapter / Math.max(story.length - 1, 1) : 0;
  const sky = lerpColor([92, 169, 230], [238, 154, 87], chapterRatio * 0.75);
  ctx.fillStyle = "#26313a";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgb(${sky.join(",")})`;
  ctx.fillRect(40, 42, 880, 82);
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  for (let x = 54; x < 900; x += 92) ctx.fillRect(x, 52, 54, 58);
  ctx.fillStyle = "rgba(242,193,78,0.12)";
  ctx.beginPath();
  ctx.moveTo(40, 124);
  ctx.lineTo(920, 124);
  ctx.lineTo(800, 540);
  ctx.lineTo(0, 540);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2f3a44";
  ctx.fillRect(0, 124, W, 20);

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
  if (state.chapter < 6) drawDebris();
  drawDust();
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

function drawDust() {
  ctx.fillStyle = "rgba(237,242,244,0.22)";
  for (let i = 0; i < 16; i += 1) {
    const x = 74 + ((i * 131 + player.frameTick * 0.28) % 820);
    const y = 164 + ((i * 47 + Math.sin(player.frameTick / 38 + i) * 18) % 310);
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawActors() {
  const targetId = !state.ending && state.started ? currentStory().target : null;
  for (const [id, actor] of Object.entries(actors)) {
    if (!state.started && id !== "sobaya") continue;
    if (actor.visibleFrom > state.chapter) continue;
    drawActor(actor, id === targetId);
  }
}

function drawActor(actor, isTarget) {
  if (actor.pet) drawPet(actor.pet, actor.x - 18, actor.y - 46, 78, 84);
  else if (actor.color) {
    ctx.fillStyle = actor.color;
    ctx.fillRect(actor.x, actor.y, actor.w, actor.h);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(actor.x + 8, actor.y + 8, actor.w - 16, 10);
  }

  ctx.fillStyle = "#edf2f4";
  ctx.font = "700 12px system-ui, sans-serif";
  ctx.fillText(actor.name, actor.x + 4, actor.y + actor.h + 14);

  if (isTarget) {
    const pulse = 1 + Math.sin(player.frameTick / 8) * 0.12;
    drawMarker(actor.approachX, actor.approachY - 26, pulse);
    ctx.strokeStyle = "rgba(242,193,78,0.52)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(actor.approachX, actor.approachY, 22 + Math.sin(player.frameTick / 10) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawMarker(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#f2c14e";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-11, -20);
  ctx.lineTo(11, -20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPathTarget() {
  if (!state.pathTarget) return;
  ctx.strokeStyle = "rgba(72,191,132,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(state.pathTarget.x, state.pathTarget.y, 12 + Math.sin(player.frameTick / 5) * 3, 0, Math.PI * 2);
  ctx.stroke();
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
  ctx.fillStyle = "rgba(17,19,22,0.84)";
  ctx.fillRect(18, 16, 560, 62);
  ctx.fillStyle = "#f2c14e";
  ctx.font = "800 16px system-ui, sans-serif";
  const heading = state.started
    ? `${state.playerName} / ${state.ending ? "完" : `第${state.chapter + 1}章`} / ${state.ending ? "窓際族物語" : currentStory().title}`
    : "名前入力";
  ctx.fillText(trimCanvasText(heading, 520), 38, 40);
  ctx.fillStyle = "#edf2f4";
  ctx.font = "600 14px system-ui, sans-serif";
  ctx.fillText(trimCanvasText(formatText(state.message), 520), 38, 63);

  if (state.chapterFlash > 0 && state.started && !state.ending) {
    ctx.globalAlpha = state.chapterFlash / 18;
    ctx.fillStyle = "rgba(242,193,78,0.12)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

function drawEnding() {
  ctx.fillStyle = "rgba(17,19,22,0.68)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1b2026";
  ctx.fillRect(228, 124, 504, 288);
  ctx.strokeStyle = "#48bf84";
  ctx.strokeRect(228.5, 124.5, 503, 287);
  ctx.textAlign = "center";
  ctx.fillStyle = "#edf2f4";
  ctx.font = "900 38px system-ui, sans-serif";
  ctx.fillText("窓際族物語 完", W / 2, 196);
  ctx.fillStyle = "#c5ced8";
  ctx.font = "600 18px system-ui, sans-serif";
  ctx.fillText(`${state.playerName}は、そば屋とやめ太郎の物語を引き継いだ。`, W / 2, 254);
  ctx.fillText("端っこの席から、次のページが始まる。", W / 2, 292);
  ctx.fillStyle = "#f2c14e";
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.fillText("New Gameで、もう一度名前を聞かれる。酔っ払っているので。", W / 2, 348);
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
  if (state.ending) return;

  const actor = actors[currentStory().target];
  if (!isNearActor(actor)) {
    guideToTarget(true);
    state.message = `${actor.name}の近くまで移動中。もう一度Talkで会話。`;
    updatePanels();
    return;
  }

  state.pathTarget = null;
  state.dialogSpeaker = actor.name;
  state.dialogQueue = [...currentStory().lines];
  state.pendingItem = currentStory().item || null;
  state.pendingNext = state.chapter + 1;
  advanceDialog();
}

function advanceDialog() {
  if (!state.dialogQueue.length) {
    dialogBox.classList.add("hidden");
    nextDialogButton.blur();
    if (state.pendingItem) state.inventory.add(formatText(state.pendingItem));
    if (state.pendingNext !== undefined && state.pendingNext > state.chapter) {
      state.chapter = state.pendingNext;
      state.chapterFlash = 18;
    }
    state.ending = state.chapter >= story.length;
    state.message = state.ending ? "窓際族物語を引き継いだ。" : currentStory().quest;
    state.pendingItem = null;
    state.pendingNext = undefined;
    saveProgress();
    updatePanels();
    return;
  }
  speakerName.textContent = state.dialogSpeaker;
  dialogText.textContent = formatText(state.dialogQueue.shift());
  dialogBox.classList.remove("hidden");
}

function guideToTarget(autoInteract = false) {
  if (!state.started || state.ending) return;
  const actor = actors[currentStory().target];
  state.pathTarget = {
    x: actor.approachX,
    y: actor.approachY,
    autoInteract,
  };
  state.message = `${actor.name}へ向かう。`;
}

function handleCanvasPointer(event) {
  if (!state.started || state.ending) return;
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * W;
  const y = ((event.clientY - rect.top) / rect.height) * H;
  const actor = actors[currentStory().target];
  const hitTarget =
    pointInRect(x, y, actor) || Math.hypot(x - actor.approachX, y - actor.approachY) < 72;
  state.pathTarget = hitTarget
    ? { x: actor.approachX, y: actor.approachY, autoInteract: true }
    : { x, y, autoInteract: false };
  state.message = hitTarget ? `${actor.name}へ向かう。` : "タップした場所へ移動する。";
  updatePanels();
}

function currentStory() {
  return story[Math.min(state.chapter, story.length - 1)];
}

function isNearActor(actor) {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  return Math.hypot(cx - actor.approachX, cy - actor.approachY) < 64;
}

function formatText(text) {
  return String(text).replaceAll("{playerName}", state.playerName);
}

function trimCanvasText(text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 0 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}...`;
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerpColor(from, to, amount) {
  return from.map((value, index) => Math.round(value + (to[index] - value) * amount));
}

function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveProgress() {
  if (!state.started) return;
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        playerName: state.playerName,
        chapter: state.chapter,
        inventory: Array.from(state.inventory),
        ending: state.ending,
      }),
    );
  } catch {
    saveText.textContent = "保存できませんでした";
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore storage failures; the game still works without persistence.
  }
}

function setHeld(key, value) {
  if (key === "interact" && value) tryInteract();
  if (key === "guide" && value) guideToTarget(false);
  if (key in heldControls) heldControls[key] = value;
}

window.addEventListener("keydown", (event) => {
  const target = event.target;
  const isFormControl = target instanceof HTMLInputElement || target instanceof HTMLButtonElement;
  if (isFormControl) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
  if (event.code === "Space" || event.code === "Enter") tryInteract();
  if (event.code === "KeyG") guideToTarget(false);
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
  button.addEventListener("pointerleave", () => setHeld(button.dataset.key, false));
  button.addEventListener("pointercancel", () => setHeld(button.dataset.key, false));
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

canvas.addEventListener("pointerdown", handleCanvasPointer);
nextDialogButton.addEventListener("click", advanceDialog);
document.querySelector("#newGameButton").addEventListener("click", () => resetGame(true));
continueButton.addEventListener("click", continueGame);
playerNameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  startGame();
});

loadSprites().then(() => {
  const save = readSave();
  if (save?.playerName) playerNameInput.value = save.playerName;
  resetGame(true);
  requestAnimationFrame(loop);
});
