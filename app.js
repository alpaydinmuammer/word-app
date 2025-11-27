// --- GLOBAL DEĞİŞKENLER ---
let currentCard = null;
let nextCard = null;
let learnedCards = [];
let favCards = [];
let errorCards = [];
let earnedBadges = [];
let cardPool = [];
let isDarkMode = false;
let activeMode = 'flashcard'; 
let isFilterFav = false;
let isFilterError = false;
let isErrorReviewMode = false;

// SWIPE (KAYDIRMA) DEĞİŞKENLERİ
let startX = 0;
let isDragging = false;
const swipeThreshold = 100; 

// GEÇMİŞ YÖNETİMİ
let cardHistory = []; 
let historyIndex = -1; 
let maxHistorySize = 50; 

// STREAK & SES
let streakCount = 0;
let lastStreakDate = "";
let availableVoices = []; 

// SPEED RUN DEĞİŞKENLERİ
let speedScore = 0;
let speedTime = 60;
let speedInterval = null;
let speedHighScore = 0;
let totalSpeedScore = 0;

// ROZETLER (BADGES)
const BADGES = [
    { id: 'b1', name: 'Newbie', type: 'words', count: 10, icon: '👶' },
    { id: 'b2', name: 'Student', type: 'words', count: 50, icon: '🤓' },
    { id: 'b3', name: 'Scholar', type: 'words', count: 100, icon: '🎓' },
    { id: 'b4', name: 'Wizard', type: 'words', count: 250, icon: '🧙‍♂️' },
    { id: 'b5', name: 'King of YDS', type: 'words', count: 500, icon: '👑' },
    { id: 'b6', name: 'Legend', type: 'words', count: 1000, icon: '🚀' },
    { id: 's1', name: 'Quick Starter', type: 'score', count: 100, icon: '🥉' },
    { id: 's2', name: 'Speed Racer', type: 'score', count: 200, icon: '🥈' },
    { id: 's3', name: 'Velocity Guru', type: 'score', count: 300, icon: '🥇' },
    { id: 's4', name: 'Time Lord', type: 'score', count: 500, icon: '⏱️' }
];

