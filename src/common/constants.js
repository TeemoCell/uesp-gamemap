/**
 * @name constants.js
 * @author Thal-J <thal-j@uesp.net> (2nd Sept 2022)
 * @summary Contains general constants to be re-used throughout the gamemap.
 */

export const ASSETS_DIR = "assets/";
export const MAP_ASSETS_DIR = "assets/maps/";
export const CONFIG_DIR = ASSETS_DIR + "configs/";
export const TEMPLATES_DIR = ASSETS_DIR + "templates/";
export const ICONS_DIR = ASSETS_DIR + "icons/";
export const IMAGES_DIR = ASSETS_DIR + "images/";

export const PARAM_TYPE_QUERY = 0;
export const PARAM_TYPE_HASH = 1;

export const CSS_OVERRIDE_FILENAME = "override.css"
export const MAP_CONFIG_FILENAME = "config.json"
export const DEFAULT_MAP_CONFIG_DIR = MAP_ASSETS_DIR + "default-" + MAP_CONFIG_FILENAME;

export const GAME_DATA_SCRIPT = (isRelease) ? "db/gamemap.php" : "http://localhost:2500/public/db/gamemap.php"

export const LOCTYPES = {
    NONE : 0,
    POINT : 1,
    PATH : 2,
    AREA : 3,
    LABEL : 4,
}

export const PLACETYPES = {
    WORLD : 0,
    LOCATION : 1,
}

export const LABEL_POSITIONS = {
    0 : 'None',
    1 : 'Top Left',
    2 : 'Top Center',
    3 : 'Top Right',
    4 : 'Middle Left',
    5 : 'Center',
    6 : 'Middle Right',
    7 : 'Bottom Left',
    8 : 'Bottom Center',
    9 : 'Bottom Right'
};

export const COORD_TYPES = {
    XY : 0,
    NORMALISED : 1,
    WORLDSPACE : 2,
}