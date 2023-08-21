// TODO: when there is right sidebar content, revive commented out code below
const removeDrawers = () => {
  // Select the button element
  // const button = document.querySelectorAll('button[data-drawer-target="rightSidebar"], button[data-drawer-target="leftSidebar"]');
  const button = document.querySelectorAll('button[data-drawer-target="leftSidebar"]');

  // Select all matching elements
  // const elements = document.querySelectorAll('#leftSidebar[aria-hidden="true"], #rightSidebar[aria-hidden="true"]');
  const elements = document.querySelectorAll('#leftSidebar[aria-hidden="true"]');

  if (elements.length > 0) {
    // Loop through the elements and remove the display: none style
    elements.forEach((element) => {
      element.style.display = 'none';
    });
  }

  // Add a click event listener to each button
  button.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Loop through the elements and add the display: none style
      elements.forEach((element) => {
        element.removeAttribute('style');
      });
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