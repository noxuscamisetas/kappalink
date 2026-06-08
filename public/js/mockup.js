const perfis = [
  {
    inicial: "M",
    nome: "Mariano Pratas",
    desc: "Descreva o que você precisa e receba um atendimento mais rápido.",
    cor: "#b8860b",
    corClaro: "#fef3c7",
    corTexto: "#78450a",
    perguntas: [
      {
        titulo: "O que você precisa?",
        chips: ["Reparo", "Aliança", "Peça personalizada", "Comprar produto"],
        ativo: "Reparo"
      },
      {
        titulo: "Qual o material?",
        chips: ["Prata", "Ouro 18k", "Banho/folheado", "Não sei"],
        ativo: "Prata"
      }
    ]
  },
  {
    inicial: "A",
    nome: "Dra. Adriana",
    desc: "Vou te fazer algumas perguntas para entender como posso te ajudar.",
    cor: "#7c3aed",
    corClaro: "#ede9fe",
    corTexto: "#5b21b6",
    perguntas: [
      {
        titulo: "Como posso te ajudar?",
        chips: ["Primeira consulta", "Continuar acompanhamento", "Só quero entender"],
        ativo: "Primeira consulta"
      },
      {
        titulo: "Como prefere o atendimento?",
        chips: ["Online", "Presencial", "Sem preferência"],
        ativo: "Online"
      }
    ]
  },
  {
    inicial: "F",
    nome: "Festa & Cia",
    desc: "Preencha os detalhes do seu evento para receber um orçamento.",
    cor: "#db2777",
    corClaro: "#fce7f3",
    corTexto: "#9d174d",
    perguntas: [
      {
        titulo: "Que tipo de produto?",
        chips: ["Lembranças", "Topos de bolo", "Convites", "Kit completo"],
        ativo: "Convites"
      },
      {
        titulo: "Qual a ocasião?",
        chips: ["Aniversário", "Casamento", "Chá de bebê", "Formatura"],
        ativo: "Aniversário"
      }
    ]
  },
  {
    inicial: "B",
    nome: "Studio Bella",
    desc: "Escolha o serviço e nos conte mais para agendarmos seu horário.",
    cor: "#059669",
    corClaro: "#d1fae5",
    corTexto: "#065f46",
    perguntas: [
      {
        titulo: "Qual serviço você procura?",
        chips: ["Design de sobrancelha", "Limpeza de pele", "Skincare", "Remoção de pelos"],
        ativo: "Skincare"
      },
      {
        titulo: "Qual a sua disponibilidade?",
        chips: ["Manhã", "Tarde", "Sábado"],
        ativo: "Tarde"
      }
    ]
  },
  {
    inicial: "C",
    nome: "Chef Marcos",
    desc: "Pedido rápido — menos de 1 minuto.",
    cor: "#ea580c",
    corClaro: "#ffedd5",
    corTexto: "#9a3412",
    perguntas: [
      {
        titulo: "O que você quer?",
        chips: ["Marmita do dia", "Marmita fit", "Encomenda especial", "Cardápio da semana"],
        ativo: "Marmita fit"
      },
      {
        titulo: "Para quantas pessoas?",
        chips: ["1", "2", "3 a 5", "6 ou mais"],
        ativo: "2"
      }
    ]
  }
];

let atual = 0;
let timer = setInterval(() => avancar(), 5000);

function avancar() {
  atual = (atual + 1) % perfis.length;
  renderPerfil(atual);
}

function irPara(index) {
  clearInterval(timer);
  atual = index;
  renderPerfil(atual);
  timer = setInterval(() => avancar(), 5000);
}

function renderChips(containerId, chips, ativo, p) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  chips.forEach(chip => {
    const div = document.createElement("div");
    div.className = "chip" + (chip === ativo ? " active" : "");
    div.textContent = chip;
    if (chip === ativo) {
      div.style.background = p.corClaro;
      div.style.borderColor = p.cor;
      div.style.color = p.corTexto;
    }
    container.appendChild(div);
  });
}

function renderPerfil(index) {
  const p = perfis[index];
  const screen = document.getElementById("mockScreen");

  screen.style.opacity = "0";

  setTimeout(() => {
    const logo = document.getElementById("mockLogo");
    logo.textContent = p.inicial;
    logo.style.background = `linear-gradient(135deg, ${p.cor}, ${p.corTexto})`;

    const clientTop = document.getElementById("mockClientTop");
    clientTop.style.background = `linear-gradient(135deg, #ffffff, ${p.corClaro})`;
    clientTop.style.borderBottomColor = p.cor;

    document.getElementById("mockName").textContent = p.nome;
    document.getElementById("mockDesc").textContent = p.desc;

    document.getElementById("mockQ1Title").textContent = p.perguntas[0].titulo;
    renderChips("mockQ1Chips", p.perguntas[0].chips, p.perguntas[0].ativo, p);

    document.getElementById("mockQ2Title").textContent = p.perguntas[1].titulo;
    renderChips("mockQ2Chips", p.perguntas[1].chips, p.perguntas[1].ativo, p);

    document.getElementById("mockSendBtn").style.background =
      `linear-gradient(135deg, ${p.cor}, ${p.corTexto})`;

    document.querySelectorAll(".mock-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
      dot.style.background = (i === index) ? p.cor : "";
    });

    screen.style.opacity = "1";
  }, 400);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("mockPrev").addEventListener("click", () => {
    irPara((atual - 1 + perfis.length) % perfis.length);
  });

  document.getElementById("mockNext").addEventListener("click", () => {
    irPara((atual + 1) % perfis.length);
  });

  document.querySelectorAll(".mock-dot").forEach((dot, i) => {
    dot.addEventListener("click", () => irPara(i));
  });
});
