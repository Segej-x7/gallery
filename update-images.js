// Скрипт для обновления списка изображений
// Запустите этот код в консоли браузера на странице галереи

async function updateImageList() {
    // Получаем список файлов из папки images
    const imageFiles = [
        // Вставьте сюда список ваших файлов из папки images
        // Пример:
        // {name: 'photo1.jpg', size: 245760},
        // {name: 'photo2.png', size: 153600},
    ];
    
    // Создаем JavaScript файл с этим списком
    const jsContent = `
        // Автоматически сгенерированный список изображений
        window.imageList = ${JSON.stringify(imageFiles, null, 2)};
        
        // Сохранение в localStorage для галереи
        localStorage.setItem('githubImageList', JSON.stringify(imageList));
        
        console.log('Список изображений обновлен:', imageList.length, 'файлов');
    `;
    
    // Скачиваем файл
    const blob = new Blob([jsContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images-list.js';
    a.click();
    
    console.log('Файл images-list.js создан. Загрузите его в корень репозитория.');
}

// Или создайте файл images.json вручную
function createImageListManually() {
    const imageList = [
        // Пример структуры:
        {
            "name": "ваш-файл.jpg",
            "size": 245760, // размер в байтах
            "type": "image/jpeg"
        }
    ];
    
    console.log('Создайте файл images.json с содержимым:');
    console.log(JSON.stringify(imageList, null, 2));
}