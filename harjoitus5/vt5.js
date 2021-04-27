'use strict';

console.log(data);

// mymap._targets.

// Globaali muuttuja, joka pitaa sisallaan kartalla olevat joukkueet.
var globalKartalla = [];

var globalIds = [];

var mymap = undefined;

var globalCircleIdt = [];

var globalJoukkueetPlusPolylinet = [];

var debug = true;

var hardDebug = false;

/*
 * Puutteet ja bugit:
 * (1). Markkerit ja niihin liittyvat tapahtumat jai toteuttamatta. Tehtiin suoraan circlen liikuttaminen.
 * (2). 
 */

/***********************************************************************************************************************/

$(document).ready(e => init()); 

/* Alustus-functio. */
function init() {
  hardDebug && console.debug('Calling init()');
  var div = $('#kartta'); 
  var wDiv = div.outerWidth(false);
  var hDiv = div.outerHeight(false);
  div.css("width", wDiv + "px#");
  div.css("height", hDiv + "px#");
  mymap = new L.map('kartta', {crs: L.TileLayer.MML.get3067Proj()}).fitBounds(getBounds());
  L.tileLayer.mml_wmts({layer: "maastokartta"}).addTo(mymap);

  poistaRastienMonikerrat();
  initJoukkueet();
  updateJoukkueet();
  updateCircles();
  updateMatkat();
}

/***********************************************************************************************************************/

// Poistetaan jokaiselta joukkueelta rastileimausmonikerrat. Tata ei vaadittu tehtavassa, mutta tuo vain 
// hairitsee taman tehtavan tekijaa.
function poistaRastienMonikerrat() {
  hardDebug && console.debug('Calling poistaRastienMonikerrat()');
  for (let j of data.joukkueet) {
    var arrayNoMonikerta = [];
    var idArray = j.rastit.map(e => e.id.toString()); 
    var noMonikerta = Array.from(new Set(idArray));  
    console.debug(noMonikerta);
    for (let k of noMonikerta) {
      var firstInstance = j.rastit.find(h => h.id.toString() === k.toString());
      arrayNoMonikerta.push(firstInstance);
      j.rastit = j.rastit.filter(h => h.id.toString() !== k.toString());
    }
    j.rastit = arrayNoMonikerta;
  }
}

/***********************************************************************************************************************/

function createUniqueIdJoukkue(prefix) {
  hardDebug && console.debug('Calling createUniqueIdJoukkue()');
  let uniqueID = 0;
  while (globalIds.includes(`${prefix}${(uniqueID)}`)) {
    uniqueID = Math.round(Math.random() * 500000);
  }
  var id = `${prefix}${uniqueID}`;
  globalIds.push(id);
  return id;
}

/***********************************************************************************************************************/

// Paivittaa kaikkien joukkueiden kulkeman matkan.
function updateMatkat() {
  hardDebug && console.debug('Calling updateMatkat()');
  // Haetaan summary elementit.
  var kaikkiLIt = $('.summary');
  kaikkiLIt.each((i,e) => {
    var joukkueenNimiLabel = $(e).find('.nimiLabel').get(0);
    var joukkueenMatkaLabel = $(e).find('.matkaLabel').get(0);
    // Paivitetaan matka.
    joukkueenMatkaLabel.textContent = "(" + Number(parseFloat(laskeMatka(joukkueenNimiLabel.textContent)).toFixed(1)) + ") km";
  });
}

/***********************************************************************************************************************/

// Laskee joukueen kulkeman matkan.
function laskeMatka(joukkueNimi) {
  hardDebug && console.debug('Calling laskematka() with arguments:');
  hardDebug && console.debug(joukkueNimi);
  joukkueNimi = joukkueNimi.trim();
  var joukkue = data.joukkueet.find(x => x.nimi.trim() === joukkueNimi);     
  if (joukkue === undefined) { console.error(`laskematka(${joukkueNimi}): ei loytynyt joukkuetta.`); return; }
  var kuljetutRastit = [];

  for (let x of joukkue.rastit) {
    var todellinenRasti = data.rastit.find(y => y.id.toString() === x.id.toString());
    if (todellinenRasti === undefined) { console.error(`laskematka(${joukkueNimi}): ei loytynyt rastia idlla ${x.id}. `); return; }
    kuljetutRastit.push(todellinenRasti); 
  }
  var kuljettuMatka = 0.0;
  // Jos vain yksi rasti, niin peli ei vetele. jos ei lahtoviivalta jaksa edes takaisin lahtoviivalle, niin olkoot sitten...
  for (let j=0, k=1; k<kuljetutRastit.length; j++, k++) {
    var lat1 = parseFloat(kuljetutRastit[j].lat);
    var lon1 = parseFloat(kuljetutRastit[j].lon);
    var lat2 = parseFloat(kuljetutRastit[k].lat);
    var lon2 = parseFloat(kuljetutRastit[k].lon);
    kuljettuMatka = kuljettuMatka + getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2);
  }
  return kuljettuMatka;
}

