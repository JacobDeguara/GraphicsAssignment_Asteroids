class MaterialLoader {
  constructor(gl, scene) {
    var pathList = [
      "Images/astoriodMap.jpg",
      "Images/BulletMap.png",
      "Images/EnemyShipBody.png",
      "Images/GojoWrapOver.png",
      "Images/SaucerBody.png",
      "Images/ship_deisn.jpg",
      "Images/Black.png",
      "Images/neonGreen.png",
      "Images/Grey.png",
      "Images/Red.png",
      "Images/Blue.png",
      "Images/MenuScreenbackgroundInfo.png",
    ];

    this.materialList = [];

    for (let index = 0; index < pathList.length; index++) {
      const material = new Material();

      const image = new Image();
      image.src = pathList[index];
      image.onload = () => {
        material.setAlbedo(gl, image);
        console.log("Loaded Image");
      };

      material.setAlbedo(gl, image);
      material.setShininess(2.0);
      material.setSpecular([1, 1, 1]);
      material.setAmbient([1, 1, 1]);
      material.setDiffuse([0.2, 0.2, 0.2]);
      material.bind(gl, scene.shaderProgram);

      this.materialList.push(material);
    }
    console.log(this.materialList);

    this.Mode = true;
  }

  ModeChanger() {
    this.Mode = !this.Mode;
  }

  MaterialAstoriod() {
    if (this.Mode) {
      return this.materialList[0];
    }
    return this.materialList[7];
  }
  MaterialEnemyShip() {
    if (this.Mode) {
      return this.materialList[2];
    }
    return this.materialList[9];
  }
  MaterialGojo() {
    if (this.Mode) {
      return this.materialList[3];
    }
    return this.materialList[9];
  }
  MaterialSaucer() {
    if (this.Mode) {
      return this.materialList[4];
    }
    return this.materialList[9];
  }
  MaterialShip() {
    if (this.Mode) {
      return this.materialList[5];
    }
    return this.materialList[5];
  }
  MaterialBullet() {
    return this.materialList[1];
  }
  MaterialBlack() {
    return this.materialList[6];
  }
  MaterialGreen() {
    return this.materialList[7];
  }
  MaterialGrey() {
    return this.materialList[8];
  }
  MaterialRed() {
    return this.materialList[9];
  }
  MaterialBlue() {
    return this.materialList[10];
  }
  MaterialMenu() {
    return this.materialList[11];
  }
}

function modelCreator(makeFunctionResult, MaterialFunctionResult, gl, scene) {
  const shape = makeFunctionResult;

  // Create two objects, reusing the same model geometry
  const model = new Model();
  model.name = "shape";
  model.index = shape.index;
  model.vertex = shape.vertex;
  model.compile(scene);

  // Set up lights
  const light = new Light();
  light.type = Light.LIGHT_TYPE.POINT;
  light.setDiffuse([2, 2, 2]);
  light.setSpecular([1, 1, 1]);
  light.setAmbient([1, 1, 1]);
  light.setPosition([0, 0, 0]);
  light.setDirection([0, 0, -1]);
  light.setCone(0.7, 0.6);
  light.attenuation = Light.ATTENUATION_TYPE.NONE;
  light.bind(gl, scene.shaderProgram, 0);

  model.material = MaterialFunctionResult;

  return { Model: model, Light: light };
}

class SceneHandler {
  constructor() {
    this.canvas = document.getElementById("canvas-cg-lab");
    this.canvas.width = 1495;
    this.canvas.height = 762;
    this.canvas.aspect = this.canvas.width / this.canvas.height;
    //console.log(this.canvas.width, this.canvas.height);

    // Assign context to gl
    this.gl = null;
    try {
      this.gl = this.canvas.getContext("webgl", { antialias: true });
    } catch (e) {
      alert("No webGL compatibility detected!");
      return false;
    }

    // Set up GL Setting
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);

    // Set up scene
    this.scene = new Scene();
    this.scene.initialise(this.gl, this.canvas);
    this.scene.setViewFrustum(1, 200, 0.5);

    this.ObjectList = [];

