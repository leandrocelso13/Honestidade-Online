const catalogoProdutos = [
    {
        id: "voce-tambem-importa",
        titulo: "E-book: Você Também Importa",
        subtitulo: "Um guia prático de autoestima",
        autora: "Dhalke Ciralli",
        precoFormatado: "R$ 19,90",
        cta: "Garantir E-book por R$ 19,90",
        linkAfiliado: "https://go.hotmart.com/T108396230E?dp=1",
        badgeTransparencia: "Publicidade • Link de Afiliado",
        formato: "E-book em PDF • 21 páginas",
        beneficios: [
            { icone: "bi-patch-check-fill", texto: "Compra Segura via Hotmart" },
            { icone: "bi-lightning-charge-fill", texto: "Acesso Imediato" }
        ],
        avisoLegal: "Material educativo. Não substitui acompanhamento psicológico.",
        imagens: [
            {
                src: "imagens/produto1-1.png",
                alt: "Você cuida de tanta coisa. Quem cuida de você?"
            },
            {
                src: "imagens/produto1-2.png",
                alt: "Apresentação do E-book Você Também Importa"
            },
            {
                src: "imagens/produto1-3.png",
                alt: "Oferta do E-book por R$ 19,90"
            }
        ]
    }

    /*
    ,{
        id: "proximo-produto",
        titulo: "Título do próximo produto",
        subtitulo: "Frase de apoio do produto",
        autora: "Nome da autora ou autor",
        precoFormatado: "R$ 00,00",
        cta: "Garantir produto por R$ 00,00",
        linkAfiliado: "https://go.hotmart.com/SEU-CODIGO",
        badgeTransparencia: "Publicidade • Link de Afiliado",
        formato: "E-book em PDF • 00 páginas",
        beneficios: [
            { icone: "bi-patch-check-fill", texto: "Compra Segura via Hotmart" },
            { icone: "bi-lightning-charge-fill", texto: "Acesso Imediato" }
        ],
        avisoLegal: "Material educativo. Não substitui acompanhamento profissional.",
        imagens: [
            { src: "imagens/produto2-1.png", alt: "Descrição da imagem 1" },
            { src: "imagens/produto2-2.png", alt: "Descrição da imagem 2" },
            { src: "imagens/produto2-3.png", alt: "Descrição da imagem 3" }
        ]
    }
    */
];

const estadoLightbox = {
    produto: null,
    indice: 0,
    modal: null
};

document.addEventListener("DOMContentLoaded", () => {
    const catalogo = document.getElementById("catalogo-produtos");
    if (!catalogo) return;

    renderizarCatalogo(catalogo);
    iniciarLightboxCatalogo(catalogo);
});

function renderizarCatalogo(catalogo) {
    const fragmento = document.createDocumentFragment();
    catalogoProdutos.forEach(produto => {
        fragmento.appendChild(criarCardProduto(produto));
    });
    catalogo.replaceChildren(fragmento);
}

function criarCardProduto(produto) {
    const artigo = document.createElement("article");
    artigo.className = "card product-card mx-auto";
    artigo.dataset.productId = produto.id;

    const corpo = document.createElement("div");
    corpo.className = "card-body";

    const meta = document.createElement("div");
    meta.className = "product-card-meta text-center mb-3";

    const badge = document.createElement("span");
    badge.className = "product-badge";
    badge.textContent = produto.badgeTransparencia;

    const formato = document.createElement("span");
    formato.className = "product-format";
    formato.textContent = produto.formato;

    meta.append(badge, formato);

    const titulo = document.createElement("h2");
    titulo.className = "card-title text-center mb-1 fw-bold";
    titulo.textContent = produto.titulo;

    const subtitulo = document.createElement("p");
    subtitulo.className = "text-center product-subtitle mb-4";
    subtitulo.textContent = `${produto.subtitulo} por ${produto.autora}`;

    const galeria = document.createElement("div");
    galeria.className = "row g-3 product-gallery";

    const classeColuna = classeColunaGaleria(produto.imagens.length);

    produto.imagens.forEach((imagem, indice) => {
        const coluna = document.createElement("div");
        coluna.className = classeColuna;

        const envoltorio = document.createElement("div");
        envoltorio.className = "product-thumb-wrap";

        const img = document.createElement("img");
        img.src = imagem.src;
        img.alt = imagem.alt;
        img.className = "img-fluid product-thumb";
        img.loading = "lazy";
        img.decoding = "async";
        img.role = "button";
        img.tabIndex = 0;
        img.dataset.productId = produto.id;
        img.dataset.imgIndex = String(indice);
        img.setAttribute(
            "aria-label",
            `Ampliar imagem ${indice + 1} de ${produto.imagens.length}: ${imagem.alt}`
        );

        envoltorio.appendChild(img);
        coluna.appendChild(envoltorio);
        galeria.appendChild(coluna);
    });

    corpo.append(meta, titulo, subtitulo, galeria);

    const rodape = document.createElement("div");
    rodape.className = "card-footer product-card-footer text-center border-0 pb-4 pt-2";

    const ancoraPreco = document.createElement("p");
    ancoraPreco.className = "product-price-anchor mb-2";

    const rotuloPreco = document.createElement("span");
    rotuloPreco.className = "product-price-label";
    rotuloPreco.textContent = "Investimento único";

    const preco = document.createElement("strong");
    preco.className = "product-price";
    preco.textContent = produto.precoFormatado;

    ancoraPreco.append(rotuloPreco, preco);

    const cta = document.createElement("a");
    cta.className = "btn btn-vinho btn-lg px-5 fw-bold rounded-pill";
    cta.href = produto.linkAfiliado;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";

    const iconeCta = document.createElement("i");
    iconeCta.className = "bi bi-shield-lock-fill me-2";
    iconeCta.setAttribute("aria-hidden", "true");
    cta.append(iconeCta, document.createTextNode(produto.cta));

    const beneficios = document.createElement("ul");
    beneficios.className = "product-trust list-unstyled d-flex flex-wrap justify-content-center gap-3 mt-3 mb-3";

    produto.beneficios.forEach(beneficio => {
        const item = document.createElement("li");
        const icone = document.createElement("i");
        icone.className = `bi ${beneficio.icone} me-1`;
        icone.setAttribute("aria-hidden", "true");
        item.append(icone, document.createTextNode(beneficio.texto));
        beneficios.appendChild(item);
    });

    const aviso = document.createElement("p");
    aviso.className = "text-muted small mb-0";
    aviso.textContent = produto.avisoLegal;

    rodape.append(ancoraPreco, cta, beneficios, aviso);
    artigo.append(corpo, rodape);
    return artigo;
}

