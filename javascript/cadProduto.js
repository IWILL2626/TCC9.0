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
    // ✅ VERIFICAÇÃO ADICIONAL: Garante que utils.js foi carregado
    if (typeof showToast === 'undefined' || typeof toggleLoading === 'undefined') {
        console.error("utils.js não foi carregado corretamente.");
        return;
    }

    // Verifica se o usuário está logado
    auth.onAuthStateChanged(user => {
        if (!user) {
            // ✅ ALTERADO: usa showToast em vez de alert
            showToast("Você precisa estar logado para cadastrar um serviço.", "error");
            // Adiciona um pequeno delay para o usuário ver o toast antes de ser redirecionado
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    });

    // Elementos do DOM (sem alterações)
    const productName = document.getElementById('productName');
    const deliveryTime = document.getElementById('deliveryTime');
    const price = document.getElementById('price');
    const description = document.getElementById('description');
    const sellerName = document.getElementById('sellerName');
    const categorySelect = document.getElementById('categorySelect');
    const customCategoryGroup = document.querySelector('.custom-category-group');
    const customCategoryInput = document.getElementById('customCategory');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const publishBtn = document.getElementById('publishBtn');

    let uploadedImageBase64 = "";

    // Lógica de UI (sem alterações)
    categorySelect.addEventListener('change', () => {
        customCategoryGroup.style.display = (categorySelect.value === 'outros') ? 'block' : 'none';
        if (categorySelect.value !== 'outros') customCategoryInput.value = '';
        checkFormValidity();
    });

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                uploadedImageBase64 = e.target.result;
                checkFormValidity();
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.src = "#";
            imagePreview.style.display = 'none';
            uploadedImageBase64 = "";
            checkFormValidity();
        }
    });

    const checkFormValidity = () => {
        const areTextFieldsValid = productName.value.trim() !== '' && deliveryTime.value.trim() !== '' && price.value.trim() !== '' && description.value.trim() !== '' && sellerName.value.trim() !== '';
        const isCategoryValid = (categorySelect.value !== '') && (categorySelect.value !== 'outros' || customCategoryInput.value.trim() !== '');
        const isImageUploaded = uploadedImageBase64 !== "";
        publishBtn.disabled = !(areTextFieldsValid && isCategoryValid && isImageUploaded);
    };

    document.querySelectorAll('.input-field').forEach(input => {
        input.addEventListener('input', checkFormValidity);
    });
    customCategoryInput.addEventListener('input', checkFormValidity);

    // ✅ ALTERADO: Ação de publicar com toggleLoading e showToast
    publishBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            showToast("Sua sessão expirou. Por favor, faça login novamente.", "error");
            return;
        }

        toggleLoading(true); // Mostra a tela de carregamento

        const productCategory = (categorySelect.value === 'outros') ? customCategoryInput.value.trim() : categorySelect.value;
        
        const product = {
            nome: productName.value.trim(),
            prazo: deliveryTime.value.trim(),
            preco: parseFloat(price.value),
            descricao: description.value.trim(),
            vendedor: sellerName.value.trim(),
            imagem: uploadedImageBase64,
            categoria: productCategory,
            vendedorId: user.uid,
            avaliacao: 0,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('produtos').add(product);
            
            showToast("Serviço publicado com sucesso!", "success");
            
            setTimeout(() => {
                window.location.href = 'vendas.html';
            }, 1500); // Espera 1.5s para o usuário ver o toast

        } catch (error) {
            console.error("Erro ao salvar no Firestore: ", error);
            showToast("Erro ao publicar o serviço. Tente novamente.", "error");
        } finally {
            // O bloco finally garante que o loading será removido, mesmo se der erro
            toggleLoading(false);
        }
    });

    checkFormValidity();
});