// DOM ELEMENTLERİ
const els = {
    flashcardMode: document.getElementById('flashcardMode'),
    quizMode: document.getElementById('quizMode'),
    sentenceMode: document.getElementById('sentenceMode'),
    speedMode: document.getElementById('speedMode'),
    
    card: document.getElementById('cardElement'),
    en: document.getElementById('wordEnglish'),
    def: document.getElementById('wordDefinition'),
    syn: document.getElementById('wordSynonym'),
    ex: document.getElementById('wordExample'),
    id: document.getElementById('wordId'),
    total: document.getElementById('totalWords'),
    learned: document.getElementById('learnedWords'),
    progressBar: document.getElementById('progressBar'),
    
    streakBox: document.getElementById('streakBox'),
    streakCount: document.getElementById('streakCount'),

    btnFail: document.getElementById('btnFail'),
    btnPass: document.getElementById('btnPass'),
    btnReset: document.getElementById('resetBtn'),
    btnSpeak: document.getElementById('btnSpeak'),
    favBtn: document.getElementById('favBtn'),
    
    themeToggle: document.getElementById('themeToggle'),
    modeToggle: document.getElementById('modeToggle'),
    badgeToggle: document.getElementById('badgeToggle'),
    errorModeBtn: document.getElementById('errorModeBtn'),
    errorCount: document.getElementById('errorCount'),
    
    quizWord: document.getElementById('quizWord'),
    quizDef: document.getElementById('quizDefinition'),
    quizOptions: document.getElementById('quizOptions'),
    quizSpeak: document.getElementById('quizSpeak'),
    quizFavBtn: document.getElementById('quizFavBtn'),
    
    sentenceText: document.getElementById('sentenceText'),
    sentenceOptions: document.getElementById('sentenceOptions'),
    sentFavBtn: document.getElementById('sentFavBtn'),
    
    quizNavControls: document.getElementById('quizNavControls'),
    prevBtnQuiz: document.getElementById('prevBtnQuiz'),
    nextBtnQuiz: document.getElementById('nextBtnQuiz'),
    sentNavControls: document.getElementById('sentNavControls'),
    prevBtnSent: document.getElementById('prevBtnSent'),
    nextBtnSent: document.getElementById('nextBtnSent'),
    
    speedStartScreen: document.getElementById('speedStartScreen'),
    startSpeedBtn: document.getElementById('startSpeedBtn'),
    speedTimer: document.getElementById('speedTimer'),
    speedScore: document.getElementById('speedScore'),
    highScoreDisplay: document.getElementById('highScoreDisplay'),
    speedWord: document.getElementById('speedWord'),
    speedOptions: document.getElementById('speedOptions'),
    exitSpeedMode: document.getElementById('exitSpeedMode'),
    
    dictToggle: document.getElementById('dictToggle'),
    dictModal: document.getElementById('dictionaryModal'),
    badgeModal: document.getElementById('badgeModal'),
    closeDict: document.getElementById('closeDict'),
    closeBadge: document.getElementById('closeBadge'),
    searchInput: document.getElementById('searchInput'),
    wordList: document.getElementById('wordList'),
    badgeList: document.getElementById('badgeList'),
    filterFavs: document.getElementById('filterFavs'),
    filterErrors: document.getElementById('filterErrors'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

let nextCardEl = null;

// --- BAŞLANGIÇ (INIT) ---
function init() {
    // Sıradaki Kart (Next Card) Önizlemesini Oluştur
    nextCardEl = document.createElement('div');
    nextCardEl.className = 'next-card-preview';
    nextCardEl.innerHTML = `
        <div class="card-header">
            <span class="word-id" id="nextWordId">#--</span>
            <button class="fav-btn"><i class="far fa-star"></i></button>
        </div>
        <h1 id="nextWordEnglish">Loading...</h1>
        <button class="speak-btn"><i class="fas fa-volume-up"></i></button>
        <p class="tap-hint">Tap or Space</p>
    `;
    const cardContainer = els.card.parentElement;
    cardContainer.insertBefore(nextCardEl, els.card);

    loadData();
    updateStats();
    checkStreak();
    preloadVoices();

    // Listener'lar
    els.btnFail.addEventListener('click', () => handleAnswer(false));
    els.btnPass.addEventListener('click', () => handleAnswer(true));
    els.card.addEventListener('click', (e) => {
        if(!e.target.closest('button')) els.card.classList.toggle('flipped');
    });
    
    els.btnSpeak.addEventListener('click', (e) => { e.stopPropagation(); speak(currentCard.word); });
    els.quizSpeak.addEventListener('click', () => speak(currentCard.word));
    
    els.favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFav(); });
    els.quizFavBtn.addEventListener('click', toggleFav);
    els.sentFavBtn.addEventListener('click', toggleFav);
    
    els.btnReset.addEventListener('click', resetAll);
    els.themeToggle.addEventListener('click', toggleTheme);
    els.modeToggle.addEventListener('click', toggleMode);
    
    els.dictToggle.addEventListener('click', openDict);
    els.closeDict.addEventListener('click', () => els.dictModal.classList.add('hidden'));
    els.badgeToggle.addEventListener('click', openBadges);
    els.closeBadge.addEventListener('click', () => els.badgeModal.classList.add('hidden'));
    
    els.errorModeBtn.addEventListener('click', () => toggleErrorReviewMode(false));
    els.searchInput.addEventListener('input', renderDict);
    els.filterFavs.addEventListener('click', () => {
        isFilterFav = !isFilterFav;
        els.filterFavs.classList.toggle('active-fav', isFilterFav);
        renderDict();
    });
    els.filterErrors.addEventListener('click', () => {
        isFilterError = !isFilterError;
        els.filterErrors.classList.toggle('active-error', isFilterError);
        renderDict();
    });
    
    els.startSpeedBtn.addEventListener('click', startSpeedRun);
    els.exitSpeedMode.addEventListener('click', exitSpeedGame);
    
    els.prevBtnQuiz.addEventListener('click', () => navigateHistory('prev'));
    els.nextBtnQuiz.addEventListener('click', () => navigateHistory('next'));
    els.prevBtnSent.addEventListener('click', () => navigateHistory('prev'));
    els.nextBtnSent.addEventListener('click', () => navigateHistory('next'));
    
    // Touch Events
    if ('ontouchstart' in window) { 
        els.card.addEventListener('touchstart', touchStart);
        els.card.addEventListener('touchmove', touchMove);
        els.card.addEventListener('touchend', touchEnd);
    }
    
    // Klavye Kontrolleri
    document.addEventListener('keydown', (e) => {
        if(document.activeElement === els.searchInput) {
            if(e.key === 'Escape') els.dictModal.classList.add('hidden');
            return;
        }
        if (e.code === 'Space' && activeMode === 'flashcard') {
            e.preventDefault();
            els.card.classList.toggle('flipped');
        }
        else if (e.key === 'ArrowRight') {
            if (activeMode === 'flashcard') handleAnswer(true);
            else if (activeMode === 'quiz' || activeMode === 'sentence') navigateHistory('next');
        }
        else if (e.key === 'ArrowLeft') {
            if (activeMode === 'flashcard') handleAnswer(false);
            else if (activeMode === 'quiz' || activeMode === 'sentence') navigateHistory('prev');
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            speak(currentCard.word);
        }
        else if (e.key.toLowerCase() === 'f') toggleFav();
        else if (e.key.toLowerCase() === 'm') toggleMode();
        else if (e.key.toLowerCase() === 'd') openDict();
        else if (e.key === 'Escape') {
            els.dictModal.classList.add('hidden');
            els.badgeModal.classList.add('hidden');
            if (activeMode === 'speed' && !els.speedStartScreen.classList.contains('hidden')) {
                exitSpeedGame();
            }
        }
        else if (['1', '2', '3', '4'].includes(e.key)) {
            if (activeMode === 'quiz' || activeMode === 'sentence' || activeMode === 'speed') {
                const index = parseInt(e.key) - 1;
                const container = activeMode === 'quiz' ? els.quizOptions : (activeMode === 'sentence' ? els.sentenceOptions : els.speedOptions);
                const buttons = container.querySelectorAll('.quiz-opt');
                if (buttons[index] && !buttons[index].disabled) {
                    buttons[index].click();
                }
            }
        }
    });

    pickNewCard();
}

