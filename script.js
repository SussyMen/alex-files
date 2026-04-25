const SUPABASE_URL = 'https://kjbejfgeviuddxtrejjk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_p9gBa9ptV5wgko8BwWbV_w_diNV5Jv7';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.isAdmin = false;
window.currentPhotos = []; 
window.currentIndex = 0;   

window.updateFileName = () => {
    const file = document.getElementById('imageInput').files[0];
    document.getElementById('fileNameDisplay').innerText = file ? file.name : "";
};

window.uploadPhoto = async function() {
    const file = document.getElementById('imageInput').files[0];
    const btn = document.getElementById('uploadBtn');
    if (!file) return;

    btn.disabled = true; btn.innerText = "Загрузка...";
    const fileName = `${Date.now()}_${file.name}`;

    try {
        const { error } = await supabaseClient.storage.from('photos').upload(fileName, file);
        if (error) throw error;
        loadGallery();
    } catch (err) { console.error(err); } 
    finally { btn.disabled = false; btn.innerText = "Поделиться"; }
};

async function loadGallery() {
    const { data, error } = await supabaseClient.storage.from('photos').list();
    if (error) return;

    window.currentPhotos = [];
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = "";

    data.forEach((file, index) => {
        const { data: urlData } = supabaseClient.storage.from('photos').getPublicUrl(file.name);
        window.currentPhotos.push({ name: file.name, url: urlData.publicUrl });
        
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.innerHTML = `
            <img src="${urlData.publicUrl}" onclick="window.openFullScreen(${index})">
            ${window.isAdmin ? `<button class="delete-btn" onclick="window.deletePhoto('${file.name}', event)">✕</button>` : ''}
        `;
        gallery.appendChild(card);
    });
}

window.openFullScreen = async function(index) {
    window.currentIndex = index;
    const photo = window.currentPhotos[index];
    document.getElementById('fullScreenImg').src = photo.url;
    document.getElementById('fullScreenModal').classList.remove('hidden');
    await loadMetadata(photo.name);
};

window.closeFullScreen = () => document.getElementById('fullScreenModal').classList.add('hidden');

window.nextPhoto = () => window.openFullScreen((window.currentIndex + 1) % window.currentPhotos.length);
window.prevPhoto = () => window.openFullScreen((window.currentIndex - 1 + window.currentPhotos.length) % window.currentPhotos.length);

async function loadMetadata(fileName) {
    const { data } = await supabaseClient.from('photo_metadata').select('*').eq('filename', fileName).maybeSingle();
    const meta = data || { likes: 0, comments: [] };
    document.getElementById('likeCount').innerText = meta.likes;
    renderComments(meta.comments);
}

window.likeCurrentPhoto = async function() {
    const photo = window.currentPhotos[window.currentIndex];
    const { data } = await supabaseClient.from('photo_metadata').select('*').eq('filename', photo.name).maybeSingle();
    const meta = data || { filename: photo.name, likes: 0, comments: [] };
    meta.likes++;
    document.getElementById('likeCount').innerText = meta.likes;
    await supabaseClient.from('photo_metadata').upsert(meta);
};

window.addComment = async function() {
    const input = document.getElementById('commentInput');
    if (!input.value.trim()) return;

    const photo = window.currentPhotos[window.currentIndex];
    const { data } = await supabaseClient.from('photo_metadata').select('*').eq('filename', photo.name).maybeSingle();
    const meta = data || { filename: photo.name, likes: 0, comments: [] };
    meta.comments.push(input.value);
    await supabaseClient.from('photo_metadata').upsert(meta);
    input.value = "";
    renderComments(meta.comments);
};

function renderComments(comments) {
    const list = document.getElementById('commentsList');
    list.innerHTML = comments.map(c => `<div class="comment-item"><b>user</b> ${c}</div>`).join('');
}

window.toggleAdminPanel = () => document.getElementById('passwordPanel').classList.toggle('hidden');
window.checkPassword = () => {
    if (document.getElementById('adminPass').value === "1234") {
        window.isAdmin = true;
        document.getElementById('adminStatus').style.display = 'inline-block';
        document.getElementById('passwordPanel').classList.add('hidden');
        loadGallery();
    }
};

loadGallery();
