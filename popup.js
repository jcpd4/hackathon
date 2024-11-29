document.addEventListener('DOMContentLoaded', () => {
    const toggleDetectionButton = document.getElementById('analyzeThisEmail');
  
    // Inicializa el botón según el estado actual
    chrome.storage.local.get('isExtensionActive', (data) => {
      const isActive = data.isExtensionActive || false;
      updateButtonState(isActive);
    });
  
    toggleDetectionButton.addEventListener('click', () => {
      chrome.storage.local.get('isExtensionActive', (data) => {
        const isActive = data.isExtensionActive || false;
        const newState = !isActive;
  
        chrome.storage.local.set({ isExtensionActive: newState }, () => {
          console.log(`Estado cambiado: ${newState}`);
          updateButtonState(newState);
        });
      });
    });
  
    function updateButtonState(isActive) {
      toggleDetectionButton.textContent = isActive
        ? 'Detección de email activa'
        : 'Detección de email desactivada';
      toggleDetectionButton.style.backgroundColor = isActive ? '#4caf50' : '#f44336'; // Verde para activo, rojo para inactivo
    }
  });
  