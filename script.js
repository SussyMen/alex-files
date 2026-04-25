import { collection, addDoc, query, onSnapshot, deleteDoc, doc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let isAdmin = false;
const ADMIN_PASSWORD = "1234"; // Твой пароль

const gallery = document.getElementById('gallery');

// 1. Отображение фото в реальном времени
const q = query(collection(window.db, "photos"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    gallery.innerHTML = '';
    snapshot.forEach((d) => {
        const data = d.data();
        renderPhoto(data.url, d.id, data.storagePath);
    });
});

// 2. Функция загрузки
window.uploadPhoto = async function() {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return alert("Выбери файл!");

    try {
        const storagePath = `images/${Date.now()}_${file.name}`;
        const storageRef = ref(window.storage, storagePath);

        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        await addDoc(collection(window.db, "photos"), {
            url: url,
            storagePath: storagePath,
            createdAt: Date.now()
        });
        alert("Загружено!");
    } catch (e) {
        console.error(e);
        alert("Ошибка! Проверь правила (Rules) в Firebase.");
    }
};

function renderPhoto(url, id, storagePath) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
        <img src="${url}" onclick="openFullScreen('${url}')">
        ${isAdmin ? `<button class="delete-btn" style="display:block;" onclick="deletePhoto('${id}', '${storagePath}')">❌</button>` : ''}
    `;
    gallery.appendChild(card);
}

// 3. Админка и удаление
window.checkPassword = function() {
    const pass = document.getElementById('adminPass').value;
    if (pass === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('adminStatus').style.display = 'inline';
        document.getElementById('passwordPanel').classList.add('hidden');
        alert("Режим админа включен");
    } else {
        alert("Неверно!");
    }
};

window.deletePhoto = async function(id, storagePath) {
    if (!confirm("Удалить фото?")) return;
    await deleteDoc(doc(window.db, "photos", id));
    await deleteObject(ref(window.storage, storagePath));
};

window.toggleAdminPanel = () => document.getElementById('passwordPanel').classList.toggle('hidden');
window.openFullScreen = (src) => {
    document.getElementById('fullScreenImg').src = src;
    document.getElementById('fullScreenModal').style.display = 'flex';
};
window.closeFullScreen = () => document.getElementById('fullScreenModal').style.display = 'none';
