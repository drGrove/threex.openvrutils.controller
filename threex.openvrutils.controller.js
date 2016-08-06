var THREEx = THREEx || {};
THREEx.OpenVRUtils = THREEx.OpenVRUtils || {};

THREEx.OpenVRUtils.Controller = function (id) {
	THREE.Object3D.call(this);
	this.matrixAutoUpdate = false;
	this.standingMatrix = new THREE.Matrix4();
	this.buttons;
  this.id = id;

  this.sendEvent = function(eventName, detail) {
    var e = new CustomEvent(eventName, {
      detail: detail
    });
    window.dispatchEvent(e);
  }

	var scope = this;
	function update() {
		requestAnimationFrame(update);
		var gamepad = navigator.getGamepads()[id];
		if (!scope.buttons && gamepad) {
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
          var button = JSON.parse(JSON.stringify(scope.buttons[idx]));
          button.isHeld = true;
          scope.sendEvent('gamepadButtonClicked', {
            detail: {
              buttonId: idx,
              controllerId: scope.id,
              button: button
            }
          });
        }
				if (!gamepad.buttons[idx].pressed && scope.buttons[idx].isHeld) {
          var button = JSON.parse(JSON.stringify(scope.buttons[idx]));
          button.isHeld = false;
          scope.sendEvent('gamepadButtonReleased', {
            detail: {
              buttonId: idx,
              controllerId: scope.id,
              button: button
            }
          });				}
			}
		} else {
			scope.visible = false;
		}
	}
	update();
};

THREEx.OpenVRUtils.Controller.prototype = Object.create(THREE.Object3D.prototype);
THREEx.OpenVRUtils.Controller.prototype.constructor = THREEx.OpenVRUtils.Controller;

/**
 * Gives the forward vector of the controller
 * @returns {THREE.Vector3} the forward vector
 */
THREEx.OpenVRUtils.Controller.prototype.forward = function() {
  var matrix = new THREE.Matrix4();
  matrix.extractRotation(this.matrix);

  var direction = new THREE.Vector3(0, 0, -1);
  direction.applyMatrix4(matrix);
  return direction;
};

/**
 * Gives the x,y,z position of the controller in the world space
 * @returns {THREE.Vector3} the x,y,z vector
 */
THREEx.OpenVRUtils.Controller.prototype.getPosition = function() {
  var position = new THREE.Vector3();
  this.matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
  return position;
};

/**
 * Vibrates the controller for an amount of time
 * @param {number} ms - number of milliseconds to vibrate for
 * @throws {GamepadFeatureException}
 */
THREEx.OpenVRUtils.Controller.prototype.vibrate = function(ms) {
  if ("vibrate" in this.gamepad) {
    this.gamepad.vibrate(ms);
  } else {
    throw new THREEx
      .OpenVRUtils
      .ERRORS
      .GamepadFeatureException('Vibration is not enabled on this device');
  }
}

