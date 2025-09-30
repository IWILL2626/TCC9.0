// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAKTwMCe5sUPoZz5jwSYV1WiNmGjGxNxY8",
    authDomain: "tcciwill.firebaseapp.com",
    projectId: "tcciwill",
    storageBucket: "tcciwill.appspot.com",
    messagingSenderId: "35460029082",
    appId: "1:35460029082:web:90ae52ac65ff355d8f9d23"
};

// Inicialização dos serviços Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // ======================================================
    // ELEMENTOS DO DOM PARA O MODAL (ADICIONADOS)
    // ======================================================
    const editModal = document.getElementById('editModal');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveChangesBtn = document.getElementById('saveChangesBtn');

    // Inputs do formulário de edição
    const editNameInput = document.getElementById('editName');
    const editPhoneInput = document.getElementById('editPhone');
    const editClassInput = document.getElementById('editClass');

    // ======================================================
    // FUNÇÕES PARA CONTROLAR O MODAL (ADICIONADAS)
    // ======================================================
    const openModal = () => editModal.classList.add('show');
    const closeModal = () => editModal.classList.remove('show');

    // Adiciona os listeners para abrir e fechar o modal
    editProfileBtn.addEventListener('click', openModal);
    modalCloseBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    // Fecha o modal se clicar fora dele
    editModal.addEventListener('click', (event) => {
        if (event.target === editModal) {
            closeModal();
        }
    });

    // Função principal que carrega os dados do perfil
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Usuário está logado
            console.log("Usuário logado:", user.uid);
            
            try {
                const userDoc = await db.collection("vendedores").doc(user.uid).get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log("Dados do usuário:", userData);
                    
                    // Preenche os dados na PÁGINA PRINCIPAL
                    document.getElementById('userName').textContent = userData.nome || "Não informado";
                    document.getElementById('userEmail').textContent = user.email;
                    document.getElementById('userEmail2').textContent = user.email;
                    document.getElementById('userPhone').textContent = userData.telefone || "Não informado";
                    document.getElementById('userClass').textContent = userData.turma || "Não informada";
                    
                    // Preenche os dados no FORMULÁRIO DO MODAL
                    editNameInput.value = userData.nome || "";
                    editPhoneInput.value = userData.telefone || "";
                    editClassInput.value = userData.turma || "";

                    if (userData.fotoPerfil) {
                        document.getElementById('profilePic').src = userData.fotoPerfil;
                    }
                } else {
                    console.log("Nenhum dado adicional encontrado!");
                    // Ainda assim, preenche o email que já temos
                    document.getElementById('userEmail').textContent = user.email;
                    document.getElementById('userEmail2').textContent = user.email;
                }
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                alert("Erro ao carregar perfil. Tente novamente mais tarde.");
            }
        } else {
            // Usuário não está logado, redireciona
            alert("Você precisa estar logado para acessar esta página!");
            window.location.href = "login.html";
        }
    });

    // ======================================================
    // FUNÇÃO PARA SALVAR AS ALTERAÇÕES (ADICIONADA)
    // ======================================================
    saveChangesBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("Sua sessão expirou. Faça login novamente.");
            return;
        }

        // Pega os novos valores dos inputs
        const newName = editNameInput.value.trim();
        const newPhone = editPhoneInput.value.trim();
        const newClass = editClassInput.value.trim();

        // Cria um objeto com os dados a serem atualizados
        const dataToUpdate = {
            nome: newName,
            telefone: newPhone,
            turma: newClass
        };

        try {
            // Atualiza o documento no Firestore
            await db.collection("vendedores").doc(user.uid).update(dataToUpdate);

            // Atualiza os dados na página em tempo real
            document.getElementById('userName').textContent = newName;
            document.getElementById('userPhone').textContent = newPhone;
            document.getElementById('userClass').textContent = newClass;
            
            alert("Perfil atualizado com sucesso!");
            closeModal(); // Fecha o modal após salvar

        } catch (error) {
            console.error("Erro ao atualizar o perfil:", error);
            alert("Ocorreu um erro ao salvar as alterações. Tente novamente.");
        }
    });
});