// --- VERİ YÖNETİMİ ---
function loadData() {
    if(localStorage.getItem('ydspro_theme') === 'dark') toggleTheme();
    learnedCards = JSON.parse(localStorage.getItem('ydspro_learned') || '[]');
    favCards = JSON.parse(localStorage.getItem('ydspro_favs') || '[]');
    earnedBadges = JSON.parse(localStorage.getItem('ydspro_badges') || '[]');
    errorCards = JSON.parse(localStorage.getItem('ydspro_errors') || '[]');
    streakCount = parseInt(localStorage.getItem('ydspro_streak_count') || '0');
    lastStreakDate = localStorage.getItem('ydspro_streak_date') || '';
    speedHighScore = parseInt(localStorage.getItem('ydspro_speed_highscore') || '0');
    totalSpeedScore = parseInt(localStorage.getItem('ydspro_total_speed_score') || '0');
    els.highScoreDisplay.textContent = speedHighScore;

    cardPool = wordData.filter(w => !learnedCards.includes(w.id));
}

function saveData() {
    localStorage.setItem('ydspro_learned', JSON.stringify(learnedCards));
    localStorage.setItem('ydspro_favs', JSON.stringify(favCards));
    localStorage.setItem('ydspro_badges', JSON.stringify(earnedBadges));
    localStorage.setItem('ydspro_errors', JSON.stringify(errorCards));
    localStorage.setItem('ydspro_streak_count', streakCount.toString());
    localStorage.setItem('ydspro_streak_date', lastStreakDate);
    localStorage.setItem('ydspro_speed_highscore', speedHighScore.toString());
    localStorage.setItem('ydspro_total_speed_score', totalSpeedScore.toString());

    updateStats();
    checkBadges();
}

