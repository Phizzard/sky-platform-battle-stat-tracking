import { on, printConsole, Game, Debug, ObjectReference, Actor, Utility } from "skyrimPlatform";
import { battleStore, initBattleStore, setBattleStoreStats, setBattleStoreRoot, BattleStoreStatKeys, setEnemy } from "./battleStore";

export let main = () => {
  printConsole("Battle Stats Loaded!");
  let battleStartDate: number | undefined;
  initBattleStore();

  const notifyStats = () => {
    let player = Game.getPlayer();

    if (!player) {
      return;
    }

    let message = !player.isDead() ? "Smokin Sick Style!\n\n" : "The Battle was lost\n\n";

    Object.keys(battleStore.stats).forEach((key) => {
      message = `${message} ${key}: ${battleStore.stats[key as BattleStoreStatKeys]}\n`;
    });

    const difficultyRank = calculateDifficultyRank();
    let difficultyRankLabel = `Difficulty:`;

    if (difficultyRank > player.getLevel()) {
      difficultyRankLabel = `${difficultyRankLabel} Very Hard`;
    } else if (difficultyRank > player.getLevel() * 0.75) {
      difficultyRankLabel = `${difficultyRankLabel} Hard`;
    } else if (difficultyRank > player.getLevel() * 0.5) {
      difficultyRankLabel = `${difficultyRankLabel} Normal`;
    } else if (difficultyRank > player.getLevel() * 0.25) {
      difficultyRankLabel = `${difficultyRankLabel} Easy`;
    } else {
      difficultyRankLabel = `${difficultyRankLabel} Very Easy`;
    }

    message = `${message}\n ${difficultyRankLabel} (${difficultyRank})`;

    // Pretty much a debug list of enemies for me
    /*if (battleStore.enemies.size > 0) {
      const prefix = `RIP:`;
      let enemyList = "";
      battleStore.enemies.forEach((enemy) => {
        enemyList = `${enemyList} ${enemy.name}(${enemy.level}),`;
      });

      message = `${message} \n\n ${prefix} ${enemyList}`;
    }*/

    Debug.messageBox(message);
  };

  const calculateDifficultyRank = () => {
    let player = Game.getPlayer() as Actor;

    if (!player) {
      return 0;
    }

    if (battleStore?.enemies?.size <= 0) {
      return 0;
    }

    let rankValue = 0;

    battleStore.enemies.forEach((enemy) => {
      let playLevelFactor = Math.floor(player.getLevel() * 0.2);
      let enemyRank = enemy.level + Math.floor(battleStore.enemies.size * 0.34) - player.getLevel() + playLevelFactor;

      if (enemyRank < -10) {
        return;
      }

      rankValue = rankValue + enemyRank;
    });

    return rankValue;
  };

  on("combatState", async (combatEvent) => {
    printConsole(`combat state change: ${combatEvent.actor.getDisplayName()}`);
    let player = Game.getPlayer();

    if (!player) {
      return;
    }

    if (player.isInCombat()) {
      if (!battleStore.isInCombat) {
        Debug.notification("We are in combat!");
        battleStartDate = Date.now();
        setBattleStoreRoot({ isInCombat: true });
      }

      if (combatEvent.target?.getFormID() === player.getFormID()) {
        const enemyActor = Actor.from(combatEvent.actor);

        if (!enemyActor) {
          return;
        }

        if (battleStore.enemies.has(enemyActor.getFormID())) {
          return;
        }

        battleStore.enemies.set(enemyActor?.getFormID(), { name: enemyActor.getDisplayName(), level: enemyActor.getLevel() });
        //printConsole(battleStore.enemies.get(enemyActor?.getFormID()));
      }
    } else {
      if (!battleStore.isInCombat) {
        // This internal isInCombat is to check is we ever were in combat in the first place
        return;
      }

      const secondsInCombat = battleStartDate && Math.floor((Date.now() - battleStartDate) / 1000);
      setBattleStoreStats({ [BattleStoreStatKeys.timeInBattle]: `${secondsInCombat} Seconds` });
      setBattleStoreRoot({ isInCombat: false });
      await Utility.wait(2);

      Debug.notification("Combat has Ended");
      notifyStats();
      initBattleStore();
    }
  });

  on("deathStart", (deathEvent) => {
    let player = Game.getPlayer();

    if (!player) {
      return;
    }

    const killer = Actor.from(deathEvent.actorKiller);
    const dying = Actor.from(deathEvent.actorDying);

    printConsole(`${dying?.getDisplayName()} was killed by ${killer?.getDisplayName()}`);

    if (killer?.getDisplayName() === player.getDisplayName() || killer?.isPlayerTeammate()) {
      Debug.notification(`${dying?.getDisplayName()} was killed by ${killer?.getDisplayName()}`);
      setBattleStoreStats({
        [BattleStoreStatKeys.enemiesDefeated]: battleStore.stats[BattleStoreStatKeys.enemiesDefeated] + 1,
      });
    }
  });

  on("hit", (hitEvent) => {
    if (!Game.getPlayer()?.isInCombat()) {
      return;
    }

    const player = Game.getPlayer();
    const playerRef = ObjectReference.from(player);

    if (!playerRef || !player || !hitEvent.aggressor) {
      return;
    }

    const didPlayerHitLand = hitEvent.aggressor.getFormID() === playerRef.getFormID();
    const targetActor = Actor.from(hitEvent.target);

    if (!targetActor) {
      return;
    }

    if (didPlayerHitLand && !targetActor.isDead()) {
      printConsole(`${player?.getDisplayName()} landed hit on ${targetActor.getDisplayName()} - ${targetActor.getFormID()}`);
      if (!battleStore.enemies.has(targetActor.getFormID())) {
        return;
      }

      if (!battleStore.enemies.get(targetActor.getFormID())?.lastValidHitTime) {
        setEnemy(targetActor.getFormID(), { lastValidHitTime: Date.now() });
      } else {
        //@ts-ignore
        if (battleStore.enemies.get(targetActor.getFormID()).lastValidHitTime + 500 > Date.now()) {
          return;
        } else {
          setEnemy(targetActor.getFormID(), { lastValidHitTime: Date.now() });
        }
      }

      setBattleStoreStats({
        [BattleStoreStatKeys.attacksLanded]: battleStore.stats[BattleStoreStatKeys.attacksLanded] + 1,
      });

      printConsole(`total hits so far: ${battleStore.stats[BattleStoreStatKeys.attacksLanded]}`);
    }

    if (targetActor.getFormID() === player.getFormID()) {
      setBattleStoreStats({
        [BattleStoreStatKeys.attacksTaken]: battleStore.stats[BattleStoreStatKeys.attacksTaken] + 1,
      });
    }
  });
};
