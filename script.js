const WordElement = document.getElementById('word');
const WordImage = document.getElementById('word_image');
const WordCountElement = document.getElementById('word_count');

const TranscriptionElement = document.getElementById('transcription');
const RuTranslationElement = document.getElementById('ru_translation');
const UaTranslationElement = document.getElementById('ua_translation');

const AudioBtn = document.getElementById('audio_btn');
const NextWordBtn = document.getElementById('next_word_btn');
const PrevWordBtn = document.getElementById('prev_word_btn');
const NavBarBtn = document.getElementById('navbar_btn');

const ModalOverlay = document.getElementById('modal_overlay');
const ModalGrid = document.getElementById('modal_grid');

const DEFAULT_DAYS_LIMIT = 7;
const DEFAULT_ICON = '📚';
const DEFAULT_TITLE = "Помилка"

let CurrentWordSet;
let CurrentAudio;

async function ReadJSON(path) {
  try {
    const response = await fetch(path);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(`Error! Could not read JSON file: ${error}`);
  }
}

async function LoadWordSets(daysLimit = DEFAULT_DAYS_LIMIT) {
  const wordSets = await ReadJSON("data/word_sets.json");
  if (!wordSets) return [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysLimit);
  
  const newWords = wordSets.flatMap((set) =>
    set.words.filter((word) => word.date_added && new Date(word.date_added) >= cutoffDate)
);

if (newWords.length > 0) {
  wordSets.unshift({
    title: "Нові",
    icon: "✨",
    words: newWords
  });
}

return wordSets;
}

function SetWordSet(word_set) {
  CurrentWordSet = word_set;
  NavBarBtn.textContent = word_set.title || DEFAULT_TITLE;
  SetWord(word_set.words[0]);
}

function SetWord(word_entry) {
  const totalWords = CurrentWordSet.words.length;
  const wordIndex = CurrentWordSet.words.findIndex((item) => item.id == word_entry.id);
  
  WordCountElement.textContent = `${wordIndex+1} / ${totalWords}`
  
  WordElement.textContent = word_entry.word;
  WordElement.dataset.wordId = word_entry.id; 
  WordImage.src = word_entry.image || "";
  WordImage.alt = word_entry.word;
  TranscriptionElement.textContent = word_entry.transcription;
  UaTranslationElement.textContent = `🇺🇦 ${word_entry.translation_ua} 🇺🇦`;
  RuTranslationElement.textContent = `🇷🇺 ${word_entry.translation_ru} 🇷🇺`;
}

function ShiftWord(shift) {
  const totalWords = CurrentWordSet.words.length;
  const currentWordIndex = CurrentWordSet.words.findIndex((item) => item.id == WordElement.dataset.wordId);
  const nextWordIndex = (currentWordIndex + shift + totalWords) % totalWords;
  const nextWord = CurrentWordSet.words[nextWordIndex];
  if (nextWord === undefined) {
    return;
  }
  
  SetWord(nextWord);
}

function InitModalGrid(wordSets) {
  ModalGrid.innerHTML = '';
  
  wordSets.forEach((wordSet) => {
    const btn = document.createElement('button');
    btn.classList.add('wordset-btn');
    btn.classList.add('inv-btn');
    
    btn.innerHTML = `
    <span class="wordset-icon">${wordSet.icon || DEFAULT_ICON}</span>
    <span class="wordset-title">${wordSet.title || DEFAULT_TITLE}</span>
    `;
    
    btn.addEventListener('click', () => {
      SetWordSet(wordSet);
      ModalOverlay.classList.add('hidden');
    });
    
    ModalGrid.appendChild(btn);
  });
}

async function Init() {
  const WordSets = await LoadWordSets();
  
  SetWordSet(WordSets[0]);
  InitModalGrid(WordSets)
}

NextWordBtn.addEventListener("click", () => ShiftWord(1))
PrevWordBtn.addEventListener("click", () => ShiftWord(-1))

NavBarBtn.addEventListener('click', () => ModalOverlay.classList.remove('hidden'))

ModalOverlay.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    ModalOverlay.classList.add('hidden');
  }
});

AudioBtn.addEventListener('click', () => {
  const currentWordEntry = CurrentWordSet.words.find((item) => item.id == WordElement.dataset.wordId);
  
  if (currentWordEntry && currentWordEntry.audio) {

    if (CurrentAudio) {
      CurrentAudio.pause();
      CurrentAudio.currentTime = 0;
    }

    CurrentAudio = new Audio(currentWordEntry.audio);
    CurrentAudio.play().catch(err => console.error(`Error! Audio playback failed: ${err}`));
  }
});

Init();