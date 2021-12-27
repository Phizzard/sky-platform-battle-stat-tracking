export enum BattleStoreStatKeys {
  timeInBattle = "Time In Battle",
  attacksLanded = "Attacks Landed",
  attacksTaken = "Attacks Taken",
  enemiesDefeated = "Enemies Defeated",
}

export interface BattleStoreStats {
  "Time In Battle": string;
  "Attacks Landed": number;
  "Attacks Taken": number;
  "Enemies Defeated": number;
}

export interface Enemy {
  name: string;
  level: number;
  lastValidHitTime?: number;
}

export interface BattleStore {
  isInCombat: boolean;
  enemies: Map<number, Enemy>;
  stats: BattleStoreStats;
}

export let battleStore: BattleStore;

export const initBattleStore = (): BattleStore => {
  battleStore = {
    isInCombat: false,
    enemies: new Map(),
    stats: {
      [BattleStoreStatKeys.timeInBattle]: "",
      [BattleStoreStatKeys.attacksLanded]: 0,
      [BattleStoreStatKeys.attacksTaken]: 0,
      [BattleStoreStatKeys.enemiesDefeated]: 0,
    },
  };

  return battleStore;
};

export const setBattleStoreRoot = (updatedRoot: Partial<BattleStore>) => {
  battleStore = {
    ...battleStore,
    ...updatedRoot,
  };

  return battleStore;
};

export const setBattleStoreStats = (updatedStats: Partial<BattleStoreStats>) => {
  battleStore = {
    ...battleStore,
    stats: {
      ...battleStore.stats,
      ...updatedStats,
    },
  };

  return battleStore;
};

export const setEnemy = (key: number, data: Partial<Enemy>) => {
  const currentEnemy = battleStore.enemies.get(key);

  battleStore.enemies.set(key, { ...(currentEnemy as Enemy), ...data });
};
