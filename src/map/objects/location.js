/**
 * @name location.js
 * @author Dave Humphrey <dave@uesp.net> (23rd Jan 2014)
 * @summary Class definition for the gamemap's locations.
 */

import Point from "./point.js";

let mapConfig;
let world;

export default class Location {
	constructor(data) {

		world = gamemap.getCurrentWorld();
		mapConfig = gamemap.getMapConfig() ?? DEFAULT_MAP_CONFIG;

		// set location type
		this.locType = data?.locType ?? LOCTYPES.MARKER;

		// set basic location info
		this.id = data.id ?? -100;
		this.unsavedLocation = (this.id < 0); // used when determining if this a new, unpublished location or not
		this.name = (!this.unsavedLocation) ? data.name : (this.locType == LOCTYPES.MARKER) ? "New Marker" : (this.locType == LOCTYPES.AREA) ? "New Area" : "New Line";
		this.revisionID = data.revisionId || 0;
		this.worldID = data?.worldId ?? world.id;
		this.destinationID = -(data?.destinationId) || null;
		this.legacy = data;

		// display attributes
		this.wikiPage = data?.wikiPage || null;
		this.description = data?.description || null;
		this.displayData = (data?.displayData) ? JSON.parse(data.displayData) : {};
		this.displayLevel = parseFloat(data.displayLevel - world.zoomOffset || 0);
		this.wasVisible = this.editing ?? null;

		// editing attributes
		this.editing = this.unsavedLocation || false; // whether this location is currently being edited
		this.bounds = null; // bounds are generated when asked

		// set location icon info
		print("printing mapconfig icon")
		print([...mapConfig.icons]);
		print(mapConfig);
		this.icon = (this.unsavedLocation) ? mapConfig.icons.keys().next() : data.iconType || null;
		this.width = (this.icon) ? data.width || mapConfig.iconSize : data.width;
		this.height = (this.icon) ? data.height || mapConfig.iconSize : data.height;

		// set up coords
		this.coords = (() => {
			let coords = [];
			let coordArray = this.displayData?.points;
			if (coordArray?.length > 0) {

				let [x, y] = [[], []];

				// split single coord array into x and y arrays
				for (let i = 0; i < coordArray.length; i++) {
					if (i % 2 == 0 || i == 0 ) {  // if even, put into x, else: y
						x.push(coordArray[i]);
					} else {
						y.push(coordArray[i]);
					}
				}

				// push joined coords into coord array
				for (let i = 0; i < y.length; i++ ) {
					let coord = [x[i], y[i]];
					coords.push(this.makePoint(coord));
				}

			} else {
				coords.push(this.makePoint([data.x, data.y]));
			}
			return data?.coords ?? coords;
		})();

		// set up label positions
		this.labelPos = (() => {
			if (this.unsavedLocation) { // if we're a newly created location, return defaults
				if (this.locType == LOCTYPES.MARKER) {
					return 6; // markers' labels should be positioned to the right
				} else if (this.locType == LOCTYPES.AREA ) {
					return 5; // polygons/areas should have centred labels
				} else if (this.locType == LOCTYPES.LINE) {
					return 0; // lines do not have a label
				}
			} else { // otherwise, iterate through labelPos and translate into leaflet-accepted label positions
				switch (this?.displayData?.labelPos) {
					case null, 0:	// legacy: none
						return 0;	// returns: none
					case 1: 		// legacy: top left
						return 4;	// returns: left
					case 2:			// legacy: top center
						return 2; 	// returns: top
					case 3:			// legacy: top right
						return 6;	// returns: right
					case 4:			// legacy: left
						return 4;	// returns: left
					case 5:			// legacy: center
						return 5;	// returns: center
					case 6:			// legacy: right
						return 6;	// returns: right
					case 7:			// legacy: bottom left
						return 4; 	// returns: left
					case 8:			// legacy: bottom
						return 8;	// returns: bottom
					case 9:			// legacy: bottom right
						return 6;	// returns: right
					default:		// legacy: auto
						return 10; 	// returns: auto
				}
			}
		})();

		// set up display info for polygons
		if (this.isPolygon()){

			if (!this.displayData?.lineWidth) { this.displayData.lineWidth = 0 } else {}
			if (!this.displayData?.hover) { this.displayData.hover = structuredClone(this.displayData) }

			this.fillColour = this.displayData?.fillStyle ?? mapConfig.defaultFillColour;
			this.fillColourHover = this.displayData?.hover.fillStyle ?? mapConfig.defaultFillColourHover;

			this.strokeColour = this.displayData?.strokeStyle ?? mapConfig.defaultStrokeColour;
			this.strokeColourHover = this.displayData?.hover.strokeStyle ?? mapConfig.defaultStrokeColourHover;

			this.strokeWidth = this.displayData?.lineWidth ?? mapConfig.defaultStrokeWidth;
			this.strokeWidthHover = this.displayData?.hover?.lineWidth ?? mapConfig.defaultStrokeWidthHover;
		}
	}


