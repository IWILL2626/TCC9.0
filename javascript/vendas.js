// javascript/vendas.js - VERSÃO ATUALIZADA COM SISTEMA DE LIKE E CORREÇÃO DE FILTRO

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
    const ratingFilter = document.getElementById('ratingFilter'); // Mantido caso queira usar no futuro

    let allProducts = [];
    let currentUser = null;

    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = "login.html";
        } else {
            currentUser = user;
            loadProductsFromFirestore();
        }
    });

    // --- NOVA LÓGICA DO BOTÃO DE LIKE (CURTIDA) ---
    const handleLikeClick = async (button) => {
        if (!currentUser) {
            alert("Você precisa estar logado para curtir um serviço.");
            return;
        }

        const productId = button.dataset.productId;
        const isLiked = button.classList.contains('liked');
        const productRef = db.collection('produtos').doc(productId);

        // Animação e atualização visual imediata
        document.querySelectorAll(`.like-btn[data-product-id="${productId}"]`).forEach(btn => {
            btn.classList.toggle('liked');
            btn.querySelector('i').classList.toggle('far'); // Alterna entre coração vazio
            btn.querySelector('i').classList.toggle('fas'); // e coração cheio
            if (!isLiked) { // Só anima ao curtir
                btn.classList.add('pulse-animation');
                setTimeout(() => btn.classList.remove('pulse-animation'), 300);
            }
        });

        try {
            if (isLiked) {
                // Se já estava curtido, REMOVE o like do array no Firebase
                await productRef.update({
                    interestedUsers: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
                });
            } else {
                // Se não estava curtido, ADICIONA o like ao array
                await productRef.update({
                    interestedUsers: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
                });
            }
        } catch (error) {
            console.error("Erro ao atualizar curtida:", error);
            // Reverte a mudança visual em caso de erro no banco de dados
            document.querySelectorAll(`.like-btn[data-product-id="${productId}"]`).forEach(btn => {
                btn.classList.toggle('liked');
                btn.querySelector('i').classList.toggle('far');
                btn.querySelector('i').classList.toggle('fas');
            });
        }
    };

    // --- LÓGICA DE RENDERIZAÇÃO E MODAL (ATUALIZADA) ---
    const getSellerData = async (sellerId) => {
        if (!sellerId) return null;
        try {
            const userDoc = await db.collection("vendedores").doc(sellerId).get();
            return userDoc.exists ? userDoc.data() : null;
        } catch (error) { console.error("Erro ao buscar dados do vendedor:", error); return null; }
    };

    const showProductModal = async (productId) => {
        modal.classList.add('show');
        modalBody.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
        
        const product = allProducts.find(p => p.id === productId);
        if (!product) { modalBody.innerHTML = '<p>Erro: produto não encontrado.</p>'; return; }

        const seller = await getSellerData(product.vendedorId);
        const imageUrl = product.imagem || 'https://via.placeholder.com/400x250?text=Sem+Imagem';
        const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);

        const isLiked = product.interestedUsers && product.interestedUsers.includes(currentUser.uid);
        const heartIconClass = isLiked ? 'fas fa-heart' : 'far fa-heart';
        const likedClass = isLiked ? 'liked' : '';
        
        const likeButtonHtml = `<button class="like-btn like-btn-modal ${likedClass}" data-product-id="${product.id}">
                                    <i class="${heartIconClass}"></i>
                                </button>`;

        let sellerHtml = seller ? `
            <div class="modal-seller-info"><h3>Informações de Contato</h3>
            <div class="seller-detail"><i class="fas fa-user"></i><span>${seller.nome || 'Não informado'}</span></div>
            <div class="seller-detail"><i class="fas fa-users"></i><span>${seller.turma || 'Não informada'}</span></div>
            <div class="seller-detail"><i class="fas fa-envelope"></i><span>${seller.email || 'Não informado'}</span></div>
            <div class="seller-detail"><i class="fas fa-phone"></i><span>${seller.telefone || 'Não informado'}</span></div></div>`
            : `<div class="modal-seller-info"><p>Informações do vendedor não disponíveis.</p></div>`;

        modalBody.innerHTML = `
            <img src="${imageUrl}" alt="${product.nome}" class="modal-product-image">
            <h2 class="modal-product-title">Eu vou ${product.nome || '...'}</h2>
            <p class="modal-product-price">${precoFormatado}</p>
            <p class="modal-product-description">${product.descricao || 'Nenhuma descrição fornecida.'}</p>
            ${likeButtonHtml}
            ${sellerHtml}`;
    };

    const renderProducts = (productsToRender) => {
        productGrid.innerHTML = '';
        if (productsToRender.length === 0) {
            productGrid.innerHTML = "<p>Nenhum serviço encontrado para os filtros selecionados.</p>";
            return;
        }

        productsToRender.forEach((product) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);
            
            const isLiked = product.interestedUsers && product.interestedUsers.includes(currentUser.uid);
            const heartIconClass = isLiked ? 'fas fa-heart' : 'far fa-heart'; // Coração cheio ou vazio
            const likedClass = isLiked ? 'liked' : '';

            const likeButtonHtml = `<button class="like-btn ${likedClass}" data-product-id="${product.id}">
                                        <i class="${heartIconClass}"></i>
                                    </button>`;

            // Wrapper para o conteúdo clicável que abre o modal
            const cardContentWrapper = document.createElement('div');
            cardContentWrapper.className = 'card-content-wrapper';
            cardContentWrapper.dataset.id = product.id; // Adiciona o ID aqui para o clique
            cardContentWrapper.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.imagem || 'https://via.placeholder.com/400x250?text=Sem+Imagem'}" alt="${product.nome}" class="product-image">
                    <div class="product-price">${precoFormatado}</div>
                </div>
                <div class="product-info">
                    <div class="product-seller"><span>${product.vendedor || 'Vendedor não informado'}</span></div>
                    <h4 class="product-title">Eu vou ${product.nome}</h4>
                    <p class="product-description-card">${product.descricao ? product.descricao.substring(0, 60) + '...' : ''}</p>
                </div>`;
            
            const productMeta = document.createElement('div');
            productMeta.className = 'product-meta';
            productMeta.innerHTML = likeButtonHtml;
            
            card.appendChild(cardContentWrapper);
            card.appendChild(productMeta);
            productGrid.appendChild(card);
        });
    };
    
    // --- LÓGICA DO FILTRO DE CATEGORIAS (ADICIONADA E CORRIGIDA) ---
    const populateCategoryFilter = (products) => {
        const categories = [...new Set(products.map(p => p.categoria).filter(Boolean))].sort();
        
        // Linha para depuração: Abra o console do navegador (F12) para ver esta mensagem
        console.log("Categorias encontradas para o filtro:", categories);

        categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryFilter.appendChild(option);
        });
    };

    // --- CARREGAMENTO DE DADOS E APLICAÇÃO DE FILTROS ---
    const loadProductsFromFirestore = async () => {
        loader.style.display = 'flex';
        productGrid.innerHTML = '';
        try {
            const snapshot = await db.collection('produtos').orderBy('criadoEm', 'desc').get();
            allProducts = snapshot.empty ? [] : snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            populateCategoryFilter(allProducts); // CORREÇÃO: Chama a função para popular o filtro
            renderProducts(allProducts);

        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
            productGrid.innerHTML = "<p>Ocorreu um erro ao carregar os serviços.</p>";
        } finally {
            loader.style.display = 'none';
        }
    };
    
    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const filteredProducts = allProducts.filter(product =>
            (!searchTerm || (product.nome && product.nome.toLowerCase().includes(searchTerm)) || (product.descricao && product.descricao.toLowerCase().includes(searchTerm))) &&
            (!selectedCategory || product.categoria === selectedCategory)
        );
        renderProducts(filteredProducts);
    };

    // --- EVENT LISTENERS GERAIS ---
    productGrid.addEventListener('click', (event) => {
        const likeBtn = event.target.closest('.like-btn');
        const cardWrapper = event.target.closest('.card-content-wrapper');

        if (likeBtn) {
            handleLikeClick(likeBtn);
        } else if (cardWrapper) {
            showProductModal(cardWrapper.dataset.id);
        }
    });

    modalBody.addEventListener('click', (event) => {
        const likeBtn = event.target.closest('.like-btn-modal');
        if (likeBtn) { handleLikeClick(likeBtn); }
    });

    const closeProductModal = () => modal.classList.remove('show');
    modalCloseBtn.addEventListener('click', closeProductModal);
    modal.addEventListener('click', (event) => { if (event.target === modal) closeProductModal(); });

    searchInput.addEventListener('input', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    
    // --- Restante do código para menus, logout, etc. ---
    // (Este bloco foi mantido como no seu arquivo original)
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) { settingsBtn.addEventListener('click', (event) => { event.stopPropagation(); document.getElementById('settingsDropdown').classList.toggle('show'); }); }
    window.addEventListener('click', (event) => { const settingsDropdown = document.getElementById('settingsDropdown'); if (settingsDropdown && !settingsDropdown.previousElementSibling.contains(event.target) && !settingsDropdown.contains(event.target)) { settingsDropdown.classList.remove('show'); } });
    const mobileMenuIcon = document.getElementById('mobileMenuIcon');
    const mobileNav = document.getElementById('mobileNav');
    if (mobileMenuIcon && mobileNav) { mobileMenuIcon.addEventListener('click', () => { mobileNav.classList.toggle('open'); const icon = mobileMenuIcon.querySelector('i'); icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-times'); }); }
    const logoutBtnNav = document.getElementById("logoutBtnNav");
    const logoutBtnMobile = document.getElementById("logoutBtnMobile");
    if (logoutBtnNav) logoutBtnNav.addEventListener("click", logout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", logout);
});