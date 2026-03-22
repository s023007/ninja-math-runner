import './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const PLAYERS_COLLECTION = 'players';
const LOCAL_KEY = 'ninja_math_runner_board_v3';

/* =========================
   عناصر الواجهة
========================= */
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

/* =========================
   Firebase
========================= */
const firebaseConfig = window.FIREBASE_CONFIG || null;
const firebaseReady =
  firebaseConfig &&
  Object.values(firebaseConfig).every(v => v && !String(v).includes('YOUR_'));

let db = null;

try {
  if (firebaseReady) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (err) {
  console.error('Firebase init error:', err);
  db = null;
}

if (firebaseStatus) {
  firebaseStatus.textContent = db
    ? 'تم ربط Firebase — النتائج ستُحفظ أونلاين'
    : 'لم يتم ربط Firebase بنجاح — سيتم استخدام التخزين المحلي مؤقتًا';
}

if (storageStatus) {
  storageStatus.textContent = db
    ? 'وضع التخزين: Firebase Firestore مباشر'
    : 'وضع التخزين: LocalStorage مؤقت';
}

/* =========================
   بنك الأسئلة
========================= */
const QUESTION_BANK = {
  permutations: [
    {
      topic: 'التباديل',
      text: 'كم عدد طرق ترتيب ٥ كتب مختلفة في صف مستقيم؟',
      choices: ['١٢٠', '٦٠', '٢٥', '١٠'],
      answer: '١٢٠'
    },
    {
      topic: 'التباديل',
      text: 'قيمة ٦! تساوي:',
      choices: ['٧٢٠', '١٢٠', '٦٠', '٣٦٠'],
      answer: '٧٢٠'
    },
    {
      topic: 'التباديل',
      text: 'كم عدد الأعداد المختلفة المكوّنة من ٣ أرقام من ١،٢،٣،٤ دون تكرار؟',
      choices: ['٢٤', '١٢', '٦', '٦٤'],
      answer: '٢٤'
    },
    {
      topic: 'التباديل',
      text: 'قانون التباديل ن ل ر هو:',
      choices: ['ن! ÷ (ن-ر)!', 'ن! ÷ ر!', 'ر! ÷ ن!', 'ن! ÷ (ر!(ن-ر)!)'],
      answer: 'ن! ÷ (ن-ر)!'
    }
  ],
  combinations: [
    {
      topic: 'التوافيق',
      text: 'كم عدد طرق اختيار طالبين من بين ٥ طلاب؟',
      choices: ['١٠', '٢٠', '٥', '٢٥'],
      answer: '١٠'
    },
    {
      topic: 'التوافيق',
      text: 'في التوافيق هل الترتيب مهم؟',
      choices: ['لا', 'نعم', 'أحيانًا', 'دائمًا'],
      answer: 'لا'
    },
    {
      topic: 'التوافيق',
      text: 'قانون التوافيق ن ق ر هو:',
      choices: ['ن! ÷ (ر!(ن-ر)!)', 'ن! ÷ (ن-ر)!', 'ر! ÷ (ن-ر)!', 'ن! × ر!'],
      answer: 'ن! ÷ (ر!(ن-ر)!)'
    },
    {
      topic: 'التوافيق',
      text: 'كم عدد اللجان من ٣ طلاب من أصل ٦؟',
      choices: ['٢٠', '١٨', '١٢٠', '١٥'],
      answer: '٢٠'
    }
  ],
  binomial: [
    {
      topic: 'نظرية ذات الحدين',
      text: 'عدد حدود مفكوك (أ + ب)^٧ هو:',
      choices: ['٨', '٧', '٦', '٩'],
      answer: '٨'
    },
    {
      topic: 'نظرية ذات الحدين',
      text: 'معامل الحد الثاني في مفكوك (١ + س)^٤ هو:',
      choices: ['٤', '٦', '١', '٣'],
      answer: '٤'
    },
    {
      topic: 'نظرية ذات الحدين',
      text: 'مجموع معاملات مفكوك (١ + س)^٤ يساوي:',
      choices: ['١٦', '٨', '٤', '٣٢'],
      answer: '١٦'
    },
    {
      topic: 'نظرية ذات الحدين',
      text: 'الحد العام في مفكوك (أ + ب)^ن يعتمد على:',
      choices: ['التوافيق', 'المصفوفات', 'اللوغاريتمات', 'المتباينات'],
      answer: 'التوافيق'
    }
  ]
};

function getRandomQuestion() {
  const pools = Object.values(QUESTION_BANK);
  const randomPool = pools[Math.floor(Math.random() * pools.length)];
  return JSON.parse(
    JSON.stringify(randomPool[Math.floor(Math.random() * randomPool.length)])
  );
}

/* =========================
   حالة التطبيق
========================= */
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
  spawnProtectedUntil: 0
};