	// get centre coordinate of this location or passed coords
	getCentre(coords) {
		coords = coords ?? this.coords;

		if (coords.length == 1) {
			return coords[0];
		} else if (coords.length > 0) {

		}

	}

	makePoint(coords) {

		let x = coords[0];
		let y = coords[1];

		// convert eso coordinates to be normalised
		if (mapConfig.coordType == COORD_TYPES.NORMALISED && mapConfig.database == "eso") {

			// get normalised value of x and y in range
            x = (x - world.minX) / world.maxRangeX;
			y = Math.abs((y - world.maxY) / world.maxRangeY); // flip y around

			// transform coords to better fit power of two numbers of tiles
			x = (x * nextPowerOfTwo(world.dbNumTilesX) / world.dbNumTilesX).toFixed(3);
			y = (y * nextPowerOfTwo(world.dbNumTilesY) / world.dbNumTilesY).toFixed(3);
		}

		return new Point(x, y, mapConfig.coordType, world.maxZoomLevel);
	}

	getTooltipContent() {

		return `<span>
					${this.name} ${this.isClickable() ? "<i class='tiny material-icons'>open_in_browser</i>" : ""}
				</span>
			    <div class='tooltip-desc'>
					${this.description ? (this.name != this.wikiPage) ? this.description + "</br>" + this.wikiPage : this.description : "" }
				</div>
			   	${this.isClickable() ? "<small class='tooltip-tip'>Click to enter</small>" : ""}`;
	}

	getPopupContent() {

		let popupContent = `<div class='popupTitle'><a ${this.createWikiLink()} target='_top'> ${this.name} </a></div>
							<div class='popupDesc'>${this.description}</div><hr/>
							<div class='popupInfo'><b>Location ID:</b> ${this.id}</div>`;

		if (this.coords.length == 1 ) {
			popupContent += `<div class='popupInfo'><b>Coords: </b> X: ${this.coords[0].x}, Y: ${this.coords[0].y} </div>`;
		}

		if (this.destinationID != null) {
			popupContent += `<div class='popupInfo'><b>Destination ID:</b> ${this.destinationID} ${(this.destinationID < 0) ? ' (Location)' : ' (World)'} </div>`;
		}

		if (mapConfig.editingEnabled) {
			let buttonStyle = "text-align: center; height: unset; margin-bottom: -8px; width: inherit; line-height: 26px;";
			popupContent += `<hr/> <a style='${buttonStyle}' class='btn-flat waves-effect' onclick="gamemap.getLocation(${this.id}, function (location) { gamemap.edit(location); gamemap.getMapObject().closePopup() })">Edit</a>`;
		}

		return popupContent;

	}

	isPolygon(){
		return this.locType == LOCTYPES.AREA || this.locType == LOCTYPES.PATH;
	}

	hasIcon() {
		return (this.icon != null && this.locType != LOCTYPES.PATH);
	}

	hasLabel() {
		return (this.labelPos && this.labelPos >= 1 && this.name != "" && this.locType != LOCTYPES.PATH);
	}

	isLabel() {
		return (!this.hasIcon() && !this.isPolygon() && this.hasLabel());
	}

	isClickable() {
		return this.destinationID && this.destinationID != 0 && !gamemap.mapLock && this.locType != LOCTYPES.PATH;
	}

	createWikiLink() {

		let wikiLink = "";

		if (mapConfig.wikiNamespace != null && mapConfig.wikiNamespace.length > 0) {

			if (this.wikiPage != "") {
				if (this.wikiPage.indexOf(":") >= 0) {
					wikiLink = mapConfig.wikiURL + encodeURIComponent(this.wikiPage).replace("%3A", ":").replace("%2F", "/");;
				} else {
					wikiLink = mapConfig.wikiURL + mapConfig.wikiNamespace + ':' + encodeURIComponent(this.wikiPage);
				}
			}
		} else {
			wikiLink = mapConfig.wikiURL + encodeURIComponent(this.wikiPage);
		}

		if (wikiLink != "") {
			wikiLink = `href="${wikiLink}"`;
		}

		return wikiLink;

	}

	setEditing(editing) {
		this.editing = editing;
	}

	getWasVisible() {
		return this.wasVisible;
	}

	setWasVisible(wasVisible) {
		this.wasVisible = wasVisible;
	}

