const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.isAdmin = false;
window.currentPhotos = []; // Массив всех фото для перелистывания
window.currentIndex = 0;   // Номер текущего открытого фото

// --- ЗАГРУЗКА И ГАЛЕРЕЯ ---

window.updateFileName = function() {
    const input = document.getElementById('imageInput');
    document.getElementById('fileNameDisplay').innerText = input.files[0] ? input.files[0].name : "Файл не выбран";
};

window.uploadPhoto = async function() {
    const file = document.getElementById('imageInput').files[0];
    const btn = document.getElementById('uploadBtn');

    if (!file) return;

    btn.disabled = true;
    btn.innerText = "Загрузка...";
    const fileName = `${Date.now()}_${file.name}`;

    try {
        const { error } = await supabaseClient.storage.from('photos').upload(fileName, file);
        if (error) throw error;
        
        document.getElementById('imageInput').value = "";
        document.getElementById('fileNameDisplay').innerText = "Загружено!";
        loadGallery();
    } catch (err) {
        console.error(err);
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

        window.currentPhotos = []; // Очищаем старый список
        gallery.innerHTML = "";

        data.forEach((file, index) => {
            const { data: urlData } = supabaseClient.storage.from('photos').getPublicUrl(file.name);
            
            // Сохраняем в массив для перелистывания
            window.currentPhotos.push({
                name: file.name,
                url: urlData.publicUrl
            });
            
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.innerHTML = `
                <img src="${urlData.publicUrl}" onclick="window.openFullScreen(${index})">
                ${window.isAdmin ? `<button class="delete-btn" onclick="window.deletePhoto('${file.name}', event)">❌</button>` : ''}
            `;
            gallery.appendChild(card);
        });
    } catch (err) {
        console.error(err);
    }
}

// --- УДАЛЕНИЕ И АДМИНКА ---

window.deletePhoto = async function(name, event) {
    event.stopPropagation(); // Чтобы при удалении не открывалось фото
    if (!confirm("Удалить фото?")) return;
    await supabaseClient.storage.from('photos').remove([name]);
    await supabaseClient.from('photo_metadata').delete().eq('filename', name); // Удаляем и лайки
    loadGallery();
};

window.toggleAdminPanel = () => document.getElementById('passwordPanel').classList.toggle('hidden');
window.checkPassword = function() {
    if (document.getElementById('adminPass').value === "1234") {
        window.isAdmin = true;
        document.getElementById('adminStatus').style.display = 'inline-block';
        document.getElementById('passwordPanel').classList.add('hidden');
        loadGallery();
    }
};

// --- ПОЛНОЭКРАННЫЙ РЕЖИМ И ПЕРЕЛИСТЫВАНИЕ ---

window.openFullScreen = async function(index) {
    window.currentIndex = index;
    const photo = window.currentPhotos[index];
    
    document.getElementById('fullScreenImg').src = photo.url;
    document.getElementById('fullScreenModal').style.display = 'flex';
    document.getElementById('fullScreenModal').classList.remove('hidden');

    await loadMetadata(photo.name);
};

window.closeFullScreen = function() {
    document.getElementById('fullScreenModal').style.display = 'none';
};

window.nextPhoto = function() {
    let nextIndex = window.currentIndex + 1;
    if (nextIndex >= window.currentPhotos.length) nextIndex = 0; // Возврат в начало
    window.openFullScreen(nextIndex);
};

window.prevPhoto = function() {
    let prevIndex = window.currentIndex - 1;
    if (prevIndex < 0) prevIndex = window.currentPhotos.length - 1; // Переход в конец
    window.openFullScreen(prevIndex);
};

// --- ЛАЙКИ И КОММЕНТАРИИ (БАЗА ДАННЫХ) ---

async function loadMetadata(fileName) {
    document.getElementById('likeCount').innerText = "...";
    document.getElementById('commentsList').innerHTML = "<i>Загрузка комментариев...</i>";

    // Получаем данные из таблицы
    const { data } = await supabaseClient.from('photo_metadata').select('*').eq('filename', fileName).maybeSingle();
    
    const meta = data || { likes: 0, comments: [] };
    
    document.getElementById('likeCount').innerText = meta.likes;
    renderComments(meta.comments);
}

window.likeCurrentPhoto = async function() {
    const photo = window.currentPhotos[window.currentIndex];
    const { data } = await supabaseClient.from('photo_metadata').select('*').eq('filename', photo.name).maybeSingle();
    
    const meta = data || { filename: photo.name, likes: 0, comments: [] };
    meta.likes += 1;

    document.getElementById('likeCount').innerText = meta.likes;

    // Сохраняем в базу
    await supabaseClient.from('photo_metadata').upsert({
        filename: meta.filename,
        likes: meta.likes,
        comments: meta.comments
    });
};

window.addComment = async function() {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = "Отправка...";
    input.disabled = true;

    const photo = window.currentPhotos[window.currentIndex];
    const { data } = await supabaseClient.from('photo_metadata').select('*').eq('filename', photo.name).maybeSingle();
    
    const meta = data || { filename: photo.name, likes: 0, comments: [] };
    meta.comments.push(text);

    // Сохраняем в базу
    await supabaseClient.from('photo_metadata').upsert({
        filename: meta.filename,
        likes: meta.likes,
        comments: meta.comments
    });

    input.value = "";
    input.disabled = false;
    renderComments(meta.comments);
};

function renderComments(commentsArray) {
    const list = document.getElementById('commentsList');
    list.innerHTML = "";
    if (!commentsArray || commentsArray.length === 0) {
        list.innerHTML = "<i>Пока нет комментариев. Будьте первым!</i>";
        return;
    }
    commentsArray.forEach(text => {
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.innerText = text; // innerText защищает от взлома (XSS)
        list.appendChild(div);
    });
}

// Запуск
loadGallery();
