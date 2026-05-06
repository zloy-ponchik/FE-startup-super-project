
// Основная логика Расширения


// Переменные для кнопки
let copyButton = null;
let currentSelectionRange = null;
let currentSelectedText = '';

// Переменные для popup
let floatingPopupElement = null;
let floatingPopupContentElement = null;
let floatingPopupCloseButtonElement = null;
let popupStylesApplied = false; 

// Встроенный HTML и CSS для popup 
const POPUP_HTML_CONTENT = `
<div id="dynamic-text-popup">
  <div class="popup-header">
    <h3 id="popup-title">НейроShlapa</h3>
    <button id="popup-close-button" title="Close">&times;</button>
  </div>
  <div id="popup-text-content">
    <!-- Выделенный текст -->
  </div>
</div>
`;

const POPUP_CSS_CONTENT = `
/* popup_template/popup.css */
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
`;
//  Конец встроенного содержимого 


// Функции для создания и управления  popup 

function createFloatingPopup(text) {
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
      console.log("Popup CSS applied.");
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

    console.log("Popup HTML structure loaded.");

    //  Вставка текста и позиционирование 
    if (floatingPopupContentElement) {
      floatingPopupContentElement.textContent = text || 'No text selected.';
    }

    document.body.appendChild(floatingPopupElement);
    console.log("Floating popup appended to body.");

    positionFloatingPopup();
    window.addEventListener('resize', positionFloatingPopup);

    return floatingPopupElement;

  } catch (error) {
    console.error("Error creating popup element:", error);
    return null;
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
function removeFloatingPopup() {
  if (floatingPopupElement) {
    floatingPopupElement.remove();
    floatingPopupElement = null;
    floatingPopupContentElement = null;
    floatingPopupCloseButtonElement = null;
    window.removeEventListener('resize', positionFloatingPopup);
    console.log("Floating popup removed.");
  }
}

function showCopyButton() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length === 0) {
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

function createCopyButton() {
  if (copyButton) {
    return;
  }

  copyButton = document.createElement('button');
  copyButton.textContent = 'Объяснить'; 
  copyButton.classList.add('show-text-popup-button'); 

  copyButton.style.position = 'absolute';
  copyButton.style.zIndex = '10000';
  copyButton.style.height = '50px';
  copyButton.style.border = '2px solid #3ac4ffbb';
  copyButton.style.backgroundColor = '#ffffff';
  copyButton.style.cursor = 'pointer';
  copyButton.style.borderRadius = '3px';
  copyButton.style.fontFamily = 'sans-serif';
  copyButton.style.fontSize = '20px';
  copyButton.style.whiteSpace = 'nowrap';


  document.body.appendChild(copyButton)
  console.log("Copy button appended to body.");

  copyButton.addEventListener('click', () => {
    console.log("Button clicked. Creating floating popup with text:", currentSelectedText);
    createFloatingPopup(currentSelectedText); // <-- Ошибка была здесь: `appendChild` вызывалась с `copyButton`
    removeCopyButton();
  });
;
  
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

function removeCopyButton() {
  if (copyButton) {
    copyButton.remove();
    copyButton = null;
    currentSelectionRange = null;
    currentSelectedText = '';
    console.log("Copy button removed.");
  }
}

document.addEventListener('mouseup', () => {
  setTimeout(() => {
    showCopyButton();
  }, 50);
});
/*
document.addEventListener('mousedown', () => {
  removeCopyButton();
  console.log("--------------.");
  removeFloatingPopup();
});
*/
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
        removeFloatingPopup();
      }
    } else {
      removeCopyButton();
      removeFloatingPopup();
    }
  } else {
    removeCopyButton();
    removeFloatingPopup();
  }
});

console.log("Content.js Загружен");
