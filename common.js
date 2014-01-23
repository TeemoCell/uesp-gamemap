/*
 * common.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Contains common code for the GameMap system. 
 *
 */

	// Namespace definitions
var uesp = uesp || {};
uesp.gamemap = uesp.gamemap || {};

uesp.DEFAULT_DEBUG = true;

uesp.LOG_LEVEL_NONE     = 6;
uesp.LOG_LEVEL_CRITICAL = 5;
uesp.LOG_LEVEL_ERROR    = 4;
uesp.LOG_LEVEL_WARNING  = 3;
uesp.LOG_LEVEL_INFO     = 2;
uesp.LOG_LEVEL_ALL      = 1;
uesp.DEFAULT_LOG_LEVEL = uesp.LOG_LEVEL_ERROR;


	// Simple position/point class
uesp.gamemap.Position = function (x, y)
{
	this.x = (typeof x !== 'undefined') ? x : 0;
	this.y = (typeof y !== 'undefined') ? y : 0;
}


uesp.gamemap.isNullorUndefined = function (variable)
{
	return (typeof variable === 'undefined' || variable === null);
}


uesp.gamemap.createMergedObject = function (obj1, obj2)
{
	var obj3 = {};
	for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
	for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
	return obj3;
}


uesp.gamemap.mergeObjects = function (obj1, obj2)
{
	for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
	return obj1;
}


uesp.priv_logDebug = function () {
	var args = Array.prototype.slice.call(arguments);
	uesp.priv_log.apply(this, args);
}


uesp.setDebug = function(debug)
{
	uesp.debug = debug;
	
	if (uesp.debug)
		uesp.logDebug = uesp.priv_logDebug;
	else
		uesp.logDebug = function() { };
}

uesp.setDebug(uesp.DEFAULT_DEBUG);


uesp.priv_log = function () {
	var args = Array.prototype.slice.call(arguments);
	var logLevel = args[0];
	
	if (logLevel >= uesp.LOG_LEVEL_ALL && logLevel <= uesp.LOG_LEVEL_NONE)
		args.splice(0, 1);
	else
		logLevel = uesp.logLevel;
	
	if (logLevel >= uesp.logLevel && window.console) 
	{
		if (args.length == 1)
			console.log(args[0]);
		else
			console.log(args);
	}
	
}


uesp.log = function ()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift(uesp.LOG_LEVEL_ALL);
	uesp.priv_log.apply(this, args);
}


uesp.priv_logCritical = function ()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift(uesp.LOG_LEVEL_CRITICAL);
	uesp.priv_log.apply(this, args);
}


uesp.priv_logError = function ()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift(uesp.LOG_LEVEL_ERROR);
	uesp.priv_log.apply(this, args);
}


uesp.priv_logWarning = function ()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift(uesp.LOG_LEVEL_WARNING);
	uesp.priv_log.apply(this, args);
}


uesp.priv_logInfo = function ()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift(uesp.LOG_LEVEL_INFO);
	uesp.priv_log.apply(this, args);
}


uesp.setLogLevel = function(logLevel)
{
	uesp.logLevel = logLevel;
	
	uesp.logCritical = function() { };
	uesp.logError    = function() { };
	uesp.logWarning  = function() { };
	uesp.logInfo     = function() { };
	
	if (uesp.logLevel <= uesp.LOG_LEVEL_CRITICAL) uesp.logCritical = uesp.priv_logCritical;
	if (uesp.logLevel <= uesp.LOG_LEVEL_ERROR   ) uesp.logError    = uesp.priv_logError;
	if (uesp.logLevel <= uesp.LOG_LEVEL_WARNING ) uesp.logWarning  = uesp.priv_logWarning;
	if (uesp.logLevel <= uesp.LOG_LEVEL_INFO    ) uesp.logInfo     = uesp.priv_logInfo;	
}

uesp.setLogLevel(uesp.DEFAULT_LOG_LEVEL);