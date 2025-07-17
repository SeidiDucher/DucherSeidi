import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 7000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// --- Conexão com MongoDB usando Mongoose ----------------------
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/feira_ciencias";

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Conectado ao MongoDB com Mongoose");
    app.listen(PORT, () =>
      console.log(`Servidor ouvindo em http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Erro ao conectar ao MongoDB:", err);
    process.exit(1);
  });

// --- Definindo o Schema e o Model ----------------------------
const projetoSchema = new mongoose.Schema({
  titulo: String,
  descricao: String,
  videoUrl: String,
  votos: { type: Number, default: 0 },
});

const Projeto = mongoose.model("projetos", projetoSchema);

// --- Rotas ---------------------------------------------------

// Listar todos os projetos
app.get("/projetos", async (_, res) => {
  try {
    const projetos = await Projeto.find();
    res.json(projetos);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar projetos" });
  }
});

// Detalhe de um projeto
app.get("/projetos/:id", async (req, res) => {
  try {
    const projeto = await Projeto.findById(req.params.id);
    if (!projeto) return res.status(404).json({ error: "Projeto não encontrado" });
    res.json(projeto);
  } catch (err) {
    res.status(400).json({ error: "ID inválido" });
  }
});

// Votar num projeto
app.post("/projetos/:id/voto", async (req, res) => {
  try {
    const projeto = await Projeto.findByIdAndUpdate(
      req.params.id,
      { $inc: { votos: 1 } },
      { new: true }
    );

    if (!projeto) return res.status(404).json({ error: "Projeto não encontrado" });
    res.json({ success: true, votos: projeto.votos });
    
  } catch (err) {
    res.status(400).json({ error: "ID inválido" });
  }
});
