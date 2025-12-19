// ============================================================================
// 🚀 АВТОМАТИЧЕСКАЯ ГАЛЕРЕЯ ДЛЯ GITHUB
// Загружает ВСЕ картинки из папки images/ репозитория
// Работает БЕЗ ручного указания файлов!
// ============================================================================

class AutoGitHubGallery {
    constructor() {
        // Настройки вашего репозитория
        this.config = {
            repoOwner: 'Segej-x7',           // Ваш username на GitHub
            repoName: 'gallery',              // Название репозитория
            imagesFolder: 'images/',          // Папка с картинками
            githubPagesUrl: 'https://segej-x7.github.io/gallery/', // Ваш GitHub Pages URL
            scanAttempts: 3,                  // Количество попыток сканирования
            cacheTime: 5 * 60 * 1000,         // Кэш на 5 минут
            maxImages: 1000                   // Максимальное количество картинок
        };
        
        this.images = [];                     // Массив найденных картинок
        this.isLoading = false;               // Флаг загрузки
        this.cacheKey = 'githubGalleryCache'; // Ключ для localStorage кэша
        
        this.init();
    }
    
    // Инициализация галереи
    async init() {
        console.log('🚀 Инициализация авто-галереи...');
        this.updateStatus('🔍 Начинаю поиск картинок...');
        
        // Показываем загрузку
        this.showLoading();
        
        // Загружаем картинки
        await this.scanGitHubImages();
        
        // Обновляем статистику
        this.updateStats();
        
        // Запускаем автообновление
        this.startAutoRefresh();
    }
    
    // ============================================================================
    // 🔍 ОСНОВНАЯ ФУНКЦИЯ: Сканирует GitHub и находит ВСЕ картинки
    // ============================================================================
    async scanGitHubImages() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.updateStatus('🔍 Сканирую GitHub...');
        
