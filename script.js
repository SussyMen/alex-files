// ВСТАВЬ СВОИ ДАННЫЕ СЮДА
const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';

// Создаем клиент (библиотека Supabase экспортирует объект createClient)
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isAdmin = false;
const ADMIN_PASSWORD = "1234";

const gallery = document.getElementById('gallery');

// Привязываем кнопки к функциям через JS
document.getElementById('adminBtn').onclick = toggleAdminPanel;
document.getElementById('loginBtn').onclick = checkPassword;
document.getElementById('uploadBtn').onclick = uploadPhoto;

// Загрузка фото
async function uploadPhoto() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    if (!file) return alert("Выбери файл!");

    const uploadBtn = document.getElementById('uploadBtn');
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
        alert("Ошибка: " + error.message);
    } finally {
        uploadBtn.innerText = "Загрузить в облако";
        uploadBtn.disabled = false;
    }
}

// Отображение галереи
async function loadGallery() {
    gallery.innerHTML = '<p>Загрузка файлов...</p>';
    
    try {
        const { data, error } = await supabase.storage.from('photos').list();
        if (error) throw error;

        gallery.innerHTML = '';
        if (data.length === 0) {
            gallery.innerHTML = '<p>Тут пока пусто</p>';
        }

        data.forEach(file => {
            const { data: urlData } = supabase.storage.from('photos').getPublicUrl(file.name);
            renderPhoto(urlData.publicUrl, file.name);
        });
    } catch (error) {
        gallery.innerHTML = "Ошибка связи с базой";
        console.error(error);
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

// Удаление (сделаем глобальной для кнопок в карточках)
window.deletePhoto = async function(fileName) {
    if (!confirm("Удалить фото?")) return;
    const { error } = await supabase.storage.from('photos').remove([fileName]);
    if (error) alert("Ошибка удаления");
    else loadGallery();
};

function checkPassword() {
    const pass = document.getElementById('adminPass').value;
    if (pass === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('adminStatus').style.display = 'inline';
        document.getElementById('passwordPanel').classList.add('hidden');
        loadGallery();
    } else {
        alert("Неверно!");
    }
}

function toggleAdminPanel() {
    const panel = document.getElementById('passwordPanel');
    panel.classList.toggle('hidden');
}

window.openFullScreen = function(src) {
    document.getElementById('fullScreenImg').src = src;
    document.getElementById('fullScreenModal').style.display = 'flex';
};

window.closeFullScreen = function() {
    document.getElementById('fullScreenModal').style.display = 'none';
};

// Загрузка при старте
loadGallery();
