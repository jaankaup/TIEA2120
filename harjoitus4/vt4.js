"use strict";

// Varastoidaan joitain kuva tanne. Esim. pupu.
var globalImages = [];

var pupuVasenImages = [];
var pupuOikeaImages = [];

// Pollon syntymapaikka-enum.
const PolloRespawnType = { vasen:0, oikea:1, original:2};

// Pidetaan ylla seuraavaa pollon syntymapaikkaa.
var nextPolloRespawn = PolloRespawnType.original; 
var nextZ = 0;

// Vakiot sille, mista z-indeksit alkavat. Olisi voinnut tehda fiksumminkin, mutta nyt kay aika vahiin. Palkit alkavat 0:sta. 
const PUPUOFFSET = 100000;
// Jatetaan palkeille 1000 paikkaa. Eikohan riita nyt. Hiutaleille 100000 z-indeksi paikkaa. Tosiallisesti naita on hieman vahemman, mutta 
// olkoon nyt nain.
const HIUTALEOFFSET = 1000;
const POLLOOFFSET   = 110000; 
const TEXTOFFSET    = 120000; 
const BUTTONOFFSET  = 130000; 
// Debuggausta varten. Lasketaan kuinka monta kertaa ollaan piirretty.
var piirtoLkm = 0;
var maxPiirtoLkm = 3;

// Oma kökkö aikalaskuri.
var startTick = undefined;
var tickNow = undefined;
const UPDATE_RATE_mms = 1;

// Lumihiutaleet.
var hiutaleet = [];

// Demotaso enum.
const DemoTaso = { taso1: 1, taso3: 2, taso5: 3};

// Aseta tahan haluamasi taso.  
var globalDemoTaso = DemoTaso.taso5;

window.onload = e => {

  // 1-tasossa ollaan jo toteutettu 3-tason pollon lisays je lentorata kohdat. Tama idea tuli nyt vahan liian myohaan, joten en lahde 
  // huonontamaan koodia.
  if (globalDemoTaso === DemoTaso.taso1) {
    luoPalkit(10);
    luoPupuVasen_taso1();
    luoPupuOikea_taso1();
    luoPollo();
    luoButton();
  }

  // Taso 3-mukainen ratkaisu.
  else if (globalDemoTaso === DemoTaso.taso3) {
    luoPalkit(10);
    luoPuput_taso3(100);
    luoPollo();
    luoButton();
    startTimer();
    luoTaso3Teksti("TIEA212 Web-käyttöliittymien ohjelmointi -kurssin viikkotehtävä 4 taso 3 edellyttää tämännäköistä sivua");
  }
  // Taso 5-mukainen ratkaisu.
  else if (globalDemoTaso === DemoTaso.taso5) {
    luoPalkit(10);
    luoPuput_taso3(100);
    luoPollo();
    luoButton();
    startTimer();
    luoTaso5Teksti("TIEA212 Web-käyttöliittymien ohjelmointi -kurssin viikkotehtävä 4 taso 3 edellyttää tämännäköistä sivua");
    lumihiutaleet();
  }
}

/*******************************************************************************************************************************************************/

// Funktio, joka antaa aina suuremman z-indeksi arvon kuin mita muilla on. Oletuksena on se, ettei z-arvoja luoda missaan muualla kuin tassa. 
// Olisi voinnut ehka tehda niin, etta kaydaan kaikki elementetit lapi, ja niiden z-arvot, ja sitten luotu niiden perusteella uusi isompi z. 
function getNextZ() {
  nextZ = nextZ + 1;
  return nextZ-1;
}


/*******************************************************************************************************************************************************/

// Tehdaan viela toisenlainen funktio z-indeksia varten. Tassa ohjemalla kun taitaa olla aika paljon rinnakkaisuutta sun muuta ajoitus-juttuja. 
// Tama funktio antaa saman arvon kuin getNextZ funtio, mutta lisaa siihen @offset:in verran lisaa. Nyt saadaan selvasti eri korkeudelle kuuluvat 
// objectit erottumaan toisistaan.
function getZ(offset) {
  return getNextZ()+offset;
}

/*******************************************************************************************************************************************************/

/* Funktio, joka luo tason-1 mukaiset palkit. @lkm on luotaivien palkkien lukumaara. Palkkeja luodaan 250msek valein. Animaatio on 
 * maaritelty css-tiedostossa. */

function luoPalkit(lkm) {
  for (let i=0; i<lkm; i++) {
    luoPalkki(getNextZ(),250*i);
  }
}

