// Тест загрузки - удали, когда увидишь окно
alert("Проверка: Скрипт запустился!");

const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';

// Инициализация
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Глобальные функции (чтобы HTML их точно видел)
window.toggleAdminPanel = function() {
    console.log("Нажата кнопка админки");
    const panel = document.getElementById('passwordPanel');
    panel.classList.toggle('hidden');
};

window.checkPassword = function() {
    const pass = document.getElementById('adminPass').value;
    if (pass === "1234") {
        window.isAdmin = true;
        document.getElementById('adminStatus').style.display = 'inline';
        document.getElementById('passwordPanel').classList.add('hidden');
        alert("Доступ разрешен!");
        loadGallery();
    } else {
        alert("Неверный пароль");
    }
};

window.uploadPhoto = async function() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    if (!file) return alert("Файл не выбран!");

    const btn = document.getElementById('uploadBtn');
    btn.innerText = "Загружаем...";

    const fileName = Date.now() + "_" + file.name;

    const { data, error } = await supabaseClient.storage
        .from('photos')
        .upload(fileName, file);

    if (error) {
        alert("Ошибка Supabase: " + error.message);
    } else {
        alert("Фото успешно улетело в облако!");
        loadGallery();
    }
    btn.innerText = "Загрузить в облако";
};

async function loadGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = "Загрузка фото из базы...";

    const { data, error } = await supabaseClient.storage.from('photos').list();

    if (error) {
        alert("Ошибка списка: " + error.message);
        return;
    }

    gallery.innerHTML = "";
    data.forEach(file => {
        const { data: urlData } = supabaseClient.storage.from('photos').getPublicUrl(file.name);
        const imgCard = document.createElement('div');
        imgCard.className = 'photo-card';
        imgCard.innerHTML = `
            <img src="${urlData.publicUrl}" onclick="window.openFullScreen('${urlData.publicUrl}')">
            ${window.isAdmin ? `<button onclick="deletePhoto('${file.name}')" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; border-radius:5px; cursor:pointer;">❌</button>` : ''}
        `;
        gallery.appendChild(imgCard);
    });
}

window.deletePhoto = async function(name) {
    if(!confirm("Удалить?")) return;
    await supabaseClient.storage.from('photos').remove([name]);
    loadGallery();
};

window.openFullScreen = (src) => {
    document.getElementById('fullScreenImg').src = src;
    document.getElementById('fullScreenModal').style.display = 'flex';
};

window.closeFullScreen = () => {
    document.getElementById('fullScreenModal').style.display = 'none';
};

// Запуск при старте
loadGallery();
