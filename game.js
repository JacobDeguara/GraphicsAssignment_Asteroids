//--------------------------------------------------------------------------------------------------------//
// Program main entry point
//--------------------------------------------------------------------------------------------------------//
const MAXACC = 1.5;
const MINACC = -1.5;
const MAXANG = 2 * Math.PI;
const MINANG = -2 * Math.PI;

function dotProduct(vector1, vector2) {
  let result = 0;
  for (let i = 0; i < vector1.length; i++) {
    result += vector1[i] * vector2[i];
  }
  return result;
}

function mag(vector1) {
  let result =
    vector1[0] * vector1[0] + vector1[1] * vector1[1] + vector1[2] * vector1[2];

  return Math.sqrt(result);
}

class Game {
  constructor() {
    this.sceneHandler = new SceneHandler();
    this.scene = this.sceneHandler.getScene();
    this.gl = this.sceneHandler.getGL();
    this.materialLoader = new MaterialLoader(this.gl, this.scene);

    this.gameEND = false; // A boolean that dictates when the game has ended
    this.EnemyObjectsList = []; // a list of all enemies (Asteroids, ships, saucers)
    this.TextList = []; // a list of all text (anything that going to be in a specific spot and not moveing, also might change)
    this.EffectsList = []; // a list of visual effects
    this.BulletsList = []; // a list of all bullets

    this.controls = [false, false, false]; // controls related to the =  ^, <-, ->
    this.playerDied = false; // dicates when the player has died
    this.teleport = false; // dictates when the player whats to teleport
    this.teleportCooldown = 0; // a player teleport cooldown
    this.lives = 0; // the players lives
    this.bullets = 0; // the players bullets
    this.score = 0; // the players current score
    this.livesWithoutExtra = this.lives; // the players lives but it doesnt add the Extra lives at 10k

    this.mode = false; // dictates when the mode whats to be changed
    this.modeChanged = false; // dictates when the mode has been changed

    // game Bounds
    this.MaxX = 52;
    this.MinX = -52;
    this.MaxY = 27;
    this.MinY = -27;

    this.time = 0; // current time (every 100 = 1)
    this.previousTime = -1; // previous time = time but before it gets += 1
    this.wave = 0; // current wave
    this.waveCount = 20; //  amount of Time needed to be taken before wave gets +=1
    this.genCount = 0; //  This is a counter that dictates how many objects needs to be spawned per sec

    this.stopwave = false; // this is a setting to stop the wave from changeing
    this.stopcollition = false; // this is a setting to stop the collition from happening

    this.playerObject = this.getPlayer(); // The player

    this.menuScreen = null; // The object that holds the menu (can be used to know when the player is in the menu section)
    this.stopShootingEnemy = false; // Setting to stopo the enemy from shooting
    this.Changeobject = null; // holds a refrence to the change mode object asteroid
    this.Startobject = null; // holds a refrence to the start game object asteroid

    this.startGame = false; // dictates when the game as started

    this.scoresList = [29000]; // the list of scores

    // Event Listener for player input
    {
      // event Listen KEY DOWN (player is holding an elemenet)
      window.addEventListener(
        "keydown",
        (event) => {
          if (event.repeat) return;
          switch (event.code) {
            case "KeyM":
              this.mode = !this.mode;
              break;
            case "Space":
              if (this.playerDied == false) {
                this.bullets += 1;
              }
              break;
            case "ArrowUp":
            case "KeyW":
              //console.log("ArrowUp DOWN");
              this.controls[0] = true;
              this.setaddFire(this.playerObject);
              //console.log(this.controls);
              break;
            case "ArrowLeft":
            case "KeyA":
              //console.log("ArrowLeft DOWN");
              this.controls[1] = true;
              //console.log(this.controls);
              break;
            case "ArrowRight":
            case "KeyD":
              //console.log("ArrowRight DOWN");
              this.controls[2] = true;
              //console.log(this.controls);
              break;
            case "ShiftRight":
            case "ShiftLeft":
              this.teleport = true;
              break;
            case "KeyR":
              if (this.menuScreen == null) {
                this.reset(true);
              }
              break;
            case "Comma":
              if (this.gameEND == true) {
              }
              break;
            case "Period":
              if (this.gameEND == true) {
              }
              break;
            default:
              break;
          }
        },
        true
      );

      window.addEventListener(
        "keyup",
        (event) => {
          if (event.repeat) return;
          switch (event.code) {
            case "ArrowUp":
            case "KeyW":
              //console.log("ArrowUp UP");
              this.controls[0] = false;
              //console.log(this.controls);
              break;
            case "ArrowLeft":
            case "KeyA":
              //console.log("ArrowLeft UP");
              this.controls[1] = false;
              //console.log(this.controls);
              break;
            case "ArrowRight":
            case "KeyD":
              //console.log("ArrowRight UP");
              this.controls[2] = false;
              //console.log(this.controls);
              break;
            default:
              break;
          }
        },
        true
      );
    }
  }

  Render() {
    if (this.playerDied == false || this.gameEND == true) {
      this.time += 1;
    }

    //console.log(this.time);
    //console.log(this.playerObject.Position);
    this.sceneHandler.Render();
  }

  // -----------  PLAYER SECTION -----------

  getPlayer() {
    const playerObject = this.sceneHandler.AddObjectM(
      makeSafty(makeShip),
      this.materialLoader.MaterialShip(),
      this.materialLoader.MaterialBlack(),
      SceneHandler.TYPE.PLAYER,
      "player"
    );

    this.setaddImmunityShield(playerObject, 3);

    return playerObject;
  }

  getDUMMY() {
    const dummyplayerObject = this.sceneHandler.AddObjectM(
      makeSafty(makeNothing),
      this.materialLoader.MaterialShip(),
      this.materialLoader.MaterialBlack(),
      SceneHandler.TYPE.DUMMYPLAYER,
      "DUMMYplayer"
    );

    return dummyplayerObject;
  }

  reSpawnPlayer() {
    if (
      this.playerDied == true &&
      (this.controls[0] == true ||
        this.controls[1] == true ||
        this.controls[2] == true) &&
      this.gameEND == false
    ) {
      this.sceneHandler.removeObject(this.playerObject);
      this.playerObject = this.getPlayer();
      this.setaddFire(this.playerObject);
      this.playerDied = false;
    }
  }

  killPlayer() {
    this.playerDied = true;
    this.decrementLives();

    this.setaddScrap(this.playerObject, this.materialLoader.MaterialShip());
    this.setaddScrap(this.playerObject, this.materialLoader.MaterialShip());
    this.setaddScrap(this.playerObject, this.materialLoader.MaterialShip());
    this.setaddScrap(this.playerObject, this.materialLoader.MaterialShip());

    this.sceneHandler.removeObject(this.playerObject);
    this.playerObject = this.getDUMMY();
    if (this.lives <= 0) {
      this.gameEND = true;
      this.scoresList.push(this.score);
    }
  }

  decrementLives() {
    this.lives -= 1;
    this.livesWithoutExtra -= 1;
  }

  incrementLives() {
    this.lives += 1;
    this.livesWithoutExtra += 1;
  }

  // -----------  TEXT SECTION -----------
  addLives() {
    let starting_Position = [-19, 7.8, 10];
    let jump = 1.2;

    let scoretolives = Math.floor(this.score / 10000);
    // check for increase of lives needed
    if (scoretolives + this.livesWithoutExtra > this.lives) {
      this.lives += 1;
    }

    for (let x = 0; x < this.lives; x++) {
      const object = this.sceneHandler.AddObjectM(
        makeSafty(makeShip),
        this.materialLoader.MaterialBullet(),
        this.materialLoader.MaterialBlack(),
        SceneHandler.TYPE.PLAYER,
        "player"
      );

      var Mat4x4 = matrixHelper.matrix4;
      var TranslationTransfrom = Mat4x4.create();
      var Identity = Mat4x4.create();

      Mat4x4.makeIdentity(Identity);
      Mat4x4.makeTranslation(TranslationTransfrom, starting_Position);

      Mat4x4.multiply(object.Model.transform, TranslationTransfrom, Identity);
      Mat4x4.multiply(object.Model2.transform, TranslationTransfrom, Identity);
      Mat4x4.multiply(object.Light.transform, TranslationTransfrom, Identity);

      starting_Position[0] += jump;
      this.TextList.push(object);
    }
  }

  addText() {
    this.addScore();
    this.addTime();
  }

