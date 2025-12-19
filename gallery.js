// Локальная галерея изображений
// Работает полностью в браузере без бэкенда

class LocalImageGallery {
    constructor() {
        this.images = [];
        this.storageKey = 'localImageGallery';
        this.maxFileSize = 5 * 1024 * 1024; // 5MB максимум
        this.init();
    }

    init() {
        // Загружаем изображения из localStorage
        this.loadFromStorage();
        
        // Показываем галерею
        this.displayGallery();
        
        // Добавляем обработчик для drag and drop
        this.setupDragAndDrop();
        
        // Обновляем статистику
        this.updateStats();
        
        console.log(`Галерея инициализирована, загружено ${this.images.length} изображений`);
    }

    // Загрузка из localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.images = parsed || [];
                console.log(`Загружено ${this.images.length} изображений из хранилища`);
            }
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
            this.images = [];
            this.saveToStorage(); // Создаем чистый массив
        }
    }

    // Сохранение в localStorage
    saveToStorage() {
        try {
            // Ограничиваем количество изображений для предотвращения переполнения
            const imagesToSave = this.images.map(img => ({
                id: img.id,
                name: img.name,
                size: img.size,
                type: img.type,
                data: img.data, // Data URL
                date: img.date,
                // Не сохраняем Blob URL
            }));
            
            localStorage.setItem(this.storageKey, JSON.stringify(imagesToSave));
            console.log(`Сохранено ${imagesToSave.length} изображений в localStorage`);
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
            if (error.name === 'QuotaExceededError') {
                alert('Превышен лимит хранилища. Попробуйте удалить некоторые изображения.');
            }
        }
    }

    // Обработка выбора файлов
    handleFileSelect(event) {
        const files = event.target.files;
        if (!files.length) return;

        this.processFiles(Array.from(files));
        event.target.value = ''; // Сбрасываем input
    }

    // Обработка файлов
    async processFiles(files) {
        const imageFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= this.maxFileSize;
            const isValidExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file.name);
            
            if (!isValidSize) {
                alert(`Файл "${file.name}" слишком большой. Максимальный размер: 5MB`);
                return false;
            }
            
            return isValidType && isValidExtension;
        });

        if (imageFiles.length === 0) {
            alert('Пожалуйста, выберите только изображения (JPG, PNG, GIF, WebP, SVG, BMP) до 5MB каждый');
            return;
        }

        // Показываем загрузку
        this.showLoading();

        // Обрабатываем каждое изображение
        let addedCount = 0;
        for (const file of imageFiles) {
            try {
                await this.addImage(file);
                addedCount++;
            } catch (error) {
                console.error('Ошибка обработки файла:', file.name, error);
                alert(`Не удалось обработать файл "${file.name}": ${error.message}`);
            }
        }

        // Обновляем отображение
        this.displayGallery();
        this.updateStats();
        
        // Сохраняем
        this.saveToStorage();
        
        // Показываем уведомление
        if (addedCount > 0) {
            this.showNotification(`Добавлено ${addedCount} изображений`);
        }
    }

    // Добавление изображения
    async addImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    // Проверяем, не существует ли уже изображение с таким именем
                    const existingIndex = this.images.findIndex(img => 
                        img.name.toLowerCase() === file.name.toLowerCase()
                    );
                    
                    if (existingIndex !== -1) {
                        // Обновляем существующее изображение
                        this.images[existingIndex] = {
                            ...this.images[existingIndex],
                            size: file.size,
                            type: file.type,
                            data: e.target.result,
                            date: new Date().toISOString()
                        };
                    } else {
                        // Создаем новое изображение
                        const imageData = {
                            id: Date.now() + Math.random().toString(36).substr(2, 9),
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            data: e.target.result, // Data URL
                            date: new Date().toISOString()
                        };

                        // Добавляем в массив
                        this.images.push(imageData);
                    }
                    
                    // Сортируем от большего к меньшему по имени
                    this.sortImages();
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsDataURL(file);
        });
    }

    // Сортировка изображений от Z до A
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
        
        // Очищаем и заполняем галерею
        gallery.innerHTML = '';
        
        this.images.forEach(image => {
            const card = this.createImageCard(image);
            gallery.appendChild(card);
        });
    }

    // Создание карточки изображения
    createImageCard(image) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.id = image.id;
        
        // Форматируем размер
        const size = this.formatFileSize(image.size);
        
        // Форматируем дату
        const date = new Date(image.date).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Проверяем, валиден ли Data URL
        const imageSrc = image.data && image.data.startsWith('data:image/') 
            ? image.data 
            : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23f6f8fa"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em">Изображение повреждено</text></svg>';
        
        card.innerHTML = `
            <div class="image-container">
                <img src="${imageSrc}" alt="${image.name}" loading="lazy" 
                     onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\"><rect width=\"100%\" height=\"100%\" fill=\"%23f6f8fa\"/><text x=\"50%\" y=\"50%\" font-family=\"Arial\" font-size=\"14\" fill=\"%23999\" text-anchor=\"middle\" dy=\".3em\">${image.name}</text></svg>'">
            </div>
            <div class="image-info">
                <div class="image-name" title="${image.name}">
                    📄 ${image.name}
                </div>
                <div class="image-size">
                    📦 ${size} • 📅 ${date}
                </div>
                <div class="image-actions">
                    <button class="action-btn view-btn" onclick="gallery.viewImage('${image.id}')">
                        👁️ Просмотр
                    </button>
                    <button class="action-btn copy-btn" onclick="gallery.copyImageLink('${image.id}')">
                        📋 Копировать
                    </button>
                    <button class="action-btn delete-btn" onclick="gallery.deleteImage('${image.id}')">
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    // Просмотр изображения
    viewImage(imageId) {
        const image = this.images.find(img => img.id === imageId);
        if (!image) return;
        
        // Открываем в новом окне
        const newWindow = window.open();
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${image.name}</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        background: #2d3748; 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        justify-content: center; 
                        min-height: 100vh;
                    }
                    img { 
                        max-width: 90vw; 
                        max-height: 80vh; 
                        border: 3px solid white;
                        border-radius: 10px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    }
                    .info {
                        color: white;
                        text-align: center;
                        margin-top: 20px;
                        font-family: Arial, sans-serif;
                        max-width: 800px;
                    }
                    h2 { margin-bottom: 10px; }
                    .meta { color: #cbd5e0; margin: 10px 0; }
                    button {
                        background: #48bb78;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 10px;
                        font-size: 16px;
                    }
                    button:hover { background: #38a169; }
                    .actions {
                        display: flex;
                        gap: 10px;
                        margin-top: 15px;
                    }
                </style>
            </head>
            <body>
                <img src="${image.data}" alt="${image.name}" 
                     onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\"><rect width=\"100%\" height=\"100%\" fill=\"%23f6f8fa\"/><text x=\"50%\" y=\"50%\" font-family=\"Arial\" font-size=\"16\" fill=\"%23999\" text-anchor=\"middle\" dy=\".3em\">${image.name}</text></svg>'">
                <div class="info">
                    <h2>${image.name}</h2>
                    <div class="meta">Размер: ${this.formatFileSize(image.size)}</div>
                    <div class="meta">Тип: ${image.type}</div>
                    <div class="meta">Загружено: ${new Date(image.date).toLocaleString('ru-RU')}</div>
                    <div class="actions">
                        <button onclick="navigator.clipboard.writeText('${image.data.replace(/'/g, "\\'")}').then(() => alert('Ссылка скопирована!'))">
                            📋 Скопировать ссылку
                        </button>
                        <button onclick="window.close()">Закрыть</button>
                    </div>
                </div>
            </body>
            </html>
        `);
    }

    // Копирование ссылки на изображение
    async copyImageLink(imageId) {
        const image = this.images.find(img => img.id === imageId);
        if (!image) {
            this.showNotification('❌ Изображение не найдено');
            return;
        }
        
        try {
            // Копируем Data URL
            await navigator.clipboard.writeText(image.data);
            
            // Показываем подтверждение
            this.showButtonFeedback(imageId, '✅ Скопировано!');
            this.showNotification(`Ссылка на "${image.name}" скопирована`);
            
        } catch (error) {
            console.error('Ошибка копирования:', error);
            
            // Fallback для старых браузеров
            try {
                const textArea = document.createElement('textarea');
                textArea.value = image.data;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.showButtonFeedback(imageId, '✅ Скопировано!');
                this.showNotification(`Ссылка на "${image.name}" скопирована`);
            } catch (fallbackError) {
                this.showNotification('❌ Не удалось скопировать ссылку');
                console.error(fallbackError);
            }
        }
    }

    // Удаление изображения
    deleteImage(imageId) {
        if (!confirm('Удалить это изображение из галереи?')) {
            return;
        }
        
        // Находим индекс изображения
        const index = this.images.findIndex(img => img.id === imageId);
        if (index === -1) {
            this.showNotification('❌ Изображение не найдено');
            return;
        }
        
        // Получаем имя для уведомления
        const imageName = this.images[index].name;
        
        // Удаляем из массива
        this.images.splice(index, 1);
        
        // Обновляем отображение
        this.displayGallery();
        this.updateStats();
        
        // Сохраняем
        this.saveToStorage();
        
        // Показываем уведомление
        this.showNotification(`Изображение "${imageName}" удалено`);
    }

    // Форматирование размера файла
    formatFileSize(bytes) {
        if (typeof bytes !== 'number' || bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Обновление статистики
    updateStats() {
        const totalImages = document.getElementById('totalImages');
        const totalSize = document.getElementById('totalSize');
        const sortOrder = document.getElementById('sortOrder');
        
        if (totalImages) {
            totalImages.textContent = this.images.length;
        }
        
        if (totalSize) {
            const totalBytes = this.images.reduce((sum, img) => sum + (img.size || 0), 0);
            totalSize.textContent = this.formatFileSize(totalBytes);
        }
        
        if (sortOrder) {
            sortOrder.textContent = 'Z→A';
        }
    }

    // Настройка drag and drop
    setupDragAndDrop() {
        const dropZone = document.querySelector('.file-manager');
        if (!dropZone) return;
        
        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.style.borderColor = '#48bb78';
                dropZone.style.transform = 'translateY(-5px)';
                dropZone.style.background = '#f0fff4';
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.style.borderColor = '#cbd5e0';
                dropZone.style.transform = 'translateY(0)';
                dropZone.style.background = '#f7fafc';
            }, false);
        });
        
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length) {
                this.processFiles(Array.from(files));
            }
        }, false);
    }

    // Показ загрузки
    showLoading() {
        const gallery = document.getElementById('gallery');
        if (!gallery) return;
        
        gallery.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 20px; animation: spin 1s linear infinite;">⏳</div>
                <h3>Загрузка изображений...</h3>
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

    // Показ уведомления
    showNotification(message) {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Добавляем стили
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
            animation: notificationSlideIn 0.3s ease;
            font-weight: 500;
            max-width: 400px;
            word-break: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Добавляем стили для анимации если их нет
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes notificationSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes notificationSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'notificationSlideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Показ обратной связи для кнопки
    showButtonFeedback(imageId, message) {
        const card = document.querySelector(`.image-card[data-id="${imageId}"]`);
        if (!card) return;
        
        const button = card.querySelector('.copy-btn');
        if (!button) return;
        
        const originalText = button.innerHTML;
        button.innerHTML = message;
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
    }

    // Очистка всех изображений
    clearAll() {
        if (!confirm('Удалить все изображения из галереи? Это действие нельзя отменить.')) {
            return;
        }
        
        // Очищаем массив
        this.images = [];
        
        // Обновляем отображение
        this.displayGallery();
        this.updateStats();
        
        // Очищаем хранилище
        localStorage.removeItem(this.storageKey);
        
        // Показываем уведомление
        this.showNotification('Все изображения удалены');
    }

    // Проверка состояния хранилища
    checkStorageHealth() {
        try {
            const data = JSON.stringify(this.images);
            const size = new Blob([data]).size;
            const maxSize = 5 * 1024 * 1024; // 5MB
            
            if (size > maxSize * 0.9) { // 90% от лимита
                this.showNotification('⚠️ Хранилище почти заполнено. Рекомендуется удалить старые изображения.');
            }
            
            return {
                size: size,
                items: this.images.length,
                health: size < maxSize * 0.8 ? 'good' : 'warning'
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    // Восстановление поврежденных изображений
    repairImages() {
        let repaired = 0;
        
        this.images = this.images.filter(img => {
            if (!img.data || !img.data.startsWith('data:image/')) {
                console.log('Удалено поврежденное изображение:', img.name);
                return false;
            }
            
            // Проверяем размер Data URL
            if (img.data.length > 10 * 1024 * 1024) { // 10MB
                console.log('Удалено слишком большое изображение:', img.name);
                return false;
            }
            
            repaired++;
            return true;
        });
        
        if (repaired < this.images.length) {
            this.saveToStorage();
            this.displayGallery();
            this.showNotification(`Восстановлено ${repaired} изображений`);
        }
    }
}

// Создаем и экспортируем глобальный объект галереи
window.gallery = new LocalImageGallery();

// Глобальные функции для вызова из HTML
function handleFileSelect(event) {
    window.gallery.handleFileSelect(event);
}

function clearAllImages() {
    window.gallery.clearAll();
}

function repairGallery() {
    window.gallery.repairImages();
}

// Функция для проверки хранилища (можно вызвать из консоли)
function checkStorage() {
    return window.gallery.checkStorageHealth();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('Галерея загружена');
    
    // Проверяем здоровье хранилища
    setTimeout(() => {
        const health = window.gallery.checkStorageHealth();
        if (health.health === 'warning') {
            console.warn('Внимание: хранилище почти заполнено', health);
        }
    }, 2000);
    
    // Добавляем обработчик для восстановления при ошибках
    window.addEventListener('error', (event) => {
        if (event.target && event.target.tagName === 'IMG') {
            console.log('Ошибка загрузки изображения:', event.target.src.substring(0, 100));
        }
    });
});