var data = 'data/data.csv';
var maxZoom = 16;
var fieldSeparator = '|';
var baseUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
var baseAttribution = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
var subdomains = 'abc';
var clusterOptions = {showCoverageOnHover: false, maxClusterRadius: 60};
var labelColumn = "Name";
var opacity = 1.0;
