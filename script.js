// ============================================================
// CONFIGURATION
// ============================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbxjQMufVnpM8ZoNWNKZGkobFu75EYxYJ3rQCaFgnJ1fCpoMJpEFTFAzumoVx2bTXkkN/exec';

// ============================================================
// CHARGEMENT DES POSTS
// ============================================================

async function chargerPosts() {
    try {
        const response = await fetch(API_URL);
        const posts = await response.json();
        
        if (window.location.pathname.endsWith('post.html')) {
            // Page d'un post spécifique
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            const post = posts.find(p => p["Nom du fichier"] === id);
            if (post) {
                afficherPost(post);
            } else {
                document.getElementById('postContent').innerHTML = '<p>Post non trouvé</p>';
            }
        } else {
            // Page d'accueil
            initialiserFiltres(posts);
            afficherPosts(posts);
        }
        
        return posts;
    } catch (error) {
        console.error('Erreur de chargement:', error);
        document.getElementById('postsList').innerHTML = '<p>❌ Erreur de chargement des posts</p>';
    }
}

// ============================================================
// AFFICHAGE DES POSTS (ACCUEIL)
// ============================================================

function afficherPosts(posts) {
    const container = document.getElementById('postsList');
    
    const niveau = document.getElementById('niveauFilter').value;
    const categorie = document.getElementById('categorieFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = posts.filter(post => {
        const matchNiveau = !niveau || post.Niveau == niveau;
        const matchCategorie = !categorie || post.Cours === categorie;
        const matchSearch = !search || 
            post.Chapitre.toLowerCase().includes(search) || 
            post.Contenu.toLowerCase().includes(search);
        return matchNiveau && matchCategorie && matchSearch;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = '<p>Aucun post ne correspond à vos critères</p>';
        return;
    }
    
    container.innerHTML = filtered.map(post => `
        <div class="post-card" onclick="window.location.href='/qiraat/post.html?id=${encodeURIComponent(post["Nom du fichier"])}'">
            <span class="badge niveau">Niveau ${post.Niveau}</span>
            <span class="badge categorie">${post.Cours}</span>
            <h3>${post.Chapitre}</h3>
            <div class="contenu-preview">${post.Contenu.substring(0, 150)}...</div>
            <div class="meta">📅 ${new Date(post["Date post"]).toLocaleDateString('fr-FR')} • Chapitre ${post["Num chapitre"]}</div>
        </div>
    `).join('');
}

// ============================================================
// FILTRES
// ============================================================

function initialiserFiltres(posts) {
    const niveaux = [...new Set(posts.map(p => p.Niveau))].sort();
    const categories = [...new Set(posts.map(p => p.Cours))];
    
    const niveauSelect = document.getElementById('niveauFilter');
    const categorieSelect = document.getElementById('categorieFilter');
    
    niveaux.forEach(n => {
        const option = document.createElement('option');
        option.value = n;
        option.textContent = `Niveau ${n}`;
        niveauSelect.appendChild(option);
    });
    
    categories.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        categorieSelect.appendChild(option);
    });
    
    niveauSelect.addEventListener('change', () => afficherPosts(posts));
    categorieSelect.addEventListener('change', () => afficherPosts(posts));
    document.getElementById('searchInput').addEventListener('input', () => afficherPosts(posts));
}

// ============================================================
// FONCTION POUR PARSER UN QUIZ
// ============================================================

function parserQuiz(texteQuiz) {
    if (!texteQuiz || !texteQuiz.trim()) return null;
    
    // Séparer les lignes (chaque question)
    const questions = texteQuiz.split('\n').filter(q => q.trim());
    const resultats = [];
    
    for (let q of questions) {
        // Extraire la question
        const questionMatch = q.match(/^([^R]+?)\s*RV\./);
        if (!questionMatch) continue;
        
        const question = questionMatch[1].trim();
        const reste = q.substring(questionMatch[0].length - 3); // À partir de "RV."
        
        // Extraire les réponses
        const reponses = [];
        let bonneReponse = '';
        
        // Pattern pour trouver RV. et RF.
        const rvMatch = reste.match(/RV\.\s*([^R]+?)(?=\s*RF\.|$)/);
        if (rvMatch) {
            bonneReponse = rvMatch[1].trim();
        }
        
        // Trouver toutes les RF.
        const rfMatches = reste.matchAll(/RF\.\s*([^R]+?)(?=\s*RF\.|$)/g);
        const mauvaisesReponses = [];
        for (const match of rfMatches) {
            mauvaisesReponses.push(match[1].trim());
        }
        
        // Mélanger les réponses
        const toutesReponses = [
            { texte: bonneReponse, estCorrecte: true },
            ...mauvaisesReponses.map(r => ({ texte: r, estCorrecte: false }))
        ];
        
        // Mélanger aléatoirement
        for (let i = toutesReponses.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [toutesReponses[i], toutesReponses[j]] = [toutesReponses[j], toutesReponses[i]];
        }
        
        resultats.push({
            question: question,
            reponses: toutesReponses
        });
    }
    
    return resultats;
}