// --- SPEED RUN ---
function startSpeedRun() {
    speedScore = 0;
    speedTime = 60;
    els.speedScore.textContent = 0;
    els.speedTimer.textContent = 60;
    els.speedStartScreen.classList.add('hidden');
    nextSpeedQuestion();
    
    speedInterval = setInterval(() => {
        speedTime--;
        els.speedTimer.textContent = speedTime;
        if(speedTime <= 10) els.speedTimer.style.color = "#e74c3c";
        else els.speedTimer.style.color = "#e67e22";
        
        if(speedTime <= 0) {
            endSpeedGame();
        }
    }, 1000);
}

function nextSpeedQuestion() {
    const randomPool = wordData;
    currentCard = randomPool[Math.floor(Math.random() * randomPool.length)];
    els.speedWord.textContent = currentCard.word;
    generateOptions(els.speedOptions, 'definition', currentCard.definition);
}

function checkSpeedAnswer(btn, isCorrect, container) {
    const allBtns = container.querySelectorAll('.quiz-opt');
    allBtns.forEach(b => b.disabled = true);
    
    const speedCard = document.querySelector('.speed-content');

    if(isCorrect) {
        btn.classList.add('correct');
        speedScore += 10;
        totalSpeedScore += 10;
        speedTime += 2;
        
        if(speedCard) {
            speedCard.classList.add('correct-pulse');
            setTimeout(() => speedCard.classList.remove('correct-pulse'), 500);
        }
        
        if(errorCards.includes(currentCard.id)) {
            errorCards = errorCards.filter(id => id !== currentCard.id);
        }
    } else {
        btn.classList.add('wrong');
        allBtns.forEach(b => {
            if(b.innerText.includes(currentCard.definition)) b.classList.add('correct');
        });
        speedTime -= 5;
        
        if(speedCard) {
            speedCard.classList.add('wrong-pulse');
            setTimeout(() => speedCard.classList.remove('wrong-pulse'), 500);
        }
        
        if(!errorCards.includes(currentCard.id)) {
            errorCards.push(currentCard.id);
        }
    }
    els.speedScore.textContent = speedScore;
    els.speedTimer.textContent = speedTime;
    saveData();
    setTimeout(() => { nextSpeedQuestion(); }, 1000);
}

function endSpeedGame() {
    clearInterval(speedInterval);
    els.speedStartScreen.classList.remove('hidden');
    if(speedScore > speedHighScore) {
        speedHighScore = speedScore;
        saveData();
        els.highScoreDisplay.textContent = speedHighScore;
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        alert(`NEW HIGH SCORE: ${speedScore}! 🏆`);
    } else {
        alert(`Game Over! Score: ${speedScore}`);
    }
    checkBadges();
}

function exitSpeedGame() {
    clearInterval(speedInterval);
    els.speedMode.classList.add('hidden');
    els.speedStartScreen.classList.remove('hidden'); 
    activeMode = 'flashcard';
    els.flashcardMode.classList.remove('hidden');
    els.modeToggle.innerHTML = '<i class="fas fa-layer-group"></i>';
    pickNewCard();
}

// --- YARDIMCI FONKSİYONLAR ---
function preloadVoices() {
    availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            availableVoices = window.speechSynthesis.getVoices();
        };
    }
}

function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; 
    if (availableVoices.length === 0) availableVoices = window.speechSynthesis.getVoices();
    const preferredVoice = availableVoices.find(v => v.name.includes("Google US English")) || availableVoices.find(v => v.lang === "en-US");
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
}

function checkStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastStreakDate !== today && lastStreakDate !== yesterday && lastStreakDate !== "") streakCount = 0;
    updateStreakUI();
}

function updateStreak(isCorrect) {
    if (!isCorrect) return;
    const today = new Date().toDateString();
    if (lastStreakDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastStreakDate === yesterday) streakCount++;
    else streakCount = 1;
    lastStreakDate = today;
    saveData();
    updateStreakUI();
}

function updateStreakUI() {
    els.streakCount.textContent = streakCount;
    if (streakCount > 0) els.streakBox.classList.add('active');
    else els.streakBox.classList.remove('active');
}