  addScore() {
    var starting_Position = [-15, 9, 10];
    var jump = 1.1;

    // Addding the SCORE text to screen
    const object = this.sceneHandler.AddObject(
      makeSafty(makeScoreText),
      this.materialLoader.MaterialGrey(),
      SceneHandler.TYPE.TEXT,
      "SCORETEXT"
    );

    // moveing score text in the right positon (top left)
    var Mat4x4 = matrixHelper.matrix4;
    var TranslationTransfrom = Mat4x4.create();
    var Identity = Mat4x4.create();

    Mat4x4.makeIdentity(Identity);
    Mat4x4.makeTranslation(TranslationTransfrom, starting_Position);

    Mat4x4.multiply(object.Model.transform, TranslationTransfrom, Identity);
    Mat4x4.multiply(object.Light.transform, TranslationTransfrom, Identity);

    this.TextList.push(object);
    starting_Position[0] += jump - 0.2;

    const object2 = this.sceneHandler.AddObject(
      makeSafty(makeColonText),
      this.materialLoader.MaterialGrey(),
      SceneHandler.TYPE.TEXT,
      "COLONTEXT"
    );

    // moveing score text in the right positon (top left)
    var Mat4x4 = matrixHelper.matrix4;
    var TranslationTransfrom = Mat4x4.create();
    var Identity = Mat4x4.create();

    Mat4x4.makeIdentity(Identity);
    Mat4x4.makeTranslation(TranslationTransfrom, starting_Position);

    Mat4x4.multiply(object2.Model.transform, TranslationTransfrom, Identity);
    Mat4x4.multiply(object2.Light.transform, TranslationTransfrom, Identity);

    this.TextList.push(object2);
    starting_Position[0] += jump - 0.3;

    let scoreList = this.score.toString().split("");

    for (let index = 0; index < scoreList.length; index++) {
      const element = scoreList[index];
      const object = this.sceneHandler.AddObject(
        makeNumber(element),
        this.materialLoader.MaterialGrey(),
        SceneHandler.TYPE.TEXT,
        "TEXT"
      );

      var Mat4x4 = matrixHelper.matrix4;
      var TranslationTransfrom = Mat4x4.create();
      var Identity = Mat4x4.create();

      Mat4x4.makeIdentity(Identity);
      Mat4x4.makeTranslation(TranslationTransfrom, starting_Position);

      Mat4x4.multiply(object.Model.transform, TranslationTransfrom, Identity);
      Mat4x4.multiply(object.Light.transform, TranslationTransfrom, Identity);

      this.TextList.push(object);

      starting_Position[0] += jump;
    }
  }

  addGameOverScreen() {
    if (this.gameEND == true) {
      //console.log("Printing Gameover");
      var starting_Position = [0, 3, 3];

      // Game Over Text
      {
        const GameOverTextObject = this.sceneHandler.AddObject(
          makeGameOverText(),
          this.materialLoader.MaterialBullet(),
          SceneHandler.TYPE.TEXT,
          "GAMEOVERTEXT"
        );

        // Moves the Game Over text in the
        {
          var Mat4x4 = matrixHelper.matrix4;
          var TranslationTransfrom = Mat4x4.create();
          var ScalingTransform = Mat4x4.create();
          var Identity = Mat4x4.create();

          Mat4x4.makeIdentity(Identity);
          Mat4x4.makeTranslation(TranslationTransfrom, starting_Position);
          Mat4x4.makeScaling(ScalingTransform, [4, 4, 4]);

          Mat4x4.multiply(
            GameOverTextObject.Model.transform,
            ScalingTransform,
            Identity
          );
          Mat4x4.multiply(
            GameOverTextObject.Model.transform,
            TranslationTransfrom,
            GameOverTextObject.Model.transform
          );
          Mat4x4.multiply(
            GameOverTextObject.Light.transform,
            TranslationTransfrom,
            Identity
          );
        }

        this.TextList.push(GameOverTextObject);
      }

      //sort list
      this.scoresList.sort(function (a, b) {
        return b - a;
      });

      var x = 0; // left and right
      var y = 2.5; // up and down
      var xJump = 1.5;
      var yjump = -3;
      for (
        let index = 0;
        index < this.scoresList.length && index < 3;
        index++
      ) {
        var currentscore = this.scoresList[index];
        let currentscoreList = currentscore.toString().split("");
        x = -3;

        // index text
        const indexText = this.sceneHandler.AddObject(
          makeNumber((index + 1).toString()),
          this.materialLoader.MaterialBullet(),
          SceneHandler.TYPE.TEXT,
          "TEXT"
        );

        this.TextList.push(indexText);

        // Moves the index text in the
        {
          var Mat4x4 = matrixHelper.matrix4;
          var TranslationTransfrom = Mat4x4.create();
          var ScalingTransform = Mat4x4.create();
          var Identity = Mat4x4.create();

          Mat4x4.makeIdentity(Identity);
          Mat4x4.makeTranslation(TranslationTransfrom, [x - 2, y, 3]);
          Mat4x4.makeScaling(ScalingTransform, [2, 2, 2]);

          Mat4x4.multiply(
            indexText.Model.transform,
            ScalingTransform,
            Identity
          );
          Mat4x4.multiply(
            indexText.Model.transform,
            TranslationTransfrom,
            indexText.Model.transform
          );
          Mat4x4.multiply(
            indexText.Light.transform,
            TranslationTransfrom,
            Identity
          );
        }

        // colon text
        const colonText = this.sceneHandler.AddObject(
          makeColonText(),
          this.materialLoader.MaterialBullet(),
          SceneHandler.TYPE.TEXT,
          "TEXT"
        );

        this.TextList.push(colonText);

        // Moves the colon text in the
        {
          var Mat4x4 = matrixHelper.matrix4;
          var TranslationTransfrom = Mat4x4.create();
          var ScalingTransform = Mat4x4.create();
          var Identity = Mat4x4.create();

          Mat4x4.makeIdentity(Identity);
          Mat4x4.makeTranslation(TranslationTransfrom, [x - 0.9, y, 3]);
          Mat4x4.makeScaling(ScalingTransform, [2, 2, 2]);

          Mat4x4.multiply(
            colonText.Model.transform,
            ScalingTransform,
            Identity
          );
          Mat4x4.multiply(
            colonText.Model.transform,
            TranslationTransfrom,
            colonText.Model.transform
          );
          Mat4x4.multiply(
            colonText.Light.transform,
            TranslationTransfrom,
            Identity
          );
        }
        x += 0.2;

        for (let index = 0; index < currentscoreList.length; index++) {
          let number = currentscoreList[index];
          const objectText = this.sceneHandler.AddObject(
            makeNumber(number),
            this.materialLoader.MaterialBullet(),
            SceneHandler.TYPE.TEXT,
            "TEXT"
          );
          this.TextList.push(objectText);

          {
            var Mat4x4 = matrixHelper.matrix4;
            var TranslationTransfrom = Mat4x4.create();
            var ScalingTransform = Mat4x4.create();
            var Identity = Mat4x4.create();

            Mat4x4.makeIdentity(Identity);
            Mat4x4.makeTranslation(TranslationTransfrom, [x, y, 3]);
            Mat4x4.makeScaling(ScalingTransform, [2, 2, 2]);

            Mat4x4.multiply(
              objectText.Model.transform,
              ScalingTransform,
              Identity
            );
            Mat4x4.multiply(
              objectText.Model.transform,
              TranslationTransfrom,
              objectText.Model.transform
            );
            Mat4x4.multiply(
              objectText.Light.transform,
              TranslationTransfrom,
              Identity
            );
          }

          x += xJump;
        }
        y += yjump;
      }
    }
  }

  addTime() {
    // 43 , 21
    let flooredTime = Math.floor(this.time / 100);
    let flooredTimeString = flooredTime.toString();
    let timeStringList = flooredTimeString.split("").reverse();
    var starting_Position = [19, 9, 10];
    var jump = -1.1;

    for (let index = 0; index < timeStringList.length; index++) {
      const element = timeStringList[index];
      const object = this.sceneHandler.AddObject(
        makeNumber(element),
        this.materialLoader.MaterialGrey(),
        SceneHandler.TYPE.TEXT,
        "TEXT"
      );

      // move it
      var Mat4x4 = matrixHelper.matrix4;
      var TranslationTransfrom = Mat4x4.create();
      var Identity = Mat4x4.create();

      Mat4x4.makeIdentity(Identity);
      Mat4x4.makeTranslation(TranslationTransfrom, starting_Position);

      Mat4x4.multiply(object.Model.transform, TranslationTransfrom, Identity);
      Mat4x4.multiply(object.Light.transform, TranslationTransfrom, Identity);

      this.TextList.push(object);

      starting_Position[0] += jump;
    }
  }

  removeText() {
    while (this.TextList.length) {
      const element = this.TextList.pop();
      this.sceneHandler.removeObject(element);
    }
  }

  // -----------  MOVEMENT SECTION -----------
  calcluateDeceleration(num) {
    return -(Math.sin(num / 2) / 35);
  }

  DecreseAcc() {
    // this should converge to 0
    var dec0 = this.calcluateDeceleration(this.playerObject.Acceleration[0]);
    var dec1 = this.calcluateDeceleration(this.playerObject.Acceleration[1]);

    this.playerObject.Acceleration[0] += dec0;
    this.playerObject.Acceleration[1] += dec1;

    if (
      this.playerObject.Acceleration[0] <= 0.00001 &&
      this.playerObject.Acceleration[0] >= -0.00001
    ) {
      this.playerObject.Acceleration[0] = 0;
    }
    if (
      this.playerObject.Acceleration[1] <= 0.00001 &&
      this.playerObject.Acceleration[1] >= -0.00001
    ) {
      this.playerObject.Acceleration[1] = 0;
    }
  }

