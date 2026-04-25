const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentPhotos = [];
let currentIndex = 0;
let isSignUp = false;
let currentUser = null;

// --- Инициализация ---
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    updateUserUI(session?.user || null);
    loadGallery();

    supabase.auth.onAuthStateChange((_event, session) => {
        updateUserUI(session?.user || null);
    });
}

function updateUserUI(user) {
    currentUser = user;
    document.getElementById('addBtn').style.display = user ? 'block' : 'none';
    document.getElementById('userProfile').style.display = user ? 'flex' : 'none';
    document.getElementById('authBtn').style.display = user ? 'none' : 'block';
    
    // Прячем/показываем ввод комментов в зависимости от входа
    const area = document.getElementById('commentArea');
    const notice = document.getElementById('authNotice');
    if (user) {
        area?.classList.remove('hidden');
        notice?.classList.add('hidden');
    } else {
        area?.classList.add('hidden');
        notice?.classList.remove('hidden');
    }
}

// --- Авторизация ---
window.toggleAuthModal = () => document.getElementById('authModal').classList.toggle('hidden');

window.switchAuthMode = () => {
    isSignUp = !isSignUp;
    document.getElementById('authTitle').innerText = isSignUp ? "Регистрация" : "Вход";
    document.getElementById('authSwitch').innerText = isSignUp ? "Есть аккаунт? Войти" : "Нет аккаунта? Регистрация";
};

window.handleAuth = async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPass').value;
    
    const { data, error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    else window.toggleAuthModal();
};

window.handleLogout = async () => {
    if (confirm("Выйти из аккаунта?")) await supabase.auth.signOut();
};

// --- Работа с фото ---
window.triggerUpload = () => document.getElementById('imageInput').click();

window.uploadPhoto = async () => {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;

    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('photos').upload(fileName, file);
    
    if (error) alert("Ошибка загрузки. Проверьте RLS политики!");
    else loadGallery();
};

async function loadGallery() {
    const { data, error } = await supabase.storage.from('photos').list();
    if (error) return;

    currentPhotos = [];
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = "";

    data.forEach((file, index) => {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(file.name);
        currentPhotos.push({ name: file.name, url: urlData.publicUrl });
        
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.innerHTML = `
            <img src="${urlData.publicUrl}" onclick="window.openFullScreen(${index})">
            ${currentUser ? `<button class="delete-btn" onclick="window.deletePhoto('${file.name}', event)">✕</button>` : ''}
        `;
        gallery.appendChild(card);
    });
}

window.deletePhoto = async (name, event) => {
    event.stopPropagation();
    if (!confirm("Удалить?")) return;

    // Удаляем файл из хранилища
    const { error: storageError } = await supabase.storage.from('photos').remove([name]);
    // Удаляем метаданные из базы
    await supabase.from('photo_metadata').delete().eq('filename', name);

    if (storageError) alert("Ошибка удаления. Проверьте RLS политики в Storage!");
    else loadGallery();
};

// --- Просмотр и взаимодействие ---
window.openFullScreen = async (index) => {
    currentIndex = index;
    const photo = currentPhotos[index];
    document.getElementById('fullScreenImg').src = photo.url;
    document.getElementById('fullScreenModal').classList.remove('hidden');
    
    const { data } = await supabase.from('photo_metadata').select('*').eq('filename', photo.name).maybeSingle();
    const meta = data || { likes: 0, comments: [] };
    document.getElementById('likeCount').innerText = meta.likes;
    renderComments(meta.comments);
};

window.closeFullScreen = () => document.getElementById('fullScreenModal').classList.add('hidden');

window.likeCurrentPhoto = async () => {
    if (!currentUser) return alert("Войдите в аккаунт!");
    const photo = currentPhotos[currentIndex];
    const { data } = await supabase.from('photo_metadata').select('*').eq('filename', photo.name).maybeSingle();
    const meta = data || { filename: photo.name, likes: 0, comments: [] };
    meta.likes++;
    await supabase.from('photo_metadata').upsert(meta);
    document.getElementById('likeCount').innerText = meta.likes;
};

window.addComment = async () => {
    if (!currentUser) return;
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if (!text) return;

    const photo = currentPhotos[currentIndex];
    const { data } = await supabase.from('photo_metadata').select('*').eq('filename', photo.name).maybeSingle();
    const meta = data || { filename: photo.name, likes: 0, comments: [] };
    meta.comments.push(`${currentUser.email.split('@')[0]}: ${text}`);
    
    await supabase.from('photo_metadata').upsert(meta);
    input.value = "";
    renderComments(meta.comments);
};

function renderComments(comments) {
    document.getElementById('commentsList').innerHTML = comments.map(c => `<div class="comment-item">${c}</div>`).join('');
}

window.prevPhoto = () => window.openFullScreen((currentIndex - 1 + currentPhotos.length) % currentPhotos.length);
window.nextPhoto = () => window.openFullScreen((currentIndex + 1) % currentPhotos.length);

init();
