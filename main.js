
import './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const PLAYERS_COLLECTION = 'players';

const startScreen = document.getElementById('start-screen');
const questionModal = document.getElementById('question-modal');
const resultModal = document.getElementById('result-modal');
const hud = document.getElementById('hud');
const leaderboardMini = document.getElementById('leaderboard-mini');
const jumpBtn = document.getElementById('jump-btn');

const studentNameInput = document.getElementById('student-name');
const studentClassSelect = document.getElementById('student-class');
const startBtn = document.getElementById('start-btn');
const refreshBoardBtn = document.getElementById('refresh-board-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const closeResultBtn = document.getElementById('close-result-btn');

const hudPlayer = document.getElementById('hud-player');
const hudScore = document.getElementById('hud-score');
const hudLevel = document.getElementById('hud-level');
const hudClass = document.getElementById('hud-class');

const questionTopic = document.getElementById('question-topic');
const questionText = document.getElementById('question-text');
const questionSubtitle = document.getElementById('question-subtitle');
const answersContainer = document.getElementById('answers-container');
const top3List = document.getElementById('top3-list');
const leaderboardTableBody = document.getElementById('leaderboard-table-body');
const firebaseStatus = document.getElementById('firebase-status');
const storageStatus = document.getElementById('storage-status');

const summaryName = document.getElementById('summary-name');
const summaryClass = document.getElementById('summary-class');
const summaryScore = document.getElementById('summary-score');
const summaryLevel = document.getElementById('summary-level');
const summaryTreasures = document.getElementById('summary-treasures');
const summaryCorrect = document.getElementById('summary-correct');

const firebaseConfig = window.FIREBASE_CONFIG || null;
const firebaseReady = firebaseConfig && Object.values(firebaseConfig).every(v => v && !String(v).includes('YOUR_'));
let db = null;
if (firebaseReady) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}
firebaseStatus.textContent = firebaseReady ? 'تم ربط Firebase — النتائج ستُحفظ أونلاين' : 'لم يتم ربط Firebase بعد — سيتم استخدام التخزين المحلي للتجربة';
storageStatus.textContent = firebaseReady ? 'وضع التخزين: Firebase Firestore مباشر' : 'وضع التخزين: LocalStorage مؤقت';

const QUESTION_BANK = {
  permutations: [
    { topic: 'التباديل', text: 'كم عدد طرق ترتيب ٥ كتب مختلفة في صف مستقيم؟', choices: ['١٢٠', '٦٠', '٢٥', '١٠'], answer: '١٢٠' },
    { topic: 'التباديل', text: 'قيمة ٦! تساوي:', choices: ['٧٢٠', '١٢٠', '٦٠', '٣٦٠'], answer: '٧٢٠' },
    { topic: 'التباديل', text: 'كم عدد الأعداد المختلفة المكونة من ٣ أرقام من ١،٢،٣،٤ دون تكرار؟', choices: ['٢٤', '١٢', '٦', '٦٤'], answer: '٢٤' },
    { topic: 'التباديل', text: 'قانون التباديل ن ل ر هو:', choices: ['ن! ÷ (ن-ر)!', 'ن! ÷ ر!', 'ر! ÷ ن!', 'ن! ÷ (ر!(ن-ر)!)'], answer: 'ن! ÷ (ن-ر)!' }
  ],
  combinations: [
    { topic: 'التوافيق', text: 'كم عدد طرق اختيار طالبين من بين ٥ طلاب؟', choices: ['١٠', '٢٠', '٥', '٢٥'], answer: '١٠' },
    { topic: 'التوافيق', text: 'في التوافيق هل الترتيب مهم؟', choices: ['لا', 'نعم', 'أحيانًا', 'دائمًا'], answer: 'لا' },
    { topic: 'التوافيق', text: 'قانون التوافيق ن ق ر هو:', choices: ['ن! ÷ (ر!(ن-ر)!)', 'ن! ÷ (ن-ر)!', 'ر! ÷ (ن-ر)!', 'ن! × ر!'], answer: 'ن! ÷ (ر!(ن-ر)!)' },
    { topic: 'التوافيق', text: 'كم عدد اللجان من ٣ طلاب من أصل ٦؟', choices: ['٢٠', '١٨', '١٢٠', '١٥'], answer: '٢٠' }
  ],
  binomial: [
    { topic: 'نظرية ذات الحدين', text: 'عدد حدود مفكوك (أ + ب)^٧ هو:', choices: ['٨', '٧', '٦', '٩'], answer: '٨' },
    { topic: 'نظرية ذات الحدين', text: 'معامل الحد الثاني في مفكوك (١ + س)^٤ هو:', choices: ['٤', '٦', '١', '٣'], answer: '٤' },
    { topic: 'نظرية ذات الحدين', text: 'مجموع معاملات (١ + س)^٤ يساوي:', choices: ['١٦', '٨', '٤', '٣٢'], answer: '١٦' },
    { topic: 'نظرية ذات الحدين', text: 'الحد العام في مفكوك (أ + ب)^ن يعتمد على:', choices: ['التوافيق', 'المصفوفات', 'المتباينات', 'اللوغاريتمات'], answer: 'التوافيق' }
  ]
};

