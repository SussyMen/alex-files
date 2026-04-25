const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isSignUp = false;

// Открытие окна входа
window.toggleAuth = () => {
    const modal = document.getElementById('authModal');
    const currentStyle = window.getComputedStyle(modal).display;
    modal.style.display = (currentStyle === 'none') ? 'flex' : 'none';
};

// Переключение Режим входа / Регистрации
window.switchMode = () => {
    isSignUp = !isSignUp;
    document.getElementById('authTitle').innerText = isSignUp ? "Регистрация" : "Вход";
    document.getElementById('switchBtn').innerText = isSignUp ? "Есть аккаунт? Войти" : "Нет аккаунта? Регистрация";
};

// Работа с авторизацией
window.handleAuth = async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPass').value;

    if (!email || !password) return alert("Введите данные!");

    let result;
    if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
    } else {
        result = await supabase.auth.signInWithPassword({ email, password });
    }

    if (result.error) {
        alert("Ошибка: " + result.error.message);
    } else {
        if (isSignUp) {
            alert("Регистрация успешна! Теперь вы можете войти.");
            window.switchMode(); // Переключаем на вход
        } else {
            alert("Вы вошли!");
            window.toggleAuth();
            location.reload(); // Перезагрузка для обновления UI
        }
    }
};

window.handleLogout = async () => {
    if (confirm("Выйти из аккаунта?")) {
        await supabase.auth.signOut();
        location.reload();
    }
};

// Загрузка галереи
async function loadGallery() {
    const { data, error } = await supabase.storage.from('photos').list('', {
        sortBy: { column: 'created_at', order: 'desc' }
    });

    if (error) return console.error("Ошибка загрузки:", error.message);

    const gallery = document.getElementById('gallery');
    gallery.innerHTML = "";

    if (data.length === 0) {
        gallery.innerHTML = "<p style='grid-column:1/4; text-align:center; padding:50px; color:gray;'>Фотографий еще нет.</p>";
    }

    data.forEach(file => {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(file.name);
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.innerHTML = `<img src="${urlData.publicUrl}" loading="lazy">`;
        gallery.appendChild(card);
    });
}

// Загрузка нового фото
window.triggerUpload = () => document.getElementById('imageInput').click();

window.uploadPhoto = async () => {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;

    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('photos').upload(fileName, file);

    if (error) {
        alert("Ошибка загрузки: " + error.message);
    } else {
        loadGallery();
    }
};

// Проверка сессии при загрузке
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user) {
        document.getElementById('authBtn').style.display = 'none';
        document.getElementById('addBtn').style.display = 'block';
        document.getElementById('userProfile').style.display = 'flex';
    }

    loadGallery();
}

init();
