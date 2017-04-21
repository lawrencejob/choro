var gdal = require ("gdal");

var global_index = {};

var start = Date.now();

console.log("Opening");

var wgs84_wkt = 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';
var lsoa = gdal.open("C:\\Users\\lawrence.job\\Downloads\\Lower_Layer_Super_Output_Areas_December_2011_Generalised_Clipped__Boundaries_in_England_and_Wales\\Lower_Layer_Super_Output_Areas_December_2011_Generalised_Clipped__Boundaries_in_England_and_Wales.shp");

var layer = lsoa.layers.get(0);

console.log("number of features: " + layer.features.count());

var lsoa_promise = indexGeographyLayer("LSOA", layer);

console.log("Promise made");

Promise.all([lsoa_promise]).then(function(gi) {
    global_index["LSOA"] = gi;
});

console.log("Closing");

lsoa.close();

console.info("Done in: " + (Date.now() - start) + " ms.");

function indexGeographyLayer(type, layer) {

    return new Promise(function(resolve, reject) {

        console.log("promise running");

        var gi = {};

        var errors = 0;

        layer.features.forEach(function(val, index) {

            var name = "name" + Math.random();
            var north = null, west = null, south = null, east = null;

            var geometry = val.getGeometry();

            geometry.transformTo(gdal.SpatialReference.fromWKT(wgs84_wkt));

            gi[name] = {
                "maxX":geometry.getEnvelope().maxX,
                "minX":geometry.getEnvelope().minX,
                "maxY":geometry.getEnvelope().maxY,
                "minY":geometry.getEnvelope().minY,
                "name":name,
                "geometry":geometry
            }

        });

        resolve(gi);
    
    })

}