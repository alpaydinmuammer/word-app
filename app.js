// GLOBAL VARIABLES
let currentCard = null;
let learnedCards = [];
let favCards = [];
let errorCards = [];
let earnedBadges = [];
let cardPool = [];
let isDarkMode = false;
let isQuizMode = false;
let isFilterFav = false;
let isFilterError = false;
let isErrorReviewMode = false;

const BADGES = [
    { id: 'b1', name: 'Newbie', count: 10, icon: '👶' },
    { id: 'b2', name: 'Student', count: 50, icon: '🤓' },
    { id: 'b3', name: 'Scholar', count: 100, icon: '🎓' },
    { id: 'b4', name: 'Wizard', count: 250, icon: '🧙‍♂️' },
    { id: 'b5', name: 'King of YDS', count: 500, icon: '👑' },
    { id: 'b6', name: 'Legend', count: 1000, icon: '🚀' }
];

// DOM ELEMENTS
const els = {
    flashcardMode: document.getElementById('flashcardMode'),
    quizMode: document.getElementById('quizMode'),
    card: document.getElementById('cardElement'),
    en: document.getElementById('wordEnglish'),
    tr: document.getElementById('wordMeaning'),
    syn: document.getElementById('wordSynonym'),
    ex: document.getElementById('wordExample'),
    id: document.getElementById('wordId'),
    total: document.getElementById('totalWords'),
    learned: document.getElementById('learnedWords'),
    progressBar: document.getElementById('progressBar'),
    
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
    quizOptions: document.getElementById('quizOptions'),
    quizSpeak: document.getElementById('quizSpeak'),
    quizFavBtn: document.getElementById('quizFavBtn'),
    
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

// --- INIT ---
function init() {
    loadData();
    updateStats();
    
    els.btnFail.addEventListener('click', () => handleAnswer(false));
    els.btnPass.addEventListener('click', () => handleAnswer(true));
    els.card.addEventListener('click', (e) => {
        if(!e.target.closest('button')) els.card.classList.toggle('flipped');
    });
    
    els.btnSpeak.addEventListener('click', (e) => { e.stopPropagation(); speak(currentCard.word); });
    els.quizSpeak.addEventListener('click', () => speak(currentCard.word));
    els.favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFav(); });
    els.quizFavBtn.addEventListener('click', toggleFav);
    els.btnReset.addEventListener('click', resetAll);
    els.themeToggle.addEventListener('click', toggleTheme);
    els.modeToggle.addEventListener('click', toggleMode);
    
    els.dictToggle.addEventListener('click', openDict);
    els.closeDict.addEventListener('click', () => els.dictModal.classList.add('hidden'));
    els.badgeToggle.addEventListener('click', openBadges);
    els.closeBadge.addEventListener('click', () => els.badgeModal.classList.add('hidden'));
    
    els.errorModeBtn.addEventListener('click', toggleErrorReviewMode);

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

    pickNewCard();
}

// --- CORE ---

function loadData() {
    if(localStorage.getItem('ydspro_theme') === 'dark') toggleTheme();
    learnedCards = JSON.parse(localStorage.getItem('ydspro_learned') || '[]');
    favCards = JSON.parse(localStorage.getItem('ydspro_favs') || '[]');
    earnedBadges = JSON.parse(localStorage.getItem('ydspro_badges') || '[]');
    errorCards = JSON.parse(localStorage.getItem('ydspro_errors') || '[]');
    
    cardPool = wordData.filter(w => !learnedCards.includes(w.id));
}

function saveData() {
    localStorage.setItem('ydspro_learned', JSON.stringify(learnedCards));
    localStorage.setItem('ydspro_favs', JSON.stringify(favCards));
    localStorage.setItem('ydspro_badges', JSON.stringify(earnedBadges));
    localStorage.setItem('ydspro_errors', JSON.stringify(errorCards));
    updateStats();
    checkBadges();
}

function updateStats() {
    els.total.textContent = wordData.length;
    els.learned.textContent = learnedCards.length;
    els.progressBar.style.width = `${(learnedCards.length / wordData.length) * 100}%`;
    els.errorCount.textContent = errorCards.length;
    els.errorModeBtn.style.opacity = errorCards.length > 0 ? '1' : '0.5';
}

function toggleErrorReviewMode() {
    if(errorCards.length === 0) {
        alert("Good job! You have no errors to review.");
        return;
    }
    isErrorReviewMode = !isErrorReviewMode;
    document.body.classList.toggle('error-mode-active', isErrorReviewMode);
    
    if(isErrorReviewMode) {
        els.errorModeBtn.innerHTML = '<i class="fas fa-times"></i> Exit';
    } else {
        els.errorModeBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span class="badge-count" id="errorCount">'+errorCards.length+'</span>';
        els.errorCount = document.getElementById('errorCount');
    }
    pickNewCard();
}

function checkBadges() {
    const count = learnedCards.length;
    let newBadge = false;
    BADGES.forEach(badge => {
        if (count >= badge.count && !earnedBadges.includes(badge.id)) {
            earnedBadges.push(badge.id);
            showToast(badge.name);
            newBadge = true;
        }
    });
    if (newBadge) localStorage.setItem('ydspro_badges', JSON.stringify(earnedBadges));
}

