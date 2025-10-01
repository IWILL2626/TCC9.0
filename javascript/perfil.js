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

    // --- ELEMENTOS DO PERFIL (PÁGINA PRINCIPAL) ---
    const profileImage = document.getElementById('profileImage');
    const newProfileImageInput = document.getElementById('newProfileImageInput');
    const profileName = document.getElementById('profileName');
    const profileCourse = document.getElementById('profileCourse');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');

    // --- ELEMENTOS DO MODAL DE EDIÇÃO ---
    const editModal = document.getElementById('editModal');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const editNameInput = document.getElementById('editName');
    const editPhoneInput = document.getElementById('editPhone');
    const editCourseInput = document.getElementById('editCourse');

    let currentUser = null;

    // --- CONTROLE DE AUTENTICAÇÃO E CARREGAMENTO INICIAL ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            loadUserProfile(user.uid);
        } else {
            window.location.href = 'login.html';
        }
    });

    // --- FUNÇÕES PRINCIPAIS ---

    // Carrega todos os dados do perfil (foto e texto)
    const loadUserProfile = async (uid) => {
        try {
            const userDoc = await db.collection('vendedores').doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Preenche os dados na página principal
                profileImage.src = userData.imagemPerfil || 'img/avatar.png';
                profileName.textContent = userData.nome || 'Não informado';
                profileCourse.textContent = userData.turma || 'Não informada';
                profileUsername.textContent = userData.username || 'Não informado';
                profileEmail.textContent = userData.email || 'Não informado';
                profilePhone.textContent = userData.telefone || 'Não informado';

                // Preenche os dados no formulário do modal para edição
                editNameInput.value = userData.nome || "";
                editPhoneInput.value = userData.telefone || "";
                editCourseInput.value = userData.turma || "";
            } else {
                console.log('Documento do usuário não encontrado!');
            }
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            showToast("Erro ao carregar seu perfil.", "error");
        }
    };

    // Converte uma imagem para o formato Base64
    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // --- CONTROLES DO MODAL DE EDIÇÃO DE TEXTO ---
    const openEditModal = () => editModal.classList.add('show');
    const closeEditModal = () => editModal.classList.remove('show');

    editProfileBtn.addEventListener('click', openEditModal);
    modalCloseBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (event) => {
        if (event.target === editModal) closeEditModal();
    });

    // --- EVENT LISTENERS PARA AS AÇÕES ---

    // 1. Atualizar a FOTO de perfil
    newProfileImageInput.addEventListener('change', async (event) => {
        if (!currentUser) return;
        const file = event.target.files[0];
        if (!file) return;

        toggleLoading(true);
        try {
            const imageBase64 = await convertImageToBase64(file);
            profileImage.src = imageBase64; // Atualiza na tela
            await db.collection('vendedores').doc(currentUser.uid).update({
                imagemPerfil: imageBase64 // Salva no Firebase
            });
            showToast('Foto de perfil atualizada!', 'success');
        } catch (error) {
            console.error("Erro ao atualizar foto:", error);
            showToast('Não foi possível atualizar a foto.', 'error');
            loadUserProfile(currentUser.uid); // Recarrega para voltar à foto antiga
        } finally {
            toggleLoading(false);
        }
    });

    // 2. Salvar as alterações de TEXTO do perfil
    saveChangesBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        
        const dataToUpdate = {
            nome: editNameInput.value.trim(),
            telefone: editPhoneInput.value.trim(),
            turma: editCourseInput.value.trim()
        };

        toggleLoading(true);
        try {
            await db.collection("vendedores").doc(currentUser.uid).update(dataToUpdate);
            
            // Atualiza os dados na página em tempo real
            profileName.textContent = dataToUpdate.nome;
            profilePhone.textContent = dataToUpdate.telefone;
            profileCourse.textContent = dataToUpdate.turma;
            
            showToast("Perfil atualizado com sucesso!", "success");
            closeEditModal();
        } catch (error) {
            console.error("Erro ao atualizar o perfil:", error);
            showToast("Ocorreu um erro ao salvar.", "error");
        } finally {
            toggleLoading(false);
        }
    });
});