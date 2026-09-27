export type PostType = "achievement" | "activity" | "announcement";

export type Post = {
  id: string;
  type: PostType;
  author: {
    name: string;
    initial: string;
    variant: "child" | "announce";
  };
  time: string;
  audience: string;
  body: string;
  photo?: { label: string };
  likes: number;
  comments: number;
};

export const posts: Post[] = [
  {
    id: "post-1",
    type: "achievement",
    author: {
      name: "Mateo",
      initial: "M",
      variant: "child",
    },
    time: "14:20",
    audience: "familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "post-2",
    type: "activity",
    author: {
      name: "Mateo",
      initial: "M",
      variant: "child",
    },
    time: "09:40",
    audience: "familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photo: { label: "pintando con témperas" },
    likes: 5,
    comments: 2,
  },
  {
    id: "post-3",
    type: "announcement",
    author: {
      name: "Anuncio general",
      initial: "",
      variant: "announce",
    },
    time: "07:50",
    audience: "toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];

export const session = {
  user: { name: "Caro Giménez", initial: "C", role: "Maestra" },
  sala: { name: "Sala Soles", childrenCount: 12 },
};
