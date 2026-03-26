/**
 * 打字战斗 RPG - 英语荣耀版 (Unified Master Version)
 * 核心逻辑、数据、音效、UI 整合单文件
 */

// ==========================================
// 1. 数据层 (Data)
// ==========================================


// ==========================================
// 游戏逻辑支持函数
// ==========================================



const MONSTER_DATABASE = [
    { name: "大白兔", image: "processed_assets/大白兔.png", baseHp: 30, attack: 5, exp: 20, gold: 5, color: "#f0f0f0" },
    { name: "初始怪", image: "processed_assets/初始怪物.png", baseHp: 50, attack: 8, exp: 35, gold: 10, color: "#a2d149" },
    { name: "邪恶史莱姆", image: "processed_assets/邪恶史莱姆.png", baseHp: 75, attack: 12, exp: 50, gold: 15, color: "#6e8b3d" },
    { name: "小黄蜂", image: "processed_assets/小黄蜂.png", baseHp: 110, attack: 18, exp: 90, gold: 30, color: "#ffd700" },
    { name: "机械鸟", image: "processed_assets/机械鸟.png", baseHp: 160, attack: 28, exp: 140, gold: 50, color: "#4682b4" },
    { name: "混乱怪", image: "processed_assets/混乱怪.png", baseHp: 230, attack: 38, exp: 220, gold: 80, color: "#4b0082" },
    { name: "黑忍者", image: "processed_assets/黑忍者.png", baseHp: 320, attack: 45, exp: 350, gold: 120, color: "#333333" },
    { name: "精英兽人", image: "processed_assets/精英兽人.png", baseHp: 450, attack: 60, exp: 600, gold: 250, color: "#8b4513" },
    { name: "终焉巨神", image: "processed_assets/boss1.png", baseHp: 1000, attack: 90, exp: 2500, gold: 1200, color: "#ff0000" }
];

const HERO_STAGES = [
    { level: 1, image: "processed_assets/初级魔法师.png", title: "学徒" },
    { level: 5, image: "processed_assets/中级魔法师.png", title: "法师" },
    { level: 10, image: "processed_assets/高级魔法师.png", title: "大魔导师" },
    { level: 20, image: "processed_assets/高级魔法师.png", title: "英语之神" }
];

// ==========================================
// 2. 核心逻辑 (Engine)
// ==========================================

const game = {
    hero: { hp: 100, maxHp: 100, level: 1, exp: 0, gold: 0 },
    difficulty: 'normal',
    selectedCategory: 'coder',
    combo: 0,
    baseTime: 5000,
    timeLeft: 5000,
    isFrozen: false,
    isPlaying: false,
    isPaused: false,
    monstersKilled: 0,
    wordsCorrect: 0,
    currentDictionary: [],
    shuffledQueue: [],
    wordHistory: [],
    srsQueue: [],
    currentMonster: null,
    currentWord: null,
    timerInterval: null,
    unlockedMonsters: new Set(),
    currentProfile: 'Default',
    profiles: {},
    achievements: {
        'first_kill': { name: '初试身手', desc: '击败第1只怪物', icon: '⚔️', unlocked: false, condition: () => game.monstersKilled >= 1 },
        'boss_slayer': { name: '猎杀者', desc: '击败Boss', icon: '👹', unlocked: false, condition: () => game.monstersKilled >= 5 },
        'word_master': { name: '博学', desc: '拼对100词', icon: '📖', unlocked: false, condition: () => game.wordsCorrect >= 100 }
    }
};

