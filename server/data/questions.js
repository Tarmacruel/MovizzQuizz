const banks = {
  "Marvel": [
    ["Qual personagem usa uma armadura tecnológica vermelha e dourada?", ["Homem de Ferro", "Thor", "Doutor Estranho", "Pantera Negra"], "Homem de Ferro", "Fácil"],
    ["Qual é o nome verdadeiro do Capitão América?", ["Steve Rogers", "Tony Stark", "Bruce Banner", "Clint Barton"], "Steve Rogers", "Fácil"],
    ["Qual personagem se transforma no Hulk?", ["Bruce Banner", "Peter Parker", "Scott Lang", "Sam Wilson"], "Bruce Banner", "Fácil"],
    ["Qual item reúne as Joias do Infinito quando completo?", ["Manopla do Infinito", "Mjolnir", "Tesseract", "Olho de Agamotto"], "Manopla do Infinito", "Fácil"],
    ["Qual reino é associado ao Pantera Negra?", ["Wakanda", "Asgard", "Sokovia", "Latveria"], "Wakanda", "Fácil"],
    ["Qual é a arma clássica de Thor?", ["Mjolnir", "Escudo de vibranium", "Arco e flecha", "Sabre de luz"], "Mjolnir", "Fácil"],
    ["Qual herói é conhecido como o amigão da vizinhança?", ["Homem-Aranha", "Demolidor", "Gavião Arqueiro", "Falcão"], "Homem-Aranha", "Fácil"],
    ["Quem é o líder inicial dos Guardiões da Galáxia nos filmes?", ["Peter Quill", "Rocket", "Drax", "Yondu"], "Peter Quill", "Médio"],
    ["Qual personagem costuma dizer apenas variações de 'Eu sou Groot'?", ["Groot", "Rocket", "Drax", "Mantis"], "Groot", "Fácil"],
    ["Quem é o irmão adotivo de Thor?", ["Loki", "Odin", "Heimdall", "Surtur"], "Loki", "Fácil"]
  ],
  "Star Wars": [
    ["Qual arma é tradicionalmente usada pelos Jedi?", ["Sabre de luz", "Blaster", "Chicote laser", "Lança Beskar"], "Sabre de luz", "Fácil"],
    ["Quem é o pai de Luke Skywalker?", ["Anakin Skywalker", "Obi-Wan Kenobi", "Han Solo", "Mace Windu"], "Anakin Skywalker", "Fácil"],
    ["Qual planeta desértico é associado à infância de Luke?", ["Tatooine", "Hoth", "Endor", "Naboo"], "Tatooine", "Fácil"],
    ["Qual nave é pilotada por Han Solo e Chewbacca?", ["Millennium Falcon", "X-Wing", "TIE Fighter", "Slave I"], "Millennium Falcon", "Fácil"],
    ["Qual pequeno mestre Jedi treina Luke em Dagobah?", ["Yoda", "Mace Windu", "Qui-Gon Jinn", "Plo Koon"], "Yoda", "Fácil"],
    ["Qual império antagoniza a Aliança Rebelde na trilogia clássica?", ["Império Galáctico", "Primeira Ordem", "República Velha", "Confederação"], "Império Galáctico", "Fácil"],
    ["Qual princesa se torna líder rebelde?", ["Leia Organa", "Padmé Amidala", "Rey Skywalker", "Ahsoka Tano"], "Leia Organa", "Fácil"],
    ["Qual personagem usa máscara preta e respiração mecânica?", ["Darth Vader", "Darth Maul", "Kylo Ren", "General Grievous"], "Darth Vader", "Fácil"],
    ["Qual planeta gelado abriga uma base rebelde em 'O Império Contra-Ataca'?", ["Hoth", "Mustafar", "Kamino", "Jakku"], "Hoth", "Médio"],
    ["Qual ordem determina a execução dos Jedi?", ["Ordem 66", "Ordem 99", "Ordem Final", "Ordem 13"], "Ordem 66", "Médio"]
  ],
  "DC": [
    ["Qual é a identidade secreta do Batman?", ["Bruce Wayne", "Clark Kent", "Barry Allen", "Arthur Curry"], "Bruce Wayne", "Fácil"],
    ["De qual planeta veio o Superman?", ["Krypton", "Oa", "Apokolips", "Tamaran"], "Krypton", "Fácil"],
    ["Qual é o nome civil da Mulher-Maravilha?", ["Diana Prince", "Lois Lane", "Selina Kyle", "Kara Danvers"], "Diana Prince", "Fácil"],
    ["Qual herói é conhecido por sua supervelocidade?", ["Flash", "Aquaman", "Ciborgue", "Arqueiro Verde"], "Flash", "Fácil"],
    ["Qual cidade é protegida principalmente pelo Batman?", ["Gotham City", "Metrópolis", "Central City", "Atlantis"], "Gotham City", "Fácil"],
    ["Qual cidade é associada ao Superman?", ["Metrópolis", "Gotham City", "Star City", "Coast City"], "Metrópolis", "Fácil"],
    ["Qual vilão do Batman é conhecido por enigmas?", ["Charada", "Coringa", "Pinguim", "Bane"], "Charada", "Fácil"],
    ["Qual vilão do Superman é um empresário bilionário e gênio criminoso?", ["Lex Luthor", "Darkseid", "Sinestro", "Brainiac"], "Lex Luthor", "Fácil"],
    ["Qual inimigo do Batman é conhecido por rir e usar palhaçaria criminosa?", ["Coringa", "Duas-Caras", "Espantalho", "Ra's al Ghul"], "Coringa", "Fácil"],
    ["Qual herói governa Atlantis?", ["Aquaman", "Flash", "Lanterna Verde", "Shazam"], "Aquaman", "Fácil"]
  ],
  "O Senhor dos Anéis": [
    ["Quem recebe a missão de levar o Um Anel até Mordor?", ["Frodo", "Aragorn", "Legolas", "Gimli"], "Frodo", "Fácil"],
    ["Quem diz frequentemente 'meu precioso'?", ["Gollum", "Sauron", "Saruman", "Balrog"], "Gollum", "Fácil"],
    ["Qual mago acompanha a Sociedade do Anel?", ["Gandalf", "Saruman", "Radagast", "Elrond"], "Gandalf", "Fácil"],
    ["Qual hobbit é jardineiro e companheiro fiel de Frodo?", ["Samwise Gamgee", "Merry", "Pippin", "Bilbo"], "Samwise Gamgee", "Fácil"],
    ["Qual elfo arqueiro integra a Sociedade do Anel?", ["Legolas", "Elrond", "Thranduil", "Haldir"], "Legolas", "Fácil"],
    ["Qual anão integra a Sociedade do Anel?", ["Gimli", "Thorin", "Balin", "Dwalin"], "Gimli", "Fácil"],
    ["Qual homem herdeiro de Isildur integra a Sociedade?", ["Aragorn", "Boromir", "Faramir", "Éomer"], "Aragorn", "Fácil"],
    ["Qual terra sombria é governada por Sauron?", ["Mordor", "Rohan", "Gondor", "Valfenda"], "Mordor", "Fácil"],
    ["Qual objeto precisa ser destruído na Montanha da Perdição?", ["Um Anel", "Palantír", "Silmaril", "Narsil"], "Um Anel", "Fácil"],
    ["Qual criatura de fogo e sombra enfrenta Gandalf em Moria?", ["Balrog", "Nazgûl", "Troll", "Olifante"], "Balrog", "Médio"]
  ],
  "Cultura Pop": [
    ["Em 'De Volta para o Futuro', qual carro vira máquina do tempo?", ["DeLorean", "Mustang", "Ferrari", "Fusca"], "DeLorean", "Fácil"],
    ["Qual filme popularizou a frase 'I'll be back'?", ["O Exterminador do Futuro", "Matrix", "Predador", "Duro de Matar"], "O Exterminador do Futuro", "Fácil"],
    ["Em 'Matrix', qual pílula Neo escolhe?", ["Vermelha", "Azul", "Verde", "Branca"], "Vermelha", "Fácil"],
    ["Qual diretor é associado a 'Jurassic Park' de 1993?", ["Steven Spielberg", "James Cameron", "George Lucas", "Ridley Scott"], "Steven Spielberg", "Médio"],
    ["Em 'Blade Runner', como são chamados os seres artificiais perseguidos?", ["Replicantes", "Cylons", "Sintéticos", "Androides"], "Replicantes", "Médio"],
    ["Qual filme apresenta o personagem Jack Sparrow?", ["Piratas do Caribe", "A Múmia", "Hook", "Ilha da Garganta Cortada"], "Piratas do Caribe", "Fácil"],
    ["Qual saga tem a escola de magia Hogwarts?", ["Harry Potter", "Percy Jackson", "Nárnia", "Crepúsculo"], "Harry Potter", "Fácil"],
    ["Qual personagem é conhecido como o bruxo que sobreviveu?", ["Harry Potter", "Frodo", "Luke Skywalker", "Neo"], "Harry Potter", "Fácil"],
    ["Qual filme apresenta o parque com dinossauros clonados?", ["Jurassic Park", "King Kong", "Godzilla", "Avatar"], "Jurassic Park", "Fácil"],
    ["Qual franquia tem os Autobots e Decepticons?", ["Transformers", "Power Rangers", "Pacific Rim", "RoboCop"], "Transformers", "Fácil"]
  ]
};

const variants = [
  (q) => q,
  (q) => q.replace(/^Qual /, "No universo da cultura pop, qual ").replace(/^Quem /, "No contexto da obra, quem ").replace(/^Em /, "Considerando "),
  (q) => q.replace(/^Qual /, "Assinale corretamente: qual ").replace(/^Quem /, "Assinale corretamente: quem ").replace(/^Em /, "Assinale corretamente: em "),
  (q) => q.replace(/^Qual /, "Para vencer esta rodada, indique qual ").replace(/^Quem /, "Para vencer esta rodada, indique quem ").replace(/^Em /, "Para vencer esta rodada, indique em "),
];

const questions = [];
let id = 1;

for (const [category, items] of Object.entries(banks)) {
  for (const [question, options, answer, difficulty] of items) {
    for (const variant of variants) {
      questions.push({
        id: `q-${String(id).padStart(3, "0")}`,
        category,
        difficulty,
        question: variant(question),
        options,
        answer,
      });
      id += 1;
    }
  }
}

export default questions;
