// javascript/meus-servicos.js

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

document.addEventListener('DOMContentLoaded', () => {

    // Seletores de elementos
    const productGrid = document.getElementById('productGrid');
    const loader = document.getElementById('loader');
    const editModal = document.getElementById('editModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const editForm = document.getElementById('editForm');
    const searchInput = document.getElementById('myServicesSearchInput');

    let currentUser = null;
    let userProducts = []; // Armazena todos os produtos do usuário para o filtro

    // Verifica a autenticação e inicia o carregamento dos produtos
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserProducts();
        } else {
            // Se não estiver logado, redireciona para a página de login
            window.location.href = "login.html";
        }
    });

    // FUNÇÃO PARA CARREGAR APENAS OS PRODUTOS DO USUÁRIO LOGADO
    const loadUserProducts = async () => {
        if (!currentUser) return;

        loader.style.display = 'flex';
        productGrid.innerHTML = '';

        try {
            // A consulta filtra apenas os produtos do usuário logado
            const snapshot = await db.collection('produtos')
                                     .where("vendedorId", "==", currentUser.uid)
                                     .orderBy('criadoEm', 'desc')
                                     .get();

            if (snapshot.empty) {
                productGrid.innerHTML = "<p>Você ainda não cadastrou nenhum serviço.</p>";
            } else {
                userProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderProducts(userProducts); // Renderiza todos os produtos do usuário
            }
        } catch (error) {
            console.error("Erro ao carregar seus produtos: ", error);
            productGrid.innerHTML = "<p>Ocorreu um erro ao buscar seus serviços.</p>";
        } finally {
            loader.style.display = 'none';
        }
    };

    // FUNÇÃO PARA RENDERIZAR OS CARDS NA TELA (com botões de ação)
    const renderProducts = (products) => {
        productGrid.innerHTML = '';

        if (products.length === 0) {
            productGrid.innerHTML = "<p>Nenhum serviço encontrado com o termo pesquisado.</p>";
            return;
        }


        if (products.length === 0) {
            productGrid.innerHTML = "<p>Nenhum serviço encontrado com o termo pesquisado.</p>";
            return;
        }
        products.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.setAttribute('data-id', product.id);

            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.imagem}" alt="Eu vou ${product.nome}" class="product-image">
                    <div class="product-price">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}</div>
                </div>
                <div class="product-info">
                    <h4 class="product-title">Eu vou ${product.nome}</h4>
                    <div class="card-actions">
                        <button class="action-btn btn-edit"><i class="fas fa-edit"></i> Editar</button>
                        <button class="action-btn btn-delete"><i class="fas fa-trash"></i> Excluir</button>
                    </div>
                </div>`;
            
            // Adiciona os eventos aos botões de editar e excluir
            card.querySelector('.btn-edit').addEventListener('click', () => openEditModal(product));
            card.querySelector('.btn-delete').addEventListener('click', () => deleteProduct(product.id));

            productGrid.appendChild(card);
        });
    };
    
    // FUNÇÃO PARA APLICAR O FILTRO DE PESQUISA
    const applySearch = () => {
        const searchTerm = searchInput.value.toLowerCase();
        if (!searchTerm) {
            renderProducts(userProducts); // Se a busca estiver vazia, mostra todos
            return;
        }
        const filteredProducts = userProducts.filter(product => 
            product.nome.toLowerCase().includes(searchTerm) ||
            product.descricao.toLowerCase().includes(searchTerm)
        );
        renderProducts(filteredProducts);
    };

    
    // Função para aplicar o filtro de pesquisa
    const applySearch = () => {
        const searchTerm = searchInput.value.toLowerCase();
        if (!searchTerm) {
            renderProducts(userProducts);
            return;
        }
        const filteredProducts = userProducts.filter(product => 
            product.nome.toLowerCase().includes(searchTerm) ||
            product.descricao.toLowerCase().includes(searchTerm)
        );
        renderProducts(filteredProducts);
    };


    // FUNÇÃO PARA ABRIR E PREENCHER O MODAL DE EDIÇÃO
    const openEditModal = (product) => {
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.nome;
        document.getElementById('editPrice').value = product.preco;
        document.getElementById('editDeliveryTime').value = product.prazo;
        document.getElementById('editDescription').value = product.descricao;
        editModal.classList.add('show');
    };

    // FUNÇÃO PARA FECHAR O MODAL DE EDIÇÃO
    const closeEditModal = () => editModal.classList.remove('show');
    modalCloseBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (event) => {
        if (event.target === editModal) closeEditModal();
    });

    // FUNÇÃO PARA SALVAR AS ALTERAÇÕES (UPDATE NO FIREBASE)
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const productId = document.getElementById('editProductId').value;
        toggleLoading(true);
        const updatedData = {
            nome: document.getElementById('editProductName').value,
            preco: parseFloat(document.getElementById('editPrice').value),
            prazo: document.getElementById('editDeliveryTime').value,
            descricao: document.getElementById('editDescription').value,
        };
        try {
            await db.collection('produtos').doc(productId).update(updatedData);
            closeEditModal();
            await loadUserProducts(); // Recarrega os produtos para mostrar os dados atualizados
            showToast("Serviço atualizado com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao atualizar o produto: ", error);
            showToast("Falha ao atualizar o serviço. Tente novamente.", "error");
        } finally {
            toggleLoading(false);
        }
    });

    // FUNÇÃO PARA EXCLUIR UM PRODUTO (DELETE NO FIREBASE)
    const deleteProduct = async (productId) => {
        if (!confirm("Tem certeza de que deseja excluir este serviço? Esta ação não pode ser desfeita.")) {
            return;
        }
        toggleLoading(true);
        try {
            await db.collection('produtos').doc(productId).delete();
            await loadUserProducts(); // Recarrega a lista para remover o card da tela
            showToast("Serviço excluído com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao excluir o produto: ", error);
            showToast("Falha ao excluir o serviço. Tente novamente.", "error");
        } finally {
            toggleLoading(false);
        }
    };
    
    // Adiciona o Event Listener para a barra de pesquisa
    searchInput.addEventListener('input', applySearch);
});