const elements = {
    level: document.getElementById('level'),
    expBar: document.getElementById('exp-bar'),
    expText: document.getElementById('exp-text'),
    gold: document.getElementById('gold'),
    monsterSprite: document.getElementById('monster-sprite'),
    monsterHpBar: document.getElementById('monster-hp-bar'),
    monsterHpText: document.getElementById('monster-hp-text'),
    monsterName: document.getElementById('monster-name'),
    heroSprite: document.getElementById('hero-sprite'),
    heroHpBar: document.getElementById('hero-hp-bar'),
    heroHpText: document.getElementById('hero-hp-text'),
    timerBar: document.getElementById('timer-bar'),
    timerText: document.getElementById('timer-text'),
    targetWord: document.getElementById('target-word'),
    meaning: document.getElementById('meaning'),
    wordInput: document.getElementById('word-input'),
    overlay: document.getElementById('overlay'),
    gameOver: document.getElementById('game-over'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    startDictSelect: document.getElementById('start-dict-select'),
    gameDictSelect: document.getElementById('game-dict-select'),
    startDiffSelect: document.getElementById('start-diff-select'),
    gameDiffSelect: document.getElementById('game-diff-select'),
    comboDisplay: document.getElementById('combo-display'),
    comboCount: document.getElementById('combo-count'),
    pauseOverlay: document.getElementById('pause-overlay'),
    resumeBtn: document.getElementById('resume-btn'),
    monstersKilled: document.getElementById('monsters-killed'),
    wordsCorrect: document.getElementById('words-correct'),
    expGained: document.getElementById('exp-gained'),
    goldGained: document.getElementById('gold-gained'),
    profilesBtn: document.getElementById('profiles-btn'),
    profilesModal: document.getElementById('profiles-modal'),
    profileList: document.getElementById('profile-list'),
    newProfileName: document.getElementById('new-profile-name'),
    createProfileBtn: document.getElementById('create-profile-btn'),
    skills: [document.getElementById('skill-1'), document.getElementById('skill-2'), document.getElementById('skill-3')]
};

function getMaskedChar(word, index) {
    const len = word.length;
    const diff = game.difficulty || 'normal';
    
    // Always show if it's already typed (handled in handleInput), here we define the mask for pending characters
    if (diff === 'easy') return word[index];
    if (diff === 'master') return '_';
    if (diff === 'hard') return index === 0 ? word[index] : '_';
    
    // Normal: outline first and last character (if length > 3)
    if (len > 3) {
        return (index === 0 || index === len - 1) ? word[index] : '_';
    } else {
        return index === 0 ? word[index] : '_';
    }
}

// ==========================================
// 3. 工具层 (Utils)
// ==========================================

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getDifficultyForLevel(lvl) {
    if (lvl <= 2) return 1;
    if (lvl <= 8) return Math.random() < 0.7 ? 1 : 2;
    return Math.random() < 0.4 ? 1 : (Math.random() < 0.5 ? 2 : 3);
}

function getMonsterForLevel(lvl) {
    const isBoss = lvl % 5 === 0;
    const monsterIdx = Math.min(Math.floor((lvl - 1) / 2), MONSTER_DATABASE.length - 1);
    const base = MONSTER_DATABASE[monsterIdx];
    const scale = 1 + (lvl - 1) * 0.2 * (isBoss ? 2 : 1);
    return {
        ...base,
        name: isBoss ? `【BOSS】${base.name}` : base.name,
        hp: Math.floor(base.baseHp * scale),
        maxHp: Math.floor(base.baseHp * scale),
        attack: Math.floor(base.attack * scale),
        exp: Math.floor(base.exp * scale) * (isBoss ? 5 : 1),
        gold: Math.floor(base.gold * scale) * (isBoss ? 3 : 1),
        isBoss: isBoss
    };
}

// ==========================================
// 4. 音效层 (Audio)
// ==========================================

let audioCtx = null;
function playSound(type) {
    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        if (type === 'type') {
            osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
            gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(); osc.stop(now + 0.05);
        } else if (type === 'hit') {
            osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(); osc.stop(now + 0.1);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(); osc.stop(now + 0.2);
        } else if (type === 'skill') {
            osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(1000, now + 0.3);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(); osc.stop(now + 0.3);
        }
    } catch(e) {}
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'en-US'; msg.rate = 0.9;
        window.speechSynthesis.speak(msg);
    }
}

// ==========================================
// 5. 战斗逻辑 (Battle)
// ==========================================

function spawnMonster() {
    game.currentMonster = getMonsterForLevel(game.hero.level);
    elements.monsterSprite.innerHTML = `<img src="${game.currentMonster.image}" style="width: 150px; height: 150px; object-fit: contain;">`;
    elements.monsterName.textContent = game.currentMonster.name;
    elements.monsterSprite.style.filter = `drop-shadow(0 0 15px ${game.currentMonster.color})`;
    updateMonsterHp();
}

