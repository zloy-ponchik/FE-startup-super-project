
// Основная логика Расширения

// Переменные для кнопки
let copyButton = null;
let currentSelectionRange = null;
let currentSelectedText = '';

// Время анимации исчезновения кнопки
const ANIMATION_DURATION = 200;

// Переменные для popup
let floatingPopupElement = null;
let floatingPopupContentElement = null;
let floatingPopupCloseButtonElement = null;
let popupStylesApplied = false; 


// CSS-правила для анимации исчезновения
const COPY_BUTTON_REMOVE_STYLE = `
  @keyframes fadeOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.9); }
  }
  .copy-button-fade-out {
    animation: fadeOut ${ANIMATION_DURATION}ms ease-out forwards;
  }

  .show-text-popup-button {
    position: absolute;
    z-index: 10000;
    height: 35px;
    border: '2px solid #3ac4ffbb';
    background-color: '#ffffff';
    cursor: 'pointer';
    border-radius: '3px';
    font-family: 'sans-serif';
    font-size: '16px';
    white-space: 'nowrap';
}

`;

// Внедряем стили для анимации (если еще не внедрены)
if (!document.getElementById('copy-button-animation-styles')) {
  const style = document.createElement('style');
  style.id = 'copy-button-animation-styles';
  style.textContent = COPY_BUTTON_REMOVE_STYLE;
  document.head.appendChild(style);
}

// Встроенный HTML и CSS для popup 
const POPUP_HTML_CONTENT = `
<div id="dynamic-text-popup">
  <div class="popup-header">
    <h3 id="popup-title">НейроShlapa</h3> 
    <button id="popup-close-button" title="Close">&times;</button>
  </div>
  <div id="popup-text-content">
    
    <p class="loading-message">Ожидание ответа...</p> 
  </div>
</div>
`;

const POPUP_CSS_CONTENT = `
/* popup_template/popup.css */

@keyframes fadeOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.9); }
}
@keyframes fadeIn {
    from { opacity: 0; transform: scale(1); }
    to { opacity: 1; transform: scale(0.9); }
}
.popup-fade-out {
    animation: fadeOut ${ANIMATION_DURATION}ms ease-out forwards;
}
.popup-fade-in {
    animation: fadeIn ${ANIMATION_DURATION}ms ease-out forwards;
}
#dynamic-text-popup {
  position: fixed; 
  z-index: 10001; 
  background-color: #fff; 
  border: 1px solid #ccc;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3); 
  border-radius: 5px; 
  padding: 15px; 
  max-width: 400px; 
  max-height: 300px; 
  overflow-y: auto; 
  color: #333; 
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.popup-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: #333;
}

#popup-close-button {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #aaa;
  line-height: 1;
  padding: 0 5px;
}

#popup-close-button:hover {
  color: #888;
}

#popup-text-content {
  font-family: sans-serif;
  font-size: 14px;
  white-space: pre-wrap;
  color: #555;
}
  .popup-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: #333;
}

/* Убираем стиль для заголовка, если он был только для "Selected Text" */
/* ... */

#popup-text-content {
  font-family: sans-serif;
  font-size: 14px;
  white-space: pre-wrap; /* Сохраняет пробелы и переносы строк */
  color: #555;
  max-height: 200px; /* Ограничим высоту, чтобы не было слишком громоздко */
  overflow-y: auto;  /* Добавим скролл, если контента много */
  padding-right: 5px; /* Небольшой отступ для скроллбара */
}

.loading-message {
  color: #888;
  font-style: italic;
}

.error-message {
  color: red;
  font-weight: bold;
}
`;
//  Конец встроенного содержимого 


// --- Адрес вашего бэкенд-сервиса ---
const BACKEND_API_URL = 'http://localhost:8080/explain'; 

// Функции для создания и управления  popup 