        try {
            console.log('🔄 Начинаю сканирование папки images/...');
            
            // 1. Проверяем кэш
            const cached = this.getCachedImages();
            if (cached && cached.length > 0) {
                console.log('📦 Использую кэшированные данные...');
                this.images = cached;
                this.displayGallery();
                this.updateStatus('✅ Загружено из кэша');
            }
            
            // 2. Пробуем разные методы сканирования
            let foundImages = [];
            
            // Метод 1: GitHub API (самый точный)
            foundImages = await this.scanViaGitHubAPI();
            
            // Метод 2: Raw GitHub URLs
            if (foundImages.length === 0) {
                foundImages = await this.scanViaRawUrls();
            }
            
            // Метод 3: GitHub Pages URLs
            if (foundImages.length === 0) {
                foundImages = await this.scanViaGitHubPages();
            }
            
            // Метод 4: Прямое сканирование
            if (foundImages.length === 0) {
                foundImages = await this.scanDirect();
            }
            
            // 3. Обрабатываем результаты
            if (foundImages.length > 0) {
                console.log(`🎉 Найдено картинок: ${foundImages.length}`);
                this.images = foundImages;
                this.sortImages(); // Сортировка Z→A
                this.saveToCache(); // Сохраняем в кэш
                this.displayGallery();
                this.updateStatus('✅ Готово');
                this.showNotification(`Найдено ${foundImages.length} картинок!`);
            } else {
                console.log('❌ Картинки не найдены');
                this.showNoImages();
                this.updateStatus('❌ Нет картинок');
            }
            
        } catch (error) {
            console.error('💥 Ошибка сканирования:', error);
            this.showError(error.message);
            this.updateStatus('❌ Ошибка');
        } finally {
            this.isLoading = false;
            this.updateLastUpdateTime();
        }
    }
    
    // ============================================================================
    // 📡 МЕТОДЫ СКАНИРОВАНИЯ (4 разных способа)
    // ============================================================================
    
    // Метод 1: GitHub API (лучший способ)
    async scanViaGitHubAPI() {
        try {
            console.log('📡 Пробую GitHub API...');
            const apiUrl = `https://api.github.com/repos/${this.config.repoOwner}/${this.config.repoName}/contents/${this.config.imagesFolder}`;
            
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'AutoGitHubGallery/1.0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API: ${response.status}`);
            }
            
            const files = await response.json();
            const images = [];
            
            for (const file of files) {
                if (file.type === 'file' && this.isImageFile(file.name)) {
                    images.push({
                        id: file.sha,
                        name: file.name,
                        url: file.download_url,
                        rawUrl: `https://raw.githubusercontent.com/${this.config.repoOwner}/${this.config.repoName}/main/${this.config.imagesFolder}${file.name}`,
                        pagesUrl: `${this.config.githubPagesUrl}${this.config.imagesFolder}${file.name}`,
                        size: file.size,
                        extension: file.name.split('.').pop().toLowerCase(),
                        date: new Date().toISOString(),
                        source: 'github-api'
                    });
                }
            }
            
            console.log(`✅ GitHub API: ${images.length} картинок`);
            return images;
            
        } catch (error) {
            console.log('GitHub API недоступен:', error.message);
            return [];
        }
    }
    
    // Метод 2: Raw GitHub URLs
    async scanViaRawUrls() {
        try {
            console.log('🌐 Пробую Raw GitHub URLs...');
            
            // Пробуем получить список файлов через raw.githubusercontent.com
            const listUrl = `https://raw.githubusercontent.com/${this.config.repoOwner}/${this.config.repoName}/main/${this.config.imagesFolder}/_files.txt`;
            
            // Сначала пробуем получить текстовый файл со списком
            const response = await fetch(listUrl);
            if (response.ok) {
                const text = await response.text();
                const fileNames = text.split('\n').filter(name => name.trim());
                
                return await this.checkImagesFromList(fileNames, 'raw-list');
            }
            
            // Если файла нет, пробуем сканировать стандартные имена
            return await this.scanCommonNames('raw');
            
        } catch (error) {
            console.log('Raw URLs недоступны:', error.message);
            return [];
        }
    }
    
    // Метод 3: GitHub Pages URLs
    async scanViaGitHubPages() {
        try {
            console.log('🌍 Пробую GitHub Pages...');
            
            const baseUrl = this.config.githubPagesUrl + this.config.imagesFolder;
            const commonNames = this.generateCommonNames();
            
            const images = [];
            
            // Проверяем каждое возможное имя
            for (const name of commonNames) {
                const imgUrl = baseUrl + name;
                const exists = await this.checkImageExists(imgUrl);
                
                if (exists) {
                    images.push({
                        id: Date.now() + Math.random(),
                        name: name,
                        url: imgUrl,
                        rawUrl: `https://raw.githubusercontent.com/${this.config.repoOwner}/${this.config.repoName}/main/${this.config.imagesFolder}${name}`,
                        pagesUrl: imgUrl,
                        size: 0,
                        extension: name.split('.').pop().toLowerCase(),
                        date: new Date().toISOString(),
                        source: 'pages-scan'
                    });
                }
            }
            
            console.log(`✅ GitHub Pages: ${images.length} картинок`);
            return images;
            
        } catch (error) {
            console.log('GitHub Pages недоступен:', error.message);
            return [];
        }
    }
    
    // Метод 4: Прямое сканирование
    async scanDirect() {
        console.log('🔦 Прямое сканирование...');
        
        // Генерируем список возможных имен файлов
        const possibleNames = this.generatePossibleNames();
        const images = [];
        
        // Проверяем каждое имя через разные источники
        for (const name of possibleNames) {
            // Пробуем разные URL
            const urls = [
                `https://raw.githubusercontent.com/${this.config.repoOwner}/${this.config.repoName}/main/${this.config.imagesFolder}${name}`,
                `${this.config.githubPagesUrl}${this.config.imagesFolder}${name}`,
                `https://github.com/${this.config.repoOwner}/${this.config.repoName}/raw/main/${this.config.imagesFolder}${name}`
            ];
            
            for (const url of urls) {
                const exists = await this.checkImageExists(url);
                if (exists) {
                    images.push({
                        id: Date.now() + Math.random(),
                        name: name,
                        url: url,
                        rawUrl: `https://raw.githubusercontent.com/${this.config.repoOwner}/${this.config.repoName}/main/${this.config.imagesFolder}${name}`,
                        pagesUrl: `${this.config.githubPagesUrl}${this.config.imagesFolder}${name}`,
                        size: 0,
                        extension: name.split('.').pop().toLowerCase(),
                        date: new Date().toISOString(),
                        source: 'direct-scan'
                    });
                    break;
                }
            }
        }
        
        console.log(`✅ Прямое сканирование: ${images.length} картинок`);
        return images;
    }
    
    // ============================================================================
    // 🛠️ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================================
    
    // Генерация возможных имен файлов
    generatePossibleNames() {
        const prefixes = [
            'photo', 'image', 'picture', 'img', 'pic', 'snap', 'shot',
            'photo1', 'photo2', 'photo3', 'image1', 'image2', 'img1', 'img2',
            'cat', 'dog', 'nature', 'landscape', 'portrait', 'art', 'design',
            'screenshot', 'screen', 'wallpaper', 'background', 'cover',
            'zebra', 'yogurt', 'xray', 'whale', 'violet', 'ultra', 'tiger',
            'sample', 'test', 'demo', 'example', 'illustration'
        ];
        
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        const possibleNames = [];
        
        // Основные комбинации
        for (const prefix of prefixes.slice(0, 20)) {
            for (const ext of extensions) {
                possibleNames.push(`${prefix}.${ext}`);
                possibleNames.push(`${prefix}1.${ext}`);
                possibleNames.push(`${prefix}2.${ext}`);
                possibleNames.push(`${prefix}_large.${ext}`);
                possibleNames.push(`${prefix}_small.${ext}`);
            }
        }
        
        // Добавляем случайные числа
        for (let i = 1; i <= 50; i++) {
            for (const ext of extensions) {
                possibleNames.push(`${i}.${ext}`);
                possibleNames.push(`img${i}.${ext}`);
                possibleNames.push(`photo${i}.${ext}`);
                possibleNames.push(`picture${i}.${ext}`);
            }
        }
        
        // Убираем дубликаты и ограничиваем количество
        return [...new Set(possibleNames)].slice(0, 500);
    }
    
    // Генерация распространенных имен
    generateCommonNames() {
        return [
            'image.jpg', 'photo.jpg', 'picture.png', 'img.jpg', 'photo1.jpg',
            'photo2.jpg', 'image1.png', 'image2.png', 'cat.jpg', 'dog.png',
            'nature.jpg', 'landscape.png', 'screenshot.png', 'wallpaper.jpg',
            'background.jpg', 'cover.jpg', 'avatar.png', 'logo.png', 'icon.jpg'
        ];
    }
    
    // Проверка существования картинки
    async checkImageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url + '?t=' + Date.now(); // Добавляем timestamp для избежания кэша
            
            // Таймаут 3 секунды
            setTimeout(() => resolve(false), 3000);
        });
    }
    
    // Проверка списка изображений
    async checkImagesFromList(fileNames, source) {
        const images = [];
        
        for (const fileName of fileNames) {
            if (!this.isImageFile(fileName)) continue;
            
            const urls = [
                `https://raw.githubusercontent.com/${this.config.repoOwner}/${this.config.repoName}/main/${this.config.imagesFolder}${fileName}`,
                `${this.config.githubPagesUrl}${this.config.imagesFolder}${fileName}`
            ];
            
            for (const url of urls) {
                const exists = await this.checkImageExists(url);
                if