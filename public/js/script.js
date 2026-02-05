document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        }
    });

    // Gallery lightbox effect (simple hover enhancement already in CSS)
    // Add lazy loading intersection observer for images
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // ===== Booking Modal =====
    const bookingModal = document.getElementById('booking-modal');
    const modalRoomName = document.getElementById('modal-room-name');
    const whatsappCartLink = document.getElementById('whatsapp-cart-link');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    const roomButtons = document.querySelectorAll('.btn-room[data-room]');

    // Open modal when clicking room booking buttons
    roomButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const roomName = this.dataset.room;
            const whatsappLink = this.dataset.whatsapp;
            
            // Update modal content
            modalRoomName.textContent = roomName + ' Room';
            whatsappCartLink.href = whatsappLink;
            
            // Show modal
            bookingModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Close modal functions
    function closeModal() {
        bookingModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && bookingModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Close modal when clicking booking options (after a small delay for visual feedback)
    document.querySelectorAll('.booking-option').forEach(option => {
        option.addEventListener('click', function() {
            setTimeout(closeModal, 300);
        });
    });
});
