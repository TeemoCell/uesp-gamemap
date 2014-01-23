<?php 
/*
 * gamemap.php -- Created by Dave Humphrey (dave@uesp.net) on 23 Jan 2014
 * 		Released under the GPL v2
 *		Main server side application for the game map system.
 *
 */


require '/home/uesp/secrets/gamemap.secrets';


class GameMap
{
	
	const LOCTYPE_POINT = 1;
	const LOCTYPE_PATH  = 2;
	const LOCTYPE_AREA  = 3;
	
	
	public $inputParams = array();
	public $action = 'default';
	public $mapname = '';
	public $outputItems = array();
	
	private $db = null;
	
	
	function __construct ()
	{
		$this->setInputParams();
		$this->parseInputParams();
	}
	
	
	public function addOutputItem ($key, $value)
	{
		$this->outputItems[$key] = $value;
	}
	
	
	private function checkTables()
	{
		$result = mysql_query('select 1 from `world`;');
		
		if ($result === FALSE)
		{
			return $this->createTables();
		}
		
		return true;
	}
	
	
	private function createTables()
	{
		$query = "CREATE TABLE IF NOT EXISTS `world` (
					`id` BIGINT NOT NULL AUTO_INCREMENT,
					`name` TINYTEXT NOT NULL,
					`display_name` TINYTEXT NOT NULL,
					`description` TEXT NOT NULL,
					`wiki_page` TEXT NOT NULL,
					`cell_size` INTEGER NOT NULL,
					`min_zoom` INTEGER NOT NULL,
					`max_zoom` INTEGER NOT NULL,
					`pos_left` INTEGER NOT NULL,
					`pos_top` INTEGER NOT NULL,
					`pos_right` INTEGER NOT NULL,
					`pos_bottom` INTEGER NOT NULL,
					`enabled` TINYINT NOT NULL,
					PRIMARY KEY ( id )
				);";
		
		$result = mysql_query($query);
		if ($result === FALSE) return $this->reportError("Failed to create world table!");
		
		$query = "CREATE TABLE IF NOT EXISTS location (
					id BIGINT NOT NULL AUTO_INCREMENT,
					world_id BIGINT NOT NULL,
					lrev_id BIGINT NOT NULL,
					loc_type TINYINT NOT NULL,
					loc_data TEXT NOT NULL,
					loc_x INTEGER NOT NULL,
					loc_y INTEGER NOT NULL,
					loc_width INTEGER NOT NULL,
					loc_height INTEGER NOT NULL,
					title TINYTEXT NOT NULL,
					description TEXT NOT NULL,
					wiki_page TEXT NOT NULL,
					display_level INTEGER NOT NULL,
					visible TINYINT NOT NULL,
					PRIMARY KEY ( id )
				);";
		$result = mysql_query($query);
		if ($result === FALSE) return $this->reportError("Failed to create location table!");
		
		return true;
	}
	
	
	public function doAction ($action = null)
	{
		if ($action == null) $action = $this->action;
		$this->addOutputItem("action", $action);
		
		switch ($action)
		{
			case 'create_tables':
				return $this->doCreateTables();
			case 'get_worlds':
				return $this->doGetWorlds();
			case 'default':
			default:
				break;
		}
		
		$this->reportError("Unknown action '". $action ."' received!");
		return false;
	}
	
	
	public function doCreateTables ()
	{
		$result = $this->initDatabase();
		if (!$result) return false;
		
		$this->addOutputItem("result", "Successfully created tables!");
		return true;
	}
	
	
	public function doGetWorlds ()
	{
		if (!$this->initDatabase()) return false;
		
		$query = "SELECT * from world WHERE enabled <> 0;";
		$result = mysql_query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve world data!" . $result);
		
		$worlds = Array();
		$count = 0;
		
		while ( ($row = mysql_fetch_assoc($result)) )
		{
			$worlds[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("worlds", $worlds);
		$this->addOutputItem("world_count", $count);
		return true;
	}
	
	
	private function initDatabase ()
	{
		global $uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW, $uespGameMapDatabase;
		
		$this->db = mysql_connect($uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW);
		if (!$this->db) return $this->reportError("Could not connect to mysql database!");
		
		if (!mysql_select_db($uespGameMapDatabase, $this->db)) return $this->reportError("Game map database '".$uespGameMapDatabase."'. not found!");
		
		return $this->checkTables();
	}
	
	
	private function initDatabaseWrite ()
	{
		global $uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW, $uespGameMapDatabase;
		
		$this->db = mysql_connect($uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW);
		if (!$this->db) return $this->reportError("Could not connect to mysql database!");
		
		if (!mysql_select_db($uespGameMapDatabase, $this->db)) return $this->reportError("Game map database '".$uespGameMapDatabase."'. not found!");
		
		return $this->checkTables();
	}
	
	
	private function parseInputParams ()
	{
		$this->action = strtolower($this->inputParams['action']);
		$this->mapname = strtolower($this->inputParams['mapname']);
		
		if ($this->mapname === null) $this->mapname = '';
		if ($this->action === null) $this->action = 'default';
	}
	
	
	public function reportError ($errorMsg)
	{
		$this->addOutputItem("isError", true);
		$this->addOutputItem("errorMsg", $errorMsg);
		
		error_log("Error: " . $errorMsg);
		return false;
	}
	
	
	private function setInputParams ()
	{
		global $argv;
		$this->inputParams = $_REQUEST;
		
			// Add command line arguments to input parameters for testing
		if ($argv !== null)
		{
			foreach ($argv as $arg)
			{
				$e = explode("=", $arg);
				
				if(count($e) == 2)
					$this->inputParams[$e[0]] = $e[1];
				else
					$this->inputParams[$e[0]] = 0;
			}
		}
	}
	
	
	public function writeHeaders ()
	{
		header("Expires: 0");
		header("Pragma: no-cache");
		header("Cache-Control: no-cache, no-store, must-revalidate");
		header("Pragma: no-cache");
		header("content-type: application/json");
	}
	
	
	public function writeJson ()
	{
		$this->writeHeaders();
		print json_encode($this->outputItems);
		print "\n";
	}
	
}


$g_GameMap = new GameMap();
$g_GameMap->doAction();
$g_GameMap->writeJson();


?>