// ============================================================
// AFFICHAGE D'UN POST INDIVIDUEL
// ============================================================

function afficherPost(post) {
    const container = document.getElementById('postContent');
    
    const dateObj = new Date(post["Date post"]);
    const dateFormatee = dateObj.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let html = `
        <div class="meta">
            <span class="badge niveau">Niveau ${post.Niveau}</span>
            <span class="badge categorie">${post.Cours}</span>
            <span class="badge">Chapitre ${post["Num chapitre"]}</span>
        </div>
        <h1>${post.Chapitre}</h1>
        <div class="date">📅 ${dateFormatee}</div>
        <div class="contenu">${post.Contenu.replace(/\n/g, '<br>')}</div>
    `;
    
    // ============================================================
    // AFFICHAGE DU QUIZ INTERACTIF
    // ============================================================
    
    if (post.Quiz && post.Quiz.trim()) {
        const quizData = parserQuiz(post.Quiz);
        
        if (quizData && quizData.length > 0) {
            html += `<div class="section quiz-section"><h3>📝 Quiz</h3>`;
            
            quizData.forEach((q, index) => {
                html += `
                    <div class="quiz-question" data-index="${index}">
                        <p><strong>Question ${index + 1} :</strong> ${q.question}</p>
                        <div class="quiz-reponses">
                `;
                
                q.reponses.forEach((reponse, rIndex) => {
                    const lettre = String.fromCharCode(65 + rIndex); // A, B, C, D
                    html += `
                        <button class="quiz-btn" data-correct="${reponse.estCorrecte}" onclick="repondreQuiz(this)">
                            ${lettre}. ${reponse.texte}
                        </button>
                    `;
                });
                
                html += `
                        </div>
                        <div class="quiz-feedback" id="feedback-${index}"></div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
    }
    
    // ============================================================
    // QUESTIONS OUVERTES
    // ============================================================
    
    if (post.Question_ouverte && post.Question_ouverte.trim()) {
        html += `
            <div class="section">
                <h3>💭 Questions ouvertes</h3>
                <div class="contenu">${post.Question_ouverte.replace(/\n/g, '<br>')}</div>
                <div class="question-ouverte-reponse">
                    <textarea placeholder="Écrivez votre réponse ici..." rows="4" style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;margin-top:10px;font-family:inherit;"></textarea>
                    <button onclick="this.previousElementSibling.disabled=true;this.textContent='✅ Réponse enregistrée';this.style.background='#50c878';" style="margin-top:10px;">💾 Enregistrer ma réponse</button>
                </div>
            </div>
        `;
    }
    
    // ============================================================
    // MÉMO
    // ============================================================
    
    if (post.Mémo && post.Mémo.trim()) {
        html += `
            <div class="section" style="border-left-color: #f39c12;">
                <h3>⭐ À retenir</h3>
                <div class="contenu">${post.Mémo.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// ============================================================
// FONCTION POUR RÉPONDRE AU QUIZ
// ============================================================

function repondreQuiz(button) {
    const estCorrect = button.dataset.correct === 'true';
    const parent = button.closest('.quiz-question');
    const feedback = parent.querySelector('.quiz-feedback');
    const tousLesBoutons = parent.querySelectorAll('.quiz-btn');
    
    // Désactiver tous les boutons
    tousLesBoutons.forEach(btn => btn.disabled = true);
    
    // Colorer les réponses
    tousLesBoutons.forEach(btn => {
        if (btn.dataset.correct === 'true') {
            btn.style.background = '#50c878';
            btn.style.color = 'white';
        } else if (btn === button && !estCorrect) {
            btn.style.background = '#e74c3c';
            btn.style.color = 'white';
        } else {
            btn.style.opacity = '0.5';
        }
    });
    
    // Afficher le feedback
    if (estCorrect) {
        feedback.innerHTML = '✅ <strong>Correct !</strong> Bien joué ! 🎉';
        feedback.style.color = '#27ae60';
    } else {
        feedback.innerHTML = '❌ <strong>Incorrect.</strong> La bonne réponse est en vert.';
        feedback.style.color = '#e74c3c';
    }
}

// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener('DOMContentLoaded', chargerPosts);
