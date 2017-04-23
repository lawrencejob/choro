var gdal = require ("gdal");
var restify = require ("restify");
const AreaIndex = require ("./area-index.js").AreaIndex;
const LayerImporter = require ("./layer-importer.js").LayerImporter;

var global_index = {};
var area_index = new AreaIndex();

var server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.gzipResponse());

var start = Date.now();

console.log("Opening");

var areas = [
    {
        name:"LSOA",
        file: {
            name: "X:\\Data\\Geography\\2011 LSOAs Clipped Generalised\\Lower_Layer_Super_Output_Areas_December_2011_Generalised_Clipped__Boundaries_in_England_and_Wales.shp",
            idfield: "lsoa11cd",
            namefield: "lsoa11nm",
            layer:0
        }
    }
]

var ai = new AreaIndex();

var load_all_layers = ai.importAllLayers(areas);

load_all_layers.then(() => {

    console.info("Done in: " + (Date.now() - start) + " ms.");

    ai.getAreasWithin("LSOA", 0, 1, -90, 90);

    console.info("Done in: " + (Date.now() - start) + " ms.");

    server.get('/areas-contained/:type', function (req, res, next) {

        var s = Date.now();

        console.log(req.params);

        if(req.params.type && req.params.minx && req.params.maxx && req.params.miny && req.params.maxy
            && !isNaN(req.params.minx) && !isNaN(req.params.maxx) && !isNaN(req.params.miny) && !isNaN(req.params.maxy) ) {

            var areas = ai.getAreasWithin(req.params.type, parseFloat(req.params.minx), parseFloat(req.params.maxx), parseFloat(req.params.miny), parseFloat(req.params.maxy));
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

            var areas = ai.getAreasWithin(req.params.type, parseFloat(req.params.minx), parseFloat(req.params.maxx), parseFloat(req.params.miny), parseFloat(req.params.maxy));
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
