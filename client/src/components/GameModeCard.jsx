const MODE_META = {
  quiz: {
    icon: "🎬",
    title: "Quiz Cultura Pop",
    description: "Perguntas rápidas, ranking e tempo por rodada.",
    tags: ["Marvel", "DC", "Star Wars"],
  },
  stop: {
    icon: "✍️",
    title: "Stop / Adedanha",
    description: "Categorias, letras sorteadas e revisão em grupo.",
    tags: ["Letras", "Categorias", "Rodadas"],
  },
  ludo: {
    icon: "🎲",
    title: "Ludo",
    description: "Tabuleiro, dado animado e disputa entre amigos.",
    tags: ["2 a 6", "Dado", "Capturas"],
  },
};

export default function GameModeCard({ mode, active = false, onSelect }) {
  const meta = MODE_META[mode] || MODE_META.quiz;

  return (
    <button
      type="button"
      className={`structured-mode-card ${active ? "active" : ""}`}
      onClick={() => onSelect?.(mode)}
    >
      <span className="structured-mode-icon" aria-hidden="true">{meta.icon}</span>
      <span className="structured-mode-copy">
        <strong>{meta.title}</strong>
        <small>{meta.description}</small>
        <span className="structured-mode-tags">
          {meta.tags.map((tag) => <em key={tag}>{tag}</em>)}
        </span>
      </span>
    </button>
  );
}

export { MODE_META };
