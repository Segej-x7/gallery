// Опциональный скрипт для экспорта/импорта галереи
// Сохраните этот код в файл backup-script.js

(function() {
    'use strict';
    
    // Проверяем, есть ли объект галереи
    if (!window.gallery) {
        console.error('Галерея не инициализирована!');
        return;
    }
    
    // Создаем панель управления
    function createBackupPanel() {
        const panel = document.createElement('div');
        panel.id = 'backupPanel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border: 2px solid #667eea;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            min-width: 300px;
        `;
        
        panel.innerHTML = `
            <div style="margin-bottom: 15px; font-weight: bold; color: #2d3748; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                🔧 Панель резервного копирования
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="font-size: 0.9em; color: #718096; margin-bottom: 5px;">Экспорт галереи:</div>
                <button id="exportBtn" style="width: 100%; padding: 8px; background: linear-gradient(135deg, #48bb78, #38a169); color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 10px;">
                    💾 Экспортировать в JSON
                </button>
                <button id="exportCompactBtn" style="width: 100%; padding: 8px; background: linear-gradient(135deg, #4299e1, #3182ce); color: white; border: none; border-radius: 5px; cursor: pointer;">
                    📦 Экспорт (только ссылки)
                </button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="font-size: 0.9em; color: #718096; margin-bottom: 5px;">Импорт галереи:</div>
                <input type="file" id="importFile" accept=".json" style="display: none;">
                <button id="importBtn" style="width: 100%; padding: 8px; background: linear-gradient(135deg, #ed8936, #dd6b20); color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 10px;">
                    📥 Импортировать из JSON
                </button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="font-size: 0.9em; color: #718096; margin-bottom: 5px;">Очистка:</div>
                <button id="clearBtn" style="width: 100%; padding: 8px; background: linear-gradient(135deg, #f56565, #e53e3e); color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🗑️ Очистить localStorage
                </button>
            </div>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 0.8em; color: #718096;">
                <div>Изображений: <span id="imageCount">0</span></div>
                <div>Размер хранилища: <span id="storageSize">0 KB</span></div>
            </div>
            
            <div style="position: absolute; top: 10px; right: 10px; cursor: pointer;" onclick="document.getElementById('backupPanel').style.display = 'none'">
                ✕
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Обработчики событий
        document.getElementById('exportBtn').onclick = exportFullGallery;
        document.getElementById('exportCompactBtn').onclick = exportCompactGallery;
        document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
        document.getElementById('clearBtn').onclick = clearLocalStorage;
        document.getElementById('importFile').onchange = importGallery;
        
        // Обновляем статистику
        updateBackupStats();
    }
    
    // Обновление статистики
    function updateBackupStats() {
        const countElement = document.getElementById('imageCount');
        const sizeElement = document.getElementById('storageSize');
        
        if (countElement && sizeElement) {
            countElement.textContent = window.gallery.images.length;
            
            try {
                const storageSize = JSON.stringify(window.gallery.images).length;
                sizeElement.textContent = formatSize(storageSize);
            } catch (error) {
                sizeElement.textContent = 'Ошибка';
            }
        }
    }
    
    // Форматирование размера
    function formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Экспорт полной галереи
    function exportFullGallery() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            images: window.gallery.images,
            totalImages: window.gallery.images.length,
            metadata: {
                gallery: 'Local Image Gallery',
                created: new Date().toISOString()
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gallery-full-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showMessage('✅ Галерея экспортирована');
    }
    
    // Компактный экспорт (только ссылки)
    function exportCompactGallery() {
        const compactData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            images: window.gallery.images.map(img => ({
                name: img.name,
                size: img.size,
                type: img.type,
                date: img.date
                // Не включаем данные изображения для экономии места
            })),
            totalImages: window.gallery.images.length
        };
        
        const blob = new Blob([JSON.stringify(compactData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gallery-links-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showMessage('✅ Ссылки на изображения экспортированы');
    }
    
    // Импорт галереи
    function importGallery(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm(`Импортировать ${data.images ? data.images.length : 0} изображений?`)) {
                    // Здесь можно добавить логику импорта
                    console.log('Данные для импорта:', data);
                    showMessage('⚠️ Импорт требует дополнительной реализации');
                }
            } catch (error) {
                showMessage('❌ Ошибка чтения файла');
                console.error(error);
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    }
    
    // Очистка localStorage
    function clearLocalStorage() {
        if (confirm('Очистить все данные галереи? Это действие нельзя отменить.')) {
            localStorage.removeItem('localImageGallery');
            window.location.reload();
        }
    }
    
    // Показ сообщения
    function showMessage(message) {
        const msg = document.createElement('div');
        msg.textContent = message;
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10001;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            msg.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => msg.remove(), 300);
        }, 3000);
        
        // Добавляем стили для анимации
        if (!document.querySelector('#backup-styles')) {
            const style = document.createElement('style');
            style.id = 'backup-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(0); opacity: 1; }
                    to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Инициализация панели
    function initBackupPanel() {
        // Ждем загрузки галереи
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(createBackupPanel, 1000);
            });
        } else {
            setTimeout(createBackupPanel, 1000);
        }
        
        // Обновляем статистику каждые 5 секунд
        setInterval(updateBackupStats, 5000);
    }
    
    // Добавляем кнопку для открытия панели
    function addToolbarButton() {
        const button = document.createElement('button');
        button.id = 'backupToolbarBtn';
        button.title = 'Панель резервного копирования';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            cursor: pointer;
            font-size: 20px;
            z-index: 9999;
            transition: transform 0.3s;
        `;
        button.innerHTML = '💾';
        button.onclick = () => {
            const panel = document.getElementById('backupPanel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                updateBackupStats();
            }
        };
        button.onmouseover = () => button.style.transform = 'scale(1.1)';
        button.onmouseout = () => button.style.transform = 'scale(1)';
        
        document.body.appendChild(button);
    }
    
    // Запуск
    initBackupPanel();
    addToolbarButton();
    
})();