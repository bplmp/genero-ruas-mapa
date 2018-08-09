mapboxgl.accessToken = 'pk.eyJ1IjoiYmVybmFyZG9zcCIsImEiOiJjamkyMmhqdjAwZ284M2txcHpqYjUwam91In0.RiploEl5Mm6bjXhPZbN6XQ';

var style = {
    "version": 8,
    "sources": {
        "tilehut": {
            "type": "vector",
            "tiles": [
                "http://0.0.0.0:8000/osm-roads-gender/{z}/{x}/{y}.pbf"
            ],
            "maxzoom": 15
        }
    },
    "layers": [{
        "id": "background",
        "paint": {
            "background-color": "#C5D1ED"
        },
        "type": "background"
    }, {
        "id": "osm-road",
        "source": "tilehut",
        "source-layer": "osm_roads_clean_gender",
        "paint": {
            "line-color": "#000",
            "line-width": 0.5
        },
        "type": "line"
    }]
}


// initialize a Mapbox map with the Basic style, centered in New York
var map = new mapboxgl.Map({
    container: 'map',
    // style: 'mapbox://styles/mapbox/cjf4m44iw0uza2spb3q0a7s41',
    // style: 'mapbox://styles/bernardosp/cjke4ukub0q3p2smxm0is9u5y?fresh=true',
    style: style,
    center: [-46.6469, -23.5617],
    zoom: 12,
    hash: true
});

map.addControl(new MapboxGeocoder({accessToken: mapboxgl.accessToken}), 'bottom-right');
map.addControl(new mapboxgl.NavigationControl(), 'top-left');

// var h = 300; // size of the chart canvas
// var r = h / 2; // radius of the polar histogram
// var numBins = 64; // number of orientation bins spread around 360 deg.
//
// var canvas = document.getElementById('canvas');
// var ctx = canvas.getContext('2d');
//
// canvas.style.width = canvas.style.height = h + 'px';
// canvas.width = canvas.height = h;
//
// if (window.devicePixelRatio > 1) {
//     canvas.width = canvas.height = h * 2;
//     ctx.scale(2, 2);
// }