function resetState() {
  state.totalScore = 0;
  state.level = 1;
  state.highestLevel = 1;
  state.treasuresCollected = 0;
  state.correctAnswers = 0;
  state.pendingJump = false;
  state.spawnProtectedUntil = 0;
  updateHUD();
}

function updateHUD() {
  if (hudPlayer) hudPlayer.textContent = state.playerName || '-';
  if (hudClass) hudClass.textContent = state.playerClass || '-';
  if (hudScore) hudScore.textContent = String(state.totalScore);
  if (hudLevel) hudLevel.textContent = String(state.level);
}

function addScore(value) {
  state.totalScore = Math.max(0, state.totalScore + value);
  updateHUD();
}

function setLevel(value) {
  state.level = value;
  state.highestLevel = Math.max(state.highestLevel, value);
  updateHUD();
}

/* =========================
   التخزين
========================= */
function makePlayerId(name, classroom) {
  return `${name}_${classroom}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\u0600-\u06FF\w_/-]/g, '');
}

function getLocalBoard() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

function sortBoard(rows) {
  return [...rows].sort((a, b) => {
    const aScore = a.totalScore ?? a.score ?? 0;
    const bScore = b.totalScore ?? b.score ?? 0;

    const aLevel = a.highestLevel ?? a.level ?? 0;
    const bLevel = b.highestLevel ?? b.level ?? 0;

    if (bScore !== aScore) return bScore - aScore;
    if (bLevel !== aLevel) return bLevel - aLevel;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}

function setLocalBoard(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  state.leaderboard = sortBoard(data);
  renderBoard();
}

async function registerPlayerStart() {
  const entry = {
    name: state.playerName,
    classroom: state.playerClass,
    lastStartAt: Date.now()
  };

  if (db) {
    await setDoc(
      doc(db, PLAYERS_COLLECTION, makePlayerId(entry.name, entry.classroom)),
      entry,
      { merge: true }
    );
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

  if (db) {
    const ref = doc(db, PLAYERS_COLLECTION, makePlayerId(entry.name, entry.classroom));
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const old = snap.data();
      entry.totalScore = Math.max(old.totalScore || old.score || 0, entry.totalScore);
      entry.highestLevel = Math.max(old.highestLevel || old.level || 0, entry.highestLevel);
      entry.treasuresCollected = Math.max(old.treasuresCollected || 0, entry.treasuresCollected);
      entry.correctAnswers = Math.max(old.correctAnswers || 0, entry.correctAnswers);
    }

    await setDoc(ref, entry, { merge: true });
  } else {
    const rows = getLocalBoard();
    const id = makePlayerId(entry.name, entry.classroom);
    const idx = rows.findIndex(r => makePlayerId(r.name, r.classroom) === id);

    if (idx >= 0) {
      rows[idx] = {
        ...rows[idx],
        totalScore: Math.max(rows[idx].totalScore || rows[idx].score || 0, entry.totalScore),
        highestLevel: Math.max(rows[idx].highestLevel || rows[idx].level || 0, entry.highestLevel),
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
  if (db) {
    onSnapshot(collection(db, PLAYERS_COLLECTION), snapshot => {
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

  if (top3List) top3List.innerHTML = '';
  if (leaderboardTableBody) leaderboardTableBody.innerHTML = '';

  if (top3List) {
    for (let i = 0; i < 3; i++) {
      const item = rows[i];
      const score = item ? (item.totalScore ?? item.score ?? 0) : 0;

      const card = document.createElement('div');
      card.className = 'rank-card';
      card.innerHTML = item
        ? `
          <div class="rank-num">${i + 1}</div>
          <div class="rank-name">${item.name}</div>
          <div class="rank-meta">${item.classroom || '-'}</div>
          <div class="rank-meta">${score} نقطة</div>
        `
        : `
          <div class="rank-num">${i + 1}</div>
          <div class="rank-name">---</div>
          <div class="rank-meta">لا يوجد</div>
        `;
      top3List.appendChild(card);
    }
  }

  if (leaderboardTableBody) {
    rows.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.name || '-'}</td>
        <td>${item.classroom || '-'}</td>
        <td>${item.totalScore ?? item.score ?? 0}</td>
        <td>${item.highestLevel ?? item.level ?? 0}</td>
      `;
      leaderboardTableBody.appendChild(tr);
    });
  }
}