function getRandomQuestion() {
  const pools = Object.values(QUESTION_BANK);
  const pool = pools[Math.floor(Math.random() * pools.length)];
  return JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
}

const state = {
  playerName: '',
  playerClass: '',
  totalScore: 0,
  level: 1,
  highestLevel: 1,
  treasuresCollected: 0,
  correctAnswers: 0,
  leaderboard: [],
  currentScene: null,
  pendingJump: false,
  sessionStarted: false
};

function resetState() {
  state.totalScore = 0;
  state.level = 1;
  state.highestLevel = 1;
  state.treasuresCollected = 0;
  state.correctAnswers = 0;
  state.pendingJump = false;
  state.sessionStarted = true;
  updateHUD();
}

function updateHUD() {
  hudPlayer.textContent = state.playerName || '-';
  hudClass.textContent = state.playerClass || '-';
  hudScore.textContent = String(state.totalScore);
  hudLevel.textContent = String(state.level);
}

function addScore(v) {
  state.totalScore = Math.max(0, state.totalScore + v);
  updateHUD();
}

function setLevel(v) {
  state.level = v;
  state.highestLevel = Math.max(state.highestLevel, v);
  updateHUD();
}

const LOCAL_KEY = 'ninja_math_runner_leaderboard_v2';
function playerId(name, classroom) {
  return `${name}_${classroom}`.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^؀-ۿ\w_/-]/g, '');
}
function sortBoard(rows) {
  return [...rows].sort((a, b) => {
    if ((b.totalScore || 0) !== (a.totalScore || 0)) return (b.totalScore || 0) - (a.totalScore || 0);
    if ((b.highestLevel || 0) !== (a.highestLevel || 0)) return (b.highestLevel || 0) - (a.highestLevel || 0);
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}
function getLocalBoard() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}
function setLocalBoard(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  state.leaderboard = sortBoard(data);
  renderBoard();
}

async function registerPlayerStart() {
  const entry = { name: state.playerName, classroom: state.playerClass, lastStartAt: Date.now() };
  if (firebaseReady && db) {
    await setDoc(doc(db, PLAYERS_COLLECTION, playerId(entry.name, entry.classroom)), entry, { merge: true });
  }
}

async function saveResult() {
  const entry = {
    name: state.playerName,
    classroom: state.playerClass,
    totalScore: state.totalScore,
    highestLevel: state.highestLevel,
    treasuresCollected: state.treasuresCollected,
    correctAnswers: state.correctAnswers,
    updatedAt: Date.now()
  };

  if (firebaseReady && db) {
    const ref = doc(db, PLAYERS_COLLECTION, playerId(entry.name, entry.classroom));
    const oldSnap = await getDoc(ref);
    if (oldSnap.exists()) {
      const old = oldSnap.data();
      entry.totalScore = Math.max(old.totalScore || 0, entry.totalScore || 0);
      entry.highestLevel = Math.max(old.highestLevel || 0, entry.highestLevel || 0);
      entry.treasuresCollected = Math.max(old.treasuresCollected || 0, entry.treasuresCollected || 0);
      entry.correctAnswers = Math.max(old.correctAnswers || 0, entry.correctAnswers || 0);
    }
    await setDoc(ref, entry, { merge: true });
  } else {
    const rows = getLocalBoard();
    const id = playerId(entry.name, entry.classroom);
    const idx = rows.findIndex(r => playerId(r.name, r.classroom) === id);
    if (idx >= 0) {
      rows[idx] = {
        ...rows[idx],
        totalScore: Math.max(rows[idx].totalScore || 0, entry.totalScore),
        highestLevel: Math.max(rows[idx].highestLevel || 0, entry.highestLevel),
        treasuresCollected: Math.max(rows[idx].treasuresCollected || 0, entry.treasuresCollected),
        correctAnswers: Math.max(rows[idx].correctAnswers || 0, entry.correctAnswers),
        updatedAt: Date.now()
      };
    } else {
      rows.push(entry);
    }
    setLocalBoard(rows);
  }
}

function subscribeBoard() {
  if (firebaseReady && db) {
    const q = query(collection(db, PLAYERS_COLLECTION), orderBy('totalScore', 'desc'), limit(100));
    onSnapshot(q, snapshot => {
      state.leaderboard = sortBoard(snapshot.docs.map(d => d.data()));
      renderBoard();
    });
  } else {
    state.leaderboard = sortBoard(getLocalBoard());
    renderBoard();
  }
}

function renderBoard() {
  const rows = state.leaderboard || [];
  top3List.innerHTML = '';
  leaderboardTableBody.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const item = rows[i];
    const card = document.createElement('div');
    card.className = 'rank-card';
    card.innerHTML = item ? `<div class="rank-num">${i + 1}</div><div class="rank-name">${item.name}</div><div class="rank-meta">${item.classroom}</div><div class="rank-meta">${item.totalScore} نقطة</div>` : `<div class="rank-num">${i + 1}</div><div class="rank-name">---</div><div class="rank-meta">لا يوجد</div>`;
    top3List.appendChild(card);
  }
  rows.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${index + 1}</td><td>${item.name}</td><td>${item.classroom}</td><td>${item.totalScore}</td><td>${item.highestLevel}</td>`;
    leaderboardTableBody.appendChild(tr);
  });
}

function askQuestion(type, payload = {}) {
  return new Promise(resolve => {
    const q = getRandomQuestion();
    questionSubtitle.textContent = type === 'hazard' ? 'أجب لتنقذ اللاعب من الخطر' : type === 'treasure' ? 'أجب لتحصل على الكنز' : 'سؤال نهاية المستوى';
    questionTopic.textContent = q.topic;
    questionText.textContent = q.text;
    answersContainer.innerHTML = '';
    q.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = choice;
      btn.onclick = () => {
        const correct = choice === q.answer;
        if (correct) state.correctAnswers += 1;
        questionModal.classList.add('hidden');
        updateHUD();
        resolve({ correct, payload, type });
      };
      answersContainer.appendChild(btn);
    });
    questionModal.classList.remove('hidden');
  });
}

function rangeKeys(prefix, from, to, digits = 4) {
  const arr = [];
  for (let i = from; i <= to; i++) arr.push(`${prefix}${String(i).padStart(digits, '0')}`);
  return arr;
}

const HERO_RUN = rangeKeys('hero', 1, 12);
const HERO_AIR = rangeKeys('hero', 19, 24);
const ENEMY_RUN = rangeKeys('enemy', 1, 12);
const COIN_FRAMES = rangeKeys('coin', 1, 12);

class AnimatedArcadeImage extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, texture, frames = [texture], frameRate = 90) {
    super(scene, x, y, texture);
    this.framesList = frames;
    this.frameIndex = 0;
    this.frameRate = frameRate;
    this.accumulator = 0;
  }
  setFrames(frames, restart = false) {
    this.framesList = frames;
    if (restart) this.frameIndex = 0;
    if (this.framesList?.length) this.setTexture(this.framesList[Math.min(this.frameIndex, this.framesList.length - 1)]);
  }
  step(delta) {
    if (!this.framesList || this.framesList.length <= 1) return;
    this.accumulator += delta;
    if (this.accumulator >= this.frameRate) {
      this.accumulator = 0;
      this.frameIndex = (this.frameIndex + 1) % this.framesList.length;
      this.setTexture(this.framesList[this.frameIndex]);
    }
  }
}

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  preload() {
    this.load.image('bg-day', 'assets/backgrounds/bg-day.png');
    this.load.image('bg-night', 'assets/backgrounds/bg-night.png');
    this.load.image('ground', 'assets/tiles/ground.png');
    this.load.image('platform1', 'assets/tiles/platform1.png');
    this.load.image('platform2', 'assets/tiles/platform2.png');
    this.load.image('platform3', 'assets/tiles/platform3.png');

    for (let i = 1; i <= 48; i++) this.load.image(`hero${String(i).padStart(4, '0')}`, `assets/hero/hero${String(i).padStart(4, '0')}.png`);
    for (let i = 1; i <= 69; i++) this.load.image(`enemy${String(i).padStart(4, '0')}`, `assets/enemy/enemy${String(i).padStart(4, '0')}.png`);
    for (let i = 1; i <= 12; i++) this.load.image(`coin${String(i).padStart(4, '0')}`, `assets/coins/coins${String(i).padStart(4, '0')}.png`);
    for (let i = 1; i <= 3; i++) this.load.image(`treasure${String(i).padStart(4, '0')}`, `assets/treasure/treasure${String(i).padStart(4, '0')}.png`);
  }
  create() { this.scene.start('Level1Scene'); }
}

class BaseLevelScene extends Phaser.Scene {
  constructor(key, levelNumber) {
    super(key);
    this.levelNumber = levelNumber;
  }

  create() {
    state.currentScene = this;
    setLevel(this.levelNumber);
    this.challengeActive = false;
    this.collectedTreasureIds = new Set();
    this.respawnPoint = { x: 120, y: 420 };
    this.physics.world.setBounds(0, 0, 3200, 720);
    this.cameras.main.setBounds(0, 0, 3200, 720);

    this.add.image(640, 360, this.levelNumber === 1 ? 'bg-day' : 'bg-night').setScrollFactor(0).setDisplaySize(1280, 720);

    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.group({ allowGravity: false, immovable: true });
    this.treasures = this.physics.add.group({ allowGravity: false, immovable: true });
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });

    this.createPlatforms();
    this.createPlayer();
    this.createEnemies();
    this.createCoins();
    this.createTreasures();
    this.createFinish();

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.hazards, (player, hazard) => this.triggerHazard(hazard), null, this);
    this.physics.add.overlap(this.player, this.coins, (player, coin) => this.collectCoin(coin), null, this);
    this.physics.add.overlap(this.player, this.treasures, (player, treasure) => this.triggerTreasure(treasure), null, this);
    this.physics.add.overlap(this.player, this.finishFlag, () => this.triggerEndLevel(), null, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  createPlatformTile(x, y, width, texture = 'ground') {
    const count = Math.ceil(width / 76);
    const container = this.add.container(x, y);
    for (let i = 0; i < count; i++) {
      const img = this.add.image((i * 76) - (count * 76)/2 + 38, 0, texture);
      img.setScale(1.05);
      container.add(img);
    }
    const bodyZone = this.add.zone(x, y, count * 76, 36);
    this.physics.add.existing(bodyZone, true);
    this.platforms.add(bodyZone);
    return bodyZone;
  }

  createPlatforms() {
    const data = this.levelNumber === 1 ? [
      {x: 260, y: 650, w: 720, t: 'ground'},
      {x: 930, y: 570, w: 280, t: 'platform1'},
      {x: 1300, y: 500, w: 300, t: 'platform2'},
      {x: 1720, y: 450, w: 260, t: 'platform3'},
      {x: 2080, y: 520, w: 340, t: 'platform1'},
      {x: 2520, y: 470, w: 260, t: 'platform2'},
      {x: 2930, y: 620, w: 480, t: 'ground'}
    ] : [
      {x: 260, y: 650, w: 720, t: 'ground'},
      {x: 920, y: 560, w: 220, t: 'platform2'},
      {x: 1230, y: 470, w: 260, t: 'platform1'},
      {x: 1550, y: 390, w: 220, t: 'platform3'},
      {x: 1880, y: 470, w: 260, t: 'platform2'},
      {x: 2240, y: 380, w: 220, t: 'platform1'},
      {x: 2590, y: 510, w: 300, t: 'platform3'},
      {x: 2970, y: 620, w: 420, t: 'ground'}
    ];
    data.forEach((p, index) => {
      const zone = this.createPlatformTile(p.x, p.y, p.w, p.t);
      if (index === 0) this.respawnPoint = { x: p.x - 250, y: p.y - 130 };
    });
  }

  createPlayer() {
    this.player = new AnimatedArcadeImage(this, this.respawnPoint.x, this.respawnPoint.y, HERO_RUN[0], HERO_RUN, 70);
    this.add.existing(this.player);
    this.physics.add.existing(this.player);
    this.player.setScale(0.24);
    this.player.setCollideWorldBounds(false);
    this.player.body.setGravityY(1300);
    this.player.body.setSize(150, 250);
    this.player.body.setOffset(180, 60);
  }

  addEnemy(x, y) {
    const enemy = new AnimatedArcadeImage(this, x, y, ENEMY_RUN[0], ENEMY_RUN, 90);
    this.add.existing(enemy);
    this.physics.add.existing(enemy);
    enemy.setScale(0.20);
    enemy.body.setAllowGravity(false);
    enemy.body.setImmovable(true);
    enemy.body.setSize(160, 220);
    enemy.body.setOffset(180, 90);
    this.hazards.add(enemy);
  }

  createEnemies() {
    const enemyData = this.levelNumber === 1 ? [
      {x: 1050, y: 500}, {x: 1800, y: 380}, {x: 2590, y: 390}
    ] : [
      {x: 980, y: 490}, {x: 1610, y: 320}, {x: 2300, y: 310}, {x: 2680, y: 440}
    ];
    enemyData.forEach(e => this.addEnemy(e.x, e.y));

    const spikes = this.levelNumber === 1 ? [
      {x: 740, y: 640}, {x: 1500, y: 490}, {x: 2200, y: 510}
    ] : [
      {x: 730, y: 640}, {x: 1410, y: 460}, {x: 2040, y: 460}, {x: 2860, y: 610}
    ];
    spikes.forEach((s, index) => {
      const spike = this.add.triangle(s.x, s.y, 0, 24, 18, 0, 36, 24, 0xef4444);
      this.physics.add.existing(spike);
      spike.body.setAllowGravity(false);
      spike.body.setImmovable(true);
      spike.name = `spike-${this.levelNumber}-${index}`;
      this.hazards.add(spike);
    });
  }

  addCoin(x, y) {
    const coin = new AnimatedArcadeImage(this, x, y, COIN_FRAMES[0], COIN_FRAMES, 80);
    this.add.existing(coin);
    this.physics.add.existing(coin);
    coin.setScale(0.7);
    coin.body.setAllowGravity(false);
    coin.body.setImmovable(true);
    this.coins.add(coin);
  }

  createCoins() {
    const data = this.levelNumber === 1 ? [
      [500, 560], [580, 560], [660, 560], [930, 480], [1010, 480], [1300, 410], [1720, 360], [2520, 380]
    ] : [
      [520, 560], [920, 470], [1230, 380], [1550, 300], [1880, 390], [2240, 290], [2590, 430]
    ];
    data.forEach(([x, y]) => this.addCoin(x, y));
  }

  createTreasures() {
    const data = this.levelNumber === 1 ? [
      {x: 1400, y: 420, t: 'treasure0001', id: 't1'}, {x: 2700, y: 540, t: 'treasure0002', id: 't2'}
    ] : [
      {x: 1730, y: 360, t: 'treasure0003', id: 't3'}, {x: 2440, y: 300, t: 'treasure0001', id: 't4'}
    ];
    data.forEach(t => {
      const chest = this.physics.add.image(t.x, t.y, t.t);
      chest.setScale(0.18);
      chest.body.setAllowGravity(false);
      chest.body.setImmovable(true);
      chest.treasureId = t.id;
      this.treasures.add(chest);
    });
  }

  createFinish() {
    this.finishFlag = this.add.rectangle(3100, this.levelNumber === 1 ? 560 : 540, 30, 140, 0x10b981);
    this.physics.add.existing(this.finishFlag);
    this.finishFlag.body.setAllowGravity(false);
    this.finishFlag.body.setImmovable(true);
  }

  collectCoin(coin) {
    coin.destroy();
    addScore(1);
  }

  async triggerHazard(hazard) {
    if (this.challengeActive) return;
    this.challengeActive = true;
    this.physics.pause();
    const result = await askQuestion('hazard', { level: this.levelNumber });
    if (result.correct) {
      addScore(3);
      this.player.x = Math.max(this.player.x - 80, this.respawnPoint.x);
      this.player.y -= 40;
    } else {
      addScore(-2);
      this.respawnPlayer();
    }
    this.physics.resume();
    this.challengeActive = false;
  }

  async triggerTreasure(treasure) {
    if (this.challengeActive || this.collectedTreasureIds.has(treasure.treasureId)) return;
    this.challengeActive = true;
    this.physics.pause();
    const result = await askQuestion('treasure', { treasureId: treasure.treasureId });
    if (result.correct) {
      addScore(5);
      state.treasuresCollected += 1;
    }
    this.collectedTreasureIds.add(treasure.treasureId);
    treasure.destroy();
    updateHUD();
    this.physics.resume();
    this.challengeActive = false;
  }

  async triggerEndLevel() {
    if (this.challengeActive) return;
    this.challengeActive = true;
    this.physics.pause();
    const result = await askQuestion('levelEnd', { level: this.levelNumber });
    if (result.correct) addScore(10);
    else addScore(-2);

    if (this.levelNumber === 1) {
      this.scene.start('Level2Scene');
    } else {
      await finishGame();
    }
  }

  respawnPlayer() {
    this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y);
    this.player.body.setVelocity(0, 0);
  }

  update(time, delta) {
    if (!this.player || this.challengeActive) return;

    this.player.setVelocityX(this.levelNumber === 1 ? 220 : 240);

    const canJump = this.player.body.blocked.down || this.player.body.touching.down;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.spaceKey) || state.pendingJump;
    if (jumpPressed && canJump) {
      this.player.setVelocityY(-650);
      state.pendingJump = false;
    }

    this.player.setFrames(canJump ? HERO_RUN : HERO_AIR);
    this.player.step(delta);

    this.hazards.getChildren().forEach(obj => { if (obj.step) obj.step(delta); });
    this.coins.getChildren().forEach(obj => { if (obj.step) obj.step(delta); });

    if (this.player.y > 900) {
      this.triggerHazard({ name: 'fall' });
    }
  }
}

class Level1Scene extends BaseLevelScene { constructor() { super('Level1Scene', 1); } }
class Level2Scene extends BaseLevelScene { constructor() { super('Level2Scene', 2); } }

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: [BootScene, Level1Scene, Level2Scene],
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
});
window.addEventListener('resize', () => game.scale.resize(window.innerWidth, window.innerHeight));

async function finishGame() {
  try { await saveResult(); } catch (e) { console.error(e); }
  summaryName.textContent = state.playerName;
  summaryClass.textContent = state.playerClass;
  summaryScore.textContent = String(state.totalScore);
  summaryLevel.textContent = String(state.highestLevel);
  summaryTreasures.textContent = String(state.treasuresCollected);
  summaryCorrect.textContent = String(state.correctAnswers);
  hud.classList.add('hidden');
  jumpBtn.classList.add('hidden');
  resultModal.classList.remove('hidden');
}

async function startGameFlow() {
  const name = studentNameInput.value.trim();
  const classroom = studentClassSelect.value;
  if (!name || !classroom) {
    alert('يرجى كتابة اسم الطالب واختيار الصف أولًا');
    return;
  }
  state.playerName = name;
  state.playerClass = classroom;
  resetState();
  try { await registerPlayerStart(); } catch (e) { console.error(e); }
  startScreen.classList.add('hidden');
  resultModal.classList.add('hidden');
  questionModal.classList.add('hidden');
  hud.classList.remove('hidden');
  leaderboardMini.classList.remove('hidden');
  jumpBtn.classList.remove('hidden');
  updateHUD();
  game.scene.stop('Level1Scene');
  game.scene.stop('Level2Scene');
  game.scene.start('Level1Scene');
}

startBtn.addEventListener('click', startGameFlow);
refreshBoardBtn.addEventListener('click', renderBoard);
playAgainBtn.addEventListener('click', () => { resultModal.classList.add('hidden'); startScreen.classList.remove('hidden'); });
closeResultBtn.addEventListener('click', () => resultModal.classList.add('hidden'));
jumpBtn.addEventListener('pointerdown', () => { state.pendingJump = true; });
subscribeBoard();
