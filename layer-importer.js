var gdal = require ("gdal");

var wgs84_wkt = 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';

class LayerImporter {
    
    constructor(layer_config) {
        
        this.layer_config = layer_config;
        
    }
    
    import(index_single_area) {
        
        var type_definition = this.layer_config;
        
        return new Promise(function(resolve, reject) {
            
            var file = gdal.open(type_definition.file.name);
            
            var layer = file.layers.get(type_definition.file.layer);

            var count = 0;
            
            console.log("Importing '" + type_definition.name + "' with " + layer.features.count() + " features.");
            
            layer.features.forEach(function(val, index) {

                count++;
                
                var id = val.fields.get(type_definition.file.idfield);
                var name = val.fields.get(type_definition.file.namefield);
                var north = null, west = null, south = null, east = null;
                
                var geometry = val.getGeometry();
                
                geometry.transformTo(gdal.SpatialReference.fromWKT(wgs84_wkt));

                index_single_area(id, name, geometry);
                
            });
            
            
            file.close();
            
            resolve(count);
            
        });
    }
}

module.exports = {
    LayerImporter : LayerImporter
}