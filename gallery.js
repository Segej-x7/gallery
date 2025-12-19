// 🚀 ГАРАНТИРОВАННО РАБОЧАЯ ГАЛЕРЕЯ
// Загружает картинки ИЗ СПИСКА images-list.json

class SimpleGallery {
    constructor() {
        this.images = [];
        this.imagesListUrl = 'images-list.json';
        this.init();
    }
    
    async init() {
        this.showLoading();
        
        try {
            // 1. Пробуем загрузить список из JSON
            await this.loadImagesFromList();
            
            // 2. Если не получилось - используем hardcoded список
            if (this.images.length === 0) {
                this.images = this.getHardcodedImages();
            }
            
            // 3. Сортируем Z→A
            this.sortImages();
            
            // 4. Показываем
            this.displayGallery();
            this.updateStats();
            
            console.log(`✅ Загружено картинок: ${this.images.length}`);
            
        } catch (error) {
            console.error('Ошибка:', error);
            this.showError();
        }
    }
    
    // Загрузка из JSON файла
    async loadImagesFromList() {
        try {
            console.log('📥 Загружаю images-list.json...');
            const response = await fetch(this.imagesListUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (Array.isArray(data)) {
                this.images = data.map(img => ({
                    id: Date.now() + Math.random(),
                    name: img.name,
                    url: img.url || `https://segej-x7.github.io/gallery/images/${img.name}`,
                    rawUrl: img.rawUrl || `https://raw.githubusercontent.com/Segej-x7/gallery/main/images/${img.name}`,
                    size: 0,
                    extension: img.name.split('.').pop().toLowerCase(),
                    date: new Date().toISOString()
                }));
                
                console.log(`✅ JSON загружен: ${this.images.length} картинок`);
            }
            
        } catch (error) {
            console.log('Не удалось загрузить JSON:', error.message);
            this.images = [];
        }
    }
    
    // Жестко закодированные картинки (на случай если JSON не загрузится)
    getHardcodedImages() {
        // ⚠️ ДОБАВЬ СЮДА ВСЕ СВОИ КАРТИНКИ!
        const imageNames = [
            'Group-1.png',
            'photo1.jpg',
            'photo2.jpg',
            // ДОБАВЛЯЙ СЮДА ВСЕ СВОИ ФАЙЛЫ!
            // 'photo3.png',
            // 'image.jpg',
        ];
        
        return imageNames.map(name => ({
            id: Date.now() + Math.random(),
            name: name,
            url: `https://segej-x7.github.io/gallery/images/${name}`,
            rawUrl: `https://raw.githubusercontent.com/Segej-x7/gallery/main/images/${name}`,
            size: 0,
            extension: name.split('.').pop().toLowerCase(),
            date: new Date().toISOString()
        }));
    }
    
    // Сортировка Z→A
    sortImages() {
        this.images.sort((a, b) => b.name.localeCompare(a.name));
    }
    
    // Показ галереи
    displayGallery() {
        const gallery = document.getElementById('gallery');
        const noImages = document.getElementById('noImages');
        
        if (!this.images.length) {
            gallery.innerHTML = '';
            noImages.style.display = 'block';
            return;
        }
        
        noImages.style.display = 'none';
        gallery.innerHTML = '';
        
        this.images.forEach(img => {
            gallery.appendChild(this.createImageCard(img));
        });
    }
    
    // Создание карточки
    createImageCard(image) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `
            <div class="image-container">
                <img src="${image.url}" 
                     alt="${image.name}" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"200\"><rect width=\"100%\" height=\"100%\" fill=\"%23f0f0f0\"/><text x=\"50%\" y=\"50%\" font-family=\"Arial\" fill=\"%23666\" text-anchor=\"middle\" dy=\".3em\">${image.name}</text></svg>'">
            </div>
            <div class="image-info">
                <div class="image-name">${image.name}</div>
                <div class="image-meta">
                    <span class="meta-item">${image.extension.toUpperCase()}</span>
                    <span class="meta-item">${this.formatFileSize(image.size)}</span>
                </div>
                <div class="image-actions">
                    <button class="action-btn view-btn" onclick="openImage('${image.url}')">
                        👁️ Просмотр
                    </button>
                    <button class="action-btn copy-btn" onclick="copyLink('${image.url}')">
                        📋 Копировать
                    </button>
                    <a href="${image.url}" download="${image.name}" class="action-btn download-btn">
                        ⬇️ Скачать
                    </a>
                </div>
            </div>
        `;
        return card;
    }
    
    // Обновление статистики
    updateStats() {
        const totalImages = document.getElementById('totalImages');
        const loadingStatus = document.getElementById('loadingStatus');
        
        if (totalImages) {
            totalImages.textContent = this.images.length;
        }
        
        if (loadingStatus) {
            loadingStatus.textContent = this.images.length > 0 ? '✅' : '❌';
        }
    }
    
    // Форматирование размера
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return 'Размер неизвестен';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    // Показ загрузки
    showLoading() {
        const gallery = document.getElementById('gallery');
        if (!gallery) return;
        
        gallery.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <div style="font-size:48px;animation:spin 1s linear infinite">🔄</div>
                <h3>Загружаю картинки...</h3>
                <p>Ищу файл images-list.json</p>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>
        `;
    }
    
    // Показ ошибки
    showError() {
        const gallery = document.getElementById('gallery');
        if (!gallery) return;
        
        gallery.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <div style="font-size:48px;">❌</div>
                <h3>Не могу найти картинки</h3>
                <p>Создай файл <code>images-list.json</code> в корне репозитория</p>
                <p>Или добавь их имена в код галереи</p>
                <button onclick="location.reload()" style="
                    background:#667eea;
                    color:white;
                    border:none;
                    padding:12px 24px;
                    border-radius:6px;
                    cursor:pointer;
                    margin-top:20px;
                ">
                    🔄 Попробовать снова
                </button>
            </div>
        `;
    }
    
    // Перезагрузка галереи
    async reload() {
        this.images = [];
        await this.init();
    }
}

// ============================================================================
// 🌐 ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ============================================================================

// Открыть картинку в новом окне
function openImage(url) {
    window.open(url, '_blank');
}

// Копировать ссылку
async function copyLink(url) {
    try {
        await navigator.clipboard.writeText(url);
        showNotification('✅ Ссылка скопирована!');
    } catch (error) {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showNotification('✅ Ссылка скопирована!');
    }
}

// Показать уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #48bb78, #38a169);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Добавить стили для анимации
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// 🚀 ЗАПУСК
// ============================================================================

// Создаем галерею при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new SimpleGallery();
    
    // Добавляем кнопку обновления
    const stats = document.querySelector('.stats');
    if (stats) {
        const reloadBtn = document.createElement('button');
        reloadBtn.innerHTML = '🔄 Обновить';
        reloadBtn.onclick = () => window.gallery.reload();
        reloadBtn.style.cssText = `
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
        `;
        
        const reloadItem = document.createElement('div');
        reloadItem.className = 'stat-item';
        reloadItem.appendChild(reloadBtn);
        stats.appendChild(reloadItem);
    }
});