	// is location visible (with optional passed bounds)
	isVisible(bounds) {
		if (this.editing) return true;
		if ((gamemap.getCurrentZoom() + 0.001) < this.displayLevel) return false;
		bounds = bounds ?? gamemap.getCurrentViewBounds();
		// todo: also need centre coord checking in here too
		let isInside = false;
		this.coords.every(coord => {
			if (coord.x >= bounds.minX && coord.x <= bounds.maxX && coord.y >= bounds.minY && coord.y <= bounds.maxY) {
				isInside = true;
			  	return false; // coordinate was found within the bounds, break early
			} else {
				return true; // returning true to keep loop going if no coordinate was found within bounds
			}
		});
		return isInside;
	}

	// get query for saving this location
	getSaveQuery() {

		var query = 'action=set_loc';
		let coords = (mapConfig.database == "eso") ? this.convertESOCoords(this.coords) : this.coords;

		query += `&name=${encodeURIComponent(this.name)}`;
		query += `&description=${encodeURIComponent(this.description)}`;
		query += `&wikipage=${encodeURIComponent(this.wikiPage)}`;

		query += `&loctype=${this.locType}`;
		query += `&locid=${this.id}`;
		query += `&worldid=${this.worldID}`;
		query += `&destid=${-(this.destinationID)}`;
		query += `&revisionid=${this.revisionID}`;
		query += `&db=${gamemap.getMapConfig().database}&visible=1`;

		this.updateDisplayData(coords);
		query += `&x=${(this.isPolygon()) ? this.getMaxBounds().minX: coords[0].x}`;
		query += `&y=${(this.isPolygon()) ? this.getMaxBounds().maxY: coords[0].y}`;
		query += `&locwidth=${this.width}&locheight=${this.height}`;

		query += `&displaylevel=${+this.displayLevel + +world.zoomOffset}`;
		query += `&displaydata=${encodeURIComponent(JSON.stringify(this.displayData))}`;
		if (this.hasIcon()) { query += `&icontype=${encodeURIComponent(this.icon)}` }

		print(objectify(query));
		return encodeURIComponent(query);
	}

	// get query for deleting this location
	getDeleteQuery() {

		var query = 'action=enable_loc';

		query += `&locid=${this.id}`;
		query += `&worldid=${this.worldID}`;
		query += `&db=${gamemap.getMapConfig().database}&visible=0`;

		return query;

	}

	// update display data with current object state
	updateDisplayData(coords) {
		this.displayData.labelPos = this.labelPos;
		this.displayData.points = (() => {
			let points = [];
			coords.forEach(coord => { points.push(coord.x, coord.y) });
			return points;
		})();

		if (this.isPolygon()) {
			this.displayData.fillStyle = this.fillColour;
			this.displayData.hover.fillStyle = this.fillColourHover;

			this.displayData.strokeStyle = this.strokeColour;
			this.displayData.hover.strokeStyle = this.strokeColourHover;

			this.displayData.lineWidth = this.strokeWidth;
			this.displayData.hover.lineWidth = this.strokeWidthHover;

			let bounds = this.getMaxBounds(true);
			this.width = bounds.maxX - bounds.minX;
			this.height = bounds.maxY - bounds.minY;
		}
	}

	// convert eso coordinates
	convertESOCoords(coords) {
		coords = (!Array.isArray(coords)) ? [structuredClone(coords)] : structuredClone(coords);

		coords.forEach(coord => {
			coord.x = coord.x / nextPowerOfTwo(world.dbNumTilesX) * world.dbNumTilesX;
			coord.y = coord.y / nextPowerOfTwo(world.dbNumTilesY) * world.dbNumTilesY;
			coord.x = coord.x * world.maxRangeX;
			coord.y = (1 - coord.y) * world.maxRangeY;
		})

		return coords;
	}

	// get max bounds of the current location
	getMaxBounds(regen) {
		if (regen ?? this.bounds == null) {
			let coords = (mapConfig.database == "eso") ? this.convertESOCoords(this.coords) : this.coords;
			let bounds = {};
			[bounds.minX, bounds.maxX, bounds.minY, bounds.maxY] = [coords[0].x, coords[0].x, coords[0].y, coords[0].y];
			coords.forEach(coord => {
				bounds.minX = (coord.x < bounds.minX) ? coord.x : bounds.minX;
				bounds.maxX = (coord.x > bounds.maxX) ? coord.x : bounds.maxX;
				bounds.minY = (coord.y < bounds.minY) ? coord.y : bounds.minY;
				bounds.maxY = (coord.y > bounds.maxY) ? coord.y : bounds.maxY;
			});
			this.bounds = bounds;
			return bounds;
		} else {
			return this.bounds;
		}
	}

}