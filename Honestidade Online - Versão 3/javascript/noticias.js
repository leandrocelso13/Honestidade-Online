/* =========================================================
   Notícias de tecnologia em tempo real (somente front-end)
   Somente em português, com foco nos principais assuntos do mundo
   Usado apenas em noticias.html
   ========================================================= */

/* ---------- Configuração ---------- */
const CONFIG = {
    intervaloMs: 5 * 60 * 1000,          // atualiza a cada 5 minutos
    limitePadrao: 30,                    // máximo de notícias na tela
    chaveCache: "honestidade_noticias_v4",
    resumoMax: 240,                      // tamanho máximo do resumo

    // Somente portais em português (feeds RSS)
    fontes: [
        { id: "tecnoblog", nome: "Tecnoblog", feed: "https://tecnoblog.net/feed/" },
        { id: "canaltech", nome: "Canaltech", feed: "https://canaltech.com.br/rss/" },
        { id: "g1", nome: "g1 Tecnologia", feed: "https://g1.globo.com/rss/g1/tecnologia/" }
    ],

    // Temas globais considerados "principais" (comparados sem acentos e em minúsculas)
    temasPrincipais: [
        "inteligencia artificial", " ia ", "openai", "chatgpt", "gemini", "claude", "anthropic", "deepseek",
        "nvidia", "chip", "semicondutor", "processador", "computacao quantica", "supercomputador",
        "google", "apple", "iphone", "microsoft", "windows", "amazon", "meta ", "samsung", "tesla",
        "spacex", "starlink", "nasa", "tiktok", "instagram", "whatsapp", "youtube", "netflix",
        "android", "ios ", "playstation", "xbox", "nintendo",
        "ciberataque", "hacker", "vazamento", "ransomware", "seguranca digital", "privacidade",
        "robo", "robotica", "carro eletrico", "satelite", "5g", "6g", "big tech", "startup"
    ],

    // Assuntos que não entram nos principais (promoções e compras)
    temasExcluidos: ["cupom", "desconto", "oferta", "promocao", "black friday", "melhores celulares", "onde comprar"]
};

/* ---------- Estado da página ---------- */
const estado = {
    noticias: [],
    fonteAtiva: "todas",
    busca: "",
    somentePrincipais: true,
    carregando: false
};

/* ---------- Utilitários ---------- */

// Aceita somente links https://
function ehHttps(url) {
    try {
        return new URL(url).protocol === "https:";
    } catch {
        return false;
    }
}

// Remove HTML de um texto e limita o tamanho (evita injetar código da API)
function textoPuro(html, max = CONFIG.resumoMax) {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    const texto = (doc.body.textContent || "").replace(/\s+/g, " ").trim();
    return texto.length > max ? texto.slice(0, max).trim() + "…" : texto;
}

// Pega o endereço da primeira imagem dentro de um trecho de HTML
function primeiraImagem(html) {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.querySelector("img")?.getAttribute("src") || "";
}

