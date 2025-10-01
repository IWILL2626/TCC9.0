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
    
    // --- ELEMENTOS DO DOM (sem alterações) ---
    const editModal = document.getElementById('editModal');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const editNameInput = document.getElementById('editName');
    const editPhoneInput = document.getElementById('editPhone');
    const editClassInput = document.getElementById('editClass');
    const profileImageInput = document.getElementById('profileImageInput');
    const profilePic = document.getElementById('profilePic');

    let currentUser = null;

    // --- LÓGICA DE CARREGAMENTO E MODAL (sem alterações) ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            // ... (restante da função mantida)
        } else {
            window.location.href = "login.html";
        }
    });
    // ... (restante das funções de modal e loadUserProfile mantidas)
    
    // ✅ NOVA FUNÇÃO ADICIONADA: Redimensiona a imagem antes de salvar
    function resizeImage(base64Str, maxWidth = 400, maxHeight = 400) {
        return new Promise((resolve) => {
            let img = new Image();
            img.src = base64Str;
            img.onload = () => {
                let canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                let ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Comprime a imagem para o formato JPEG com 90% de qualidade
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
        });
    }

    // --- FUNÇÕES DE ATUALIZAÇÃO DO PERFIL ---
    
    // Função para salvar alterações de texto (sem alterações)
    saveChangesBtn.addEventListener('click', async () => { /* ... */ });
    
    // ✅ ALTERADO: Lógica de atualização de foto agora com redimensionamento
    profileImageInput.addEventListener('change', async (event) => {
        if (!currentUser) return;
        const file = event.target.files[0];
        if (!file) return;

        toggleLoading(true);
        try {
            // 1. Converte o arquivo original para Base64
            const originalBase64 = await convertImageToBase64(file);
            
            // 2. Redimensiona a imagem para um tamanho adequado
            const resizedBase64 = await resizeImage(originalBase64);

            // 3. Mostra a imagem redimensionada na tela
            profilePic.src = resizedBase64;
            
            // 4. Salva a imagem redimensionada (menor) no Firebase
            await db.collection("vendedores").doc(currentUser.uid).update({
                imagemPerfil: resizedBase64
            });

            showToast('Foto de perfil atualizada!', 'success');
        } catch (error) {
            console.error("Erro ao atualizar foto:", error);
            showToast('Não foi possível atualizar a foto.', 'error');
            // Recarrega os dados antigos em caso de erro
            loadUserProfile(currentUser.uid); 
        } finally {
            toggleLoading(false);
        }
    });
    
    // Função auxiliar para converter imagem
    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // --- CÓDIGO RESTANTE (ex: loadUserProfile, openModal, etc) ---
    // (Cole o restante do seu código original aqui, se houver mais alguma função)
    // Se você estiver usando o último código completo que te enviei, não precisa adicionar mais nada.
    
    // Colando o restante das funções para garantir que o arquivo fique completo:
    const loadUserProfile = async (uid) => {
        try {
            const userDoc = await db.collection("vendedores").doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                profilePic.src = userData.imagemPerfil || 'img/avatar.png';
                document.getElementById('userName').textContent = userData.nome || "Não informado";
                document.getElementById('userEmail').textContent = auth.currentUser.email;
                document.getElementById('userEmail2').textContent = auth.currentUser.email;
                document.getElementById('userPhone').textContent = userData.telefone || "Não informado";
                document.getElementById('userClass').textContent = userData.turma || "Não informada";
                editNameInput.value = userData.nome || "";
                editPhoneInput.value = userData.telefone || "";
                editClassInput.value = userData.turma || "";
            }
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            showToast("Erro ao carregar perfil.", "error");
        }
    };

    const openModal = () => editModal.classList.add('show');
    const closeModal = () => editModal.classList.remove('show');
    editProfileBtn.addEventListener('click', openModal);
    modalCloseBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    editModal.addEventListener('click', (event) => {
        if (event.target === editModal) closeModal();
    });

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
});