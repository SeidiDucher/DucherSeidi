var express = require("express");
const session = require("express-session");
var handlebars = require("express-handlebars");
const bcrypt = require("bcrypt");
var segredo = "kjsjdr3kjdskjsfkjjkq4tfklf";

var app = express();
const { MongoClient } = require("mongodb");

var users;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: segredo,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours  Tempo de expiração do cookie
  })
);

app.engine("handlebars", handlebars.engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

// Autenticação para rotas protegidas
function autenticacao(req, resp, next) {
  if (req.session.sessionId) next();
  else {
    console.log("Erro na autenticação, redireciona para login");
    resp.render("login");
  }
}
app.use(express.static(__dirname + "/public"));

// Rota para a página inicial
app.get("/", (req, resp) => {
  resp.render("login");
});

app.get("/login", (req, resp) => {
  resp.render("login");
});

// Rota para a página de cadastro
app.get("/cadastro", (req, resp) =>{
  resp.render("cadastro")
})

//Rota para login de usuário
app.post("/login", async (req, resp) => {
  let credenciais = req.body;
  let dados = await users.findOne({ id: credenciais.id });

  if (dados) {
    const match = await bcrypt.compare(credenciais.pass, dados.pass);
    if (match) {
      req.session.sessionId = dados.id;
      req.session.sessionUser = dados.id + "[ Vitórias: " + dados.vitorias + " ]";
      return resp.render("dashboard", {
        usuario: req.session.sessionId,
        usuario1: req.session.sessionUser,
        cores: ["azul", "amarelo", "verde"],
      });
    }
  }

  resp.redirect("/login");
});

//Rota para cadastro de usuário
const saltRounds = 10;
app.post("/cadastro", async (req, resp) =>{
  const { id, pass } = req.body;
  
  const userExist = await users.findOne({ id });
  if (userExist) {
    return resp.render("cadastro", { mensagem: "Usuário já existe" });
  }

  const hash = await bcrypt.hash(pass, saltRounds);
  await users.insertOne({ id, pass: hash, vitorias: 0 });
  resp.render("login", { mensagem: "Usuário cadastrado com sucesso" });
})

// Rotas protegidas
app.get("/dashboard", autenticacao, (req, resp) => {
  resp.render("dashboard", { usuario: req.session.sessionId });
});

app.get("/teste", (req, resp) => {
  resp.send("Servidor no ar");
});

// Rota para a página "sobre"
app.get("/sobre", autenticacao, (req, resp) => {
  resp.render("sobre", { usuario: req.session.sessionId });
});

// Rota para a página "Jogo"
app.get("/jogo", autenticacao, (req, resp) => {
  resp.render("jogo", { usuario: req.session.sessionId });
});

// Rota para a página "contato"
app.get("/contato", autenticacao, (req, resp) => {
  resp.render("contato", { usuario: req.session.sessionId });
});

// Rota para logout"
app.get("/logoff", autenticacao, (req, resp) => {
  req.session.destroy();
  resp.render("login", { mensagem: "Usuário deslogado do sistema" });
});

app.get(/^(.+)$/, function (req, resp) {
  resp.render("login");
});

async function conecta() {
  let db;
  var client = new MongoClient("mongodb://127.0.0.1:27017");
  await client.connect();
  db = await client.db("jogo");
  jogadores = await db.collection("jogador");
  users = await db.collection("users");
  console.log("conectado ao banco de dados");

  const http = require("http").createServer(app);
  const { Server } = require("socket.io");
  const io = new Server(http);

  let jogadoresOnline = {};

  async function atualizaLista() {
    const lista = await Promise.all(
      Object.keys(jogadoresOnline).map(async nome => {
        const doc = await users.findOne(
          { id: nome },
          { projection: { vitorias: 1, _id: 0 } }
        );
        return { nome, vitorias: doc ? doc.vitorias : 0 };
      })
    );
    
    io.emit("atualizarLista", lista);
  }

  let jogadoresSecretos = {};
  let placarJogadores  = {};
  const personagens = [
    "Alessandro.png", "Alfredo.png", "Anita.png", "Anna.png", "Bernardo.png", "Carlo.png", "Chiara.png", "Davide.png", "Ernesto.png",
    "Filippo.png", "Giacomo.png", "Giorgio.png", "Giuseppe.png", "Guglielmo.png", "Manuele.png", "Marco.png", "Maria.png",
    "Paolo.png", "Pietro.png", "Riccardo.png", "Roberto.png", "Samuele.png", "Susanna.png", "Tommaso.png"
  ];

  io.on("connection", (socket) => {
    console.log("Novo jogador conectado");

    socket.on("registrar", async (nome) => {
      socket.nome = nome;
      jogadoresOnline[nome] = socket.id;
      //io.emit("atualizarLista", Object.keys(jogadoresOnline));
      await atualizaLista();
    });

    socket.on("disconnect", () => {
      if (socket.nome) {
        delete jogadoresOnline[socket.nome];
        //io.emit("atualizarLista", Object.keys(jogadoresOnline));
        atualizaLista();
      }
    });

    socket.on("convidar", (dados) => {
      const {de, para} = dados;
      const idSocketPara = jogadoresOnline[para];
      if (idSocketPara) {
        io.to(idSocketPara).emit("receberConvite", {de});
      }
    });

    socket.on("aceitarConvite", async (dados) => {
      const {de, para} = dados;

      //sorteia personagens secretos

      const sorteadoA   = personagens[Math.floor(Math.random() * personagens.length)];
      const sorteadoB   = personagens[Math.floor(Math.random() * personagens.length)];

      jogadoresSecretos[de]    = sorteadoB; // A deve adivinhar o que foi sorteadoB
      jogadoresSecretos[para]  = sorteadoA; // B deve adivinhar o que foi sorteadoA

      let A = await users.findOne({id: de}, {projection: { vitorias: 1, _id: 0 }});
      let B = await users.findOne({id: para}, {projection: { vitorias: 1, _id: 0 }});
 
      placarJogadores[de]   = { vitorias: A.vitorias, derrotas: 0 };
      placarJogadores[para] = { vitorias: B.vitorias, derrotas: 0 };

      const idSocketA = jogadoresOnline[de];
      const idSocketB = jogadoresOnline[para];

      // Envia sinal para ambos irem para o jogo
      io.to(idSocketA).emit("iniciarJogo", { personagem: sorteadoA, oponente: para, vitoriasEu: A.vitorias, vitoriasAd: B.vitorias });
      io.to(idSocketB).emit("iniciarJogo", { personagem: sorteadoB, oponente: de , vitoriasEu: B.vitorias, vitoriasAd: A.vitorias});
    });

    socket.on("mensagem", (dados) => {
      console.log("Mensagem recebida:", dados);
      const { de, para, texto } = dados;

      io.emit("msg", texto);

      const idSocketPara = jogadoresOnline[para];
      const idSocketDe = jogadoresOnline[de];

      //envia para o jogador que está jogando
      if(idSocketDe){
        io.to(idSocketDe).emit("mensagem", { de, texto });
      }

      //enviar para oponente
      if(idSocketPara){
        io.to(idSocketPara).emit("mensagem", { de, texto });
      }
    });

    socket.on("palpite", async (dados) => {
      const { de, para, chute } = dados;
      const idSocketDe   = jogadoresOnline[de];
      const idSocketPara = jogadoresOnline[para];

      const segredoCerto = jogadoresSecretos[de];

      // Verifica acerto
      const acertou = (chute + ".png").toLowerCase() === segredoCerto.toLowerCase();

      if (acertou) {
        placarJogadores[de].vitorias++;
        //placarJogadores[para].derrotas++;
        await users.updateOne({ id: de },   { $inc: { vitorias: 1 } });

        if (idSocketDe)   {
          io.to(idSocketDe).emit("venceu", { vitoria: placarJogadores[de].vitorias, derrota: placarJogadores[para].vitorias, mensagem: "Você acertou! 🎉" });
        }
        if (idSocketPara){
          io.to(idSocketPara).emit("venceu", { vitoria: placarJogadores[para].vitorias, derrota: placarJogadores[de].vitorias, mensagem: "Você errou o palpite. ❌" });
        }
      } else {
          //placarJogadores[de].derrotas++;
          placarJogadores[para].vitorias++;
          await users.updateOne({ id: para }, { $inc: { vitorias: 1 } });

          if (idSocketDe){
            io.to(idSocketDe).emit("venceu", { vitoria: placarJogadores[de].vitorias, derrota: placarJogadores[para].vitorias,   mensagem: "Você errou o palpite. ❌" });
          }
          if (idSocketPara){
            io.to(idSocketPara).emit("venceu", { vitoria: placarJogadores[para].vitorias, derrota: placarJogadores[de].vitorias,  mensagem: "Você venceu! 🎉" });
          }
      }

    });

    socket.on("fimJogo", (dados) => {
      const { de, para } = dados;

      const idSocketPara = jogadoresOnline[para];
      const idSocketDe = jogadoresOnline[de];

      if(idSocketDe){
        io.to(idSocketDe).emit("fim");
      }

      if(idSocketPara){
        io.to(idSocketPara).emit("fim");
      }
    });

    socket.on("fimSessao", (dados) => {
      const { de, para } = dados;

      // Limpa partida
      delete jogadoresSecretos[de];
      delete jogadoresSecretos[para];
    });



  });
  http.listen(4000, () => {
    console.log("Servidor web rodando na porta 4000");
  });
}

conecta();