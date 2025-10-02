// javascript/admin.js - VERSÃO 2.0 COM CARDS E MODAL

document.addEventListener('DOMContentLoaded', () => {

    // 1. CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE (Mantido)
    const firebaseConfig = { /* ... (seu config aqui) ... */ };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // 2. SELETORES DE ELEMENTOS DA PÁGINA (UI) - ATUALIZADO
    const ui = {
        loader: document.getElementById('loader'),
        servicesGrid: document.getElementById('servicesGrid'),
        logoutBtn: document.getElementById('logoutBtn'),
        modal: document.getElementById('detailsModal'),
        modalBody: document.getElementById('modalBody'),
        modalCloseBtn: document.getElementById('modalCloseBtn'),
    };

    let allServices = []; // Armazena todos os serviços para não precisar buscar de novo

    // 3. O GUARDIÃO (Verificação de Acesso - Mantido)
    auth.onAuthStateChanged(async (user) => { /* ... (código mantido igual) ... */ });

    // 4. O COLETOR DE DADOS (Busca todos os serviços - Mantido)
    const loadAllServices = async () => {
        ui.loader.style.display = 'flex';
        ui.servicesGrid.innerHTML = '';

        try {
            const snapshot = await db.collection('produtos').orderBy('criadoEm', 'desc').get();
            if (snapshot.empty) {
                ui.servicesGrid.innerHTML = '<p>Nenhum serviço encontrado na plataforma.</p>';
            } else {
                allServices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderCards(allServices);
            }
        } catch (error) {
            console.error("Erro ao carregar serviços:", error);
            ui.servicesGrid.innerHTML = '<p>Ocorreu um erro ao carregar os serviços.</p>';
        } finally {
            ui.loader.style.display = 'none';
        }
    };

    // 5. O CONSTRUTOR DE CARDS (Substitui o construtor de tabela)
    const renderCards = (services) => {
        ui.servicesGrid.innerHTML = ''; // Limpa a grade
        services.forEach((service, index) => {
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.dataset.id = service.id;

            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${service.imagem || 'https://via.placeholder.com/400x250?text=Sem+Imagem'}" alt="${service.nome}" class="card-image">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${service.nome || 'Serviço sem título'}</h3>
                    <p class="card-seller-info">
                        <i class="fas fa-user-circle"></i>
                        <span>${service.vendedor || 'Vendedor não informado'}</span>
                    </p>
                </div>
            `;
            
            // Adiciona o evento para abrir o modal
            card.addEventListener('click', () => showModal(service));
            ui.servicesGrid.appendChild(card);

            // ANIMAÇÃO: Adiciona a classe 'visible' com um pequeno atraso para efeito cascata
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 100);
        });
    };

    // 6. LÓGICA DO MODAL (Novo)
    const showModal = (service) => {
        const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.preco);
        const createdDate = service.criadoEm ? service.criadoEm.toDate().toLocaleDateString('pt-BR') : 'N/A';

        ui.modalBody.innerHTML = `
            <div class="modal-image-container">
                <img src="${service.imagem || 'https://via.placeholder.com/400x250?text=Sem+Imagem'}" class="modal-image" alt="${service.nome}">
            </div>
            <div class="modal-details">
                <h2 class="modal-title">${service.nome}</h2>
                <p><strong>Vendedor:</strong> ${service.vendedor}</p>
                <p><strong>Preço:</strong> ${price}</p>
                <p><strong>Prazo:</strong> ${service.prazo || 'Não informado'}</p>
                <p><strong>Data de Criação:</strong> ${createdDate}</p>
                <p class="modal-description"><strong>Descrição:</strong><br>${service.descricao || 'Nenhuma descrição fornecida.'}</p>
            </div>
            <div class="modal-actions">
                <button class="btn-delete" data-id="${service.id}">
                    <i class="fas fa-trash"></i> Excluir Permanentemente
                </button>
            </div>
        `;

        ui.modal.classList.add('show');

        // Adiciona evento ao novo botão de excluir dentro do modal
        ui.modal.querySelector('.btn-delete').addEventListener('click', handleDeleteService);
    };

    const closeModal = () => {
        ui.modal.classList.remove('show');
    };

    ui.modalCloseBtn.addEventListener('click', closeModal);
    ui.modal.addEventListener('click', (event) => {
        if (event.target === ui.modal) {
            closeModal();
        }
    });


    // 7. A AÇÃO DE EXCLUIR (Ligeiramente modificado para fechar o modal)
    const handleDeleteService = async (event) => {
        const button = event.currentTarget;
        const serviceId = button.dataset.id;

        if (!confirm("Tem certeza que deseja excluir PERMANENTEMENTE este serviço?\nEsta ação não pode ser desfeita.")) {
            return;
        }

        try {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
            
            await db.collection('produtos').doc(serviceId).delete();
            
            alert("Serviço excluído com sucesso!");
            closeModal(); // Fecha o modal após a exclusão
            loadAllServices(); // Recarrega os cards

        } catch (error) {
            console.error("Erro ao excluir serviço:", error);
            alert("Ocorreu um erro ao excluir o serviço.");
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-trash"></i> Excluir Permanentemente';
        }
    };

    // 8. LOGOUT (Mantido)
    ui.logoutBtn.addEventListener('click', () => { /* ... (código mantido igual) ... */ });

});