// Галерея, которая показывает изображения из папки на GitHub
class GitHubGallery {
    constructor() {
        this.images = [];
        this.imagesFolder = 'images/';
        this.githubRepo = 'https://github.com/Segej-x7/gallery';
        this.githubPagesUrl = 'https://segej-x7.github.io/gallery/';
        this.init();
    }

    async init() {
        await this.loadImagesFromGitHub();
        this.displayGallery();
        this.updateStats();
        console.log('Галерея загружена');
    }

    // Загрузка списка изображений из GitHub
    async loadImagesFromGitHub() {
        try {
            showLoading();
            
            // Если есть доступ к GitHub API (для получения списка файлов)
            // Если нет - используем ручной список
            const imageList = await this.getImageList();
            
            // Формируем данные для каждого изображения
            this.images = imageList.map((img, index) => ({
                id: index + 1,
                name: img.name,
                url: `${this.githubPagesUrl}${this.imagesFolder}${img.name}`,
                path: `${this.imagesFolder}${img.name}`,
                size: img.size || 'Неизвестно',
                extension: img.name.split('.').pop().toLowerCase()
            }));
            
            // Сортируем от Z до A (от большего к меньшему)
            this.sortImages();
            
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            showError();
        }
    }

    // Получение списка изображений
    async getImageList() {
        try {
            // Пробуем получить через GitHub API
            const apiUrl = 'https://api.github.com/repos/Segej-x7/gallery/contents/images';
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const data = await response.json();
                // Фильтруем только изображения
                return data.filter(item => 
                    item.type === 'file' && 
                    /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(item.name)
                ).map(item => ({
                    name: item.name,
                    size: this.formatFileSize(item.size)
                }));
            }
        } catch (error) {
            console.log('GitHub API не доступен, используем ручной метод');
        }
        
        // Ручной метод - получаем список из скрытого файла или создаем его
        return await this.getManualImageList();
    }

    // Ручной список изображений
    async getManualImageList() {
        try {
            // Создаем файл images-list.js со списком изображений
            const images = [
                {name: 'example1.jpg', size: '245760'},
                {name: 'example2.png', size: '153600'}
                // Добавляйте сюда свои изображения
            ];
            
            // Проверяем, есть ли реальные изображения
            const validImages = [];
            
            for (const img of images) {
                try {
                    const imgUrl = `${this.githubPagesUrl}${this.imagesFolder}${img.name}`;
                    const response = await fetch(imgUrl, { method: 'HEAD' });
                    if (response.ok) {
                        validImages.push(img);
                    }
                } catch (e) {
                    // Пропускаем несуществующие файлы
                }
            }
            
            return validImages;
        } catch (error) {
            return [];
        }
    }

    // Сортировка от Z до A
    sortImages() {
        this.images.sort((a, b) => {
            return b.name.localeCompare(a.name, 'ru', { sensitivity: 'base' });
        });
    }

    // Отображение галереи
    displayGallery() {
        const gallery = document.getElementById('gallery');
        const noImages = document.getElementById('noImages');
        
        if (!this.images || this.images.length === 0) {
            gallery.innerHTML = '';
            noImages.style.display = 'block';
            return;
        }
        
        noImages.style.display = 'none';
        gallery.innerHTML = '';
        
        this.images.forEach(image => {
            const card = this.createImageCard(image);
            gallery.appendChild(card);
        });
    }

    // Создание карточки
    createImageCard(image) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.id = image.id;
        
        const size = this.formatFileSize(image.size);
        const extension = image.extension.toUpperCase();
        
        card.innerHTML = `
            <div class="image-container">
                <img src="${image.url}" alt="${image.name}" loading="lazy"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\"><rect width=\"100%\" height=\"100%\" fill=\"%23f6f8fa\"/><text x=\"50%\" y=\"50%\" font-family=\"Arial\" font-size=\"14\" fill=\"%23999\" text-anchor=\"middle\" dy=\".3em\">${image.name}</text></svg>'">
            </div>
            <div class="image-info">
                <div class="image-name" title="${image.name}">
                    📄 ${image.name}
                </div>
                <div class="image-size">
                    📦 ${size} • ${extension}
                </div>
                <div class="image-actions">
                    <button class="action-btn view-btn" onclick="gallery.viewImage('${image.id}')">
                        👁️ Просмотр
                    </button>
                    <button class="action-btn copy-btn" onclick="gallery.copyImageLink('${image.url}')">
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

    // Просмотр изображения
    viewImage(imageId) {
        const image = this.images.find(img => img.id == imageId);
        if (!image) return;
        
        window.open(image.url, '_blank');
    }

    // Копирование ссылки
    async copyImageLink(url) {
        try {
            await navigator.clipboard.writeText(url);
            showNotification('✅ Ссылка скопирована!');
        } catch (error) {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('✅ Ссылка скопирована!');
        }
    }

    // Форматирование размера
    formatFileSize(bytes) {
        if (typeof bytes !== 'number' || bytes === 0 || bytes === 'Неизвестно') return 'Неизвестно';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Обновление статистики
    updateStats() {
        const totalImages = document.getElementById('totalImages');
        const totalSize = document.getElementById('totalSize');
        
        if (totalImages) {
            totalImages.textContent = this.images.length;
        }
        
        if (totalSize) {
            const totalBytes = this.images.reduce((sum, img) => {
                return sum + (typeof img.size === 'number' ? img.size : 0);
            }, 0);
            totalSize.textContent = this.formatFileSize(totalBytes);
        }
    }

    // Перезагрузка галереи
    async reload() {
        await this.loadImagesFromGitHub();
        this.displayGallery();
        this.updateStats();
        showNotification('🔄 Галерея обновлена');
    }
}

// Вспомогательные функции
function showLoading() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    gallery.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div style="font-size: 48px; margin-bottom: 20px; animation: spin 1s linear infinite;">⏳</div>
            <h3>Загрузка изображений с GitHub...</h3>
            <p>Пожалуйста, подождите</p>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </div>
    `;
}

function showError() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    gallery.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
            <h3>Не удалось загрузить изображения</h3>
            <p>Проверьте:</p>
            <ul style="text-align: left; max-width: 500px; margin: 20px auto;">
                <li>Файлы загружены в папку <code>images/</code> на GitHub</li>
                <li>GitHub Pages включен в настройках репозитория</li>
            </ul>
            <button onclick="location.reload()" class="upload-btn">
                🔄 Обновить страницу
            </button>
        </div>
    `;
}

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
    }, 3000);
    
    // Добавляем стили для анимации
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
}

// Создаем глобальный объект
window.gallery = new GitHubGallery();

// Функция для обновления галереи
function reloadGallery() {
    window.gallery.reload();
}

// Добавляем кнопку обновления в интерфейс
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем кнопку обновления в stats
    const stats = document.querySelector('.stats');
    if (stats) {
        const reloadBtn = document.createElement('button');
        reloadBtn.className = 'upload-btn';
        reloadBtn.style.margin = '0 10px';
        reloadBtn.innerHTML = '🔄 Обновить';
        reloadBtn.onclick = reloadGallery;
        
        const reloadItem = document.createElement('div');
        reloadItem.className = 'stat-item';
        reloadItem.appendChild(reloadBtn);
        stats.appendChild(reloadItem);
    }
});