document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab');
    const pages = document.querySelectorAll('.page');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-target');

            pages.forEach(page => {
                if (page.id === target) {
                    page.classList.remove('hidden');
                } else {
                    page.classList.add('hidden');
                }
            });
        });
    });
});