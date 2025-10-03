// Objeto de configuração do Firebase
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
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

let currentUser = null;

// Função para mostrar/ocultar abas de conteúdo
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
    }
    if (btnToActivate) {
        btnToActivate.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    showInfo('tutoriais'); // Mostra tutoriais por padrão ao carregar a página

    // Lógica para expandir/recolher FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = answer.style.maxHeight;

            question.classList.toggle('open');

            if (isOpen) {
                answer.style.maxHeight = null;
            } else {
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // Seletores de elementos do formulário
    const formDenuncia = document.getElementById('form-denuncia');
    const loginNecessarioContainer = document.getElementById('login-necessario-container');
    const btnEnviar = document.getElementById('btn-enviar-denuncia');
    const btnText = btnEnviar.querySelector('.btn-text');
    const btnSpinner = btnEnviar.querySelector('.btn-spinner');
    const feedbackDiv = document.getElementById('feedback');

    // Verifica o estado de autenticação do usuário
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loginNecessarioContainer.style.display = 'none';
            formDenuncia.style.display = 'block';
        } else {
            currentUser = null;
            // Garante que o formulário não seja exibido se o usuário não estiver logado
            if (document.getElementById('denuncias').style.display === 'block') {
                 loginNecessarioContainer.style.display = 'block';
                 formDenuncia.style.display = 'none';
            }
        }
    });

    // Adiciona o listener de submit ao formulário
    formDenuncia.addEventListener('submit', async function(e) {
        e.preventDefault();
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
                if (provasFile.size > 5 * 1024 * 1024) { // Validação de 5MB
                    throw new Error('O arquivo de prova não pode exceder 5MB.');
                }
                const storageRef = storage.ref(`denuncias/${Date.now()}_${provasFile.name}`);
                const uploadTask = await storageRef.put(provasFile);
                provasUrl = await uploadTask.ref.getDownloadURL();
            }

            const denuncia = {
                denuncianteId: currentUser.uid,
                denunciado: denunciado,
                motivo: motivo,
                descricao: descricao,
                provaUrl: provasUrl,
                data: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pendente'
            };

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
        feedbackDiv.style.display = 'block';
        setTimeout(() => {
            feedbackDiv.style.display = 'none';
        }, 7000);
    }
});