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

    const productGrid = document.getElementById('productGrid');
    const loader = document.getElementById('loader');
    const editModal = document.getElementById('editModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const editForm = document.getElementById('editForm');

    let currentUser = null;
    let userProducts = [];

    // Verifica a autenticação e inicia o carregamento dos produtos
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserProducts();
        } else {
            window.location.href = "login.html";
        }
    });

    // FUNÇÃO PARA CARREGAR OS PRODUTOS DO USUÁRIO
    const loadUserProducts = async () => {
        if (!currentUser) return;
        loader.style.display = 'flex';
        productGrid.innerHTML = '';
        try {
            const snapshot = await db.collection('produtos')
                                     .where("vendedorId", "==", currentUser.uid)
                                     .orderBy('criadoEm', 'desc')
                                     .get();
            if (snapshot.empty) {
                productGrid.innerHTML = "<p>Você ainda não cadastrou nenhum serviço.</p>";
            } else {
                userProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderProducts(userProducts);
            }
        } catch (error) {
            console.error("Erro ao carregar seus produtos: ", error);
            productGrid.innerHTML = "<p>Ocorreu um erro ao buscar seus serviços.</p>";
        } finally {
            loader.style.display = 'none';
        }
    };

    // FUNÇÃO PARA RENDERIZAR OS CARDS (sem alterações)
    const renderProducts = (products) => {
        productGrid.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.setAttribute('data-id', product.id);
            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.imagem}" alt="${product.nome}" class="product-image">
                    <div class="product-price">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}</div>
                </div>
                <div class="product-info">
                    <h4 class="product-title">${product.nome}</h4>
                    <div class="card-actions">
                        <button class="action-btn btn-edit"><i class="fas fa-edit"></i> Editar</button>
                        <button class="action-btn btn-delete"><i class="fas fa-trash"></i> Excluir</button>
                    </div>
                </div>`;
            card.querySelector('.btn-edit').addEventListener('click', () => openEditModal(product));
            card.querySelector('.btn-delete').addEventListener('click', () => deleteProduct(product.id));
            productGrid.appendChild(card);
        });
    };

    // FUNÇÕES DO MODAL (sem alterações)
    const openEditModal = (product) => {
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.nome;
        document.getElementById('editPrice').value = product.preco;
        document.getElementById('editDeliveryTime').value = product.prazo;
        document.getElementById('editDescription').value = product.descricao;
        editModal.classList.add('show');
    };
    const closeEditModal = () => editModal.classList.remove('show');
    modalCloseBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (event) => {
        if (event.target === editModal) closeEditModal();
    });

    // ✅ ALTERADO: FUNÇÃO PARA SALVAR COM toggleLoading e showToast
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const productId = document.getElementById('editProductId').value;
        
        toggleLoading(true); // Mostra o loading global

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
            toggleLoading(false); // Esconde o loading global
        }
    });

    // ✅ ALTERADO: FUNÇÃO PARA EXCLUIR COM toggleLoading e showToast
    const deleteProduct = async (productId) => {
        if (!confirm("Tem certeza de que deseja excluir este serviço? Esta ação não pode ser desfeita.")) {
            return;
        }

        toggleLoading(true); // Mostra o loading global

        try {
            await db.collection('produtos').doc(productId).delete();
            await loadUserProducts(); // Recarrega a lista para remover o card da tela
            showToast("Serviço excluído com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao excluir o produto: ", error);
            showToast("Falha ao excluir o serviço. Tente novamente.", "error");
        } finally {
            toggleLoading(false); // Esconde o loading global
        }
    };
});