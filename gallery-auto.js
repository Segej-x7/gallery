// АВТОМАТИЧЕСКАЯ ГАЛЕРЕЯ - берет ВСЕ картинки из GitHub
class AutoGitHubGallery {
    constructor() {
        this.images = [];
        this.repoOwner = 'Segej-x7';
        this.repoName = 'gallery';
        this.imagesFolder = 'images/';
        this.init();
    }

    async init() {
        this.showLoading();
        await this.loadAllImages();
        this.displayGallery();
        this.updateStats();
    }

    // ГЛАВНАЯ ФУНКЦИЯ: Загружает ВСЕ картинки
    async loadAllImages() {
        try {
            console.log('🔄 Загружаем картинки из GitHub...');
            
            // 1. Пробуем GitHub API (самый точный способ)
            const apiImages = await this.loadViaGitHubAPI();
            if (apiImages.length > 0) {
                this.images = apiImages;
                this.sortImages();
                console.log(`✅ Загружено через API: ${this.images.length} картинок`);
                return;
            }
            
            // 2. Если API не работает - пробуем прямое сканирование
            const directImages = await this.loadViaDirectScan();
            if (directImages.length > 0) {
                this.images = directImages;
                this.sortImages();
                console.log(`✅ Загружено через прямое сканирование: ${this.images.length} картинок`);
                return;
            }
            
            // 3. Если ничего не нашли
            throw new Error('Картинки не найдены');
            
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            this.showError(error.message);
        }
    }

    // Способ 1: Через GitHub API (самый правильный)
    async loadViaGitHubAPI() {
        try {
            const apiUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.imagesFolder}`;
            console.log('🔗 Запрос к API:', apiUrl);
            
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`API ответил: ${response.status}`);
            
            const files = await response.json();
            
            return files
                .filter(file => 
                    file.type === 'file' && 
                    this.isImageFile(file.name)
                )
                .map(file => ({
                    id: file.sha,
                    name: file.name,
                    url: file.download_url,
                    size: file.size,
                    extension: file.name.split('.').pop().toLowerCase(),
                    date: new Date().toISOString()
                }));
                
        } catch (error) {
            console.log('GitHub API недоступен:', error.message);
            return [];
        }
    }

    // Способ 2: Прямое сканирование файлов (работает всегда)
    async loadViaDirectScan() {
        const images = [];
        const imageNames = await this.guessImageNames();
        
        console.log('🔍 Сканируем возможные файлы:', imageNames);
        
        // Проверяем каждый возможный файл
        for (const imageName of imageNames) {
            try {
                const imageUrl = `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/main/${this.imagesFolder}${imageName}`;
                const exists = await this.checkImageExists(imageUrl);
                
                if (exists) {
                    images.push({
                        id: Date.now() + Math.random(),
                        name: imageName,
                        url: imageUrl,
                        size: 0, // Не знаем размер без API
                        extension: imageName.split('.').pop().toLowerCase(),
                        date: new Date().toISOString()
                    });
                    console.log(`✅ Найдена картинка: ${imageName}`);
                }
            } catch (e) {
                // Просто пропускаем
            }
        }
        
        return images;
    }

    // Угадываем возможные имена файлов
    async guessImageNames() {
        // Список самых распространенных имен
        const commonNames = [
            'image.jpg', 'photo.jpg', 'picture.png', 'img.jpg',
            'photo1.jpg', 'photo2.jpg', 'image1.png', 'image2.png',
            'cat.jpg', 'dog.png', 'nature.jpg', 'photo2024.jpg'
        ];
        
        // Или пытаемся получить список из файла
        try {
            const listUrl = `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/main/images-list.txt`;
            const response = await fetch(listUrl);
            if (response.ok) {
                const text = await response.text();
                return text.split('\n').filter(name => name.trim());
            }
        } catch (e) {
            // Файла нет, используем стандартные имена
        }
        
        return commonNames;
    }

    // Проверяем существует ли картинка
    async checkImageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok && response.headers.get('content-type')?.startsWith('image/');
        } catch (e) {
            return false;
        }
    }

    // Проверяем расширение файла
    isImageFile(filename) {
        return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename);
    }

    // СОРТИРОВКА от Z до A
    sortImages() {
        this.images.sort((a, b) => b.name.localeCompare(a.name, 'ru'));
    }

    // Отображение галереи
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

    // Создаем карточку картинки
    createImageCard(image) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `
            <div class="image-container">
                <img src="${image.url}" 
                     alt="${image.name}" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\"><rect width=\"100%\" height=\"100%\" fill=\"%23f0f0f0\"/><text x=\"50%\" y=\"50%\" font-family=\"Arial\" fill=\"%23666\" text-anchor=\"middle\" dy=\".3em\">Не загружено</text></svg>'">
            </div>
            <div class="image-info">
                <div class="image-name">${image.name}</div>
                <div class="image-size">${image.extension.toUpperCase()}</div>
                <button onclick="copyToClipboard('${image.url}')" class="copy-btn">
                    📋 Копировать ссылку
                </button>
            </div>
        `;
        return card;
    }

    // Обновляем статистику
    updateStats() {
        document.getElementById('totalImages').textContent = this.images.length;
        document.getElementById('totalSize').textContent = this.images.length > 0 ? 'Авто' : '0 KB';
    }

    showLoading() {
        document.getElementById('gallery').innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:50px">
                <div style="font-size:40px">🔄</div>
                <h3>Сканирую папку images/ на GitHub...</h3>
                <p>Ищу все картинки</p>
            </div>
        `;
    }

    showError(msg) {
        document.getElementById('gallery').innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:50px">
                <div style="font-size:40px">❌</div>
                <h3>${msg}</h3>
                <p>Загрузи картинки в папку <code>images/</code> на GitHub</p>
                <button onclick="location.reload()" style="padding:10px 20px;margin-top:20px">
                    🔄 Попробовать снова
                </button>
            </div>
        `;
    }
}

// Глобальная функция копирования
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert('✅ Ссылка скопирована!\n' + text))
        .catch(() => {
            const input = document.createElement('input');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            alert('✅ Ссылка скопирована!');
        });
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new AutoGitHubGallery();
    
    // Добавляем кнопку обновления
    const stats = document.querySelector('.stats');
    if (stats) {
        const btn = document.createElement('button');
        btn.innerHTML = '🔄 Обновить';
        btn.onclick = () => {
            window.gallery = new AutoGitHubGallery();
        };
        btn.style.cssText = `
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
        `;
        stats.appendChild(btn);
    }
});

// Функция для принудительного обновления
function forceReload() {
    localStorage.removeItem('githubGalleryCache');
    window.gallery = new AutoGitHubGallery();
}