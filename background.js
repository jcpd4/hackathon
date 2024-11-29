// Al instalar la extensión, inicializamos el estado de la funcionalidad como desactivada
chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.set({ isExtensionActive: false }, function () {
      console.log("La extensión ha sido instalada y está desactivada.");
    });
  });
  