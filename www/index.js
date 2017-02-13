var styleCache = {};

var clusterStyle = function(feature, resolution) {
    var size = feature.get('features').length;
    var style = styleCache[size];
    if (!style) {
        style = [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 20,
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
                radius: 20,
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

var osmLayer = new ol.layer.Tile({
    source: new ol.source.OSM()
});

var theatresLayer = new ol.layer.Vector({
    source: new ol.source.Cluster({
        distance: 60,
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

var view = new ol.View({
	center: [1181238, 6687625],
	zoom: 6
});

var map = new ol.Map({
    target: 'mapDiv',
    layers: [osmLayer, theatresLayer],
    overlays: [popup],
	loadTilesWhileAnimating: true,
    view: view
});

var selectInteraction = new ol.interaction.Select({
    condition: ol.events.condition.singleClick,
    layers: [theatresLayer],
    style: clusterStyleSelected
});

map.addInteraction(selectInteraction);

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

        if (weirdPath['name']) {
            nameP.innerHTML = '<b>' + weirdPath['name'] + '</b>';
        } else {
            nameP.innerHTML = '';
        }

        var infoText = '';
		var notWant = ['geometry', '@id', 'id', 'amenity', 'image','name'];
		
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

var	geolocation = new ol.Geolocation({
	projection: map.getView().getProjection(),
	tracking: false,
	trackingOptions: {
		enableHighAccuracy: true,
		maximumAge: 5000  
	}
});

var showMe = document.getElementById('trackButton');

var handleGetPosition = function(e) {
    var trackingwasalreadyon = geolocation.getTracking(); 
    console.log(trackingwasalreadyon);
    if(trackingwasalreadyon){ 
        geolocation.setTracking(false);
            //******************************
            //**                          **
            //** CODE HERE TO REMOVE THE  **
            //** GEOLOCATION LAYERS       **
            //**                          **
            //******************************
		showMe.innerHTML = 'track me';
    } else {
		geolocation.setTracking(true);
		getPosition();
		showMe.innerHTML = 'stop';
    } 
};

showMe.addEventListener('click', handleGetPosition, false);
showMe.addEventListener('touchstart', handleGetPosition, false);

function getPosition() {
    var accuracyFeature = new ol.Feature();
    geolocation.on('change:accuracyGeometry', function() {
		accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
    });
    var positionFeature = new ol.Feature();
    positionFeature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
			radius: 4,
			fill: new ol.style.Fill({
				color: '#3399CC'
			}),
			stroke: new ol.style.Stroke({
				color: '#fff',
				width: 1
			})
        })
    }));
    geolocation.on('change:position', function() {
        var pos = geolocation.getPosition();
        positionFeature.setGeometry(pos ?
            new ol.geom.Point(pos) : null);
		view.animate({center: pos}, {zoom: 18},{duration: 4000});
    });

    new ol.layer.Vector({
        map: map,
        source: new ol.source.Vector({
			features: [accuracyFeature, positionFeature]
        })
    });  
};