    const Vec3 = matrixHelper.vector3;
    this.observer = Vec3.from(0, 0, 100);
  }

  Render() {
    this.scene.lookAt(this.observer, [0, 0, 0], [0, 1, 0]);
    this.scene.beginFrame();
    this.scene.animate();
    this.scene.draw();
    this.scene.endFrame();
  }

  getScene() {
    return this.scene;
  }

  getGL() {
    return this.gl;
  }

  getObjectList() {
    return this.ObjectList;
  }

  getCanvas() {
    return this.canvas;
  }

  AddObject(makeModelR, materialR, objectType, name) {
    var coupleLightmodel = modelCreator(
      makeModelR,
      materialR,
      this.gl,
      this.scene
    );

    const light = coupleLightmodel.Light;
    const model = coupleLightmodel.Model;

    const lightNode = this.scene.addNode(
      this.scene.root,
      light,
      "lightNode",
      Node.NODE_TYPE.LIGHT
    );

    const modelNode = this.scene.addNode(
      lightNode,
      model,
      "ModelNode",
      Node.NODE_TYPE.MODEL
    );

    const typeing = objectType;

    const object_element = {
      Name: name,
      Light: lightNode, // This is the Light element
      Model: modelNode, // This is the model
      Type: typeing, // This is the Type of object
      Collided: 2, // This is a refrence to the object needing to be removed. 2 = NOT, 1 = PLAYERREMOVED, 0 = ENEMYREMOVED
      Position: [0, 0, 0], // This is were the object is
      Angle: [0, 0, 0], // This is how the object has been turned           (Angle is in 1 direction )
      Rotation: [0, 0, 0], // This is the objects Rotation vector  (3 because i want 3 Degrees of rotation
      Acceleration: [0, 0, 0], // This is how fast its going
      Timer: 0,
      Immunity: 0,
    };

    this.ObjectList.push(object_element);

    return object_element;
  }

  AddObjectM(makeModelR, materialR1, materialR2, objectType, name) {
    const makeModel = makeModelR;
    var coupleLightmodel = modelCreator(
      makeModel,
      materialR1,
      this.gl,
      this.scene
    );

    const light = coupleLightmodel.Light;
    const model = coupleLightmodel.Model;
    const typeing = objectType;

    const lightNode = this.scene.addNode(
      this.scene.root,
      light,
      "lightNode",
      Node.NODE_TYPE.LIGHT
    );

    const modelNode = this.scene.addNode(
      lightNode,
      model,
      "ModelNode",
      Node.NODE_TYPE.MODEL
    );

    const model2shape = scaleDownModel(model, 0.8);
    const model2 = new Model();
    model2.name = "shape";
    model2.index = model2shape.index;
    model2.vertex = model2shape.vertex;
    model2.compile(this.scene);
    model2.material = materialR2;

    const model2Node = this.scene.addNode(
      lightNode,
      model2, // scaled down version
      "ModelNode",
      Node.NODE_TYPE.MODEL
    );

    const object_element = {
      Name: name,
      Light: lightNode, // This is the Light element
      Model: modelNode, // This is the model
      Model2: model2Node, // The second model for Visual Mode change
      Type: typeing, // This is the Type of object
      Collided: 2, // This is a refrence to the object needing to be removed. 2 = NOT, 1 = PLAYERREMOVED, 0 = ENEMYREMOVED
      Position: [0, 0, 0], // This is were the object is
      Angle: [0, 0, 0], // This is how the object has been turned           (Angle is in 1 direction )
      Rotation: [0, 0, 0], // This is the objects Rotation vector  (3 because i want 3 Degrees of rotation
      Acceleration: [0, 0, 0], // This is how fast its going
      Timer: 0,
      Immunity: 0,
    };

    this.ObjectList.push(object_element);

    return object_element;
  }

  AddObjectAttach(makeModelR, materialR, objectType, name, attachedObject) {
    var coupleLightmodel = modelCreator(
      makeModelR,
      materialR,
      this.gl,
      this.scene
    );

    const light = coupleLightmodel.Light;
    const model = coupleLightmodel.Model;

    const lightNode = this.scene.addNode(
      this.scene.root,
      light,
      "lightNode",
      Node.NODE_TYPE.LIGHT
    );

    const modelNode = this.scene.addNode(
      lightNode,
      model,
      "ModelNode",
      Node.NODE_TYPE.MODEL
    );

    const typeing = objectType;

    const object_element = {
      Name: name,
      Light: lightNode, // This is the Light element
      Model: modelNode, // This is the model
      Type: typeing, // This is the Type of object
      Collided: 2, // This is a refrence to the object needing to be removed. 2 = NOT, 1 = PLAYERREMOVED, 0 = ENEMYREMOVED
      Position: [0, 0, 0], // This is were the object is
      Angle: [0, 0, 0], // This is how the object has been turned           (Angle is in 1 direction )
      Rotation: [0, 0, 0], // This is the objects Rotation vector  (3 because i want 3 Degrees of rotation
      Acceleration: [0, 0, 0], // This is how fast its going
      AttachedObject: attachedObject,
      Timer: 0,
    };

    this.ObjectList.push(object_element);

    return object_element;
  }

  removeObject(object_element) {
    for (let index = 0; index < this.scene.root.children.length; index++) {
      if (this.scene.root.children[index] == object_element.Light) {
        this.scene.root.children.splice(index, 1);
      }
    }
    for (let index = 0; index < this.ObjectList.length; index++) {
      if (this.ObjectList[index] == object_element) {
        this.ObjectList.splice(index, 1);
      }
    }
    delete object_element.Light;
    delete object_element.Model;
  }
}

SceneHandler.TYPE = {
  DUMMYPLAYER: 12,
  PLAYER: 2,
  ENEMYSAUCER: 3,
  GOJO: 4,
  TEXT: 5,
  BULLETPLAYER: 6,
  BULLETENEMY: 7,
  ASTORIOIDLARGE: 1,
  ASTORIOIDSMALL: 8,
  ASTORIOIDMEDIUM: 9,
  ENEMYSHIP: 10,
  SHIELD: 11,
  FIRE: 13,
  WOMP: 14,
  SCRAP: 15,
  MENU: 16,
  STARTGAMEASTORIOID: 17,
  CHANGEMODEASTORIOID: 18,
};
