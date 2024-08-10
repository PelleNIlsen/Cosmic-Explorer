import Phaser from 'phaser';

export function spawnEnemyGroup(scene, spaceshipX, spaceshipY, config, enemies, enemyFireRateMin, enemyFireRateMax) {
    const groupSize = Phaser.Math.Between(2, 5);
    const groupAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distanceFromPlayer = 1000;

    for (let i = 0; i < groupSize; i++) {
        const angleVariation = Phaser.Math.FloatBetween(-0.5, 0.5);
        const x = spaceshipX + Math.cos(groupAngle + angleVariation) * distanceFromPlayer;
        const y = spaceshipY + Math.sin(groupAngle + angleVariation) * distanceFromPlayer;

        const enemy = scene.add.image(x - spaceshipX + config.width / 2, y - spaceshipY + config.height / 2, 'enemy');
        enemy.setData('realX', x);
        enemy.setData('realY', y);
        enemy.setData('lastFired', 0);
        enemy.setData('fireRate', Phaser.Math.Between(enemyFireRateMin, enemyFireRateMax));
        enemy.setData('type', Phaser.Math.RND.pick([ 'sniper', 'charger' ]));
        enemies.push(enemy);
    }
}