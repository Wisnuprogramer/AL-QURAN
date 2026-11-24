
const API = "https://api.alquran.cloud/v1";

const juzList = document.getElementById("juzList");
const surahList = document.getElementById("surahList");
const quranContent = document.getElementById("quranContent");

const readerTitle = document.getElementById("readerTitle");
const readerSubtitle = document.getElementById("readerSubtitle");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");

let allSurahs = [];
let verses = [];
let currentPage = 1;
let arabicSize = 34;

const perPage = 20;

// FUNGSI MENGAMBIL DATA API
async function getData(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Server Al-Qur'an tidak merespons.");
    }

    const result = await response.json();

    if (result.code !== 200 || result.data == null) {
        throw new Error("Data Al-Qur'an tidak ditemukan.");
    }

    return result.data;
}

// MEMBUAT TOMBOL JUZ 1-30
function createJuz() {
    juzList.innerHTML = "";

    for (let i = 1; i <= 30; i++) {
        const button = document.createElement("button");

        button.className = "juz-btn";
        button.textContent = "Juz " + i;

        button.onclick = () => loadJuz(i);

        juzList.appendChild(button);
    }
}

// MEMUAT DAFTAR 114 SURAH
async function loadSurahList() {
    const data = await getData(`${API}/surah`);

    if (!Array.isArray(data)) {
        throw new Error("Daftar surah tidak berbentuk array.");
    }

    allSurahs = data;
    surahList.innerHTML = "";

    allSurahs.forEach(surah => {
        const button = document.createElement("button");

        button.className = "surah-btn";

        button.textContent =
            surah.number + ". " +
            surah.englishName +
            " — " + surah.name;

        button.onclick = () => loadSurah(surah.number);

        surahList.appendChild(button);
    });
}

// MENGGABUNGKAN ARAB, LATIN, DAN TERJEMAHAN
function combineEditions(data) {
    if (!Array.isArray(data) || data.length !== 3) {
        throw new Error("Data edisi Al-Qur'an tidak lengkap.");
    }

    const arab = data[0].ayahs;
    const translation = data[1].ayahs;
    const latin = data[2].ayahs;

    if (
        !Array.isArray(arab) ||
        !Array.isArray(translation) ||
        !Array.isArray(latin) ||
        arab.length !== translation.length ||
        arab.length !== latin.length
    ) {
        throw new Error("Format ayat tidak sesuai.");
    }

    return arab.map((ayah, index) => ({
        arab: ayah.text,
        latin: latin[index].text,
        translation: translation[index].text,
        number: ayah.numberInSurah,
        surah: ayah.surah,
        juz: ayah.juz
    }));
}

// MEMILIH SURAH
async function loadSurah(number) {
    showLoading();

    try {
        const data = await getData(
            `${API}/surah/${number}/editions/quran-uthmani,id.indonesian,en.transliteration`
        );

        verses = combineEditions(data);
        currentPage = 1;

        const surah = data[0];

        readerTitle.textContent =
            "Surah " + surah.name;

        readerSubtitle.textContent =
            surah.englishName + " • " +
            surah.numberOfAyahs + " Ayat";

        updateActiveSurah(number);
        updateActiveJuz(null);

        renderVerses();

    } catch (error) {
        showError(error);
    }
}

// MEMILIH JUZ
async function loadJuz(number) {
    showLoading();

    try {
        const editions = await Promise.all([
            getData(`${API}/juz/${number}/quran-uthmani`),
            getData(`${API}/juz/${number}/id.indonesian`),
            getData(`${API}/juz/${number}/en.transliteration`)
        ]);

        // API Juz mengembalikan satu objek per edisi
        verses = combineEditions(editions);
        currentPage = 1;

        readerTitle.textContent = "Al-Qur'an Juz " + number;
        readerSubtitle.textContent = verses.length + " Ayat";

        updateActiveJuz(number);
        updateActiveSurah(null);

        renderVerses();

    } catch (error) {
        showError(error);
    }
}

// TAMPILKAN LOADING
function showLoading() {
    loading.hidden = false;
    errorMessage.hidden = true;

    loading.textContent = "Memuat ayat Al-Qur'an...";
    quranContent.innerHTML = "";

    readerSubtitle.textContent = "Mohon tunggu...";
}

