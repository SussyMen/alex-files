// ВСТАВЬ СВОИ ДАННЫЕ СЮДА
const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';

// 1. Проверка загрузки библиотеки
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Supabase подключен");
} catch (e) {
    alert("Критическая ошибка: библиотека Supabase не загружена!");
}

let isAdmin = false;
const ADMIN_PASSWORD = "1234";

// Элементы
const gallery = document.getElementById('gallery');
const adminBtn = document.getElementById('adminBtn');
const loginBtn = document.getElementById('loginBtn');
const uploadBtn = document.getElementById('uploadBtn');

// Назначаем события
if(adminBtn) adminBtn.onclick = toggleAdminPanel;
if(loginBtn) loginBtn.onclick = checkPassword;
if(uploadBtn) uploadBtn.onclick = uploadPhoto;

// ФУНКЦИЯ ЗАГРУЗКИ
async function uploadPhoto() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    if (!file) return alert("Выбери файл!");

    uploadBtn.innerText = "Загрузка...";
    uploadBtn.disabled = true;

    const fileName = `${Date.now()}_${file.name}`;
    
    try {
        const { data, error } = await supabase.storage
            .from('photos')
            .upload(fileName, file);

        if (error) throw error;

        alert("Успешно загружено!");
        fileInput.value = "";
        loadGallery();
    } catch (error) {
        alert("Ошибка Supabase: " + error.message);
        console.error(error);
    } finally {
        uploadBtn.innerText = "Загрузить в облако";
        uploadBtn.disabled = false;
    }
}

// ФУНКЦИЯ ГАЛЕРЕИ
async function loadGallery() {
    gallery.innerHTML = '<p>Загрузка...</p>';
    try {
        const { data, error } = await supabase.storage.from('photos').list();
        if (error) throw error;

        gallery.innerHTML = '';
        if (!data || data.length === 0) {
            gallery.innerHTML = '<p>Тут пока пусто. Загрузи первое фото!</p>';
            return;
        }

        data.forEach(file => {
            const { data: urlData } = supabase.storage.from('photos').getPublicUrl(file.name);
            renderPhoto(urlData.publicUrl, file.name);
        });
    } catch (error) {
        alert("Ошибка галереи: " + error.message);
    }
}

function renderPhoto(url, fileName) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
        <img src="${url}" onclick="openFullScreen('${url}')">
        ${isAdmin ? `<button class="delete-btn" style="display:block;" onclick="deletePhoto('${fileName}')">❌</button>` : ''}
    `;
    gallery.appendChild(card);
}

// Удаление
window.deletePhoto = async function(fileName) {
    if (!confirm("Удалить фото?")) return;
    const { error } = await supabase.storage.from('photos').remove([fileName]);
    if (error) alert("Ошибка удаления");
    else loadGallery();
};

// Админка
function checkPassword() {
    const pass = document.getElementById('adminPass').value;
    if (pass === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('adminStatus').style.display = 'inline';
        document.getElementById('passwordPanel').classList.add('hidden');
        loadGallery();
    } else {
        alert("Неверный пароль!");
    }
}

function toggleAdminPanel() {
    document.getElementById('passwordPanel').classList.toggle('hidden');
}

window.openFullScreen = (src) => {
    document.getElementById('fullScreenImg').src = src;
    document.getElementById('fullScreenModal').style.display = 'flex';
};

window.closeFullScreen = () => {
    document.getElementById('fullScreenModal').style.display = 'none';
};

// Запуск
loadGallery();