function updateOrientations() {
    ctx.clearRect(0, 0, h, h);

    var bearing = map.getBearing();

    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(-bearing * Math.PI / 180);

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.stroke();

    var features = map.queryRenderedFeatures({layers: ['road']});
    if (features.length === 0) {
        ctx.restore();
        return;
    }

    var units = 'kilometers';
    var ruler = cheapRuler(map.getCenter().lat, units);
    var bounds = map.getBounds();
    var bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    var bins = new Float64Array(numBins);

    for (var i = 0; i < features.length; i++) {
        var geom = features[i].geometry;
        var lines = geom.type === 'LineString' ? [geom.coordinates] : geom.coordinates;

        // clip lines to screen bbox for more exact analysis
        var clippedLines = [];
        for (var j = 0; j < lines.length; j++) {
            clippedLines.push.apply(clippedLines, lineclip(lines[j], bbox));
        }

        // update orientation bins from each clipped line
        for (j = 0; j < clippedLines.length; j++) {
            analyzeLine(bins, ruler, clippedLines[j], features[i].properties.oneway !== 'true');
        }
    }

    var binMax = Math.max.apply(null, bins);

    for (i = 0; i < numBins; i++) {
        var a0 = ((i - 0.5) * 360 / numBins - 90) * Math.PI / 180;
        var a1 = ((i + 0.5) * 360 / numBins - 90) * Math.PI / 180;
        ctx.fillStyle = interpolateSinebow((2 * i % numBins) / numBins);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r * Math.sqrt(bins[i] / binMax), a0, a1, false);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function analyzeLine(bins, ruler, line, isTwoWay) {
    for (var i = 0; i < line.length - 1; i++) {
        var bearing = ruler.bearing(line[i], line[i + 1]);
        var distance = ruler.distance(line[i], line[i + 1]);

        var k0 = Math.round((bearing + 360) * numBins / 360) % numBins; // main bin
        var k1 = Math.round((bearing + 180) * numBins / 360) % numBins; // opposite bin

        bins[k0] += distance;
        if (isTwoWay) bins[k1] += distance;
    }
}

function analyzeLineLength(ruler, line, gender) {
    for (var i = 0; i < line.length - 1; i++) {
        // var bearing = ruler.bearing(line[i], line[i + 1]);
        var distance = ruler.distance(line[i], line[i + 1]);

        // bins[k0] += distance;
        // if (isTwoWay) bins[k1] += distance;
        return distance;
    }
}

// rainbow colors for the chart http://basecase.org/env/on-rainbows
function interpolateSinebow(t) {
    t = 0.5 - t;
    var r = Math.floor(250 * Math.pow(Math.sin(Math.PI * (t + 0 / 3)), 2));
    var g = Math.floor(250 * Math.pow(Math.sin(Math.PI * (t + 1 / 3)), 2));
    var b = Math.floor(250 * Math.pow(Math.sin(Math.PI * (t + 2 / 3)), 2));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function updateGenders() {
  if (map.areTilesLoaded() === false) {
    if (loaded === true) {
      console.log('waiting');
      // show(document.getElementById('spinner'));
      document.querySelector('#legend').innerHTML = "<p>Carregando...</p><div class='flex-child loading'></div>";
      loaded = false;
    }
  } else if (map.areTilesLoaded()) {
    console.log('loaded');
    loaded = true;
    // hide(document.getElementById('spinner'));
    var features = map.queryRenderedFeatures({layers: ['osm-road']});
    if (features.length === 0) {
      ctx.restore();
      return;
    }

    var ruler = cheapRuler(map.getCenter().lat);
    var bounds = map.getBounds();
    var bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    // var bins = new Float64Array(numBins);

    var countMale = 0,
    countFemale = 0,
    countNeutral = 0
    countEmpty = 0;
    var lengthMale = 0,
    lengthFemale = 0,
    lengthNeutral = 0
    lengthEmpty = 0;

    for (var i = 0; i < features.length; i++) {
      // var geom = features[i].geometry;
      // var lines = geom.type === 'LineString' ? [geom.coordinates] : geom.coordinates;
      //
      // // clip lines to screen bbox for more exact analysis
      // var clippedLines = [];
      // for (var j = 0; j < lines.length; j++) {
      //     clippedLines.push.apply(clippedLines, lineclip(lines[j], bbox));
      // }
      //
      // // update orientation bins from each clipped line
      // var length = 0;
      // for (j = 0; j < clippedLines.length; j++) {
      //     length += analyzeLineLength(ruler, clippedLines[j], features[i].properties.gender);
      // }

      var properties = features[i].properties;
      var gender = properties.gender ? properties.gender : undefined

      if (!gender) {
        countEmpty += 1;
        lengthEmpty += length;
        // return;
      } else if (gender === 'n') {
        countNeutral += 1;
        lengthNeutral += length;
        // return;
      } else if (gender === 'm') {
        countMale += 1;
        lengthMale += length;
        // return;
      } else if (gender === 'f') {
        countFemale += 1;
        lengthFemale += length;
        // return;
      }
    }
    var counts = {
      male: countMale,
      female: countFemale,
      neutral: countNeutral,
      empty: countEmpty
    }
    // var lengths = {
    //   male: lengthMale,
    //   female: lengthFemale,
    //   neutral: lengthNeutral,
    //   empty: lengthEmpty
    // }
    console.log(counts);
    var legend = document.querySelector('#legend');
    var html = `
    <p><strong>Feminino:</strong> ${counts.female}<p>
    <p><strong>Masculino:</strong> ${counts.male}<p>
    <p><strong>Sem gênero:</strong> ${counts.neutral}<p>
    <p><strong>Sem dados:</strong> ${counts.empty}<p>
    <div id="chart" style="height: 150px; width: 100%;"></div>
    `
    legend.innerHTML = html;
    // barChart(counts);
  }

}

map.on('load', function () {
    // updateOrientations();
    loaded = true;
    updateGenders();
    // update the chart on moveend; we could do that on move,
    // but this is slow on some zoom levels due to a huge amount of roads
    // map.on('moveend', updateOrientations);
    // map.on('moveend', updateGenders);
    map.on('data', updateGenders);
});

var loaded = false;

// var spinner = document.getElementById('spinner');

// Show an element
var show = function (elem) {
	elem.classList.remove('is-hidden');
};

// Hide an element
var hide = function (elem) {
	elem.classList.add('is-hidden');
};

// Toggle element visibility
var toggle = function (elem) {
	elem.classList.toggle('is-hidden');
};

function barChart(values) {
  var trace1 = {
    x: [values.female],
    y: ['kms'],
    name: 'Feminino',
    orientation: 'h',
    marker: {
      color: 'red',
      width: 1
    },
    type: 'bar'
  };

  var trace2 = {
    x: [values.male],
    y: ['kms'],
    name: 'Masculino',
    orientation: 'h',
    type: 'bar',
    marker: {
      color: 'blue',
      width: 1
    }
  };

  var trace3 = {
    x: [values.neutral],
    y: ['kms'],
    name: 'Sem gênero',
    orientation: 'h',
    type: 'bar',
    marker: {
      color: 'black',
      width: 1
    }
  };

  var trace4 = {
    x: [values.empty],
    y: ['kms'],
    name: 'Sem dados',
    orientation: 'h',
    type: 'bar',
    marker: {
      color: 'gray',
      width: 1
    }
  };

  var data = [trace1, trace2, trace3, trace4];

  var layout = {
    // title: 'Colored Bar Chart',
    barmode: 'stack',
    showlegend: true,
    legend: {
      x: 0.5,
      y: 1,
      orientation: 'h',
    },
    hoverinfo: 'none',
    margin: {
      l: 10,
      r: 10,
      b: 10,
      t: 10,
      pad: 4
    },
    xaxis: {
      autorange: true,
      showgrid: false,
      zeroline: false,
      showline: false,
      autotick: true,
      ticks: '',
      showticklabels: false
    },
    yaxis: {
      autorange: true,
      showgrid: false,
      zeroline: false,
      showline: false,
      autotick: true,
      ticks: '',
      showticklabels: false
    },
  };

  Plotly.newPlot('chart', data, layout, {displayModeBar: false});
}

function roundDecimal(num) {
  return parseFloat(num).toFixed(2);
}
