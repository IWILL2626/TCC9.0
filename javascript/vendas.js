// javascript/vendas.js

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

    // --- SELETORES DE ELEMENTOS ---
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const mobileMenuIcon = document.getElementById('mobileMenuIcon');
    const mobileNav = document.getElementById('mobileNav');
    const productGrid = document.getElementById('productGrid');
    const loader = document.getElementById('loader');
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    const modalLoader = document.getElementById('modalLoader');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const logoutBtnNav = document.getElementById("logoutBtnNav");
    const logoutBtnMobile = document.getElementById("logoutBtnMobile");

    // --- SELETORES PARA OS FILTROS ---
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const ratingFilter = document.getElementById('ratingFilter');

    // --- LÓGICA DE LOGOUT E AUTENTICAÇÃO ---
    if (logoutBtnNav) logoutBtnNav.addEventListener("click", logout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", logout);
    auth.onAuthStateChanged((user) => { if (!user) window.location.href = "login.html"; });

    // --- LÓGICA DOS MENUS (CÓDIGO ORIGINAL MANTIDO) ---
    if (settingsBtn && settingsDropdown) {
        settingsBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            settingsDropdown.classList.toggle('show');
        });
        window.addEventListener('click', (event) => {
            if (!settingsBtn.contains(event.target) && !settingsDropdown.contains(event.target)) {
                if (settingsDropdown.classList.contains('show')) {
                    settingsDropdown.classList.remove('show');
                }
            }
        });
    }

    if (mobileMenuIcon && mobileNav) {
        mobileMenuIcon.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
            const icon = mobileMenuIcon.querySelector('i');
            if (mobileNav.classList.contains('open')) {
                icon.classList.remove('fa-bars'); icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times'); icon.classList.add('fa-bars');
            }
        });
    }

    const darkModeToggleMobile = document.getElementById('darkModeToggleMobile');
    const darkModeToggleDesktop = document.getElementById('darkModeToggle');
    if(darkModeToggleMobile && darkModeToggleDesktop) {
        darkModeToggleMobile.addEventListener('click', () => {
            darkModeToggleDesktop.click();
            darkModeToggleMobile.innerHTML = darkModeToggleDesktop.innerHTML;
        });
    }

    // --- SEÇÃO DE LÓGICA DOS PRODUTOS ---
    
    let allProducts = [];

    const getSellerData = async (sellerId) => {
        if (!sellerId) return null;
        try {
            const userDoc = await db.collection("vendedores").doc(sellerId).get();
            return userDoc.exists ? userDoc.data() : null;
        } catch (error) {
            console.error("Erro ao buscar dados do vendedor:", error);
            return null;
        }
    };

    const showProductModal = async (productId) => {
        modal.classList.add('show');
        modalLoader.style.display = 'flex';
        modalBody.innerHTML = '';
        const product = allProducts.find(p => p.id === productId);
        if (!product) {
            modalBody.innerHTML = '<p>Erro: produto não encontrado.</p>';
            modalLoader.style.display = 'none';
            return;
        }
        const seller = await getSellerData(product.vendedorId);
        const imageUrl = product.imagem || 'https://via.placeholder.com/400x250?text=Sem+Imagem';
        const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);
        let sellerHtml;
        if (seller) {
            sellerHtml = `
            <div class="modal-seller-info">
                <h3>Informações de Contato</h3>
                <div class="seller-detail"><i class="fas fa-user"></i><span>${seller.nome || 'Não informado'}</span></div>
                <div class="seller-detail"><i class="fas fa-users"></i><span>${seller.turma || 'Não informada'}</span></div>
                <div class="seller-detail"><i class="fas fa-envelope"></i><span>${seller.email || 'Não informado'}</span></div>
                <div class="seller-detail"><i class="fas fa-phone"></i><span>${seller.telefone || 'Não informado'}</span></div>
            </div>`;
        } else {
            sellerHtml = `<div class="modal-seller-info"><p>Informações do vendedor não disponíveis.</p></div>`;
        }
        modalBody.innerHTML = `
            <img src="${imageUrl}" alt="Eu vou ${product.nome}" class="modal-product-image">
            <h2 class="modal-product-title">Eu vou ${product.nome || '...'}</h2>
            <p class="modal-product-price">${precoFormatado}</p>
            <p class="modal-product-description">${product.descricao || 'Nenhuma descrição fornecida.'}</p>
            ${sellerHtml}
        `;
        modalLoader.style.display = 'none';
    };

    const closeProductModal = () => modal.classList.remove('show');
    modalCloseBtn.addEventListener('click', closeProductModal);
    modal.addEventListener('click', (event) => { if (event.target === modal) closeProductModal(); });

    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const minRating = parseFloat(ratingFilter.value);
        let filteredProducts = [...allProducts];
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => 
                product.nome.toLowerCase().includes(searchTerm) ||
                product.descricao.toLowerCase().includes(searchTerm) ||
                product.vendedor.toLowerCase().includes(searchTerm)
            );
        }
        if (selectedCategory) {
            filteredProducts = filteredProducts.filter(product => product.categoria === selectedCategory);
        }
        if (minRating) {
            filteredProducts = filteredProducts.filter(product => product.avaliacao >= minRating);
        }
        renderProducts(filteredProducts);
    };

    const populateCategoryFilter = (products) => {
        const categories = [...new Set(products.map(p => p.categoria))];
        categories.sort();
        categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
        categories.forEach(category => {
            if (category) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                categoryFilter.appendChild(option);
            }
        });
    };

    const renderProducts = (productsToRender) => {
        productGrid.innerHTML = '';
        if (productsToRender.length === 0) {
            productGrid.innerHTML = "<p>Nenhum serviço encontrado com os filtros aplicados.</p>";
            return;
        }
        productsToRender.forEach((product) => {
            const imageUrl = product.imagem || 'https://via.placeholder.com/400x250?text=Sem+Imagem';
            const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.setAttribute('data-id', product.id);
            let ratingHtml = (product.avaliacao && product.avaliacao > 0) ?
                `<div class="product-rating"><i class="fas fa-star filled"></i><span>${product.avaliacao.toFixed(1)}</span></div>` :
                '<div class="product-rating-none">Sem avaliação</div>';
            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="Eu vou ${product.nome}" class="product-image">
                    <div class="product-price">${precoFormatado}</div>
                </div>
                <div class="product-info">
                    <div class="product-seller">
                        <span>${product.vendedor || 'Vendedor não informado'}</span>
                    </div>
                    <h4 class="product-title">Eu vou ${product.nome}</h4>
                    <p class="product-description-card">${product.descricao.substring(0, 100)}...</p>
                    <div class="product-meta">${ratingHtml}</div>
                </div>`;
            card.addEventListener('click', () => showProductModal(product.id));
            productGrid.appendChild(card);
        });
    };

    const loadProductsFromFirestore = async () => {
        loader.style.display = 'flex';
        productGrid.innerHTML = '';
        try {
            const snapshot = await db.collection('produtos').orderBy('criadoEm', 'desc').get();
            if (snapshot.empty) {
                renderProducts([]);
            } else {
                allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                populateCategoryFilter(allProducts);
                renderProducts(allProducts);
            }
        } catch (error) {
            console.error("Erro ao carregar produtos do Firestore: ", error);
            productGrid.innerHTML = "<p>Ocorreu um erro ao carregar os serviços. Tente recarregar a página.</p>";
        } finally {
            loader.style.display = 'none';
        }
    };
    
    searchInput.addEventListener('input', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    ratingFilter.addEventListener('change', applyFilters);

    loadProductsFromFirestore();
});