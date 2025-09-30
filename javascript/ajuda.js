// Objeto de configuração do Firebase com suas chaves
const firebaseConfig = {
    apiKey: "AIzaSyAKTwMCe5sUPoZz5jwSYV1WiNmGjGxNxY8",
    authDomain: "tcciwill.firebaseapp.com",
    databaseURL: "https://tcciwill-default-rtdb.firebaseio.com",
    projectId: "tcciwill",
    storageBucket: "tcciwill.appspot.com",
    messagingSenderId: "35460029082",
    appId: "1:35460029082:web:90ae52ac65ff355d8f9d23",
    measurementId: "G-YHPBHZQJBW"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth(); // Adiciona o serviço de autenticação

// Variável para guardar o estado do usuário
let currentUser = null;

// Função para mostrar/ocultar conteúdo e ativar/desativar botão
function showInfo(id) {
    document.querySelectorAll('.info-content').forEach(div => {
        div.style.display = 'none';
    });
    document.querySelectorAll('.info-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const divToShow = document.getElementById(id);
    const btnToActivate = document.querySelector(`.info-btn[onclick="showInfo('${id}')"]`);

    if (divToShow) {
        divToShow.style.display = 'block';
        divToShow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (btnToActivate) {
        btnToActivate.classList.add('active');
    }
}

// Função para alternar FAQ
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('span');

    if (answer.style.display === 'block') {
        answer.style.display = 'none';
        icon.textContent = '+';
    } else {
        answer.style.display = 'block';
        icon.textContent = '-';
    }
}

// Lógica de verificação de autenticação (NOVO)
document.addEventListener('DOMContentLoaded', function() {
    showInfo('tutoriais'); // Mostra tutoriais por padrão

    const formDenuncia = document.getElementById('form-denuncia');
    const loginNecessarioContainer = document.getElementById('login-necessario-container');

    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário está logado
            currentUser = user;
            loginNecessarioContainer.style.display = 'none'; // Esconde o aviso
            formDenuncia.style.display = 'block'; // Mostra o formulário
        } else {
            // Usuário não está logado
            currentUser = null;
            loginNecessarioContainer.style.display = 'block'; // Mostra o aviso
            formDenuncia.style.display = 'none'; // Esconde o formulário
        }
    });
});

// Lógica do formulário de denúncia (MODIFICADO)
const formDenuncia = document.getElementById('form-denuncia');
const btnEnviar = document.getElementById('btn-enviar-denuncia');
const btnText = btnEnviar.querySelector('.btn-text');
const btnSpinner = btnEnviar.querySelector('.btn-spinner');
const feedbackDiv = document.getElementById('feedback');

formDenuncia.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Verifica se o usuário está logado antes de prosseguir
    if (!currentUser) {
        showFeedback('Você precisa estar logado para enviar uma denúncia.', 'error');
        return;
    }

    setLoading(true);

    const denunciado = document.getElementById('denunciado').value;
    const motivo = document.getElementById('motivo').value;
    const descricao = document.getElementById('descricao').value;
    const provasFile = document.getElementById('provas').files[0];
    let provasUrl = null;

    try {
        if (provasFile) {
            if (provasFile.size > 5 * 1024 * 1024) { // 5MB
                throw new Error('O arquivo de prova não pode exceder 5MB.');
            }
            const storageRef = storage.ref(`denuncias/${Date.now()}_${provasFile.name}`);
            const uploadTask = await storageRef.put(provasFile);
            provasUrl = await uploadTask.ref.getDownloadURL();
        }

        const denuncia = {
            denuncianteId: currentUser.uid, // Adiciona o ID do usuário que fez a denúncia
            denunciado: denunciado,
            motivo: motivo,
            descricao: descricao,
            provaUrl: provasUrl,
            data: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pendente'
        };

        await db.collection('denuncias').add(denuncia);

        showFeedback('Denúncia enviada com sucesso! Nossa equipe irá analisar o caso. Obrigado por ajudar a manter a plataforma segura.', 'success');
        formDenuncia.reset();

    } catch (error) {
        console.error("Erro ao enviar denúncia: ", error);
        showFeedback(`Erro ao enviar denúncia: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
});

// Função para controlar o estado de loading do botão
function setLoading(isLoading) {
    if (isLoading) {
        btnEnviar.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';
    } else {
        btnEnviar.disabled = false;
        btnText.style.display = 'inline-block';
        btnSpinner.style.display = 'none';
    }
}

// Função para mostrar mensagens de feedback
function showFeedback(message, type) {
    feedbackDiv.className = `feedback-message ${type}`;
    feedbackDiv.textContent = message;
    
    // Mostra o feedback antes de definir o timeout para remoção
    feedbackDiv.style.display = 'block'; 

    setTimeout(() => {
        // Usa uma transição suave ou simplesmente esconde
        feedbackDiv.style.display = 'none';
    }, 7000);
}