async function createFloatingPopup(text) {
  if (floatingPopupElement) {
    removeFloatingPopup();
  }

  try {
    // Внедряем стили напрямую
    if (!popupStylesApplied) {
      const styleElement = document.createElement('style');
      styleElement.textContent = POPUP_CSS_CONTENT;
      document.head.appendChild(styleElement);
      popupStylesApplied = true;
    }

    // DOM-элемент для popup из HTML строки
    const tempContainer = document.createElement('div');
    tempContainer.id = 'temp-popup-container';
    tempContainer.style.display = 'none';
    tempContainer.innerHTML = POPUP_HTML_CONTENT;

    document.body.appendChild(tempContainer);

    const popupFragment = tempContainer.querySelector('#dynamic-text-popup');
    if (!popupFragment) {
      console.error("Could not find element with id '#dynamic-text-popup' within the temporary container.");
      if (tempContainer.parentNode) {
        tempContainer.remove();
      }
      return null;
    }

    if (tempContainer.parentNode) {
      tempContainer.remove();
    }

    floatingPopupElement = popupFragment.cloneNode(true);
    floatingPopupElement.id = 'dynamic-text-popup';

    floatingPopupContentElement = floatingPopupElement.querySelector('#popup-text-content');
    floatingPopupCloseButtonElement = floatingPopupElement.querySelector('#popup-close-button');

    if (!floatingPopupContentElement) {
      console.error("Could not find '#popup-text-content' within the cloned popup element.");
      return null;
    }
    if (!floatingPopupCloseButtonElement) {
      console.error("Could not find '#popup-close-button' within the cloned popup element.");
      return null;
    }

    floatingPopupCloseButtonElement.addEventListener('click', removeFloatingPopup);

    //  Вставка текста и позиционирование 
    if (floatingPopupContentElement) {
      floatingPopupContentElement.innerHTML = '<p class="loading-message">Ожидание ответа...</p>'; // Показываем сообщение о загрузке
    }

  floatingPopupElement.classList.add('popup-fade-in');
    setTimeout(() => {
       document.body.appendChild(floatingPopupElement);
        positionFloatingPopup();
    window.addEventListener('resize', positionFloatingPopup);
    }, ANIMATION_DURATION);

    // --- ОТПРАВКА ЗАПРОСА НА БЭКЕНД ---
    const explanation = await fetchExplanation(text);
    if (explanation) {
      floatingPopupContentElement.innerHTML = explanation; // Вставляем ответ от бэкенда
    } else {
      // Отображаем сообщение об ошибке, если запрос не удался
      floatingPopupContentElement.innerHTML = '<p class="error-message">Не удалось загрузить ответ. Пожалуйста, попробуйте позже.</p>';
    }
    // --- КОНЕЦ ОТПРАВКИ ЗАПРОСА ---

    positionFloatingPopup(); // Позиционируем popup после обновления контента
    window.addEventListener('resize', positionFloatingPopup);

    return floatingPopupElement;

  } catch (error) {
    console.error("Error creating popup element:", error);
    return null;
  }
}

// --- НОВАЯ ФУНКЦИЯ: Запрос к бэкенду ---
async function fetchExplanation(textToSend) {
  if (!textToSend || textToSend.trim().length === 0) {
    console.warn("No text provided for explanation.");
    return null;
  }

  try {
    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: textToSend }), // Формируем JSON-тело
    });

    if (!response.ok) {
      // Обрабатываем ошибки сервера (400, 404, 500 и т.д.)
      const errorDetails = await response.text(); // Пытаемся получить детали ошибки
      console.error(`HTTP error! status: ${response.status}. Details: ${errorDetails}`);
      // Можно вернуть более информативное сообщение пользователю
      return `Error: ${response.status} (${response.statusText}). ${errorDetails.substring(0, 100)}...`;
    }

    const data = await response.json(); // Парсим JSON-ответ
    console.log("Backend response:", data);

    // Ожидаем, что бэкенд вернет объект с полем 'explanation' (или как там у вас называется)
    // Замените 'explanation' на реальное имя поля в ответе вашего бэкенда.
    // Например, если ответ: {"result": "Объяснение..."} то будет data.result
    if (data && data.explanation) {
      return data.explanation; // Возвращаем полученное объяснение
    } else {
      console.warn("Backend response did not contain an 'explanation' field.");
      return "No explanation found in the response.";
    }

  } catch (error) {
    console.error("Error during fetch to backend:", error);
    return null; // Возвращаем null, чтобы отобразить сообщение об ошибке
  }
}



function positionFloatingPopup() {
  if (!floatingPopupElement) return; // Проверяем, что элемент существует

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const popupWidth = floatingPopupElement.offsetWidth;
  const popupHeight = floatingPopupElement.offsetHeight;

  let top = 20;
  let left = (viewportWidth / 2) - (popupWidth / 2);

  if (left < 10) left = 10;
  if (left + popupWidth > viewportWidth - 10) left = viewportWidth - popupWidth - 10;

  floatingPopupElement.style.top = `${top}px`;
  floatingPopupElement.style.left = `${left}px`;
}


// Удаление popup с анимацией
function removeFloatingPopup() {
  if (!floatingPopupElement) {
    return; 
  }
  floatingPopupElement.classList.remove('popup-fade-in');
  floatingPopupElement.classList.add('popup-fade-out');
  setTimeout(() => {
    if (floatingPopupElement && floatingPopupElement.parentNode) {
      floatingPopupElement.remove();
    }
    floatingPopupElement = null;
    floatingPopupContentElement = null;
    floatingPopupCloseButtonElement = null;
    window.removeEventListener('resize', positionFloatingPopup);
  }, ANIMATION_DURATION);
}

