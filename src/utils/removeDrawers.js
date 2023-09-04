const removeDrawers = () => {
  // Select all matching button elements
  const button = document.querySelectorAll('button[data-drawer-target="rightSidebar"], button[data-drawer-target="leftSidebar"]');

  // Select all matching drawer elements
  const elements = document.querySelectorAll('#leftSidebar[aria-hidden="true"], #rightSidebar[aria-hidden="true"]');


  if (elements.length === 2) {
    // Loop through the elements and add the display: none style
    elements.forEach((element) => {
      element.style.display = 'none';
    });
  }

  // Add a click event listener to each button
  button.forEach((btn) => {
    btn.addEventListener('click', () => {
      // hide the left sidebar if the rightSidebar button is pressed and vice versa
      if (btn.dataset.drawerTarget === 'rightSidebar') {
        document.getElementById('rightSidebar').removeAttribute('style');
      } else {
        document.getElementById('leftSidebar').removeAttribute('style');
      }
    });
  });

  // Check the window width on load and resize
  const checkWindowWidth = () => {
    if (window.innerWidth > 1024) {
      elements.forEach((element) => {
        element.style.display = 'none';
      });
    }
  };

  // Call the checkWindowWidth function initially and on window resize
  window.addEventListener('load', checkWindowWidth);
  window.addEventListener('resize', checkWindowWidth);
};

// Call the removeDrawers function initially
window.addEventListener('load', removeDrawers);