//**************************************************************************************************************************************
//Global variable list.
var map = {};
var markers = [];
var queryResult = []; // Search parameters from form retrieval are stored here.
var resultList = []; // Search results are stored here.
var toiletJson = null;
var pgJson = null;
var pubJson = null;
//**************************************************************************************************************************************
//Boot functions
/**
	*@desc: Initiates javascript from <body onload> in html with regards to file retrieval and further execution (in getFile).
	*@param: string context. Defines what file to retrieve and what functions to follow up in getFile() afterwards.
*/
function initMe(){
	var banana = "a"
	banana = banana + 'b' + "c"
	console.log(banana)
	banana = "is this 'possible'"
	console.log(banana)
	banana = 'or is this "possible"'
	console.log(banana)
	banana = "then certainly this is \"possible\" "
	console.log(banana)
}

function initSystem(context) {
	if(context == "toilet") {
		getFile("https://hotell.difi.no/api/json/bergen/dokart?",context,false);
	}
	if(context == "playground") {
		getFile("https://hotell.difi.no/api/json/bergen/lekeplasser?",context,false);
	}
	if(context =="favToilet") {
		getFile("https://hotell.difi.no/api/json/bergen/dokart?",context,false);
	}
	if(context =="pub") {
		getFile("https://api.jsonbin.io/b/5adfc3470f8cf5632c4b127d",context,false);
	}
}
/**
	*@desc: Initiates functions relevant to playground.html when called.
*/
function initPlayground() {
	initMarker(pgJson,true);
}
/**
	*@desc: Initiates functions relevant to favToilet.html when called. Differentiate between search state and regular state.
*/
function initFav(){
	selectCreator(toiletJson);
	var url = window.location.href;
	if(url.includes("?")){
		var temp = findNearestMatches(toiletJson,pgJson,5);
		console.log(temp);
		initMarker(temp,false);
		distanceList(temp);
	}
	else{
		listCreator(toiletJson,true);
		initMarker(toiletJson,true);
	}
}
/**
	*@desc: Initiates functions relevant to toilets.html when called. Differentiate between search states and regular state.
*/
function initToilet(){
	var url = window.location.href;
	if(url.includes("?")){
		if(url.includes("quickSearch")){
			quickQuery();
		}
		else{
			advancedQuery();
		}
		matchResult(toiletJson);
		listCreator(resultList,false);
		initMarker(resultList,true);
	}
	else{
		listCreator(toiletJson,true);
		initMarker(toiletJson,true);
	}
}
/**
	*@desc: Initiates functions relevant to pub.html when called. Differentiate between search state and regular state.
*/
function initPub(){
	var url = window.location.href;
	if(url.includes("?")){
		advancedQuery();
		fixArray(queryResult);
		matchPub(pubJson);
		pubList(resultList);
	}
	else{
		pubList(pubJson);
	}
}
//**************************************************************************************************************************************
// General & Miscellaneous functions
/**
	*@desc: Function to calculate local time and divide the string into a multivalued array.
	*@return array. [int hour, int minutes, int day]
*/
function getTime() {
	var fullTime = new Date();
	var temp = [];
	temp.push(fullTime.getHours(), fullTime.getMinutes(),fullTime.getDay());
	return temp;
}
/**
	*@desc: Form retrieval results in letter codes for norwegian letters. These letter codes must be replaced with norwegian letters before search iniatiation.
	*directly intervienes in queryResult.
*/
function fixArray() {
	for(var i = 0; i < queryResult.length; i++) {
		var temp = fixLanguage(queryResult[i][1]);
		temp = temp.toUpperCase();
		queryResult[i][1] = temp;
	}
}
/**
	*@desc: Replaces all instances of URL's encoded norwegian to regular norwegian in terms of letters.
	*@param: string, to be adjusted.
	*@return string, now adjusted to norwegian.
*/
function fixLanguage(string){
	var temp = string;
	if(temp.includes("%C3%B8")){
		temp = temp.replace(/%C3%B8/i, 'Ø');
	}
	if(temp.includes("%C3%A5")){
		temp = temp.replace(/%C3%A5/i, 'Å');
	}
	if(temp.includes("%C3%A6")){
		temp = temp.replace(/%C3%A6/i, 'Æ');
	}
	return temp;
}
/**
	*@desc: Combines to int to a float. Used when making hour and minutes into a calcuable float to represent time.
	*@param: array, in the form of getTime() or equivalent.
	*@return: float, representing time with hours and digits and minutes as decimals.
*/
function concot(array){
	var temp = array[0]+"."+array[1];
	temp = parseFloat(temp);
	return temp;
}
/**
	*@desc: Fetches iD form result from Url. Used to identify search parameter in favToilet.html 
	*@return: string, iD value from a toilet.
*/
function getId() {
	var url = window.location.href;
	url= url.split("?");
	result = url[1].split("=");
	return result[1];
}
//**************************************************************************************************************************************
//File Retrieval
/**
	*@desc: Retrieves JSON file from an url. Upon retrieval, initiates further functions based on parameters.
	*@param: url-string. Location for file retrieval. iD-string. Defines where to assign file retrieved and what functions to follow up.
	*favChecker-boolean. Check in playground in relations to favToilet iD parameter so correct follw up function is activated.
*/
function getFile(url,iD,favChecker) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET",url);
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4 && xhr.status == 200){
				if(xhr.getResponseHeader('content-type') == "application/json;charset=UTF-8") {
					if(iD == "toilet"){
						toiletJson = JSON.parse(xhr.response);
						removeEntry("T");
						initToilet();
					}
					else if(iD == "favToilet") {
						toiletJson = JSON.parse(xhr.response);
						removeEntry("T");
						getFile("https://hotell.difi.no/api/json/bergen/lekeplasser?", "playground",true);

					}
					else if(iD == "playground"){
						pgJson = JSON.parse(xhr.response);
						removeEntry("P");
						if(favChecker){
							initFav();
						}
						else{
							initPlayground();
						}
					}
				}
				else if(xhr.getResponseHeader('content-type') == "application/json; charset=utf-8") { // Separate check due to non uniform responceHeader
					if(iD == "pub") {
						pubJson = JSON.parse(xhr.response);
						initPub();
						console.log("Get request succesfull");
					}
				}
				else {
					console.log("Get Request failed: Not JSON Type");
				}
		}
	}
	xhr.send();
}
/**
	*@desc: To provide uniform arrays for functions, .entries is removed from datasets.
	*@param: target - string. Defines what dataset to process.
*/
function removeEntry(target) {
	var dataset = null;
	if(target == "T") {
		dataset = toiletJson;
	}
	else if(target == "P"){
		dataset = pgJson;
	}
	else {
		console.log("Failure in removeEntry(): Unspecified Target")
	}
	var temp = [];
	for(var i = 0; i < dataset.entries.length; i++) {
		temp.push(dataset.entries[i])
	}
	if(target == "T"){
		toiletJson = temp;
	}
	else if(target == "P"){
		pgJson = temp;
	}
}
//**************************************************************************************************************************************
// Search Functions
/**
	*@desc: QuickSearch result in one long string with search parameters. This functions process slice it into value pairs where applicable,
	* and a full string containing free search info such as street adress or name information. Utilize subprocess fixLanguage().
*/
function quickQuery(){
	queryResult =[];
	var url = window.location.href;
	var temp = url.split("=");
	var rawQuery = temp[1].split("+")
	var streetName = [];
	var streetCheck = false;

	for(var i = 0; i < rawQuery.length;i++){ //handles parameters formed as value pairs i.e. stringId:Value
		var parameter = rawQuery[i];
		if(parameter.includes("%3A")){
			parameter = parameter.split("%3A");
			queryResult.push(parameter)
		}
		else{
			streetName.push(parameter);
			streetCheck = true;
		}
	}
	if(streetCheck){ //creates a search parameters based on base strings, freesearch.
		var fullString = [];
		fullString[0] = "string";
		var blend = "";

		for(var i = 0; i<streetName.length;i++){
			if(blend == ""){
				blend = streetName[i];
				blend = fixLanguage(blend);
			}
			else{
				blend = blend + " " + streetName[i];
				blend = fixLanguage(blend);
			}
		}
		blend = blend.toUpperCase();
		fullString.push(blend);
		queryResult.push(fullString);
	}
}
/**
	*@desc: Advance search splice the form data from the url into search parameter couples (stringId:value) and update it in queryResult.
	*@return:
*/
function advancedQuery() {
	queryResult = [];
	var url = window.location.href;
	var temp = url.split("?");
	var rawQuery = temp[1].split("&");

	for(var i = 0; i < rawQuery.length; i++) {
		var temp = rawQuery[i].split("=");
		if(temp[1] != "") {
			queryResult.push(temp);
		}
	}
	console.log("Advande Query complete:");
	console.log(queryResult);
}
/**
	*@desc: Subsearch function. Checks if the string given by freesearch is included in any of the three string variables denoted by testlist.
	*@param: int: localize the current array entry to search through.  array: defines what array to process
	*@return:
*/
function findStringMatch(int,array){
	var testList= ["place", "plassering", "adresse"]
	for(var i = 0; i<3;i++){
		console.log(array[int][testList[i]] + " " +finder("string",queryResult));
		if(array[int][testList[i]].toUpperCase().includes(finder("string",queryResult))){
			return true;
		}
	}
	return false;
}
/**
	*@desc: Finds a value in an array couple based on stringId (stringId:value)
	*@param: string: stringId to search with. Array: array to process
	*@return: value. If nothing matches stringId: undefined.
*/
function finder(string,array) {
	var result;
	for(var i = 0; i<array.length; i++) {
		if(array[i][0] == string){
			result = array[i][1];
		}
	}
	return result;
}
/**
	*@desc: Main search function for pub.html. Goes through each search parameters defined by user and created by advancedSearch().
	* If all checks applicable from queryData checks out, the result is pushed into resultList. Utilizes subfunctions pubString() and finder().
	*@param: array-array. dataset to be processed.
*/
function matchPub(array) {
	var threshold = queryResult.length
	var tCounter = 0;
	resultList = [];
	for(var j = 0; j < array.length; j++) {
		tCounter = 0;
		tCounter = tCounter + pubString("Type",j,array); 
		tCounter = tCounter + pubString("Adresse",j,array);
		tCounter = tCounter + pubString("Pub",j,array);

		if(finder("Aldersgrense",queryResult)){ 
			var searchLimit = parseInt(finder("Aldersgrense",queryResult));
			var pubLimit = parseInt(array[j]["Aldersgrense"]);
			if(searchLimit >= pubLimit) {
				tCounter++;
			}
		}
		if(tCounter == threshold){
			resultList.push(array[j]);
		}
	}
	console.log("Matches found: " + resultList.length);
}
/**
	*@desc: Subfunction of matchPub(), utilize the subsearch function finder().
	*@param: string: stringId to search with. Int: location in array to search through. array: Array to process.
	*@return: int, counter value. 1 if match found, 0 if not.
*/
function pubString(string, int,array) {
	if(finder(string,queryResult)){
			var temp = array[int][string].toUpperCase();
			if(temp.includes(finder(string,queryResult))){
				return 1;
			}
		}
	return 0;
}
/**
	*@desc: Main general search. Itterate through a given dataset and goes through checks depending on search parameters stored in queryResult.
	* if all search parameters is matched, adds result to resultList.
	* Utilize subsearch functions findStringMatch() for string checks, checkDate() for date and time matching and priceSolver() for price matching.
	*@param: array: array to process through
*/
function matchResult(array) {
	var threshold = queryResult.length
	var tCounter = 0;
	resultList = [];

	for(var j = 0; j < array.length; j++){
		tCounter = 0;
		for(var i = 0; i < queryResult.length; i++) {
			if(array[j][queryResult[i][0]] == queryResult[i][1]){ //handles all binary 1 or NULL search parameters
				tCounter++;
			}
		}
		if(finder("string",queryResult)) { //check regarding pure string values
			if(findStringMatch(j,array)){
				tCounter++;
			}
		}
		if(finder("openNow",queryResult)=="y") { //search match on current time
			if(checkDate(j,false,array)){
				tCounter++;
			}
		}
		if(finder("openWhen",queryResult) != undefined) { // search match on a given search parameter time
			var tempTime = getTime();
			if(parseFloat(finder("openWhen",queryResult))<parseFloat(concot(tempTime))){
				if(checkDate(j,true,array)) {
					tCounter++;
				}
			}
			else{
				if(checkDate(j,false,array)){
					tCounter++;
				}
			}
		}
		tCounter = tCounter + priceSolver(j,array); // search match on price and/or free.
		if(tCounter >= threshold){
			resultList.push(array[j]);
		}
	}
	console.log(resultList);
	console.log("Matches found: " + resultList.length);
}
/**
	*@desc: subsearch function that checks if condition satisfy the "free" and/or "given price" search parameters.
	*@param: int: search localization in an array. array: array to process
	*@return: int-counter. 0 if no matches found, 1 if either conditions exist or is satisfied, or 2 if both conditions exist and are satisfied
*/
function priceSolver(int,array) {
	var counter = 0;
	if(finder("gratis",queryResult)==array[int]["pris"] || array[int]["pris"]== "0"){
		if(finder("pris",queryResult) != undefined){
			counter++;
		}
	}
	else if(finder("pris",queryResult) != undefined) {
		if(parseInt(array[int]["pris"]) <= parseInt(finder("pris",queryResult))) {
			counter++;
		}
	}
	return counter;
}
// Checks if search time matches current open time. Takes an int to search current toilet in question, boolean to adjust if it searches today or tomorrow.
/**
	*@desc: subsearch function to handle date and times checks.
	*@param: int - location to search in. tomorrow-boolean: If true, adjust search relate to tomorrow. array: array to process
	*@return: boolean: true if match is found. False if no match.
*/
function checkDate(int,tomorrow,array){
	var dateInfo = getTime();
	if(tomorrow){ //adjust day if needed
		if(dateInfo[2] == 6) {
			dateInfo[2] = 0;
		}
		else{
			dateInfo[2] = dateInfo[2]+1;
		}
	}
	var hourFloat = concot(dateInfo);
	if(finder("openWhen",queryResult) != undefined) {
		hourFloat = parseFloat(finder("openWhen",queryResult));
	}

	if(dateInfo[2] == 6){
		var saturday = array[int]["tid_lordag"].split(" - ");
		if(parseFloat(saturday[0])<hourFloat&&parseFloat(saturday[1])>hourFloat || array[int]["tid_lordag"] == "ALL"){
			return true;
		}
		else {
			return false;
		}
	}
	else if (dateInfo[2] == 0) {
		var sunday = array[int]["tid_sondag"].split(" - ");
		if(parseFloat(sunday[0])<hourFloat &&parseFloat(sunday[1])>hourFloat || array[int]["tid_sondag"] == "ALL"){
			return true;
		}
		else {
			return false;
		}
	}
	else {
		var weekday = array[int]["tid_hverdag"].split(" - ");
		if(parseFloat(weekday[0])<hourFloat&&parseFloat(weekday[1])>hourFloat || array[int]["tid_hverdag"] == "ALL"){
			return true;
		}
		else {
			return false;
		}
	}
}
//**************************************************************************************************************************************
// HTML Manipulators
/**
	*@desc: Creates a numbered list with names in "targetList" based on array. Also creates a header based on boolean in "targetHeader".
	*@param: array: array to create list from. boolean: Defines what will be in the header of the list.
*/
function listCreator(array,boolean) {
	if(boolean){
		var header = "<h1>Søkbare punkter</h1>";
		document.getElementById("targetHeader").innerHTML = header;
	}
	else{
		var header ="<h1>Resultat</h1>"
		document.getElementById("targetHeader").innerHTML = header;
	}
	var resultLi = "";
	for(var i = 0; i < array.length; i++){
		resultLi = resultLi + "<li>" + array[i]["plassering"] + "</li>";
	}
	document.getElementById("targetList").innerHTML = resultLi;

}
/**
	*@desc: Creates a numbered list with names, distance and type  in "targetlist". Also creates a header in "targetHeader".
	*@param: array to create list from.
*/
function distanceList(array) {
	var resultLi = "";
	for(var i = 0; i < array.length; i++){
		if(i == 0) {
			resultLi = resultLi + "<h1>Søkepunkt</h1>" + "<li>" + array[i][1] + "</li>" + "<h1>Resultater</h1>" ;
		}
		else{
			var meter = Math.round(array[i][2]);
			resultLi = resultLi + "<li>" + array[i][1] + ", avstand: " + meter + " meter unna. (" + array[i][0] + ")</li>"
		}
	}
	document.getElementById("targetList").innerHTML = resultLi;
}
/**
	*@desc: Creates a dropdown selection meny with names and form id.
	*@param: array: array to create list from
*/
function selectCreator(array) {
	var resultLi = "<select name='id' form='selector'>";
	for(var i = 0; i < array.length; i++){
		resultLi = resultLi + "<option value=" + array[i]["id"] +">" + array[i]["plassering"] + "</option>";
	}
	resultLi = resultLi + "</select>";
	document.getElementById("targetOption").innerHTML = resultLi;
}
/**
	*@desc: Creates a div box containing header and paragraphs with information regarding pubs.
	*@param:  array: array to create list from.
*/
function pubList(array) {
	var resultLi = "";
	for (var i = 0; i < array.length; i++) {
		resultLi = resultLi + "<div class = pubBox><h1>" + array[i]["Pub"] + "</h1>";
		if(array[i]["Type"] != ""){
			resultLi = resultLi + "<p>Type: " + array[i]["Type"] + "</p>";
		}
		if(array[i]["Diverse"] != ""){
			resultLi = resultLi + "<p>Beskrivelse: " + array[i]["Diverse"] + "</p>";
		}
		if(array[i]["Apningstider"] != ""){
			resultLi = resultLi + "<p>Åpningstider: " + array[i]["Apningstider"] + "</p>";
		}
		if(array[i]["Aldersgrense"] != ""){
			resultLi = resultLi + "<p>Aldersgrense: " + array[i]["Aldersgrense"] + "</p>";
		}
		if(array[i]["Adresse"] != ""){
			resultLi = resultLi + "<p>Adresse: " + array[i]["Adresse"] + "</p>";
		}
		if(array[i]["Inngangspris"] != "") {
			resultLi = resultLi + "<p>Inngangspris: " + array[i]["Inngangspris"] + "</p>";
		}
		if(array[i]["Kleskode"] != "") {
			resultLi = resultLi + "<p>Kleskode: " + array[i]["Kleskode"] + "</p>";
		}
		if(array[i]["Hjemmeside"] != ""){
			resultLi = resultLi + "<p><a href=" + array[i]["Åpningstider"] + ">Hjemmeside</a></p>";
		}
		if(array[i]["Tlf"] != ""){
			resultLi = resultLi + "<p>Tlf: " + array[i]["Tlf"] + "</p>";
		}
		if(array[i]["Mail"] != ""){
			resultLi = resultLi + "<p>Mail: " + array[i]["Mail"] + "</p>";
		}
		resultLi = resultLi + "</div>";
	}
	document.getElementById("targetShow").innerHTML = resultLi;
}
//**************************************************************************************************************************************
//Distance calculation functions
/**
	*@desc: main function to compute nearest neighbours in datasets based on a user defined entry in toilet dataset. First it creates an array
	* of all entries with Type, name, distance,latitude and longitude. Then searches through this array to find a certain amount of closes neighbours
	* based on searchCap. The final step is then to order the results in ascending order. Uses subsearch routines getId() to find search parameter.
	* getDistance to get distance between search parameter and the given point, findHighestValue() to calculate what entry in results to replace
	* and orderList() to order the final result list in ascending order acording to distance.
	*@param: toilets - array: dataentries of toilets. playgrounds - array: dataentries of playgrounds. searchCap - int: maximum entries to keep as results.
	*@return: ordered array with results.
*/
function findNearestMatches(toilets,playgrounds,searchCap) {
	var searchList = [];
	var searchResult = [];
	var searchIndex = 0;
	var id = getId();
	var intId = parseInt(id);

	for(var i = 0; i < toilets.length; i++) { // Creates list of all entries with necessary info and distance to search point.
		if(toilets[i]["id"] != id) {
			var tempSpot =["Toalett",toilets[i]["plassering"],getDistance(toilets[intId-1],toilets[i]),toilets[i]["latitude"],toilets[i]["longitude"]];
			searchList.push(tempSpot);
		}
	}
	for(var i = 0; i < playgrounds.length; i++) {
		var tempSpot = ["Lekeplass", playgrounds[i]["navn"],getDistance(toilets[intId-1],playgrounds[i]),playgrounds[i]["latitude"],playgrounds[i]["longitude"]];
		searchList.push(tempSpot);
	}

	var highestFound = false;
	var highestInfo = null;
	for(var i = 0; i < searchList.length; i++) { // iterates through the new list of all entries. If lower value than is in result is found, highest value is replaced.
		if(searchResult.length == searchCap){
			if(highestFound == false) {
				highestInfo = findHighestValue(searchResult);
				highestFound = true;
			}
			if(highestInfo[1] > searchList[i][2]){
				searchResult[highestInfo[0]] = searchList[i];
				highestFound = false;
			}

		}
		else{
			searchResult.push(searchList[i]);
		}
	}
	searchResult = orderList(searchResult); // orders list in ascending order
	var t = [];
	var tempS = ["",toilets[intId-1]["plassering"],"",toilets[intId-1]["latitude"],toilets[intId-1]["longitude"]];
	t.push(tempS);
	for(var i = 0; i < searchResult.length; i++){
		t.push(searchResult[i]);
	}
	searchResult = t;
	return searchResult;
}
/**
	*@desc: Find the highest value in an array.
	*@param: array to process through
	*@return: array with the index location of the entry and the distance value of the entry
*/
function findHighestValue(array) {
	var tempMeter = 0;
	var tempId = 0;
	var result = [];
	for(var i = 0; i < array.length; i++) {
		if(array[i][2] > tempMeter){
			tempMeter = array[i][2];
			tempId = i;
		}
	}
	result.push(tempId);
	result.push(tempMeter);
	return result;
}
/**
	*@desc: Orders an array in ascending order by the distance-meter value.
	*@param: array to process through
	*@return: an ordered array
*/function orderList(array){
	var listResult = [];
	for(var i = 0; i < array.length; i++){
		if(i == 0) {
			listResult.push(array[i]);
		}
		else{
			var inserted = false;
			for(var j = 0; j < listResult.length; j++) {
				if(listResult[j][2] > array[i][2] && inserted == false){
					for(var x = listResult.length-1; x >= j; x--){
						listResult[x+1] = listResult[x];
						if(x==j){
							inserted = true;
							listResult[x] = array[i]; 
						}
					}
				}
			}
			if(inserted == false){
				listResult.push(array[i]);
			}
		}
	}
	return listResult;
}
/**
	*@desc: calculates the distance between two array entries. Uses the google.maps spherical distance calculation function
	*@param: point1-array, point2-array. Both are array entries from datasets.
	*@return: z-float. Distance in meters between the two points.
*/
function getDistance(point1,point2) {
	var x = new google.maps.LatLng(parseFloat(point1["latitude"]),parseFloat(point1["longitude"]));
	var y = new google.maps.LatLng(parseFloat(point2["latitude"]),parseFloat(point2["longitude"]));
	var z =  google.maps.geometry.spherical.computeDistanceBetween(x,y);
	return z;
}
//**************************************************************************************************************************************
//Map Functions
/**
	*@desc: Creates the google map.
*/
function initMap() {
		map = new google.maps.Map(document.getElementById("map"), {
	});
}
/**
	*@desc: Generate markers based on array entry. Also manipulates the map zoom level to view all markers.
	*@param: array - array to process. boolean : adjust code to array construction.
	*@return:
*/
function initMarker(array,boolean) {
	deleteMarkers();
	bounds  = new google.maps.LatLngBounds();
	for(var i=0;i<array.length;i++){
		var id = i + 1;
		var loc = null;
		if(boolean){
			loc = new google.maps.LatLng(array[i]["latitude"], array[i]["longitude"]);
		}
		else{
			loc = new google.maps.LatLng(array[i][3], array[i][4]);
		}
		bounds.extend(loc);

		var marker = new google.maps.Marker({
		position: loc,
		map:map,
		label: id.toString(),
		title: id.toString()
		});
		markers.push(marker);
	}

	map.fitBounds(bounds);
	map.panToBounds(bounds);
}
/**
	*@desc: Deletes all markers from map.
*/
function deleteMarkers() {
	for(var i = 0; i<markers.length;i++) {
		markers[i].setMap(null);
	}
	markers = [];
}