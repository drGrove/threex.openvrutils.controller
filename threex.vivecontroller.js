THREEx.ViveController = function ( id ) {

	THREE.Object3D.call( this );

	this.matrixAutoUpdate = false;
	this.standingMatrix = new THREE.Matrix4();
	this.buttons;

	var scope = this;

	function update() {

		requestAnimationFrame( update );

		var gamepad = navigator.getGamepads()[ id ];
		if (!scope.buttons) {
			scope.buttons = JSON.parse(JSON.stringify(gamepad.buttons));
		}

		if ( gamepad !== undefined && gamepad.pose !== null ) {

			var pose = gamepad.pose;

			scope.position.fromArray( pose.position );
			scope.quaternion.fromArray( pose.orientation );
			scope.matrix.compose( scope.position, scope.quaternion, scope.scale );
			scope.matrix.multiplyMatrices( scope.standingMatrix, scope.matrix );
			scope.matrixWorldNeedsUpdate = true;

			scope.visible = true;

			for (var j = 0; j < gamepad.buttons.length; ++j) {
				if (gamepad.buttons[j].pressed && !scope.buttons[j].isHeld) {
					scope.buttons[j].isHeld = true;
					var pressedEvent = new CustomEvent('gamepadButtonClicked_' + id, {
						detail: scope.buttons[j],
						id: j
					});
					window.dispatchEvent(pressedEvent);
				}
				if(!gamepad.buttons[j].pressed && scope.buttons[j].isHeld) {
					scope.buttons[j].isHeld = false;
					var releasedEvent = new CustomEvent('gamepadButtonReleased_' + id, {
						detail: scope.buttons[j],
						id: j
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



THREEx.ViveController.prototype = Object.create( THREE.Object3D.prototype );
THREEx.ViveController.prototype.constructor = THREEx.ViveController;
