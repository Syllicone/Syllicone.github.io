document.addEventListener('DOMContentLoaded', () => {
    const pages = document.querySelectorAll('.page');

    // Add event listeners to SVG elements
    document.getElementById('home-trigger').addEventListener('click', () => {
        navigateToPage('home');
    });

    document.getElementById('work-trigger').addEventListener('click', () => {
        navigateToPage('work');
    });

    document.getElementById('about-trigger').addEventListener('click', () => {
        navigateToPage('about');
    });

    document.getElementById('contact-trigger').addEventListener('click', () => {
        navigateToPage('contact');
    });

    function navigateToPage(target) {
        pages.forEach(page => {
            page.classList.toggle('hidden', page.id !== target);
        });
    }
});