// TAMPILKAN ERROR
function showError(error) {
    loading.hidden = true;
    errorMessage.hidden = false;

    errorMessage.textContent =
        "Ayat belum bisa dimuat: " + error.message +
        " Silakan periksa internet dan coba kembali.";

    quranContent.innerHTML = "";
}

// TOMBOL JUZ AKTIF
function updateActiveJuz(number) {
    document.querySelectorAll(".juz-btn").forEach((button, index) => {
        button.classList.toggle(
            "active",
            index + 1 === number
        );
    });
}

// TOMBOL SURAH AKTIF
function updateActiveSurah(number) {
    document.querySelectorAll(".surah-btn").forEach((button, index) => {
        button.classList.toggle(
            "active",
            allSurahs[index]?.number === number
        );
    });
}

// MENAMPILKAN AYAT
function renderVerses() {
    loading.hidden = true;
    errorMessage.hidden = true;

    quranContent.innerHTML = "";

    // PENGAMAN: PASTIKAN DATA BERUPA ARRAY
    if (!Array.isArray(verses)) {
        showError(new Error("Data ayat tidak valid."));
        return;
    }

    const start = (currentPage - 1) * perPage;

    const pageVerses = verses.slice(
        start,
        start + perPage
    );

    if (pageVerses.length === 0) {
        quranContent.textContent = "Ayat tidak ditemukan.";
        updatePagination();
        return;
    }

    let previousSurah = null;

    pageVerses.forEach(verse => {

        // JUDUL SURAH
        if (previousSurah !== verse.surah.number) {
            const heading = document.createElement("div");
            heading.className = "surah-heading";

            const title = document.createElement("h3");
            title.textContent = verse.surah.englishName;

            const name = document.createElement("p");
            name.textContent = verse.surah.name;

            const arabicName = document.createElement("p");
            arabicName.className = "arabic";
            arabicName.style.textAlign = "center";
            arabicName.textContent = verse.surah.name;

            heading.append(title, name, arabicName);
            quranContent.appendChild(heading);

            previousSurah = verse.surah.number;
        }

        // KARTU AYAT
        const card = document.createElement("div");
        card.className = "verse-card";

        const number = document.createElement("span");
        number.className = "verse-number";
        number.textContent = verse.number;

        const arabic = document.createElement("p");
        arabic.className = "arabic";
        arabic.style.fontSize = arabicSize + "px";
        arabic.textContent = verse.arab;

        const latin = document.createElement("p");
        latin.className = "latin";
        latin.textContent = verse.latin;

        const translation = document.createElement("p");
        translation.className = "translation";
        translation.textContent = verse.translation;

        card.append(number, arabic, latin, translation);

        quranContent.appendChild(card);
    });

    updatePagination();
}

// PENCARIAN SURAH
document.getElementById("surahSearch").addEventListener("input", function() {
    const keyword = this.value.toLowerCase();

    document.querySelectorAll(".surah-btn").forEach(button => {
        button.hidden =
            !button.textContent.toLowerCase().includes(keyword);
    });
});

// PAGINATION
function updatePagination() {
    const totalPages = Math.max(
        1,
        Math.ceil(verses.length / perPage)
    );

    document.getElementById("pageInfo").textContent =
        `Halaman ${currentPage} dari ${totalPages}`;

    document.getElementById("prevButton").disabled =
        currentPage <= 1;

    document.getElementById("nextButton").disabled =
        currentPage >= totalPages;
}

document.getElementById("prevButton").onclick = () => {
    if (currentPage > 1) {
        currentPage--;
        renderVerses();
    }
};

document.getElementById("nextButton").onclick = () => {
    const totalPages = Math.ceil(verses.length / perPage);

    if (currentPage < totalPages) {
        currentPage++;
        renderVerses();
    }
};

// PERBESAR TULISAN ARAB
document.getElementById("fontButton").onclick = () => {
    arabicSize += 4;

    if (arabicSize > 54) {
        arabicSize = 26;
    }

    document.querySelectorAll(".arabic").forEach(element => {
        element.style.fontSize = arabicSize + "px";
    });
};

// MULAI WEBSITE
async function startWebsite() {
    createJuz();

    try {
        await loadSurahList();

        // LANGSUNG BUKA AL-FATIHAH
        await loadSurah(1);

    } catch (error) {
        showError(error);
    }
}

startWebsite();
