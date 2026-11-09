document.addEventListener("DOMContentLoaded", () => {
    // Carrega o navbar no elemento com ID 'navbar-placeholder'
    carregarComponente("navbar-placeholder", "navbar.html", marcarPaginaAtiva);

    // Carrega o footer no elemento com ID 'footer-placeholder'
    carregarComponente("footer-placeholder", "footer.html");
});

// Busca um arquivo HTML e insere dentro do placeholder indicado
function carregarComponente(idPlaceholder, arquivo, aoCarregar) {
    const placeholder = document.getElementById(idPlaceholder);
    if (!placeholder) return;

    fetch(arquivo)
        .then(response => {
            if (!response.ok) throw new Error(`Arquivo ${arquivo} não encontrado`);
            return response.text();
        })
        .then(html => {
            placeholder.innerHTML = html;
            if (aoCarregar) aoCarregar(placeholder);
        })
        .catch(error => console.error(`Erro ao carregar ${arquivo}:`, error));
}

// Navbar: destaca no menu o link da página atual
function marcarPaginaAtiva(navbar) {
    const paginaAtual = location.pathname.split("/").pop() || "index.html";

    navbar.querySelectorAll(".nav-link").forEach(link => {
        if (link.getAttribute("href") === paginaAtual) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }
    });
}
