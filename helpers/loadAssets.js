import Spaceship from '../assets/spaceship.png';
import SpaceshipFire from '../assets/spaceship_fire.png';
import RocketSound from '../assets/rocket.mp3';
import EnemyFire from '../assets/enemy_fire.png';
import Bullet from '../assets/bullet.png';
import PlayerBullet from '../assets/player_bullet.png';
import Arrow from '../assets/arrow.png';
import CoalPlanet from '../assets/planets/coal.png';
import IronPlanet from '../assets/planets/iron.png';
import GoldPlanet from '../assets/planets/gold.png';
import EmeraldPlanet from '../assets/planets/emerald.png';
import DiamondPlanet from '../assets/planets/diamond.png';
import VoidstonePlanet from '../assets/planets/voidstone.png';
import NebulitePlanet from '../assets/planets/nebulite.png';
import CelestiumPlanet from '../assets/planets/celestium.png';
import EclipsiumPlanet from '../assets/planets/eclipse.png';
import MaxinitePlanet from '../assets/planets/maxinite.png';
import CoalIcon from '../assets/icons/coal.png';
import IronIcon from '../assets/icons/iron.png';
import GoldIcon from '../assets/icons/gold.png';
import FuelIcon from '../assets/ui/fuel.png';
import JournalIcon from '../assets/ui/journal.png';
import LevelUpIcon from '../assets/ui/levelup.png';
import UpgradeIcon from '../assets/ui/upgrade.png';
import extractIcon from '../assets/ui/extract.png';
import journalInfo from '../journal_info.json';
import Explosion from '../assets/explosion.png';
import ExplosionSound from '../assets/explosion.mp3'
import Shoot from '../assets/shoot.mp3';
import Hit from '../assets/hit.mp3';
import HitImage from '../assets/hit.png';

export function preload() {
    this.load.image('spaceship', Spaceship);
    this.load.image('spaceship_fire', SpaceshipFire);
    this.load.audio('rocket', RocketSound);
    this.load.image('arrow', Arrow);

    this.load.image('coal_planet', CoalPlanet);
    this.load.image('iron_planet', IronPlanet);
    this.load.image('gold_planet', GoldPlanet);
    this.load.image('emerald_planet', EmeraldPlanet);
    this.load.image('diamond_planet', DiamondPlanet);
    this.load.image('voidstone_planet', VoidstonePlanet);
    this.load.image('nebulite_planet', NebulitePlanet);
    this.load.image('celestium_planet', CelestiumPlanet);
    this.load.image('eclipsium_planet', EclipsiumPlanet);
    this.load.image('maxinite_planet', MaxinitePlanet);

    this.load.image('coal_icon', CoalIcon);
    this.load.image('iron_icon', IronIcon);
    this.load.image('gold_icon', GoldIcon);

    this.load.image('fuel_icon', FuelIcon);
    this.load.image('journal_icon', JournalIcon);
    this.load.image('level_up_icon', LevelUpIcon);
    this.load.image('upgrade_icon', UpgradeIcon);
    this.load.image('extract_icon', extractIcon);

    this.load.image('enemy', EnemyFire);
    this.load.image('enemy_fire', EnemyFire);
    this.load.image('bullet', Bullet);
    this.load.image('player_bullet', PlayerBullet);

    this.load.image('explosion', Explosion);
    this.load.image('hit_image', HitImage);
    this.load.audio('explosion_sound', ExplosionSound);
    this.load.audio('shoot', Shoot);
    this.load.audio('hit', Hit);

    this.load.bitmapFont(
        'icons',
        'https://raw.githubusercontent.com/phaserjs/examples/master/public/assets/fonts/bitmap/atari-classic.png',
        'https://raw.githubusercontent.com/phaserjs/examples/master/public/assets/fonts/bitmap/atari-classic.xml'
    );

    Object.values(journalInfo).forEach((planet) => {
        this.load.image(planet.image, planet.image);
    });
}