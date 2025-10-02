// javascript/vendas.js - VERSÃO ATUALIZADA COM BOTÃO DE INTERESSE

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAKTwMCe5sUPoZz5jwSYV1WiNmGjGxNxY8",
    authDomain: "tcciwill.firebaseapp.com",
    projectId: "tcciwill",
    storageBucket: "tcciwill.appspot.com",
    messagingSenderId: "35460029082",
    appId: "1:35460029082:web:90ae52ac65ff355d8f9d23"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const logout = () => {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
};

document.addEventListener('DOMContentLoaded', () => {

    const productGrid = document.getElementById('productGrid');
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const loader = document.getElementById('loader');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const ratingFilter = document.getElementById('ratingFilter');

    let allProducts = [];
    let currentUser = null; // Variável para armazenar o usuário logado

    // --- LÓGICA DE AUTENTICAÇÃO E ADMIN ---
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = "login.html";
        } else {
            currentUser = user; // Armazena o usuário logado
            checkAdminStatus(user);
            loadProductsFromFirestore(); // Carrega os produtos DEPOIS de saber quem é o usuário
        }
    });

    const checkAdminStatus = async (user) => {
        if (!user) return;
        try {
            const userDoc = await db.collection('vendedores').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().isAdmin === true) {
                document.getElementById('adminLinkContainer').style.display = 'block';
                document.getElementById('adminLinkMobileContainer').style.display = 'block';
            }
        } catch (error) { console.error("Erro ao verificar status de admin:", error); }
    };

    // --- LÓGICA DO BOTÃO DE INTERESSE ---
    const handleInterestClick = async (button) => {
        if (!currentUser) {
            alert("Você precisa estar logado para expressar interesse.");
            return;
        }

        const productId = button.dataset.productId;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

        try {
            const productRef = db.collection('produtos').doc(productId);
            await productRef.update({
                interestedUsers: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
            });
            
            // Atualiza todos os botões para este produto
            document.querySelectorAll(`.interest-btn[data-product-id="${productId}"]`).forEach(btn => {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-check"></i> Interesse Registrado';
            });

            // Opcional: Mostrar uma notificação mais elegante
            // alert("Interesse registrado com sucesso! O vendedor será notificado.");

        } catch (error) {
            console.error("Erro ao registrar interesse:", error);
            alert("Ocorreu um erro. Tente novamente.");
            button.disabled = false;
            button.innerHTML = '🙋‍♂️ Tenho Interesse!';
        }
    };

    // --- LÓGICA DE RENDERIZAÇÃO E MODAL ---
    const getSellerData = async (sellerId) => {
        if (!sellerId) return null;
        try {
            const userDoc = await db.collection("vendedores").doc(sellerId).get();
            return userDoc.exists ? userDoc.data() : null;
        } catch (error) { console.error("Erro ao buscar dados do vendedor:", error); return null; }
    };

    const showProductModal = async (productId) => {
        modal.classList.add('show');
        modalBody.innerHTML = '<div class="loader"><div class="spinner"></div></div>'; // Loader interno
        
        const product = allProducts.find(p => p.id === productId);
        if (!product) { modalBody.innerHTML = '<p>Erro: produto não encontrado.</p>'; return; }

        const seller = await getSellerData(product.vendedorId);
        const imageUrl = product.imagem || 'https://via.placeholder.com/400x250?text=Sem+Imagem';
        const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);

        // Lógica do botão de interesse para o modal
        const isInterested = product.interestedUsers && product.interestedUsers.includes(currentUser.uid);
        const interestButtonHtml = `
            <button class="interest-btn interest-btn-modal" data-product-id="${product.id}" ${isInterested ? 'disabled' : ''}>
                ${isInterested ? '<i class="fas fa-check"></i> Interesse Registrado' : '🙋‍♂️ Tenho Interesse!'}
            </button>`;

        let sellerHtml = seller ? `
            <div class="modal-seller-info"><h3>Informações de Contato</h3>
            <div class="seller-detail"><i class="fas fa-user"></i><span>${seller.nome || 'Não informado'}</span></div>
            <div class="seller-detail"><i class="fas fa-users"></i><span>${seller.turma || 'Não informada'}</span></div>
            <div class="seller-detail"><i class="fas fa-envelope"></i><span>${seller.email || 'Não informado'}</span></div>
            <div class="seller-detail"><i class="fas fa-phone"></i><span>${seller.telefone || 'Não informado'}</span></div></div>`
            : `<div class="modal-seller-info"><p>Informações do vendedor não disponíveis.</p></div>`;

        modalBody.innerHTML = `
            <img src="${imageUrl}" alt="Eu vou ${product.nome}" class="modal-product-image">
            <h2 class="modal-product-title">Eu vou ${product.nome || '...'}</h2>
            <p class="modal-product-price">${precoFormatado}</p>
            <p class="modal-product-description">${product.descricao || 'Nenhuma descrição fornecida.'}</p>
            ${sellerHtml}
            ${interestButtonHtml}`;
    };

    const renderProducts = (productsToRender) => {
        productGrid.innerHTML = '';
        if (productsToRender.length === 0) { productGrid.innerHTML = "<p>Nenhum serviço encontrado.</p>"; return; }

        productsToRender.forEach((product) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-id', product.id);

            const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);

            // Verifica se o usuário atual já demonstrou interesse
            const isInterested = product.interestedUsers && product.interestedUsers.includes(currentUser.uid);

            const interestButtonHtml = `
                <button class="interest-btn" data-product-id="${product.id}" ${isInterested ? 'disabled' : ''}>
                    ${isInterested ? '<i class="fas fa-check"></i> Interesse Registrado' : '🙋‍♂️ Tenho Interesse!'}
                </button>`;

            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.imagem || 'https://via.placeholder.com/400x250?text=Sem+Imagem'}" alt="Eu vou ${product.nome}" class="product-image">
                    <div class="product-price">${precoFormatado}</div>
                </div>
                <div class="product-info">
                    <div class="product-seller"><span>${product.vendedor || 'Vendedor não informado'}</span></div>
                    <h4 class="product-title">Eu vou ${product.nome}</h4>
                    <p class="product-description-card">${product.descricao.substring(0, 60)}...</p>
                    <div class="product-meta">${interestButtonHtml}</div>
                </div>`;
            
            productGrid.appendChild(card);
        });
    };

    // --- EVENT LISTENERS GERAIS ---
    productGrid.addEventListener('click', (event) => {
        const interestBtn = event.target.closest('.interest-btn');
        const card = event.target.closest('.product-card');

        if (interestBtn) { // Se clicou no botão de interesse
            event.stopPropagation(); // Impede que o modal abra
            handleInterestClick(interestBtn);
        } else if (card) { // Se clicou em qualquer outro lugar do card
            showProductModal(card.dataset.id);
        }
    });

    modalBody.addEventListener('click', (event) => {
        const interestBtn = event.target.closest('.interest-btn-modal');
        if (interestBtn) {
            handleInterestClick(interestBtn);
        }
    });

    const closeProductModal = () => modal.classList.remove('show');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProductModal);
    if (modal) modal.addEventListener('click', (event) => { if (event.target === modal) closeProductModal(); });

    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        let filteredProducts = allProducts.filter(product =>
            (!searchTerm || product.nome.toLowerCase().includes(searchTerm) || product.descricao.toLowerCase().includes(searchTerm) || product.vendedor.toLowerCase().includes(searchTerm)) &&
            (!selectedCategory || product.categoria === selectedCategory)
        );
        renderProducts(filteredProducts);
    };

    const loadProductsFromFirestore = async () => {
        if (!currentUser) return; // Garante que só carrega se o usuário estiver definido
        loader.style.display = 'flex';
        productGrid.innerHTML = '';
        try {
            const snapshot = await db.collection('produtos').orderBy('criadoEm', 'desc').get();
            allProducts = snapshot.empty ? [] : snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderProducts(allProducts);
        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
            productGrid.innerHTML = "<p>Ocorreu um erro ao carregar os serviços.</p>";
        } finally {
            loader.style.display = 'none';
        }
    };
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    
    // O restante do seu código (menus, logout, etc.) pode ser mantido aqui
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            document.getElementById('settingsDropdown').classList.toggle('show');
        });
    }
    window.addEventListener('click', (event) => {
        const settingsDropdown = document.getElementById('settingsDropdown');
        if (settingsDropdown && !settingsDropdown.previousElementSibling.contains(event.target) && !settingsDropdown.contains(event.target)) {
            settingsDropdown.classList.remove('show');
        }
    });

    const mobileMenuIcon = document.getElementById('mobileMenuIcon');
    const mobileNav = document.getElementById('mobileNav');
    if (mobileMenuIcon && mobileNav) {
        mobileMenuIcon.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
            const icon = mobileMenuIcon.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }

    const logoutBtnNav = document.getElementById("logoutBtnNav");
    const logoutBtnMobile = document.getElementById("logoutBtnMobile");
    if (logoutBtnNav) logoutBtnNav.addEventListener("click", logout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", logout);
});