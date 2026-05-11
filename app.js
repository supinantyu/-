const STORAGE_KEY = "kuuReadingTimerPwa.v8";
const OLD_STORAGE_KEYS = ["kuuReadingTimerPwa.v7", "kuuReadingTimerPwa.v6", "kuuReadingTimerPwa.v5", "kuuReadingTimerPwa.v4", "kuuReadingTimerPwa.v3", "kuuReadingTimerPwa.v2", "kuuReadingTimerPwa.v1"];

const IMAGE_PATHS = {
  waiting: ["./kuu_waiting.png"],
  reading: ["./kuu_reading.png"],
  recording: ["./kuu_recording.png"]
};

const GENRE_MASTER = {
  mystery: { label: "ミステリー", image: "./genre-mystery.png" },
  sf: { label: "SF", image: "./genre-sf.png" },
  youth: { label: "青春", image: "./genre-youth.png" },
  shinsho: { label: "新書", image: "./genre-shinsho.png" },
  horror: { label: "ホラー", image: "./genre-horror.png" },
  lightnovel: { label: "ラノベ", image: "./genre-lightnovel.png" },
  fantasy: { label: "ファンタジー", image: "./genre-fantasy.png" }
};

/*
  Cloudflare Workersを作ったあと、下のURLを自分のWorkers URLに差し替えてください。
  例: const AI_SUMMARY_ENDPOINT = "https://kuu-reading-summary.xxxxx.workers.dev";
*/
const AI_SUMMARY_ENDPOINT = "";

const READING_TAGS = [
  "怖い",
  "泣ける",
  "爽快",
  "難しい",
  "どんでん返し",
  "文章が好き",
  "キャラが好き",
  "世界観が好き",
  "考察したい",
  "余韻がある",
  "読みやすい",
  "重い"
];

const STATUS_MASTER = {
  completed: { label: "読了", className: "completed" },
  dropped: { label: "投了", className: "dropped" }
};

const state = {
  data: { books: [], notes: [] },
  timerState: "waiting",
  selectedBookId: null,
  elapsedSeconds: 0,
  timerStartedAt: null,
  timerId: null,
  wakeLock: null,
  detailBookId: null,
  editingBookId: null,
  editingNoteId: null,
  tempBookRating: 0
};

