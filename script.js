const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';

// Проверка загрузки библиотеки
if (!window.supabase) {
    alert("КРИТИЧЕСКАЯ ОШИБКА: Библиотека Supabase не загружена! Проверь интернет или ссылку в index.html");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentPhotos = [];
let currentIndex = 0;
let isSignUp = false;
let currentUser = null;

async function init() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        updateUserUI(session?.user || null);
        loadGallery();

        supabase.auth.onAuthStateChange((_event, session) => {
            updateUserUI(session?.user || null);
        });
    } catch (err) {
        alert("Ошибка инициализации Supabase: " + err.message);
    }
}

function updateUserUI(user) {
    currentUser = user;
    const addBtn = document.getElementById('addBtn');
    const authBtn = document.getElementById('authBtn');
    const profile = document.getElementById('userProfile');

    if (addBtn) addBtn.style.display = user ? 'block' : 'none';
    if (profile) profile.style.display = user ? 'flex' : 'none';
    if (authBtn) authBtn.style.display = user ? 'none' : 'block';
}

// ГЛАВНАЯ ПРОВЕРКА КНОПКИ
window.toggleAuthModal = () => {
    alert("Кнопка 'Войти' нажата!"); // Этот алерт должен появиться первым
    const modal = document.getElementById('authModal');
    if (!modal) {
        alert("ОШИБКА: Окно с id='authModal' не найдено в HTML!");
        return;
    }
    modal.classList.toggle('hidden');
    alert("Класс 'hidden' переключен. Видишь окно входа?");
};

window.handleAuth = async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPass').value;
    
    if (!email || !password) {
        alert("Заполни все поля!");
        return;
    }

    alert("Отправка данных в Supabase...");
    const { data, error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert("Ошибка входа/регистрации: " + error.message);
    } else {
        alert("Успешно! Вы вошли как: " + data.user.email);
        window.toggleAuthModal();
    }
};

async function loadGallery() {
    const { data, error } = await supabase.storage.from('photos').list();
    if (error) {
        alert("Ошибка загрузки фото из Storage: " + error.message);
        return;
    }

    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    gallery.innerHTML = "";
    currentPhotos = [];

    if (data.length === 0) {
        gallery.innerHTML = "<p style='grid-column:1/4; text-align:center;'>Галерея пуста. Загрузите первое фото!</p>";
    }

    data.forEach((file, index) => {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(file.name);
        currentPhotos.push({ name: file.name, url: urlData.publicUrl });
        
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.innerHTML = `<img src="${urlData.publicUrl}" onclick="window.openFullScreen(${index})">`;
        gallery.appendChild(card);
    });
}

// Остальные функции (загрузка, лайки)
window.triggerUpload = () => document.getElementById('imageInput').click();

window.uploadPhoto = async () => {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;

    alert("Начинаю загрузку файла: " + file.name);
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('photos').upload(fileName, file);
    
    if (error) alert("Ошибка загрузки: " + error.message);
    else {
        alert("Загрузка завершена успешно!");
        loadGallery();
    }
};

init();
