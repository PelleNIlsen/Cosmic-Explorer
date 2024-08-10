import Phaser from 'phaser';

export function createPlanet(planetData, x, y) {
    const planetKeys = Object.keys(planetData);
    const weightedPlanetKeys = [];

    planetKeys.forEach((key) => {
        const planetLevel = planetData[key].level;
        const weight = Math.max(1, 11 - planetLevel);
        for (let i = 0; i < weight; i++) {
            weightedPlanetKeys.push(key);
        }
    });

    if (weightedPlanetKeys.length > 0) {
        const planetKey =
            weightedPlanetKeys[
                Math.floor(Math.random() * weightedPlanetKeys.length)
            ];
        const planetTemplate = planetData[planetKey];
        const scale = Phaser.Math.FloatBetween(0.5, 2.5);

        const planet = JSON.parse(JSON.stringify(planetTemplate));
        planet.x = x;
        planet.y = y;
        planet.scale = scale;

        Object.keys(planet.resources).forEach((resource) => {
            const baseAmount = planet.resources[resource];
            planet.resources[resource] = Math.round(
                baseAmount * Phaser.Math.FloatBetween(0.8, 1.2)
            );
        });

        planet.imageKey = planet.image.replace('planets/', '') + '_planet';

        return planet;
    }
    return null;
}

export function spawnPlanet(
    scene,
    config,
    minPlanetDistance,
    maxPlanetDistance,
    spaceshipX,
    spaceshipY,
    planetData,
    planets,
    planetSprites,
    planetInfoBoxes
) {
    const viewportWidth = config.width;
    const viewportHeight = config.height;

    let x, y, distance;
    do {
        const angle = Math.random() * Math.PI * 2;
        distance = Phaser.Math.Between(minPlanetDistance, maxPlanetDistance);
        x = spaceshipX + Math.cos(angle) * distance;
        y = spaceshipY + Math.sin(angle) * distance;
    } while (
        Math.abs(x - spaceshipX) < viewportWidth / 2 &&
        Math.abs(y - spaceshipY) < viewportHeight / 2
    );

    const planet = createPlanet(planetData, x, y);
    if (planet) {
        planets.push(planet);
        const sprite = scene.add
            .image(0, 0, planet.imageKey)
            .setScale(planet.scale);

        sprite.setVisible(false);
        planetSprites.push(sprite);

        const infoBox = scene.add.text(0, 0, '', {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#111111',
            padding: { x: 10, y: 5 },
        });
        infoBox.setVisible(false);
        planetInfoBoxes.push(infoBox);
    }
}