  IncAcc(num, ang) {
    this.playerObject.Acceleration[0] += num * Math.sin(ang);
    this.playerObject.Acceleration[1] += num * Math.cos(ang);

    if (this.playerObject.Acceleration[0] > MAXACC) {
      this.playerObject.Acceleration[0] = MAXACC;
    }
    if (this.playerObject.Acceleration[0] < MINACC) {
      this.playerObject.Acceleration[0] = MINACC;
    }

    if (this.playerObject.Acceleration[1] > MAXACC) {
      this.playerObject.Acceleration[1] = MAXACC;
    }
    if (this.playerObject.Acceleration[1] < MINACC) {
      this.playerObject.Acceleration[1] = MINACC;
    }
  }

  addToAng(num) {
    // fix this
    this.playerObject.Angle[0] += num;
    if (this.playerObject.Angle[0] > MAXANG) {
      this.playerObject.Angle[0] = 0;
    }
    if (this.playerObject.Angle[0] < MINANG) {
      this.playerObject.Angle[0] = 0;
    }
  }

  movePlayer() {
    var ang = -this.playerObject.Angle[0];
    this.DecreseAcc();
    if (this.controls[0] == true) {
      this.IncAcc(0.005, ang);
    }
    if (this.controls[1] == true) {
      this.addToAng(0.04);
    }
    if (this.controls[2] == true) {
      this.addToAng(-0.04);
    }
    //this.playerObject.Vector[0] = Math.sin(this.playerObject.Angle);
    //this.playerObject.Vector[1] = Math.cos(this.playerObject.Angle);
    for (let index = 0; index < this.playerObject.Position.length; index++) {
      this.playerObject.Position[index] +=
        this.playerObject.Acceleration[index];
      // the players position is equivelate to the players current position + the vector scaled based on the Acceleration
    }
    //console.log(this.playerObject.Acceleration);
    //console.log(this.playerObject.Position);
    //console.log(this.playerObject.Angle);
    //console.log("v2= ", Math.sin(ang), Math.cos(ang));

    this.teleportPlayer();

    if (this.playerObject.Position[0] > this.MaxX) {
      this.playerObject.Position[0] = this.MinX + 0.5;
    }
    if (this.playerObject.Position[0] < this.MinX) {
      this.playerObject.Position[0] = this.MaxX - 0.5;
    }
    if (this.playerObject.Position[1] > this.MaxY) {
      this.playerObject.Position[1] = this.MinY + 0.5;
    }
    if (this.playerObject.Position[1] < this.MinY) {
      this.playerObject.Position[1] = this.MaxY - 0.5;
    }
  }

  calculatePlayerTransform() {
    var Mat4x4 = matrixHelper.matrix4;

    var TranslationTransfrom = Mat4x4.create();
    var RotationTransform = Mat4x4.create();
    var Identity = Mat4x4.create();
    Mat4x4.makeIdentity(Identity);
    //Mat4x4.makeIdentity(RotationTransform);

    Mat4x4.makeRotationZ(RotationTransform, this.playerObject.Angle[0]);
    Mat4x4.makeTranslation(TranslationTransfrom, this.playerObject.Position);

    //Model
    Mat4x4.multiply(
      this.playerObject.Model.transform,
      RotationTransform,
      Identity
    );

    Mat4x4.multiply(
      this.playerObject.Model.transform,
      TranslationTransfrom,
      this.playerObject.Model.transform
    );

    //Model2
    Mat4x4.multiply(
      this.playerObject.Model2.transform,
      RotationTransform,
      Identity
    );

    Mat4x4.multiply(
      this.playerObject.Model2.transform,
      TranslationTransfrom,
      this.playerObject.Model2.transform
    );

    //Mat4x4.multiply(this.playerObject.Light.transform,TranslationTransfrom,Identity);
  }

  teleportPlayer() {
    if (this.teleport == true && this.teleportCooldown == 0) {
      function randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      this.playerObject.Position[0] = randomInteger(
        this.MaxX - 2,
        this.MinX + 2
      );
      this.playerObject.Position[1] = randomInteger(
        this.MaxY - 2,
        this.MinY + 2
      );

      this.setaddImmunityShield(this.playerObject, 3);
      this.teleport = false;
      this.teleportCooldown = 10;
    }
  }

  // -----------  WAVE GENERATION SECTION -----------
  CheckAstorioidsOnly(astoriod) {
    return (
      astoriod.Type != SceneHandler.TYPE.ASTORIOIDLARGE &&
      astoriod.Type != SceneHandler.TYPE.ASTORIOIDMEDIUM &&
      astoriod.Type != SceneHandler.TYPE.ASTORIOIDSMALL &&
      astoriod.Type != SceneHandler.TYPE.GOJO &&
      astoriod.Type != SceneHandler.TYPE.STARTGAMEASTORIOID &&
      astoriod.Type != SceneHandler.TYPE.CHANGEMODEASTORIOID
    );
  }

  createAstoriod(amount) {
    for (let i = 0; i < amount; i++) {
      // OBJECT
      let rand = Math.random();
      var shape;
      var type = SceneHandler.TYPE.ASTORIOIDSMALL;
      var object;
      if (rand > 0.99) {
        var object = this.sceneHandler.AddObjectM(
          makeSafty(makeGojoCube),
          this.materialLoader.MaterialGojo(),
          this.materialLoader.MaterialBlack(),
          SceneHandler.TYPE.GOJO,
          "GOJO_CUBE"
        );
      } else {
        if (rand > 0.85) {
          shape = makeSafty(makeLargeAstoriod);
          type = SceneHandler.TYPE.ASTORIOIDLARGE;
        } else if (rand > 0.75) {
          shape = makeSafty(makeMediumAstoriod);
          type = SceneHandler.TYPE.ASTORIOIDMEDIUM;
        } else {
          shape = makeSafty(makeSmallAstoriod);
          type = SceneHandler.TYPE.ASTORIOIDSMALL;
        }
        var object = this.sceneHandler.AddObjectM(
          shape,
          this.materialLoader.MaterialAstoriod(),
          this.materialLoader.MaterialBlack(),
          type,
          "Astoriod"
        );
      }

      // STARTING POSITION
      // Get starting random starting position of astoriod
      var XorY = Math.floor(Math.random() * 2);
      if (XorY) {
        var XorY = Math.floor(Math.random() * 2);
        if (XorY) {
          object.Position[0] = this.MaxX;
        } else {
          object.Position[0] = this.MinX;
        }
        object.Position[1] =
          Math.random() * (this.MaxY - this.MinY) + this.MinY;
      } else {
        var XorY = Math.floor(Math.random() * 2);

        if (XorY) {
          object.Position[1] = this.MaxY;
        } else {
          object.Position[1] = this.MinY;
        }
        object.Position[0] =
          Math.random() * (this.MaxX - this.MinX) + this.MinX;
      }

      // DIRECTION
      // get angle directed to the middle
      var middleang =
        Math.atan2(0, 0) -
        Math.atan2(object.Position[1], object.Position[0]) -
        Math.PI / 2;
      // add randomness
      var ang = middleang + (Math.random() * Math.PI) / 3 - Math.PI / 3;
      var AccelerationStrength = Math.random() / 25 + 0.08;

      object.Acceleration[0] = AccelerationStrength * Math.sin(ang);
      object.Acceleration[1] = AccelerationStrength * Math.cos(ang);

      //ROTATION

      object.Rotation[0] = Math.random() / 50;
      object.Rotation[1] = Math.random() / 50;
      object.Rotation[2] = Math.random() / 50;

      this.EnemyObjectsList.push(object);
    }
  }

  createAstoriodSPECIFIC(type, pos, ang) {
    // pos = [0,0,0], direction = [0,0,0]
    //console.log("CREATED OBJECT!?");

    // OBJECT
    var shape;
    var type = SceneHandler.TYPE.ASTORIOIDSMALL;
    switch (type) {
      case SceneHandler.TYPE.ASTORIOIDMEDIUM:
        shape = makeSafty(makeMediumAstoriod);
        break;
      case SceneHandler.TYPE.ASTORIOIDSMALL:
        shape = makeSafty(makeSmallAstoriod);
        break;
      default:
        break;
    }
    const object = this.sceneHandler.AddObjectM(
      shape,
      this.materialLoader.MaterialAstoriod(),
      this.materialLoader.MaterialBlack(),
      type,
      "ASTORIOD"
    );

    object.Position[0] = pos[0];
    object.Position[1] = pos[1];
    object.Position[2] = pos[2];

    // DIRECTION
    // get angle directed to the middle
    // add randomness
    var AccelerationStrength = Math.random() / 25 + 0.08;

    object.Acceleration[0] = AccelerationStrength * Math.sin(ang);
    object.Acceleration[1] = AccelerationStrength * Math.cos(ang);

    //ROTATION

    object.Rotation[0] = Math.random() / 50;
    object.Rotation[1] = Math.random() / 50;
    object.Rotation[2] = Math.random() / 50;

    object.Immunity = 1;

    this.EnemyObjectsList.push(object);
    return object;
  }