/*******************************************************************************************************************************************************/

/* Luo yhden palkin ja asettaa sen body-elementin sisalle. index on z-indeksin arvo ja delay on arvo, joka laitetaan animationDelayksi. */
function luoPalkki(index,delay) {
  var kohde = document.querySelector('body');
  var p = document.createElement('p');
  var img = document.createElement('img');
  p.style.animationDelay = delay.toString()+ "ms";
  p.appendChild(img);
  img.src = "palkki.svg";
  img.setAttribute('class','imgPalkki');
  p.setAttribute('class','pPalkki');
  p.style.zIndex = index;
  kohde.appendChild(p);
}

/*******************************************************************************************************************************************************/

// Funtio, joka luo pollon joka toinen kerta vasemmalta ja joka toinen kerta oikealta. En tieda ymmarsiko tehtavanannon oikein. 
// Pollolle arvotaan joka kerta uusi animation-timing-function. Eli pollon animaatio menee vahan eri tahtia/vauhtia riippuen valitusta funktiosta.
function luoPollo() {
  
  // Luodaan pollo.
  var kohde = document.querySelector('body');
  var p = document.createElement('p');
  var img = document.createElement('img');
  p.appendChild(img);
  img.src = "owl.svg";

  // animation-timing-function vaihtoehdot.
  const vaihtoehdot = ['ease','ease-in','ease-out','ease-in-out','linear','cubic-bezier(0.1,0.7,1.0,0.1)'];
  // Arvotaan niista yksi.
  var arvottu = vaihtoehdot[Math.round(Math.floor(Math.random() * Math.floor(vaihtoehdot.length)))]; 

  // Luodaan vuronperaan pollo vasemmalta ja vuoronperaan oikealta. 
  switch (nextPolloRespawn) {
    case PolloRespawnType.vasen:
      p.setAttribute('class','pPolloVasen');
      // Asetetaan arvottin timing-funtio.
      p.style.animationTimingFunction = arvottu;
      nextPolloRespawn = PolloRespawnType.oikea;
      break;
    case PolloRespawnType.oikea:
      p.setAttribute('class','pPolloOikea');
      // Asetetaan arvottin timing-funtio.
      p.style.animationTimingFunction = arvottu;
      nextPolloRespawn = PolloRespawnType.vasen;
      break;
    case PolloRespawnType.original:
      p.setAttribute('class','pPolloOriginal');
      nextPolloRespawn = PolloRespawnType.vasen;
      break;
    default:
      console.error(`luoPollo(): nextPolloRespawn === ${nextPolloRespawn}. Ei tuettu!`);
  }
  // Asetetaan pollolle z-indeksi.
  
  // Jos lumihiutaleita on enemman kuin 110000, niin meilla on isompiakin huolia. Talloin taytyy muuttaa koko ohjelman logiikkaa toisenlaiseksi.
  p.style.zIndex = getZ(POLLOOFFSET);
  kohde.appendChild(p);
}

/*******************************************************************************************************************************************************/

function luoPupuVasen_taso1() {
  var kohde = document.querySelector('body');
  var canvas = document.createElement('canvas');
  var img = document.createElement('img');
  globalImages.push(img);
  img.src = "bunny.png";
  img.setAttribute('class','imgPupu');
  canvas.setAttribute('class','canvasPupuVasen');
  canvas.style.zIndex = getNextZ();
  kohde.appendChild(canvas);
  let ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width/2.0, img.height, 0, 0, canvas.width, canvas.height);
}

/*******************************************************************************************************************************************************/

function luoPupuOikea_taso1() {
  var kohde = document.querySelector('body');
  var canvas = document.createElement('canvas');
  var img = globalImages.find(x => x.className === 'imgPupu');
  canvas.setAttribute('class','canvasPupuOikea');
  canvas.style.zIndex = getNextZ();
  kohde.appendChild(canvas);
  let ctx = canvas.getContext('2d');
  ctx.drawImage(img, img.width/2.0, 0, img.width/2.0, img.height, 0, 0, canvas.width, canvas.height);
}

/*******************************************************************************************************************************************************/