function nextWord() {
    const diff = getDifficultyForLevel(game.hero.level);
    let masterPool = game.currentDictionary.filter(w => (w.difficulty || 1) === diff);
    if (masterPool.length === 0) masterPool = game.currentDictionary;
    
    // 保证有词可用
    if (!masterPool || masterPool.length === 0) {
        console.warn("Master pool empty, falling back to full dictionary.");
        masterPool = game.currentDictionary;
    }
    
    if (!masterPool || masterPool.length === 0) {
        elements.targetWord.innerHTML = '<span style="color:red">词库加载错误，请刷新或切换词库</span>';
        return;
    }

    // 艾宾浩斯/SRS 优先处理 (30% 概率)
    if (game.srsQueue && game.srsQueue.length > 0 && Math.random() < 0.3) {
        game.currentWord = game.srsQueue.shift();
    } else {
        // 洗牌队列逻辑
        if (!game.shuffledQueue || game.shuffledQueue.length === 0) {
            game.shuffledQueue = [...masterPool].sort(() => Math.random() - 0.5);
        }
        
        let wordObj = game.shuffledQueue.shift();
        
        // 自动补充
        if (!game.shuffledQueue || game.shuffledQueue.length === 0) {
            game.shuffledQueue = [...masterPool].sort(() => Math.random() - 0.5);
        }

        // 防重复检查 (如果池子够大)
        let attempts = 0;
        while (wordObj && game.wordHistory.includes(wordObj.word) && attempts < 10 && masterPool.length > 1) {
            wordObj = game.shuffledQueue.shift();
            if (game.shuffledQueue.length === 0) {
                game.shuffledQueue = [...masterPool].sort(() => Math.random() - 0.5);
            }
            attempts++;
        }
        
        game.currentWord = wordObj || masterPool[0];
    }
    
    if (!game.currentWord) {
        elements.targetWord.innerHTML = '<span style="color:red">无可用单词</span>';
        return;
    }
    
    // 更新历史记录
    if (!game.wordHistory) game.wordHistory = [];
    game.wordHistory.push(game.currentWord.word);
    if (game.wordHistory.length > 20) game.wordHistory.shift();
    
    const word = game.currentWord.word;
    const isBoss = game.currentMonster.isBoss;
    
    // 显示处理
    // 显示处理：应用难度遮罩
    let displayChars = [];
    for (let i = 0; i < word.length; i++) {
        displayChars.push(getMaskedChar(word, i));
    }
    const display = displayChars.join('');
    
    if (game.currentWord.sentence && game.currentWord.sentence.includes('___')) {
        const parts = game.currentWord.sentence.split('___');
        elements.targetWord.innerHTML = `<div class="sentence-context">${parts[0]}<span id="word-slot">${display}</span>${parts[1]}</div>`;
    } else {
        elements.targetWord.innerHTML = `<span id="word-slot">${display}</span>`;
    }
    
    elements.meaning.textContent = game.currentWord.meaning;
    elements.wordInput.value = '';
    speak(word);
    
    // 计时器
    game.baseTime = Math.max(2000, 6000 - (game.hero.level * 100) + (word.length * 400));
    resetTimer(game.baseTime);
}

function resetTimer(ms) {
    if (game.timerInterval) clearInterval(game.timerInterval);
    
    game.timeLeft = ms;
    const total = ms;
    
    const updateProgress = () => {
        elements.timerBar.style.width = `${(game.timeLeft / total) * 100}%`;
        elements.timerText.textContent = (game.timeLeft / 1000).toFixed(1) + 's';
    };
    updateProgress();
    
    if (game.isFrozen) return;
    
    game.timerInterval = setInterval(() => {
        if (game.isPaused) return;
        game.timeLeft -= 100;
        updateProgress();
        if (game.timeLeft <= 0) {
            clearInterval(game.timerInterval);
            monsterAttack();
        }
    }, 100);
}

