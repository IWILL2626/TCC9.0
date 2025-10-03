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
const auth = firebase.auth();

// Variável global para guardar o estado do usuário
let currentUser = null;

// --- FUNÇÕES GLOBAIS (acessadas pelo HTML) ---

// Função para mostrar/ocultar conteúdo (abas de Tutoriais/Denúncias)
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
        // Opcional: rolar suavemente para o conteúdo
        divToShow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (btnToActivate) {
        btnToActivate.classList.add('active');
    }
}

// Função para alternar a visibilidade das respostas do FAQ
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('span');

    // Fecha todos os outros para criar um efeito 'accordion'
    document.querySelectorAll('.faq-answer').forEach(otherAnswer => {
        if (otherAnswer !== answer) {
            otherAnswer.style.display = 'none';
            otherAnswer.previousElementSibling.querySelector('span').textContent = '+';
        }
    });

    if (answer.style.display === 'block') {
        answer.style.display = 'none';
        icon.textContent = '+';
    } else {
        answer.style.display = 'block';
        icon.textContent = '-';
    }
}


// --- LÓGICA PRINCIPAL DA PÁGINA ---
// Executa somente depois que toda a página HTML foi carregada
document.addEventListener('DOMContentLoaded', function() {
    
    // Mostra a aba de tutoriais por padrão ao carregar a página
    showInfo('tutoriais');

    // Seleciona os elementos do formulário
    const formDenuncia = document.getElementById('form-denuncia');
    const loginNecessarioContainer = document.getElementById('login-necessario-container');
    const btnEnviar = document.getElementById('btn-enviar-denuncia');
    const btnText = btnEnviar.querySelector('.btn-text');
    const btnSpinner = btnEnviar.querySelector('.btn-spinner');
    const feedbackDiv = document.getElementById('feedback');

    // Monitora o estado de login do usuário
    auth.onAuthStateChanged(user => {
        if (user) {
            // Se o usuário está logado
            currentUser = user;
            loginNecessarioContainer.style.display = 'none'; // Esconde o aviso de login
            formDenuncia.style.display = 'block'; // Mostra o formulário de denúncia
        } else {
            // Se o usuário não está logado
            currentUser = null;
            loginNecessarioContainer.style.display = 'block'; // Mostra o aviso de login
            formDenuncia.style.display = 'none'; // Esconde o formulário de denúncia
        }
    });

    // Adiciona o listener para o envio do formulário
    formDenuncia.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!currentUser) {
            showFeedback('Você precisa estar logado para enviar uma denúncia.', 'error');
            return;
        }

        setLoading(true);

        // Pega os valores dos campos do formulário
        const denunciado = document.getElementById('denunciado').value;
        const motivo = document.getElementById('motivo').value;
        const descricao = document.getElementById('descricao').value;
        const provasFile = document.getElementById('provas').files[0];
        let provasUrl = null;

        try {
            // Faz o upload do arquivo de prova, se existir
            if (provasFile) {
                if (provasFile.size > 5 * 1024 * 1024) { // Validação de 5MB
                    throw new Error('O arquivo de prova não pode exceder 5MB.');
                }
                const storageRef = storage.ref(`denuncias/${Date.now()}_${provasFile.name}`);
                const uploadTask = await storageRef.put(provasFile);
                provasUrl = await uploadTask.ref.getDownloadURL();
            }

            // Cria o objeto da denúncia para salvar no Firestore
            const denuncia = {
                denuncianteId: currentUser.uid,
                denunciado: denunciado,
                motivo: motivo,
                descricao: descricao,
                provaUrl: provasUrl,
                data: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pendente'
            };

            // Salva a denúncia na coleção 'denuncias'
            await db.collection('denuncias').add(denuncia);

            showFeedback('Denúncia enviada com sucesso! Nossa equipe irá analisar o caso.', 'success');
            formDenuncia.reset();

        } catch (error) {
            console.error("Erro ao enviar denúncia: ", error);
            showFeedback(`Erro ao enviar denúncia: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    });

    // --- FUNÇÕES AUXILIARES DO FORMULÁRIO ---

    // Função para controlar o estado de 'carregando' do botão de envio
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

    // Função para mostrar mensagens de feedback (sucesso ou erro)
    function showFeedback(message, type) {
        feedbackDiv.className = `feedback-message ${type}`;
        feedbackDiv.textContent = message;
        feedbackDiv.style.display = 'block';

        setTimeout(() => {
            feedbackDiv.style.display = 'none';
        }, 7000);
    }
});