// Luodaan puput, ja laitetaan animaatio kayntiin. Hieman copypastea tassa, mutta melkoon. En jaksa alkaa hienostelemaan tassa.
// PalkkiJakoLkm tarkoittaa sita, kuinka moneen eri palaseen pupu jaetaan piirrettaessa.
// Pupun liikerata ei taysin vastaa open versiota, mutta tama versio on parempi...
function luoPuput_taso3(palkkiJakoLkm) {
  var kohde = document.querySelector('body');
  var canvasV = document.createElement('canvas');
  var canvasO = document.createElement('canvas');
  var img = document.createElement('img');
  img.src = "bunny.png";
  img.setAttribute('class','imgPupu');
  canvasV.setAttribute('class','canvasPupuVasen');
  canvasV.style.zIndex = getZ(PUPUOFFSET);
  canvasO.setAttribute('class','canvasPupuOikea');
  canvasO.style.zIndex = getZ(PUPUOFFSET);
  kohde.appendChild(canvasV);
  kohde.appendChild(canvasO);

  // Animaatiolaskuri. Toivottavasti 64-bittia riittaa, ennen kuin ohjelma loppuu. Silloin tulee z-day.
  // Joku oikea kello olisi ollut parempi, varsinkin jos tehdaan monimutkaisempaa animaatiota, eika haluta 
  // animaation tokkivan.
  var lkm = 0;

  var piirtoFunctioPupuV = () => {
    var ctx = canvasV.getContext('2d');
    var ctx2 = canvasO.getContext('2d');
    var palkinKorkeus = img.height/palkkiJakoLkm;

    // Tehdaan nyt animaatio piirtamalla pupu siivuittain ja venyttelemalla siivuja pystysuorassa.

    // Hahaa. Haskelia javascriptilla. Huonoa Haskelia siis :(.
    // Trigonometrista magiaa. En viitsi selittaa tata liikaa, muuten joku viela patentoi taman. Ehka silmukka olisi parempi kuin listojen 
    // pyorittely, ainakin jos haluaa tehoa. Tassa se ei nyt haittaa.
    var sy = [...Array(palkkiJakoLkm).keys()].map(x => img.height/palkkiJakoLkm*x); 
    var venytettysy = [...Array(palkkiJakoLkm).keys()].map(x=>x+lkm);
    venytettysy = venytettysy.map(x => palkinKorkeus/2.0 + (palkinKorkeus/4.0)*Math.sin(0.4*x/6.0)); 
    lkm = lkm + 1;
    var sum = venytettysy.reduce((x,y) => x + y);
    venytettysy = venytettysy.map(x => Math.floor(x));

    // Imagen pituus puolitettuna.
    var oWidth = img.width/2.0;
    // Seuraavan piirrettavan y-koordinaatin kohta.
    var nextTargetY = 0;

    // Puhdistetaan canvakset.
    ctx.clearRect(0,0,canvasV.width, canvasV.height);
    ctx2.clearRect(0,0,canvasO.width, canvasO.height);

    // Piirretaan kumpikin pupun puoliskon palkit silmukassa.
    for (let x=0; x<sy.length; x++) {
      ctx.drawImage(img, 0, sy[x]      , oWidth              , palkinKorkeus, 
                         0, nextTargetY, canvasV.width , venytettysy[x]);     
      			                                                      
      ctx2.drawImage(img, oWidth, sy[x], oWidth, palkinKorkeus, 
                         0, nextTargetY, canvasV.width , venytettysy[x]);

      // Lasketaan seuraavan palkin y-koordinaatti (alkamiskohta).
      nextTargetY = nextTargetY + venytettysy[x];
    }
    // Halutaan etta tata piirretaan jatkossakin.
    requestAnimationFrame(piirtoFunctioPupuV);
  };
  requestAnimationFrame(piirtoFunctioPupuV);
}

/*******************************************************************************************************************************************************/

