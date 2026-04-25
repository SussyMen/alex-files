
let isAdmin = false;
const gallery = document.getElementById('gallery');
const ADMIN_PASSWORD = "1234"; // Установите свой пароль здесь

// Функция входа
function checkPassword() {
    const pass = document.getElementById('adminPass').value;
    if (pass === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('adminStatus').style.display = 'inline';
        document.getElementById('passwordPanel').classList.add('hidden');
        renderGallery(); // Перерисовываем, чтобы появились кнопки удаления
    } else {
        alert("Неверный пароль!");
    }
}

function toggleAdminPanel() {
    document.getElementById('passwordPanel').classList.toggle('hidden');
}

// Загрузка фото (Base64 для хранения в localStorage)
function uploadPhoto() {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const photos = JSON.parse(localStorage.getItem('alexFiles') || '[]');
        photos.push(e.target.result);
        localStorage.setItem('alexFiles', JSON.stringify(photos));
        renderGallery();
    };
    reader.readAsDataURL(file);
}

function renderGallery() {
    gallery.innerHTML = '';
    const photos = JSON.parse(localStorage.getItem('alexFiles') || '[]');

    photos.forEach((src, index) => {
        const card = document.createElement('div');
        card.className = 'photo-card';
        
        card.innerHTML = `
            <img src="${src}" onclick="openFullScreen('${src}')">
            ${isAdmin ? `<button class="delete-btn" style="display:block;" onclick="deletePhoto(${index})">Удалить</button>` : ''}
        `;
        gallery.appendChild(card);
    });
}

function deletePhoto(index) {
    let photos = JSON.parse(localStorage.getItem('alexFiles'));
    photos.splice(index, 1);
    localStorage.setItem('alexFiles', JSON.stringify(photos));
    renderGallery();
}

function openFullScreen(src) {
    document.getElementById('fullScreenImg').src = src;
    document.getElementById('fullScreenModal').style.display = 'flex';
}

function closeFullScreen() {
    document.getElementById('fullScreenModal').style.display = 'none';
}

// Инициализация при загрузке
renderGallery();