function showToast(badgeName) {
    els.toastMessage.textContent = `You earned the "${badgeName}" badge!`;
    els.toast.classList.remove('hidden');
    const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
    audio.play().catch(e=>{});
    setTimeout(() => els.toast.classList.add('hidden'), 3000);
}

function openBadges() {
    els.badgeList.innerHTML = '';
    BADGES.forEach(badge => {
        const isUnlocked = earnedBadges.includes(badge.id);
        const div = document.createElement('div');
        div.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
        div.innerHTML = `<span class="badge-icon">${badge.icon}</span><span class="badge-name">${badge.name}</span><span style="font-size:0.7em; color:#aaa">${badge.count} Words</span>`;
        els.badgeList.appendChild(div);
    });
    els.badgeModal.classList.remove('hidden');
}

function toggleMode() {
    isQuizMode = !isQuizMode;
    els.modeToggle.innerHTML = isQuizMode ? '<i class="fas fa-layer-group"></i>' : '<i class="fas fa-gamepad"></i>';
    if(isQuizMode) {
        els.flashcardMode.classList.add('hidden');
        els.quizMode.classList.remove('hidden');
    } else {
        els.quizMode.classList.add('hidden');
        els.flashcardMode.classList.remove('hidden');
    }
    pickNewCard();
}

function pickNewCard() {
    els.card.classList.remove('swipe-right', 'swipe-left', 'flipped');
    
    let activePool = [];
    if (isErrorReviewMode) {
        activePool = wordData.filter(w => errorCards.includes(w.id));
        if (activePool.length === 0) {
            alert("All errors cleared! Switching back to normal mode.");
            toggleErrorReviewMode();
            return;
        }
    } else {
        activePool = cardPool;
        if (activePool.length === 0) {
            alert("🎉 Congratulations! You mastered all words!");
            return;
        }
    }

    currentCard = activePool[Math.floor(Math.random() * activePool.length)];
    const isFav = favCards.includes(currentCard.id);

    if(isQuizMode) setupQuiz(isFav);
    else setupFlashcard(isFav);
}

function setupFlashcard(isFav) {
    els.en.textContent = currentCard.word;
    els.tr.textContent = currentCard.meaning;
    els.syn.textContent = currentCard.synonyms || "-";
    els.ex.textContent = currentCard.example || "-";
    els.id.textContent = `#${currentCard.id}`;
    updateFavIcon(els.favBtn, isFav);
}

function setupQuiz(isFav) {
    els.quizWord.textContent = currentCard.word;
    updateFavIcon(els.quizFavBtn, isFav);
    let options = [currentCard];
    while(options.length < 4) {
        let randomW = wordData[Math.floor(Math.random() * wordData.length)];
        if(!options.includes(randomW)) options.push(randomW);
    }
    options.sort(() => Math.random() - 0.5);
    els.quizOptions.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.textContent = opt.meaning;
        btn.onclick = () => checkQuizAnswer(btn, opt.id === currentCard.id);
        els.quizOptions.appendChild(btn);
    });
}

function checkQuizAnswer(btn, isCorrect) {
    const allBtns = document.querySelectorAll('.quiz-opt');
    allBtns.forEach(b => b.disabled = true);
    if(isCorrect) {
        btn.classList.add('correct');
        setTimeout(() => handleAnswer(true), 1000);
    } else {
        btn.classList.add('wrong');
        allBtns.forEach(b => {
            if(b.textContent === currentCard.meaning) b.classList.add('correct');
        });
        setTimeout(() => handleAnswer(false), 1500);
    }
}

function handleAnswer(known) {
    if(!isQuizMode) els.card.classList.add(known ? 'swipe-right' : 'swipe-left');

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
    }, isQuizMode ? 0 : 500);
}

function toggleFav() {
    if(favCards.includes(currentCard.id)) favCards = favCards.filter(id => id !== currentCard.id);
    else favCards.push(currentCard.id);
    saveData();
    const isFav = favCards.includes(currentCard.id);
    updateFavIcon(els.favBtn, isFav);
    updateFavIcon(els.quizFavBtn, isFav);
}

function updateFavIcon(btn, isFav) {
    btn.innerHTML = isFav ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
}

function speak(text) {
    if('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
    }
}

function openDict() {
    els.dictModal.classList.remove('hidden');
    renderDict();
}

function renderDict() {
    const term = els.searchInput.value.toLowerCase();
    els.wordList.innerHTML = '';
    
    const filtered = wordData.filter(w => {
        const matchesSearch = w.word.toLowerCase().includes(term) || w.meaning.toLowerCase().includes(term);
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
        if(learnedCards.includes(w.id)) div.classList.add('learned');
        
        const isFav = favCards.includes(w.id);
        const isErr = errorCards.includes(w.id);

        div.innerHTML = `
            <div style="text-align:left;">
                <strong>${w.word}</strong> 
                ${isErr ? '<span style="color:#e74c3c; font-size:0.8em; margin-left:5px;"><i class="fas fa-exclamation-triangle"></i></span>' : ''}
                <br> <small>${w.meaning}</small>
            </div>
            <div>${isFav ? '<i class="fas fa-star" style="color:#f1c40f"></i>' : ''}</div>
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