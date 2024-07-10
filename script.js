var main = function () {
  var game = new Game();

  var pause = false;
  var ADMINCONTROLS = true;
  if (ADMINCONTROLS) {
    window.addEventListener(
      "keydown",
      (event) => {
        if (event.repeat) return;
        switch (event.code) {
          case "KeyP":
            pause = !pause;
            break;
          case "KeyK":
            game.killPlayer();
            break;
          case "KeyL":
            game.incrementLives();
            //console.log(game.lives, game.livesWithoutExtra);
            break;
          case "Digit1":
            game.createAstoriod(1);
            break;
          case "Digit2":
            game.createEnemyShip();
            break;
          case "Digit3":
            game.createEnemySaucer();
            break;
          case "KeyI":
            game.stopcollition = !game.stopcollition;
            break;
          case "KeyO":
            game.stopwave = !game.stopwave;
            break;
          case "KeyN":
            game.NUKEAllEverything();
            break;
          case "KeyJ":
            game.reset(false); // reset  + adds score
            break;
          default:
            break;
        }
      },
      true
    );
  }

  var MenuSection = async function () {
    game.WaveManager();
    game.AddBulletPlayer();
    game.resetObjects();

    game.movePlayer();
    game.moveAstoriods();
    game.moveBullets();
    game.moveShip();
    game.moveSaucer();
    game.moveEffects();

    game.calculatePlayerTransform();
    game.calculateShipTransform();
    game.calculateSaucerTransform();
    game.calculateAstorioidTransforms();
    game.calculateBulletTransform();
    game.calculateEffectTransforms();

    game.reSpawnPlayer();
    game.settings();

    game.Render();

    game.CollitionApply();
    game.Collition();

    game.InfiniteLive();

    while (pause) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (game.changeToGame()) {
      game.reset();
      window.requestAnimationFrame(GameSection);
      return;
    }
    window.requestAnimationFrame(MenuSection);
  };

  var GameSection = async function () {
    game.addText();
    game.addLives();
    game.WaveManager();
    game.AddBulletPlayer();

    game.movePlayer();
    game.moveAstoriods();
    game.moveBullets();
    game.moveShip();
    game.moveSaucer();
    game.moveEffects();

    game.calculatePlayerTransform();
    game.calculateShipTransform();
    game.calculateSaucerTransform();
    game.calculateAstorioidTransforms();
    game.calculateBulletTransform();
    game.calculateEffectTransforms();

    game.reSpawnPlayer();
    game.settings();

    game.Render();

    game.CollitionApply();
    game.Collition();

    game.removeText();

    game.addGameOverScreen();

    while (pause) {
      await new Promise((r) => setTimeout(r, 100));
    }

    window.requestAnimationFrame(GameSection);
  };

  game.startMenu();

  MenuSection();
};
