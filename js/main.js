document.querySelectorAll('.navbar a').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    const offset = -60; // Adjust this value as needed
    window.scrollTo({
      top: targetElement.offsetTop + offset,
      behavior: 'smooth'
    });
  });
});