function luoTaso3Teksti(txt) {
  var kohde = document.querySelector('body');
  var canvas = document.createElement('canvas');
  canvas.setAttribute('class','text3taso');
  canvas.style.zIndex = getNextZ();
  var originalWidth = 1920;
  var originalHeight = 200;
  var originalTextPos = undefined;
  var textPosNow = undefined;
  var previousTick = getTime()*1.0;
  var delta = 0.0;
  canvas.width = originalWidth;
  canvas.height = originalHeight;
  kohde.appendChild(canvas);

  // Funktio, joka piirtaa tekstin. Kaytossa oma surkea timeri. Pienta nykinaa on ilmapiirissa. Pitaisi kayttaa jotain oikeaa timeria, eika omaa. 
  function piirraText3taso() {
    var ctx = canvas.getContext('2d');

    // Lasketaan tekstin suhteet niin, etta nayttaa jotenkin fiksulta.
    var suhdeX = canvas.offsetWidth / originalWidth;
    var suhdeY = canvas.offsetHeight / originalHeight;

    // Piirretaan.
    ctx.save();
    ctx.clearRect(0,0,canvas.width, canvas.height);

    // Skaalataan oikean kokoiseksi.
    ctx.scale(suhdeX,suhdeY);

    // Siirretaan tekstia.
    ctx.translate(textPosNow*(1/suhdeX),0);


    // Piirretaan.
    ctx.font = '150px serif';
    var gradient = ctx.createLinearGradient(0,0, 0, canvas.height);

    // Ei oikein auennut tuo lineargradien logiikka. Luulisi aluksi, etta numerot olisivat prosenttiosuuksia, mutta ne ovat jotain paljon monimutkaisempaa.
    // Nooh onpahan jotain sinne pain.
    gradient.addColorStop(0,"#000000");
    gradient.addColorStop(0.15,"#6C6700");
    gradient.addColorStop(0.3,"yellow");
    gradient.addColorStop(0.5,"#6C6700");
    gradient.addColorStop(0.85,"#6C6700");
    gradient.addColorStop(1,"#000000");
    ctx.fillStyle = gradient;
    ctx.fillText(txt,0,110);

    // Timer kikkailua.
    var textInfo = ctx.measureText(txt);
    ctx.restore();


    // Suotta kertoilen liukuluvuilla. Nykii se silloinkin.
    var tickNow = getTime()*1.0;
    delta = delta + (tickNow - previousTick);
    previousTick = tickNow;

    // Alustetaan teksin alkukoordinaatti.
    if (originalTextPos === undefined) { 
      originalTextPos = (originalWidth + 300)*1.0; 
      textPosNow = originalTextPos;
    }

    // Maarataan tekstin vieritysnopeus.
    const DELTA = 14;
    while (delta > DELTA) {
      textPosNow = (textPosNow - delta/DELTA);
      delta = delta - DELTA;
    } 

    // Teksti on mennyt loppuun. Aloitetaan alusta.
    if (textPosNow < 0 - canvas.width - textInfo.width - 300) { textPosNow = originalTextPos; startTimer(); } 

    // Piirretaan jatkossakin.
    requestAnimationFrame(piirraText3taso);
  }
  requestAnimationFrame(piirraText3taso);
}

/*******************************************************************************************************************************************************/


function luoTaso5Teksti(txt) {
  var kohde = document.querySelector('body');
  var canvas = document.createElement('canvas');
  canvas.setAttribute('class','text5taso');
  canvas.style.zIndex = getZ(TEXTOFFSET);
  var originalWidth = 1920;
  var originalHeight = 200;
  var originalTextPos = undefined;
  var textPosNow = undefined;
  var previousTick = getTime()*1.0;
  var delta = 0.0;
  canvas.width = originalWidth;
  canvas.height = originalHeight;
  kohde.appendChild(canvas);

  // Siirretaan pollo paalimmaiseksi.
  //document.querySelector('.lisaaButton').style.zIndex = getNextZ();

  // Funktio, joka piirtaa tekstin taso 5 mukaisesti. Kaytossa oma surkea timeri. Pienta nykinaa on ilmapiirissa. Pitaisi kayttaa jotain oikeaa timeria, eika omaa. 
  function piirraText5taso() {
    var ctx = canvas.getContext('2d');

    // Lasketaan tekstin suhteet niin, etta nayttaa jotenkin fiksulta.
    var suhdeX = canvas.offsetWidth / originalWidth;
    var suhdeY = canvas.offsetHeight / originalHeight;

    // Piirretaan.
    ctx.save();
    ctx.clearRect(0,0,canvas.width, canvas.height);

    // Skaalataan oikean kokoiseksi.
    ctx.scale(suhdeX,suhdeY);


    // Piirretaan.
    ctx.font = '20px serif';

    // 
    ctx.fillStyle = 'white';

    // Timer kikkailua.
    var textInfo = ctx.measureText(txt);


    ctx.translate(textPosNow*(1/suhdeX),0);

    // Piirretaan kirjaimet yksitellen. Trigonometria ei ole ihan hallussa...
    for (let x=0; x<txt.length; x++) {
      var xSuunta = x*16 + Math.sin(getTime()/800+x*5)*5+(-1)*Math.abs(Math.sin(Math.PI + getTime()/1800+x*11.5))*15 + 15*x;
      var ySuunta = Math.sin(getTime()/200+x*0.3)*12 + Math.cos(getTime()/1000+x*2)*2;
      ctx.fillText(txt[x],xSuunta,50+ySuunta);
    }

    ctx.restore();

    var tickNow = getTime()*1.0;
    delta = delta + (tickNow - previousTick);
    previousTick = tickNow;

    // Alustetaan teksin alkukoordinaatti.
    if (originalTextPos === undefined) { 
      originalTextPos = (originalWidth + 300)*1.0; 
      textPosNow = originalTextPos;
    }

    // Maarataan tekstin vieritysnopeus.
    const DELTA = 6;
    while (delta > DELTA) {
      textPosNow = (textPosNow - delta/DELTA);
      delta = delta - DELTA;
    } 

    // Teksti on mennyt loppuun. Aloitetaan alusta.
    if (textPosNow < 0 - canvas.width - textInfo.width - 300) { textPosNow = originalTextPos; startTimer(); } 

    // Piirretaan jatkossakin.
    requestAnimationFrame(piirraText5taso);
  }
  requestAnimationFrame(piirraText5taso);
}

