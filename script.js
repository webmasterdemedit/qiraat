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
            const post = posts.find(p => p.ID === id);
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
    
    // Appliquer les filtres
    const niveau = document.getElementById('niveauFilter').value;
    const categorie = document.getElementById('categorieFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = posts.filter(post => {
        const matchNiveau = !niveau || post.Niveau == niveau;
        const matchCategorie = !categorie || post.Catégorie === categorie;
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
            <span class="badge categorie">${post.Catégorie}</span>
            <h3>${post.Chapitre}</h3>
            <div class="contenu-preview">${post.Contenu.substring(0, 150)}...</div>
            <div class="meta">📅 ${post.Date} • Ordre ${post.Ordre}</div>
        </div>
    `).join('');
}

// ============================================================
// FILTRES
// ============================================================

function initialiserFiltres(posts) {
    const niveaux = [...new Set(posts.map(p => p.Niveau))].sort();
    const categories = [...new Set(posts.map(p => p.Catégorie))];
    
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
    
    // Écouteurs d'événements
    niveauSelect.addEventListener('change', () => afficherPosts(posts));
    categorieSelect.addEventListener('change', () => afficherPosts(posts));
    document.getElementById('searchInput').addEventListener('input', () => afficherPosts(posts));
}

// ============================================================
// AFFICHAGE D'UN POST INDIVIDUEL
// ============================================================

function afficherPost(post) {
    const container = document.getElementById('postContent');
    
    let html = `
        <div class="meta">
            <span class="badge niveau">Niveau ${post.Niveau}</span>
            <span class="badge categorie">${post.Catégorie}</span>
            <span class="badge">Ordre ${post.Ordre}</span>
        </div>
        <h1>${post.Chapitre}</h1>
        <div class="date">📅 ${post.Date}</div>
        <div class="contenu">${post.Contenu}</div>
    `;
    
    if (post.Quiz && post.Quiz.trim()) {
        html += `
            <div class="section">
                <h3>📝 Quiz</h3>
                <div class="contenu">${post.Quiz.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }
    
    if (post.Question_ouverte && post.Question_ouverte.trim()) {
        html += `
            <div class="section">
                <h3>💭 Questions ouvertes</h3>
                <div class="contenu">${post.Question_ouverte.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }
    
    if (post.Retenir && post.Retenir.trim()) {
        html += `
            <div class="section" style="border-left-color: #f39c12;">
                <h3>⭐ À retenir</h3>
                <div class="contenu">${post.Retenir.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener('DOMContentLoaded', chargerPosts);