const els = {
  timerView: document.querySelector("#timerView"),
  bookshelfView: document.querySelector("#bookshelfView"),
  detailView: document.querySelector("#detailView"),
  timerTab: document.querySelector("#timerTab"),
  bookshelfTab: document.querySelector("#bookshelfTab"),
  kuuImage: document.querySelector("#kuuImage"),
  kuuMessage: document.querySelector("#kuuMessage"),
  bookSelect: document.querySelector("#bookSelect"),
  stateLabel: document.querySelector("#stateLabel"),
  timerDisplay: document.querySelector("#timerDisplay"),
  startButton: document.querySelector("#startButton"),
  finishButton: document.querySelector("#finishButton"),
  cancelButton: document.querySelector("#cancelButton"),
  saveNoteButton: document.querySelector("#saveNoteButton"),
  recordPanel: document.querySelector("#recordPanel"),
  recordBookTitle: document.querySelector("#recordBookTitle"),
  recordTime: document.querySelector("#recordTime"),
  dateInput: document.querySelector("#dateInput"),
  pagesInput: document.querySelector("#pagesInput"),
  memoInput: document.querySelector("#memoInput"),
  recordCompletedButton: document.querySelector("#recordCompletedButton"),
  recordDroppedButton: document.querySelector("#recordDroppedButton"),
  bookModal: document.querySelector("#bookModal"),
  bookModalTitle: document.querySelector("#bookModalTitle"),
  openAddBookModalButton: document.querySelector("#openAddBookModalButton"),
  closeBookModalButton: document.querySelector("#closeBookModalButton"),
  saveBookButton: document.querySelector("#saveBookButton"),
  bookTitleInput: document.querySelector("#bookTitleInput"),
  bookAuthorInput: document.querySelector("#bookAuthorInput"),
  bookGenreInput: document.querySelector("#bookGenreInput"),
  bookRatingInput: document.querySelector("#bookRatingInput"),
  noteModal: document.querySelector("#noteModal"),
  closeNoteModalButton: document.querySelector("#closeNoteModalButton"),
  saveEditedNoteButton: document.querySelector("#saveEditedNoteButton"),
  editNoteDateInput: document.querySelector("#editNoteDateInput"),
  editNotePagesInput: document.querySelector("#editNotePagesInput"),
  editNoteMemoInput: document.querySelector("#editNoteMemoInput"),
  editNoteSummaryInput: document.querySelector("#editNoteSummaryInput"),
  bookList: document.querySelector("#bookList"),
  noteList: document.querySelector("#noteList"),
  detailTitle: document.querySelector("#detailTitle"),
  detailAuthor: document.querySelector("#detailAuthor"),
  detailGenre: document.querySelector("#detailGenre"),
  detailStatus: document.querySelector("#detailStatus"),
  detailGenreImage: document.querySelector("#detailGenreImage"),
  detailRating: document.querySelector("#detailRating"),
  markCompletedButton: document.querySelector("#markCompletedButton"),
  markDroppedButton: document.querySelector("#markDroppedButton"),
  tagButtonList: document.querySelector("#tagButtonList"),
  detailTotalMinutes: document.querySelector("#detailTotalMinutes"),
  detailTotalPages: document.querySelector("#detailTotalPages"),
  detailNoteCount: document.querySelector("#detailNoteCount"),
  generateAiSummaryButton: document.querySelector("#generateAiSummaryButton"),
  aiSummaryBox: document.querySelector("#aiSummaryBox"),
  aiSummaryUpdatedAt: document.querySelector("#aiSummaryUpdatedAt"),
  backToBookshelfButton: document.querySelector("#backToBookshelfButton"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importFileInput: document.querySelector("#importFileInput"),
  installHelpButton: document.querySelector("#installHelpButton"),
  installHelpModal: document.querySelector("#installHelpModal"),
  closeInstallHelpButton: document.querySelector("#closeInstallHelpButton")
};

const stateConfig = {
  waiting: { label: "待機中", message: "準備ができたら始めましょう、ご主人様。", alt: "待機中のクー" },
  reading: { label: "読書中", message: "読書中です。クーは静かに見守ります。", alt: "読書中のクー" },
  recording: { label: "記録中", message: "今の感想を、忘れる前に残しましょう。", alt: "記録中のクー" }
};

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function inputDateToISO(dateValue) {
  if (!dateValue) return new Date().toISOString();
  return new Date(`${dateValue}T12:00:00`).toISOString();
}

function isoToInputDate(isoValue) {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return todayInputValue();
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function formatDate(isoValue) {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "日付不明";
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

function getGenreInfo(genre) {
  return GENRE_MASTER[genre] ?? GENRE_MASTER.mystery;
}

function loadData() {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    for (const key of OLD_STORAGE_KEYS) {
      raw = localStorage.getItem(key);
      if (raw) break;
    }
  }

  if (!raw) {
    state.data = {
      books: [{
        id: createId(),
        title: "サンプル本",
        author: "クー",
        genre: "mystery",
        rating: 0,
        status: "",
        statusUpdatedAt: "",
        tags: [],
        aiSummary: "",
        aiSummaryUpdatedAt: "",
        createdAt: new Date().toISOString(),
        isFinished: false
      }],
      notes: []
    };
    saveData();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.data.books = Array.isArray(parsed.books) ? parsed.books : [];
    state.data.notes = Array.isArray(parsed.notes) ? parsed.notes : [];
    normalizeData();
    saveData();
  } catch {
    state.data = { books: [], notes: [] };
  }
}

function normalizeData() {
  state.data.books = state.data.books.map(book => ({
    id: book.id || createId(),
    title: book.title || "無題の本",
    author: book.author || "",
    genre: GENRE_MASTER[book.genre] ? book.genre : "mystery",
    rating: Math.max(0, Math.min(5, Number(book.rating || 0))),
    status: ["completed", "dropped"].includes(book.status) ? book.status : "",
    statusUpdatedAt: book.statusUpdatedAt || "",
    tags: Array.isArray(book.tags) ? book.tags.filter(tag => READING_TAGS.includes(tag)) : [],
    aiSummary: book.aiSummary || "",
    aiSummaryUpdatedAt: book.aiSummaryUpdatedAt || "",
    createdAt: book.createdAt || new Date().toISOString(),
    isFinished: Boolean(book.isFinished)
  }));

  state.data.notes = state.data.notes.map(note => ({
    id: note.id || createId(),
    bookId: note.bookId,
    minutes: Number(note.minutes || 1),
    pages: Number(note.pages || 0),
    memo: note.memo || "",
    summary: note.summary || "",
    date: note.date || new Date().toISOString()
  })).filter(note => note.bookId && state.data.books.some(book => book.id === note.bookId));
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function selectedBook() {
  return state.data.books.find(book => book.id === state.selectedBookId) ?? null;
}

function notesForBook(bookId) {
  return state.data.notes
    .filter(note => note.bookId === bookId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function readingMinutes() {
  return Math.max(1, Math.floor(state.elapsedSeconds / 60));
}

function setView(name) {
  els.timerView.classList.toggle("active", name === "timer");
  els.bookshelfView.classList.toggle("active", name === "bookshelf");
  els.detailView.classList.toggle("active", name === "detail");
  els.timerTab.classList.toggle("active", name === "timer");
  els.bookshelfTab.classList.toggle("active", name === "bookshelf" || name === "detail");
}

function setTimerState(nextState) {
  state.timerState = nextState;
  if (nextState === "recording" && !els.dateInput.value) {
    els.dateInput.value = todayInputValue();
  }
  render();
}

function render() {
  renderKuu();
  renderBookSelect();
  renderTimer();
  renderRecordPanel();
  renderBookshelf();
  if (state.detailBookId) renderDetail();
}

function renderKuu() {
  const config = stateConfig[state.timerState];
  els.kuuImage.style.opacity = "0.2";
  setTimeout(() => {
    els.kuuImage.src = IMAGE_PATHS[state.timerState][0];
    els.kuuImage.alt = config.alt;
    els.kuuImage.style.opacity = "1";
  }, 70);
  els.kuuMessage.textContent = config.message;
}

function renderBookSelect() {
  const current = state.selectedBookId;
  els.bookSelect.innerHTML = "";

  if (state.data.books.length === 0) {
    const option = document.createElement("option");
    option.textContent = "本を追加してください";
    option.value = "";
    els.bookSelect.append(option);
    els.bookSelect.disabled = true;
    return;
  }

  els.bookSelect.disabled = state.timerState === "reading";

  for (const book of state.data.books) {
    const option = document.createElement("option");
    option.value = book.id;
    option.textContent = book.author ? `${book.title} / ${book.author}` : book.title;
    els.bookSelect.append(option);
  }

  if (current && state.data.books.some(book => book.id === current)) {
    els.bookSelect.value = current;
  } else {
    state.selectedBookId = state.data.books[0].id;
    els.bookSelect.value = state.selectedBookId;
  }
}

function updateElapsedFromClock() {
  if (state.timerState !== "reading" || !state.timerStartedAt) return;
  state.elapsedSeconds = Math.max(0, Math.floor((Date.now() - state.timerStartedAt) / 1000));
}

function renderTimer() {
  updateElapsedFromClock();
  els.timerDisplay.textContent = formatTime(state.elapsedSeconds);
  els.stateLabel.textContent = stateConfig[state.timerState].label;
  els.startButton.classList.toggle("hidden", state.timerState !== "waiting");
  els.finishButton.classList.toggle("hidden", state.timerState !== "reading");
  els.cancelButton.classList.toggle("hidden", state.timerState !== "reading");
}

function renderRecordPanel() {
  const isRecording = state.timerState === "recording";
  els.recordPanel.classList.toggle("hidden", !isRecording);
  const book = selectedBook();
  els.recordBookTitle.textContent = `本：${book ? book.title : "未選択"}`;
  els.recordTime.textContent = `読書時間：${readingMinutes()}分`;
  if (isRecording && !els.dateInput.value) els.dateInput.value = todayInputValue();
  if (book && els.recordCompletedButton && els.recordDroppedButton) {
    els.recordCompletedButton.classList.toggle("active", book.status === "completed");
    els.recordDroppedButton.classList.toggle("active", book.status === "dropped");
  }
}

function renderStars(book) {
  const rating = Math.max(0, Math.min(5, Number(book.rating || 0)));
  return `
    <div class="rating-row" aria-label="評価 ${rating}点">
      ${[1, 2, 3, 4, 5].map(value => `
        <button class="star-button ${value > rating ? "empty" : ""}" data-rate-book="${book.id}" data-rating="${value}" type="button" aria-label="${value}点">★</button>
      `).join("")}
    </div>
  `;
}

function renderRatingInput(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
  els.bookRatingInput.innerHTML = [1, 2, 3, 4, 5].map(value => `
    <button class="star-button ${value > safeRating ? "empty" : ""}" data-modal-rating="${value}" type="button" aria-label="${value}点">★</button>
  `).join("");

  els.bookRatingInput.querySelectorAll("[data-modal-rating]").forEach(button => {
    button.addEventListener("click", () => {
      const ratingValue = Number(button.getAttribute("data-modal-rating"));
      state.tempBookRating = state.tempBookRating === ratingValue ? 0 : ratingValue;
      renderRatingInput(state.tempBookRating);
    });
  });
}

function updateBookRating(bookId, rating) {
  const book = state.data.books.find(item => item.id === bookId);
  if (!book) return;
  book.rating = Number(book.rating || 0) === rating ? 0 : rating;
  saveData();
  render();
}

function bindRatingButtons(container) {
  container.querySelectorAll("[data-rate-book]").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const bookId = button.getAttribute("data-rate-book");
      const rating = Number(button.getAttribute("data-rating"));
      updateBookRating(bookId, rating);
    });
  });
}


function statusBadgeHtml(status) {
  const info = STATUS_MASTER[status];
  if (!info) return "";
  return `<span class="status-badge ${info.className}">${info.label}</span>`;
}

function tagListHtml(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return `<div class="tag-list">${tags.map(tag => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function setBookStatus(status) {
  const book = state.data.books.find(item => item.id === state.detailBookId);
  if (!book) return;

  book.status = book.status === status ? "" : status;
  book.statusUpdatedAt = book.status ? new Date().toISOString() : "";
  saveData();
  render();
}

function setSelectedBookStatus(status) {
  const book = selectedBook();
  if (!book) return;

  book.status = book.status === status ? "" : status;
  book.statusUpdatedAt = book.status ? new Date().toISOString() : "";
  saveData();
  render();
}

function toggleBookTag(tag) {
  const book = state.data.books.find(item => item.id === state.detailBookId);
  if (!book) return;

  if (!Array.isArray(book.tags)) book.tags = [];
  if (book.tags.includes(tag)) {
    book.tags = book.tags.filter(item => item !== tag);
  } else {
    book.tags.push(tag);
  }
  saveData();
  render();
}

function renderStatusControls(book) {
  els.detailStatus.innerHTML = book.status ? `ステータス：${statusBadgeHtml(book.status)}` : "";
  els.markCompletedButton.classList.toggle("active", book.status === "completed");
  els.markDroppedButton.classList.toggle("active", book.status === "dropped");
}

function renderTagControls(book) {
  const tags = Array.isArray(book.tags) ? book.tags : [];
  els.tagButtonList.innerHTML = READING_TAGS.map(tag => `
    <button
      class="tag-button ${tags.includes(tag) ? "active" : ""}"
      data-toggle-tag="${escapeHtml(tag)}"
      type="button"
    >${escapeHtml(tag)}</button>
  `).join("");

  els.tagButtonList.querySelectorAll("[data-toggle-tag]").forEach(button => {
    button.addEventListener("click", () => toggleBookTag(button.getAttribute("data-toggle-tag")));
  });
}


function renderBookshelf() {
  els.bookList.innerHTML = "";

  if (state.data.books.length === 0) {
    els.bookList.innerHTML = `<article class="book-card"><h3>本がありません</h3><p class="meta">タイマー画面から本を追加できます。</p></article>`;
    return;
  }

  for (const book of state.data.books) {
    const notes = notesForBook(book.id);
    const totalMinutes = notes.reduce((sum, note) => sum + Number(note.minutes || 0), 0);
    const totalPages = notes.reduce((sum, note) => sum + Number(note.pages || 0), 0);
    const lastDateLabel = notes[0] ? formatDate(notes[0].date) : "記録なし";
    const genreInfo = getGenreInfo(book.genre);

    const card = document.createElement("article");
    card.className = `book-card ${book.status === "completed" ? "completed-card" : ""} ${book.status === "dropped" ? "dropped-card" : ""}`;
    card.innerHTML = `
      <div class="book-card-top">
        <img class="genre-cover" src="${genreInfo.image}" alt="${genreInfo.label}">
        <div class="book-card-main">
          <h3>${escapeHtml(book.title)}</h3>
          ${book.author ? `<p class="meta">${escapeHtml(book.author)}</p>` : ""}
          <p class="meta">ジャンル：${genreInfo.label}</p>
          ${book.status ? `<p class="meta">ステータス：${statusBadgeHtml(book.status)}</p>` : ""}
          ${renderStars(book)}
          ${tagListHtml(book.tags)}
          ${book.aiSummary ? `<p class="meta">AI総合感想：作成済み</p>` : ""}
          <p class="meta">合計 ${totalMinutes}分 / ${totalPages}ページ / 感想 ${notes.length}件</p>
          <p class="meta">最終記録日：${lastDateLabel}</p>
        </div>
      </div>
      <div class="card-actions">
        <button class="secondary-button" data-open-book="${book.id}" type="button">開く</button>
        <button class="secondary-button" data-edit-book="${book.id}" type="button">編集</button>
        <button class="danger-button" data-delete-book="${book.id}" type="button">削除</button>
      </div>
    `;

    card.querySelector("[data-open-book]").addEventListener("click", () => {
      state.detailBookId = book.id;
      renderDetail();
      setView("detail");
    });
    card.querySelector("[data-edit-book]").addEventListener("click", () => openEditBookModal(book.id));
    card.querySelector("[data-delete-book]").addEventListener("click", () => deleteBook(book.id));
    bindRatingButtons(card);
    els.bookList.append(card);
  }
}

function renderDetail() {
  const book = state.data.books.find(item => item.id === state.detailBookId);
  if (!book) {
    setView("bookshelf");
    return;
  }

  const notes = notesForBook(book.id);
  const totalMinutes = notes.reduce((sum, note) => sum + Number(note.minutes || 0), 0);
  const totalPages = notes.reduce((sum, note) => sum + Number(note.pages || 0), 0);
  const genreInfo = getGenreInfo(book.genre);

  els.detailTitle.textContent = book.title;
  els.detailAuthor.textContent = book.author || "";
  els.detailGenre.textContent = `ジャンル：${genreInfo.label}`;
  renderStatusControls(book);
  renderTagControls(book);
  els.detailGenreImage.src = genreInfo.image;
  els.detailGenreImage.alt = genreInfo.label;
  els.detailRating.innerHTML = renderStars(book);
  bindRatingButtons(els.detailRating);
  els.detailTotalMinutes.textContent = totalMinutes;
  els.detailTotalPages.textContent = totalPages;
  els.detailNoteCount.textContent = notes.length;

  if (book.aiSummary) {
    setAiSummaryStatus(book.aiSummary, "content");
    els.aiSummaryUpdatedAt.textContent = book.aiSummaryUpdatedAt ? `最終生成：${formatDate(book.aiSummaryUpdatedAt)}` : "";
  } else {
    setAiSummaryStatus("まだAI総合感想はありません。", "muted");
    els.aiSummaryUpdatedAt.textContent = "";
  }
  els.generateAiSummaryButton.disabled = notes.length === 0;

  els.noteList.innerHTML = "";
  if (notes.length === 0) {
    els.noteList.innerHTML = `<article class="note-card"><h3>感想はまだありません</h3><p class="meta">読書後に感想を保存するとここに表示されます。</p></article>`;
    return;
  }

  for (const note of notes) {
    const card = document.createElement("article");
    card.className = "note-card";
    card.innerHTML = `
      <h3>${formatDate(note.date)}</h3>
      <p class="meta">${Number(note.minutes || 0)}分 / ${Number(note.pages || 0)}ページ</p>
      <p class="note-body">${escapeHtml(note.memo)}</p>
      ${note.summary ? `<div class="summary-box">${escapeHtml(note.summary)}</div>` : ""}
      <div class="note-actions">
        <button class="secondary-button" data-edit-note="${note.id}" type="button">編集</button>
        <button class="danger-button" data-delete-note="${note.id}" type="button">削除</button>
      </div>
    `;
    els.noteList.append(card);
  }

  els.noteList.querySelectorAll("[data-edit-note]").forEach(button => {
    button.addEventListener("click", () => openEditNoteModal(button.getAttribute("data-edit-note")));
  });
  els.noteList.querySelectorAll("[data-delete-note]").forEach(button => {
    button.addEventListener("click", () => deleteNote(button.getAttribute("data-delete-note")));
  });
}

function buildAiSummaryPayload(book, notes) {
  const genreInfo = getGenreInfo(book.genre);

  return {
    title: book.title,
    author: book.author || "",
    genre: genreInfo.label,
    status: STATUS_MASTER[book.status]?.label || "",
    tags: Array.isArray(book.tags) ? book.tags : [],
    rating: Number(book.rating || 0),
    totalMinutes: notes.reduce((sum, note) => sum + Number(note.minutes || 0), 0),
    totalPages: notes.reduce((sum, note) => sum + Number(note.pages || 0), 0),
    notes: notes.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).map(note => ({
      date: formatDate(note.date),
      minutes: Number(note.minutes || 0),
      pages: Number(note.pages || 0),
      memo: note.memo || "",
      summary: note.summary || ""
    }))
  };
}

function setAiSummaryStatus(message, mode = "muted") {
  els.aiSummaryBox.textContent = message;
  els.aiSummaryBox.classList.toggle("loading", mode === "loading");
  els.aiSummaryBox.classList.toggle("has-content", mode === "content");
  els.aiSummaryBox.classList.toggle("muted", mode === "muted");
}

async function generateAiSummary() {
  const book = state.data.books.find(item => item.id === state.detailBookId);
  if (!book) return;

  const notes = notesForBook(book.id);
  if (notes.length === 0) {
    alert("感想ログがまだありません。先に感想を保存してください。");
    return;
  }

  if (!AI_SUMMARY_ENDPOINT) {
    alert("AI_SUMMARY_ENDPOINT が未設定です。Cloudflare WorkersのURLを app.js に設定してください。");
    return;
  }

  els.generateAiSummaryButton.disabled = true;
  els.generateAiSummaryButton.textContent = "生成中";
  setAiSummaryStatus("クーが全感想を統合中です。しばらくお待ちください。", "loading");

  try {
    const response = await fetch(AI_SUMMARY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildAiSummaryPayload(book, notes))
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(result.error || `AI生成に失敗しました。status: ${response.status}`);

    const summary = String(result.summary || "").trim();
    if (!summary) throw new Error("AIから空の結果が返りました。");

    book.aiSummary = summary;
    book.aiSummaryUpdatedAt = new Date().toISOString();
    saveData();
    renderDetail();
    renderBookshelf();
  } catch (error) {
    console.error(error);
    setAiSummaryStatus(`生成に失敗しました。\n${error.message || "時間を置いて再試行してください。"}`, "muted");
  } finally {
    els.generateAiSummaryButton.disabled = false;
    els.generateAiSummaryButton.textContent = "AIで生成";
  }
}


async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return;

  try {
    state.wakeLock = await navigator.wakeLock.request("screen");
    state.wakeLock.addEventListener("release", () => {
      state.wakeLock = null;
    });
  } catch (error) {
    console.warn("Wake Lock request failed:", error);
  }
}

async function releaseWakeLock() {
  if (!state.wakeLock) return;

  try {
    await state.wakeLock.release();
  } catch (error) {
    console.warn("Wake Lock release failed:", error);
  } finally {
    state.wakeLock = null;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.timerState === "reading") {
    updateElapsedFromClock();
    renderTimer();
    requestWakeLock();
  }
});


function startReading() {
  if (!selectedBook()) {
    alert("先に本を追加してください。");
    return;
  }

  state.elapsedSeconds = 0;
  state.timerStartedAt = Date.now();
  setTimerState("reading");
  requestWakeLock();

  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    updateElapsedFromClock();
    renderTimer();
  }, 1000);
}

function finishReading() {
  updateElapsedFromClock();
  clearInterval(state.timerId);
  state.timerId = null;
  state.timerStartedAt = null;
  releaseWakeLock();
  els.dateInput.value = todayInputValue();
  setTimerState("recording");
}

function cancelReading() {
  if (!confirm("今回のタイマーを中止しますか？")) return;
  resetTimer();
}

function resetTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.timerStartedAt = null;
  releaseWakeLock();
  state.elapsedSeconds = 0;
  els.dateInput.value = "";
  els.pagesInput.value = "";
  els.memoInput.value = "";
  setTimerState("waiting");
}

function saveNote() {
  const book = selectedBook();
  if (!book) return;

  const memo = els.memoInput.value.trim();
  if (!memo) {
    alert("感想を入力してください。");
    return;
  }

  state.data.notes.unshift({
    id: createId(),
    bookId: book.id,
    minutes: readingMinutes(),
    pages: Number(els.pagesInput.value || 0),
    memo,
    summary: "",
    date: inputDateToISO(els.dateInput.value)
  });

  saveData();
  resetTimer();
  setView("bookshelf");
}

function openAddBookModal() {
  state.editingBookId = null;
  state.tempBookRating = 0;
  els.bookModalTitle.textContent = "本を追加";
  els.bookTitleInput.value = "";
  els.bookAuthorInput.value = "";
  els.bookGenreInput.value = "mystery";
  renderRatingInput(state.tempBookRating);
  els.bookModal.showModal();
}

function openEditBookModal(bookId) {
  const book = state.data.books.find(item => item.id === bookId);
  if (!book) return;

  state.editingBookId = bookId;
  state.tempBookRating = Number(book.rating || 0);
  els.bookModalTitle.textContent = "本を編集";
  els.bookTitleInput.value = book.title;
  els.bookAuthorInput.value = book.author || "";
  els.bookGenreInput.value = GENRE_MASTER[book.genre] ? book.genre : "mystery";
  renderRatingInput(state.tempBookRating);
  els.bookModal.showModal();
}

function saveBook() {
  const title = els.bookTitleInput.value.trim();
  const author = els.bookAuthorInput.value.trim();
  const genre = els.bookGenreInput.value;

  if (!title) {
    alert("タイトルを入力してください。");
    return;
  }

  if (state.editingBookId) {
    const book = state.data.books.find(item => item.id === state.editingBookId);
    if (!book) return;
    book.title = title;
    book.author = author;
    book.genre = GENRE_MASTER[genre] ? genre : "mystery";
    book.rating = Math.max(0, Math.min(5, Number(state.tempBookRating || 0)));
  } else {
    const book = {
      id: createId(),
      title,
      author,
      genre: GENRE_MASTER[genre] ? genre : "mystery",
      rating: Math.max(0, Math.min(5, Number(state.tempBookRating || 0))),
      status: "",
      statusUpdatedAt: "",
      tags: [],
      aiSummary: "",
      aiSummaryUpdatedAt: "",
      createdAt: new Date().toISOString(),
      isFinished: false
    };
    state.data.books.unshift(book);
    state.selectedBookId = book.id;
  }

  state.editingBookId = null;
  state.tempBookRating = 0;
  saveData();
  els.bookTitleInput.value = "";
  els.bookAuthorInput.value = "";
  els.bookModal.close();
  render();
}

function deleteBook(bookId) {
  const book = state.data.books.find(item => item.id === bookId);
  if (!book) return;

  if (!confirm(`「${book.title}」と、その感想ログをすべて削除しますか？`)) return;

  state.data.books = state.data.books.filter(item => item.id !== bookId);
  state.data.notes = state.data.notes.filter(note => note.bookId !== bookId);

  if (state.selectedBookId === bookId) state.selectedBookId = state.data.books[0]?.id ?? null;
  if (state.detailBookId === bookId) {
    state.detailBookId = null;
    setView("bookshelf");
  }

  saveData();
  render();
}

function openEditNoteModal(noteId) {
  const note = state.data.notes.find(item => item.id === noteId);
  if (!note) return;

  state.editingNoteId = noteId;
  els.editNoteDateInput.value = isoToInputDate(note.date);
  els.editNotePagesInput.value = Number(note.pages || 0);
  els.editNoteMemoInput.value = note.memo || "";
  els.editNoteSummaryInput.value = note.summary || "";
  els.noteModal.showModal();
}

function saveEditedNote() {
  const note = state.data.notes.find(item => item.id === state.editingNoteId);
  if (!note) return;

  const memo = els.editNoteMemoInput.value.trim();
  if (!memo) {
    alert("感想を入力してください。");
    return;
  }

  note.date = inputDateToISO(els.editNoteDateInput.value);
  note.pages = Number(els.editNotePagesInput.value || 0);
  note.memo = memo;
  note.summary = els.editNoteSummaryInput.value.trim();

  state.editingNoteId = null;
  saveData();
  els.noteModal.close();
  render();
}

function deleteNote(noteId) {
  if (!confirm("この感想ログを削除しますか？")) return;
  state.data.notes = state.data.notes.filter(item => item.id !== noteId);
  saveData();
  render();
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kuu-reading-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.books) || !Array.isArray(imported.notes)) {
        alert("バックアップ形式が違います。");
        return;
      }
      if (!confirm("現在のデータをバックアップ内容で置き換えますか？")) return;

      state.data = imported;
      normalizeData();
      state.selectedBookId = state.data.books[0]?.id ?? null;
      state.detailBookId = null;
      saveData();
      render();
      setView("bookshelf");
    } catch {
      alert("読み込みに失敗しました。");
    }
  };
  reader.readAsText(file);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindEvents() {
  els.timerTab.addEventListener("click", () => setView("timer"));
  els.bookshelfTab.addEventListener("click", () => setView("bookshelf"));
  els.bookSelect.addEventListener("change", event => { state.selectedBookId = event.target.value; });
  els.startButton.addEventListener("click", startReading);
  els.finishButton.addEventListener("click", finishReading);
  els.cancelButton.addEventListener("click", cancelReading);
  els.saveNoteButton.addEventListener("click", saveNote);
  els.recordCompletedButton.addEventListener("click", () => setSelectedBookStatus("completed"));
  els.recordDroppedButton.addEventListener("click", () => setSelectedBookStatus("dropped"));

  els.openAddBookModalButton.addEventListener("click", openAddBookModal);
  els.closeBookModalButton.addEventListener("click", () => {
    state.editingBookId = null;
    state.tempBookRating = 0;
    els.bookModal.close();
  });
  els.saveBookButton.addEventListener("click", saveBook);

  els.closeNoteModalButton.addEventListener("click", () => {
    state.editingNoteId = null;
    els.noteModal.close();
  });
  els.saveEditedNoteButton.addEventListener("click", saveEditedNote);

  els.backToBookshelfButton.addEventListener("click", () => setView("bookshelf"));
  els.markCompletedButton.addEventListener("click", () => setBookStatus("completed"));
  els.markDroppedButton.addEventListener("click", () => setBookStatus("dropped"));
  els.generateAiSummaryButton.addEventListener("click", generateAiSummary);
  els.exportButton.addEventListener("click", exportBackup);
  els.importButton.addEventListener("click", () => els.importFileInput.click());
  els.importFileInput.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (file) importBackup(file);
    event.target.value = "";
  });

  els.installHelpButton.addEventListener("click", () => els.installHelpModal.showModal());
  els.closeInstallHelpButton.addEventListener("click", () => els.installHelpModal.close());
}

window.addEventListener("pagehide", () => {
  releaseWakeLock();
});

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.warn("Service Worker registration failed:", error);
    });
  }
}

loadData();
bindEvents();

if (!state.selectedBookId && state.data.books.length > 0) {
  state.selectedBookId = state.data.books[0].id;
}

render();
registerServiceWorker();
