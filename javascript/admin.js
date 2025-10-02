// javascript/admin.js

document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================
    // 1. CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE
    // ===================================================================
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

    // ===================================================================
    // 2. SELETORES DE ELEMENTOS DA PÁGINA (UI)
    // ===================================================================
    const ui = {
        loader: document.getElementById('loader'),
        tableBody: document.getElementById('tableBody'),
        logoutBtn: document.getElementById('logoutBtn')
    };

    // ===================================================================
    // 3. O GUARDIÃO: VERIFICAÇÃO DE ACESSO E PERMISSÕES
    // ===================================================================
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Usuário está logado. Agora, vamos verificar se ele é um admin.
            try {
                const userDoc = await db.collection('vendedores').doc(user.uid).get();

                // a. Se o documento do usuário não existe ou ele NÃO tem isAdmin: true
                if (!userDoc.exists || !userDoc.data().isAdmin) {
                    console.warn("Acesso negado. Este usuário não é um administrador.");
                    alert("Acesso negado. Esta é uma área restrita para administradores.");
                    window.location.href = 'vendas.html'; // Redireciona para a página principal
                } else {
                    // b. Se ele É um administrador, carrega os dados do painel.
                    console.log("Acesso de administrador concedido para:", user.email);
                    loadAllServices();
                }
            } catch (error) {
                console.error("Erro ao verificar permissões de administrador:", error);
                alert("Ocorreu um erro ao verificar suas permissões.");
                window.location.href = 'vendas.html';
            }
        } else {
            // Usuário não está logado. Redireciona para a página de login.
            console.log("Nenhum usuário logado. Redirecionando para login.");
            window.location.href = 'login.html';
        }
    });

    // ===================================================================
    // 4. O COLETOR DE DADOS: BUSCA TODOS OS SERVIÇOS NO FIREBASE
    // ===================================================================
    const loadAllServices = async () => {
        ui.loader.style.display = 'flex';
        ui.tableBody.innerHTML = ''; // Limpa a tabela antes de carregar

        try {
            const snapshot = await db.collection('produtos').orderBy('criadoEm', 'desc').get();

            if (snapshot.empty) {
                ui.tableBody.innerHTML = '<tr><td colspan="5">Nenhum serviço encontrado na plataforma.</td></tr>';
            } else {
                const services = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                renderTable(services); // Envia os dados para a função que constrói a tabela
            }
        } catch (error) {
            console.error("Erro ao carregar serviços:", error);
            ui.tableBody.innerHTML = '<tr><td colspan="5">Ocorreu um erro ao carregar os serviços.</td></tr>';
        } finally {
            ui.loader.style.display = 'none'; // Esconde o loader no final
        }
    };

    // ===================================================================
    // 5. O CONSTRUTOR: MONTA A TABELA COM OS DADOS
    // ===================================================================
    const renderTable = (services) => {
        services.forEach(service => {
            const tr = document.createElement('tr');

            // Formata a data para um formato legível (ex: 02/10/2025)
            const createdDate = service.criadoEm ? service.criadoEm.toDate().toLocaleDateString('pt-BR') : 'Data indisponível';
            // Formata o preço para o formato de moeda (ex: R$ 50,00)
            const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.preco);

            tr.innerHTML = `
                <td>${service.nome || 'Sem título'}</td>
                <td>${service.vendedor || 'Não informado'}</td>
                <td>${price}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn-delete" data-id="${service.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </td>
            `;
            ui.tableBody.appendChild(tr);
        });

        // Adiciona o evento de clique para CADA botão de excluir criado
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', handleDeleteService);
        });
    };

    // ===================================================================
    // 6. A AÇÃO: FUNÇÃO PARA EXCLUIR UM SERVIÇO
    // ===================================================================
    const handleDeleteService = async (event) => {
        const button = event.currentTarget;
        const serviceId = button.dataset.id;

        // Pede confirmação antes de uma ação destrutiva - MUITO IMPORTANTE!
        if (!confirm(`Tem certeza que deseja excluir permanentemente este serviço?`)) {
            return; // Se o admin clicar em "Cancelar", a função para aqui.
        }

        try {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';

            await db.collection('produtos').doc(serviceId).delete();

            alert("Serviço excluído com sucesso!");
            
            loadAllServices(); // Recarrega a tabela para refletir a mudança

        } catch (error) {
            console.error("Erro ao excluir serviço:", error);
            alert("Ocorreu um erro ao excluir o serviço. Tente novamente.");
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-trash"></i> Excluir';
        }
    };

    // ===================================================================
    // 7. A SAÍDA: FUNCIONALIDADE DE LOGOUT
    // ===================================================================
    ui.logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    });

});