// Minúsculas e sem acentos, para busca e filtros
function normalizar(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Data e hora no formato brasileiro
function formatarData(ms) {
    return new Date(ms).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Diz se a notícia trata de um dos principais assuntos de tecnologia no mundo
function ehPrincipal(noticia) {
    const texto = ` ${normalizar(noticia.titulo + " " + noticia.resumo)} `;
    if (CONFIG.temasExcluidos.some(tema => texto.includes(tema))) return false;
    return CONFIG.temasPrincipais.some(tema => texto.includes(tema));
}

/* ---------- Busca nos feeds ---------- */

// Tenta cada método em ordem; usa o primeiro que funcionar
async function buscarRss(fonte) {
    const metodos = [buscarViaRss2Json, buscarViaProxyXml];
    let ultimoErro = new Error(`${fonte.nome} indisponível`);

    for (const metodo of metodos) {
        try {
            const itens = await metodo(fonte);
            if (itens.length) return itens;
        } catch (erro) {
            ultimoErro = erro;
            console.warn(`[${fonte.nome}] ${metodo.name} falhou:`, erro.message);
        }
    }
    throw ultimoErro;
}

// Método 1: rss2json (converte o feed para JSON)
async function buscarViaRss2Json(fonte) {
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(fonte.feed)}`;
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`rss2json respondeu ${resposta.status}`);

    const dados = await resposta.json();
    if (dados.status !== "ok") throw new Error(dados.message || "rss2json recusou o pedido");

    return dados.items.map(i => ({
        titulo: i.title,
        resumo: textoPuro(i.description),
        link: i.link,
        imagem: i.thumbnail || (i.enclosure && i.enclosure.link) || primeiraImagem(i.description),
        // O rss2json devolve a data em UTC no formato "AAAA-MM-DD HH:MM:SS"
        data: new Date(i.pubDate.replace(" ", "T") + "Z").getTime(),
        fonte: fonte.nome,
        fonteId: fonte.id
    }));
}

// Método 2: baixa o XML do feed por um proxy público e lê no navegador
async function buscarViaProxyXml(fonte) {
    const alvo = encodeURIComponent(fonte.feed);
    const proxies = [
        `https://api.allorigins.win/raw?url=${alvo}`,
        `https://corsproxy.io/?url=${alvo}`
    ];

    let ultimoErro = new Error("Nenhum proxy respondeu");
    for (const urlProxy of proxies) {
        try {
            const resposta = await fetch(urlProxy);
            if (!resposta.ok) throw new Error(`proxy respondeu ${resposta.status}`);

            const xml = new DOMParser().parseFromString(await resposta.text(), "text/xml");
            if (xml.querySelector("parsererror")) throw new Error("XML inválido");

            const itens = [...xml.querySelectorAll("item")].map(item => {
                const texto = tag => (item.querySelector(tag)?.textContent || "").trim();
                const descricao = texto("description");
                const midia = item.getElementsByTagName("media:content")[0];
                const anexo = item.querySelector("enclosure");

                return {
                    titulo: texto("title"),
                    resumo: textoPuro(descricao),
                    link: texto("link"),
                    imagem: (midia && midia.getAttribute("url"))
                        || (anexo && anexo.getAttribute("url"))
                        || primeiraImagem(descricao),
                    data: new Date(texto("pubDate")).getTime(),
                    fonte: fonte.nome,
                    fonteId: fonte.id
                };
            });

            if (itens.length) return itens;
        } catch (erro) {
            ultimoErro = erro;
        }
    }
    throw ultimoErro;
}

/* ---------- Cache (sessionStorage) ---------- */

function salvarCache(noticias) {
    try {
        sessionStorage.setItem(CONFIG.chaveCache, JSON.stringify(noticias));
    } catch { /* cache é opcional */ }
}

function lerCache() {
    try {
        return JSON.parse(sessionStorage.getItem(CONFIG.chaveCache)) || [];
    } catch {
        return [];
    }
}

/* ---------- Carregamento ---------- */

async function carregarNoticias() {
    if (estado.carregando) return;
    estado.carregando = true;

    mostrar("noticias-erro", false);
    mostrar("noticias-carregando", estado.noticias.length === 0);
    const botao = document.getElementById("btn-atualizar");
    if (botao) botao.disabled = true;

    // Cada fonte é independente: se uma falhar, as outras continuam
    const resultados = await Promise.allSettled(CONFIG.fontes.map(buscarRss));

    const todas = [];
    const comErro = [];
    resultados.forEach((resultado, i) => {
        if (resultado.status === "fulfilled") {
            todas.push(...resultado.value);
        } else {
            comErro.push(CONFIG.fontes[i].nome);
        }
    });

    mostrar("noticias-carregando", false);
    if (botao) botao.disabled = false;
    estado.carregando = false;

    // Todas as fontes falharam
    if (todas.length === 0) {
        mostrar("noticias-erro", true);
        return;
    }

    // Mantém só notícias válidas, sem repetição, da mais recente para a mais antiga
    const vistos = new Set();
    estado.noticias = todas
        .filter(n => n.titulo && ehHttps(n.link) && Number.isFinite(n.data))
        .filter(n => !vistos.has(n.link) && vistos.add(n.link))
        .sort((a, b) => b.data - a.data);

    salvarCache(estado.noticias);
    renderizar();

    const hora = new Date().toLocaleTimeString("pt-BR");
    definirTexto("ultima-atualizacao", `Última atualização: ${hora}`);
    definirTexto("aviso-fontes",
        comErro.length ? `Fontes que não responderam desta vez: ${comErro.join(", ")}.` : "");
}

/* ---------- Exibição ---------- */

function mostrar(id, visivel) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.classList.toggle("d-none", !visivel);
}

function definirTexto(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
}

// Aplica os filtros e desenha os cards
function renderizar() {
    const lista = document.getElementById("lista-noticias");
    const limite = CONFIG.limitePadrao;
    const busca = normalizar(estado.busca);

    const filtradas = estado.noticias
        .filter(n => estado.fonteAtiva === "todas" || n.fonteId === estado.fonteAtiva)
        .filter(n => !estado.somentePrincipais || ehPrincipal(n))
        .filter(n => !busca || normalizar(n.titulo).includes(busca))
        .slice(0, limite);

    lista.replaceChildren(...filtradas.map(criarCard));
    mostrar("noticias-vazio", filtradas.length === 0);
}

