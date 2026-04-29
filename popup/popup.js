
document.addEventListener('DOMContentLoaded', () => {
  const selectedTextDisplay = document.getElementById('selected-text-display');


  function getSelectedText() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "show_selected_text") {
        const text = request.text;
        selectedTextDisplay.textContent = text || 'No text selected.'; 

     
      }
    });

  }

  getSelectedText();
});