function monsterAttack() {
    playSound('error');
    game.hero.hp -= game.currentMonster.attack;
    game.combo = 0;
    updateHeroHp();
    updateUI();
    document.body.classList.add('shake-screen');
    setTimeout(() => document.body.classList.remove('shake-screen'), 300);
    
    if (game.hero.hp <= 0) gameOver();
    else nextWord();
}

function heroAttack() {
    playSound('hit');
    const multiplier = 1 + (game.combo * 0.1);
    const damage = Math.floor((10 + game.hero.level * 2) * multiplier);
    game.currentMonster.hp -= damage;
    
    showDamage(`-${damage}${game.combo > 5 ? ' CRIT!' : ''}`, 'monster');
    updateMonsterHp();
    
    if (game.currentMonster.hp <= 0) {
        monsterDefeated();
    } else {
        nextWord();
    }
}

function monsterDefeated() {
    game.monstersKilled++;
    game.wordsCorrect++;
    game.unlockedMonsters.add(game.currentMonster.name);
    
    const bonus = 1 + (game.combo * 0.05);
    game.hero.exp += Math.floor(game.currentMonster.exp * bonus);
    game.hero.gold += Math.floor(game.currentMonster.gold * bonus);
    
    checkLevel();
    updateUI();
    save();
    
    setTimeout(() => {
        if (game.isPlaying) {
            spawnMonster();
            nextWord();
        }
    }, 500);
}

// ==========================================
// 6. UI 层 (UI)
// ==========================================

function updateUI() {
    elements.level.textContent = game.hero.level;
    elements.gold.textContent = game.hero.gold;
    const req = Math.floor(150 * game.hero.level);
    elements.expBar.style.width = `${Math.min((game.hero.exp / req) * 100, 100)}%`;
    elements.expText.textContent = `${game.hero.exp}/${req}`;
    
    // 连击
    if (game.combo > 0) {
        elements.comboCount.textContent = game.combo;
        elements.comboDisplay.classList.remove('hidden');
    } else {
        elements.comboDisplay.classList.add('hidden');
    }
    
    // 技能可用性
    elements.skills[0].classList.toggle('disabled', game.hero.gold < 50);
    elements.skills[1].classList.toggle('disabled', game.hero.gold < 80);
    elements.skills[2].classList.toggle('disabled', game.hero.gold < 120);
}

function updateHeroHp() {
    elements.heroHpBar.style.width = `${(game.hero.hp / game.hero.maxHp) * 100}%`;
    elements.heroHpText.textContent = `${Math.max(0, game.hero.hp)}/${game.hero.maxHp}`;
}

function updateMonsterHp() {
    elements.monsterHpBar.style.width = `${(game.currentMonster.hp / game.currentMonster.maxHp) * 100}%`;
    elements.monsterHpText.textContent = `${Math.max(0, game.currentMonster.hp)}/${game.currentMonster.maxHp}`;
}