// Отображение кнопки
function showCopyButton() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length <= 1 || selectedText.length >= 1000 ) {
    removeCopyButton();
    currentSelectionRange = null;
    currentSelectedText = '';
    removeFloatingPopup();
    return;
  }

  if (selectedText !== currentSelectedText) {
    currentSelectedText = selectedText;
    if (copyButton) {
      updateButtonPosition();
    }
    if (floatingPopupContentElement) {
      floatingPopupContentElement.textContent = currentSelectedText;
      positionFloatingPopup();
    }
  }

  if (selection.rangeCount > 0) {
    const newRange = selection.getRangeAt(0);
    if (!currentSelectionRange || !rangesAreEqual(currentSelectionRange, newRange)) {
      currentSelectionRange = newRange;
      if (!copyButton) {
        createCopyButton();
      }
      updateButtonPosition();
    }
  } else {
    removeCopyButton();
    currentSelectionRange = null;
    currentSelectedText = '';
    removeFloatingPopup();
    return;
  }
}

// Функция создания кнопки и задание стилей 
function createCopyButton() {
  if (copyButton) {
    return;
  }

  copyButton = document.createElement('button');
  copyButton.textContent = 'Объяснить'; 
  copyButton.classList.add('show-text-popup-button'); 


  copyButton.style.position = 'absolute';
  copyButton.style.zIndex = '10000';
  copyButton.style.height = '35px';
  copyButton.style.border = '2px solid #3ac4ffbb';
  copyButton.style.backgroundColor = '#ffffff';
  copyButton.style.cursor = 'pointer';
  copyButton.style.borderRadius = '3px';
  copyButton.style.fontFamily = 'sans-serif';
  copyButton.style.fontSize = '16px';
  copyButton.style.whiteSpace = 'nowrap';

  document.body.appendChild(copyButton);

  copyButton.addEventListener('click', () => {
    setTimeout(() => {
    createFloatingPopup(currentSelectedText); 
    removeCopyButton();
  }, 10);
  });


}

function updateButtonPosition() {
  if (!copyButton || !currentSelectionRange) {
    return;
  }

  const rect = currentSelectionRange.getBoundingClientRect();

  let top = rect.bottom + window.scrollY + 5;
  let left = rect.left + window.scrollX + (rect.width / 2) - (copyButton.offsetWidth / 2);

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (left + copyButton.offsetWidth > viewportWidth) {
    left = viewportWidth - copyButton.offsetWidth - 10;
  }
  if (left < 0) {
    left = 10;
  }
  if (rect.top < 0 && top < 0) {
    top = rect.top + window.scrollY + copyButton.offsetHeight + 5;
  }
  if (top + copyButton.offsetHeight > viewportHeight + window.scrollY) {
    top = rect.top + window.scrollY - copyButton.offsetHeight - 5;
  }

  copyButton.style.top = `${top}px`;
  copyButton.style.left = `${left}px`;
}

function getRangeFromButtonPosition() { return currentSelectionRange; }

function rangesAreEqual(range1, range2) {
  if (!range1 || !range2) return false;
  return range1.startContainer === range2.startContainer &&
         range1.startOffset === range2.startOffset &&
         range1.endContainer === range2.endContainer &&
         range1.endOffset === range2.endOffset;
}
// Удаление кнопки с анимациями 
function removeCopyButton() {
  if (!copyButton) {
    return; 
  }
  copyButton.classList.add('copy-button-fade-out');
  setTimeout(() => {
    if (copyButton && copyButton.parentNode) {
      copyButton.remove();
    }
    copyButton = null;
    currentSelectionRange = null;
    currentSelectedText = '';
  }, ANIMATION_DURATION);
}

document.addEventListener('mouseup', () => {
  setTimeout(() => {
    showCopyButton();
  }, 5);
});

document.addEventListener('mousedown', () => {
  //removeCopyButton();
  removeFloatingPopup();
});

document.addEventListener('scroll', () => {
  if (copyButton) {
    updateButtonPosition();
  }
  if (floatingPopupElement) {
    positionFloatingPopup();
  }
}, { passive: true });

document.addEventListener('mousemove', (event) => {
  if (copyButton && window.getSelection().toString().trim().length > 0) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0);
      if (!currentRange.isCollapsed) {
        if (!currentSelectionRange || !rangesAreEqual(currentRange, currentRange)) {
            if (!currentSelectionRange || !rangesAreEqual(currentSelectionRange, currentRange)) {
                currentSelectionRange = currentRange;
                currentSelectedText = selection.toString().trim();
                if (copyButton) {
                    updateButtonPosition();
                } else {
                    createCopyButton();
                    updateButtonPosition();
                }
                if (floatingPopupContentElement) {
                  floatingPopupContentElement.textContent = currentSelectedText;
                  positionFloatingPopup();
                }
            }
        } else {
            updateButtonPosition();
        }
      } else {
        removeCopyButton();
        //removeFloatingPopup();
      }
    } else {
      removeCopyButton();
      //removeFloatingPopup();
    }
  } else {
    removeCopyButton();
    //removeFloatingPopup();
  }
});

console.log("Content.js Загружен");