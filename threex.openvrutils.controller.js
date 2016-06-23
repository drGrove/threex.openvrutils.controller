THREEx = THREEx || {};
THREEx.OpenVRUtils = THREEx.OpenVRUtils || {};

THREEx.OpenVRUtils.Controller = function ( id ) {
	THREE.Object3D.call( this );
	this.matrixAutoUpdate = false;
	this.standingMatrix = new THREE.Matrix4();
	this.buttons;
  this.id = id;
	var scope = this;

  /**
   * Gives the forward vector of the controller
   * @returns {THREE.Vector3} the forward vector
   */
  this.forward = function() {
    var matrix = new THREE.Matrix4();
    matrix.extractRotation(scope.matrix);

    var direction = new THREE.Vector3(0, 0, -1);
    direction.applyMatrix4(matrix);
    return direction;
  };

  /**
   * Gives the x,y,z position of the controller in the world space
   * @returns {THREE.Vector3} the x,y,z vector
   */
  this.getPosition = function() {
    var position = new THREE.Vector3();
    scope.matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
    return position;
  };

  /**
   * Vibrates the controller for an amount of time
   * @param {number} ms - number of milliseconds to vibrate for
   * @throws {GamepadFeatureException}
   */
  this.vibrate = function(ms) {
    if ("vibrate" in this.gamepad) {
      this.gamepad.vibrate(ms);
    } else {
      throw new THREEx
        .OpenVRUtils
        .ERRORS
        .GamepadFeatureException('Vibration is not enabled on this device');
    }
  }

	function update() {
		requestAnimationFrame(update);

		var gamepad = navigator.getGamepads()[id];
		if (!scope.buttons) {
			scope.buttons = JSON.parse(JSON.stringify(gamepad.buttons));
		}

		if (gamepad !== undefined && gamepad.pose !== null) {
			var pose = gamepad.pose;

			scope.position.fromArray(pose.position);
			scope.quaternion.fromArray(pose.orientation);
			scope.matrix.compose(scope.position, scope.quaternion, scope.scale);
			scope.matrix.multiplyMatrices(scope.standingMatrix, scope.matrix);
			scope.matrixWorldNeedsUpdate = true;

			scope.visible = true;

			for (var idx = 0; idx < gamepad.buttons.length; ++idx) {
				if (gamepad.buttons[idx].pressed && !scope.buttons[idx].isHeld) {
					scope.buttons[idx].isHeld = true;
					var pressedEvent = new CustomEvent('gamepadButtonClicked', {
						detail: {
              buttonId: idx,
              controllerId: scope.id,
              button: scope.buttons[idx]
            }
					});
					window.dispatchEvent(pressedEvent);
				}
				if (!gamepad.buttons[idx].pressed && scope.buttons[idx].isHeld) {
					scope.buttons[idx].isHeld = false;
					var releasedEvent = new CustomEvent('gamepadButtonReleased', {
						detail: {
              buttonId: idx,
              controllerId: scope.id,
              button: scope.buttons[idx]
            }
					});
					window.dispatchEvent(releasedEvent);
				}
			}
		} else {
			scope.visible = false;
		}
	}

	update();
};

THREEx.OpenVRUtils.Controller.prototype = Object.create(THREE.Object3D.prototype);
THREEx.OpenVRUtils.Controller.prototype.constructor = THREEx.OpenVRUtils.Controller;
