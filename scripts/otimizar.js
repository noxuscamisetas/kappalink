const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const cliente = process.argv[2];

if (!cliente) {
  console.error("❌ Informe o nome do cliente. Ex: node scripts/otimizar.js noxuscamisetas");
  process.exit(1);
}

const root = process.cwd();
const baseDir = path.resolve(root, "public", "clientes", cliente);

if (!fs.existsSync(baseDir)) {
  console.error("❌ Pasta não encontrada: public/clientes/" + cliente);
  process.exit(1);
}

function formatKB(bytes) {
  return Math.round(bytes / 1024) + "KB";
}

async function processarArquivo(filePath, largura, altura, modo) {
  const inputBuffer = fs.readFileSync(filePath);

  const resizer = sharp(inputBuffer).jpeg({ quality: modo === "logo" ? 90 : 85 });

  if (modo === "logo") {
    resizer.resize(largura, altura, { fit: "inside", withoutEnlargement: true });
  } else {
    resizer.resize(largura, altura, { fit: "cover", position: "center" });
  }

  return resizer.toBuffer();
}

async function processarLogo() {
  const extensoes = [".jpg", ".jpeg", ".png", ".webp"];
  let logoPath = null;
  let logoNome = null;

  for (const ext of extensoes) {
    const candidato = path.resolve(baseDir, cliente + "-logo" + ext);
    if (fs.existsSync(candidato)) {
      logoPath = candidato;
      logoNome = cliente + "-logo" + ext;
      break;
    }
  }

  if (!logoPath) {
    console.log("⚠️  Logo não encontrada (esperado: " + cliente + "-logo.jpg)");
    return;
  }

  const destPath = path.resolve(baseDir, cliente + "-logo.jpg");

  try {
    const buffer = await processarArquivo(logoPath, 400, 400, "logo");
    fs.writeFileSync(destPath, buffer);
    console.log("✅ " + logoNome + " → 400x400 (max) | " + formatKB(buffer.length));
  } catch (err) {
    console.error("❌ Erro ao processar logo: " + err.message);
  }
}

async function processarModelos() {
  const imgDir = path.resolve(baseDir, "img");

  if (!fs.existsSync(imgDir)) {
    console.log("⚠️  Pasta img/ não encontrada — pulando modelos.");
    return;
  }

  const arquivos = fs.readdirSync(imgDir).filter(function(f) {
    return /\.(jpg|jpeg|png|webp)$/i.test(f);
  });

  if (arquivos.length === 0) {
    console.log("⚠️  Nenhuma imagem encontrada em img/");
    return;
  }

  for (var i = 0; i < arquivos.length; i++) {
    var arquivo = arquivos[i];
    var filePath = path.resolve(imgDir, arquivo);
    var nomeBase = path.basename(arquivo, path.extname(arquivo)) + ".jpg";
    var destPath = path.resolve(imgDir, nomeBase);

    try {
      var buffer = await processarArquivo(filePath, 800, 800, "modelo");
      fs.writeFileSync(destPath, buffer);
      console.log("✅ " + arquivo + " → 800x800 | " + formatKB(buffer.length));
    } catch (err) {
      console.error("❌ Erro ao processar " + arquivo + ": " + err.message);
    }
  }
}

(async function() {
  console.log("");
  console.log("🔧 Otimizando imagens do cliente: " + cliente);
  console.log("");
  await processarLogo();
  await processarModelos();
  console.log("");
  console.log("✔️  Concluído.");
  console.log("");
})();