function updateStats() {
    els.total.textContent = wordData.length;
    els.learned.textContent = learnedCards.length;
    els.progressBar.style.width = `${(learnedCards.length / wordData.length) * 100}%`;
    els.errorCount.textContent = errorCards.length;
    els.errorModeBtn.style.opacity = errorCards.length > 0 ? '1' : '0.5';
}

function toggleErrorReviewMode(forceExit = false) {
    if (!forceExit && !isErrorReviewMode && errorCards.length === 0) {
        alert("Good job! You have no errors to review.");
        return;
    }
    if (forceExit) isErrorReviewMode = false;
    else isErrorReviewMode = !isErrorReviewMode;
    
    document.body.classList.toggle('error-mode-active', isErrorReviewMode);
    
    if(isErrorReviewMode) {
        els.errorModeBtn.classList.add('active-mode');
        els.errorModeBtn.innerHTML = '<i class="fas fa-times"></i> EXIT';
    } else {
        els.errorModeBtn.classList.remove('active-mode');
        els.errorModeBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span class="badge-count" id="errorCount">'+errorCards.length+'</span>';
        els.errorCount = document.getElementById('errorCount');
    }
    
    cardHistory = [];
    historyIndex = -1;
    nextCard = null; 
    pickNewCard();
}

function checkBadges() {
    const wordCount = learnedCards.length;
    const score = totalSpeedScore;
    let newBadge = false;
    BADGES.forEach(badge => {
        let currentProgress = badge.type === 'words' ? wordCount : score;
        if (currentProgress >= badge.count && !earnedBadges.includes(badge.id)) {
            earnedBadges.push(badge.id);
            showToast(`${badge.icon} ${badge.name} Badge Unlocked!`, "NEW ACHIEVEMENT!");
            newBadge = true;
        }
    });
    if (newBadge) localStorage.setItem('ydspro_badges', JSON.stringify(earnedBadges));
}

function showToast(message, title = "Notification") {
    const titleEl = els.toast.querySelector('h4');
    if(titleEl) titleEl.textContent = title;
    els.toastMessage.textContent = message;
    els.toast.classList.remove('hidden');
    setTimeout(() => els.toast.classList.add('hidden'), 3000);
}

function openBadges() {
    els.badgeList.innerHTML = '';
    BADGES.forEach(badge => {
        const isUnlocked = earnedBadges.includes(badge.id);
        const progress = badge.type === 'words' ? learnedCards.length : totalSpeedScore;
        const div = document.createElement('div');
        div.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
        let progressText = isUnlocked ? 'Unlocked!' : `Goal: ${badge.count}`;
        div.innerHTML = `
            <span class="badge-icon">${badge.icon}</span>
            <span class="badge-name">${badge.name}</span>
            <span style="font-size:0.7em; color:#aaa">${progressText}</span>
        `;
        els.badgeList.appendChild(div);
    });
    els.badgeModal.classList.remove('hidden');
}

function toggleMode() {
    clearInterval(speedInterval); 

    if(activeMode === 'flashcard') activeMode = 'quiz';
    else if(activeMode === 'quiz') activeMode = 'sentence';
    else if(activeMode === 'sentence') activeMode = 'speed';
    else activeMode = 'flashcard';

    els.flashcardMode.classList.add('hidden');
    els.quizMode.classList.add('hidden');
    els.sentenceMode.classList.add('hidden');
    els.speedMode.classList.add('hidden');
    
    cardHistory = [];
    historyIndex = -1;
    nextCard = null; 

    if(nextCardEl) {
        nextCardEl.style.display = (activeMode === 'flashcard') ? 'flex' : 'none';
    }

    if(activeMode === 'flashcard') {
        els.modeToggle.innerHTML = '<i class="fas fa-layer-group"></i>';
        els.flashcardMode.classList.remove('hidden');
    } else if(activeMode === 'quiz') {
        els.modeToggle.innerHTML = '<i class="fas fa-gamepad"></i>';
        els.quizMode.classList.remove('hidden');
    } else if(activeMode === 'sentence') {
        els.modeToggle.innerHTML = '<i class="fas fa-align-left"></i>';
        els.sentenceMode.classList.remove('hidden');
    } else if(activeMode === 'speed') {
        els.modeToggle.innerHTML = '<i class="fas fa-stopwatch"></i>';
        els.speedMode.classList.remove('hidden');
        els.speedStartScreen.classList.remove('hidden');
        return; 
    }
    pickNewCard();
}

