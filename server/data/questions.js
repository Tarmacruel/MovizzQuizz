const standardTemplates = [
  {
    difficulty: "Fácil",
    text: ({ category, label, neighbors }) =>
      `Em ${category}, qual alternativa fica no mesmo grupo de ${neighbors[0]}, ${neighbors[1]} e ${neighbors[2]} em "${label}"?`,
  },
  {
    difficulty: "Médio",
    text: ({ category, label, neighbors }) =>
      `Qual alternativa completa esta seleção de ${label} de ${category}: ${neighbors[1]}, ${neighbors[3]} e ${neighbors[5]}?`,
  },
  {
    difficulty: "Difícil",
    text: ({ category, label, neighbors }) =>
      `No recorte difícil de ${category}, qual opção combina com ${neighbors[2]}, ${neighbors[4]} e ${neighbors[6]} sem sair de "${label}"?`,
  },
  {
    difficulty: "Difícil",
    text: ({ category, label, neighbors }) =>
      `Para uma rodada avançada de ${category}, qual resposta mantém a mesma curadoria de ${label} vista em ${neighbors[0]}, ${neighbors[4]} e ${neighbors[7]}?`,
  },
];

const leagueTemplates = [
  {
    difficulty: "Fácil",
    text: ({ label, neighbors }) =>
      `Em League of Legends, qual alternativa pertence ao conjunto ${label} junto de ${neighbors[0]}, ${neighbors[1]} e ${neighbors[2]}?`,
  },
  {
    difficulty: "Médio",
    text: ({ label, neighbors }) =>
      `Na lore, no jogo ou no competitivo de League of Legends, qual opção completa a lista ${label}: ${neighbors[1]}, ${neighbors[3]} e ${neighbors[5]}?`,
  },
  {
    difficulty: "Difícil",
    text: ({ label, neighbors }) =>
      `Em uma pergunta difícil de League of Legends, qual alternativa compartilha o recorte ${label} com ${neighbors[2]}, ${neighbors[4]} e ${neighbors[6]}?`,
  },
  {
    difficulty: "Difícil",
    text: ({ label, neighbors }) =>
      `Considerando a história de Runeterra e do cenário competitivo, qual resposta pertence a ${label} ao lado de ${neighbors[0]}, ${neighbors[7]} e ${neighbors[9]}?`,
  },
  {
    difficulty: "Difícil",
    text: ({ label, neighbors }) =>
      `No modo especialista de League of Legends, qual alternativa se encaixa em ${label} quando a pista traz ${neighbors[3]}, ${neighbors[8]} e ${neighbors[11]}?`,
  },
];