function showDamage(text, target) {
    const el = document.createElement('div');
    el.className = 'damage-number';
    el.textContent = text;
    el.style.left = target === 'monster' ? '30%' : '70%';
    document.getElementById('battle-arena').appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function handleInput(e) {
    if (!game.isPlaying || game.isPaused) return;
    const input = e.target.value.toLowerCase();
    const target = game.currentWord.word.toLowerCase();
    const slot = document.getElementById('word-slot');
    
    if (!slot) return;
    
    let html = '';
    let isError = false;
    for (let i = 0; i < target.length; i++) {
        if (i < input.length) {
            if (input[i] === target[i]) html += `<span class="correct">${target[i]}</span>`;
            else { html += `<span class="wrong">${target[i]}</span>`; isError = true; }
        } else {
            const char = getMaskedChar(target, i);
            html += `<span class="pending">${char}</span>`;
        }
    }
    slot.innerHTML = html;
    
    if (isError) {
        playSound('error');
        game.combo = 0;
        // 加入复习队列
        if (!game.srsQueue.some(item => item.word === game.currentWord.word)) {
            game.srsQueue.push(game.currentWord);
        }
        e.target.value = '';
    } else if (input.length > 0) {
        playSound('type');
    }
    
    if (input === target) {
        game.combo++;
        heroAttack();
    }
}

// ==========================================
// 7. 功能系统 (Systems)
// ==========================================

window.useSkill = function(id) {
    if (!game.isPlaying || game.isPaused) return;
    const skillId = parseInt(id);
    if (skillId === 1 && game.hero.gold >= 50) {
        game.hero.gold = Number(game.hero.gold) - 50; playSound('skill');
        const heal = Math.floor(game.hero.maxHp * 0.4);
        game.hero.hp = Math.min(game.hero.maxHp, game.hero.hp + heal);
        updateHeroHp(); showDamage(`+${heal}`, 'hero');
    } else if (skillId === 2 && game.hero.gold >= 80) {
        game.hero.gold = Number(game.hero.gold) - 80; playSound('skill');
        game.isFrozen = true;
        document.getElementById('battle-arena').style.filter = 'hue-rotate(180deg) brightness(1.2)';
        if (game.timerInterval) clearInterval(game.timerInterval);
        setTimeout(() => {
            game.isFrozen = false;
            document.getElementById('battle-arena').style.filter = 'none';
            resetTimer(game.timeLeft);
        }, 5000);
    } else if (skillId === 3 && game.hero.gold >= 120) {
        game.hero.gold = Number(game.hero.gold) - 120; playSound('skill');
        const dmg = Math.floor(game.currentMonster.maxHp * 0.8);
        game.currentMonster.hp -= dmg;
        showDamage(`EXECUTED -${dmg}`, 'monster');
        updateMonsterHp();
        if (game.currentMonster.hp <= 0) monsterDefeated();
    }
    updateUI();
};

function checkLevel() {
    const req = Math.floor(150 * game.hero.level);
    if (game.hero.exp >= req) {
        game.hero.exp -= req;
        game.hero.level++;
        game.hero.maxHp += 25;
        game.hero.hp = game.hero.maxHp;
        const stage = [...HERO_STAGES].reverse().find(s => game.hero.level >= s.level);
        if (stage) elements.heroSprite.innerHTML = `<img src="${stage.image}" style="width: 150px; height: 150px; object-fit: contain;">`;
    }
}

function save() {
    const data = { 
        lvl: game.hero.level, 
        exp: game.hero.exp,
        gold: game.hero.gold, 
        mon: Array.from(game.unlockedMonsters),
        srs: game.srsQueue
    };
    game.profiles[game.currentProfile] = data;
    localStorage.setItem('typing_rpg_profiles_v2', JSON.stringify(game.profiles));
    localStorage.setItem('typing_rpg_current_profile', game.currentProfile);
}

function load(profileName) {
    const s = localStorage.getItem('typing_rpg_profiles_v2');
    if (s) {
        game.profiles = JSON.parse(s);
        const name = profileName || localStorage.getItem('typing_rpg_current_profile') || 'Default';
        migrateOldData(); // One-time check
        
        const d = game.profiles[name];
        if (d) {
            game.currentProfile = name;
            game.hero.level = d.lvl || 1; 
            game.hero.exp = d.exp || 0;
            // 按照用户要求重置或应用金币
            game.hero.gold = Number(d.gold) || 0; 
            game.unlockedMonsters = new Set(d.mon || []);
            game.srsQueue = d.srs || [];
        }
    } else {
        migrateOldData();
    }
}

// 数据迁移与金币重置逻辑
function migrateOldData() {
    const old = localStorage.getItem('typing_rpg_master_save');
    const profilesExist = localStorage.getItem('typing_rpg_profiles_v2');
    
    if (!profilesExist) {
        game.profiles = {};
        if (old) {
            const d = JSON.parse(old);
            // 迁移到 "Hero" 存档并执行金币重置 (如果大于500)
            let finalGold = Number(d.gold) || 0;
            if (finalGold > 500) finalGold = 500;
            
            game.profiles['Hero'] = {
                lvl: d.lvl || 1,
                exp: d.exp || 0,
                gold: finalGold,
                mon: d.mon || [],
                srs: d.srs || []
            };
            game.currentProfile = 'Hero';
        } else {
            game.profiles['Default'] = { lvl: 1, exp: 0, gold: 500, mon: [], srs: [] };
            game.currentProfile = 'Default';
        }
        localStorage.setItem('typing_rpg_profiles_v2', JSON.stringify(game.profiles));
    }
}

function renderProfiles() {
    elements.profileList.innerHTML = '';
    Object.keys(game.profiles).forEach(name => {
        const d = game.profiles[name];
        const item = document.createElement('div');
        item.className = `profile-item ${name === game.currentProfile ? 'active' : ''}`;
        item.innerHTML = `
            <div class="profile-info">
                <div class="profile-name">${name}</div>
                <div class="profile-meta">等级: ${d.lvl} | 金币: ${d.gold}</div>
            </div>
            <div class="profile-actions">
                <button class="mini-btn" onclick="switchProfile('${name}')">切换</button>
                <button class="mini-btn delete-btn" onclick="deleteProfile('${name}')">删除</button>
            </div>
        `;
        elements.profileList.appendChild(item);
    });
}

window.switchProfile = function(name) {
    save(); // 保存当前
    load(name);
    renderProfiles();
    updateUI();
    const stage = [...HERO_STAGES].reverse().find(s => game.hero.level >= s.level);
    if (stage) elements.heroSprite.innerHTML = `<img src="${stage.image}" style="width: 150px; height: 150px; object-fit: contain;">`;
};

window.deleteProfile = function(name) {
    if (Object.keys(game.profiles).length <= 1) {
        alert("至少需要保留一个账号！");
        return;
    }
    if (confirm(`确定要删除账号 "${name}" 吗？此操作不可撤销。`)) {
        delete game.profiles[name];
        if (game.currentProfile === name) {
            game.currentProfile = Object.keys(game.profiles)[0];
            load(game.currentProfile);
        }
        localStorage.setItem('typing_rpg_profiles_v2', JSON.stringify(game.profiles));
        renderProfiles();
        updateUI();
    }
};

window.createProfile = function() {
    const name = elements.newProfileName.value.trim();
    if (!name) return;
    if (game.profiles[name]) {
        alert("该账号名称已存在！");
        return;
    }
    game.profiles[name] = { lvl: 1, exp: 0, gold: 500, mon: [], srs: [] };
    elements.newProfileName.value = '';
    switchProfile(name);
};

function gameOver() {
    game.isPlaying = false;
    elements.monstersKilled.textContent = game.monstersKilled;
    elements.wordsCorrect.textContent = game.wordsCorrect;
    elements.gameOver.classList.remove('hidden');
}

// ==========================================
// 8. 程序入口 (EntryPoint)
// ==========================================

function init() {
    // 初始化时加载存档 (包括迁移逻辑)
    load();

    // 加载持久化设置
    let savedCategory = localStorage.getItem('typing_rpg_category') || 'coder';
    if (!DICT_COLLECTION[savedCategory]) savedCategory = 'coder';
    let savedDiff = localStorage.getItem('typing_rpg_difficulty') || 'normal';
    
    game.selectedCategory = savedCategory;
    game.difficulty = savedDiff;
    
    elements.startDictSelect.value = savedCategory;
    elements.gameDictSelect.value = savedCategory;
    elements.startDiffSelect.value = savedDiff;
    elements.gameDiffSelect.value = savedDiff;

    // 同步词库下拉框
    elements.startDictSelect.onchange = (e) => {
        elements.gameDictSelect.value = e.target.value;
        game.selectedCategory = e.target.value;
    };
    elements.gameDictSelect.onchange = (e) => {
        elements.startDictSelect.value = e.target.value;
        game.selectedCategory = e.target.value;
        if (game.isPlaying) {
            game.currentDictionary = DICT_COLLECTION[game.selectedCategory] || [];
            game.shuffledQueue = [];
            nextWord();
        }
    };
    
    // 同步难度下拉框
    elements.startDiffSelect.onchange = (e) => {
        elements.gameDiffSelect.value = e.target.value;
        game.difficulty = e.target.value;
    };
    elements.gameDiffSelect.onchange = (e) => {
        elements.startDiffSelect.value = e.target.value;
        game.difficulty = e.target.value;
        if (game.isPlaying) {
            nextWord(); // 立即应用新难度遮罩
        }
    };

    elements.startBtn.onclick = async () => {
        game.selectedCategory = elements.startDictSelect.value;
        game.difficulty = elements.startDiffSelect.value;
        localStorage.setItem('typing_rpg_category', game.selectedCategory);
        localStorage.setItem('typing_rpg_difficulty', game.difficulty);
        game.currentDictionary = DICT_COLLECTION[game.selectedCategory] || [];
        game.shuffledQueue = []; // 切换词库时清空洗牌队列
        
        elements.overlay.classList.add('hidden');
        game.isPlaying = true;
        
        updateUI();
        updateHeroHp();
        const stage = [...HERO_STAGES].reverse().find(s => game.hero.level >= s.level);
        if (stage) elements.heroSprite.innerHTML = `<img src="${stage.image}" style="width: 150px; height: 150px; object-fit: contain;">`;
        spawnMonster();
        nextWord();
    };
    
    elements.restartBtn.onclick = () => location.reload();
    
    elements.wordInput.onkeydown = (e) => {
        // Only handle specific controls here if needed, 
        // numbers 1-2-3 now exclusively handled by window listener to avoid double-trigger
    };
    elements.wordInput.oninput = handleInput;

    window.togglePause = () => {
        if (!game.isPlaying || !elements.gameOver.classList.contains('hidden')) return;
        
        // 尝试关闭图鉴或成就弹窗
        const modals = document.querySelectorAll('.modal:not(.hidden)');
        if (modals.length > 0) {
            modals.forEach(m => m.classList.add('hidden'));
            game.isPaused = false;
            elements.wordInput.focus();
            return;
        }

        game.isPaused = !game.isPaused;
        if (game.isPaused) {
            elements.pauseOverlay.classList.remove('hidden');
        } else {
            elements.pauseOverlay.classList.add('hidden');
            elements.wordInput.focus();
        }
    };

    if (elements.resumeBtn) {
        elements.resumeBtn.onclick = () => {
            if (game.isPaused) togglePause();
        };
    }

    // 快捷键支持 (全局)
    window.onkeydown = (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            togglePause();
            return;
        }
        if (!game.isPlaying || game.isPaused) return;
        if (['1', '2', '3'].includes(e.key)) {
            e.preventDefault();
            useSkill(parseInt(e.key));
        }
    };
    
    // 弹幕/弹窗
    document.getElementById('achievement-trigger').onclick = () => {
        const list = Object.values(game.achievements).map(a => `<div class="badge-item ${a.unlocked?'unlocked':''}">${a.icon}<br>${a.name}</div>`).join('');
        document.getElementById('achievement-list').innerHTML = list;
        document.getElementById('achievement-modal').classList.remove('hidden');
        game.isPaused = true;
    };
    
    document.getElementById('bestiary-trigger').onclick = () => {
        const list = MONSTER_DATABASE.map(m => `<div class="badge-item ${game.unlockedMonsters.has(m.name)?'unlocked':''}">${game.unlockedMonsters.has(m.name)?`<img src="${m.image}" style="width: 40px; height: 40px; object-fit: contain;">`:'❓'}<br>${game.unlockedMonsters.has(m.name)?m.name:'???'}</div>`).join('');
        document.getElementById('monster-grid').innerHTML = list;
        document.getElementById('bestiary-modal').classList.remove('hidden');
        game.isPaused = true;
    };
    
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.onclick = () => {
            btn.closest('.modal').classList.add('hidden');
            game.isPaused = false;
            if (game.isPlaying) elements.wordInput.focus();
        };
    });

    // 账号管理按钮
    if (elements.profilesBtn) {
        elements.profilesBtn.onclick = () => {
            renderProfiles();
            elements.profilesModal.classList.remove('hidden');
        };
    }
    if (elements.createProfileBtn) {
        elements.createProfileBtn.onclick = createProfile;
    }
}

document.addEventListener('DOMContentLoaded', init);