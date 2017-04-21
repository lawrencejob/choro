var gdal = require ("gdal");

var global_index = {};

var start = Date.now();

console.log("Opening");

var lsoa = gdal.open("X:\\Data\\Geography\\2011 LSOAs Clipped Generalised\\Lower_Layer_Super_Output_Areas_December_2011_Generalised_Clipped__Boundaries_in_England_and_Wales.shp");

var layer = lsoa.layers.get(0);

console.log("number of features: " + layer.features.count());
console.log("fields: " + layer.fields.getNames());
console.log("extent: " + JSON.stringify(layer.extent));
console.log("srs: " + (layer.srs ? layer.srs.toWKT() : 'null'));

indexGeographyLayer("LSOA", layer);

console.log("Closing");

lsoa.close();

console.info("Done in: " + (Date.now() - start) + " ms.");

function indexGeographyLayer(type, layer) {

    global_index[type] = {};

    var errors = 0;

    layer.features.forEach(function(val, index) {

        var name = "name";
        var north = null, west = null, south = null, east = null;

        var bounds = val.getGeometry().boundary();

        if(!bounds.points) {

            //console.log(val.fields.toObject());
            console.log(bounds);
            errors++;
            return;
        }

        // this can't be that efficient
        var points = bounds.points.toArray();

        for( var i in points ) {

            //console.log(points[i]);
        }

        //console.log(bounds);

        //global_index[type]
    });

    console.error(errors);

}