const catalog = [
  {
    category: "Marvel",
    templates: standardTemplates,
    groups: [
      {
        label: "heróis e anti-heróis",
        items: [
          "Homem de Ferro",
          "Capitão América",
          "Thor",
          "Hulk",
          "Viúva Negra",
          "Pantera Negra",
          "Doutor Estranho",
          "Homem-Aranha",
          "Feiticeira Escarlate",
          "Wolverine",
        ],
      },
      {
        label: "lugares e reinos",
        items: [
          "Wakanda",
          "Asgard",
          "Kamar-Taj",
          "Sokovia",
          "Xandar",
          "Vormir",
          "Knowhere",
          "Latveria",
          "Madripoor",
          "Nova York",
        ],
      },
      {
        label: "artefatos e recursos",
        items: [
          "Mjolnir",
          "Tesseract",
          "Manopla do Infinito",
          "Olho de Agamotto",
          "Escudo do Capitão América",
          "Vibranium",
          "Joia da Mente",
          "Livro de Vishanti",
          "Darkhold",
          "Erva-Coração",
        ],
      },
      {
        label: "equipes e organizações",
        items: [
          "Vingadores",
          "Guardiões da Galáxia",
          "X-Men",
          "Quarteto Fantástico",
          "S.H.I.E.L.D.",
          "Hydra",
          "Illuminati",
          "Dora Milaje",
          "Defensores",
          "Eternos",
        ],
      },
      {
        label: "vilões e ameaças",
        items: [
          "Thanos",
          "Loki",
          "Ultron",
          "Kang",
          "Magneto",
          "Duende Verde",
          "Caveira Vermelha",
          "Killmonger",
          "Doutor Destino",
          "Galactus",
        ],
      },
    ],
  },
  {
    category: "Star Wars",
    templates: standardTemplates,
    groups: [
      {
        label: "personagens",
        items: [
          "Luke Skywalker",
          "Leia Organa",
          "Han Solo",
          "Chewbacca",
          "Obi-Wan Kenobi",
          "Yoda",
          "Anakin Skywalker",
          "Ahsoka Tano",
          "Rey",
          "Din Djarin",
        ],
      },
      {
        label: "planetas e luas",
        items: [
          "Tatooine",
          "Hoth",
          "Endor",
          "Naboo",
          "Coruscant",
          "Kamino",
          "Mustafar",
          "Alderaan",
          "Dagobah",
          "Jakku",
        ],
      },
      {
        label: "ordens e facções",
        items: [
          "Ordem Jedi",
          "Sith",
          "Aliança Rebelde",
          "Império Galáctico",
          "Primeira Ordem",
          "Resistência",
          "República Galáctica",
          "Separatistas",
          "Mandalorianos",
          "Caçadores de Recompensa",
        ],
      },
      {
        label: "naves e veículos",
        items: [
          "Millennium Falcon",
          "X-Wing",
          "TIE Fighter",
          "Star Destroyer",
          "AT-AT",
          "Slave I",
          "Razor Crest",
          "Naboo N-1",
          "Speeder Bike",
          "A-Wing",
        ],
      },
      {
        label: "conceitos e elementos",
        items: [
          "Sabre de luz",
          "A Força",
          "Ordem 66",
          "Estrela da Morte",
          "Holocron",
          "Blaster",
          "Beskar",
          "Kyber",
          "Padawan",
          "Conselho Jedi",
        ],
      },
    ],
  },
  {
    category: "DC",
    templates: standardTemplates,
    groups: [
      {
        label: "heróis e heroínas",
        items: [
          "Batman",
          "Superman",
          "Mulher-Maravilha",
          "Flash",
          "Aquaman",
          "Lanterna Verde",
          "Ciborgue",
          "Arqueiro Verde",
          "Shazam",
          "Supergirl",
        ],
      },
      {
        label: "cidades e locais",
        items: [
          "Gotham City",
          "Metrópolis",
          "Central City",
          "Atlantis",
          "Themyscira",
          "Smallville",
          "Oa",
          "Apokolips",
          "Arkham",
          "Fortaleza da Solidão",
        ],
      },
      {
        label: "artefatos e poderes",
        items: [
          "Anel do Lanterna Verde",
          "Laço da Verdade",
          "Batarangue",
          "Kryptonita",
          "Caixa Materna",
          "Tridente de Aquaman",
          "Velocidade da Força de Aceleração",
          "Capuz do Batman",
          "Braceletes da Submissão",
          "Elmo do Senhor Destino",
        ],
      },
      {
        label: "equipes e grupos",
        items: [
          "Liga da Justiça",
          "Jovens Titãs",
          "Esquadrão Suicida",
          "Sociedade da Justiça",
          "Tropa dos Lanternas Verdes",
          "Legião do Mal",
          "Patrulha do Destino",
          "Aves de Rapina",
          "Liga dos Assassinos",
          "Novos Deuses",
        ],
      },
      {
        label: "vilões e antagonistas",
        items: [
          "Coringa",
          "Lex Luthor",
          "Darkseid",
          "Mulher-Leopardo",
          "Sinestro",
          "Arlequina",
          "Charada",
          "Duas-Caras",
          "Exterminador",
          "Brainiac",
        ],
      },
    ],
  },
  {
    category: "O Senhor dos Anéis",
    templates: standardTemplates,
    groups: [
      {
        label: "personagens da Terra-média",
        items: [
          "Frodo",
          "Samwise Gamgee",
          "Gandalf",
          "Aragorn",
          "Legolas",
          "Gimli",
          "Boromir",
          "Galadriel",
          "Elrond",
          "Bilbo",
        ],
      },
      {
        label: "lugares da Terra-média",
        items: [
          "Condado",
          "Mordor",
          "Valfenda",
          "Lothlórien",
          "Minas Tirith",
          "Rohan",
          "Moria",
          "Isengard",
          "Bri",
          "Montanha da Perdição",
        ],
      },
      {
        label: "povos e linhagens",
        items: [
          "Hobbits",
          "Elfos",
          "Anões",
          "Homens de Gondor",
          "Rohirrim",
          "Ents",
          "Orcs",
          "Nazgûl",
          "Dúnedain",
          "Maiar",
        ],
      },
      {
        label: "artefatos e objetos",
        items: [
          "Um Anel",
          "Narsil",
          "Andúril",
          "Palantír",
          "Mithril",
          "Frasco de Galadriel",
          "Sting",
          "Coroa de Gondor",
          "Cachimbo de Bilbo",
          "Livro Vermelho",
        ],
      },
      {
        label: "criaturas e ameaças",
        items: [
          "Sauron",
          "Saruman",
          "Gollum",
          "Balrog",
          "Shelob",
          "Troll",
          "Olifante",
          "Uruk-hai",
          "Rei-bruxo de Angmar",
          "Smaug",
        ],
      },
    ],
  },
  {
    category: "Cultura Pop",
    templates: standardTemplates,
    groups: [
      {
        label: "filmes e sagas",
        items: [
          "De Volta para o Futuro",
          "Matrix",
          "Jurassic Park",
          "Piratas do Caribe",
          "Harry Potter",
          "Indiana Jones",
          "O Exterminador do Futuro",
          "Blade Runner",
          "Avatar",
          "Ghostbusters",
        ],
      },
      {
        label: "personagens marcantes",
        items: [
          "Marty McFly",
          "Neo",
          "Jack Sparrow",
          "Harry Potter",
          "Indiana Jones",
          "Sarah Connor",
          "Ellen Ripley",
          "Lara Croft",
          "Katniss Everdeen",
          "Willy Wonka",
        ],
      },
      {
        label: "objetos e veículos famosos",
        items: [
          "DeLorean",
          "Pílula vermelha",
          "Chicote de Indiana Jones",
          "Varinha de sabugueiro",
          "Proton pack",
          "Skynet",
          "Anel de Nárnia",
          "TARDIS",
          "Spinner de Blade Runner",
          "Bicicleta de E.T.",
        ],
      },
      {
        label: "mundos e lugares fictícios",
        items: [
          "Hogwarts",
          "Nárnia",
          "Pandora",
          "Hill Valley",
          "Ilha Nublar",
          "Mundo Invertido",
          "Panem",
          "Westeros",
          "Arrakis",
          "Oz",
        ],
      },
      {
        label: "conceitos e franquias",
        items: [
          "Transformers",
          "Power Rangers",
          "Pokémon",
          "Doctor Who",
          "Stranger Things",
          "Duna",
          "Game of Thrones",
          "The Walking Dead",
          "Mad Max",
          "Alien",
        ],
      },
    ],
  },
  {
    category: "League of Legends",
    templates: leagueTemplates,
    groups: [
      {
        label: "campeões e campeãs",
        items: [
          "Ahri",
          "Yasuo",
          "Jinx",
          "Vi",
          "Lux",
          "Garen",
          "Darius",
          "Katarina",
          "Ryze",
          "Ashe",
          "Miss Fortune",
          "Thresh",
          "Lee Sin",
          "Zed",
          "Akali",
          "Ekko",
          "Senna",
          "Lucian",
          "Viego",
          "Aatrox",
        ],
      },
      {
        label: "regiões e locais de Runeterra",
        items: [
          "Demacia",
          "Noxus",
          "Ionia",
          "Piltover",
          "Zaun",
          "Freljord",
          "Shurima",
          "Targon",
          "Águas de Sentina",
          "Ilhas das Sombras",
          "Ixtal",
          "Bandópolis",
          "Vazio",
          "Runeterra",
          "Monte Targon",
          "Kumungu",
          "Grande Sai",
          "Navori",
          "Stillwater",
          "Placidium de Navori",
        ],
      },
      {
        label: "lore, magia e curiosidades",
        items: [
          "Runas Globais",
          "Ascendentes",
          "Darkin",
          "Vastaya",
          "Sentinelas da Luz",
          "Ruína",
          "Névoa Negra",
          "Hextec",
          "Quimtec",
          "Ordem Kinkou",
          "Solari",
          "Lunari",
          "Conselho de Piltover",
          "Rosa Negra",
          "Glacinatas",
          "Observadores",
          "Icathia",
          "Caçadores de Magos",
          "Trifarix",
          "Portais Hextec",
        ],
      },
      {
        label: "competitivo brasileiro",
        items: [
          "CBLOL",
          "paiN Gaming",
          "INTZ",
          "KaBuM! Esports",
          "LOUD",
          "RED Canids",
          "Flamengo Esports",
          "Vivo Keyd Stars",
          "FURIA",
          "Los Grandes",
          "brTT",
          "Tinowns",
          "Robo",
          "Revolta",
          "Dynquedo",
          "Kami",
          "Mylon",
          "Tockers",
          "Ranger",
          "Ceos",
        ],
      },
      {
        label: "competitivo mundial",
        items: [
          "Worlds",
          "MSI",
          "T1",
          "Faker",
          "G2 Esports",
          "Fnatic",
          "Invictus Gaming",
          "FunPlus Phoenix",
          "DAMWON Gaming",
          "EDward Gaming",
          "DRX",
          "Gen.G",
          "Royal Never Give Up",
          "JD Gaming",
          "Bilibili Gaming",
          "LCK",
          "LPL",
          "LEC",
          "LCS",
          "Summoner's Cup",
        ],
      },
    ],
  },
];

