export type Allergy = "peanut" | "lactose" | "egg" | "dust";

export const allergyLabels: Record<Allergy, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  egg: "HUEVO",
  dust: "POLVO",
};

export const allergyColors: Record<Allergy, { bg: string; fg: string }> = {
  peanut: { bg: "#FBD8CC", fg: "#D9684A" },
  lactose: { bg: "#FBD8CC", fg: "#D9684A" },
  egg: { bg: "#FDEBC8", fg: "#B07C1E" },
  dust: { bg: "#DCE9F5", fg: "#3E6E9B" },
};

export type ParentStatus = "active" | "pending";

export type ParentRelation = "mother" | "father" | "tutor";

export type ChildParent = {
  id: string;
  name: string;
  relation: ParentRelation;
  status: ParentStatus;
};

const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 5): string {
  return Array.from(
    { length },
    () => INVITE_CODE_ALPHABET[Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)],
  ).join("");
}

export type Child = {
  id: string;
  name: string;
  initial: string;
  ageYears: number;
  birthDate: string;
  room: string;
  joined: string;
  avatar: { bg: string; fg: string };
  allergies: Allergy[];
  allergyNotes?: string;
  parents: ChildParent[];
};

export const children: Child[] = [
  {
    id: "mateo-fernandez",
    name: "Mateo Fernández",
    initial: "M",
    ageYears: 3,
    birthDate: "12 mar 2022",
    room: "Soles",
    joined: "feb 2025",
    avatar: { bg: "#A9D9E8", fg: "#1F7A93" },
    allergies: ["peanut"],
    allergyNotes:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    parents: [
      {
        id: "lucia-fernandez",
        name: "Lucía Fernández",
        relation: "mother",
        status: "active",
      },
      {
        id: "diego-fernandez",
        name: "Diego Fernández",
        relation: "father",
        status: "pending",
      },
    ],
  },
  {
    id: "sofia-mendez",
    name: "Sofía Méndez",
    initial: "S",
    ageYears: 2,
    birthDate: "5 ago 2023",
    room: "Soles",
    joined: "mar 2025",
    avatar: { bg: "#F4B8CC", fg: "#C44A7A" },
    allergies: [],
    parents: [
      {
        id: "carolina-mendez",
        name: "Carolina Méndez",
        relation: "mother",
        status: "active",
      },
    ],
  },
  {
    id: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    initial: "B",
    ageYears: 3,
    birthDate: "21 sep 2022",
    room: "Soles",
    joined: "abr 2025",
    avatar: { bg: "#B9DEC4", fg: "#3E8B62" },
    allergies: [],
    parents: [
      {
        id: "marcela-ruiz",
        name: "Marcela Ruiz",
        relation: "mother",
        status: "active",
      },
      {
        id: "andres-ruiz",
        name: "Andrés Ruiz",
        relation: "father",
        status: "active",
      },
    ],
  },
  {
    id: "valentina-soto",
    name: "Valentina Soto",
    initial: "V",
    ageYears: 2,
    birthDate: "14 ene 2024",
    room: "Soles",
    joined: "may 2025",
    avatar: { bg: "#F4DC8E", fg: "#9A7B1E" },
    allergies: [],
    parents: [],
  },
  {
    id: "tomas-diaz",
    name: "Tomás Díaz",
    initial: "T",
    ageYears: 3,
    birthDate: "3 jun 2022",
    room: "Soles",
    joined: "sep 2024",
    avatar: { bg: "#C9B6E8", fg: "#7B5FC0" },
    allergies: ["lactose"],
    allergyNotes:
      "Intolerancia a la lactosa. Ofrecer leche y yogur sin lactosa; revisar etiquetas de los snacks.",
    parents: [
      {
        id: "romina-diaz",
        name: "Romina Díaz",
        relation: "mother",
        status: "active",
      },
    ],
  },
  {
    id: "emma-castro",
    name: "Emma Castro",
    initial: "E",
    ageYears: 2,
    birthDate: "28 nov 2023",
    room: "Soles",
    joined: "feb 2025",
    avatar: { bg: "#F4B8CC", fg: "#C44A7A" },
    allergies: [],
    parents: [
      {
        id: "paulina-castro",
        name: "Paulina Castro",
        relation: "mother",
        status: "active",
      },
    ],
  },
  {
    id: "lucas-romero",
    name: "Lucas Romero",
    initial: "L",
    ageYears: 3,
    birthDate: "9 abr 2022",
    room: "Soles",
    joined: "ago 2024",
    avatar: { bg: "#A9D9E8", fg: "#1F7A93" },
    allergies: [],
    parents: [
      {
        id: "facundo-romero",
        name: "Facundo Romero",
        relation: "father",
        status: "active",
      },
    ],
  },
  {
    id: "olivia-vega",
    name: "Olivia Vega",
    initial: "O",
    ageYears: 2,
    birthDate: "17 jul 2023",
    room: "Soles",
    joined: "ene 2025",
    avatar: { bg: "#B9DEC4", fg: "#3E8B62" },
    allergies: [],
    parents: [
      {
        id: "marina-vega",
        name: "Marina Vega",
        relation: "mother",
        status: "active",
      },
    ],
  },
];

export function getChild(id: string): Child | undefined {
  return children.find((child) => child.id === id);
}
