import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import planetData from './planet_data.json';
import levelData from './level_data.json';
import journalInfo from './journal_info.json';
import shipUpgrades from './ship_upgrades.json';
import { spawnEnemyGroup } from './components/Enemy';
import { preload } from './helpers/loadAssets';
import { spawnPlanet } from './components/Planet';

const SpaceshipGame = () => {
    const gameRef = useRef(null);

    useEffect(() => {
        // Game Config
        const config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight,
            parent: gameRef.current,
            backgroundColor: '#000000',
            scene: [
                {
                    key: 'MainScene',
                    preload: preload,
                    create: create,
                    update: update,
                },
            ],
            audio: {
                disableWebAudio: true,
            },
        };

        const game = new Phaser.Game(config);

        // Declare various variables for the game
        let spaceship;
        let spaceshipFire;
        let spaceshipX = 0;
        let spaceshipY = 0;
        let velocity = { x: 0, y: 0 };
        let maxSpeed = 5;
        let rocketSound;
        let spaceshipLevel = 1;
        let currentSpeedLevel = 1;
        let canShoot;
        let instructionText;

        let isInvulnerable = false;
        const invulnerabilityDuration = 1000;
        let lastHitTime = 0;

        let cursors;
        let wasdKeys;

        let stars = [];
        let planets = [];
        let planetSprites = [];
        let planetInfoBoxes = [];
        let starGraphics;

        let debugText;
        let inventoryText;

        let extractButton;
        let convertButton;
        let levelUpButton;
        let levelUpButtonText = 'Level up';
        let journalButton;
        let journalOpen = false;
        let journalPanel;
        let journalEntries = [];
        let upgradeButton;
        let upgradePanel;
        let levelUpContainer;
        let convertButtonText;
        let levelUpIcon;
        let levelUpText;
        let tooltip;

        let planetArrow;

        let enemies = [];
        let enemyBullets = [];
        const enemyFireRateMin = 3000;
        const enemyFireRateMax = 7000;
        const enemySpeed = 1;
        const bulletSpeed = 5;
        const ENEMY_RADIUS = 20;
        const ENEMY_SPAWN_INTERVAL = 180000;
        let lastEnemySpawnTime = 0;
        let explosionSound;

        let playerBullets;
        let currentBulletSpeedLevel = 1;
        let playerBulletSpeed = 10;
        let currentFireRateLevel = 1;
        let playerFireRate = 1000;
        let lastFired = 0;
        let spaceKey;

        let inventory = {};
        let isExtracting = false;
        let extractionTarget = null;

        let lastPlanetSpawnTime = 0;
        const planetSpawnInterval = 5000;
        const planetSpawnChance = 1;
        const maxPlanets = 10;
        const planetDespawnDistance = 3000;
        const minPlanetDistance = 1000;
        const maxPlanetDistance = 2500;

        let debugPanel;
        let debugButton;
        let isDebugPanelOpen = false;
        let shootSound;
        let hitSound;

        function create() {
            explosionSound = this.sound.add('explosion_sound');
            shootSound = this.sound.add('shoot');
            hitSound = this.sound.add('hit');

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

            // Add an arrow pointing towards planets
            planetArrow = this.add.image(
                config.width / 2,
                config.height / 2,
                'arrow'
            );
            planetArrow.setOrigin(0.5, 0.5);
            planetArrow.setAlpha(0.7);
            planetArrow.setVisible(false);
            planets = [];
            planetSprites = [];
            planetInfoBoxes = [];

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

            instructionText = this.add.bitmapText(
                config.width - 10,
                10,
                'icons',
                'W, A, S, D or ARROWS to move\nSPACE to shoot',
                16
            );
            instructionText.setOrigin(1, 0);
            instructionText.setDepth(1000);
            instructionText.setTint(0xffffff);

            // Add inventory text to top left
            inventoryText = this.add.bitmapText(10, 10, 'icons', '', 30);
            inventoryText.setTint(0xffffff);

            // Initialize inventory with fuel
            inventory = { fuel: 100 };

            // Create extract button (initially hidden)
            extractButton = this.add
                .image(config.width / 2, config.height - 50, 'extract_icon')
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerdown', startExtraction)
                .on('pointerover', function (pointer) {
                    const tooltipText = 'Extract minerals';
                    showTooltip(tooltip, pointer.x, pointer.y, tooltipText);
                })
                .on('pointerout', hideTooltip)
                .on('pointermove', function (pointer) {
                    showTooltip(pointer.x, pointer.y, 'Extract minerals');
                });
            extractButton.setVisible(false);

            // Create convert button
            convertButton = this.add
                .image(50, config.height / 2 - 120, 'fuel_icon')
                .setInteractive()
                .on('pointerdown', convertCoalToFuel)
                .on('pointerover', function (pointer) {
                    const tooltipText = '1 Coal = 10 Fuel';
                    showTooltip(pointer.x, pointer.y, tooltipText);
                })
                .on('pointerout', hideTooltip)
                .on('pointermove', function (pointer) {
                    showTooltip(pointer.x, pointer.y, '1 Coal = 10 Fuel');
                });

            updateLevelUpButtonText();

            levelUpContainer = this.add.container(50, config.height / 2 + 120);

            levelUpIcon = this.add
                .image(0, 0, 'level_up_icon')
                .setInteractive()
                .on('pointerdown', levelUp)
                .on('pointerover', function (pointer) {
                    const tooltipText = getLevelUpTooltipText();
                    showTooltip(pointer.x, pointer.y, tooltipText);
                })
                .on('pointerout', hideTooltip)
                .on('pointermove', function (pointer) {
                    showTooltip(pointer.x, pointer.y, getLevelUpTooltipText());
                });

            levelUpText = this.add
                .text(0, levelUpIcon.height / 2 + 5, '', {
                    font: '14px Arial',
                    fill: '#ffffff',
                    align: 'center',
                })
                .setOrigin(0.5, 0);

            levelUpContainer.add([levelUpIcon, levelUpText]);

            // Add journal button
            journalButton = this.add
                .image(50, config.height / 2 - 40, 'journal_icon')
                .setInteractive()
                .on('pointerdown', () => toggleJournal.call(this))
                .on('pointerover', function (pointer) {
                    const tooltipText = 'Open planet journal';
                    showTooltip(pointer.x, pointer.y, tooltipText);
                })
                .on('pointerout', hideTooltip)
                .on('pointermove', function (pointer) {
                    showTooltip(pointer.x, pointer.y, 'Open planet journal');
                });

            // Add upgrade button
            upgradeButton = this.add
                .image(50, config.height / 2 + 40, 'upgrade_icon')
                .setInteractive()
                .on('pointerdown', () => toggleUpgradePanel(this))
                .on('pointerover', function (pointer) {
                    const tooltipText = 'Open ship upgrades';
                    showTooltip(pointer.x, pointer.y, tooltipText);
                })
                .on('pointerout', hideTooltip)
                .on('pointermove', function (pointer) {
                    showTooltip(pointer.x, pointer.y, 'Open ship upgrades');
                });

            tooltip = this.add.text(0, 0, '', {
                backgroundColor: '#333333',
                padding: { left: 5, right: 5, top: 5, bottom: 5 },
                fontSize: '14px',
                fill: '#ffffff',
            });
            tooltip.setDepth(1000);
            tooltip.setVisible(false);

            // Add debug button
            debugButton = this.add
                .text(10, config.height - 40, 'Debug', {
                    font: '16px Arial',
                    fill: '#ffffff',
                    backgroundColor: '#ff0000',
                    padding: { x: 10, y: 5 },
                })
                .setInteractive()
                .on('pointerdown', () => toggleDebugPanel(this));

            debugButton.setVisible(false);

            createDebugPanel(this);

            enemyBullets = this.add.group();
            playerBullets = this.add.group();

            spaceKey = this.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.SPACE
            );

            this.input.keyboard.on('keyup-SPACE', () => {
                canShoot = true;
            });

            spawnInitialCoalPlanet(this, config);

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
            if (
                isAccelerating &&
                (inventory.fuel === undefined || inventory.fuel > 0)
            ) {
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
                inventory.fuel = (inventory.fuel || 100) - 0.01;
            } else {
                if (
                    cursors.down.isDown ||
                    (wasdKeys.down.isDown &&
                        (inventory.fuel === undefined || inventory.fuel > 0))
                ) {
                    const deceleration = 0.05;
                    velocity.x -= Math.cos(spaceship.rotation) * deceleration;
                    velocity.y -= Math.sin(spaceship.rotation) * deceleration;

                    // Consume fuel
                    inventory.fuel = (inventory.fuel || 100) - 0.01;
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

            // Check if it's time to potentially spawn a new planet
            if (time - lastPlanetSpawnTime > planetSpawnInterval) {
                lastPlanetSpawnTime = time;
                if (
                    Math.random() < planetSpawnChance &&
                    planets.length < maxPlanets
                ) {
                    spawnPlanet(
                        this,
                        config,
                        minPlanetDistance,
                        maxPlanetDistance,
                        spaceshipX,
                        spaceshipY,
                        planetData,
                        planets,
                        planetSprites,
                        planetInfoBoxes
                    );
                }
            }

            if (
                Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('P'))
            ) {
                toggleDebugPanel(this);
            }

            if (time - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) {
                spawnEnemyGroup(
                    this,
                    spaceshipX,
                    spaceshipY,
                    config,
                    enemies,
                    enemyFireRateMin,
                    enemyFireRateMax
                );
                lastEnemySpawnTime = time;
            }

            // Update and draw planets
            let nearPlanet = false;
            let nearestPlanetCoords = null;
            let nearestPlanetDistance = Infinity;
            for (let i = planets.length - 1; i >= 0; i--) {
                const planet = planets[i];
                let relativeX = planet.x - spaceshipX;
                let relativeY = planet.y - spaceshipY;

                // Check if planet is too far away and should despawn
                const distanceFromShip = Math.sqrt(
                    relativeX * relativeX + relativeY * relativeY
                );
                if (distanceFromShip > planetDespawnDistance) {
                    planets.splice(i, 1);
                    planetSprites[i].destroy();
                    planetSprites.splice(i, 1);
                    planetInfoBoxes[i].destroy();
                    planetInfoBoxes.splice(i, 1);
                    continue;
                }

                // Check if planet is within visible range
                if (
                    Math.abs(relativeX) < config.width &&
                    Math.abs(relativeY) < config.height
                ) {
                    planetSprites[i].setVisible(true);
                    planetSprites[i].setPosition(
                        relativeX + config.width / 2,
                        relativeY + config.height / 2
                    );

                    const distance = Math.sqrt(
                        relativeX * relativeX + relativeY * relativeY
                    );
                    if (distance < 200) {
                        nearPlanet = true;
                        extractionTarget = planet;

                        // Dynamic info box text over planet
                        let infoText = `${planet.name}\n`;
                        infoText += `Level ${planet.level}\n`;
                        Object.entries(planet.resources).forEach(
                            ([resource, amount]) => {
                                if (amount > 0) {
                                    infoText += `${
                                        resource.charAt(0).toUpperCase() +
                                        resource.slice(1)
                                    }: ${Math.round(amount)} tons\n`;
                                }
                            }
                        );
                        planetInfoBoxes[i].setText(infoText.trim());
                        planetInfoBoxes[i].setVisible(true);
                        planetInfoBoxes[i].setPosition(
                            relativeX + config.width / 2,
                            relativeY +
                                config.height / 2 -
                                planetSprites[i].height / 2 -
                                60
                        );

                        extractButton.setVisible(true);
                    } else {
                        planetInfoBoxes[i].setVisible(false);
                    }

                    // Update nearest planet info for debug text and arrow
                    if (distance < nearestPlanetDistance) {
                        nearestPlanetDistance = distance;
                        nearestPlanetCoords = { x: relativeX, y: relativeY };
                    }
                } else {
                    planetSprites[i].setVisible(false);
                    planetInfoBoxes[i].setVisible(false);
                }
            }

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
                Object.entries(extractionTarget.resources).forEach(
                    ([resource, amount]) => {
                        if (amount > 0) {
                            const extractionRate =
                                resource === 'coal' ? 0.1 : 0.05;
                            extractionTarget.resources[resource] -=
                                extractionRate;
                            inventory[resource] =
                                (inventory[resource] || 0) + extractionRate;
                        }
                    }
                );
            }

            // Stop extraction if moving
            if (speed > 0.1) {
                isExtracting = false;
            }

            // Update inventory text
            let inventoryDisplay = '';
            inventoryDisplay += `Level: ${spaceshipLevel}\n`;
            Object.entries(inventory).forEach(([resource, amount]) => {
                if (amount > 0) {
                    inventoryDisplay += `${
                        resource.charAt(0).toUpperCase() + resource.slice(1)
                    }: ${Math.round(amount)}\n`;
                }
            });
            inventoryText.setText(inventoryDisplay.trim());

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

            // For every enemy if spawned
            enemies.forEach((enemy, index) => {
                const enemyRealX = enemy.getData('realX');
                const enemyRealY = enemy.getData('realY');
                const enemyType = enemy.getData('type');

                // Calculate angle and distance to player
                const angle = Phaser.Math.Angle.Between(
                    enemyRealX,
                    enemyRealY,
                    spaceshipX,
                    spaceshipY
                );
                const distanceToPlayer = Phaser.Math.Distance.Between(
                    enemyRealX,
                    enemyRealY,
                    spaceshipX,
                    spaceshipY
                );

                let newX = enemyRealX;
                let newY = enemyRealY;

                if (enemyType === 'charger') {
                    // Charger behavior: move towards player
                    newX += Math.cos(angle) * enemySpeed;
                    newY += Math.sin(angle) * enemySpeed;
                } else if (enemyType === 'sniper') {
                    // Sniper behavior: maintain distance of 500
                    const targetDistance = 500;
                    if (Math.abs(distanceToPlayer - targetDistance) > 10) {
                        const moveAngle =
                            distanceToPlayer > targetDistance
                                ? angle
                                : angle + Math.PI;
                        newX += Math.cos(moveAngle) * enemySpeed;
                        newY += Math.sin(moveAngle) * enemySpeed;
                    }
                }

                // Check collision with other enemies
                enemies.forEach((otherEnemy, otherIndex) => {
                    if (index !== otherIndex) {
                        const dx = newX - otherEnemy.getData('realX');
                        const dy = newY - otherEnemy.getData('realY');
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < ENEMY_RADIUS * 2) {
                            const pushAngle = Math.atan2(dy, dx);
                            const pushDistance = ENEMY_RADIUS * 2 - distance;
                            newX += Math.cos(pushAngle) * pushDistance * 0.5;
                            newY += Math.sin(pushAngle) * pushDistance * 0.5;
                        }
                    }
                });

                // Update enemy position
                enemy.setData('realX', newX);
                enemy.setData('realY', newY);

                // Update on-screen position
                enemy.x = newX - spaceshipX + config.width / 2;
                enemy.y = newY - spaceshipY + config.height / 2;

                // Rotate to face player
                enemy.rotation = angle + Math.PI / 2;

                // Enemy shooting logic
                if (
                    time >
                    enemy.getData('lastFired') + enemy.getData('fireRate')
                ) {
                    enemy.setData('lastFired', time);
                    const bullet = this.add.image(enemy.x, enemy.y, 'bullet');
                    bullet.setData('realX', newX);
                    bullet.setData('realY', newY);
                    bullet.setData('angle', angle);
                    enemyBullets.add(bullet);
                    shootSound.play({ volume: 0.2 });

                    // Assign a new random fire rate for next shot
                    enemy.setData(
                        'fireRate',
                        Phaser.Math.Between(enemyFireRateMin, enemyFireRateMax)
                    );
                }
            });

            // Update enemy bullet positions
            enemyBullets.children.entries.forEach((bullet) => {
                const bulletRealX = bullet.getData('realX');
                const bulletRealY = bullet.getData('realY');
                const bulletAngle = bullet.getData('angle');

                bullet.setData(
                    'realX',
                    bulletRealX + Math.cos(bulletAngle) * bulletSpeed
                );
                bullet.setData(
                    'realY',
                    bulletRealY + Math.sin(bulletAngle) * bulletSpeed
                );

                bullet.x =
                    bullet.getData('realX') - spaceshipX + config.width / 2;
                bullet.y =
                    bullet.getData('realY') - spaceshipY + config.height / 2;

                // Remove bullets that are too far from the player
                if (
                    Phaser.Math.Distance.Between(
                        bulletRealX,
                        bulletRealY,
                        spaceshipX,
                        spaceshipY
                    ) > 2000
                ) {
                    bullet.destroy();
                }
            });

            // Check for collisions between player and enemy bullets
            playerBullets.children.entries.forEach((bullet) => {
                const bulletRealX = bullet.getData('realX');
                const bulletRealY = bullet.getData('realY');
                const bulletAngle = bullet.getData('angle');

                bullet.setData(
                    'realX',
                    bulletRealX + Math.cos(bulletAngle) * playerBulletSpeed
                );
                bullet.setData(
                    'realY',
                    bulletRealY + Math.sin(bulletAngle) * playerBulletSpeed
                );

                bullet.x =
                    bullet.getData('realX') - spaceshipX + config.width / 2;
                bullet.y =
                    bullet.getData('realY') - spaceshipY + config.height / 2;

                // Remove bullets that are too far from the player
                if (
                    Phaser.Math.Distance.Between(
                        bulletRealX,
                        bulletRealY,
                        spaceshipX,
                        spaceshipY
                    ) > 2000
                ) {
                    bullet.destroy();
                }

                // Check for collisions between this bullet and enemies
                enemies.forEach((enemy, index) => {
                    if (
                        Phaser.Geom.Intersects.RectangleToRectangle(
                            bullet.getBounds(),
                            enemy.getBounds()
                        )
                    ) {
                        bullet.destroy();
                        createExplosion(this, enemy.x, enemy.y);
                        enemy.destroy();
                        enemies.splice(index, 1);
                    }
                });
            });

            // Check for shooting
            if (
                spaceKey.isDown &&
                canShoot &&
                time > lastFired + playerFireRate
            ) {
                shoot(this);
                lastFired = time;
                canShoot = false;
            }

            // Check for collisions between player and enemy bullets
            enemyBullets.children.entries.forEach((bullet) => {
                if (
                    Phaser.Geom.Intersects.RectangleToRectangle(
                        bullet.getBounds(),
                        spaceship.getBounds()
                    )
                ) {
                    if (!isInvulnerable) {
                        hitPlayer(this);
                    }
                    bullet.destroy();
                }
            });

            // Check for direct collisions between player and enemies
            enemies.forEach((enemy) => {
                if (
                    Phaser.Geom.Intersects.RectangleToRectangle(
                        enemy.getBounds(),
                        spaceship.getBounds()
                    )
                ) {
                    if (!isInvulnerable) {
                        hitPlayer(this);
                    }
                }
            });

            // Update invulnerability state
            if (
                isInvulnerable &&
                time - lastHitTime > invulnerabilityDuration
            ) {
                isInvulnerable = false;
                spaceship.clearTint();
                spaceshipFire.clearTint();
            }
        }

        function createExplosion(scene, x, y) {
            const explosion = scene.add.image(x, y, 'explosion');
            explosion.setScale(3);
            explosionSound.play({ volume: 1 });

            explosion.setAlpha(0.8);

            scene.tweens.add({
                targets: explosion,
                alpha: 0,
                scale: 2,
                duration: 200,
                onComplete: () => {
                    explosion.destroy();
                },
            });
        }

        function shoot(scene) {
            const time = scene.time.now;
            if (time > lastFired + playerFireRate) {
                const bullet = scene.add.image(
                    config.width / 2,
                    config.height / 2,
                    'player_bullet'
                );
                bullet.setData('realX', spaceshipX);
                bullet.setData('realY', spaceshipY);
                bullet.setData('angle', spaceship.rotation);
                bullet.setRotation(spaceship.rotation);
                playerBullets.add(bullet);

                lastFired = time;

                shootSound.play({ volume: 0.5 });
            }
        }

        function startExtraction() {
            if (extractionTarget.level > spaceshipLevel) return;
            isExtracting = true;
        }

        function convertCoalToFuel() {
            if (inventory.coal >= 1) {
                inventory.coal -= 1;
                inventory.fuel = (inventory.fuel || 0) + 10;
            }
        }

        function levelUp() {
            const levelRequirement = levelData[spaceshipLevel].requirement;
            const resources = levelRequirement.resources;
            const amounts = levelRequirement.amounts;

            // Check if the user has enough resources
            for (let i = 0; i < resources.length; i++) {
                if ((inventory[resources[i]] || 0) < amounts[i]) {
                    return; // If not enough resources, exit the function
                }
            }

            // Subtract the required resources from the inventory
            for (let i = 0; i < resources.length; i++) {
                inventory[resources[i]] -= amounts[i];
            }

            // Level up the spaceship
            spaceshipLevel += 1;

            // Update the level-up button text
            updateLevelUpButtonText();

            // Update the inventory text
            updateInventoryText();
        }

        function updateLevelUpButtonText() {
            const levelRequirement = levelData[spaceshipLevel].requirement;
            const resources = levelRequirement.resources
                .map((resource, index) => {
                    return `${levelRequirement.amounts[index]} ${resource}`;
                })
                .join(', ');
            levelUpButtonText = `Level up: ${resources}`;
            if (levelUpButton) {
                levelUpButton.setText(levelUpButtonText);
            }
        }

        function updateInventoryText() {
            let inventoryDisplay = '';
            Object.entries(inventory).forEach(([resource, amount]) => {
                if (amount > 0) {
                    inventoryDisplay += `${
                        resource.charAt(0).toUpperCase() + resource.slice(1)
                    }: ${Math.round(amount)}\n`;
                }
            });
            inventoryDisplay += `Level: ${spaceshipLevel}\n`; // Add spaceship level to the inventory display
            inventoryDisplay += `Speed Level: ${currentSpeedLevel}\n`;
            inventoryText.setText(inventoryDisplay.trim());
        }

        function openJournal() {
            journalOpen = true;

            // Create journal panel
            journalPanel = this.add.container(
                config.width / 2,
                config.height / 2
            );

            const background = this.add.rectangle(
                0,
                0,
                600,
                400,
                0x000000,
                0.8
            );
            background.setOrigin(0.5);
            journalPanel.add(background);

            const title = this.add.text(0, -180, 'Planet Journal', {
                font: '24px Arial',
                fill: '#ffffff',
            });
            title.setOrigin(0.5);
            journalPanel.add(title);

            const closeButton = this.add
                .text(270, -180, 'X', { font: '20px Arial', fill: '#ffffff' })
                .setInteractive()
                .on('pointerdown', () => closeJournal.call(this));
            journalPanel.add(closeButton);

            // Create scrollable area for journal entries
            const mask = this.make.graphics();
            mask.fillRect(
                config.width / 2 - 280,
                config.height / 2 - 150,
                560,
                300
            );

            const scrollablePanel = this.add.container(0, 0);
            scrollablePanel.setMask(
                new Phaser.Display.Masks.GeometryMask(this, mask)
            );

            let yOffset = -100;
            Object.values(journalInfo).forEach((planet) => {
                const entryContainer = this.add.container(0, yOffset);

                const planetImage = this.add
                    .image(-250, 0, planet.image)
                    .setScale(0.8);
                entryContainer.add(planetImage);

                const text = this.add.text(
                    -200,
                    -30,
                    `${planet.name} (Level ${planet.level})\n${
                        planet.description
                    }\nResources: ${Object.entries(planet.resources)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}`,
                    {
                        font: '16px Arial',
                        fill: '#ffffff',
                        wordWrap: { width: 400 },
                    }
                );
                entryContainer.add(text);

                scrollablePanel.add(entryContainer);

                yOffset += 120;
            });

            journalPanel.add(scrollablePanel);

            // Add scroll functionality
            this.input.on(
                'wheel',
                (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
                    if (journalOpen) {
                        scrollablePanel.y -= deltaY;
                        scrollablePanel.y = Phaser.Math.Clamp(
                            scrollablePanel.y,
                            -yOffset + 150,
                            0
                        );
                    }
                }
            );
        }

        function closeJournal() {
            journalOpen = false;
            journalPanel.destroy();
        }

        function toggleJournal() {
            if (journalOpen) {
                closeJournal.call(this);
            } else {
                openJournal.call(this);
            }
        }

        function toggleUpgradePanel(scene) {
            if (upgradePanel) {
                closeUpgradePanel();
            } else {
                openUpgradePanel(scene);
            }
        }

        function openUpgradePanel(scene) {
            upgradePanel = scene.add.container(
                scene.scale.width / 2,
                scene.scale.height / 2
            );

            const background = scene.add.rectangle(
                0,
                0,
                500,
                400,
                0x000000,
                0.8
            );
            background.setOrigin(0.5);
            upgradePanel.add(background);

            const title = scene.add.text(0, -180, 'Ship Upgrades', {
                font: '24px Arial',
                fill: '#ffffff',
            });
            title.setOrigin(0.5);
            upgradePanel.add(title);

            const closeButton = scene.add
                .text(230, -180, 'X', { font: '20px Arial', fill: '#ffffff' })
                .setInteractive()
                .on('pointerdown', closeUpgradePanel);
            upgradePanel.add(closeButton);

            // Speed Upgrade
            addUpgradeOption(
                scene,
                -230,
                -130,
                'Speed',
                currentSpeedLevel,
                shipUpgrades.Speed,
                upgradeSpeed
            );

            // Bullet Speed Upgrade
            addUpgradeOption(
                scene,
                0,
                -130,
                'BulletSpeed',
                currentBulletSpeedLevel,
                shipUpgrades.BulletSpeed,
                upgradeBulletSpeed
            );

            // Fire Rate Upgrade
            addUpgradeOption(
                scene,
                -230,
                20,
                'FireRate',
                currentFireRateLevel,
                shipUpgrades.FireRate,
                upgradeFireRate
            );
        }

        function addUpgradeOption(
            scene,
            x,
            y,
            type,
            currentLevel,
            upgradeInfo,
            upgradeFunction
        ) {
            const nextLevel = currentLevel + 1;
            const upgrade = upgradeInfo[nextLevel];

            if (upgrade) {
                const resourceType = Object.keys(upgrade.cost)[0];
                const costAmount = upgrade.cost[resourceType];
                const newValue = upgrade.speed || upgrade.rate;
                const upgradeText = scene.add.text(
                    x,
                    y,
                    `${type} Upgrade (Level ${nextLevel})\nCost: ${costAmount} ${resourceType}\nNew ${type}: ${newValue}`,
                    { font: '16px Arial', fill: '#ffffff' }
                );
                upgradePanel.add(upgradeText);

                const upgradeButton = scene.add
                    .text(x, y + 60, `Upgrade ${type}`, {
                        font: '16px Arial',
                        fill: '#ffffff',
                        backgroundColor: '#4a4a4a',
                        padding: { x: 10, y: 5 },
                    })
                    .setInteractive()
                    .on('pointerdown', () => upgradeFunction(scene));
                upgradePanel.add(upgradeButton);
            } else {
                const maxLevelText = scene.add.text(
                    x,
                    y + 20,
                    `Max ${type} level reached!`,
                    { font: '16px Arial', fill: '#ffffff' }
                );
                upgradePanel.add(maxLevelText);
            }
        }

        function upgradeFireRate(scene) {
            const nextLevel = currentFireRateLevel + 1;
            const upgradeInfo = shipUpgrades.FireRate[nextLevel];

            if (upgradeInfo) {
                const resourceType = Object.keys(upgradeInfo.cost)[0];
                const costAmount = upgradeInfo.cost[resourceType];

                if (inventory[resourceType] >= costAmount) {
                    inventory[resourceType] -= costAmount;
                    currentFireRateLevel = nextLevel;
                    playerFireRate = upgradeInfo.rate;
                    closeUpgradePanel();
                    openUpgradePanel(scene);
                    updateInventoryText();
                } else {
                    showErrorMessage(scene, resourceType);
                }
            }
        }

        function closeUpgradePanel() {
            if (upgradePanel) {
                upgradePanel.destroy();
                upgradePanel = null;
            }
        }

        function upgradeSpeed(scene) {
            const nextLevel = currentSpeedLevel + 1;
            const upgradeInfo = shipUpgrades.Speed[nextLevel];

            if (upgradeInfo) {
                const resourceType = Object.keys(upgradeInfo.cost)[0];
                const costAmount = upgradeInfo.cost[resourceType];

                if (inventory[resourceType] >= costAmount) {
                    inventory[resourceType] -= costAmount;
                    currentSpeedLevel = nextLevel;
                    maxSpeed = upgradeInfo.speed;
                    closeUpgradePanel();
                    openUpgradePanel(scene);
                    updateInventoryText();
                } else {
                    showErrorMessage(scene, resourceType);
                }
            }
        }

        function upgradeBulletSpeed(scene) {
            const nextLevel = currentBulletSpeedLevel + 1;
            const upgradeInfo = shipUpgrades.BulletSpeed[nextLevel];

            if (upgradeInfo) {
                const resourceType = Object.keys(upgradeInfo.cost)[0];
                const costAmount = upgradeInfo.cost[resourceType];

                if (inventory[resourceType] >= costAmount) {
                    inventory[resourceType] -= costAmount;
                    currentBulletSpeedLevel = nextLevel;
                    playerBulletSpeed = upgradeInfo.speed;
                    closeUpgradePanel();
                    openUpgradePanel(scene);
                    updateInventoryText();
                } else {
                    showErrorMessage(scene, resourceType);
                }
            }
        }

        function showErrorMessage(scene, resourceType) {
            const errorText = scene.add.text(
                0,
                100,
                `Not enough ${resourceType}!`,
                { font: '16px Arial', fill: '#ff0000' }
            );
            errorText.setOrigin(0.5);
            upgradePanel.add(errorText);
            scene.time.delayedCall(2000, () => errorText.destroy());
        }

        function getLevelUpTooltipText() {
            const nextLevel = spaceshipLevel + 1;
            const nextLevelData = levelData[nextLevel - 1];
            if (!nextLevelData) {
                return 'Max level reached!';
            }
            const requirements = nextLevelData.requirement.resources
                .map(
                    (resource, index) =>
                        `${nextLevelData.requirement.amounts[index]} ${resource}`
                )
                .join(', ');
            return `Level ${nextLevel} Requirements:\n${requirements}`;
        }

        function showTooltip(x, y, text) {
            tooltip.setText(text);
            tooltip.setPosition(x, y - tooltip.height - 10);
            tooltip.setVisible(true);
        }

        function hideTooltip() {
            tooltip.setVisible(false);
        }

        function createDebugPanel(scene) {
            debugPanel = scene.add.container(100, 100);
            debugPanel.setVisible(false);

            const background = scene.add.rectangle(
                0,
                0,
                200,
                300,
                0x000000,
                0.8
            );
            debugPanel.add(background);

            const title = scene.add
                .text(0, -130, 'Debug Panel', {
                    font: '20px Arial',
                    fill: '#ffffff',
                })
                .setOrigin(0.5);
            debugPanel.add(title);

            const materials = [
                'coal',
                'iron',
                'gold',
                'emerald',
                'diamond',
                'voidstone',
            ];
            materials.forEach((material, index) => {
                const button = scene.add
                    .text(0, -80 + index * 40, `Add 20 ${material}`, {
                        font: '16px Arial',
                        fill: '#ffffff',
                        backgroundColor: '#4a4a4a',
                        padding: { x: 10, y: 5 },
                    })
                    .setInteractive()
                    .setOrigin(0.5)
                    .on('pointerdown', () => addMaterial(material, 20));
                debugPanel.add(button);
            });

            const closeButton = scene.add
                .text(80, -130, 'X', {
                    font: '20px Arial',
                    fill: '#ffffff',
                })
                .setInteractive()
                .on('pointerdown', () => toggleDebugPanel(scene));
            debugPanel.add(closeButton);
        }

        function toggleDebugPanel(scene) {
            isDebugPanelOpen = !isDebugPanelOpen;
            debugPanel.setVisible(isDebugPanelOpen);
        }

        function addMaterial(material, amount) {
            inventory[material] = (inventory[material] || 0) + amount;
            updateInventoryText();
            console.log(`Added ${amount} ${material} to inventory`);
        }

        // If player gets hit by enemy bullets
        function hitPlayer(scene) {
            inventory.fuel = Math.max(0, inventory.fuel - 5);

            updateInventoryText();

            // Set invulnerability
            isInvulnerable = true;
            lastHitTime = scene.time.now;

            // Visual feedback
            spaceship.setTint(0xff0000);
            spaceshipFire.setTint(0xff0000);

            hitSound.play({ volume: 0.3 });

            // Show the user what happened on impact
            const hitImage = scene.add.image(
                config.width / 2,
                config.height / 2 - 50,
                'hit_image'
            );
            hitImage.setDepth(1001); 
            hitImage.setScale(2.5); 

            // Animate the hit image
            scene.tweens.add({
                targets: hitImage,
                y: hitImage.y - 100, 
                alpha: 0, 
                duration: 1000,
                ease: 'Power1',
                onComplete: function () {
                    hitImage.destroy();
                },
            });

            // Screen shake effect
            scene.cameras.main.shake(200, 0.005);

            console.log('Player hit! Current fuel:', inventory.fuel);
        }

        function spawnInitialCoalPlanet(scene, config) {
            const offset = 600;
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const x = spaceshipX + Math.cos(angle) * offset;
            const y = spaceshipY + Math.sin(angle) * offset;

            const coalPlanet = {
                name: 'Coal',
                level: 1,
                resources: { coal: 7 },
                x: x,
                y: y,
            };

            const sprite = scene.add.image(
                x - spaceshipX + config.width / 2,
                y - spaceshipY + config.height / 2,
                'coal_planet'
            );
            sprite.setScale(1);

            const infoBox = scene.add.text(
                x - spaceshipX + config.width / 2,
                y - spaceshipY + config.height / 2 - 60,
                `Coal Planet\nLevel 1\nCoal: 500`,
                { font: '14px Arial', fill: '#ffffff', align: 'left' }
            );
            infoBox.setOrigin(0.5);

            planets.push(coalPlanet);
            planetSprites.push(sprite);
            planetInfoBoxes.push(infoBox);
        }

        return () => {
            game.destroy(true);
            window.removeEventListener('resize', () => {});
        };
    }, []);

    return <div ref={gameRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default SpaceshipGame;
