'use strict';

(() => {

  let pupApp = window.popupApp = {};

  // 
  pupApp.init = () => {

    // logo click event
    document.querySelector('.logo').addEventListener('click', pupApp.clickLogo);

  };

  // logo click event handler
  pupApp.clickLogo = (evt) => {
    chrome.tabs.create({
      url: 'https://nebenan.de/',
      active: true
    });
  };

  document.addEventListener('DOMContentLoaded', pupApp.init);

})();