function unique(items) {
  return [...new Set(items)];
}

const allAnswers = catalog.flatMap((theme) =>
  theme.groups.flatMap((group) =>
    group.items.map((item) => ({
      category: theme.category,
      label: group.label,
      value: item,
    }))
  )
);

function circularNeighbors(items, index, total = 12) {
  const neighbors = [];
  for (let offset = 1; neighbors.length < total; offset += 1) {
    neighbors.push(items[(index + offset) % items.length]);
  }
  return neighbors;
}

function pickDistractors({ category, label, answer, seed }) {
  const sameGroup = allAnswers
    .filter((item) => item.value !== answer && item.category === category && item.label === label)
    .map((item) => item.value);
  const sameCategory = allAnswers
    .filter((item) => item.value !== answer && item.category === category && item.label !== label)
    .map((item) => item.value);
  const pool = unique([...sameGroup, ...sameCategory]);
  const start = seed % pool.length;
  const distractors = [];

  for (let offset = 0; distractors.length < 3 && offset < pool.length * 2; offset += 1) {
    const candidate = pool[(start + offset * 7) % pool.length];
    if (candidate !== answer && !distractors.includes(candidate)) {
      distractors.push(candidate);
    }
  }

  return distractors;
}

function hashText(text) {
  return [...text].reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) >>> 0, 2166136261);
}

