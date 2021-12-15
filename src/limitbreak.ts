import { on, printConsole, Actor, Game, Debug } from "skyrimPlatform";

export let main = () => {
  printConsole("Hello fuckkkkers");

  on("update", () => {
    const character = Game.getPlayer();
  });
};
