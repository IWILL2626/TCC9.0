// javascript/perfil.js

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

document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DO DOM ---
    const editModal = document.getElementById('editModal');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const editNameInput = document.getElementById('editName');
    const editPhoneInput = document.getElementById('editPhone');
    const editClassInput = document.getElementById('editClass');
    
    // ✅ ELEMENTOS PARA FOTO DE PERFIL
    const profileImageInput = document.getElementById('profileImageInput');
    const profilePic = document.getElementById('profilePic');

    let currentUser = null;

    // --- FUNÇÕES DE CONTROLE DO MODAL ---
    const openModal = () => editModal.classList.add('show');
    const closeModal = () => editModal.classList.remove('show');
    editProfileBtn.addEventListener('click', openModal);
    modalCloseBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    editModal.addEventListener('click', (event) => {
        if (event.target === editModal) closeModal();
    });

    // --- FUNÇÃO PRINCIPAL DE CARREGAMENTO ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            try {
                const userDoc = await db.collection("vendedores").doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    
                    // Preenche os dados na PÁGINA PRINCIPAL
                    document.getElementById('userName').textContent = userData.nome || "Não informado";
                    document.getElementById('userEmail').textContent = user.email;
                    document.getElementById('userEmail2').textContent = user.email;
                    document.getElementById('userPhone').textContent = userData.telefone || "Não informado";
                    document.getElementById('userClass').textContent = userData.turma || "Não informada";
                    
                    // ✅ Preenche a FOTO DE PERFIL
                    if (userData.imagemPerfil) {
                        profilePic.src = userData.imagemPerfil;
                    }
                    
                    // Preenche os dados no FORMULÁRIO DO MODAL
                    editNameInput.value = userData.nome || "";
                    editPhoneInput.value = userData.telefone || "";
                    editClassInput.value = userData.turma || "";
                }
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                showToast("Erro ao carregar perfil.", "error");
            }
        } else {
            window.location.href = "login.html";
        }
    });

    // ✅ FUNÇÃO PARA SALVAR ALTERAÇÕES DE TEXTO (AGORA COM UTILS.JS)
    saveChangesBtn.addEventListener('click', async () => {
        if (!currentUser) return;

        const dataToUpdate = {
            nome: editNameInput.value.trim(),
            telefone: editPhoneInput.value.trim(),
            turma: editClassInput.value.trim()
        };

        toggleLoading(true);
        try {
            await db.collection("vendedores").doc(currentUser.uid).update(dataToUpdate);

            document.getElementById('userName').textContent = dataToUpdate.nome;
            document.getElementById('userPhone').textContent = dataToUpdate.telefone;
            document.getElementById('userClass').textContent = dataToUpdate.turma;
            
            showToast("Perfil atualizado com sucesso!", "success");
            closeModal();
        } catch (error) {
            console.error("Erro ao atualizar o perfil:", error);
            showToast("Ocorreu um erro ao salvar.", "error");
        } finally {
            toggleLoading(false);
        }
    });

    // ✅ FUNÇÃO PARA ATUALIZAR A FOTO DE PERFIL
    profileImageInput.addEventListener('change', async (event) => {
        if (!currentUser) return;
        const file = event.target.files[0];
        if (!file) return;

        toggleLoading(true);
        try {
            const imageBase64 = await convertImageToBase64(file);
            profilePic.src = imageBase64; // Atualiza na tela
            
            await db.collection("vendedores").doc(currentUser.uid).update({
                imagemPerfil: imageBase64 // Salva no Firebase
            });

            showToast('Foto de perfil atualizada!', 'success');
        } catch (error) {
            console.error("Erro ao atualizar foto:", error);
            showToast('Não foi possível atualizar a foto.', 'error');
        } finally {
            toggleLoading(false);
        }
    });
    
    // ✅ FUNÇÃO AUXILIAR PARA CONVERTER IMAGEM
    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
});