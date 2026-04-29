
let copyButton = null;
let currentSelectionRange = null; 
let currentSelectedText = ''; 

// Функция для создания и отображения кнопки
function showCopyButton() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length <= 1) {
    removeCopyButton();
    currentSelectionRange = null;
    currentSelectedText = '';
    return;
  }

  if (selectedText !== currentSelectedText) {
    currentSelectedText = selectedText;
    if (copyButton) {
      updateButtonPosition();
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
    return;
  }
}

// Функция для создания кнопки
function createCopyButton() {
  copyButton = document.createElement('button');
  copyButton.textContent = 'Объяснить'; 
  copyButton.classList.add('show-text-popup-button'); 

  // Применяем стили
  copyButton.style.position = 'absolute';
  copyButton.style.zIndex = '10000';
  copyButton.style.height = '50px';
  copyButton.style.border = '2px solid #3ac4ffbb';
  copyButton.style.backgroundColor = '#ffffff';
  copyButton.style.cursor = 'pointer';
  copyButton.style.borderRadius = '3px';
  //copyButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  copyButton.style.fontFamily = 'sans-serif';
  copyButton.style.fontSize = '20px';
  copyButton.style.whiteSpace = 'nowrap';


  copyButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "show_selected_text", text: currentSelectedText });
    removeCopyButton();
  });

  document.body.appendChild(copyButton);
}


// Функция для обновления позиции кнопки
function updateButtonPosition() {
  if (!copyButton || !currentSelectionRange) {
    return;
  }

  const rect = currentSelectionRange.getBoundingClientRect();

  // Рассчитываем позицию кнопки (под выделением)
  let top = rect.bottom + window.scrollY + 5;
  let left = rect.left + window.scrollX + (rect.width / 2) - (copyButton.offsetWidth / 2);

  // Проверяем, чтобы кнопка не выходила за пределы видимой области
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

// Функция для получения диапазона выделения по текущей позиции кнопки
function getRangeFromButtonPosition() {
  return currentSelectionRange;
}

// Функция для сравнения двух диапазонов
function rangesAreEqual(range1, range2) {
  if (!range1 || !range2) return false;
  return range1.startContainer === range2.startContainer &&
         range1.startOffset === range2.startOffset &&
         range1.endContainer === range2.endContainer &&
         range1.endOffset === range2.endOffset;
}

// Функция для удаления кнопки
function removeCopyButton() {
  if (copyButton) {
    copyButton.remove();
    copyButton = null;
    currentSelectionRange = null;
    currentSelectedText = '';
  }
}

// --- Слушатели событий ---

document.addEventListener('mouseup', () => {
  setTimeout(() => {
    showCopyButton();
  }, 50);
});

document.addEventListener('mousedown', () => {
  removeCopyButton();
});

document.addEventListener('scroll', () => {
  if (copyButton) {
    updateButtonPosition();
  }
}, { passive: true });

document.addEventListener('mousemove', (event) => {
  if (copyButton && window.getSelection().toString().trim().length > 0) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0);
      if (!currentRange.isCollapsed) { 
        if (!currentSelectionRange || !rangesAreEqual(currentSelectionRange, currentRange)) {
            currentSelectionRange = currentRange;
            currentSelectedText = selection.toString().trim();
            if (copyButton) {
                updateButtonPosition(); 
            } else {
                createCopyButton(); 
                updateButtonPosition();
            }
        } else {
            updateButtonPosition();
        }
      } else {
        removeCopyButton(); 
      }
    } else {
      removeCopyButton(); 
    }
  } else {
    removeCopyButton(); 
  }
});

console.log("Content script loaded and ready.");