/***********************************************************************************************************************/

// Alustetaan joukkuelistaus.
function initJoukkueet() {
  hardDebug && console.debug('Calling initJoukkueet()');
  var joukkueetUL = $('#joukkueetUL'); 

  // Jos joukkueet div on luotu, niin alustetaan joukkueet.
  if (!joukkueetUL.length) return; 
  
  // Luodaan ensin lista-ailkioita vastaavat stringit. Tehokkuussyista nain.
  var listaAlkioStr = [];
  for (let x of data.joukkueet) {
     var id = createUniqueIdJoukkue('joukkue');
     listaAlkioStr.push(`<li id="${id}" class="joukkueLI"><details class='details'><summary class='summary'><label class="nimiLabel">${x.nimi}</label><label class="matkaLabel"></label></summary><ul class='ulSummary'></ul></details></li>`); 
  }
  // Tama on kuulemma tehokkaampaa kuin lisata alkioita silmukassa yksitellen.
  joukkueetUL.append(listaAlkioStr.join(""));
  
  // Paivitetaan tassa joukkuelistauksen eventit.
  var jLIt = $('.joukkueLI'); 
  var jLabels = $('.joukkueLI label'); 

  // Asetetaan lista-alkioille draggable trueksi.
  jLIt.each((i,e) => {
    e.draggable = "true";
    var det = $(e).find('.details').on('toggle', detailsClick);
  });
   
  // Asetetaan lista-alkioille kuuntelia, joka ottaa vastaan sen sisalla olevan labelin dragstart tapahtuman.
  // Nyt siis vain joukkueen nimen tarttumalla voidaan raahata (TASO-5), toimii firefoxilla, mutta chromella ei.
  jLIt.on("dragstart", "details .nimiLabel", joukkueDragStart);
//  jLIt.on('dragend',kartallaULDragEnd);

  // Asetetaan labeleille draggable trueksi, mutta ei aseteta dragstart eventtia.
  jLabels.each((i,e) => {
    e.draggable = "true";
  });

  // Haetaan kartalla containeri.
  var kartallaUL = $('#kartallaUL'); 
  var kartalla = $('#kartalla'); 
  var joukkueet = $('#joukkueet'); 
  kartalla.on('drop',kartallaULDrop);
  kartallaUL.on('drop',kartallaULDrop);
  kartallaUL.on('dragover',kartallaULDragover);
  kartalla.on('dragover',kartallaULDragover);
  joukkueetUL.on('drop',joukkueetULDrop);
  joukkueet.on('drop',joukkueetULDrop);
  joukkueetUL.on('dragover',kartallaULDragover);
  joukkueet.on('dragover',kartallaULDragover);
}

/***********************************************************************************************************************/

// Funktio details painikkeelle.
function detailsClick(e) {
  var oTarget = $(e.originalEvent.target);
  var joukkueenNimi = $(oTarget).find('.nimiLabel').text().trim();
  var joukkue = data.joukkueet.find(e => e.nimi.trim() === joukkueenNimi);  
  if (joukkue === undefined) { console.error(`detailsClick(): joukkuetta ei loydy nimella ${joukkueenNimi}.`); return; }
  var ul = oTarget.find('.ulSummary');
  console.log(oTarget.find('summary'));
  var summaryt = $('.summary').parent('details');
  // Jos ollaan sulkemassa detailssia, niin poistutaan.
  if (!oTarget.get(0).open) return;
  // Jos oollan aukaisemassa detailssia, niin suljetaan edellnine detailsi.
  summaryt.each((ind, elem) => {
    if (elem.open === true && oTarget.get(0) !== elem) elem.open = false; 
  });
  // Luodaan rastileimaukset vain, jos niita ei ole aikaisemmin luotu.
  if (oTarget.find("li").length > 0) return;  
  for (let b of joukkue.rastit) {
    var koodi = data.rastit.find(c => c.id.toString() === b.id.toString()).koodi;
    var koodiLIid = createUniqueIdJoukkue('koodiLI'); 
    var listItem = $(`<li id="${koodiLIid}">${koodi}</li>`);
    ul.append(listItem);
    listItem.on('drop', koodiULDrop);
    listItem.attr('draggable','true');
    listItem.on('dragstart', koodiDragStart);
    listItem.on('dragover', kartallaULDragover);
  }
}