/* =========================
   نافذة السؤال
========================= */
function askQuestion(type, payload = {}) {
  return new Promise(resolve => {
    const q = getRandomQuestion();

    if (questionSubtitle) {
      questionSubtitle.textContent =
        type === 'hazard'
          ? 'أجب لتنقذ اللاعب من الخطر'
          : type === 'treasure'
          ? 'أجب لتحصل على الكنز'
          : 'سؤال نهاية المستوى';
    }

    if (questionTopic) questionTopic.textContent = q.topic;
    if (questionText) questionText.textContent = q.text;
    if (answersContainer) answersContainer.innerHTML = '';

    q.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = choice;
      btn.onclick = () => {
        const correct = choice === q.answer;
        if (correct) state.correctAnswers += 1;
        if (questionModal) questionModal.classList.add('hidden');
        updateHUD();
        resolve({ correct, type, payload });
      };

      if (answersContainer) answersContainer.appendChild(btn);
    });

    if (questionModal) questionModal.classList.remove('hidden');
  });
}

/* =========================
   Phaser Scenes
========================= */
class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {}

  create() {
    // لا نبدأ أي Level هنا
    // ننتظر ضغط زر "ابدأ اللعبة"
  }
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

    this.physics.world.setBounds(0, 0, 3200, 720);
    this.cameras.main.setBounds(0, 0, 3200, 720);
    this.cameras.main.setBackgroundColor(this.levelNumber === 1 ? '#12213b' : '#22143d');

    this.createBackground();
    this.createPlatforms();
    this.createPlayer();
    this.createCoins();
    this.createHazards();
    this.createTreasures();
    this.createFinishFlag();
    this.createUiLabel();

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.coins, (_, coin) => this.collectCoin(coin), null, this);
    this.physics.add.overlap(this.player, this.hazards, (_, hazard) => this.triggerHazard(hazard), null, this);
    this.physics.add.overlap(this.player, this.treasures, (_, treasure) => this.triggerTreasure(treasure), null, this);
    this.physics.add.overlap(this.player, this.finishFlag, () => this.triggerEndLevel(), null, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // حماية بداية حتى لا يظهر سؤال مباشرة
    state.spawnProtectedUntil = this.time.now + 3000;
  }

  createBackground() {
    const g = this.add.graphics();

    g.fillStyle(this.levelNumber === 1 ? 0x0f2748 : 0x24164f, 1);
    g.fillRect(0, 0, 3200, 720);

    g.fillStyle(this.levelNumber === 1 ? 0x17345e : 0x3c2673, 1);
    g.fillTriangle(100, 620, 280, 320, 460, 620);
    g.fillTriangle(380, 620, 620, 280, 860, 620);
    g.fillTriangle(760, 620, 1030, 330, 1300, 620);
    g.fillTriangle(1200, 620, 1480, 260, 1760, 620);
    g.fillTriangle(1700, 620, 1980, 310, 2260, 620);
    g.fillTriangle(2200, 620, 2480, 260, 2760, 620);
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    const data =
      this.levelNumber === 1
        ? [
            { x: 300, y: 660, w: 850, h: 36 },
            { x: 1080, y: 570, w: 300, h: 28 },
            { x: 1470, y: 510, w: 280, h: 28 },
            { x: 1840, y: 450, w: 240, h: 28 },
            { x: 2210, y: 530, w: 320, h: 28 },
            { x: 2670, y: 470, w: 260, h: 28 },
            { x: 3040, y: 650, w: 360, h: 36 }
          ]
        : [
            { x: 300, y: 660, w: 850, h: 36 },
            { x: 1080, y: 560, w: 260, h: 28 },
            { x: 1420, y: 470, w: 240, h: 28 },
            { x: 1740, y: 390, w: 220, h: 28 },
            { x: 2070, y: 470, w: 250, h: 28 },
            { x: 2410, y: 380, w: 220, h: 28 },
            { x: 2740, y: 520, w: 300, h: 28 },
            { x: 3070, y: 650, w: 320, h: 36 }
          ];

    data.forEach((p, index) => {
      const rect = this.add.rectangle(
        p.x,
        p.y,
        p.w,
        p.h,
        this.levelNumber === 1 ? 0x3b82f6 : 0x8b5cf6
      );
      rect.setStrokeStyle(2, 0x0f172a);
      this.physics.add.existing(rect, true);
      this.platforms.add(rect);

      if (index === 0) {
        this.respawnPoint = { x: 110, y: 570 };
      }
    });
  }

  createPlayer() {
    this.player = this.add.rectangle(this.respawnPoint.x, this.respawnPoint.y, 34, 56, 0xf8fafc);
    this.player.setStrokeStyle(2, 0x111827);

    this.physics.add.existing(this.player);
    this.player.body.setGravityY(1400);
    this.player.body.setCollideWorldBounds(false);
    this.player.body.setSize(28, 52);
    this.player.body.setOffset(3, 2);
  }

  createCoins() {
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });

    const data =
      this.levelNumber === 1
        ? [
            [520, 590], [600, 590], [680, 590],
            [1080, 510], [1160, 510],
            [1470, 450], [1840, 390],
            [2670, 410]
          ]
        : [
            [520, 590], [600, 590],
            [1080, 500], [1420, 410],
            [1740, 330], [2070, 410],
            [2410, 320], [2740, 460]
          ];

    data.forEach(([x, y], index) => {
      const coin = this.add.circle(x, y, 12, 0xfacc15);
      coin.name = `coin-${this.levelNumber}-${index}`;
      this.physics.add.existing(coin);
      coin.body.setAllowGravity(false);
      coin.body.setImmovable(true);
      this.coins.add(coin);
    });
  }

  createHazards() {
    this.hazards = this.physics.add.group({ allowGravity: false, immovable: true });

    const enemies =
      this.levelNumber === 1
        ? [
            { x: 1250, y: 535 },
            { x: 1910, y: 415 },
            { x: 2840, y: 615 }
          ]
        : [
            { x: 1170, y: 525 },
            { x: 1810, y: 355 },
            { x: 2480, y: 345 },
            { x: 2870, y: 485 }
          ];

    enemies.forEach((e, index) => {
      const enemy = this.add.rectangle(e.x, e.y, 44, 44, 0xf97316);
      enemy.name = `enemy-${this.levelNumber}-${index}`;
      this.physics.add.existing(enemy);
      enemy.body.setAllowGravity(false);
      enemy.body.setImmovable(true);
      enemy.body.setSize(36, 36);
      this.hazards.add(enemy);
    });

    const spikes =
      this.levelNumber === 1
        ? [
            { x: 1570, y: 495 },
            { x: 2320, y: 515 }
          ]
        : [
            { x: 1500, y: 455 },
            { x: 2140, y: 455 },
            { x: 2960, y: 635 }
          ];

    spikes.forEach((s, index) => {
      const spike = this.add.triangle(s.x, s.y, 0, 24, 16, 0, 32, 24, 0xef4444);
      spike.name = `spike-${this.levelNumber}-${index}`;
      this.physics.add.existing(spike);
      spike.body.setAllowGravity(false);
      spike.body.setImmovable(true);
      this.hazards.add(spike);
    });
  }

  createTreasures() {
    this.treasures = this.physics.add.group({ allowGravity: false, immovable: true });

    const data =
      this.levelNumber === 1
        ? [
            { x: 1510, y: 470, id: 't1' },
            { x: 2700, y: 440, id: 't2' }
          ]
        : [
            { x: 1780, y: 350, id: 't3' },
            { x: 2460, y: 340, id: 't4' }
          ];

    data.forEach(t => {
      const chest = this.add.rectangle(t.x, t.y, 42, 34, 0xfacc15);
      chest.setStrokeStyle(2, 0x7c2d12);
      chest.treasureId = t.id;
      this.physics.add.existing(chest);
      chest.body.setAllowGravity(false);
      chest.body.setImmovable(true);
      this.treasures.add(chest);
    });
  }

  createFinishFlag() {
    this.finishFlag = this.add.rectangle(
      3140,
      this.levelNumber === 1 ? 585 : 585,
      24,
      120,
      0x10b981
    );
    this.physics.add.existing(this.finishFlag);
    this.finishFlag.body.setAllowGravity(false);
    this.finishFlag.body.setImmovable(true);
  }

  createUiLabel() {
    this.add
      .text(30, 24, `Level ${this.levelNumber}`, {
        fontFamily: 'Tahoma, Arial',
        fontSize: '22px',
        color: '#ffffff'
      })
      .setScrollFactor(0);
  }

  collectCoin(coin) {
    if (!coin || !coin.active) return;
    coin.destroy();
    addScore(1);
  }

  async triggerHazard(hazard) {
    if (!hazard || !hazard.active) return;
    if (this.challengeActive) return;
    if (this.time.now < state.spawnProtectedUntil) return;

    this.challengeActive = true;
    this.physics.pause();

    const result = await askQuestion('hazard', { level: this.levelNumber, hazard: hazard.name });

    if (result.correct) {
      addScore(3);
      this.player.x = Math.max(this.player.x - 90, this.respawnPoint.x);
      this.player.y = Math.max(this.player.y - 20, 100);
    } else {
      addScore(-2);
      this.respawnPlayer();
    }

    this.physics.resume();
    this.challengeActive = false;
  }

  async triggerTreasure(treasure) {
    if (!treasure || !treasure.active) return;
    if (this.challengeActive) return;
    if (this.collectedTreasureIds.has(treasure.treasureId)) return;
    if (this.time.now < state.spawnProtectedUntil) return;

    this.challengeActive = true;
    this.physics.pause();

    const result = await askQuestion('treasure', { level: this.levelNumber, treasureId: treasure.treasureId });

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
    if (this.time.now < state.spawnProtectedUntil) return;

    this.challengeActive = true;
    this.physics.pause();

    const result = await askQuestion('levelEnd', { level: this.levelNumber });

    if (result.correct) {
      addScore(10);
    } else {
      addScore(-2);
    }

    if (this.levelNumber === 1) {
      this.scene.start('Level2Scene');
    } else {
      await finishGame();
    }
  }

  async triggerFall() {
    if (this.challengeActive) return;

    this.challengeActive = true;
    this.physics.pause();

    const result = await askQuestion('hazard', { level: this.levelNumber, hazard: 'fall' });

    if (result.correct) {
      addScore(2);
    } else {
      addScore(-2);
    }

    this.respawnPlayer();
    this.physics.resume();
    this.challengeActive = false;
  }

  respawnPlayer() {
    this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y);
    this.player.body.setVelocity(0, 0);
    state.spawnProtectedUntil = this.time.now + 2000;
  }

  update() {
    if (!this.player || this.challengeActive) return;

    const speed = this.levelNumber === 1 ? 220 : 245;
    this.player.body.setVelocityX(speed);

    const canJump = this.player.body.blocked.down || this.player.body.touching.down;
    const keyboardJump =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    if ((keyboardJump || state.pendingJump) && canJump) {
      this.player.body.setVelocityY(-650);
      state.pendingJump = false;
    }

    if (this.time.now < state.spawnProtectedUntil) {
      this.player.setAlpha(0.6);
    } else {
      this.player.setAlpha(1);
    }

    if (this.player.y > 900) {
      this.triggerFall();
    }
  }
}

