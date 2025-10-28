document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const galleryContainer = document.getElementById('galleryContainer');
    const resultsList = document.getElementById('resultsList');
    const winnerCard = document.getElementById('winnerCard');
    const winnerImage = document.getElementById('winnerImage');
    const winnerTitle = document.getElementById('winnerTitle');
    const winnerVotes = document.getElementById('winnerVotes');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const pumpkinName = document.getElementById('pumpkinName');
    const previewContainer = document.getElementById('previewContainer');
    const submitBtn = document.getElementById('submitBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const clearGalleryBtn = document.getElementById('clearGalleryBtn');
    const clearResultsBtn = document.getElementById('clearResultsBtn');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Элементы таймера
    const countdownElement = document.getElementById('countdown');
    const countdownFinishedElement = document.getElementById('countdownFinished');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    // Данные приложения
    let pumpkins = JSON.parse(localStorage.getItem('pumpkins')) || [];
    let votes = JSON.parse(localStorage.getItem('votes')) || {};
    let currentUploadedImage = null;
    let countdownInterval = null;
    
    // Инициализация
    initializeGallery();
    updateResults();
    startCountdown();
    updateClearButtons();
    
    // Функция обратного отсчета
    function startCountdown() {
        function updateCountdown() {
            const now = new Date();
            const moscowTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
            
            const targetTime = new Date(moscowTime);
            targetTime.setHours(23, 0, 0, 0);
            
            if (moscowTime >= targetTime) {
                targetTime.setDate(targetTime.getDate() + 1);
            }
            
            const timeDiff = targetTime - moscowTime;
            
            if (timeDiff <= 0) {
                countdownElement.style.display = 'none';
                countdownFinishedElement.style.display = 'block';
                clearInterval(countdownInterval);
                disableVoting();
                return;
            }
            
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            hoursElement.textContent = hours.toString().padStart(2, '0');
            minutesElement.textContent = minutes.toString().padStart(2, '0');
            secondsElement.textContent = seconds.toString().padStart(2, '0');
        }
        
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }
    
    // Отключение голосования
    function disableVoting() {
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Голосование завершено';
        });
    }
    
    // Переключение вкладок
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Загрузка изображения
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.background = '#ffecc7';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.background = '#fff9e6';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.background = '#fff9e6';
        
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });
    
    function handleFile(file) {
        if (!file.type.match('image.*')) {
            alert('Пожалуйста, выберите файл изображения');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            currentUploadedImage = {
                name: file.name,
                url: e.target.result
            };
            
            updatePreview();
        };
        
        reader.readAsDataURL(file);
    }
    
    function updatePreview() {
        previewContainer.innerHTML = '';
        
        if (currentUploadedImage) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            const img = document.createElement('img');
            img.src = currentUploadedImage.url;
            img.alt = currentUploadedImage.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-preview';
            removeBtn.innerHTML = '×';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentUploadedImage = null;
                updatePreview();
            });
            
            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);
            previewContainer.appendChild(previewItem);
        }
    }
    
    // Добавление тыквы
    submitBtn.addEventListener('click', function() {
        if (!currentUploadedImage) {
            alert('Пожалуйста, загрузите фотографию тыквы');
            return;
        }
        
        if (!pumpkinName.value.trim()) {
            alert('Пожалуйста, введите название тыквы');
            return;
        }
        
        const newPumpkin = {
            id: Date.now().toString(),
            name: pumpkinName.value.trim(),
            image: currentUploadedImage.url,
            votes: 0
        };
        
        pumpkins.push(newPumpkin);
        savePumpkins();
        initializeGallery();
        
        // Сброс формы
        currentUploadedImage = null;
        pumpkinName.value = '';
        updatePreview();
        
        alert('Тыква успешно добавлена!');
        
        // Переключение на галерею
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        document.querySelector('.tab[data-tab="gallery"]').classList.add('active');
        document.getElementById('gallery').classList.add('active');
        
        updateClearButtons();
    });
    
    // Инициализация галереи
    function initializeGallery() {
        galleryContainer.innerHTML = '';
        
        if (pumpkins.length === 0) {
            galleryContainer.innerHTML = `
                <div style="text-align: center; width: 100%; padding: 40px; color: #5a2d0c;">
                    <i class="fas fa-pumpkin" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p style="font-size: 1.3rem;">Пока нет тыкв. Добавьте первую!</p>
                </div>
            `;
            return;
        }
        
        pumpkins.forEach(pumpkin => {
            const pumpkinCard = document.createElement('div');
            pumpkinCard.className = 'pumpkin-card';
            pumpkinCard.innerHTML = `
                <img src="${pumpkin.image}" alt="${pumpkin.name}" class="pumpkin-image">
                <div class="pumpkin-info">
                    <h3 class="pumpkin-name">${pumpkin.name}</h3>
                    <div class="vote-section">
                        <button class="vote-btn ${votes[pumpkin.id] ? 'voted' : ''}" data-id="${pumpkin.id}">
                            ${votes[pumpkin.id] ? '🎃 Проголосовано' : '🎃 Голосовать'}
                        </button>
                        <div class="votes-count">${pumpkin.votes} голосов</div>
                    </div>
                </div>
            `;
            
            galleryContainer.appendChild(pumpkinCard);
        });
        
        // Обработчики голосования
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const pumpkinId = this.getAttribute('data-id');
                voteForPumpkin(pumpkinId);
            });
        });
    }
    
    // Голосование за тыкву
    function voteForPumpkin(pumpkinId) {
        if (votes[pumpkinId]) {
            alert('Вы уже голосовали за эту тыкву!');
            return;
        }
        
        const pumpkinIndex = pumpkins.findIndex(p => p.id === pumpkinId);
        if (pumpkinIndex !== -1) {
            pumpkins[pumpkinIndex].votes += 1;
            votes[pumpkinId] = true;
            
            savePumpkins();
            saveVotes();
            
            initializeGallery();
            updateResults();
            
            alert('Спасибо за ваш голос!');
            updateClearButtons();
        }
    }
    
    // Обновление результатов
    function updateResults() {
        resultsList.innerHTML = '';
        
        if (pumpkins.length === 0) {
            resultsList.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #5a2d0c;">
                    <p>Пока нет тыкв для голосования.</p>
                </div>
            `;
            winnerCard.style.display = 'none';
            return;
        }
        
        const sortedPumpkins = [...pumpkins].sort((a, b) => b.votes - a.votes);
        const winner = sortedPumpkins[0];
        
        if (winner.votes > 0) {
            winnerImage.src = winner.image;
            winnerTitle.textContent = winner.name;
            winnerVotes.textContent = `${winner.votes} голосов`;
            winnerCard.style.display = 'flex';
        } else {
            winnerCard.style.display = 'none';
        }
        
        sortedPumpkins.forEach((pumpkin, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <div class="result-rank">${index + 1}</div>
                <img src="${pumpkin.image}" alt="${pumpkin.name}" class="result-image">
                <div class="result-details">
                    <div class="result-name">${pumpkin.name}</div>
                    <div class="result-votes">${pumpkin.votes} голосов</div>
                </div>
            `;
            resultsList.appendChild(resultItem);
        });
    }
    
    // Функции очистки
    function clearAllData() {
        if (confirm('Вы уверены, что хотите удалить ВСЕ тыквы и результаты голосования?')) {
            pumpkins = [];
            votes = {};
            localStorage.removeItem('pumpkins');
            localStorage.removeItem('votes');
            
            initializeGallery();
            updateResults();
            updateClearButtons();
            
            alert('Все данные успешно очищены!');
        }
    }
    
    function clearGallery() {
        if (confirm('Вы уверены, что хотите удалить все тыквы?')) {
            pumpkins = [];
            localStorage.setItem('pumpkins', JSON.stringify(pumpkins));
            
            initializeGallery();
            updateResults();
            updateClearButtons();
            
            alert('Галерея успешно очищена!');
        }
    }
    
    function clearResults() {
        if (confirm('Вы уверены, что хотите сбросить все голоса?')) {
            pumpkins.forEach(pumpkin => {
                pumpkin.votes = 0;
            });
            votes = {};
            
            localStorage.setItem('pumpkins', JSON.stringify(pumpkins));
            localStorage.setItem('votes', JSON.stringify(votes));
            
            initializeGallery();
            updateResults();
            updateClearButtons();
            
            alert('Результаты успешно сброшены!');
        }
    }
    
    function updateClearButtons() {
        const hasPumpkins = pumpkins.length > 0;
        const hasVotes = Object.keys(votes).length > 0;
        
        clearGalleryBtn.style.display = hasPumpkins ? 'block' : 'none';
        clearResultsBtn.style.display = hasVotes ? 'block' : 'none';
    }
    
    // Обработчики кнопок очистки
    clearAllBtn.addEventListener('click', clearAllData);
    clearGalleryBtn.addEventListener('click', clearGallery);
    clearResultsBtn.addEventListener('click', clearResults);
    
    // Сохранение данных
    function savePumpkins() {
        localStorage.setItem('pumpkins', JSON.stringify(pumpkins));
    }
    
    function saveVotes() {
        localStorage.setItem('votes', JSON.stringify(votes));
    }
});