/*******************************************************************************************************************************************************/

// Aloittaa lumisateen.
function lumihiutaleet() {

  var kohde = document.querySelector('body');

  // Arvotaan seuraavan lumihiutaleen luontiaika.
  var timeDelay = Math.round(Math.floor(Math.random() * Math.floor(400)))+200; 

  // Ajastetaan seuraava lumihiutale.
  setTimeout(e => {

    // Luodaan lumihiutale.
    var p = document.createElement('p');
    var image = document.createElement('img');
    p.appendChild(image);
    image.src = 'snowflake2.svg';
    image.setAttribute('class', 'lumihiutaleImg');
    p.className = 'lumihiutale';

    // Asetetaan uusi z-indeksi.
    p.style.zIndex = getZ(HIUTALEOFFSET);  

/* Alinperin z-indeksit puliveivattiin talla tavalla. Tama toimikin ihan hyvin, paitsi etta nappula ei toiminut joka painakusella. 
 * Tassa ohjelmassa on aika paljon rinnakkaisuutta tms, joten z-indeksien muuttaminen tallain ei eihan aina toimi. 
 *
    // haetaan palkit, jotta tiedetaan mika on viimeisimman palkin z-indeksi. 
    // Palkkien z-indeksi alkavat 0:sta.
    var palkit = document.querySelectorAll('.pPalkki');

    // Paivitetaan muiden objektien paitsi palkkien zindeksia.
    var pupuVasen = document.querySelector('.canvasPupuVasen');
    var pupuOikea = document.querySelector('.canvasPupuOikea');
    var polloOriginal = document.querySelector('.pPolloOriginal');
    var pollotVasen = document.querySelectorAll('.pPolloVasen');
    var pollotOikea = document.querySelectorAll('.lisaaButton');
    var text = document.querySelector('.text5taso');
    var button = document.querySelector('.lisaaButton');

    // Kasvatetaan z-indekseja. Kutsutaan getNextZ funktiota, jotta saadaan paivitettya nextZ arvoa.
    pupuVasen.style.zIndex = pupuVasen.style.zIndex + 1; getNextZ();  
    pupuOikea.style.zIndex = pupuOikea.style.zIndex + 1; getNextZ();
    polloOriginal.style.zIndex = polloOriginal.style.zIndex + 1;  
    for (let k of pollotOikea) { k.style.zIndex = k.style.zIndex + 1;getNextZ(); } 
    for (let k of pollotVasen) { k.style.zIndex = k.style.zIndex + 1;getNextZ(); } 
    text.style.zIndex = getNextZ();  
    button.style.zIndex = getNextZ(); 

    // Laitetaan lumihiutaleelle siis yksi suurempi zindeksi kuin palkeilla + lumihiutaleiden maara. Kaikkien muiden z-indeksit ovat naiden ylapuolella.
    p.style.zIndex = palkit.length+hiutaleet.length;
    */

    kohde.appendChild(p);
    // Arvotaan lumihiutaleen left-arvo.
    var xPos = Math.round(Math.floor(Math.random() * Math.floor(1000)))/10.0; 
    var left = xPos/kohde.offsetWidth*100;

    // Luodaan hiutale-olio, jossa on sen left-arvo, ja se tieto, milla korkeustasolla se on.
    var hiutale = {left: left, bottomIndex: 0};
    p.style.left = `${xPos}%`;

    // Tsekataan, mille korkeustasolle luotu hiutale kuuluu, eli kuinka monta hiutaletta on sen alapuolella.
    var lumihiutaleitaAlla = hiutaleet.filter(z => { 
      return (Math.abs(z.left-xPos)*kohde.offsetWidth/100)<p.offsetWidth/2.0;
    });

    // jos hiutaleita on jo taman hiutaleen alapuolella, etsitaan sille yhta suurempi korkeustaso kuin edelliset.
    if (lumihiutaleitaAlla !== []) {
      const reducer = (acc,cur) => Math.max(acc,cur.bottomIndex);
      var maxBottomIndex = lumihiutaleitaAlla.reduce(reducer, 0);
      hiutaleet.push({left: xPos, bottomIndex: maxBottomIndex+1});
    }
    // Ei ollut hiutaleita alapuolella. Taso on 0.
    else hiutaleet.push({left: xPos, bottomIndex: 0});

    // Paivitetaan uusi top value, eli se mihin hiutale jaa. Ja mihin css-animaatio lumihiutaleen vie.
    var newTop = 97 - maxBottomIndex*3;

    // Luodaan uusi css animaation nimi.
    var uusiAnimaatioNimi = `hiutale${newTop}`; 

    // Loytyyko css keyframe rule entuudestaan. Jos ei loydy, niin luodaan uusi.
    if (findKeyframesRule(uusiAnimaatioNimi) === null) {
      insertCSSAnimation(uusiAnimaatioNimi, 5,newTop);
    }
    // Asetetaan uusi top value. Nain lumi kasaantuu.
    p.style.top = `${newTop}%`;

    // Asetetaan animaatio-propertyt.
    p.style.animationName = uusiAnimaatioNimi;

    // Animation duratiota taytyy muutta, jos lyhennetaan matkaa jonka lumihiutale kulkee. Muussa tapauksessa lumihiutaleet 
    // putoavat sita nopeammin mita lyhyempi matka niilla on.
    var uusiDuratio = 5000*(newTop/100);

    // Asetetaan animaatioon uusi kesto.
    p.style.animationDuration = `${uusiDuratio}ms`;
    p.style.animationDirection = "normal";
    p.style.animationTimingFunction = "linear";

    // Kutsutaan uudestaan lumihiutaleet(), jotta saadaan lisaa hiutaleita.
    lumihiutaleet();
    },timeDelay);



}

