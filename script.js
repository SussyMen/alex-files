alert("Система Alexstagram загружена!");

const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isSignUp = false;

window.switchMode = () => {
    isSignUp = !isSignUp;
    document.getElementById('authTitle').innerText = isSignUp ? "Регистрация" : "Вход";
    document.getElementById('switchBtn').innerText = isSignUp ? "Есть аккаунт? Войти" : "Нет аккаунта? Регистрация";
};

window.handleAuth = async () => {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPass').value;
    if (!email || !password) return alert("Заполни поля");

    const { data, error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    else {
        alert(isSignUp ? "Регистрация успешна! Теперь войдите." : "Вы вошли!");
        location.reload();
    }
};

window.handleLogout = async () => { if (confirm("Выйти?")) { await supabase.auth.signOut(); location.reload(); } };
window.triggerUpload = () => document.getElementById('imageInput').click();

window.uploadPhoto = async () => {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('photos').upload(fileName, file);
    if (error) alert(error.message); else loadGallery();
};

async function loadGallery() {
    const { data, error } = await supabase.storage.from('photos').list();
    if (error) return;
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = "";
    data.forEach(file => {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(file.name);
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.innerHTML = `<img src="${urlData.publicUrl}">`;
        gallery.appendChild(card);
    });
}

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        document.getElementById('authBtn').style.display = 'none';
        document.getElementById('addBtn').style.display = 'block';
        document.getElementById('userProfile').style.display = 'flex';
    }
    loadGallery();
}
init();
