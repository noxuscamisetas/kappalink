const demoState = {
  tipo: "Reparo de joia",
  urgencia: "Essa semana",
  detalhe: ""
};

function scrollToDemo() {
  const demo = document.getElementById("demo-flow");

  if (demo) {
    demo.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function scrollToCTA() {
  const cta = document.getElementById("cta-final");

  if (cta) {
    cta.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function selectChip(field, value, element) {
  demoState[field] = value;

  const group = element.closest(".demo-clicks");

  if (group) {
    const chips = group.querySelectorAll(".chip");

    chips.forEach((chip) => {
      chip.classList.remove("active");
    });
  }

  element.classList.add("active");

  updateSummary();
}

function updateDetail(value) {
  demoState.detalhe = value.trim();
  updateSummary();
}

function updateSummary() {
  const summaryBox = document.getElementById("demoSummary");

  if (!summaryBox) return;

  const detalheTexto = demoState.detalhe
    ? demoState.detalhe
    : "Ainda não informou detalhes.";

  summaryBox.textContent =
`Novo pedido recebido pelo KappaLink

Tipo de pedido:
${demoState.tipo}

Urgência:
${demoState.urgencia}

Detalhes enviados:
${detalheTexto}

Próximo passo:
Responder o cliente com mais clareza, pedir foto se necessário e passar orçamento ou orientação.`;
}

document.addEventListener("DOMContentLoaded", () => {
  updateSummary();
});