function arrangeOptions(answer, distractors, idNumber, question) {
  const options = distractors.slice(0, 3);
  options.splice(hashText(`${idNumber}:${question}:${answer}`) % 4, 0, answer);
  return options;
}

function buildQuestions() {
  const questions = [];
  const seenQuestions = new Set();
  let idNumber = 1;

  for (const theme of catalog) {
    for (const group of theme.groups) {
      group.items.forEach((answer, itemIndex) => {
        const neighbors = circularNeighbors(group.items, itemIndex);

        theme.templates.forEach((template) => {
          const question = template.text({
            category: theme.category,
            label: group.label,
            answer,
            neighbors,
          });
          const normalizedQuestion = question.toLowerCase();

          if (seenQuestions.has(normalizedQuestion)) {
            throw new Error(`Pergunta duplicada gerada: ${question}`);
          }

          seenQuestions.add(normalizedQuestion);
          const distractors = pickDistractors({
            category: theme.category,
            label: group.label,
            answer,
            seed: idNumber + itemIndex,
          });

          questions.push({
            id: `q-${String(idNumber).padStart(4, "0")}`,
            category: theme.category,
            difficulty: template.difficulty,
            question,
            options: arrangeOptions(answer, distractors, idNumber, question),
            answer,
          });

          idNumber += 1;
        });
      });
    }
  }

  return questions;
}

const questions = buildQuestions();

export default questions;
