import axios from "axios";

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL: BASE, withCredentials: true });

// Attach JWT (if signed in) to every request
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("d2_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Destiny rarity palette
export const RARITY = {
  Exotic: { color: "#F6C453", border: "rgba(246,196,83,0.65)", glow: "rgba(246,196,83,0.28)" },
  Legendary: { color: "#B07CFF", border: "rgba(176,124,255,0.6)", glow: "rgba(176,124,255,0.2)" },
  Rare: { color: "#4AA3FF", border: "rgba(74,163,255,0.6)", glow: "rgba(74,163,255,0.2)" },
  Uncommon: { color: "#3FE07A", border: "rgba(63,224,122,0.6)", glow: "rgba(63,224,122,0.2)" },
  Common: { color: "#C9CDD3", border: "rgba(201,205,211,0.55)", glow: "rgba(201,205,211,0.15)" },
  Basic: { color: "#C9CDD3", border: "rgba(201,205,211,0.55)", glow: "rgba(201,205,211,0.15)" },
};

export const ELEMENT = {
  Kinetic: { color: "#D7DCE3", bg: "rgba(215,220,227,0.10)", border: "rgba(215,220,227,0.24)" },
  Arc: { color: "#7FC9FF", bg: "rgba(74,163,255,0.14)", border: "rgba(74,163,255,0.3)" },
  Solar: { color: "#FF9A3D", bg: "rgba(255,154,61,0.14)", border: "rgba(255,154,61,0.3)" },
  Void: { color: "#B07CFF", bg: "rgba(176,124,255,0.14)", border: "rgba(176,124,255,0.3)" },
  Stasis: { color: "#7FE7FF", bg: "rgba(127,231,255,0.14)", border: "rgba(127,231,255,0.3)" },
  Strand: { color: "#3FE07A", bg: "rgba(63,224,122,0.14)", border: "rgba(63,224,122,0.3)" },
};

export function rarityVars(rarity) {
  const r = RARITY[rarity] || RARITY.Legendary;
  return { "--rarity-border": r.border, "--rarity-glow": r.glow };
}

export const TYPE_META = {
  raid: { label: "Raid", color: "#F6C453" },
  dungeon: { label: "Dungeon", color: "#7FE7FF" },
  nightfall: { label: "Nightfall", color: "#FF9A3D" },
  world: { label: "World", color: "#3FE07A" },
  crucible: { label: "Crucible", color: "#FF6B57" },
};