  createEnemyShip() {
    const object = this.sceneHandler.AddObjectM(
      makeSafty(makeEnemyShip),
      this.materialLoader.MaterialEnemyShip(),
      this.materialLoader.MaterialBlack(),
      SceneHandler.TYPE.ENEMYSHIP,
      "SHIP"
    );

    object.Timer = Math.floor(this.time / 100);

    // STARTING POSITION
    // Get starting random starting position
    var XorY = Math.floor(Math.random() * 2);
    if (XorY) {
      var XorY = Math.floor(Math.random() * 2);
      if (XorY) {
        object.Position[0] = this.MaxX;
        object.Acceleration[0] = 1;
        object.Acceleration[1] = 0;
      } else {
        object.Position[0] = this.MinX;
        object.Acceleration[0] = -1;
        object.Acceleration[1] = 0;
      }
      object.Position[1] =
        Math.random() * (this.MaxY - 5 - this.MinY) + this.MinY + 5;
    } else {
      var XorY = Math.floor(Math.random() * 2);

      if (XorY) {
        object.Position[1] = this.MaxY;
        object.Acceleration[0] = 0;
        object.Acceleration[1] = 1;
      } else {
        object.Position[1] = this.MinY;
        object.Acceleration[0] = 0;
        object.Acceleration[1] = -1;
      }
      object.Position[0] =
        Math.random() * (this.MaxX - 5 - this.MinX) + this.MinX + 5;
    }

    // DIRECTION
    // get angle directed to the middle
    var middleang =
      Math.atan2(0, 0) -
      Math.atan2(object.Position[1], object.Position[0]) -
      Math.PI / 2;

    // add randomness
    var ang = middleang + (Math.random() * Math.PI) / 3 - Math.PI / 3;
    var AccelerationStrength = Math.random() / 25 + 0.05;

    object.Acceleration[0] = AccelerationStrength * Math.sin(ang);
    object.Acceleration[1] = AccelerationStrength * Math.cos(ang);

    if (this.playerObject.Position[1] - object.Position[1] == 0) {
      var pointAtang = 0;
    } else {
      if (
        Math.abs(this.playerObject.Position[0] - object.Position[0]) <
        Math.abs(this.playerObject.Position[1] - object.Position[1])
      ) {
        var pointAtang = -Math.tanh(
          (this.playerObject.Position[0] - object.Position[0]) /
            (this.playerObject.Position[1] - object.Position[1])
        );

        if (object.Position[1] > this.playerObject.Position[1]) {
          pointAtang += Math.PI;
        }
      } else {
        var pointAtang =
          Math.tanh(
            (this.playerObject.Position[1] - object.Position[1]) /
              (this.playerObject.Position[0] - object.Position[0])
          ) -
          Math.PI / 2;

        if (object.Position[0] > this.playerObject.Position[0]) {
          pointAtang += Math.PI;
        }
      }
    }

    object.Angle[0] = pointAtang;

    this.setaddImmunityShield(object, 2);

    this.EnemyObjectsList.push(object);
    return object;
  }

  createEnemySaucer() {
    const object = this.sceneHandler.AddObjectM(
      makeSafty(makeSacuer),
      this.materialLoader.MaterialSaucer(),
      this.materialLoader.MaterialBlack(),
      SceneHandler.TYPE.ENEMYSAUCER,
      "SAUCER"
    );

    object.Timer = Math.floor(this.time / 100);

    // STARTING POSITION
    // Get starting random starting position
    let scale = 0.05;
    var XorY = Math.floor(Math.random() * 2);
    if (XorY) {
      var XorY = Math.floor(Math.random() * 2);
      if (XorY) {
        object.Position[0] = this.MaxX;
        object.Acceleration[0] = -1 * scale;
        object.Acceleration[1] = 0;
      } else {
        object.Position[0] = this.MinX;
        object.Acceleration[0] = 1 * scale;
        object.Acceleration[1] = 0;
      }
      object.Position[1] =
        Math.random() * (this.MaxY - 5 - this.MinY) + this.MinY + 5;
    } else {
      var XorY = Math.floor(Math.random() * 2);

      if (XorY) {
        object.Position[1] = this.MaxY;
        object.Acceleration[0] = 0;
        object.Acceleration[1] = -1 * scale;
      } else {
        object.Position[1] = this.MinY;
        object.Acceleration[0] = 0;
        object.Acceleration[1] = 1 * scale;
      }
      object.Position[0] =
        Math.random() * (this.MaxX - 5 - this.MinX) + this.MinX + 5;
    }

    this.setaddImmunityShield(object, 2);

    this.EnemyObjectsList.push(object);
    return object;
  }

  moveAstoriods() {
    for (let index = 0; index < this.EnemyObjectsList.length; index++) {
      if (
        this.EnemyObjectsList[index].Type == SceneHandler.TYPE.ENEMYSAUCER ||
        this.EnemyObjectsList[index].Type == SceneHandler.TYPE.ENEMYSHIP
      ) {
        continue;
      }
      var object = this.EnemyObjectsList[index];

      object.Position[0] += object.Acceleration[0];
      object.Position[1] += object.Acceleration[1];
      object.Position[2] += object.Acceleration[2];

      object.Angle[0] += object.Rotation[0];
      object.Angle[1] += object.Rotation[1];
      object.Angle[2] += object.Rotation[2];

      if (
        object.Position[0] > this.MaxX + 3 ||
        object.Position[0] < this.MinX - 3 ||
        object.Position[1] > this.MaxY + 3 ||
        object.Position[1] < this.MinY - 3
      ) {
        this.EnemyObjectsList.splice(index, 1);
        this.sceneHandler.removeObject(object);
      }
    }
  }

  calculateAstorioidTransforms() {
    for (let index = 0; index < this.EnemyObjectsList.length; index++) {
      if (
        this.EnemyObjectsList[index].Type == SceneHandler.TYPE.ENEMYSAUCER ||
        this.EnemyObjectsList[index].Type == SceneHandler.TYPE.ENEMYSHIP
      ) {
        continue;
      }

      var object = this.EnemyObjectsList[index];

      var Mat4x4 = matrixHelper.matrix4;

      var TranslationTransfrom = Mat4x4.create();
      var RotationTransformX = Mat4x4.create();
      var RotationTransformY = Mat4x4.create();
      var RotationTransform = Mat4x4.create();
      var Identity = Mat4x4.create();
      Mat4x4.makeIdentity(Identity);

      Mat4x4.makeTranslation(TranslationTransfrom, object.Position);
      Mat4x4.makeRotationX(RotationTransformX, object.Angle[0]);
      Mat4x4.makeRotationY(RotationTransformY, object.Angle[1]);

      Mat4x4.multiply(
        RotationTransform,
        RotationTransformX,
        RotationTransformY
      );

      //console.log(object);
      Mat4x4.multiply(object.Model.transform, RotationTransform, Identity);
      Mat4x4.multiply(object.Model2.transform, RotationTransform, Identity);

      Mat4x4.multiply(
        object.Model.transform,
        TranslationTransfrom,
        object.Model.transform
      );
      Mat4x4.multiply(
        object.Model2.transform,
        TranslationTransfrom,
        object.Model2.transform
      );
    }
  }

  WaveManager() {
    // What i want :
    // Wave = 0-10 s and in each wave X amount of Astoriods need to be spawned this will be spread apart based on the number
    // On every 10th second well give a chance to spawn a sacuer
    // Astoriods will increase n+4 every wave starting at 1 thus + 4 = 5

    let flooredTime = Math.floor(this.time / 100); // current time
    if (this.previousTime == flooredTime) {
      return;
    }
    this.ImmunityDecrease(); // this is so i dont have to do another previous time
    this.wompSaucer();
    this.previousTime = flooredTime;
    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= 1;
    }
    if (this.stopwave == true) {
      return;
    }
    if (flooredTime % this.waveCount === 0) {
      this.wave += 1;

      if (Math.random() > 0.75) {
        if (this.score > 20000) {
          this.createEnemySaucer();
        } else {
          if (Math.random() > 0.5) {
            this.createEnemySaucer();
          } else {
            this.createEnemyShip();
          }
        }
      }
    }

    var amountOfAstoriodsPerWave = 1 + 4 * this.wave;
    var amountOfAstoriodsPerTurn = amountOfAstoriodsPerWave / 10;

    this.genCount += amountOfAstoriodsPerTurn;
    var floorwavecount = Math.floor(this.genCount);
    this.createAstoriod(floorwavecount);
    this.genCount -= floorwavecount;

