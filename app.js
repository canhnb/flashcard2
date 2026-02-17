let words = [];
let currentIndex = 0;
let shuffled = [];

// Load saved words
if (localStorage.getItem("words")) {
    words = JSON.parse(localStorage.getItem("words"));
}
renderWordList();

// -------------------------
// HIỂN THỊ / ẨN CÁC PHẦN
// -------------------------
function showStudy() {
    document.getElementById("studySection").style.display = "block";
    document.getElementById("manageSection").style.display = "none";
}

function showManage() {
    document.getElementById("studySection").style.display = "none";
    document.getElementById("manageSection").style.display = "block";
}

// -------------------------
// QUẢN LÝ TỪ VỰNG
// -------------------------
function addWords() {
    const input = document.getElementById("wordInput").value.trim();
    if (!input) return;

    const newWords = input.split(",").map(w => w.trim()).filter(w => w !== "");
    words.push(...newWords);

    localStorage.setItem("words", JSON.stringify(words));
    renderWordList();

    document.getElementById("wordInput").value = "";
}

function renderWordList() {
    const ul = document.getElementById("wordList");
    ul.innerHTML = "";
    words.forEach(w => {
        const li = document.createElement("li");
        li.textContent = w;
        ul.appendChild(li);
    });
}

// -------------------------
// FLASHCARD
// -------------------------
function startFlashcard() {
    shuffled = [...words];
    shuffled.sort(() => Math.random() - 0.5);
    currentIndex = 0;
    showFront();
}

function showFront() {
    if (shuffled.length === 0) return;

    const front = document.getElementById("front");
    const back = document.getElementById("back");

    front.style.display = "block";
    back.style.display = "none";

    front.textContent = shuffled[currentIndex];

    // Auto-scale chữ
    autoScaleFrontText();
}

let showingBack = false;

async function flipCard() {
    const front = document.getElementById("front");
    const back = document.getElementById("back");

    // Nếu đang ở mặt sau → quay lại mặt trước
    if (showingBack) {
        back.style.display = "none";
        front.style.display = "block";
        showingBack = false;
        return;
    }

    // Nếu đang ở mặt trước → hiển thị mặt sau
    const word = shuffled[currentIndex];

    const meaning = await translate(word);
    const hira = await toHiragana(word);

    front.style.display = "none";
    back.style.display = "block";

    back.innerHTML = `
        <b>${word}</b><br><br>
        ${hira}<br><br>
        ${meaning}
    `;

    showingBack = true;
}

async function translate(text) {
    const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=vi&dt=t&q=" +
        encodeURIComponent(text);

    const res = await fetch(url);
    const data = await res.json();

    return data[0].map(x => x[0]).join("");
}

async function toHiragana(text) {
    const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=ja&dt=rm&q=" +
        encodeURIComponent(text);

    const res = await fetch(url);
    const data = await res.json();

    return data[0].map(x => x[3]).join("");
}

function nextCard() {
    currentIndex++;
    if (currentIndex >= shuffled.length) {
        alert("Hết từ rồi!");
        return;
    }
    showFront();
}

// Vuốt trái/phải
let startX = 0;

document.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    if (endX - startX > 50) nextCard();
    if (startX - endX > 50) nextCard();
});

// Phím ← →
document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") nextCard();
});

// Khởi động flashcard
startFlashcard();

async function renderWordList() {
    const ul = document.getElementById("wordList");
    ul.innerHTML = "";

    for (let i = 0; i < words.length; i++) {
        const w = words[i];

        // Tạo li
        const li = document.createElement("li");
        li.style.marginBottom = "8px";

        // Checkbox
        const check = `<input type="checkbox" class="wordCheck" data-index="${i}">`;

        // Lấy hiragana + nghĩa
        const hira = await toHiragana(w);
        const meaning = await translate(w);

        li.innerHTML = `
            ${check}
            <b>${w}</b>
            <br>
            <span style="color:#555;">${hira}</span>
            <br>
            <span style="color:#008000;">${meaning}</span>
        `;

        ul.appendChild(li);
    }
}

function toggleCheckAll() {
    const checked = document.getElementById("checkAll").checked;
    document.querySelectorAll(".wordCheck").forEach(c => c.checked = checked);
}

function deleteSelected() {
    const checks = document.querySelectorAll(".wordCheck:checked");

    if (checks.length === 0) {
        alert("Bạn chưa chọn từ nào để xóa.");
        return;
    }

    // Lấy index của các từ được chọn
    const indexesToDelete = Array.from(checks).map(c => Number(c.dataset.index));

    // Xóa từ cuối lên đầu để không bị lệch index
    indexesToDelete.sort((a, b) => b - a);

    indexesToDelete.forEach(i => {
        words.splice(i, 1);
    });

    // Lưu lại
    localStorage.setItem("words", JSON.stringify(words));

    // Cập nhật giao diện
    renderWordList();

    // Reset flashcard
    startFlashcard();
}

function enterFullscreen() {
    const elem = document.documentElement;

    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen(); // Safari
}

function autoScaleFrontText() {
    const front = document.getElementById("front");
    let size = 150; // font-size tối đa
    front.style.fontSize = size + "px";

    // Giảm dần cho đến khi vừa card
    while (front.scrollHeight > front.offsetHeight || front.scrollWidth > front.offsetWidth) {
        size -= 5;
        if (size < 40) break; // không nhỏ hơn 40px
        front.style.fontSize = size + "px";
    }
}
