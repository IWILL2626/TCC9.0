document.addEventListener('DOMContentLoaded', function() {
    
    // ====================================================
    // ================ ELEMENTOS DO DOM ==================
    // ====================================================
    const menuBtn = document.getElementById('menuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('overlay');
    
    const aboutTabs = document.querySelectorAll('.about-tab-btn');
    const aboutContentCards = document.querySelectorAll('.about-content-card');
    
    const ideaBulb = document.getElementById('idea-bulb');
    const ideaText = document.getElementById('idea-text');

    // Elementos do Dropdown Desktop
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');
    
    // Elementos de Ação
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeToggleMobile = document.getElementById('darkModeToggleMobile');
    const logoutBtnDesktop = document.getElementById('logoutBtnDesktop');
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    
    // Links de Login/Perfil (Mobile)
    const loginLinkMobile = document.getElementById('loginLinkMobile');
    const profileLinkMobile = document.getElementById('profileLinkMobile');
    const myProductsLinkMobile = document.getElementById('myProductsLinkMobile');
    
    // Links de Login/Perfil (Desktop)
    const loginLinkDesktop = document.getElementById('loginLinkDesktop');
    const profileLinkDesktop = document.getElementById('profileLinkDesktop');
    const myProductsLinkDesktop = document.getElementById('myProductsLinkDesktop');


    // ====================================================
    // ================== MENU MOBILE =====================
    // ====================================================
    const toggleMenu = () => {
        const isActive = mobileNav.classList.toggle('active');
        overlay.classList.toggle('active', isActive);
        const icon = menuBtn.querySelector('i');
        icon.classList.toggle('fa-bars', !isActive);
        icon.classList.toggle('fa-times', isActive);
    };

    if (menuBtn && mobileNav) {
        menuBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleMenu();
        });
        overlay.addEventListener('click', () => {
            if (mobileNav.classList.contains('active')) toggleMenu();
        });
        mobileNav.addEventListener('click', (event) => {
            if (event.target.tagName === 'A' && mobileNav.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    // ====================================================
    // =============== LÓGICA DO DROPDOWN (DESKTOP) =======
    // ====================================================
    if (settingsBtn && settingsDropdown) {
        settingsBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            settingsDropdown.classList.toggle('show');
        });
    }
    
    window.addEventListener('click', (event) => {
        if (settingsDropdown && !settingsBtn.contains(event.target) && !settingsDropdown.contains(event.target)) {
            settingsDropdown.classList.remove('show');
        }
    });

    // ====================================================
    // ============== LÓGICA DAS TABS 'SOBRE' =============
    // ====================================================
    if (aboutTabs.length > 0) {
        aboutTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.tab;
                aboutTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                aboutContentCards.forEach(card => {
                    card.classList.toggle('active', card.id === targetId);
                });
            });
        });
    }
    
    // ====================================================
    // ============== ANIMAÇÃO AO ROLAR (SCROLL) ==========
    // ====================================================
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    document.querySelectorAll('.about-us-section, .feature-card').forEach(el => observer.observe(el));


    // ====================================================
    // ============= LÓGICA DA LÂMPADA INTERATIVA =========
    // ====================================================
    if (ideaBulb && ideaText) {
        ideaBulb.addEventListener('click', () => {
            ideaBulb.classList.toggle('glow');
            ideaText.classList.toggle('visible');
        });
    }
    
    // ====================================================
    // ========= SINCRONIZAÇÃO DO MODO ESCURO =============
    // ====================================================
    if (darkModeToggle && darkModeToggleMobile) {
        darkModeToggleMobile.addEventListener('click', () => {
            darkModeToggle.click();
            darkModeToggleMobile.innerHTML = darkModeToggle.innerHTML;
        });
    }

    // ====================================================
    // ================ VERIFICAÇÃO DE LOGIN ================
    // ====================================================
    function handleLogout() {
        localStorage.setItem('isLoggedIn', 'false'); // Simulação
        window.location.reload();
    }
    
    if (logoutBtnDesktop) logoutBtnDesktop.addEventListener('click', handleLogout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', handleLogout);

    function checkLoginStatus() {
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        const updateVisibility = (element, show) => {
            if (element) {
                const displayStyle = (element.classList.contains('nav-btn') || element.classList.contains('dropdown-link')) ? 'flex' : 'block';
                element.style.display = show ? displayStyle : 'none';
            }
        };

        // Links do menu mobile
        updateVisibility(loginLinkMobile, !loggedIn);
        updateVisibility(profileLinkMobile, loggedIn);
        updateVisibility(myProductsLinkMobile, loggedIn);
        updateVisibility(logoutBtnMobile, loggedIn);

        // Links do dropdown desktop
        updateVisibility(loginLinkDesktop, !loggedIn);
        updateVisibility(profileLinkDesktop, loggedIn);
        updateVisibility(myProductsLinkDesktop, loggedIn);
        updateVisibility(logoutBtnDesktop, loggedIn);
    }

    checkLoginStatus();
});