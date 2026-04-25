// --- НАСТРОЙКИ ---
const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';

// Проверка загрузки библиотеки
let supabaseClient;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Supabase готов!");
} catch (e) {
    alert("Ошибка: библиотека Supabase не загружена. Проверь интернет.");
}

window.isAdmin = false;
const ADMIN_PASSWORD = "1234";

// --- ФУНКЦИИ ИНТЕРФЕЙСА ---

window.toggleAdminPanel = function() {
    const panel = document.getElementById('passwordPanel');
    panel.classList.toggle('hidden');
};

window.checkPassword = function() {
    const pass = document.getElementById('adminPass').value;
    if (pass === ADMIN_PASSWORD) {
        window.isAdmin = true;
        document.getElementById('adminStatus').style.display = 'inline';
        document.getElementById('passwordPanel').classList.add('hidden');
        alert("Режим админа включен!");
        loadGallery();
    } else {
        alert("Неверный пароль!");
    }
};

// --- РАБОТА С ФАЙЛАМИ ---

window.uploadPhoto = async function() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    const btn = document.getElementById('uploadBtn');

    if (!file) return alert("Сначала выбери файл!");

    btn.disabled = true;
    btn.innerText = "Загрузка...";

    const fileName = Date.now() + "_" + file.name;

    try {
        const { data, error } = await supabaseClient.storage
            .from('photos')
            .upload(fileName, file);

        if (error) throw error;

        alert("Готово! Фото в облаке.");
        fileInput.value = ""; // Очистить поле выбора
        loadGallery();
    } catch (err) {
        alert("Ошибка загрузки: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Загрузить фото";
    }
};

async function loadGallery() {
    const gallery = document.getElementById('gallery');
    const status = document.getElementById('status');
    
    status.innerText = "Синхронизация с облаком...";

    try {
        const { data, error } = await supabaseClient.storage.from('photos').list();

        if (error) throw error;

        gallery.innerHTML = "";
        
        if (data.length === 0) {
            status.innerText = "Галерея пуста";
            return;
        }

        data.forEach(file => {
            const { data: urlData } = supabaseClient.storage.from('photos').getPublicUrl(file.name);
            
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.innerHTML = `
                <img src="${urlData.publicUrl}" onclick="window.openFullScreen('${urlData.publicUrl}')">
                ${window.isAdmin ? `<button class="delete-btn" style="display:block;" onclick="window.deletePhoto('${file.name}')">❌</button>` : ''}
            `;
            gallery.appendChild(card);
        });
        status.innerText = "";
    } catch (err) {
        status.innerText = "Ошибка галереи: " + err.message;
    }
}

window.deletePhoto = async function(name) {
    if (!confirm("Удалить этот файл навсегда?")) return;

    try {
        const { error } = await supabaseClient.storage.from('photos').remove([name]);
        if (error) throw error;
        loadGallery();
    } catch (err) {
        alert("Не удалось удалить: " + err.message);
    }
};

// --- МОДАЛЬНОЕ ОКНО ---

window.openFullScreen = function(src) {
    document.getElementById('fullScreenImg').src = src;
    document.getElementById('fullScreenModal').style.display = 'flex';
};

window.closeFullScreen = function() {
    document.getElementById('fullScreenModal').style.display = 'none';
};

// Запуск при открытии сайта
loadGallery();
