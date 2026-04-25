// ТВОИ КЛЮЧИ
const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';

// ЭТО СРАБОТАЕТ СРАЗУ ПРИ ОТКРЫТИИ САЙТА
alert("Скрипт загружен! Если видишь это - код работает.");

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ФУНКЦИЯ ОТКРЫТИЯ ОКНА
window.toggleAuthModal = function() {
    alert("Нажимаю кнопку...");
    const modal = document.getElementById('authModal');
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
};

// ФУНКЦИЯ ВХОДА
window.handleAuth = async function() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPass').value;
    
    alert("Пробую войти...");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert("Ошибка: " + error.message + ". Пробую регистрацию...");
        const { error: regError } = await supabase.auth.signUp({ email, password });
        if (regError) alert("Ошибка регистрации: " + regError.message);
        else alert("Регистрация успешна! Проверь почту или попробуй войти.");
    } else {
        alert("Вы вошли!");
        location.reload(); // Перезагрузка, чтобы всё появилось
    }
};

// ЗАГРУЗКА ФОТО
async function loadGallery() {
    const { data, error } = await supabase.storage.from('photos').list();
    if (error) return;

    const gallery = document.getElementById('gallery');
    gallery.innerHTML = "";

    data.forEach(file => {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(file.name);
        const img = document.createElement('img');
        img.src = urlData.publicUrl;
        img.style.width = "100%";
        img.style.aspectRatio = "1/1";
        img.style.objectFit = "cover";
        gallery.appendChild(img);
    });
}

loadGallery();
