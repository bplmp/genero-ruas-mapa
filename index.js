// please generate your own at mapbox.com/studio
mapboxgl.accessToken = 'pk.eyJ1IjoiYmVybmFyZG9zcCIsImEiOiJjamkyMmhqdjAwZ284M2txcHpqYjUwam91In0.RiploEl5Mm6bjXhPZbN6XQ';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/bernardosp/cjkiit85231bp2rmj5earqv01?fresh=true',
  center: [-46.6469, -23.5617],
  zoom: 12,
  hash: true,
  attributionControl: false,
});

map.addControl(new mapboxgl.AttributionControl({
  compact: true,
}), 'bottom-right')

map.addControl(new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  placeholder: 'Buscar local',
}), 'bottom-left');
map.addControl(new mapboxgl.NavigationControl(), 'top-left');

var osmRoadLayer = 'osm-road';
var mapColors = {
  female: '#f55656',
  male: '#08bcd4',
  neutral: '#bababa',
  empty: '#ffffff'
}

function analyzeLineLength(ruler, line, gender) {
  for (var i = 0; i < line.length - 1; i++) {
    var distance = ruler.distance(line[i], line[i + 1]);
    return distance;
  }
}

function updateGenders() {
  if (map.areTilesLoaded() === false) {

  } else if (map.areTilesLoaded()) {
    document.getElementById("legend").style.opacity = "1";
    var features = map.queryRenderedFeatures({
      layers: [osmRoadLayer]
    });

    var units = 'kilometers';
    var ruler = cheapRuler(map.getCenter().lat, units);
    var bounds = map.getBounds();
    var bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

    var countMale = 0,
      countFemale = 0,
      countNeutral = 0
    countEmpty = 0;
    var lengthMale = 0,
      lengthFemale = 0,
      lengthNeutral = 0
    lengthEmpty = 0;

    for (var i = 0; i < features.length; i++) {
      var geom = features[i].geometry;
      var lines = geom.type === 'LineString' ? [geom.coordinates] : geom.coordinates;

      // clip lines to screen bbox for more exact analysis
      var clippedLines = [];
      for (var j = 0; j < lines.length; j++) {
        clippedLines.push.apply(clippedLines, lineclip(lines[j], bbox));
      }

      // sum length for each clipped line
      var length = 0;
      for (j = 0; j < clippedLines.length; j++) {
        length += analyzeLineLength(ruler, clippedLines[j], features[i].properties.gender);
      }

      var properties = features[i].properties;
      var gender = properties.gender ? properties.gender : undefined

      if (!gender) {
        countEmpty += 1;
        lengthEmpty += length;
      } else if (gender === 'n') {
        countNeutral += 1;
        lengthNeutral += length;
      } else if (gender === 'm') {
        countMale += 1;
        lengthMale += length;
      } else if (gender === 'f') {
        countFemale += 1;
        lengthFemale += length;
      }
    }

    var counts = {
      male: countMale,
      female: countFemale,
      neutral: countNeutral,
      empty: countEmpty
    }
    var lengths = {
      male: lengthMale,
      female: lengthFemale,
      neutral: lengthNeutral,
      empty: lengthEmpty
    }

    var legend = document.querySelector('#legend-wrapper');
    var html = '<canvas id="chart" width="30" height="500"></canvas>';
    legend.innerHTML = html;
    barChart(lengths);
    tooltip(lengths);
  }
}

function roundDecimal(num) {
  return parseFloat(num).toFixed(2);
}

function barChart(values) {
  var total = values.female + values.male + values.neutral + values.empty;
  var c = document.getElementById("chart");
  c.style.width='100%';
  c.style.height='100%';
  c.width  = c.offsetWidth;
  c.height = c.offsetHeight;
  var cHeight = c.height;
  var valuesProp = {
  	female: values.female / total * cHeight,
  	male: values.male / total * cHeight,
  	neutral: values.neutral / total * cHeight,
  	empty: values.empty / total * cHeight,
  }
  var ctx = c.getContext("2d");
  var barWidth = c.width;
  ctx.beginPath();
  ctx.rect(0, 0, barWidth, valuesProp.female);
  ctx.fillStyle = mapColors.female;
  ctx.fill();

  ctx.beginPath();
  ctx.rect(0, valuesProp.female, barWidth, valuesProp.male);
  ctx.fillStyle = mapColors.male;
  ctx.fill();

  ctx.beginPath();
  ctx.rect(0, valuesProp.female + valuesProp.male, barWidth, valuesProp.neutral);
  ctx.fillStyle = mapColors.neutral;
  ctx.fill();

  ctx.beginPath();
  ctx.rect(0, valuesProp.female + valuesProp.male + valuesProp.neutral, barWidth, valuesProp.empty);
  ctx.fillStyle = mapColors.empty;
  ctx.fill();
}

function tooltip(values) {
  t = document.getElementById('tooltiptext');
  var html = '<div class="legend-line"><span class="legend-key" style="background: ' + mapColors.female + '"></span>Feminino: <span class="legend-value">' + roundDecimal(values.female) + ' km</span></div> <div class="legend-line"><span class="legend-key" style="background: ' + mapColors.male + '"></span>Masculino: <span class="legend-value">' + roundDecimal(values.male) + ' km</span></div> <div class="legend-line"><span class="legend-key" style="background: ' + mapColors.neutral + '"></span>Sem gênero: <span class="legend-value">' + roundDecimal(values.neutral) + ' km</span></div> <div class="legend-line"><span class="legend-key" style="background: ' + mapColors.empty + '"></span>Sem dados: <span class="legend-value">' + roundDecimal(values.empty) + ' km</span></div>';
  t.innerHTML = html;
}

map.on('load', function() {
  updateGenders();
  map.on('movestart', turnOffLegend);
  map.on('moveend', updateGenders);
  map.on('data', updateGenders);

  var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  map.on('mousemove', osmRoadLayer, function(e) {
    map.getCanvas().style.cursor = 'pointer';

    var coordinates = e.lngLat;
    var description = e.features[0].properties.name ? e.features[0].properties.name : 'Sem dados';

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    popup.setLngLat(coordinates)
      .setHTML(description)
      .addTo(map);
  });

  map.on('mouseleave', osmRoadLayer, function() {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });
});

var changedOpacity;

function turnOffLegend() {
  changedOpacity = false;
  if (!changedOpacity) {
    document.getElementById("legend").style.opacity = "0.2";
    changedOpacity = true;
  }
}

// modal
var modal = document.getElementById('modal');
var btn = document.getElementById("about");
var span = document.getElementsByClassName("close")[0];
btn.onclick = function() {
  modal.style.display = "block";
}
span.onclick = function() {
  modal.style.display = "none";
}

// tooltip toggle on click
if (window.devicePixelRatio > 1) {
  // mobile
  var legend = document.getElementById("legend");
  legend.onclick = function() {
    var state = tooltiptext.style.visibility;
    state === "visible" ? tooltiptext.style.visibility = "hidden" : tooltiptext.style.visibility = "visible";
  }
}