// --- KART SEÇİMİ VE GÖSTERİMİ ---
function pickNewCard() {
    els.card.style.transform = '';
    els.card.style.transition = '';
    els.card.classList.remove('swipe-right', 'swipe-left', 'flipped');
    
    // Arkadaki kart animasyonunu sıfırla (Snap effect önleme)
    if (nextCardEl) {
        nextCardEl.style.transition = 'none'; 
        nextCardEl.classList.remove('promote-card');
        void nextCardEl.offsetWidth; // Render tetikle
        nextCardEl.style.transition = 'all 0.3s ease';
    }
    
    let activePool = [];
    
    if (isErrorReviewMode) {
        activePool = wordData.filter(w => errorCards.includes(w.id));
        if (activePool.length === 0) {
            toggleErrorReviewMode(true);
            showToast("All errors cleared! Returning to normal mode.", "Great Job!");
            return;
        }
    } else {
        activePool = cardPool;
        if (activePool.length === 0) {
            alert("🎉 Congratulations! You mastered all words!");
            return;
        }
    }
    
    if (historyIndex < cardHistory.length - 1) {
        historyIndex++;
        currentCard = wordData.find(w => w.id === cardHistory[historyIndex]);
        nextCard = activePool[Math.floor(Math.random() * activePool.length)];
    } 
    else {
        if (nextCard && !isErrorReviewMode) { 
            currentCard = nextCard;
        } else {
            currentCard = activePool[Math.floor(Math.random() * activePool.length)];
        }
        
        let potentialNext;
        do {
            potentialNext = activePool[Math.floor(Math.random() * activePool.length)];
        } while (potentialNext.id === currentCard.id && activePool.length > 1); 
        
        nextCard = potentialNext;

        historyIndex++;
        cardHistory = cardHistory.slice(0, historyIndex); 
        cardHistory.push(currentCard.id);
        if (cardHistory.length > maxHistorySize) {
            cardHistory.shift(); 
            historyIndex--;
        }
    }
    
    const isFav = favCards.includes(currentCard.id);

    if(activeMode === 'quiz') setupQuiz(isFav);
    else if(activeMode === 'sentence') setupSentence(isFav);
    else {
        setupFlashcard(isFav);
        if(nextCard && nextCardEl) {
            document.getElementById('nextWordId').textContent = `#${nextCard.id}`;
            document.getElementById('nextWordEnglish').textContent = nextCard.word;
        }
    }
    
    updateNavigationControls();
}

function handleAnswer(known) {
    if(activeMode !== 'flashcard') return; 
    
    if(known) updateStreak(true);
    els.card.classList.add(known ? 'swipe-right' : 'swipe-left');
    
    // Arkadaki kartı öne anime et
    if (nextCardEl) {
        nextCardEl.classList.add('promote-card');
    }
    
    setTimeout(() => {
        if(known) {
            if(isErrorReviewMode) {
                errorCards = errorCards.filter(id => id !== currentCard.id);
            } else {
                learnedCards.push(currentCard.id);
                cardPool = cardPool.filter(w => w.id !== currentCard.id);
                if(errorCards.includes(currentCard.id)) errorCards = errorCards.filter(id => id !== currentCard.id);
            }
        } else {
            if(!errorCards.includes(currentCard.id)) errorCards.push(currentCard.id);
        }
        saveData();
        pickNewCard();
    }, 800); 
}

function updateNavigationControls() {
    if (activeMode === 'flashcard' || activeMode === 'speed') return;
    const navControls = activeMode === 'quiz' ? els.quizNavControls : els.sentNavControls;
    const prevBtn = activeMode === 'quiz' ? els.prevBtnQuiz : els.prevBtnSent;
    const nextBtn = activeMode === 'quiz' ? els.nextBtnQuiz : els.nextBtnSent;
    navControls.classList.remove('hidden');
    prevBtn.disabled = historyIndex <= 0;
    nextBtn.disabled = false; 
}

