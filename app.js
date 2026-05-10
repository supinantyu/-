const STORAGE_KEY = "kuuReadingTimerPwa.v2";

const IMAGE_PATHS = {
  waiting: ["./assets/kuu_waiting.png", "./kuu_waiting.png"],
  reading: ["./assets/kuu_reading.png", "./kuu_reading.png"],
  recording: ["./assets/kuu_recording.png", "./kuu_recording.png"]
};

const state = {
  data: { books: [], notes: [] },
  timerState: "waiting",
  selectedBookId: null,
  elapsedSeconds: 0,
  timerId: null,
  detailBookId: null,
  imageFallbackIndex: { waiting: 0, reading: 0, recording: 0 }
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
  pagesInput: document.querySelector("#pagesInput"),
  memoInput: document.querySelector("#memoInput"),
  summaryInput: document.querySelector("#summaryInput"),
  bookModal: document.querySelector("#bookModal"),
  openBookModalButton: document.querySelector("#openBookModalButton"),
  closeBookModalButton: document.querySelector("#closeBookModalButton"),
  addBookButton: document.querySelector("#addBookButton"),
  bookTitleInput: document.querySelector("#bookTitleInput"),
  bookAuthorInput: document.querySelector("#bookAuthorInput"),
  bookList: document.querySelector("#bookList"),
  noteList: document.querySelector("#noteList"),
  detailTitle: document.querySelector("#detailTitle"),
  detailAuthor: document.querySelector("#detailAuthor"),
  detailTotalMinutes: document.querySelector("#detailTotalMinutes"),
  detailTotalPages: document.querySelector("#detailTotalPages"),
  detailNoteCount: document.querySelector("#detailNoteCount"),
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

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.data = {
      books: [{
        id: createId(),
        title: "サンプル本",
        author: "クー",
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
  } catch {
    state.data = { books: [], notes: [] };
  }
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

function currentImagePath(kind) {
  return IMAGE_PATHS[kind][state.imageFallbackIndex[kind] || 0];
}

function renderKuu() {
  const config = stateConfig[state.timerState];
  els.kuuImage.style.opacity = "0.2";
  setTimeout(() => {
    els.kuuImage.src = currentImagePath(state.timerState);
    els.kuuImage.alt = config.alt;
    els.kuuImage.style.opacity = "1";
  }, 70);
  els.kuuMessage.textContent = config.message;
}

els.kuuImage.addEventListener("error", () => {
  const kind = state.timerState;
  const next = (state.imageFallbackIndex[kind] || 0) + 1;
  if (next < IMAGE_PATHS[kind].length) {
    state.imageFallbackIndex[kind] = next;
    els.kuuImage.src = currentImagePath(kind);
  } else {
    els.kuuImage.alt = "クー画像が読み込めませんでした";
  }
});

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

function renderTimer() {
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

    const card = document.createElement("article");
    card.className = "book-card";
    card.innerHTML = `
      <h3>${escapeHtml(book.title)}</h3>
      ${book.author ? `<p class="meta">${escapeHtml(book.author)}</p>` : ""}
      <p class="meta">合計 ${totalMinutes}分 / ${totalPages}ページ / 感想 ${notes.length}件</p>
    `;
    card.addEventListener("click", () => {
      state.detailBookId = book.id;
      renderDetail();
      setView("detail");
    });
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

  els.detailTitle.textContent = book.title;
  els.detailAuthor.textContent = book.author || "";
  els.detailTotalMinutes.textContent = totalMinutes;
  els.detailTotalPages.textContent = totalPages;
  els.detailNoteCount.textContent = notes.length;

  els.noteList.innerHTML = "";
  if (notes.length === 0) {
    els.noteList.innerHTML = `<article class="note-card"><h3>感想はまだありません</h3><p class="meta">読書後に感想を保存するとここに表示されます。</p></article>`;
    return;
  }

  for (const note of notes) {
    const date = new Date(note.date);
    const dateLabel = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
    const card = document.createElement("article");
    card.className = "note-card";
    card.innerHTML = `
      <h3>${dateLabel}</h3>
      <p class="meta">${Number(note.minutes || 0)}分 / ${Number(note.pages || 0)}ページ</p>
      <p class="note-body">${escapeHtml(note.memo)}</p>
      ${note.summary ? `<div class="summary-box">${escapeHtml(note.summary)}</div>` : ""}
      <button class="ghost-button full" data-delete-note="${note.id}" type="button">この感想を削除</button>
    `;
    els.noteList.append(card);
  }

  els.noteList.querySelectorAll("[data-delete-note]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-delete-note");
      if (!confirm("この感想を削除しますか？")) return;
      state.data.notes = state.data.notes.filter(note => note.id !== id);
      saveData();
      render();
    });
  });
}

function startReading() {
  if (!selectedBook()) {
    alert("先に本を追加してください。");
    return;
  }
  state.elapsedSeconds = 0;
  setTimerState("reading");
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.elapsedSeconds += 1;
    renderTimer();
  }, 1000);
}

function finishReading() {
  clearInterval(state.timerId);
  state.timerId = null;
  setTimerState("recording");
}

function cancelReading() {
  if (!confirm("今回のタイマーを中止しますか？")) return;
  resetTimer();
}

function resetTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.elapsedSeconds = 0;
  els.pagesInput.value = "";
  els.memoInput.value = "";
  els.summaryInput.value = "";
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
    summary: els.summaryInput.value.trim(),
    date: new Date().toISOString()
  });

  saveData();
  resetTimer();
  setView("bookshelf");
}

function addBook() {
  const title = els.bookTitleInput.value.trim();
  const author = els.bookAuthorInput.value.trim();

  if (!title) {
    alert("タイトルを入力してください。");
    return;
  }

  const book = { id: createId(), title, author, createdAt: new Date().toISOString(), isFinished: false };
  state.data.books.unshift(book);
  state.selectedBookId = book.id;
  saveData();

  els.bookTitleInput.value = "";
  els.bookAuthorInput.value = "";
  els.bookModal.close();
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

  els.openBookModalButton.addEventListener("click", () => els.bookModal.showModal());
  els.closeBookModalButton.addEventListener("click", () => els.bookModal.close());
  els.addBookButton.addEventListener("click", addBook);

  els.backToBookshelfButton.addEventListener("click", () => setView("bookshelf"));
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
