document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            // Accessibility: toggle aria-expanded
            const isExpanded = navLinks.classList.contains('active');
            mobileMenu.setAttribute('aria-expanded', isExpanded);
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenu.classList.remove('active');
            mobileMenu.setAttribute('aria-expanded', 'false');
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

    // Header scroll effect + Sticky Booking Bar
    const header = document.querySelector('header');
    const stickyBar = document.getElementById('sticky-booking-bar');
    const heroSection = document.getElementById('hero');
    let heroHeight = heroSection ? heroSection.offsetHeight : 700;

    window.addEventListener('scroll', function() {
        // Header effect
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        }

        // Sticky Booking Bar: show after scrolling past hero
        if (stickyBar) {
            if (window.scrollY > heroHeight) {
                stickyBar.classList.add('visible');
                document.body.classList.add('sticky-visible');
            } else {
                stickyBar.classList.remove('visible');
                document.body.classList.remove('sticky-visible');
            }
        }
    });

    // Recalculate hero height on resize
    window.addEventListener('resize', function() {
        if (heroSection) {
            heroHeight = heroSection.offsetHeight;
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
            
            // Set the WhatsApp link from the data attribute
            if (whatsappLink && whatsappLink.startsWith('https://wa.me/')) {
                whatsappCartLink.href = whatsappLink;
            } else {
                // Fallback: generate a proper WhatsApp link
                const message = encodeURIComponent(`Hi! I'd like to book the *${roomName} Room*. Could you confirm availability and pricing?`);
                whatsappCartLink.href = `https://wa.me/94762096130?text=${message}`;
            }
            
            // Carry the chosen room through to the availability form.
            const enquiryLink = document.getElementById('enquiry-modal-link');
            if (enquiryLink) enquiryLink.setAttribute('data-enquire-room', roomName);

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

    // ===== Map Tabs (hotel pin / route from main road) =====
    const mapTabs = document.querySelectorAll('.map-tab');

    mapTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetId = this.dataset.panel;

            mapTabs.forEach(t => {
                const isActive = t === this;
                t.classList.toggle('active', isActive);
                t.setAttribute('aria-selected', isActive);
            });

            document.querySelectorAll('.map-panel').forEach(panel => {
                panel.hidden = panel.id !== targetId;
            });

            // Load the route iframe only the first time the tab is opened.
            const panel = document.getElementById(targetId);
            const frame = panel ? panel.querySelector('iframe[data-src]') : null;
            if (frame) {
                frame.src = frame.dataset.src;
                frame.removeAttribute('data-src');
            }
        });
    });

    // ===== Copy GPS coordinates =====
    const copyCoordsBtn = document.getElementById('copy-coords');
    const copyToast = document.getElementById('map-copy-toast');

    if (copyCoordsBtn) {
        copyCoordsBtn.addEventListener('click', function () {
            const coords = this.dataset.coords;

            const showToast = () => {
                if (!copyToast) return;
                copyToast.classList.add('show');
                setTimeout(() => copyToast.classList.remove('show'), 2000);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(coords).then(showToast).catch(fallbackCopy);
            } else {
                fallbackCopy();
            }

            function fallbackCopy() {
                const input = document.createElement('textarea');
                input.value = coords;
                input.setAttribute('readonly', '');
                input.style.position = 'absolute';
                input.style.left = '-9999px';
                document.body.appendChild(input);
                input.select();
                try { document.execCommand('copy'); showToast(); } catch (e) { /* no-op */ }
                document.body.removeChild(input);
            }
        });
    }

    // ===== FAQ Accordion =====
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function () {
            const item = this.closest('.faq-item');
            const answer = item.querySelector('.faq-answer');
            const isOpen = item.classList.contains('open');

            // Close any other open item so only one answer shows at a time.
            document.querySelectorAll('.faq-item.open').forEach(other => {
                if (other !== item) {
                    other.classList.remove('open');
                    other.querySelector('.faq-answer').style.maxHeight = null;
                    other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });

            item.classList.toggle('open', !isOpen);
            this.setAttribute('aria-expanded', String(!isOpen));
            answer.style.maxHeight = isOpen ? null : answer.scrollHeight + 'px';
        });
    });
});