    //console.log(this.wave);
  }
  // -----------  SHOOTING SECTION -----------

  AddBulletPlayer() {
    if (this.bullets > 0) {
      this.bullets -= 1;

      const object = this.sceneHandler.AddObject(
        makeSafty(makeBullet),
        this.materialLoader.MaterialBullet(),
        SceneHandler.TYPE.BULLETPLAYER,
        "BULLET"
      );

      object.Acceleration[0] += 0.6 * Math.sin(-this.playerObject.Angle[0]);
      object.Acceleration[1] += 0.6 * Math.cos(-this.playerObject.Angle[0]);
      object.Angle[0] = this.playerObject.Angle[0];

      object.Position[0] = this.playerObject.Position[0];
      object.Position[1] = this.playerObject.Position[1];
      object.Position[2] = this.playerObject.Position[2];

      this.BulletsList.push(object);
    }
  }

  AddBulletEnemy(EnemyObject) {
    const object = this.sceneHandler.AddObject(
      makeSafty(makeBullet),
      this.materialLoader.MaterialBullet(),
      SceneHandler.TYPE.BULLETENEMY,
      "BULLETENEMY"
    );

    object.Acceleration[0] += 0.3 * Math.sin(-EnemyObject.Angle[0]);
    object.Acceleration[1] += 0.3 * Math.cos(-EnemyObject.Angle[0]);
    object.Angle[0] = EnemyObject.Angle[0];

    object.Position[0] = EnemyObject.Position[0];
    object.Position[1] = EnemyObject.Position[1];
    object.Position[2] = EnemyObject.Position[2];

    this.BulletsList.push(object);
  }

  moveBullets() {
    for (let index = 0; index < this.BulletsList.length; index++) {
      const object = this.BulletsList[index];

      object.Position[0] += object.Acceleration[0];
      object.Position[1] += object.Acceleration[1];

      if (
        object.Position[0] > this.MaxX + 3 ||
        object.Position[0] < this.MinX - 3 ||
        object.Position[1] > this.MaxY + 3 ||
        object.Position[1] < this.MinY - 3
      ) {
        this.BulletsList.splice(index, 1);
        this.sceneHandler.removeObject(object);
      }
    }
  }

  calculateBulletTransform() {
    for (let index = 0; index < this.BulletsList.length; index++) {
      var object = this.BulletsList[index];
      var Mat4x4 = matrixHelper.matrix4;

      var TranslationTransfrom = Mat4x4.create();
      var RotationTransformZ = Mat4x4.create();
      var Identity = Mat4x4.create();

      Mat4x4.makeIdentity(Identity);

      Mat4x4.makeTranslation(TranslationTransfrom, object.Position);
      Mat4x4.makeRotationZ(RotationTransformZ, object.Angle[0]);

      Mat4x4.multiply(object.Model.transform, RotationTransformZ, Identity);
      Mat4x4.multiply(
        object.Model.transform,
        TranslationTransfrom,
        object.Model.transform
      );
    }
  }

  // -----------  AI SECTION -----------

  moveShip() {
    for (let index = 0; index < this.EnemyObjectsList.length; index++) {
      if (this.EnemyObjectsList[index].Type != SceneHandler.TYPE.ENEMYSHIP) {
        continue;
      }
      var object = this.EnemyObjectsList[index];

      object.Position[0] += object.Acceleration[0];
      object.Position[1] += object.Acceleration[1];
      object.Position[2] += object.Acceleration[2];

      //Rotation Logic
      {
        let pointAtang = 0;

        //This determines the Angle needed to point at the Player
        if (this.playerObject.Position[1] - object.Position[1] == 0) {
          pointAtang = 0;
        } else {
          if (
            Math.abs(this.playerObject.Position[0] - object.Position[0]) <
            Math.abs(this.playerObject.Position[1] - object.Position[1])
          ) {
            pointAtang = -Math.tanh(
              (this.playerObject.Position[0] - object.Position[0]) /
                (this.playerObject.Position[1] - object.Position[1])
            );

            if (object.Position[1] > this.playerObject.Position[1]) {
              pointAtang -= Math.PI;
            }
          } else {
            pointAtang =
              Math.tanh(
                (this.playerObject.Position[1] - object.Position[1]) /
                  (this.playerObject.Position[0] - object.Position[0])
              ) -
              Math.PI / 2;

            if (object.Position[0] > this.playerObject.Position[0]) {
              pointAtang += Math.PI;
            }
          }
        }

        // Limit the rotation speed
        let Diff = object.Angle[0] - pointAtang;
        if (Math.abs(Diff) > 0.1) {
          if (pointAtang > 0) {
            pointAtang = object.Angle[0] + 0.1;
          } else {
            pointAtang = object.Angle[0] - 0.1;
          }
        }

        object.Angle[0] = pointAtang;
      }

      //Firing logic
      {
        if (this.stopShootingEnemy == false) {
          if (object.Timer + 2 == Math.floor(this.time / 100)) {
            object.Timer = Math.floor(this.time / 100);
            if (Math.random() > 0.25) {
              this.AddBulletEnemy(object);
            }
          }
        }
      }

      if (
        object.Position[0] > this.MaxX + 3 ||
        object.Position[0] < this.MinX - 3 ||
        object.Position[1] > this.MaxY + 3 ||
        object.Position[1] < this.MinY - 3
      ) {
        this.EnemyObjectsList.splice(index, 1);
        this.sceneHandler.removeObject(object);
      }
    }
  }

  calculateShipTransform() {
    for (let index = 0; index < this.EnemyObjectsList.length; index++) {
      if (this.EnemyObjectsList[index].Type != SceneHandler.TYPE.ENEMYSHIP) {
        continue;
      }
      var object = this.EnemyObjectsList[index];
      var Mat4x4 = matrixHelper.matrix4;

      var TranslationTransfrom = Mat4x4.create();
      var RotationTransformZ = Mat4x4.create();
      var Identity = Mat4x4.create();

      Mat4x4.makeIdentity(Identity);

      Mat4x4.makeTranslation(TranslationTransfrom, object.Position);
      Mat4x4.makeRotationZ(RotationTransformZ, object.Angle[0]);

      Mat4x4.multiply(object.Model.transform, RotationTransformZ, Identity);
      Mat4x4.multiply(
        object.Model.transform,
        TranslationTransfrom,
        object.Model.transform
      );
      Mat4x4.multiply(object.Model2.transform, RotationTransformZ, Identity);
      Mat4x4.multiply(
        object.Model2.transform,
        TranslationTransfrom,
        object.Model2.transform
      );
    }
  }

  wompSaucer() {
    for (let index = 0; index < this.EnemyObjectsList.length; index++) {
      if (this.EnemyObjectsList[index].Type != SceneHandler.TYPE.ENEMYSAUCER) {
        continue;
      }
      this.setaddWomp(this.EnemyObjectsList[index]);
    }
  }

  moveSaucer() {
    for (let index = 0; index < this.EnemyObjectsList.length; index++) {
      if (this.EnemyObjectsList[index].Type != SceneHandler.TYPE.ENEMYSAUCER) {
        continue;
      }

      var object = this.EnemyObjectsList[index];

      object.Position[0] += object.Acceleration[0];
      object.Position[1] += object.Acceleration[1];
      object.Position[2] += object.Acceleration[2];

      {
        if (this.stopShootingEnemy == false) {
          if (object.Timer + 2 == Math.floor(this.time / 100)) {
            object.Timer = Math.floor(this.time / 100);
            if (Math.random() > 0.25) {
              object.Angle[0] = Math.random() * 2 * Math.PI;
              this.AddBulletEnemy(object);
              object.Angle[0] = Math.random() * 2 * Math.PI;
              this.AddBulletEnemy(object);
              object.Angle[0] = Math.random() * 2 * Math.PI;
              this.AddBulletEnemy(object);
              object.Angle[0] = Math.random() * 2 * Math.PI;
              this.AddBulletEnemy(object);
            }
          }
        }
      }

      if (
        object.Position[0] > this.MaxX + 3 ||
        object.Position[0] < this.MinX - 3 ||
        object.Position[1] > this.MaxY + 3 ||
        object.Position[1] < this.MinY - 3
      ) {
        this.EnemyObjectsList.splice(index, 1);
        this.sceneHandler.removeObject(object);
        return;
      }
    }
  }

  calculateSaucerTransform() {
    for (let index = 0; index < this.EnemyObjectsList.length; index++) {
      if (this.EnemyObjectsList[index].Type != SceneHandler.TYPE.ENEMYSAUCER) {
        continue;
      }
      var object = this.EnemyObjectsList[index];
      var Mat4x4 = matrixHelper.matrix4;

      var TranslationTransfrom = Mat4x4.create();
      var Identity = Mat4x4.create();

      Mat4x4.makeIdentity(Identity);
      Mat4x4.makeTranslation(TranslationTransfrom, object.Position);

      Mat4x4.multiply(object.Model.transform, TranslationTransfrom, Identity);
      Mat4x4.multiply(object.Model2.transform, TranslationTransfrom, Identity);
    }
  }

  // -----------  COLLITION SECTION -----------

  ImmunityDecrease() {
    if (this.playerObject.Immunity > 0) {
      //console.log("Player Immunity Decreased");
      this.playerObject.Immunity -= 1;
    }
    for (let index = 0; index < this.EnemyObjectsList.length; index++) {
      const object = this.EnemyObjectsList[index];
      if (object.Immunity > 0) {
        object.Immunity -= 1;
      }
    }
  }

  breakBullet(index, object) {
    if (
      object.Type != SceneHandler.TYPE.BULLETENEMY &&
      object.Type != SceneHandler.TYPE.BULLETPLAYER
    ) {
      return;
    }

    this.BulletsList.splice(index, 1);
    this.sceneHandler.removeObject(object);
  }

  breakEnemy(index, object, addScore) {
    if (
      object.Type != SceneHandler.TYPE.ENEMYSAUCER &&
      object.Type != SceneHandler.TYPE.ENEMYSHIP
    ) {
      return;
    }
    if (object.Type == SceneHandler.TYPE.ENEMYSAUCER) {
      this.setaddScrap(object, this.materialLoader.MaterialBullet());

      this.score += 200 * addScore;
    } else if (object.Type == SceneHandler.TYPE.ENEMYSHIP) {
      this.setaddScrap(object, this.materialLoader.MaterialRed());
      this.score += 1000 * addScore;
    }

    this.EnemyObjectsList.splice(index, 1);
    this.sceneHandler.removeObject(object);
  }

  breakAstoriod(index, object, addScore) {
    if (this.CheckAstorioidsOnly(object)) {
      return false;
    }
    //console.log(object.Type);
    if (object.Type == SceneHandler.TYPE.ASTORIOIDLARGE) {
      // if large splits into => 1 Medium + (1 Medium or 2 small or 1 small)
      this.setaddScrap(object, this.materialLoader.MaterialAstoriod());
      this.setaddScrap(object, this.materialLoader.MaterialAstoriod());
      this.setaddScrap(object, this.materialLoader.MaterialAstoriod());

      // 1 Medium
      let ang = Math.random() * Math.PI * 2;
      let pos1 = 3.5 * Math.cos(ang) + object.Position[0];
      let pos2 = 3.5 * Math.sin(ang) + object.Position[1];
      this.createAstoriodSPECIFIC(
        SceneHandler.TYPE.ASTORIOIDMEDIUM,
        [pos1, pos2, 0],
        ang
      );

      if (Math.random > 0.5) {
        // 1 Medium
        let ang = Math.random() * Math.PI * 2;
        let pos1 = 3.5 * Math.cos(ang) + object.Position[0];
        let pos2 = 3.5 * Math.sin(ang) + object.Position[1];
        this.createAstoriodSPECIFIC(
          SceneHandler.TYPE.ASTORIOIDMEDIUM,
          [pos1, pos2, 0],
          ang
        );
      } else if (Math.random > 0.5) {
        // 1 small
        let ang = Math.random() * Math.PI * 2;
        let pos1 = 3.5 * Math.cos(ang) + object.Position[0];
        let pos2 = 3.5 * Math.sin(ang) + object.Position[1];
        this.createAstoriodSPECIFIC(
          SceneHandler.TYPE.ASTORIOIDSMALL,
          [pos1, pos2, 0],
          ang
        );
      } else {
        // 2 small
        let ang = Math.random() * Math.PI * 2;
        let pos1 = 3.5 * Math.cos(ang) + object.Position[0];
        let pos2 = 3.5 * Math.sin(ang) + object.Position[1];
        this.createAstoriodSPECIFIC(
          SceneHandler.TYPE.ASTORIOIDMEDIUM,
          [pos1, pos2, 0],
          ang
        );

        let ang2 = Math.random() * Math.PI * 2;
        let pos12 = 3.5 * Math.cos(ang) + object.Position[0];
        let pos22 = 3.5 * Math.sin(ang) + object.Position[1];
        this.createAstoriodSPECIFIC(
          SceneHandler.TYPE.ASTORIOIDMEDIUM,
          [pos12, pos22, 0],
          ang2
        );
      }

      this.score += 20 * addScore;
    } else if (object.Type == SceneHandler.TYPE.ASTORIOIDMEDIUM) {
      this.setaddScrap(object, this.materialLoader.MaterialAstoriod());
      this.setaddScrap(object, this.materialLoader.MaterialAstoriod());

      // if medium splits => 1 small and (1 small or none)
      let ang = Math.random() * Math.PI * 2;
      let pos1 = 3 * Math.cos(ang) + object.Position[0];
      let pos2 = 3 * Math.sin(ang) + object.Position[1];
      this.createAstoriodSPECIFIC(
        SceneHandler.TYPE.ASTORIOIDSMALL,
        [pos1, pos2, 0],
        ang
      );
      if (Math.random > 0.5) {
        let ang = Math.random() * Math.PI * 2;
        let pos1 = 3.5 * Math.cos(ang) + object.Position[0];
        let pos2 = 3.5 * Math.sin(ang) + object.Position[1];
        this.createAstoriodSPECIFIC(
          SceneHandler.TYPE.ASTORIOIDSMALL,
          [pos1, pos2, 0],
          ang
        );
      }

      this.score += 50 * addScore;
    } else if (object.Type == SceneHandler.TYPE.ASTORIOIDSMALL) {
      this.setaddScrap(object, this.materialLoader.MaterialAstoriod());
      this.setaddScrap(object, this.materialLoader.MaterialAstoriod());

      // increase score
      this.score += 100 * addScore;

      //Spawn ASTORIODS after effects :)
    } else if (object.Type == SceneHandler.TYPE.GOJO) {
      this.score += 1000 * addScore;
    }

    this.EnemyObjectsList.splice(index, 1);
    this.sceneHandler.removeObject(object);
  }

  NUKEAllEverything() {
    var objectslength = this.EnemyObjectsList.length;
    var Pobjectslength = this.EnemyObjectsList.length;
    var index = 0;
    while (true) {
      const object = this.EnemyObjectsList[index];
      this.breakAstoriod(index, object, 0);
      this.breakEnemy(index, object, 0);
      objectslength = this.EnemyObjectsList.length;
      if (Pobjectslength == objectslength) {
        index += 1;
      }
      if (objectslength == index) {
        break;
      }
    }
  }

  CheckForCollition(Object1, Object2) {
    var radius1 = 0;
    var radius2 = 0;

    if (this.stopcollition == true) {
      return false;
    }
    // if any object is immune it wont return true
    if (Object1.Immunity > 0 || Object2.Immunity > 0) {
      return false;
    }

    switch (Object1.Type) {
      case SceneHandler.TYPE.DUMMYPLAYER:
        return false;
      case SceneHandler.TYPE.PLAYER:
        radius1 = 2.5;
        break;
      case SceneHandler.TYPE.ENEMYSAUCER:
        radius1 = 3;
        break;
      case SceneHandler.TYPE.GOJO:
        radius1 = 2;
        break;
      case SceneHandler.TYPE.BULLETPLAYER:
        radius1 = 1.2;
        break;
      case SceneHandler.TYPE.BULLETENEMY:
        radius1 = 1;
        break;
      case SceneHandler.TYPE.ASTORIOIDLARGE:
        radius1 = 3.2;
        break;
      case SceneHandler.TYPE.ASTORIOIDSMALL:
      case SceneHandler.TYPE.STARTGAMEASTORIOID:
      case SceneHandler.TYPE.CHANGEMODEASTORIOID:
        radius1 = 2.2;
        break;
      case SceneHandler.TYPE.ASTORIOIDMEDIUM:
        radius1 = 2.7;
        break;
      case SceneHandler.TYPE.ENEMYSHIP:
        radius1 = 2;
        break;
      default:
        return false;
    }

    switch (Object2.Type) {
      case SceneHandler.TYPE.DUMMYPLAYER:
        return false;
      case SceneHandler.TYPE.PLAYER:
        radius1 = 2.5;
        break;
      case SceneHandler.TYPE.ENEMYSAUCER:
        radius1 = 3;
        break;
      case SceneHandler.TYPE.GOJO:
        radius1 = 2;
        break;
      case SceneHandler.TYPE.BULLETPLAYER:
        radius1 = 1.2;
        break;
      case SceneHandler.TYPE.BULLETENEMY:
        radius1 = 1;
        break;
      case SceneHandler.TYPE.ASTORIOIDLARGE:
        radius1 = 3;
        break;
      case SceneHandler.TYPE.ASTORIOIDSMALL:
      case SceneHandler.TYPE.STARTGAMEASTORIOID:
      case SceneHandler.TYPE.CHANGEMODEASTORIOID:
        radius1 = 2;
        break;
      case SceneHandler.TYPE.ASTORIOIDMEDIUM:
        radius1 = 2.5;
        break;
      case SceneHandler.TYPE.ENEMYSHIP:
        radius1 = 2;
        break;
      default:
        return false;
    }

    let collitionRadius = radius1 + radius2;
    let Distance = Math.sqrt(
      Math.pow(Object2.Position[0] - Object1.Position[0], 2) +
        Math.pow(Object2.Position[1] - Object1.Position[1], 2)
    );
    return collitionRadius >= Distance;
  }

  Collition() {
    // Rule if imunity > 0 then the application isnt done.

    // Collition with all Bullets and Enemy Objects (Ignore EnemyBullet->Ship/Saucer)
    for (let index = 0; index < this.BulletsList.length; index++) {
      const bullet = this.BulletsList[index];
      for (let index = 0; index < this.EnemyObjectsList.length; index++) {
        const enemy = this.EnemyObjectsList[index];
        if (
          bullet.Type == SceneHandler.TYPE.BULLETENEMY &&
          (enemy.Type == SceneHandler.TYPE.ENEMYSHIP ||
            enemy.Type == SceneHandler.TYPE.ENEMYSAUCER)
        ) {
          continue;
        }
        if (this.CheckForCollition(bullet, enemy)) {
          bullet.Collided = 1;
          if (bullet.Type == SceneHandler.TYPE.BULLETPLAYER) {
            enemy.Collided = 1;
          } else {
            enemy.Collided = 0;
          }
        }
      }
    }

    // Collition with EnemyShips and Astoriods
    for (let index = 0; index < this.EnemyObjectsList.length; index++) {
      const astoriod = this.EnemyObjectsList[index];
      if (this.CheckAstorioidsOnly(astoriod)) {
        continue;
      }
      for (let index = 0; index < this.EnemyObjectsList.length; index++) {
        const enemy = this.EnemyObjectsList[index];
        if (
          enemy.Type != SceneHandler.TYPE.ENEMYSAUCER &&
          enemy.Type != SceneHandler.TYPE.ENEMYSHIP
        ) {
          continue;
        }
        if (this.CheckForCollition(astoriod, enemy)) {
          astoriod.Collided = 0;
          enemy.Collided = 0;
        }
      }
    }
    // Collition with All Bullets and Player
    for (let index = 0; index < this.BulletsList.length; index++) {
      const bullet = this.BulletsList[index];
      if (bullet.Type == SceneHandler.TYPE.BULLETPLAYER) {
        continue;
      }
      if (this.CheckForCollition(bullet, this.playerObject)) {
        bullet.Collided = 1;
        this.playerObject.Collided = 1;
      }
    }
    // Colition with all EnemyObjects and Player.
    for (let index = 0; index < this.EnemyObjectsList.length; index++) {
      const enemy = this.EnemyObjectsList[index];
      if (this.CheckForCollition(this.playerObject, enemy)) {
        enemy.Collided = 1;
        this.playerObject.Collided = 1;
      }
    }
  }

  CollitionApply() {
    let removed = 1;
    while (removed != 0) {
      removed = 0;
      for (let index = 0; index < this.EnemyObjectsList.length; index++) {
        const element = this.EnemyObjectsList[index];
        if (element.Collided != 2) {
          removed += 1;
          this.breakAstoriod(index, element, element.Collided);
          this.breakEnemy(index, element, element.Collided);
        }
      }

      for (let index = 0; index < this.BulletsList.length; index++) {
        const element = this.BulletsList[index];
        if (element.Collided != 2) {
          removed += 1;
          this.breakBullet(index, element);
        }
      }

      if (this.playerObject.Collided != 2) {
        removed += 1;
        this.killPlayer();
      }
    }
  }

  // -----------  VISUAL EFFECTS SECTION -----------

  setaddImmunityShield(object, seconds) {
    object.Immunity = seconds;

    const shieldObject = this.sceneHandler.AddObjectAttach(
      makeSafty(makeforcefield),
      this.materialLoader.MaterialBlue(),
      SceneHandler.TYPE.SHIELD,
      "IMMUNITY SHIELDS",
      object
    );

    this.EffectsList.push(shieldObject);
  }

  setaddFire(object) {
    const fireObject = this.sceneHandler.AddObjectAttach(
      makeSafty(makeShipFire),
      this.materialLoader.MaterialRed(),
      SceneHandler.TYPE.FIRE,
      "FIRE",
      object
    );

    this.EffectsList.push(fireObject);
  }

  setaddWomp(object) {
    //console.log("WOMP ADDED");
    const wompObject = this.sceneHandler.AddObjectAttach(
      makeSafty(makeSaucerWomp),
      this.materialLoader.MaterialBlue(),
      SceneHandler.TYPE.WOMP,
      "Womp",
      object
    );

    wompObject.Position[0] = object.Position[0];
    wompObject.Position[1] = object.Position[1];
    wompObject.Position[2] = object.Position[2];

    wompObject.Timer = 100;

    this.EffectsList.push(wompObject);
  }

  setaddScrap(object, material) {
    const scrapObject = this.sceneHandler.AddObjectAttach(
      makeSafty(makeScrapPiece),
      material,
      SceneHandler.TYPE.SCRAP,
      "ASTARIOD SCARP",
      object
    );

    let ang = Math.random() * Math.PI * 2;
    let pos1 = 1 * Math.cos(ang) + object.Position[0];
    let pos2 = 1 * Math.sin(ang) + object.Position[1];

    scrapObject.Position[0] = pos1;
    scrapObject.Position[1] = pos2;
    scrapObject.Position[2] = 0;

    scrapObject.Rotation[0] = Math.random() / 50;
    scrapObject.Rotation[1] = Math.random() / 50;
    scrapObject.Rotation[2] = Math.random() / 50;

    var AccelerationStrength = Math.random() / 50 + 0.2;

    scrapObject.Acceleration[0] = AccelerationStrength * Math.sin(ang);
    scrapObject.Acceleration[1] = AccelerationStrength * Math.cos(ang);
    scrapObject.Acceleration[2] = 0;

    scrapObject.Timer = 100;

    this.EffectsList.push(scrapObject);
    //console.log("Effect created:", scrapObject);
    //console.log(this.EffectsList);
  }

  moveEffects() {
    for (let index = 0; index < this.EffectsList.length; index++) {
      const object = this.EffectsList[index];

      if (object.Type == SceneHandler.TYPE.SHIELD) {
        if (object.AttachedObject.Immunity == 0) {
          this.EffectsList.splice(index, 1);
          this.sceneHandler.removeObject(object);
          continue;
        }

        if (object.AttachedObject.Collided != 2) {
          this.EffectsList.splice(index, 1);
          this.sceneHandler.removeObject(object);
          continue;
        }

        object.Position[0] = object.AttachedObject.Position[0];
        object.Position[1] = object.AttachedObject.Position[1];
        object.Position[2] = object.AttachedObject.Position[2];
      } else if (object.Type == SceneHandler.TYPE.FIRE) {
        if (this.controls[0] == false) {
          this.EffectsList.splice(index, 1);
          this.sceneHandler.removeObject(object);
          continue;
        }

        if (object.AttachedObject.Type == SceneHandler.TYPE.DUMMYPLAYER) {
          this.EffectsList.splice(index, 1);
          this.sceneHandler.removeObject(object);
          continue;
        }

        if (object.AttachedObject.Collided != 2) {
          this.EffectsList.splice(index, 1);
          this.sceneHandler.removeObject(object);
          continue;
        }

        object.Position[0] = object.AttachedObject.Position[0];
        object.Position[1] = object.AttachedObject.Position[1];
        object.Position[2] = object.AttachedObject.Position[2];

        object.Angle[2] = object.AttachedObject.Angle[0];
      } else if (object.Type == SceneHandler.TYPE.WOMP) {
        if (object.Timer == 1) {
          this.EffectsList.splice(index, 1);
          this.sceneHandler.removeObject(object);
          continue;
        }

        object.Position[1] -= 0.08;

        object.Timer -= 1;
      } else if (object.Type == SceneHandler.TYPE.SCRAP) {
        if (object.Timer == 1) {
          this.EffectsList.splice(index, 1);
          this.sceneHandler.removeObject(object);
          continue;
        }

        object.Position[0] += object.Acceleration[0];
        object.Position[1] += object.Acceleration[1];
        object.Position[2] += object.Acceleration[2];

        object.Angle[0] += object.Rotation[0];
        object.Angle[1] += object.Rotation[1];
        object.Angle[2] += object.Rotation[2];

        object.Timer -= 1;
      }
    }
  }

  calculateEffectTransforms() {
    for (let index = 0; index < this.EffectsList.length; index++) {
      const object = this.EffectsList[index];
      var Mat4x4 = matrixHelper.matrix4;

      var TranslationTransfrom = Mat4x4.create();
      var RotationTransformX = Mat4x4.create();
      var RotationTransformZ = Mat4x4.create();
      var RotationTransforms = Mat4x4.create();
      var ScalingTransform = Mat4x4.create();
      var Identity = Mat4x4.create();

      Mat4x4.makeIdentity(Identity);

      Mat4x4.makeTranslation(TranslationTransfrom, object.Position);
      Mat4x4.makeRotationX(RotationTransformX, object.Angle[1]);
      Mat4x4.makeRotationZ(RotationTransformZ, object.Angle[2]);
      //Mat4x4.makeScaling(ScalingTransform, [1, 1, 1]);
      /*
      Mat4x4.multiply(
        RotationTransforms,
        RotationTransformX,
        RotationTransformZ
      );
      */

      if (object.Timer == 0) {
        Mat4x4.makeScaling(ScalingTransform, [1, 1, 1]);
      } else {
        Mat4x4.makeScaling(ScalingTransform, [
          object.Timer / 100,
          object.Timer / 100,
          object.Timer / 100,
        ]);
      }

      Mat4x4.multiply(object.Model.transform, RotationTransformZ, Identity);
      Mat4x4.multiply(
        object.Model.transform,
        ScalingTransform,
        object.Model.transform
      );
      Mat4x4.multiply(
        object.Model.transform,
        TranslationTransfrom,
        object.Model.transform
      );
    }
  }

  // -----------  ADDITONAL CONTROLS SECTION -----------
  settings() {
    if (this.mode && !this.modeChanged) {
      // normal to vintage
      this.gl.cullFace(this.gl.FRONT);
      this.modeChanged = !this.modeChanged;
      this.changeCurrentModels();
    } else if (!this.mode && this.modeChanged) {
      // vingate to normal
      this.gl.cullFace(this.gl.BACK);
      this.modeChanged = !this.modeChanged;
      this.changeCurrentModels();
    }
  }

  changeCurrentModels() {
    this.materialLoader.ModeChanger();

    // PLAYER MODEL CHANGE
    this.playerObject.Model.nodeObject.material =
      this.materialLoader.MaterialShip();

    // ENEMY OBJECTS MODEL CHANGE
    for (let i = 0; i < this.EnemyObjectsList.length; i++) {
      const object = this.EnemyObjectsList[i];

      switch (object.Type) {
        case SceneHandler.TYPE.ASTORIOIDSMALL:
        case SceneHandler.TYPE.ASTORIOIDMEDIUM:
        case SceneHandler.TYPE.ASTORIOIDLARGE:
          this.EnemyObjectsList[i].Model.nodeObject.material =
            this.materialLoader.MaterialAstoriod();
          break;
        case SceneHandler.TYPE.ENEMYSAUCER:
          this.EnemyObjectsList[i].Model.nodeObject.material =
            this.materialLoader.MaterialSaucer();
          break;
        case SceneHandler.TYPE.ENEMYSHIP:
          this.EnemyObjectsList[i].Model.nodeObject.material =
            this.materialLoader.MaterialEnemyShip();
          break;
        case SceneHandler.TYPE.GOJO:
          this.EnemyObjectsList[i].Model.nodeObject.material =
            this.materialLoader.MaterialGojo();
          break;

        default:
          break;
      }
    }
  }

  // -----------  MENU SECTION -----------

  getMenu() {
    const menuObject = this.sceneHandler.AddObject(
      makePlane(),
      this.materialLoader.MaterialMenu(),
      SceneHandler.TYPE.MENU,
      "MENUSCREEN"
    );

    menuObject.Position[3] = -10;

    var Mat4x4 = matrixHelper.matrix4;

    var TranslationTransfrom = Mat4x4.create();
    var Identity = Mat4x4.create();
    Mat4x4.makeIdentity(Identity);

    Mat4x4.makeTranslation(TranslationTransfrom, menuObject.Position);
    Mat4x4.multiply(
      this.playerObject.Model.transform,
      TranslationTransfrom,
      Identity
    );

    return menuObject;
  }

  createMenuInfoObjects(Type) {
    switch (Type) {
      case SceneHandler.TYPE.ASTORIOIDSMALL:
        var object = this.createAstoriodSPECIFIC(
          SceneHandler.TYPE.ASTORIOIDSMALL,
          [34, 10, 3],
          0
        );
        object.Acceleration[0] = 0;
        object.Acceleration[1] = 0;
        object.Immunity = 0;
        break;
      case SceneHandler.TYPE.GOJO:
        const Gojoobject = this.sceneHandler.AddObjectM(
          makeSafty(makeGojoCube),
          this.materialLoader.MaterialGojo(),
          this.materialLoader.MaterialBlack(),
          SceneHandler.TYPE.GOJO,
          "GOJO_CUBE"
        );
        Gojoobject.Position[0] = 40;
        Gojoobject.Position[1] = 10;
        Gojoobject.Position[2] = 3;

        Gojoobject.Immunity = 0;
        this.EnemyObjectsList.push(Gojoobject);
        break;
      case SceneHandler.TYPE.ENEMYSAUCER:
        var object = this.createEnemySaucer();
        object.Acceleration[0] = 0;
        object.Acceleration[1] = 0;
        object.Acceleration[2] = 0;
        object.Position[0] = 40;
        object.Position[1] = 4;
        object.Position[2] = 3;
        object.Immunity = 0;
        break;
      case SceneHandler.TYPE.ENEMYSHIP:
        var object = this.createEnemyShip();
        object.Acceleration[0] = 0;
        object.Acceleration[1] = 0;
        object.Acceleration[2] = 0;
        object.Position[0] = 34;
        object.Position[1] = 4;
        object.Position[2] = 3;
        object.Immunity = 0;
        break;
      default:
        break;
    }
  }

  resetObjects() {
    this.playerObject.Immunity = 0;
    let checkList = [false, false, false, false, false, false];
    // [SceneHandler.TYPE.ASTORIOIDSMALL, SceneHandler.TYPE.GOJO, SceneHandler.TYPE.ENEMYSAUCER, SceneHandler.TYPE.ENEMYSHIP]
    for (let index = 0; index < this.EnemyObjectsList.length; index++) {
      const element = this.EnemyObjectsList[index];

      switch (element.Type) {
        case SceneHandler.TYPE.ASTORIOIDSMALL:
          checkList[0] = true;
          break;
        case SceneHandler.TYPE.GOJO:
          checkList[1] = true;
          break;
        case SceneHandler.TYPE.ENEMYSAUCER:
          checkList[2] = true;
          break;
        case SceneHandler.TYPE.ENEMYSHIP:
          checkList[3] = true;
          break;
        case SceneHandler.TYPE.CHANGEMODEASTORIOID:
          checkList[4] = true;
          break;
        case SceneHandler.TYPE.STARTGAMEASTORIOID:
          checkList[5] = true;
          break;
        default:
          break;
      }
    }

    for (let index = 0; index < checkList.length; index++) {
      if (checkList[index] == false) {
        switch (index) {
          case 0:
            this.createMenuInfoObjects(SceneHandler.TYPE.ASTORIOIDSMALL);
            break;
          case 1:
            this.createMenuInfoObjects(SceneHandler.TYPE.GOJO);
            break;
          case 2:
            this.createMenuInfoObjects(SceneHandler.TYPE.ENEMYSAUCER);
            break;
          case 3:
            this.createMenuInfoObjects(SceneHandler.TYPE.ENEMYSHIP);
            break;
          case 4:
            const Changeobject = this.createAstoriodSPECIFIC(
              SceneHandler.TYPE.ASTORIOIDSMALL,
              [20, -10.5, 3],
              0
            );
            Changeobject.Acceleration[0] = 0;
            Changeobject.Acceleration[1] = 0;
            Changeobject.Immunity = 0;
            Changeobject.Type = SceneHandler.TYPE.CHANGEMODEASTORIOID;

            this.Changeobject = Changeobject;
            break;
          case 5:
            this.startGame = true;
          default:
            break;
        }
      }
    }
  }

  startMenu() {
    // step 1 create objects,  (Extra player, enemy types and the 2 astoriods being used for detecting start and change mode, and )
    // step 2 once cretaing each object change there accel to be 0 to prevent any movement
    // step 3 stop waves from going and change map size.

    this.stopShootingEnemy = true;
    this.stopwave = true;

    this.playerObject.Position[1] = -15;
    this.playerObject.Position[2] = 3;

    let object = this.getPlayer();
    object.Immunity = 0;
    object.Position[0] = 5;
    object.Position[1] = 17;
    object.Position[2] = 3;
    this.EffectsList.push(object);

    this.createMenuInfoObjects(SceneHandler.TYPE.ASTORIOIDSMALL);
    this.createMenuInfoObjects(SceneHandler.TYPE.GOJO);
    this.createMenuInfoObjects(SceneHandler.TYPE.ENEMYSAUCER);
    this.createMenuInfoObjects(SceneHandler.TYPE.ENEMYSHIP);

    this.menuScreen = this.getMenu();

    const Startobject = this.createAstoriodSPECIFIC(
      SceneHandler.TYPE.ASTORIOIDSMALL,
      [-23, -10.5, 3],
      0
    );
    Startobject.Acceleration[0] = 0;
    Startobject.Acceleration[1] = 0;
    Startobject.Immunity = 0;
    Startobject.Type = SceneHandler.TYPE.STARTGAMEASTORIOID;

    this.Startobject = Startobject;

    const Changeobject = this.createAstoriodSPECIFIC(
      SceneHandler.TYPE.ASTORIOIDSMALL,
      [20, -10.5, 3],
      0
    );
    Changeobject.Acceleration[0] = 0;
    Changeobject.Acceleration[1] = 0;
    Changeobject.Immunity = 0;
    Changeobject.Type = SceneHandler.TYPE.CHANGEMODEASTORIOID;

    this.Changeobject = Changeobject;
  }

  changeToGame() {
    if (this.Changeobject.Collided < 2) {
      this.mode = !this.mode;
      this.Changeobject.Collided = 2;
    }
    return this.startGame;
    // This is the same as reset game But
  }

  InfiniteLive() {
    if (this.lives <= 2) {
      this.incrementLives();
    }
    this.playerObject.Immunity = 0;
  }

  removeFromList(List) {
    while (List.length) {
      const element = List.pop();
      this.sceneHandler.removeObject(element);
    }
  }

  reset(noscore) {
    this.gameEND = false;

    this.controls = [false, false, false]; //  ^, <-, ->
    this.teleport = false;
    this.teleportCooldown = 0;
    this.lives = 3;
    this.bullets = 0;
    this.livesWithoutExtra = this.lives;

    this.MaxX = 52;
    this.MinX = -52;
    this.MaxY = 27;
    this.MinY = -27;

    this.time = 0;
    this.previousTime = -1;
    this.wave = 0;
    this.waveCount = 20;
    this.genCount = 0;

    this.stopwave = false;
    this.stopcollition = false;

    this.stopShootingEnemy = false;
    this.Changeobject = null;
    this.Startobject = null;

    this.removeText();
    this.removeFromList(this.EnemyObjectsList);
    this.removeFromList(this.EffectsList);
    this.removeFromList(this.BulletsList);

    if (this.menuScreen != null) {
      this.sceneHandler.removeObject(this.menuScreen);
      this.menuScreen = null;
    } else if (noscore == false) {
      const currentscore = this.score;
      this.scoresList.push(currentscore);
    }
    this.score = 0;

    this.playerObject.Position[0] = 0;
    this.playerObject.Position[1] = 0;
    this.playerObject.Position[2] = 0;
    this.playerObject.Acceleration[0] = 0;
    this.playerObject.Acceleration[1] = 0;
    this.playerObject.Acceleration[2] = 0;

    this.EnemyObjectsList = [];
    this.EffectsList = [];
    this.BulletsList = [];
  }
}