function navigateHistory(direction) {
    if (activeMode === 'flashcard' || activeMode === 'speed') return;
    
    const container = activeMode === 'quiz' ? els.quizOptions : els.sentenceOptions;
    const allBtns = container.querySelectorAll('.quiz-opt');
    allBtns.forEach(b => {
        b.disabled = false;
        b.classList.remove('correct', 'wrong');
    });
    
    if (direction === 'prev') {
        if (historyIndex > 0) {
            historyIndex--;
            currentCard = wordData.find(w => w.id === cardHistory[historyIndex]);
            const isFav = favCards.includes(currentCard.id);
            if(activeMode === 'quiz') setupQuiz(isFav);
            else if(activeMode === 'sentence') setupSentence(isFav);
            updateNavigationControls();
        } else {
            showToast("You are at the start of your history.", "Hint");
            return;
        }
    } else if (direction === 'next') {
        if (historyIndex < cardHistory.length - 1) {
            historyIndex++;
            currentCard = wordData.find(w => w.id === cardHistory[historyIndex]);
            const isFav = favCards.includes(currentCard.id);
            if(activeMode === 'quiz') setupQuiz(isFav);
            else if(activeMode === 'sentence') setupSentence(isFav);
            updateNavigationControls();
        } else {
            pickNewCard();
            return;
        }
    }
}

function touchStart(e) {
    if (activeMode !== 'flashcard' || els.card.classList.contains('flipped')) return;
    isDragging = true;
    startX = e.touches[0].clientX;
    els.card.style.transition = 'none';
    els.card.querySelector('.flip-card-inner').style.transition = 'none';
}

function touchMove(e) {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    e.preventDefault(); 
    els.card.style.transform = `translateX(${diffX}px) rotateY(0deg) rotateZ(${diffX / 20}deg)`;
    const opacity = Math.min(Math.abs(diffX) / swipeThreshold, 1);
    if (diffX > 0) { 
        els.btnPass.style.opacity = opacity;
        els.btnFail.style.opacity = 0.5; 
    } else { 
        els.btnFail.style.opacity = opacity;
        els.btnPass.style.opacity = 0.5;
    }
}

function touchEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - startX;
    els.card.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    els.card.querySelector('.flip-card-inner').style.transition = 'transform 0.6s';
    els.btnPass.style.opacity = 1;
    els.btnFail.style.opacity = 1;
    let answer = null;
    if (diffX > swipeThreshold) answer = true;
    else if (diffX < -swipeThreshold) answer = false;

    if (answer !== null) {
        els.card.style.transform = `translateX(${diffX > 0 ? 300 : -300}px) rotateZ(${diffX / 10}deg)`; 
        handleAnswer(answer);
    } else {
        els.card.style.transform = 'translateX(0) rotateZ(0)';
    }
}

function setupFlashcard(isFav) {
    els.en.textContent = currentCard.word;
    els.def.textContent = currentCard.definition || "";
    els.syn.textContent = currentCard.synonyms || "-";
    els.ex.textContent = currentCard.example || "-";
    els.id.textContent = `#${currentCard.id}`;
    updateFavIcon(els.favBtn, isFav);
}

function setupQuiz(isFav) {
    els.quizWord.textContent = currentCard.word;
    els.quizDef.textContent = ""; 
    updateFavIcon(els.quizFavBtn, isFav);
    generateOptions(els.quizOptions, 'definition', currentCard.definition);
}

function setupSentence(isFav) {
    const hiddenSentence = currentCard.example.replace(new RegExp(currentCard.word, "gi"), "<span class='blank-space'>_____</span>");
    els.sentenceText.innerHTML = hiddenSentence;
    updateFavIcon(els.sentFavBtn, isFav);
    generateOptions(els.sentenceOptions, 'word', currentCard.word);
}