/***********************************************************************************************************************/

function koodiULDrop(e) {
  hardDebug && console.debug('Calling koodiULDrop() with arguments:');
  hardDebug && console.debug(e);
  e.originalEvent.preventDefault();
  
  var lahdeId = e.originalEvent.dataTransfer.getData('text');
  var kohde = $(e.originalEvent.target); 
  var srcElement = $(`#${lahdeId}`);
  var viimeinen = kohde.parent().find('li:last-child');
  if (viimeinen.get(0) === kohde.get(0)) {srcElement.insertAfter(viimeinen);} 
  else srcElement.insertBefore(kohde);
}

/***********************************************************************************************************************/

function koodiDragStart(e) {
  hardDebug && console.debug('Calling koodiDagStart() with arguments:');
  hardDebug && console.debug(e);
  e.originalEvent.dataTransfer.dropEffect = "move";
  var li = $(e.originalEvent.target).parent('li');
  e.originalEvent.dataTransfer.setData("text/plain", e.originalEvent.target.id);
}

/***********************************************************************************************************************/

// Tarvitaanko? TODO: poista jossakin vaheessa jos tarpeeton.
function CreateDragData(id, srcClass, nimi) {
  return JSON.stringify(data);
}

/***********************************************************************************************************************/

function joukkueDragStart(e) {
  hardDebug && console.debug('Calling joukkueDragStart() with arguments:');
  hardDebug && console.debug(e);
  e.originalEvent.dataTransfer.dropEffect = "move";
  var li = $(e.originalEvent.target).parents('li');
  // Tallenetaan li-objektin id, jotta drop-paassa saadaan haettua raahattava objekti.
  e.originalEvent.dataTransfer.setData("text/plain", li.attr('id'));
}

/***********************************************************************************************************************/

// Kartalla pudotus funktio. Hylataan rastin pudottaminen.
function kartallaULDrop(e) {
  hardDebug && console.debug('Calling kartallaULDrop() with arguments:');
  hardDebug && console.debug(e);
  e.originalEvent.preventDefault();
  console.log(e);
  var lahdeId = e.originalEvent.dataTransfer.getData('text');
  if (lahdeId.startsWith('koodiLI')) return;
  var kartallaUL = $('#kartallaUL'); 
  // Siiretaan li-elementti kartalle ensimmaiseksi.
  var srcElement = $(`#${lahdeId}`);
  kartallaUL.prepend(srcElement);
  srcElement.attr('class','kartallaLI');
  var joukkueenNimi =  $(`#${lahdeId}`).find('.nimiLabel').get(0).textContent;
  drawPolyline(joukkueenNimi, srcElement.css('backgroundColor'));
}

/***********************************************************************************************************************/

// Joukkueet pudotus funtio. hylataan rastin pudottaminen.
function joukkueetULDrop(e) {
  hardDebug && console.debug('Calling joukkueetULDrop() with arguments:');
  hardDebug && console.debug(e);
  e.originalEvent.preventDefault();
  var lahdeId = e.originalEvent.dataTransfer.getData('text'); 
  if (lahdeId.startsWith('koodiLI')) return;
  var joukkueetUL = $('#joukkueetUL'); 
  // Siiretaan li-elementti joukkueiden viimeiseksi.
  var srcElement = $(`#${lahdeId}`);
  joukkueetUL.append(srcElement);
  srcElement.attr('class','joukkueLI');
  // Katsotaan onko meilla jo joukueen polylinet valmiina. Jos on, niin postetaan ne kartalta.
  var joukkueenNimi =  $(`#${lahdeId} .nimiLabel`).get(0).textContent;
  var joukkueenNimiPlusPolylinet = globalJoukkueetPlusPolylinet.find(x => x.joukkue.nimi.trim() === joukkueenNimi.trim());
  if (joukkueenNimiPlusPolylinet !== undefined) {
    for (let b of joukkueenNimiPlusPolylinet.polylinet) { b.remove(); }
    return;
  }
}
/***********************************************************************************************************************/

