//**************************************************************************************************************************************
//Global variable list
var tempJson = null;
var toiletArray = null;
var playArray = null;
var map = {};
var markers = [];
var queryResult = {};
var resultList = {};

var dataset = null;

//**************************************************************************************************************************************
//Boot functions

//Used in body onload to initiate XML call functions. Context is ID of what functions should follow after get request is complete.
function initSystem(context) {
	if(context == "toilet") {
		getFile("https://hotell.difi.no/api/json/bergen/dokart?", "toilet");
	}
	if(context == "playground") {
		getFile("https://hotell.difi.no/api/json/bergen/dokart?", "favToilet");
	}
	if(context =="favToilet") {
		getFile("https://hotell.difi.no/api/json/bergen/lekeplasser?", "playground");
	}
}

//Function that init all effects, starts running when XML request is complete.
function initToilet(){
	setEffect();
}

function initPlayground() {
	hotfix(playArray);
	initMarker(playArray);
}

function initFav(){
	selectCreator(toiletArray);
	var url = window.location.href;
	if(url.includes("?")){
		resultList = findNearestMatch(toiletArray);
		hotfix(resultList);
		initMarker(resultList);
		listCreator(resultList);

	}
}

function setEffect(){
	var url = window.location.href;
	if(url.includes("?")){
		if(url.includes("quickSearch")){
			qsQuery();
			matchResult();
			hotfix(resultList);
			listCreator(resultList);
			initMarker(resultList);
		}
		else{
			generateQuery();
			matchResult();
			hotfix(resultList);
			listCreator(resultList);
			initMarker(resultList);
		}
	}
	else{
		listCreator(toiletArray);
		initMarker(toiletArray);
	}
}

//**************************************************************************************************************************************
// General & Miscellaneous functions

// Returns an array with [Hour, Minutes, Day]
function getTime() {
	var fullTime = new Date();
	var temp = [];
	temp.push(fullTime.getHours(), fullTime.getMinutes(),fullTime.getDay());
	return temp;
}

function finder(string) {
	var result;
	for(var i = 0; i<queryResult.length; i++) {
		if(queryResult[i][0] == string){
			result = queryResult[i][1];
		}
	}
	return result;
}

// makes æ, ø , å viable
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

// Combines two numbers into a float, used to make hours and minutes into a float to represent time. Takes an Array to pull numbers from
function concot(array){
	var temp = array[0]+"."+array[1];
	temp = parseFloat(temp);
	return temp;
}

// Due to non uniform functions, hotfix needed to add entries prefix.
function hotfix(){
	var temp = {entries:[]};
	for(var i = 0; i<resultList.length; i++) {
		temp.entries.push(resultList[i]);
	}
	resultList = temp;
}

function getId() {
	var url = window.location.href;
	url= url.split("?");
	result = url[1].split("=");
	return result[1];
}

//**************************************************************************************************************************************
//File Retrieval

//Function to retrieve dataset from internet based on url. Upon retrival, initiates function calls to boot functions demanding dataset to work.
function getFile(url,iD) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET",url);

	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4 && xhr.status == 200){
				if(xhr.getResponseHeader('content-type') == "application/json;charset=UTF-8") {
					if(iD == "toilet"){
						dataset = JSON.parse(xhr.response);
						removeEntry();
						initToilet();
					}
					else if(iD == "favToilet") {
						dataset = JSON.parse(xhr.response);
						removeEntry();
						initFav();
					}
					else if(iD == "playground"){
						dataset = JSON.parse(xhr.response);
						removeEntry();
						initPlayground();
					}
					console.log("Get request succesfull");
				}
				else {
					console.log("Get Request failed: Not JSON Type");
				}
		}
	}
	xhr.send();
}

// removies .entries from dataset
function removeEntry() {
	var temp = [];
	for(var i = 0; i < dataset.entries.length; i++) {
		temp.push(dataset.entries[i])
	}
	dataset = temp;
}
//**************************************************************************************************************************************
// Søke funksjoner

// creates an array with search parameters from the quicksearch query
function qsQuery(){
	queryResult = [];
	var url = window.location.href;
	var temp = url.split("=");
	var queryRaw = temp[1].split("+");
	var streetName = [];
	var easyCheck = false;

	for(var i = 0; i<queryRaw.length;i++){
		var parameter = queryRaw[i];
		if(parameter.includes("%3A")){
			parameter = parameter.split("%3A");
			queryResult.push(parameter);
		}
		else{
			streetName.push(parameter);
			easyCheck = true;
		}
	}
	if(easyCheck){
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
		console.log(fullString);
		queryResult.push(fullString);
	}
}

// Creates an array with search parameters from the Advanced Search query
function generateQuery() {
	queryResult = [];
	var url = window.location.href;
	var temp = url.split("?");
	var queryRaw = temp[1].split("&");

	for(var i = 0; i < queryRaw.length; i++) {
		var temp = queryRaw[i].split("=");
		if(temp[1] != "") {
			queryResult.push(temp);
		}
	}
}