function generateOptions(container, type, correctAnswer) {
    let options = [currentCard];
    while(options.length < 4) {
        let randomW = wordData[Math.floor(Math.random() * wordData.length)];
        if(!options.includes(randomW)) options.push(randomW);
    }
    options.sort(() => Math.random() - 0.5);
    container.innerHTML = '';
    options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt';
        // GÜNCELLENDİ: Kısayol numaralarını gizlemek için sınıf eklendi
        const numberPrefix = `<span class="key-shortcut" style="opacity:0.5; margin-right:8px; font-size:0.8em;">[${index + 1}]</span>`;
        btn.innerHTML = numberPrefix + opt[type];
        if (activeMode === 'speed') {
            btn.onclick = () => checkSpeedAnswer(btn, opt.id === currentCard.id, container);
        } else {
            btn.onclick = () => checkAnswer(btn, opt.id === currentCard.id, container);
        }
        container.appendChild(btn);
    });
}

function checkAnswer(btn, isCorrect, container) {
    const allBtns = container.querySelectorAll('.quiz-opt');
    allBtns.forEach(b => b.disabled = true);
    if(isCorrect) {
        btn.classList.add('correct');
        if (isErrorReviewMode) errorCards = errorCards.filter(id => id !== currentCard.id);
        if(errorCards.includes(currentCard.id)) errorCards = errorCards.filter(id => id !== currentCard.id);
        saveData();
        if (historyIndex === cardHistory.length - 1) setTimeout(() => pickNewCard(), 2000);
    } else {
        btn.classList.add('wrong');
        let correctText = activeMode === 'sentence' ? currentCard.word : currentCard.definition;
        allBtns.forEach(b => { if(b.innerText.includes(correctText)) b.classList.add('correct'); });
        if(!errorCards.includes(currentCard.id)) errorCards.push(currentCard.id);
        saveData();
        if (historyIndex === cardHistory.length - 1) setTimeout(() => pickNewCard(), 2000);
    }
}

function toggleFav() {
    if(favCards.includes(currentCard.id)) favCards = favCards.filter(id => id !== currentCard.id);
    else favCards.push(currentCard.id);
    saveData();
    const isFav = favCards.includes(currentCard.id);
    updateFavIcon(els.favBtn, isFav);
    updateFavIcon(els.quizFavBtn, isFav);
    updateFavIcon(els.sentFavBtn, isFav);
}

function updateFavIcon(btn, isFav) {
    btn.innerHTML = isFav ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
}

function openDict() {
    els.dictModal.classList.remove('hidden');
    renderDict();
}

function renderDict() {
    const term = els.searchInput.value.toLowerCase();
    els.wordList.innerHTML = '';
    const filtered = wordData.filter(w => {
        const matchesSearch = w.word.toLowerCase().includes(term) || w.definition.toLowerCase().includes(term);
        const matchesFav = isFilterFav ? favCards.includes(w.id) : true;
        const matchesError = isFilterError ? errorCards.includes(w.id) : true;
        return matchesSearch && matchesFav && matchesError;
    });
    const displayList = term ? filtered : filtered.slice(0, 100);
    if (displayList.length === 0) {
        els.wordList.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">No words found.</div>';
        return;
    }
    displayList.forEach(w => {
        const div = document.createElement('div');
        div.className = 'dict-item';
        
        const isLearned = learnedCards.includes(w.id);
        const isFav = favCards.includes(w.id);
        const isErr = errorCards.includes(w.id);
        
        let statusIcon = '';
        if (isErr) {
            div.classList.add('error-word');
            statusIcon = '<i class="fas fa-exclamation-circle" style="color:var(--danger);" title="Review Needed"></i>';
        } else if (isLearned) {
            div.classList.add('learned');
            statusIcon = '<i class="fas fa-check-circle" style="color:var(--success);" title="Mastered"></i>';
        }
        
        div.innerHTML = `
            <div style="text-align:left; max-width:85%;">
                <strong>${w.word}</strong>
                <br>
                <small class="dict-def">${w.definition}</small>
            </div>
            <div class="dict-icons">
                ${statusIcon}
                ${isFav ? '<i class="fas fa-star" style="color:var(--gold);"></i>' : ''}
            </div>
        `;
        els.wordList.appendChild(div);
    });
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('ydspro_theme', isDarkMode ? 'dark' : 'light');
}

function resetAll() {
    if(confirm('Reset ALL progress and badges?')) {
        localStorage.clear();
        location.reload();
    }
}

init();