function kartallaULDragover(e) {
  hardDebug && console.debug('Calling kartallaULDragover() with arguments:');
  hardDebug && console.debug(e);
  e.originalEvent.preventDefault();
}

/***********************************************************************************************************************/

function kartallaULDragEnd(e) {
  hardDebug && console.debug('Calling kartallaULDragend() with arguments:');
  hardDebug && console.debug(e);
  e.originalEvent.preventDefault();
}

/***********************************************************************************************************************/

// Paivittaa joukkuelistauksen ja sen varit.
function updateJoukkueet() {
  hardDebug && console.debug('Calling updateJoukkueet().');
  var joukkueet = $('.joukkueLI');
  if (!joukkueet.length) return;
  joukkueet.each((i,e) => {
    e.style.backgroundColor = rainbow(joukkueet.length, i);  
  });
}

/***********************************************************************************************************************/

function haeRastit(joukkueNimi) {
  hardDebug && console.debug('Calling haeRastit() with arguments:');
  hardDebug && console.debug(joukkueNimi);
  joukkueNimi = joukkueNimi.trim();
  let joukkue = data.joukkueet.find(x => joukkueNimi === x.nimi.trim());  
  if (joukkue === undefined) console.error (`haeRastit(${joukkueNimi}): ei loytynyt joukkuetta`);
  let rastiIdt = joukkue.rastit.map(x=>parseInt(x.id));
  let rastit = [];
  for (let x of rastiIdt) {
    var rasti = data.rastit.find(b => b.id === x);
    if (rasti !== undefined) rastit.push(rasti);
  }
  return rastit;
}


/***********************************************************************************************************************/

// Piistaa rasti-viivat karttaan. @joukkueNimi on joukkuee nimi stringina, ja color on vari stringina. 
function drawPolyline(joukkueNimi, color) {
  hardDebug && console.debug('Calling draPolyline() with arguments:');
  hardDebug && console.debug(joukkueNimi);
  hardDebug && console.debug(color);
  // Katsotaan onko meilla jo joukueen polylinet valmiina. Jos on, niin paivitetaan ne.
  var joukkueenNimiPlusPolylinet = globalJoukkueetPlusPolylinet.find(x => x.joukkue.nimi.trim() === joukkueNimi.trim());
  if (joukkueenNimiPlusPolylinet !== undefined) {
    for (let b of joukkueenNimiPlusPolylinet.polylinet) { b.remove(); b.addTo(mymap); }
    return;
  }
  // Joukkueella ei ollut entuudestaan polylineja. Tehdaan ne sitten nyt.
  var rastit = haeRastit(joukkueNimi);
  var joukkuePlusPolylinet = {joukkue: data.joukkueet.find(x => joukkueNimi.trim() === x.nimi.trim()), polylinet: []};
  for (let i=0, j = -1; i<rastit.length; i++, j++) {
    if (i === 0) continue;
    var polyline = L.polyline([[rastit[j].lat,rastit[j].lon],[rastit[i].lat,rastit[i].lon]], {color: color});
    polyline.addTo(mymap);
    //polyline.redraw();
    joukkuePlusPolylinet.polylinet.push(polyline); 
  }
  globalJoukkueetPlusPolylinet.push(joukkuePlusPolylinet);
}

/***********************************************************************************************************************/

// Lisaa karttaan rastiympyrat ensimmaisen kerran. Lisaa myos circlen ja sita vastaavan rasti-olion globalCircleIdt:hin.
function updateCircles() {
  hardDebug && console.debug('Calling updateCilcles().');
  for (let x of data.rastit) {
    var circle =  createCircle(x.lat,x.lon);
    circle.addTo(mymap);
    globalCircleIdt.push({circle: circle, rasti: x});
  }
}

/***********************************************************************************************************************/

