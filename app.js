let words = []; // mỗi phần tử là { word, hira, meaning }
let currentIndex = 0;
let shuffled = [];
let currentPage = 1;
const pageSize = 50;

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
async function addWords() {
    const input = document.getElementById("wordInput").value.trim();
    if (!input) return;

    const newWords = input.split(",").map(w => w.trim()).filter(w => w !== "");

    for (let w of newWords) {
        const hira = await toHiragana(w);
        const meaning = await translate(w);

        words.push({
            word: w,
            hira: hira,
            meaning: meaning
        });
    }

    localStorage.setItem("words", JSON.stringify(words));
    currentPage = 1;
    renderWordList();

    document.getElementById("wordInput").value = "";
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

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, words.length);

    for (let i = start; i < end; i++) {
        const item = words[i];


        const li = document.createElement("li");

        li.innerHTML = `
    <div class="word-row">
        <input type="checkbox" class="wordCheck" data-index="${i}">
        <span class="word-jp">${item.word}</span>
        <span class="word-hira">${item.hira}</span>
        <span class="word-vi">${item.meaning}</span>
    </div>
`;

        ul.appendChild(li);
    }

    renderPagination();
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
currentPage = 1;
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

function totalPages() {
    return Math.ceil(words.length / pageSize);
}

function renderPagination() {
    const div = document.getElementById("pagination");
    const total = totalPages();

    if (total <= 1) {
        div.innerHTML = "";
        return;
    }

    div.innerHTML = `
        <button onclick="prevPage()" ${currentPage === 1 ? "disabled" : ""}>Trang trước</button>
        <span style="margin: 0 10px;">Trang ${currentPage} / ${total}</span>
        <button onclick="nextPage()" ${currentPage === total ? "disabled" : ""}>Trang sau</button>
    `;
}


function nextPage() {
    if (currentPage < totalPages()) {
        currentPage++;
        renderWordList();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderWordList();
    }
}

function exportJSON() {
    const data = JSON.stringify(words, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcard-data.json";
    a.click();

    URL.revokeObjectURL(url);
}

function importJSON() {
    const file = document.getElementById("importFile").files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!Array.isArray(data)) {
                alert("File JSON không hợp lệ.");
                return;
            }

            words = data;
            localStorage.setItem("words", JSON.stringify(words));
            currentPage = 1;
            renderWordList();
            startFlashcard();

        } catch (err) {
            alert("Lỗi đọc file JSON.");
        }
    };

    reader.readAsText(file);
}

async function upgradeOldData() {
    let raw = JSON.parse(localStorage.getItem("words") || "[]");

    // Nếu dữ liệu cũ là mảng string
    if (raw.length > 0 && typeof raw[0] === "string") {
        const converted = [];

        for (let w of raw) {
            const hira = await toHiragana(w);
            const meaning = await translate(w);

            converted.push({
                word: w,
                hira: hira,
                meaning: meaning
            });
        }

        // Lưu lại dạng mới
        localStorage.setItem("words", JSON.stringify(converted));
        words = converted;

        alert("Đã chuyển dữ liệu cũ sang dạng mới!");
    } else {
        alert("Dữ liệu đã ở dạng mới, không cần chuyển.");
    }

    renderWordList();
    startFlashcard();
}


function exportLocalStorageToJSON() {
    const raw = localStorage.getItem("words");
    if (!raw) {
        alert("Không có dữ liệu để xuất.");
        return;
    }

    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcard-data.json";
    a.click();

    URL.revokeObjectURL(url);
localStorage.removeItem("words");
}
