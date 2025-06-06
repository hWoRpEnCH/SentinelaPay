const cardsContainer = document.querySelector(".cards-container");
let selectedCard = null;

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", function (e) {
    // Impede selecionar outro cartão enquanto um está selecionado
    if (selectedCard && selectedCard !== card) return;

    e.stopPropagation();

    // 1. FLIP: Capture a posição inicial de todos os cartões
    const cards = Array.from(document.querySelectorAll(".card"));
    const firstRects = cards.map((c) => c.getBoundingClientRect());

    // 2. Troca as classes normalmente
    cardsContainer.classList.add("expanded");
    document.body.classList.add("blur");
    cards.forEach((c) => c.classList.remove("selected", "primeiro"));
    document.querySelectorAll(".mini-menu").forEach((m) => (m.innerHTML = ""));
    card.classList.add("selected", "primeiro");
    selectedCard = card;

    // Mostra o número completo ao selecionar
    const cardNumber = card.querySelector(".card-number");
    if (cardNumber) {
      cardNumber.textContent = cardNumber.dataset.full;
    }

    // Preenche o mini menu do cartão selecionado
    const miniMenu = card.querySelector(".mini-menu");
    if (miniMenu) {
      miniMenu.innerHTML = `
                <button class="fechar-menu" aria-label="Fechar">&times;</button>
                <h3>Informações do Cartão</h3>
                <p><b>Banco:</b> ${
                  card.classList.contains("nubank")
                    ? "Nubank"
                    : card.classList.contains("bb")
                    ? "Banco do Brasil"
                    : "Caixa"
                }</p>
                <p><b>Número:</b> ${
                  card.querySelector(".card-number").textContent
                }</p>
            `;
      // Adicione este trecho para garantir que o X funcione:
      const btnFechar = miniMenu.querySelector(".fechar-menu");
      btnFechar.addEventListener("click", function (e) {
        e.stopPropagation();
        document
          .querySelectorAll(".card")
          .forEach((c) => c.classList.remove("selected", "primeiro"));
        document
          .querySelectorAll(".mini-menu")
          .forEach((m) => (m.innerHTML = ""));
        cardsContainer.classList.remove("expanded");
        document.body.classList.remove("blur");
        selectedCard = null;
        maskAllCardNumbers();
      });
    }

    // 3. FLIP: Capture a posição final de todos os cartões
    const lastRects = cards.map((c) => c.getBoundingClientRect());

    // 4. FLIP: Aplique transform para animar do estado antigo para o novo
    cards.forEach((c, i) => {
      const dx = firstRects[i].left - lastRects[i].left;
      const dy = firstRects[i].top - lastRects[i].top;
      c.style.transition = "none";
      c.style.transform = `translate(${dx}px,${dy}px)`;
    });

    // Força reflow
    void cards[0].offsetWidth;

    // 5. Remove o transform para animar até o novo lugar
    cards.forEach((c) => {
      c.style.transition = "transform 0.7s cubic-bezier(.4,2,.6,1)";
      c.style.transform = "";
    });

    // 6. Limpa o transition após a animação
    setTimeout(() => {
      cards.forEach((c) => {
        c.style.transition = "";
      });
    }, 700);
  });
});

// Função para mascarar todos os números ao fechar
function maskAllCardNumbers() {
  document.querySelectorAll(".card-number").forEach((cardNumber) => {
    const full = cardNumber.dataset.full;
    if (full) {
      // Mantém os espaços e só mostra os 4 últimos dígitos
      const groups = full.trim().split(" ");
      const masked = groups
        .map((group, idx) => (idx === groups.length - 1 ? group : "****"))
        .join(" ");
      cardNumber.textContent = masked;
    }
  });
}

function addParameterCard() {
  const buttons = document.querySelectorAll(".card-button");

  buttons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();

      const cardId = button.dataset.card;
      const baseUrl = button.getAttribute("href");
      const separator = baseUrl.includes("?") ? "&" : "?";
      const newUrl = `${baseUrl}${separator}cartao=${cardId}`;

      window.location.href = newUrl;
    });
  });
}

// Call the function when the DOM is full loaded
document.addEventListener("DOMContentLoaded", addParameterCard);

// Ao fechar (no botão X ou fora), chama a função para mascarar novamente
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("fechar-menu")) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    document
      .querySelectorAll(".card")
      .forEach((c) => c.classList.remove("selected", "primeiro"));
    document.querySelectorAll(".mini-menu").forEach((m) => (m.innerHTML = ""));
    cardsContainer.classList.remove("expanded");
    document.body.classList.remove("blur");
    selectedCard = null;
    maskAllCardNumbers();
    return;
  }
  if (
    cardsContainer.classList.contains("expanded") &&
    !e.target.closest(".cards-container") &&
    !e.target.closest(".mini-menu")
  ) {
    cardsContainer.classList.remove("expanded");
    document.body.classList.remove("blur");
    document
      .querySelectorAll(".card")
      .forEach((c) => c.classList.remove("selected", "primeiro"));
    document.querySelectorAll(".mini-menu").forEach((m) => (m.innerHTML = ""));
    selectedCard = null;
    maskAllCardNumbers();
  }
});

// Impede propagação do clique dentro do container
cardsContainer.addEventListener("click", (e) => e.stopPropagation());

const sidebar = document.getElementById("sidebar");
const menuIcon = document.querySelector(".menu-icon");
const closeSidebarBtn = document.querySelector(".close-sidebar");

// Abrir sidebar
menuIcon.addEventListener("click", function (e) {
  e.stopPropagation();
  sidebar.classList.add("open");
});

// Fechar sidebar ao clicar no X
closeSidebarBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  sidebar.classList.remove("open");
});

// Fechar sidebar ao clicar fora dela
document.addEventListener("click", function (e) {
  if (
    sidebar.classList.contains("open") &&
    !e.target.closest(".sidebar") &&
    !e.target.closest(".menu-icon")
  ) {
    sidebar.classList.remove("open");
  }
});