// Luodaan yksi uusi circle.
function createCircle(lat,lon) {
  hardDebug && console.debug('Calling createCircle() with arguments:');
  hardDebug && console.debug(lat);
  hardDebug && console.debug(lon);
    var circle =  L.circle ( [lat, lon], { color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: 150 });
    // Kun circlea painetaan hiirella ja liikutellaan, niin muutetaan circlen koordinaatteja. Hyodynnetaan #kartta mousemove tapahtumaa.
    circle.on({mousedown: () => { hardDebug && console.debug('calling mousedown() on circle object:'); 
                                  hardDebug && console.debug(circle);
                                  mymap.dragging.disable();
                                  mymap.on('mousemove', e => { hardDebug && console.debug('calling mymap.mousemove() with arguments:');
				                               hardDebug && console.debug(e);
							       circle.setLatLng(e.latlng); })
			        }
	      }); 

    // Kun circlea on liikuteltu ja hiiren painike nousee ylos, tuhotaan #kartta mousemove tapahtuma.
    circle.on({mouseup: e => { hardDebug && console.debug('calling mouseup on circle object:'); 
                               hardDebug && console.debug(circle);
                               hardDebug && console.debug('with arguments:');
                               hardDebug && console.debug(e);
                               mymap.removeEventListener('mousemove');
                               // Kun hiiren painike nousee, niin tuhotaan vanha circle ja luodaan uusi tilalle. 
			       // Pelkka vanhan circlen lat ja lon arvojen muuttaminen ei oikein toiminut.
                               var newCircle = createCircle(e.latlng.lat, e.latlng.lng);
			       newCircle.addTo(mymap);
			       // Haetaan vanha circle ja sita vastaava rasti.
			       var blah = globalCircleIdt.find(x => x.circle === circle);
			       // Korvataan vanha cirlce uudella.
			       blah.circle = newCircle; 
			       // Paivitetaan rastin lat ja lon.
			       blah.rasti.lon = e.latlng.lng;
			       blah.rasti.lat = e.latlng.lat;
			       mymap.removeLayer(circle);
			       var kartallaJoukkueet = $($('.kartallaLI').get().reverse()); 
			       // Putsataan vanhat reitit.
			       for (let y of globalJoukkueetPlusPolylinet) {
				 for (let z of y.polylinet) {
				   mymap.removeLayer(z);
				 }
			       }
                               globalJoukkueetPlusPolylinet = [];
			       // Paivitetaan reitit uudestaan.
                               kartallaJoukkueet.each((i,elem) => {
                                 var nimi = $(elem).find('.nimiLabel').text();//e.childNodes[0].textContent;
//				 console.error($(elem).find('.nimiLabel').text());
				 var color = elem.style.backgroundColor;
				 drawPolyline(nimi,color);
			       });
			       updateMatkat();
			       mymap.dragging.enable();
			     }}); 
    return circle;
}

/***********************************************************************************************************************/

function getBounds() {
  hardDebug && console.debug('Calling getBounds().');
  // Haetaan ainoastaan rastit joissa on kunnolliset leveys ja pituus asteet. Taitaa olla kylla kaikki kunnossa...
  var okRastit = data.rastit.filter(x => !isNaN(parseFloat(x.lat)) && !isNaN(parseFloat(x.lon)));
  // Menikohan x ja y sekaisin. No toimii ainakin nyt.
  var xKoordinaatit = okRastit.map(x => x.lon);
  var yKoordinaatit = okRastit.map(x => x.lat);
  var minX = Math.min.apply(null, xKoordinaatit);
  var maxX = Math.max.apply(null, xKoordinaatit);
  var minY = Math.min.apply(null, yKoordinaatit);
  var maxY = Math.max.apply(null, yKoordinaatit);
  var corner1 = L.latLng(minY,minX);
  var corner2 = L.latLng(maxY,maxX);
  return L.latLngBounds(corner1,corner2);
}

/***********************************************************************************************************************/

function rainbow(numOfSteps, step) {
//  hardDebug && console.debug('Calling rainbow() with arguments:');
//  hardDebug && console.debug(numOfSteps);
//  hardDebug && console.debug(steps);
	let r, g, b;
	let h = step / numOfSteps;
	let i = ~~(h * 6);
	let f = h * 6 - i;
	let q = 1 - f;
	switch(i % 6){
		case 0: r = 1; g = f; b = 0; break;
		case 1: r = q; g = 1; b = 0; break;
		case 2: r = 0; g = 1; b = f; break;
		case 3: r = 0; g = q; b = 1; break;
		case 4: r = f; g = 0; b = 1; break;
		case 5: r = 1; g = 0; b = q; break;
	}
	let c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
	return (c);
}

// VK 1 etaisyys funktio.
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2-lat1);  // deg2rad below
	var dLon = deg2rad(lon2-lon1); 
	var a = 
		Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
		Math.sin(dLon/2) * Math.sin(dLon/2)
		; 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; // Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI/180)
}
