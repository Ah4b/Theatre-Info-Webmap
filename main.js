var styleCache = {};

var clusterStyle = function(feature, resolution) {
    var size = feature.get('features').length;
    var style = styleCache[size];
    if (!style) {
        style = [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                stroke: new ol.style.Stroke({
                    color: '#fff'
                }),
                fill: new ol.style.Fill({
                    color: '#3399cc'
                })
            }),
            text: new ol.style.Text({
                text: size.toString(),
                fill: new ol.style.Fill({
                    color: '#fff'
                })
            })
        })];
        styleCache[size] = style;
    }
    return style;
};

var styleCacheSelected = {};

var clusterStyleSelected = function(feature, resolution) {
    var size = feature.get('features').length;
    var style = styleCacheSelected[size];
    if (!style) {
        style = [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                stroke: new ol.style.Stroke({
                    color: '#fff'
                }),
                fill: new ol.style.Fill({
                    color: '#d85c49'
                })
            }),
            text: new ol.style.Text({
                text: size.toString(),
                fill: new ol.style.Fill({
                    color: '#fff'
                })
            })
        })];
        styleCacheSelected[size] = style;
    }
    return style;
};

var cartoLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'http://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    })
});

var stamenLayer = new ol.layer.Tile({
    source: new ol.source.Stamen({
        layer: 'watercolor'
    })
});

var labelLayer = new ol.layer.Tile({
    source: new ol.source.Stamen({
        layer: 'terrain-labels'
    })
});

var theatresLayer = new ol.layer.Vector({
    source: new ol.source.Cluster({
        distance: 20,
        source: new ol.source.Vector({
            url: 'theatres.geojson',
            format: new ol.format.GeoJSON()
        })
    }),
    style: clusterStyle
});

var popup = new ol.Overlay({
    element: document.getElementById('popupDiv'),
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    }
});

var map = new ol.Map({
    target: 'mapDiv',
    layers: [cartoLayer, theatresLayer],
    overlays: [popup],
    view: new ol.View({
        center: [1181238.3482360363, 6687625.618633177],
        zoom: 6
    })
});

var selectInteraction = new ol.interaction.Select({
    condition: ol.events.condition.singleClick,
    layers: [theatresLayer],
    style: clusterStyleSelected
});

map.addInteraction(selectInteraction);

var popupContent = document.getElementById('popupContent');
var infoDiv = document.getElementById('infoDiv');
var imageDiv = document.getElementById('imageDiv');
var nameP = document.getElementById('nameP');
var infoP = document.getElementById('infoP');

var displayFeatureInfo = function(pixel, coordinate) {
    var features = [];
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        features.push(feature);
    });

    if (features.length > 0) {
        var weirdPath = features[0].H.features[0].H

        popupContent.innerHTML = weirdPath['name'];

        if (weirdPath['name']) {
            nameP.innerHTML = '<b>' + weirdPath['name'] + '</b>';
        } else {
            nameP.innerHTML = '';
        }

        var infoText = '';
        var notWant = ['geometry', '@id', 'id', 'amenity', 'image'];
        for (var i = 0; i < Object.values(weirdPath).length; i++) {
            if (Object.values(weirdPath)[i] && !(notWant.indexOf(Object.keys(weirdPath)[i]) >= 0)) {
                if (Object.keys(weirdPath)[i] == "website") {
                    infoText += Object.keys(weirdPath)[i] + ': <a target="blank" href=' + Object.values(weirdPath)[i] + '>' + Object.values(weirdPath)[i] + '</a><br>';
                } else {
                    infoText += Object.keys(weirdPath)[i] + ': ' + Object.values(weirdPath)[i] + '<br>';
                }
            }
        }
        infoP.innerHTML = infoText;

        if (weirdPath['image']) {
            imageDiv.innerHTML = '<img style="width: 100%; object-fit: contain" src=' + weirdPath['image'] + '>';
        } else {
            imageDiv.innerHTML = '';
        }
        popup.setPosition(coordinate);
    } else {
        popupContent.innerHTML = '';
        popup.setPosition(undefined);
        infoP.innerHTML = '';
        nameP.innerHTML = '';
        imageDiv.innerHTML = '';
    }
};

map.on('click', function(evt) {
    var pixel = evt.pixel;
    var coordinate = evt.coordinate;
    displayFeatureInfo(pixel, coordinate);
});

popupCloser.onclick = function() {
    popup.setPosition(undefined);
    popupCloser.blur();
    return false;
};