function classeColunaGaleria(quantidade) {
    if (quantidade <= 1) return "col-12";
    if (quantidade === 2) return "col-12 col-md-6";
    return "col-12 col-md-4";
}

function iniciarLightboxCatalogo(catalogo) {
    const modalElemento = document.getElementById("productLightboxModal");
    if (!modalElemento || typeof bootstrap === "undefined") return;

    estadoLightbox.modal = bootstrap.Modal.getOrCreateInstance(modalElemento);

    const imagemAmpliada = document.getElementById("productLightboxImage");
    const titulo = document.getElementById("productLightboxTitle");
    const contador = document.getElementById("productLightboxCounter");
    const botaoAnterior = document.getElementById("productLightboxPrev");
    const botaoProxima = document.getElementById("productLightboxNext");
    const cta = document.getElementById("productLightboxCta");
    const ctaLabel = document.getElementById("productLightboxCtaLabel");

    const atualizarSlide = () => {
        const produto = estadoLightbox.produto;
        if (!produto) return;

        const imagens = produto.imagens;
        const slide = imagens[estadoLightbox.indice];

        imagemAmpliada.src = slide.src;
        imagemAmpliada.alt = slide.alt;
        titulo.textContent = slide.alt;
        contador.textContent = `${estadoLightbox.indice + 1}/${imagens.length}`;

        const soUma = imagens.length < 2;
        botaoAnterior.disabled = soUma;
        botaoProxima.disabled = soUma;

        cta.href = produto.linkAfiliado;
        ctaLabel.textContent = produto.cta;
    };

    const irPara = (indice) => {
        const produto = estadoLightbox.produto;
        if (!produto) return;
        const total = produto.imagens.length;
        estadoLightbox.indice = (indice + total) % total;
        atualizarSlide();
    };

    const abrir = (productId, imgIndex) => {
        const produto = catalogoProdutos.find(item => item.id === productId);
        if (!produto || !produto.imagens.length) return;

        estadoLightbox.produto = produto;
        estadoLightbox.indice = Number(imgIndex) || 0;
        atualizarSlide();
        estadoLightbox.modal.show();
    };

    catalogo.addEventListener("click", (evento) => {
        const imagem = evento.target.closest("[data-product-id][data-img-index]");
        if (!imagem) return;
        abrir(imagem.dataset.productId, imagem.dataset.imgIndex);
    });

    catalogo.addEventListener("keydown", (evento) => {
        if (evento.key !== "Enter" && evento.key !== " ") return;
        const imagem = evento.target.closest("[data-product-id][data-img-index]");
        if (!imagem) return;
        evento.preventDefault();
        abrir(imagem.dataset.productId, imagem.dataset.imgIndex);
    });

    botaoAnterior.addEventListener("click", () => irPara(estadoLightbox.indice - 1));
    botaoProxima.addEventListener("click", () => irPara(estadoLightbox.indice + 1));

    modalElemento.addEventListener("shown.bs.modal", () => {
        botaoProxima.focus();
    });

    modalElemento.addEventListener("hidden.bs.modal", () => {
        imagemAmpliada.removeAttribute("src");
        estadoLightbox.produto = null;
    });

    document.addEventListener("keydown", (evento) => {
        if (!modalElemento.classList.contains("show")) return;

        if (evento.key === "ArrowLeft") {
            evento.preventDefault();
            irPara(estadoLightbox.indice - 1);
        }

        if (evento.key === "ArrowRight") {
            evento.preventDefault();
            irPara(estadoLightbox.indice + 1);
        }
    });
}