/*******************************************************************************************************************************************************/

// Lisataan uusi css-animaatio lumihiutaleelle.
function insertCSSAnimation(animaationNimi, alku, loppu) {
  var anim = `@keyframes ${animaationNimi} {from {top: ${alku}%;} to {top: ${loppu}%; }}`;
  var length = document.styleSheets[0].cssRules.length;
  document.styleSheets[0].insertRule(anim, length);
}

/*******************************************************************************************************************************************************/

function luoButton() {
  var kohde = document.querySelector('body');
  var button = document.createElement('button');
  button.setAttribute('class','lisaaButton');
  button.style.zIndex = getZ(BUTTONOFFSET);
  console.log(button.style.zIndex);
  button.textContent= "Lisää pöllö";
  kohde.appendChild(button);

  // Lisaa pollo toiminto.
  button.addEventListener('click', e => {
    e.preventDefault();
    luoPollo();
    // Kasvatetaan nappulan z-indeksi suurimmaksi kuin edelliset, niin pysyy kaikkien elementtien ylapuolella.
    //document.querySelector('.lisaaButton').style.zIndex = getNextZ();
  });
}

/*******************************************************************************************************************************************************/

// TIEA2120 sivulta loytyva apufunktio.
function findKeyframesRule(rule) {
  var ss = document.styleSheets;
  for (var i = 0; i < ss.length; ++i) {
    for (var j = 0; j < ss[i].cssRules.length; ++j) {
      if (ss[i].cssRules[j].type == window.CSSRule.KEYFRAMES_RULE && ss[i].cssRules[j].name == rule) { 
        return ss[i].cssRules[j]; }
      }
    }
  return null;
}

/*******************************************************************************************************************************************************/

function printText(txt) {
  if (piirtoLkm < maxPiirtoLkm) console.log(txt); 
  piirtoLkm = piirtoLkm + 1;
}

/*******************************************************************************************************************************************************/

function startTimer() {
  startTick = window.performance.now(); 
  tickNow = startTick;
  update();
}

/*******************************************************************************************************************************************************/

function getTime() {
  return tickNow; 
}

/*******************************************************************************************************************************************************/

function update() {
  setTimeout(e => { tickNow = window.performance.now(); update(); }, UPDATE_RATE_mms);
}
