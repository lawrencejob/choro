var gdal = require ("gdal");
var restify = require ("restify");

var global_index = {};

var start = Date.now();

console.log("Opening");

var wgs84_wkt = 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';

var areas = [
    {
        name:"LSOA",
        file: {
            name: "C:\\Users\\lawrence.job\\Downloads\\Lower_Layer_Super_Output_Areas_December_2011_Generalised_Clipped__Boundaries_in_England_and_Wales\\Lower_Layer_Super_Output_Areas_December_2011_Generalised_Clipped__Boundaries_in_England_and_Wales.shp",
            idfield: "lsoa11cd",
            namefield: "lsoa11nm",
            layer:0
        }
    }
]

// for every area, import them
var area_promises = areas.map(importAreaType);

Promise.all(area_promises).then(function(results) {
    
    for(var i in results) {
        global_index[areas[i].name] = results[i];
    }

    console.info("Done in: " + (Date.now() - start) + " ms.");

    getAreasWithin("LSOA", 0, 1, -90, 90);

    console.info("Done in: " + (Date.now() - start) + " ms.");

    var server = restify.createServer();
    server.use(restify.queryParser());
    server.use(restify.gzipResponse());

    server.get('/areas-contained/:type', function (req, res, next) {

        var s = Date.now();

        console.log(req.params);

        if(req.params.type && req.params.minx && req.params.maxx && req.params.miny && req.params.maxy
            && !isNaN(req.params.minx) && !isNaN(req.params.maxx) && !isNaN(req.params.miny) && !isNaN(req.params.maxy) ) {

            var areas = getAreasWithin(req.params.type, parseFloat(req.params.minx), parseFloat(req.params.maxx), parseFloat(req.params.miny), parseFloat(req.params.maxy));
            var output = [];

            for(var i in areas) {
                var output_entity = {
                    code: areas[i].id,
                    name: areas[i].name
                };

                output.push(output_entity);
            }

            res.send({
                "time" : (Date.now() - s) + " ms",
                "count" : output.length,
                "body" : output
            });

        } else {

            res.send({
                "errors": ["Invalid request."]
            });

        }

    });

    server.get('/geometry-contained/:type', function (req, res, next) {

        var s = Date.now();

        console.log(req.params);

        if(req.params.type && req.params.minx && req.params.maxx && req.params.miny && req.params.maxy
            && !isNaN(req.params.minx) && !isNaN(req.params.maxx) && !isNaN(req.params.miny) && !isNaN(req.params.maxy) ) {

            var areas = getAreasWithin(req.params.type, parseFloat(req.params.minx), parseFloat(req.params.maxx), parseFloat(req.params.miny), parseFloat(req.params.maxy));
            var output = [];

            for(var i in areas) {
                var output_entity = {
                    code: areas[i].id,
                    name: areas[i].name,
                    geo: areas[i].geometry.toJSON()
                };

                output.push(output_entity);
            }

            res.send({
                "time" : (Date.now() - s) + " ms",
                "count" : output.length,
                "body" : output
            });

        } else {

            res.send({
                "errors": ["Invalid request."]
            });

        }

    });

    server.listen(8080, function () {
        console.log('%s listening at %s', server.name, server.url);
    })

});

function importAreaType(type_definition) {

    return new Promise(function(resolve, reject) {

        var file = gdal.open(type_definition.file.name);

        var layer = file.layers.get(type_definition.file.layer);

        console.log("Importing '" + type_definition.name + "' with " + layer.features.count() + " features.");

        var prom = indexGeographyLayer(type_definition.file.idfield, type_definition.file.namefield, layer);

        prom.then(function(result) {

            console.log("Closing file");

            file.close();

            resolve(result);
        });

    });
}

function indexGeographyLayer(idfield, namefield, layer) {

    return new Promise(function(resolve, reject) {

        console.log("promise running");

        var gi = {};

        var errors = 0;

        layer.features.forEach(function(val, index) {

            var id = val.fields.get(idfield);
            var name = val.fields.get(namefield);
            var north = null, west = null, south = null, east = null;

            var geometry = val.getGeometry();

            geometry.transformTo(gdal.SpatialReference.fromWKT(wgs84_wkt));

            gi[id] = {
                "maxX":geometry.getEnvelope().maxX,
                "minX":geometry.getEnvelope().minX,
                "maxY":geometry.getEnvelope().maxY,
                "minY":geometry.getEnvelope().minY,
                "name":name,
                "id":id,
                "geometry":geometry
            }

        });

        resolve(gi);
    
    })

}

function getAreasWithin(area_type, minX, maxX, minY, maxY) {
    var index = global_index[area_type];

    var output = [];

    for(var i in index) {

        //@todo temporary: does not work for threshold where longitude flicks from +180 to -180
        if( index[i].minX < maxX &&
            index[i].maxX > minX &&
            index[i].minY < maxY &&
            index[i].maxY > minY) {
                output.push(index[i]);
            }
    }

    return output;

}