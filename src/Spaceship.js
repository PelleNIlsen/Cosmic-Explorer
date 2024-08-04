import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import Spaceship from './assets/spaceship.png';
import SpaceshipFire from './assets/spaceship_fire.png';
import RocketSound from './assets/rocket.mp3';
import Planet1 from './assets/planet_1.png';
import Arrow from './assets/arrow.png';
import planetData from './planet_data.json';

const SpaceshipGame = () => {
    const gameRef = useRef(null);

    useEffect(() => {
        const config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight,
            parent: gameRef.current,
            backgroundColor: '#000000',
            scene: {
                preload: preload,
                create: create,
                update: update,
            },
            audio: {
                disableWebAudio: true,
            },
        };

        const game = new Phaser.Game(config);

        let spaceship;
        let spaceshipFire;
        let cursors;
        let wasdKeys;
        let stars = [];
        let planets = [];
        let planetSprites = [];
        let planetInfoBoxes = [];
        let debugText;
        let inventoryText;
        let starGraphics;
        let spaceshipX = 0;
        let spaceshipY = 0;
        let velocity = { x: 0, y: 0 };
        const maxSpeed = 5;
        let rocketSound;
        let extractButton;
        let convertButton;
        let planetArrow;

        let inventory = {
            fuel: 100,
            coal: 0,
            iron: 0,
        };
        let isExtracting = false;
        let extractionTarget = null;

        function preload() {
            this.load.image('spaceship', Spaceship);
            this.load.image('spaceship_fire', SpaceshipFire);
            this.load.audio('rocket', RocketSound);
            this.load.image('planet_1', Planet1);
            this.load.image('arrow', Arrow);
        }

        function create() {
            starGraphics = this.add.graphics({
                fillStyle: { color: 0xffffff },
            });

            // Create a large star field
            const starFieldWidth = config.width * 2;
            const starFieldHeight = config.height * 2;

            for (let i = 0; i < 1000; i++) {
                const x = Phaser.Math.Between(
                    -starFieldWidth / 2,
                    starFieldWidth / 2
                );
                const y = Phaser.Math.Between(
                    -starFieldHeight / 2,
                    starFieldHeight / 2
                );
                const depth = Phaser.Math.FloatBetween(0.1, 1);
                stars.push({ x, y, depth });
            }

            // Add a planet using the data from JSON
            const planetKeys = Object.keys(planetData);
            if (planetKeys.length > 0) {
                const planetKey = planetKeys[0]; // Use the first planet in the JSON
                const planet = planetData[planetKey];
                const x = Phaser.Math.Between(-starFieldWidth, starFieldWidth);
                const y = Phaser.Math.Between(
                    -starFieldHeight,
                    starFieldHeight
                );
                const scale = Phaser.Math.FloatBetween(0.5, 1.5);
                planets.push({ ...planet, x, y, scale });
            }

            // Create planet sprites and info boxes
            planets.forEach((planet) => {
                const sprite = this.add
                    .image(0, 0, planet.image)
                    .setScale(planet.scale);
                sprite.setVisible(false);
                planetSprites.push(sprite);

                const infoBox = this.add.text(0, 0, '', {
                    font: '16px Arial',
                    fill: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 10, y: 5 },
                });
                infoBox.setVisible(false);
                planetInfoBoxes.push(infoBox);
            });

            planetArrow = this.add.image(
                config.width / 2,
                config.height / 2,
                'arrow'
            );
            planetArrow.setOrigin(0.5, 0.5);
            planetArrow.setAlpha(0.7);
            planetArrow.setVisible(false);

            // Add spaceship at the center of the screen
            spaceship = this.add.image(
                config.width / 2,
                config.height / 2,
                'spaceship'
            );
            spaceshipFire = this.add.image(
                config.width / 2,
                config.height / 2,
                'spaceship_fire'
            );
            spaceshipFire.setVisible(false);

            spaceship.setOrigin(0.5);
            spaceshipFire.setOrigin(0.5);

            // Set up keyboard controls
            cursors = this.input.keyboard.createCursorKeys();
            wasdKeys = this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D,
            });

            rocketSound = this.sound.add('rocket', { loop: true, volume: 0.5 });

            // Add debug text to bottom right
            debugText = this.add
                .text(config.width - 10, config.height - 10, '', {
                    font: '14px Arial',
                    fill: '#00ff00',
                    align: 'right',
                })
                .setOrigin(1, 1);

            // Add inventory text to top left
            inventoryText = this.add.text(10, 10, '', {
                font: '16px Arial',
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 },
            });

            // Create extract button (initially hidden)
            extractButton = this.add
                .text(
                    config.width / 2,
                    config.height - 50,
                    'Extract Minerals',
                    {
                        font: '20px Arial',
                        fill: '#ffffff',
                        backgroundColor: '#4a4a4a',
                        padding: { x: 10, y: 5 },
                    }
                )
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerdown', startExtraction);
            extractButton.setVisible(false);

            // Create convert button
            convertButton = this.add
                .text(150, 10, 'Convert Coal to Fuel', {
                    font: '16px Arial',
                    fill: '#ffffff',
                    backgroundColor: '#4a4a4a',
                    padding: { x: 10, y: 5 },
                })
                .setInteractive()
                .on('pointerdown', convertCoalToFuel);

            window.addEventListener('resize', () => {
                game.scale.resize(window.innerWidth, window.innerHeight);
            });
        }

        function update(time, delta) {
            // Handle spaceship rotation
            if (cursors.left.isDown || wasdKeys.left.isDown) {
                spaceship.angle -= 3;
                spaceshipFire.angle -= 3;
            } else if (cursors.right.isDown || wasdKeys.right.isDown) {
                spaceship.angle += 3;
                spaceshipFire.angle += 3;
            }

            // Handle spaceship acceleration
            const isAccelerating = cursors.up.isDown || wasdKeys.up.isDown;
            if (isAccelerating && inventory.fuel > 0) {
                const acceleration = 0.1;
                velocity.x += Math.cos(spaceship.rotation) * acceleration;
                velocity.y += Math.sin(spaceship.rotation) * acceleration;

                // Switch to fire sprite
                spaceship.setVisible(false);
                spaceshipFire.setVisible(true);

                // Play rocket sound if it's not already playing
                if (!rocketSound.isPlaying) {
                    rocketSound.play();
                }

                // Consume fuel
                inventory.fuel -= 0.01;
            } else {
                if (cursors.down.isDown || wasdKeys.down.isDown) {
                    const deceleration = 0.05;
                    velocity.x -= Math.cos(spaceship.rotation) * deceleration;
                    velocity.y -= Math.sin(spaceship.rotation) * deceleration;
                } else {
                    // Apply drag when not accelerating
                    velocity.x *= 0.98;
                    velocity.y *= 0.98;
                }

                // Switch to normal sprite
                spaceship.setVisible(true);
                spaceshipFire.setVisible(false);

                // Stop rocket sound if it's playing
                if (rocketSound.isPlaying) {
                    rocketSound.stop();
                }
            }

            // Cap max speed
            const speed = Math.sqrt(
                velocity.x * velocity.x + velocity.y * velocity.y
            );
            if (speed > maxSpeed) {
                velocity.x = (velocity.x / speed) * maxSpeed;
                velocity.y = (velocity.y / speed) * maxSpeed;
            }

            // Update spaceship position in the "infinite" space
            spaceshipX += velocity.x;
            spaceshipY += velocity.y;

            spaceship.x = config.width / 2;
            spaceship.y = config.height / 2;
            spaceshipFire.x = config.width / 2;
            spaceshipFire.y = config.height / 2;

            // Update and draw stars
            starGraphics.clear();
            stars.forEach((star) => {
                // Calculate star position relative to spaceship
                let relativeX = star.x - spaceshipX * star.depth;
                let relativeY = star.y - spaceshipY * star.depth;

                // Wrap star positions
                const fieldWidth = config.width * 2;
                const fieldHeight = config.height * 2;
                relativeX =
                    (((relativeX % fieldWidth) + fieldWidth) % fieldWidth) -
                    fieldWidth / 2;
                relativeY =
                    (((relativeY % fieldHeight) + fieldHeight) % fieldHeight) -
                    fieldHeight / 2;

                // Draw star
                const size = Math.max(1, Math.floor(star.depth * 3));
                starGraphics.fillRect(
                    relativeX + config.width / 2,
                    relativeY + config.height / 2,
                    size,
                    size
                );
            });

            // Update and draw planets
            let nearPlanet = false;
            let nearestPlanetCoords = null;
            let nearestPlanetDistance = Infinity;
            planets.forEach((planet, index) => {
                let relativeX = planet.x - spaceshipX;
                let relativeY = planet.y - spaceshipY;

                // Check if planet is within visible range
                if (
                    Math.abs(relativeX) < config.width &&
                    Math.abs(relativeY) < config.height
                ) {
                    planetSprites[index].setVisible(true);
                    planetSprites[index].setPosition(
                        relativeX + config.width / 2,
                        relativeY + config.height / 2
                    );

                    // Check if spaceship is within 200px of the planet
                    const distance = Math.sqrt(
                        relativeX * relativeX + relativeY * relativeY
                    );
                    if (distance < 200) {
                        nearPlanet = true;
                        extractionTarget = planet;
                        // Show info box
                        const infoText = `${planet.name}\nCoal: ${Math.round(
                            planet.resources.coal
                        )} tons\nIron: ${Math.round(
                            planet.resources.iron
                        )} tons`;
                        planetInfoBoxes[index].setText(infoText);
                        planetInfoBoxes[index].setVisible(true);
                        planetInfoBoxes[index].setPosition(
                            relativeX + config.width / 2,
                            relativeY +
                                config.height / 2 -
                                planetSprites[index].height / 2 -
                                60
                        );

                        // Show extract button
                        extractButton.setVisible(true);
                    } else {
                        planetInfoBoxes[index].setVisible(false);
                    }

                    // Update nearest planet info for debug text and arrow
                    if (distance < nearestPlanetDistance) {
                        nearestPlanetDistance = distance;
                        nearestPlanetCoords = { x: relativeX, y: relativeY };
                    }
                } else {
                    planetSprites[index].setVisible(false);
                    planetInfoBoxes[index].setVisible(false);
                }
            });

            // Update planet pointer arrow
            if (nearestPlanetCoords) {
                planetArrow.setVisible(true);

                // Calculate angle to planet
                let angle = Math.atan2(
                    nearestPlanetCoords.y,
                    nearestPlanetCoords.x
                );
                planetArrow.setRotation(angle);

                // Calculate arrow position (50 pixels from center of screen)
                let arrowDistance = Math.min(50, nearestPlanetDistance / 2);
                let arrowX = config.width / 2 + Math.cos(angle) * arrowDistance;
                let arrowY =
                    config.height / 2 + Math.sin(angle) * arrowDistance;
                planetArrow.setPosition(arrowX, arrowY);

                // Scale arrow based on distance (smaller when farther)
                let scale = Math.max(
                    0.5,
                    Math.min(2, 200 / nearestPlanetDistance)
                );
                planetArrow.setScale(scale);
            } else {
                planetArrow.setVisible(false);
            }

            if (!nearPlanet) {
                extractButton.setVisible(false);
                isExtracting = false;
                extractionTarget = null;
            }

            // Handle extraction
            if (isExtracting && extractionTarget) {
                if (extractionTarget.resources.coal > 0) {
                    extractionTarget.resources.coal -= 0.1;
                    inventory.coal += 0.1;
                }
                if (extractionTarget.resources.iron > 0) {
                    extractionTarget.resources.iron -= 0.05;
                    inventory.iron += 0.05;
                }
            }

            // Stop extraction if moving
            if (speed > 0.1) {
                isExtracting = false;
            }

            // Update inventory text
            inventoryText.setText(
                `Fuel: ${Math.round(inventory.fuel)}\nCoal: ${Math.round(
                    inventory.coal
                )}\nIron: ${Math.round(inventory.iron)}`
            );

            // Update debug text
            let debugInfo = [
                `Position: (${Math.round(spaceshipX)}, ${Math.round(
                    spaceshipY
                )})`,
                `Velocity: (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(
                    2
                )})`,
                `Rotation: ${Math.round(spaceship.angle)}°`,
                `Speed: ${speed.toFixed(2)}`,
                `FPS: ${Math.round(this.game.loop.actualFps)}`,
                `Accelerating: ${isAccelerating}`,
            ];

            if (nearestPlanetCoords) {
                debugInfo.push(
                    `Nearest Planet: (${nearestPlanetCoords.x}, ${nearestPlanetCoords.y})`
                );
            } else {
                debugInfo.push('No planet in range');
            }

            debugText.setText(debugInfo);
        }

        function startExtraction() {
            isExtracting = true;
        }

        function convertCoalToFuel() {
            if (inventory.coal >= 1) {
                inventory.coal -= 1;
                inventory.fuel += 10;
            }
        }

        return () => {
            game.destroy(true);
            window.removeEventListener('resize', () => {});
        };
    }, []);

    return <div ref={gameRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default SpaceshipGame;
