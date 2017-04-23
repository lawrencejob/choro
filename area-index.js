const LayerImporter = require ("./layer-importer.js").LayerImporter;

class AreaIndex {
    
    constructor() {
        this.area_index = {};
    } 

    importAllLayers(layer_options) {

        var context = this;

        var layer_promises = layer_options.map((val) => {

            // create an importer object with the config
            const importer = new LayerImporter(val);

            // import the layer, providing the ready-to-go importer
            return context.importLayer(val.name, importer);

        });

        return Promise.all(layer_promises);
    }
    
    importLayer(layer_name, layer_importer) {

        var context = this;
        
        this.area_index[layer_name] = {};
        
        return layer_importer.import((id, name, gdal_geometry) => {
            
            context.area_index[layer_name][id] = {
                "maxX":gdal_geometry.getEnvelope().maxX,
                "minX":gdal_geometry.getEnvelope().minX,
                "maxY":gdal_geometry.getEnvelope().maxY,
                "minY":gdal_geometry.getEnvelope().minY,
                "name":name,
                "id":id,
                "geometry":gdal_geometry
            }
            
        });
        
    }

    getAreasWithin(area_type, minX, maxX, minY, maxY) {
        var index = this.area_index[area_type];

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
    
    
}

module.exports = {
    AreaIndex : AreaIndex
}