class Level1Scene extends BaseLevelScene {
  constructor() {
    super('Level1Scene', 1);
  }
}

class Level2Scene extends BaseLevelScene {
  constructor() {
    super('Level2Scene', 2);
  }
}

/* =========================
   تشغيل اللعبة
========================= */
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0f172a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, Level1Scene, Level2Scene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

/* =========================
   التحكم العام
========================= */
async function finishGame() {
  try {
    await saveResult();
  } catch (error) {
    console.error('Save error:', error);
  }

  if (summaryName) summaryName.textContent = state.playerName;
  if (summaryClass) summaryClass.textContent = state.playerClass;
  if (summaryScore) summaryScore.textContent = String(state.totalScore);
  if (summaryLevel) summaryLevel.textContent = String(state.highestLevel);
  if (summaryTreasures) summaryTreasures.textContent = String(state.treasuresCollected);
  if (summaryCorrect) summaryCorrect.textContent = String(state.correctAnswers);

  if (hud) hud.classList.add('hidden');
  if (jumpBtn) jumpBtn.classList.add('hidden');
  if (resultModal) resultModal.classList.remove('hidden');
}

async function startGameFlow() {
  const name = studentNameInput?.value.trim();
  const classroom = studentClassSelect?.value;

  if (!name || !classroom) {
    alert('يرجى كتابة اسم الطالب واختيار الصف أولًا');
    return;
  }

  state.playerName = name;
  state.playerClass = classroom;
  resetState();

  try {
    await registerPlayerStart();
  } catch (err) {
    console.error('Register start error:', err);
  }

  if (startScreen) startScreen.classList.add('hidden');
  if (questionModal) questionModal.classList.add('hidden');
  if (resultModal) resultModal.classList.add('hidden');
  if (hud) hud.classList.remove('hidden');
  if (leaderboardMini) leaderboardMini.classList.remove('hidden');
  if (jumpBtn) jumpBtn.classList.remove('hidden');

  updateHUD();

  game.scene.stop('Level1Scene');
  game.scene.stop('Level2Scene');
  game.scene.start('Level1Scene');
}

if (startBtn) {
  startBtn.addEventListener('click', startGameFlow);
}

if (refreshBoardBtn) {
  refreshBoardBtn.addEventListener('click', () => renderBoard());
}

if (playAgainBtn) {
  playAgainBtn.addEventListener('click', () => {
    if (resultModal) resultModal.classList.add('hidden');
    if (startScreen) startScreen.classList.remove('hidden');
  });
}

if (closeResultBtn) {
  closeResultBtn.addEventListener('click', () => {
    if (resultModal) resultModal.classList.add('hidden');
  });
}

if (jumpBtn) {
  jumpBtn.addEventListener('pointerdown', () => {
    state.pendingJump = true;
  });

  jumpBtn.addEventListener('touchstart', () => {
    state.pendingJump = true;
  }, { passive: true });
}

subscribeBoard();
