import { create } from 'zustand';

export type GameMode = 'idle' | 'exploration' | 'combat' | 'event' | 'puzzle' | 'boss' | 'gameover' | 'victory';

interface PlayerStats {
  hp: number;
  maxHp: number;
  atk: number;
  fe: number;
  xp: number;
  level: number;
}

interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
}

interface DungeonState {
  currentFloor: number;
  totalFloors: number;
  nodesVisited: number;
}

interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'relic';
  bonus?: Partial<PlayerStats>;
}

interface Character {
  vocation: 'Desbravador' | 'Líder' | 'Instrutor';
  skin: string;
}

interface GameState {
  mode: GameMode;
  player: PlayerStats;
  character: Character;
  inventory: Item[];
  equipment: {
    weapon: Item | null;
    armor: Item | null;
  };
  enemy: Enemy | null;
  dungeon: DungeonState | null;
  logs: string[];
  
  // Actions
  startGame: (vocation: Character['vocation']) => void;
  setMode: (mode: GameMode) => void;
  addLog: (msg: string) => void;
  updatePlayer: (stats: Partial<PlayerStats>) => void;
  addItem: (item: Item) => void;
  equipItem: (item: Item) => void;
  setEnemy: (enemy: Enemy | null) => void;
  damageEnemy: (amount: number) => void;
  damagePlayer: (amount: number) => void;
  resetGame: () => void;
}

const initialPlayer: PlayerStats = {
  hp: 100,
  maxHp: 100,
  atk: 15,
  fe: 10,
  xp: 0,
  level: 1,
};

export const useGameStore = create<GameState>((set) => ({
  mode: 'idle',
  player: initialPlayer,
  character: { vocation: 'Desbravador', skin: 'hero-1' },
  inventory: [],
  equipment: { weapon: null, armor: null },
  enemy: null,
  dungeon: null,
  logs: ["Benvindo ao Desbrava RPG."],

  startGame: (vocation) => set({ 
    mode: 'exploration', 
    player: { ...initialPlayer },
    character: { vocation, skin: 'hero-1' },
    inventory: [],
    equipment: { weapon: null, armor: null },
    dungeon: { currentFloor: 1, totalFloors: 5, nodesVisited: 0 },
    logs: [`Iniciando jornada como ${vocation}...`],
    enemy: null
  }),

  setMode: (mode) => set({ mode }),
  
  addLog: (msg) => set((state) => ({ logs: [msg, ...state.logs].slice(0, 50) })),
  
  updatePlayer: (stats) => set((state) => ({ 
    player: { ...state.player, ...stats } 
  })),

  addItem: (item) => set((state) => ({ 
    inventory: [...state.inventory, item] 
  })),

  equipItem: (item) => set((state) => {
    const newEquip = { ...state.equipment };
    if (item.type === 'weapon') newEquip.weapon = item;
    if (item.type === 'armor') newEquip.armor = item;
    
    // Apply bonuses
    const bonus = item.bonus || {};
    return { 
      equipment: newEquip,
      player: { 
        ...state.player, 
        atk: state.player.atk + (bonus.atk || 0),
        maxHp: state.player.maxHp + (bonus.maxHp || 0)
      }
    };
  }),

  setEnemy: (enemy) => set({ enemy }),

  damageEnemy: (amount) => set((state) => {
    if (!state.enemy) return state;
    const newHp = Math.max(0, state.enemy.hp - amount);
    return { enemy: { ...state.enemy, hp: newHp } };
  }),

  damagePlayer: (amount) => set((state) => {
    const newHp = Math.max(0, state.player.hp - amount);
    return { player: { ...state.player, hp: newHp } };
  }),

  resetGame: () => set({ 
    mode: 'idle', 
    player: initialPlayer, 
    inventory: [],
    equipment: { weapon: null, armor: null },
    enemy: null, 
    dungeon: null,
    logs: ["Jogo reiniciado."]
  }),
}));
