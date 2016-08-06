'use strict';
var THREEx = THREEx || {};
THREEx.OpenVRUtils = THREEx.OpenVRUtils || {};


/**
 * THREEx.OpenVRUtils.Controller
 * @constructor
 * @param {Number} id - the gamepad id
 * @param {String} controllerType - the controller type
 */
THREEx.OpenVRUtils.Controller = function(id, controllerType) {
  THREE.Object3D.call(this);
  /** @var {Number} id - The controller id */
  this.id = id;
  this.buttons;
  this.gamepad;
  /**
   * @var {Three.Object3d} heldObject - The object currently being held by the
   * controller
   */
  this.heldObject;

  /**
   * @var {String} controllerType - the type the of the controller
   */
  this.controllerType = controllerType || null;
  this.matrixAutoUpdate = false;
  this.standingMatrix = new THREE.Matrix4();
  if (!this.controllerType) {
    getControllerType();
  } else {
    setControllerMappings(this.controllerType);
  }

  /**
   * @var {Object} trackpad - The trackpad interface
   */
  this.trackpad = (function() {
    /**
     * Internal State of the Trackpad axes position
     * @type {Object}
     * @private
     */
    var axes_ = {
      x: 0,
      y: 0
    };

    /**
     * Internal State of the Trackpad
     * @type {Boolean}
     * @private
     */
    var touched_ = false;

    /**
     * Informs of the touch state of the trackpad
     * @public
     * @function
     * @returns {Boolean}
     */
    var isTouched = function() {
      return touched_;
    }

    /**
     * Sets the touch state of the trackpad
     * @var
     * @function
     * @param {Boolean} state - the touch state of the trackpad
     */
    var setTouched = function(state) {
      touched_ = state;
    }

    /**
     * Informs of the {x, y} axes state of the touchpad
     * @var {Function} trackpad.getAxes - gets the axes state of the trackpad
     * @returns {Object}
     */
    var getAxes = function() {
      return axes_;
    }

    /**
     * Sets the axes state of the touchpad
     * @public
     * @param {Number[]} axes
     */
    var setAxes = function(axes) {
      axes_ = {
        x: parseFloat(axes[0]) || 0,
        y: parseFloat(axes[1]) || 0
      }
    }

    return {
      setTouched: setTouched,
      isTouched: isTouched,
      getAxes: getAxes,
      setAxes: setAxes
    };
  })();

  /**
   * Attempts to get the controller type based on the display passed
   * @private
   */
  function getControllerType() {
    return 'Vive Controller';
  }

  /**
   * Sets the mappings for the given controller type
   * @private
   * @param {String} controllerType - The controllers type
   */
  function setMappings(controllerType) {
    try {
      this.BUTTONS = getButtonsForController(controllerType);
      this.MAPPINGS = getMappingsForController(this.BUTTONS);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Gets the buttons for the given controller
   * @param {String} controllerType - The controller type
   * @returns {Object} the buttons mapped to their ids
   */
  function getButtonsForController(controllerType) {
    let buttons = {};

    switch(controllerType) {
      case 'Vive Controller':
        buttons = {
          TRACKPAD: 0,
          TRIGGER: 1,
          GRIP: 2,
          MENU: 3
        };
        break;
      default:
        throw new Error('Button Mappings do not exist for controller');
    }
    return buttons;
  }

  /**
   * Creates a mapping for easy reference
   * @private
   * @param {Object} buttons
   */
  function getMappingsForController(buttons) {
    let mapping = {};
    for (let key in buttons) {
      mapping[key] = key;
    }
    return mapping
  }

  /**
   * Internal Event Emitter
   * binds to Window
   */
  function emit(eventName, detail) {
    var customEvent = new CustomEvent(name, {detail: detail});
    window.dispatchEvent(customEvent);
  }

  /**
   * Creates a button event detail given a button id
   * @param {Number} buttonId - the buttons id
   * @returns {Object} - The button event details
   */
  function createButtonEventDetail(buttonId) {
    return {
      controller_id: this.id,
      button_id: buttonId,
      button_mapping: this.getMappingForButton(buttonId)
    };
  }

  /**
   * Aligns the Vive controllers' button state with the state of the HTML5 Gamepads' buttons it's mapped to.
   * NOTE: This function with call the vive controllers emitter function for necessary state
   * chages
   *
   * @param {Object} gamepad - HTML5 Gamepad Instance
   */
  function setGamepadStates(gamepad) {
    if (!this.buttons) {
      this.buttons = JSON.parse(JSON.stringify(gamepad.buttons));
    }
    gamepad.buttons.map(function(button, idx) {
      var buttonEventDetail = this.createButtonEventDetail(idx);
      if (button.pressed && !this.buttons[idx].isHeld) {
        this.buttons[idx].isHeld = true;
        emit('gamepadButtonPressed', buttonEventDetail)
      }

      if (!button.pressed && this.buttons[idx].isHeld) {
        this.buttons[idx].isHeld = false;
        this.buttons[idx].touchHeld = false;
        if (this.getMappingForButton(idx) === this.MAPPINGS.TRACKPAD) {
          this.trackpad.setTouched(false);
        }
        emit('gamepadButtonReleased', buttonEventDetail);
      }

      if (button.touched) {
        if (this.getMappingForButton(idx) === this.MAPPINGS.TRACKPAD) {
          this.trackpad.setAxes(gamepad.axes);
        }
        if (!this.buttons[idx].isHeld || !this.buttons[idx].touchHeld) {
          this.buttons[idx].touchHeld = true;
          this.buttons[idx].touchWasHeld = true;
          if (this.getMappingForButton(idx) === this.MAPPINGS.TRACKPAD) {
            this.trackpad.setTouched(true);
          }
          emit('gamepadButtonTouched', buttonEventDetail);
        }
      }
      if (!button.touched) {
        this.buttons[idx].touchHeld = false;
        if (this.getMappingForButton(idx) === this.BUTTONS.TRACKPAD) {
          this.trackpad.setTouched(false);
        }
        if (this.buttons[idx].touchWasHeld) {
          this.buttons[idx].touchedWasHeld = false;
          emit('gamepadButtonUntouched', buttonEventDetail);
        }
      }
    }, this);
  }

  function update() {
    requestAnimationFrame( update );
    var gamepad = navigator.getGamepads()[ id ];
    if ( gamepad !== undefined && gamepad.pose !== null ) {
      var pose = gamepad.pose;
      scope.gamepad = gamepad;
      scope.position.fromArray( pose.position );
      scope.quaternion.fromArray( pose.orientation );
      scope.matrix.compose( scope.position, scope.quaternion, scope.scale );
      scope.matrix.multiplyMatrices( scope.standingMatrix, scope.matrix );
      scope.matrixWorldNeedsUpdate = true;
      scope.visible = true;
      scope.setGamepadStates(gamepad);
    } else {
      scope.visible = false;
    }
  }
  update();
}

THREEx.OpenVRUtils.Controller.constructor = THREEx.OpenVRUtils.Controller;
THREEx.OpenVRUtils.Controller.prototype = THREE.Object3d.prototype;

/**
 * Get the mapping name by button id
 * @param {Number} buttonId - the button id
 * @returns {String} mapping
 * @throws {Error} Mapping not found
 */
THREEx.OpenVRUtils.Controller.prototype.getMappingForButton = function(buttonId) {
  for (let key in this.BUTTONS) {
    if (this.BUTTONS.hasOwnProperty(key)) {
      if (parseInt(this.BUTTONS[key], 10) === parseInt(buttonId, 10)) {
        return key;
      }
    }
  }
  throw new Error('Mapping not found');
}

/**
 * Gets the button id by the mapping
 * @param {String} mapping - the mapping name
 * @returns {Number} the button id
 * @throws {Error} Mapping not found
 */
THREEx.OpenVRUtils.Controller.prototype.getIdForMapping = function(mapping) {
  mapping = mapping.toUpperCase();
  if (this.BUTTONS[mapping]) {
    return this.BUTTONS[mapping];
  }
  throw new Error('Mapping not found')
}

/**
 * Unit vector direction of controller
 * @returns {Three.Vector3}
 */
THREEx.OpenVRUtils.Controller.prototype.forward = function() {
  let matrix = new THREE.Matrix4();
  matrix.extractRotation( scope.matrix );

  let direction = new THREE.Vector3( 0, 0, -1 );
  direction.applyMatrix4(matrix);
  return direction;
}

/**
 * Get position from matric decomp
 * @TODO figure out how to actually update position
 * @returns {Three.Vector3}
 */
THREEx.OpenVRUtils.Controller.prototype.getPosition = function() {
  let position = new THREE.Vector3();
  scope.matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
  return position;
}
};

