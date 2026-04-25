const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.isAdmin = false;

// Показ имени файла после выбора
window.updateFileName = function() {
    const input = document.getElementById('imageInput');
    document.getElementById('fileNameDisplay').innerText = input.files[0] ? input.files[0].name : "Файл не выбран";
};

window.toggleAdminPanel = function() {
    document.getElementById('passwordPanel').classList.toggle('hidden');
};

window.checkPassword = function() {
    const pass = document.getElementById('adminPass').value;
    if (pass === "DmitroIsPro") {
        window.isAdmin = true;
        document.getElementById('adminStatus').style.display = 'inline-block';
        document.getElementById('passwordPanel').classList.add('hidden');
        loadGallery();
    }
};

window.uploadPhoto = async function() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    const btn = document.getElementById('uploadBtn');

    if (!file) return;

    btn.disabled = true;
    btn.innerText = "Загрузка...";

    const fileName = `${Date.now()}_${file.name}`;

    try {
        const { error } = await supabaseClient.storage.from('photos').upload(fileName, file);
        if (error) throw error;
        
        fileInput.value = "";
        document.getElementById('fileNameDisplay').innerText = "Файл загружен!";
        loadGallery();
    } catch (err) {
        console.error("Ошибка:", err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Загрузить";
    }
};

async function loadGallery() {
    const gallery = document.getElementById('gallery');
    try {
        const { data, error } = await supabaseClient.storage.from('photos').list();
        if (error) throw error;

        gallery.innerHTML = "";
        data.forEach(file => {
            const { data: urlData } = supabaseClient.storage.from('photos').getPublicUrl(file.name);
            
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.innerHTML = `
                <img src="${urlData.publicUrl}" onclick="window.openFullScreen('${urlData.publicUrl}')">
                ${window.isAdmin ? `<button class="delete-btn" onclick="window.deletePhoto('${file.name}')">❌</button>` : ''}
            `;
            gallery.appendChild(card);
        });
    } catch (err) {
        console.error("Ошибка галереи:", err.message);
    }
}

window.deletePhoto = async function(name) {
    if (!confirm("Удалить фото?")) return;
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

loadGallery();