function matchResult() {
	var correctValue = queryResult.length;
	resultList = [];
	var correctCounter = 0;

	for(var j = 0; j<toiletArray.entries.length; j++) {
		correctCounter = 0;
		for(var i = 0; i<queryResult.length;i++) {
			if(toiletArray.entries[j][queryResult[i][0]] == queryResult[i][1]){
				correctCounter++;
			}
		}
		if(finder("openWhen") != undefined) {
			var tempTime = getTime();
			if(parseFloat(finder("openWhen"))<parseFloat(concot(tempTime))){
				if(checkDate(j,true)) {
					correctCounter++;
				}
			}
			else{
				if(checkDate(j,false)){
					correctCounter++;
				}
			}
		}
		if(finder("string")) {
			if(findStringMatch(j)){
				correctCounter++;
			}
		}
		if(toiletArray.entries[j]["pris"] == finder("gratis")) {
			correctCounter++;
		}
		if(parseInt(toiletArray.entries[j]["pris"])<=parseInt(finder("pris")) || toiletArray.entries[j]["pris"] == "NULL") {
			correctCounter++;
			console.log(queryResult);
		}
		if(finder("openNow")=="y") {
			if(checkDate(j,false)){
				correctCounter++;
			}
		}
		if(correctCounter == correctValue) {
			resultList.push(toiletArray.entries[j]);
		}
	}
	console.log("Matches found: " + resultList.length);
}

// Function to check if a string matches search parameter. Takes "int" as current itteration toilet to search through
function findStringMatch(int){
	var testList= ["place", "plassering", "adresse"]
	for(var i = 0; i<3;i++){
		console.log(toiletArray.entries[int][testList[i]] + " " +finder("string"));
		if(toiletArray.entries[int][testList[i]].toUpperCase().includes(finder("string"))){
			return true;
		}
	}
	return false;
}

// Checks if search time matches current open time. Takes an int to search current toilet in question, boolean to adjust if it searches today or tomorrow.
function checkDate(int,bolean){
	var dateInfo = getTime();
	if(bolean){
		if(dateInfo[2] == 6) {
			dateInfo[2] = 0;
		}
		else{
			dateInfo[2] = dateInfo[2]+1;
		}
	}
	var hourFloat = concot(dateInfo);
	if(finder("openWhen") != undefined) {
		hourFloat = parseFloat(finder("openWhen"));
	}

	if(dateInfo[2] == 6){
		var saturday = toiletArray.entries[int]["tid_lordag"].split(" - ");
		if(parseFloat(saturday[0])<hourFloat&&parseFloat(saturday[1])>hourFloat || toiletArray.entries[int]["tid_lordag"] == "ALL"){
			return true;
		}
		else {
			return false;
		}
	}
	else if (dateInfo[2] == 0) {
		var sunday = toiletArray.entries[int]["tid_sondag"].split(" - ");
		if(parseFloat(sunday[0])<hourFloat &&parseFloat(sunday[1])>hourFloat || toiletArray.entries[int]["tid_sondag"] == "ALL"){
			return true;
		}
		else {
			return false;
		}
	}
	else {
		var weekday = toiletArray.entries[int]["tid_hverdag"].split(" - ");
		if(parseFloat(weekday[0])<hourFloat&&parseFloat(weekday[1])>hourFloat || toiletArray.entries[int]["tid_hverdag"] == "ALL"){
			return true;
		}
		else {
			return false;
		}
	}
}


//**************************************************************************************************************************************
// HTML Manipulators

//Creates list
function listCreator(list) {
	var resultLi = "";
	for(var i = 0; i < list.entries.length; i++){
		resultLi = resultLi + "<li>" + list.entries[i]["plassering"] + "</li>";
	}
	document.getElementById("targetList").innerHTML = resultLi;

}

function selectCreator(list) {
	var resultLi = "<select name='id' form='selector'>";
	console.log(list);
	for(var i = 0; i < list.entries.length; i++){
		resultLi = resultLi + "<option value=" + list.entries[i]["id"] +">" + list.entries[i]["plassering"] + "</option>";

	}
	resultLi = resultLi + "</select>";
	document.getElementById("targetOption").innerHTML = resultLi;
}

//**************************************************************************************************************************************
//Map Functions

function findNearestMatch(array){
	var id = getId();
	var intId = parseInt(id);
	var firstRun = true;
	var minDis = null;
	var result = [];
	var distanceList()

	for(var i = 0; i <array.entries.length; i++) {
		if(array.entries[i]["id"] != id) {
			console.log("int : " + i);
			console.log(array.entries[i]);
			console.log("int ID : " + intId);
			console.log(array.entries[intId]);
			var temp = getDistance(array.entries[intId-1],array.entries[i])
			if(temp < minDis || firstRun == true) {
				minDis = temp;
				firstRun = false;
				result[1] = array.entries[i];
			}

		}
		else {
			result[0] = array.entries[i];
		}

	}
	console.log(result);
	return result;
}

function initMap() {
		map = new google.maps.Map(document.getElementById("map"), {
		zoom: 13,
		center: center()
	});
}

function center() {
	//temp solution, needs to be fleshed out
	var baseLoc = {lat: 60.387931, lng: 5.321763};
	return baseLoc;
}

// calculates distance in meters between two points on a spherical earth
function getDistance(point1,point2) {
	var x = new google.maps.LatLng(parseFloat(point1["latitude"]),parseFloat(point1["longitude"]));
	var y = new google.maps.LatLng(parseFloat(point2["latitude"]),parseFloat(point2["longitude"]));
	var z =  google.maps.geometry.spherical.computeDistanceBetween(x,y);
	return z;
}

// Generates all markers
function initMarker(arrayList) {
	deleteMarkers();
	for(var i=0;i<arrayList.entries.length;i++){
		var id = i + 1;
		var marker = new google.maps.Marker({
		position: new google.maps.LatLng(arrayList.entries[i].latitude, arrayList.entries[i].longitude),
		map:map,
		title: id.toString()
		});
		markers.push(marker);
	}
}

// Clears markers from map and array
function deleteMarkers() {
	for(var i = 0; i<markers.length;i++) {
		markers[i].setMap(null);
	}
	markers = [];
}