/* Geographic assets ship with the site so visiting the map needs no tile account. */
(function () {
  const container = document.querySelector('#terrain-map');
  const toolbar = document.querySelector('.map-tools');
  const fallback = document.querySelector('.map-panel');
  if (!window.maplibregl) return;

  const url = file => new URL('assets/map/' + file, document.baseURI).href;
  const bounds = [-123.74999, 35.46068, -119.53126, 38.82258];
  function regionalTiles(type, suffix) {
    return {type, tiles: [url('terrain/') + '{x}/{y}' + suffix],
      bounds, minzoom: 8, maxzoom: 8, tileSize: 256};
  }
  const southBay = {center: [-121.715, 37.205], zoom: 9.25, pitch: 52, bearing: -18};
  container.hidden = false;
  let map;
  try {
    map = new maplibregl.Map({
      container, ...southBay, minZoom: 0, maxZoom: 14, maxPitch: 72,
      canvasContextAttributes: {antialias: true},
      style: {version: 8, sources: {
        land: {type: 'geojson', data: url('land.json')},
        runways: {type: 'geojson', data: url('runways.json')},
        terrain: {...regionalTiles('raster-dem', '.png'), encoding: 'terrarium'},
        relief: regionalTiles('raster', '-relief.webp')
      }, layers: [
        {id: 'water', type: 'background', paint: {'background-color': '#b7d7df'}},
        {id: 'continents', type: 'fill', source: 'land', paint: {'fill-color': '#c8d7b9'}},
        {id: 'relief', type: 'raster', source: 'relief', minzoom: 7},
        {id: 'runways', type: 'line', source: 'runways', minzoom: 10,
          paint: {'line-color': '#47524b', 'line-width': ['interpolate',['linear'],['zoom'],10,1,14,5]}}
      ]}
    });
  } catch {
    container.hidden = true;
    return;
  }
  map.on('webglcontextlost', () => {
    container.hidden = true;
    toolbar.hidden = true;
    fallback.hidden = false;
  });
  let is3D = true;
  let global = false;
  const pitchButton = document.querySelector('#pitch');
  const regionalButton = document.querySelector('#regional');
  const worldButton = document.querySelector('#world');
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
  function projection(world) {
    global = world;
    map.setTerrain(!world && is3D ? {source:'terrain', exaggeration:1} : null);
    map.setProjection({type:world ? 'globe' : 'mercator'});
    pitchButton.disabled = world;
    pitchButton.setAttribute('aria-pressed', String(!world && is3D));
  }
  function region() {
    projection(false);
    map.jumpTo({...southBay, pitch:is3D ? southBay.pitch : 0});
  }
  function world() {
    projection(true);
    map.jumpTo({center:[-105, 24], zoom:0.45, pitch:0, bearing:0});
  }
  map.once('load', () => {
    fallback.hidden = true;
    toolbar.hidden = false;
    map.resize();
    projection(false);
    map.addControl(new maplibregl.NavigationControl({visualizePitch:true}), 'top-right');
    const markers = [];
    document.querySelectorAll('.airport-card').forEach(card => {
      const link = document.createElement('a');
      link.className = 'airport-marker';
      link.href = card.href;
      link.textContent = card.dataset.code;
      new maplibregl.Marker({element:link, anchor:'bottom'}).setLngLat(card.dataset.position.split(',').map(Number)).addTo(map);
      markers.push(link);
    });
    const cluster = document.createElement('button');
    cluster.type = 'button';
    cluster.className = 'airport-marker';
    cluster.textContent = '加州南湾 · 2';
    cluster.addEventListener('click', region);
    new maplibregl.Marker({element:cluster}).setLngLat(southBay.center).addTo(map);
    function labels() {
      const grouped = map.getZoom() < 7;
      markers.forEach(marker => { marker.hidden = grouped; });
      cluster.hidden = !grouped;
    }
    labels();
    map.on('zoom', labels);
    map.on('zoomend', () => {
      const next = map.getZoom() < 5;
      if (next !== global) projection(next);
    });
    regionalButton.addEventListener('click', region);
    worldButton.addEventListener('click', world);
    pitchButton.addEventListener('click', () => {
      is3D = !is3D;
      projection(false);
      map.easeTo({pitch:is3D ? 52 : 0, duration});
    });
  });
})();