// Cria um card de notícia (usa textContent: nada de innerHTML)
function criarCard(noticia) {
    const coluna = document.createElement("div");
    coluna.className = "col";

    const card = document.createElement("article");
    card.className = "card card-noticia h-100 overflow-hidden";

    // Imagem grande no topo do card (somente quando existir e for https)
    if (noticia.imagem && ehHttps(noticia.imagem)) {
        const imagem = document.createElement("img");
        imagem.src = noticia.imagem;
        imagem.alt = `Imagem da notícia: ${noticia.titulo}`;
        imagem.loading = "lazy";
        imagem.referrerPolicy = "no-referrer";
        imagem.className = "card-img-top w-100 object-fit-cover";
        imagem.style.height = "260px";
        // Se a imagem falhar, o card continua só com o texto
        imagem.addEventListener("error", () => imagem.remove());
        card.appendChild(imagem);
    }

    const corpo = document.createElement("div");
    corpo.className = "card-body d-flex flex-column p-4";

    // Fonte e data
    const info = document.createElement("p");
    info.className = "text-muted mb-2";
    info.textContent = `${noticia.fonte} • ${formatarData(noticia.data)}`;

    // Título
    const titulo = document.createElement("h3");
    titulo.className = "card-title h4 mb-3";
    titulo.textContent = noticia.titulo;

    corpo.append(info, titulo);

    // Resumo (quando a fonte fornece)
    if (noticia.resumo) {
        const resumo = document.createElement("p");
        resumo.className = "card-text fs-5 mb-4";
        resumo.textContent = noticia.resumo;
        corpo.appendChild(resumo);
    }

    // Link para a matéria original
    const link = document.createElement("a");
    link.className = "btn btn-outline-dark mt-auto align-self-start";
    link.href = noticia.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Ler matéria completa";
    corpo.appendChild(link);

    card.appendChild(corpo);
    coluna.appendChild(card);
    return coluna;
}

/* ---------- Filtros ---------- */

function configurarFiltros() {
    // Busca por palavra no título
    const campo = document.getElementById("busca-noticias");
    if (campo) {
        campo.addEventListener("input", () => {
            estado.busca = campo.value;
            renderizar();
        });
    }

    // Interruptor "principais assuntos"
    const interruptor = document.getElementById("somente-principais");
    if (interruptor) {
        estado.somentePrincipais = interruptor.checked;
        interruptor.addEventListener("change", () => {
            estado.somentePrincipais = interruptor.checked;
            renderizar();
        });
    }

    // Botões por fonte
    const area = document.getElementById("filtros-fonte");
    if (area) {
        const opcoes = [{ id: "todas", nome: "Todas" }, ...CONFIG.fontes];
        opcoes.forEach(opcao => {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "btn btn-sm btn-outline-dark" + (opcao.id === "todas" ? " active" : "");
            botao.textContent = opcao.nome;
            botao.setAttribute("aria-pressed", opcao.id === "todas");
            botao.addEventListener("click", () => {
                estado.fonteAtiva = opcao.id;
                area.querySelectorAll("button").forEach(b => {
                    b.classList.remove("active");
                    b.setAttribute("aria-pressed", "false");
                });
                botao.classList.add("active");
                botao.setAttribute("aria-pressed", "true");
                renderizar();
            });
            area.appendChild(botao);
        });
    }

    // Botão "Atualizar agora"
    const atualizar = document.getElementById("btn-atualizar");
    if (atualizar) atualizar.addEventListener("click", carregarNoticias);
}

/* ---------- Inicialização ---------- */

document.addEventListener("DOMContentLoaded", () => {
    // Só executa em páginas que têm a área de notícias
    if (!document.getElementById("lista-noticias")) return;

    configurarFiltros();

    const tentar = document.getElementById("btn-tentar-novamente");
    if (tentar) tentar.addEventListener("click", carregarNoticias);

    // Mostra a última resposta guardada enquanto busca as novas
    const cache = lerCache();
    if (cache.length) {
        estado.noticias = cache;
        renderizar();
    }

    carregarNoticias();

    // Atualização automática a cada 5 minutos (somente com a aba visível)
    setInterval(() => {
        if (!document.hidden) carregarNoticias();
    }, CONFIG.intervaloMs);
});