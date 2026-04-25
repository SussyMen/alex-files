// ВСТАВЬ СВОИ ДАННЫЕ СЮДА
const SUPABASE_URL = 'ТВОЙ_PROJECT_URL';
const SUPABASE_KEY = 'ТВОЙ_ANON_KEY';

const supabase = libSupabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isAdmin = false;
const ADMIN_PASSWORD = "1234"; // Твой пароль для удаления

const gallery = document.getElementById('gallery');

// 1. Загрузка фото
async function uploadPhoto() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    if (!file) return alert("Выбери файл!");

    const fileName = `${Date.now()}_${file.name}`;
    
    // Грузим файл в бакет 'photos'
    const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, file);

    if (error) {
        console.error(error);
        alert("Ошибка загрузки: " + error.message);
    } else {
        alert("Загружено!");
        fileInput.value = ""; // Очистить поле
        loadGallery();
    }
}

// 2. Отображение галереи
async function loadGallery() {
    gallery.innerHTML = 'Загрузка...';
    
    const { data, error } = await supabase.storage.from('photos').list();

    if (error) {
        gallery.innerHTML = "Ошибка загрузки списка";
        return;
    }

    gallery.innerHTML = '';
    data.forEach(file => {
        // Получаем публичную ссылку
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(file.name);
        renderPhoto(urlData.publicUrl, file.name);
    });
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

// 3. Удаление
async function deletePhoto(fileName) {
    if (!confirm("Удалить фото?")) return;
    
    const { error } = await supabase.storage.from('photos').remove([fileName]);
    
    if (error) alert("Ошибка удаления");
    else loadGallery();
}

// Функции интерфейса
function checkPassword() {
    if (document.getElementById('adminPass').value === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('adminStatus').style.display = 'inline';
        document.getElementById('passwordPanel').classList.add('hidden');
        loadGallery();
    } else {
        alert("Неверно!");
    }
}

function toggleAdminPanel() {
    document.getElementById('passwordPanel').classList.toggle('hidden');
}

function openFullScreen(src) {
    document.getElementById('fullScreenImg').src = src;
    document.getElementById('fullScreenModal').style.display = 'flex';
}

function closeFullScreen() {
    document.getElementById('fullScreenModal').style.display = 'none';
}

// Загрузить галерею при старте
loadGallery();
