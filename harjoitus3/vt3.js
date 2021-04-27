// data-muuttuja sisältää kaiken tarvittavan ja on rakenteeltaan lähes samankaltainen kuin viikkotehtävässä 2
// Rastileimaukset on siirretty tupa-rakenteesta suoraan jokaisen joukkueen yhteyteen
//
// voit tutkia tarkemmin käsiteltävää tietorakennetta konsolin kautta 
// tai json-editorin kautta osoitteessa http://jsoneditoronline.org/
// Jos käytät json-editoria niin avaa data osoitteesta:
// http://appro.mit.jyu.fi/tiea2120/vt/vt3/data.json


/* 
 * TODO: korjaa responsiivisuus.
 * PUUTTEITA & BUGEJA:
 *   (1) kun mennaan leveydessa alle 300px, niin tulee hieman ruman nakoinen sivu. jos jaa aikaa, niin lukitse kokoja, jotta 
 *       saadaan nayttamaan hienolta ja scrollbar ilmaantuu. 
 *   (2) On vain tallenna nappi. Eli jos haluaakin perua tekemisiaan, niin ei onnaa. Tosin ei tainnut olla vaatimuksissa, mutta olisi muuten hyva.
 *   (3) Rastileimauksissa jos kaikki muu on tyhjaa, mutta vian poista on ruksittu, niin on tyhmaa etta ohjelma valittaa tyhjista kentista. En oikein 
 *       jatka enaa korjata. Tahan on mennyt vahan liikaakin aikaa.
 *   (4) Tajuton maara sekaavaa koodia taas. jos jotain muuttaa, niin ohjelma alkaa todennakoisesti kakomaan. En lahde refaktoroimaan, silla 
 *       muuten menee toiset 30 tuntia.
 *   (5) En ollut ihan varma noiden aikakenttien kanssa miten niiden kanssa olisi tullut hoitaa homma. Nyt ne ovat text muotoa. Katevaa olisi ollut 
 *       kayttaa esim. datetime-local. Aluksi olikin niin, ja homma toimi hyvin firefoxissa, mutta kun lopuksi testatis chromella, niin homma 
 *       ei sitten toiminutkaan ihan niin jouhevasti. Ehka olisi paassyt kayttamaan validity ominaisuuttakin paremmin, mutta nyt talla kertaa nain.
 *   (6) css on heikonlaisesti kommentoitu. 
 *   (7) Ilmeisesti datalistin yhteyteen oli tarkoitus myos ympata select, tai ainakin saada nuoli alaspain jokaiseen kohtaan. No jai nyt tekematta.
 *   (8) Muutenkin tuo responsiivisuus ei mennyt ihan nappiin. Melkein nappiin, mutta ei kuitenkaan. En jaanyt ahraamaan maaraansa enempaa.
 *   (9) HT opelle. Etsi loput bugit.
 */

"use strict";

console.log(data);

// Debuggausta varten. Aseta trueksi jos haluat degukkailla. Muutoin false.
var debug = false;
// Testausta varten. Aseta trueksi testausvaiheessa. Muutoin false.
var test = false;

// Kun tama on paalla, niin tulostetaan jokainen funktion nimi kun sita kutsutaan.
var hardDebug = false;

// Laskurit testeille.
var passCounter = 0;
var failCounter = 0;

// Polkaistaan testit kayntiin.
test && console.log("TESTAUS ALKAA.");
test && testThings();
test && console.log("TESTAUS PAATTYY.");

/* Globaalit muuttujat. Ehka huonoa suunnittelua, mutta pidetaan kuitenkin sivuston tilaa ylla naissa muuttujissa. */

// Pidetaan taalla kirjaa valituista leimaustavoista.
var leimaustapaSet = new Set();

// Pidetaan kirjaa jasenista.
var jasenet = [];
// Viite muokattavana olevaan viitteeseen. Tuntuu vahan pahalta pitaa globaaleja muuttujia nain, mutta olkoon taman kerran.
var globalJoukkue = null;
// nykyisen sarjan id .
var globalSarja = undefined;
// TODO: katso onko oikeasti tarpeellinen.
var globalKisa = null;

// Tahan tulee tallentamattomien sarjojen idt. Lahinna sita varten, etta saadaan myos uniikit sarjojen id:t tehtailtua. 
var tallentamattomatSarjaIdt = [];

var globalTallentamatonKisa = null;

// Luodaan tanne ne rasti-tunnarit, jotka ovat kaytossa. HUOM! EI KAYTOSSA NYT.
var globalKielletytRastit = new Set();

// Tahan tulee aktiivisena olevan joukkueen rastit.
// var globalJoukkueenRastit = [];

/***********************************************************************************************************************************************/

window.onload = function() {
  hardDebug && console.debug(`window.onload`);
  var leimaustapaInputit = document.querySelectorAll("#leimaustavat input"); 
  var joukkueForm = document.getElementById("joukkueLomake"); 
  joukkueForm.setAttribute("novalidate","novalidate");
  for (let x of leimaustapaInputit) x.setCustomValidity("");
  addEventsToAikavalue();
  addEventsToLeimaustapa();
  addEventsToJoukkueNimi();
  addEventsToJoukkueButton(); 
  updateJoukkueLomake(createNewJoukkue());
  listaaJoukkueet();
  updateKisaLomake(); 
  addEventsToKisaLomake();
  addEventsToKisaSelect();
  aikaLeimaaSarjat();
  luoRastileimaukset(globalJoukkue); 
};

/***********************************************************************************************************************************************/

// Testifunktio.
function testThings() {
  hardDebug && console.debug(`testThings()`);
  shouldBe(getJoukkue, [123], null, false); 
  shouldBe(getJoukkue, ["Kahden joukkue"], data.joukkueet[2],false); 
  shouldBe(getJoukkue, [5156929819115520], data.joukkueet[2],false); 
  shouldBe(setJoukkue, [{nimi: "Dynamic Duo"}], false, false);
  // Testataan seka setJoukkue etta jalkiehto.
  shouldBe(setJoukkue, [{nimi: "Erkit Duo"}], true, false, );
  shouldBe(() => data.joukkueet[data.joukkueet.length-1].nimi === "Erkit Duo", [], true, false);
  
  console.log(`Testien lkm = ${passCounter + failCounter}.`);
  console.log(`Onnistuneiden testien lkm = ${passCounter}.`);
  console.log(`Epäonnistuneiden testien lkm = ${failCounter}.`);
}

/***********************************************************************************************************************************************/

// Oma testausfunktio. Olisi varmaankin valmiita omia testauskirjastoja, mutta olkoon nyt omia.
function shouldBe(func, args, ret, shouldThrow) {
  hardDebug && console.debug(`shouldBe()`);
  var result = undefined;
  var pass = false;
  var throwing = false;
  var message = ""; 
  var exception = undefined;
  const PASS = "PASS";
  const FAIL = "FAIL";

  try { 
    result = func.apply(this, args);
  } catch (e) {
      throwing = true; 
      exception = e;
  }

  // Testataan hieman poikkeuksia. Ei kytata mitaan tiettya poikkeusta.
  if (throwing === true && shouldThrow === true) {
    pass = true; 
    message = `    throwing exception ${exception}`;
  }
  else if (throwing === true && shouldThrow === false) {
    pass = false;
    message = `    throwing exception: ${exception}, but should not throw exceptions.`;
  }
  else if (throwing === false && shouldThrow === true) {
    pass = false;
    message = `    Should throw exception, but no exception is thrown.`;
  }

  else if (throwing === false && result === ret) {
    pass = true;
    message = `    return value :${result}: and expected return value :${ret}: are same.`;
  }
  
  // Tanne paadytaa silloin, kun ei heiteta eika odoteta poikkeusa.
  else if (throwing === false && result !== ret) {
    pass = false;
    message = `    return value :${result}: and expected return value :${ret}: mismatch.`;
  }
  // Tanne ei paadyta koskaan muulloin kuin jos testifunktio bugittaa.
  else {
    console.error("TANNE EI PITAISI PAATYA KOSKAAN!");
    console.error(`throwing === ${throwing}. shouldThrow === ${shouldThrow}. pass === ${pass}. result === ${result}. message === ${message}. exception === ${exception}.`);
  }

  console.log(`Calling: ${func.name}(${args.join(',')})`);
  console.log(`   returning ==> ${result}`); 
  console.log(`   expecting ==> ${ret}`); 
  console.log(message);
  if (pass === true) {
    console.debug(`    ${PASS}`);
    passCounter = passCounter + 1;
  }
  else {
    console.error(`    ${FAIL}`);
    failCounter = failCounter + 1;
  }
}

/* 
 *
 * Apufunktioita.
 *
 */

/***********************************************************************************************************************************************/

// Functio, joka convertoi merkkikjonon @str, joka on muotoa pp.kk.vvvv hh:mm => vvvv.kk.pp hh:mm. Palauttaa uuden aikamuodon tai null jos epaonnistuu.
function convertoiCustomAikaToDate(str) {
  hardDebug && console.debug(`convertoiCustomAikaToDate(${str}).`); 
  var expr = /(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}).*/g;
  var r = expr.exec(str);
  if (r !== null) return `${r[3]}-${r[2]}-${r[1]} ${r[4]}:${r[5]}`; 
  else console.error(`convertoiCustomAikaToDate(${str}): ei saatu konvertoitua vvvv-kk-pp hh:mm .`);

}
/***********************************************************************************************************************************************/

// Convertoi paivamaara stringin @date, joka on muotoa vvvv.kk.ppThh:mm muotoon joka on muotoa pp.kk.vvvv hh:mm.
function convertoiDateToCustomAika(date) {
  hardDebug && console.debug(`convertoiDateToCustomAika(${date}).`); 
  const patternMax = /(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d).*/
  let [x,y,month,d,hour,min] = patternMax.exec(date) || []; 
  return `${d}.${month}.${y} ${hour}:${min}`;
}

/***********************************************************************************************************************************************/

// Funktio, joka parsii merkkijonosta @str date. @str on muotoa 'pp.kk.vvvv hh:mm' ajan tai jos epaonnistuu niin palauttaa null.

function parsiAikaCustomMuodosta(str) {
  hardDebug && console.debug(`parsiAikaCustomMuodosta(${str}).`); 
  const pattern = /(\d\d)\.(\d\d)\.(\d\d\d\d) (\d\d):(\d\d)/; 
  let [_,p,kk,v,h,m] = pattern.exec(str) || []; 
  return new Date(`${v}-${kk}-${p}T${h}:${m}:00`);
}

/***********************************************************************************************************************************************/

// vvvv-kk-pp hh:mm(:ss) => pp.kk.vvv hh:mm(:ss)
function convertoiViivaMuotoToPisteMuodo(str) {
  hardDebug && console.debug(`convertoiViivaMuotoToPisteMuodo(${str}).`); 
  const patternMax = /^(\d\d\d\d)-(\d\d)-(\d\d) (\d\d):(\d\d)(:\d\d)?$/
  let [x,y,month,d,hour,min,sek] = patternMax.exec(str) || []; 
  if (sek === undefined) sek = "";
  return `${d}.${month}.${y} ${hour}:${min}${sek}`;
}

/***********************************************************************************************************************************************/

// pp.kk.vvvv hh:mm(:ss) => vvvv-kk-pp hh:mm(:ss) 
function convertoiPisteMuotoToViiva(str) {
  hardDebug && console.debug(`convertoiPisteMuotoToViiva(${str}).`); 
  const pattern = /^(\d\d)\.(\d\d)\.(\d\d\d\d) (\d\d):(\d\d)(:\d\d)?$/; 
  let [_,p,kk,v,h,m,s] = pattern.exec(str) || []; 
  if (s === undefined) s = "";
  return `${v}-${kk}-${p} ${h}:${m}${s}`;
}

/***********************************************************************************************************************************************/

// Funktio, joka hakee joukkueen rastileimaukset, poistaa niista monikerrat ja liittaa liittaa kuhunkin rastileimaukseen sita vastaavan rasti-olion.
// Palauttaa siis listan, jossta oliot ovat muotoa {joukkueRasti, dataRasti}.
function getRastit(joukkueId) {
  hardDebug && console.debug(`getRastit(${joukkueId}).`); 
  var rastit = [];
  var joukkue = getJoukkue(joukkueId);
  // Poistetaan mahdolliset monikerrat.
  var rastienIdt = Array.from(new Set(joukkue.rastit.map(x => x.id)));
  var rastitNoMonikerta = [];
  for (let x of rastienIdt) {
    // Tahan siis joukkue.rastit rasti-olio.
    let tempRasti = joukkue.rastit.find(b => b.id.toString() === x.toString()); 
    // Tahan siis vastaava data.rastit rasti-olio.
    let rastiObject = data.rastit.find(b => b.id.toString() === x.toString()); 
    // jos rastin koodi ei ala numerolla, niin heitetaan se menemaan. Tai jos koko rastia ei loydy, niin.
    if (rastiObject === undefined || !rastiObject.koodi.match(/^\d/)) { continue;} 
    rastit.push({joukkueRasti: tempRasti, dataRasti: rastiObject});
  }
  return rastit;  
}

/***********************************************************************************************************************************************/

// Kay kaikki sarjat lapi, ja jos alku- tai loppuaika puuttuu, niin se otetaan kisan alku- tai loppuasjasta.
function aikaLeimaaSarjat() {
  var sarjat = getSarjat();
  for (let x of sarjat) {
    if (x.alkuaika === null) {
      var kisa = getKisa(x.id);
      x.alkuaika = kisa.alkuaika;
      x.loppuaika = kisa.loppuaika;
    }
  }
}

/***********************************************************************************************************************************************/

// Haetaan joukkue joko nimen tai id:n perusteella. Palautaa null, jos joukkuetta ei loydy.
function getJoukkue(key) {
  hardDebug && console.debug(`getJoukkue(${key}).`); 
  if (typeof key === 'string') key = key.trim();
  if (typeof key === 'number') {
    for (let x of data.joukkueet) {
      if (key === x.id) {
        return x;
      }
    }
    return null;
  }
  else if (typeof key === 'string') {
    for (let x of data.joukkueet) {
      if (key === x.nimi.trim()) {
        return x;
      }
    }
    debug && console.debug(`getJoukkue(${key}): joukkuetta ei loydy`);
    return null;
  }
  else {
    debug && console.debug(`getJoukkue(${key}):.`);
    return null;
  }
}

/***********************************************************************************************************************************************/

function getJoukkueet() {
  hardDebug && console.debug(`getJoukkueet().`); 
  var joukkueet = [];
  for (let x of data.joukkueet) {
    joukkueet.push(x); 
  }
  return joukkueet;
}

/***********************************************************************************************************************************************/

function getKisat() {
  hardDebug && console.debug(`getKisat().`); 
  var k = [];
  for (let x of data.kisat) {
    k.push(x);
  }
  return k;
}

/***********************************************************************************************************************************************/

// Hakee kisan sarjanId:n tai sitten HUOM: kisan nimen perusteella. Key voi olla id tai nimi. Jos kisa loytyy, niin se palautetaan. Muuten palautetaan null.
function getKisa(key) {
  hardDebug && console.debug(`getKisa(${key}).`); 
  var typeofKey = typeof key;
  if (typeofKey === 'number') {
    for (let x of data.kisat) {
      for (let y of x.sarjat) {
        if (key === y.id) return x;
      }
    }
  }
  if (typeofKey === 'string') {
    for (let x of data.kisat) {
      if (key === x.nimi) return x;
    }
  }
  debug && console.log(`getKisa(${key}: ei loytynyt kisaa.`);
  return null;
}

/***********************************************************************************************************************************************/

// Luo uuden joukkueen, jolla uniikki id ja jne. Sarja on "2h".
function createNewJoukkue() {
  hardDebug && console.debug(`createNewJoukkue().`); 
  var dateNow = new Date(Date.now());
  // Idioottimaista kikkailua, jotta saadaan tulostutetuksi oikea aika. HUOM! ei nyt kaytossa. Eli ei luoda automaattisesti aikaa tasta ajan hetkesta.
  var nowTulostusta = new Date(dateNow.getTime() - dateNow.getTimezoneOffset()*60*1000);
  var joukkue = {id: createJoukkueId(),
                 jasenet: [],
                 leimaustapa: [],
                 luontiaika: ""/* nowTulostusta.toJSON().replace(/T/gi, ' ').replace(/Z/gi,'') */ ,
                 matka: 0 ,
                 nimi: "" ,
                 pisteet: 0,
                 rastit: [],
                 sarja: 5088228730208256,
                 seura: null}; 
  debug && console.debug("Luodaan uusi joukkue:");
  debug && console.debug(joukkue);
  return joukkue;
}

/***********************************************************************************************************************************************/

function createNewKisa() {
  hardDebug && console.debug(`createNewKisa().`); 
  var kisaId = createKisaId();
  return {alkuaika: "", id: kisaId, kesto: 0, loppuaika: "", nimi: "", sarjat: createSarjat(kisaId)}; 
}


/***********************************************************************************************************************************************/

// Luo sarjat ottaen mallia ensimmaisesta kisasta.
function createSarjat(kisaId) {
  hardDebug && console.debug(`createSarjat(${kisaId}).`); 
  var sarjat = [];
  var protoKisa = data.kisat[0];
  var nykyinenKisa = data.kisat.find(z => z.id === kisaId);

  // Hubbabubbaa, mutta toimii nyt.
  var nykyinenKisaTallennettu = true;

  // Kisaa ei oltu viela tallennettu! 
  if (nykyinenKisa === undefined) {
    nykyinenKisaTallennettu = false;;
  }
  for (let x of protoKisa.sarjat) {
    if (nykyinenKisaTallennettu === false) {
      sarjat.push({alkuaika: null, id: createSarjaId(), kesto: x.kesto , kilpailu: kisaId, loppuaika: null, matka: x.matka, nimi: x.nimi});
    }
    else sarjat.push({alkuaika: nykyinenKisa.alkuaika, id: createSarjaId(), kesto: x.kesto , kilpailu: kisaId, loppuaika: nykyinenKisa.loppuaika, matka: x.matka, nimi: x.nimi});   
  }
  return sarjat;
}

/***********************************************************************************************************************************************/
// Etsitaan sarjaa id:n perusteella.
function getSarja(key) {
  hardDebug && console.debug(`getSarja(${key}).`); 
  var typeofkey = typeof key; 
  for (let i of data.kisat) {
    for (let k of i.sarjat) {
      if (typeofkey === 'number') {
        if (k.id === key) return k;
      }
      else { console.error(`getSarja(${key}): ${key} ei ole tyyppia number.`); return null; }
    }
  }
  // Ei loytynyt sarjaa.
  return null;
}

/***********************************************************************************************************************************************/

function getSarjaByKisa(kisaId, sarjaStr) {
  hardDebug && console.debug(`getSarjaByKisa(${kisaId},${sarjaStr}).`); 
  for (let x of data.kisat) {
    if (x.id === kisaId) {
      for (let y of x.sarjat) {
        if (y.nimi === sarjaStr) {
          return y;
	}
      }
    }
  }
  console.error(`getSarjaByKisa$({kisaId,},${sarjaStr}): sarjaa ei loydy.`);
  return null;
}

/***********************************************************************************************************************************************/

/* Funktio, joka luo sellaisen id:n, jota ei viela ole kaytossa kenellakaan joukkueella. */
function createJoukkueId() {

  hardDebug && console.debug(`createJoukkueId().`); 
  // Haetaan joukkueiden idt.
  var joukkueIDt = data.joukkueet.map(x => x.id);
  
  // Etsitaan uniikki id. Kaipa tuo 500000 riittaa ainakin tassa tehtavassa.
  let uniqueID = 0;
  while (joukkueIDt.includes(uniqueID)) {
    uniqueID = Math.round(Math.random() * 500000);
  }
     
  return uniqueID;
}

/***********************************************************************************************************************************************/

/* Funktio, joka luo sellaisen id:n, jota ei viela ole kaytossa millaan kisalla. */
function createKisaId() {

  hardDebug && console.debug(`createKisaId().`); 
  // Haetaan kisojen idt.
  var kisaIDt = data.kisat.map(x => x.id);
  
  let uniqueID = 0;
  while (kisaIDt.includes(uniqueID)) {
    uniqueID = Math.round(Math.random() * 500000);
  }
  return uniqueID;
}

/***********************************************************************************************************************************************/

/* Funktio, joka luo sellaisen id:n, jota ei viela ole kaytossa millaan sarjalla. On vahan copypastemainen meininki,mutta olkoot. */
function createSarjaId() {

  hardDebug && console.debug(`createsarjaid().`); 
  // Haetaan sarjojen idt. 
  var sarjaIDt = getSarjat().map(x => x.id);
  
  let uniqueID = 0;
  while (sarjaIDt.includes(uniqueID) || tallentamattomatSarjaIdt.includes(uniqueID)) {
    uniqueID = Math.round(Math.random() * 500000);
  }

  tallentamattomatSarjaIdt.push(uniqueID);
  return uniqueID;
}

/***********************************************************************************************************************************************/

// Hakee kaikki sarjat. TODO: halutaanko tata todellakin. Pitaisiko hakea vain joukkueen kilpailun sarjat?
function getSarjat() {
  hardDebug && console.debug(`getSarjat().`); 
  var sarjat = [];
  for (let x of data.kisat) {
    for (let y of x.sarjat) {
      sarjat.push(y);  
    }
  }
  return sarjat;
}

/***********************************************************************************************************************************************/

// Tallennetaan @joukkue data-tietorakenteeseen. Palauttaa true, jos tallennus onnistui. Muutoin palauttaa falsen, jos samanniminen joukkue oli siella jo entuudestaan, 
// eika joukkuetta tallenneta.
function setJoukkue(joukkue) {
  hardDebug && console.debug(`setJoukkue(${joukkue}).`); 
  for (let x of data.joukkueet) {
    if (x.nimi.trim() === joukkue.nimi) {
      return false;
     }
   }
   data.joukkueet.push(joukkue);
   return true;
}

/***********************************************************************************************************************************************/

// Poistaa annetulta htmlElementilta kaikki lapset.
function clearAllChildren(htmlElement) {
  hardDebug && console.debug(`clearAllChildren(${htmlElement}).`); 
  while (htmlElement.lastChild) htmlElement.removeChild(htmlElement.lastChild);
}

/***********************************************************************************************************************************************/
/*
 * Varsinaiset funktiot.
 *
 ***********************************************************************************************************************************************/


// Asetetaan Lisaa joukkue lomakkeeseen Luontiaikaan tarkistus. Nyt on mielestani perusteltua tehda osa tarkistuksista javascriptilla, silla 
// ajan tulee olla muotoa pp.kk.vvvv hh:mm eika dd-mm-yyyyThh:mm kuten datetime-local olettaa. Taytyy tehda konversioita ym. ValidityState 
// toimii nyt ainoastaan ajan muodon tarkistuksessa.
function addEventsToAikavalue() {
  hardDebug && console.debug(`addEventsToAikavalue().`); 
  var aika = document.getElementById("luontiaika");
  aika.addEventListener('input', e => {
    var aikaValue = e.target;

    // Jos on totaalisen tyhja.
    if (aikaValue.validity.valueMissing === true) {
      aikaValue.setCustomValidity("Sinun taytyy antaa validi aika.");
      return;
    }

    // Jos annettu aika on vaaraa muotoa.
    else if (aikaValue.validity.patternMismatch === true) {
      aikaValue.setCustomValidity("Ajan täytyy olla muotoa pp.kk.vvvv hh:mm");
      return;
    }

    // Muutetaan aika dateksi ja vertaillaan sitten max arvoon. Tehdaan tarkistus nyt nain, silla meilla on kustomoitu muoto pp.kk.vvvv hh:mm
    // rangeOverflow ei toimi ainakan ilman kikkailuja luulisin.
    let date = parsiAikaCustomMuodosta(aikaValue.value); 

    // Tehdään tamakin nyt näin ilman ValidityStatea edellamainitun perusteella. 
    if (date.toString() === 'Invalid Date') {
      aikaValue.setCustomValidity("Annettu aika ei ole kelvollinen aika.");
      return;
    }

    var parsedMaxTime = new Date(Date.parse(aika.max));
    
    // Tarkistetaan ylittaako aika maksimiarvon.
    if (parsedMaxTime.getTime() < date.getTime()) {
      // Luodaan virheilmoitus.
      var virheIlmoitus = `Ajan täytyy olla pienempi kuin ${convertoiDateToCustomAika(aika.max)}.`;
      aikaValue.setCustomValidity(virheIlmoitus);
      return;
    }
    
    // Kaikki kunnossa.
    aikaValue.setCustomValidity("");
  });
}

/***********************************************************************************************************************************************/

// Paivittaa parametrin @joukkue leimaustavat.
function updateLeimaustavat(joukkue) {
  hardDebug && console.debug(`updateLeimaustavat(${joukkue}).`); 
  var gps = document.getElementById("GPS");
  var nfc = document.getElementById("NFC");
  var qr = document.getElementById("QR");
  var leimaLomake = document.getElementById("leimaustapaLomake");
  
  // HUOM! setAttribute laittaa html elementeille default-arvon. Kayta mieluummin htmlelement.attribute = ...;
  gps.checked = false;
  nfc.checked = false;
  qr.checked = false;
  leimaLomake.checked = false;
  
 for (let x of joukkue.leimaustapa) {
   switch (x) {
     case gps.name: gps.checked= true; break;
     case nfc.name: nfc.checked= true; break;
     case qr.name: qr.checked = true; break;
     case leimaLomake.name: leimaLomake.checked=true; break;
   }
 }
}

/***********************************************************************************************************************************************/

function updateJoukkueNimiAika(joukkue) {
  hardDebug && console.debug(`updateJoukkueNimiAika(${joukkue}).`); 
  var nimi = document.getElementById('joukkueNimi');
  var aika = document.getElementById('luontiaika');
  nimi.value = joukkue.nimi;
//  var expr = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):\d{2}\.[0-9]+/g;
  // pitais laittaa nama expression jutut omiin funktiotin. TODO: tee niin jos jaa aikaa.
  var expr = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}).*/g;
  var ajat = expr.exec(joukkue.luontiaika);
  // TODO: oikea muoto!
  if (ajat !== null) aika.value = `${ajat[3]}.${ajat[2]}.${ajat[1]} ${ajat[4]}:${ajat[5]}`; 
  else aika.value = "";/* console.error(`updateJoukkueNimiAika(joukkue): ajat === null`); */
  // Poistetaan kylman viileesti sekunnit ja tuhannesosasekkunnit pyoristamatta mihinkaan suuntaan.
  // Tassa haviaa hieman informaatiota, mutta nyt ollaan uskollisia Luontiaika kentan
  // muotoon vvvv-kk-pp hh:mm. Tassa ehka kannattaisi laittaa joukkueen oikea aika 
  // talteen johonkin toiseen propertyyn, mutta olkoon nyt nain taman kerran.
}

/***********************************************************************************************************************************************/

// Functio, joka luo virheentarkistustapahtumat leimaustapacheckboxeihin.
function addEventsToLeimaustapa() {
  hardDebug && console.debug(`addEventsToLeimaustapa().`); 
  // Haetaan leimaustapainputit.
  var leimaustapaInputit = document.querySelectorAll("#leimaustavat input"); 

  // Lisataan kuhunkin leimaustapa input/checkbox:iin kuuntelija.
  // Jos ko. leimaustapa on checkattu, niin lisataan sen arvo globaaliin leimaustapaSet muuttujaan.
  // Muussa tapauksessa poistetaan ko. arvo leimaustapaSetista.
  for (let x of leimaustapaInputit) {
    x.addEventListener('change', e => {
      if (x.checked === true) {
        leimaustapaSet.add(x.name);
      }
      else {
        leimaustapaSet.delete(x.name);
      }

      // Asetetaan virheilmoitus, jos yhtaan checkboxia ei ole tapatty. Muussa tapauksessa poistetaan virheilmoitukset.
      for (let y of leimaustapaInputit) {
        if (leimaustapaSet.size === 0) { 
          y.setCustomValidity("Vahintaan yksi leimaustapa taytyy valita.");
	}
	else { 
          y.setCustomValidity("");
	}
      }
     });
   }
}

/***********************************************************************************************************************************************/

// Funktio, joka suorittaa input ja change tapahtumat kaikille Lisaa joukkue formin inputeille.
function fireJoukkueTapahtumat() {
  hardDebug && console.debug(`fireJoukkueTapahtumat().`); 

  var joukkueLomake = document.getElementById("joukkueLomake");

  var inputit = document.getElementById("joukkueLomake").getElementsByTagName("input");
  // Laukaistaan joukkue-lomakkeen inputtien 'input' ja 'change' tapahtumat, jotta saadaan mahdolliset virheet esille.
  var iEvent = new Event('input');
  var cEvent = new Event('change');

  // Laukaistaan kaikkie muiden tapahtumat paitsi rastileimauksen viimeisia inputteja, silla muuten luodaan 
  // loputtomasti uusia rastileimauksia.
  for (let x of inputit) { if (x.class !== 'viimeinenInput') { x.dispatchEvent(iEvent); x.dispatchEvent(cEvent);}} 
}

/***********************************************************************************************************************************************/

// Funktio, joka suorittaa input ja change tapahtumat kaikille Lisaa kisa formin inputeille.
// Vahan copypaste meinikia taas, mutta alkaa olla jo kohta tunnit taynna tata demoa.
function fireKisaTapahtumat() {
  hardDebug && console.debug(`fireKisaTapahtumat().`); 

  var joukkueLomake = document.getElementById("kisaLomake");

  var inputit = document.getElementById("kisaLomake").getElementsByTagName("input");

  var iEvent = new Event('input');
  var cEvent = new Event('change');
  for (let x of inputit) { x.dispatchEvent(iEvent); x.dispatchEvent(cEvent); }

}
/***********************************************************************************************************************************************/

// Funktio, joka luo joukkue formin Tallenna nappiin tapahtumat.
function addEventsToJoukkueButton() {
  hardDebug && console.debug(`addEventsToJoukkueButton().`); 
  var tallennaButton = document.getElementById("tallennaJoukkueButton");
  tallennaButton.addEventListener('click', e => {
    e.preventDefault();
    var joukkueLomake = document.getElementById("joukkueLomake");
    
    fireJoukkueTapahtumat();

    // Tarkistetaan tuliko virheita. jos tuli, niin poistutaan.
    if (joukkueLomake.reportValidity() === false) {
      return;
    }
    // Tallennetaan joukkue ja paivitetaan listaukset.
    else {
      tallennaJoukkue();  
      updateJoukkueLomake(createNewJoukkue());
      luoRastileimaukset(globalJoukkue); 
    }
  });
}

/***********************************************************************************************************************************************/

// Funktio, joka paivittaa joukkuelomaketiedot ja globaalit muuttujat @joukkue perusteella.
function updateJoukkueLomake(joukkue) {
  hardDebug && console.debug(`updateJoukkueLomake(${joukkue}).`); 
  globalJoukkue = joukkue;
  globalSarja = joukkue.sarja;
  globalKisa = getKisa(joukkue.sarja); // onko tarpeen?
  updateJasenKentat(globalJoukkue);
  updateSarjat(globalJoukkue);
  updateLeimaustavat(globalJoukkue);
  updateJoukkueNimiAika(globalJoukkue); 
  updateKisat();
}

/***********************************************************************************************************************************************/

// Tallentaa joukkueen lomakkeen tietojen ja globaalien muuttujien perusteella dataan. 
function tallennaJoukkue() {
  hardDebug && console.debug(`tallennaJoukkue().`); 
  globalJoukkue.nimi = document.getElementById("joukkueNimi").value.trim();
  globalJoukkue.jasenet = jasenet.filter(b => b.trim().length > 0).map(x => x.trim());

  // Muutetaan luontiaika oikeaan muotoon ja laitetaan joukkueelle luontiajaksi.
  globalJoukkue.luontiaika = convertoiCustomAikaToDate(document.getElementById("luontiaika").value); 
  globalJoukkue.leimaustapa = Array.from(leimaustapaSet);
  var sarjat = document.querySelectorAll("#sarja input");
  var sarja = undefined;
  for (let x of sarjat) {
    if (x.checked === true) { sarja = x.value; break; }
  }
  if (sarja === undefined) console.error(`tallennaJoukkue(): sarjaa ei voitu maariteltya.`);
  globalJoukkue.sarja = getSarjaByKisa(globalKisa.id, sarja).id; 

  debug && console.debug("Tallennetaan joukkuetta");
  debug && console.debug(globalJoukkue);

  // Luodaan rastit.
  var rastit = [];
  var leimausTrt = document.querySelectorAll('#rastileimausTable tr');
  for (let i=1; i<leimausTrt.length - 1; i++) {
    var koodi = leimausTrt[i].childNodes[0].childNodes[0];  
    var aika = leimausTrt[i].childNodes[1].childNodes[0];  
    var poista = leimausTrt[i].childNodes[2].childNodes[0];  
    if (poista.checked === true) {
      continue;
    }
    var rastiId = data.rastit.find(b => b.koodi.toString() === koodi.value.trim());
    if (rastiId === null || rastiId === undefined) console.error("tallennaJoukkue(): rastiId === null||undefined.");
    rastit.push({aika: convertoiPisteMuotoToViiva(aika.value), id: rastiId.id}); // TODO
  }
  globalJoukkue.rastit = rastit;
  var tableInputit = document.querySelector('#rastileimausTable td');
  var table = document.querySelector('#rastileimausTable');

  // Tarkistetaan loytyyko joukkue jo datasta. Jos ei loydy, niin lisataan se sinne. Muussa tapauksessa kyseessa oli jo olemassa 
  // olevan joukkueen muokkaus.
  var joukkueet = getJoukkueet();
  if (joukkueet.find(x => x === globalJoukkue)) {
    debug && console.log(`Muokataan jo olemassa olevaa joukkuetta.`);
  }
  else {
    debug && console.log(`Lisataan data.joukkueet rakenteeseen uusi joukkue.`);
    data.joukkueet.push(globalJoukkue);
  }
  listaaJoukkueet();
}

/***********************************************************************************************************************************************/

// Funktio, joka luo virheentarkistutapahtumat joukkuenimi-kentalle. Kahta samannimista joukkuetta ei saa olla. 
// On pakko toteuttaa javascriptilla. Jos talla hetkella kasiteltava joukue-olio loytyy datasta, niin silloin sallitaan 
// samanniminen joukkue, silla nyt ollaan muokkaamassa jo olemassaolevaa joukkuetta.
function addEventsToJoukkueNimi() {
  hardDebug && console.debug(`addEventsToJoukkueNimi().`); 
  var joukkueNimiInput = document.getElementById("joukkueNimi");
  joukkueNimiInput.addEventListener('input', e => {
    var target = e.target;

    // Jos ei ole mitaan kirjoitettu.
    if (target.validity.patternMismatch === true) {
      target.setCustomValidity("Joukkueen nimi ei voi olla tyhjä.");
      return;
    }

    // Jos on totaalisen tyhja.
    else if (target.validity.valueMissing === true) {
      target.setCustomValidity("Joukkueen nimi ei voi olla tyhjä.");
      return;
    }
    else if (getJoukkue(target.value.trim()) !== null) {
      // Yritetaan ottaa uudelle joukkueelle sellainen nimi, joka on jo jollakin toisella joukkueella.
      if (getJoukkue(globalJoukkue.nimi) === null) 
        target.setCustomValidity("Et voi valita tätä nimeä, sillä se nimi on jo varattu toiselle joukkueelle.");
    }
    else 
      target.setCustomValidity("");
  });
}

/***********************************************************************************************************************************************/

// Paivittaa joukkueen sarjavaihtoehdot.
function updateSarjat(joukkue) {
  hardDebug && console.debug(`updateSarjat(${joukkue}).`); 
  var sarjaDiv = document.getElementById("sarja");
  var sarjaVaihtoehdot = sarjaDiv.getElementsByTagName("p"); 
  clearAllChildren(sarjaDiv);
  
  // Haetaan kisa, joukkueen sarja seka kisan kaikki sarjat.
  var kisa = getKisa(joukkue.sarja);
  var sarja = getSarja(joukkue.sarja);
  var sarjat = kisa.sarjat;
  sarjat = sarjat.sort((x,y) => x.nimi.localeCompare(y.nimi));

  // Luodaan radiobuttonit.
  for (let x of sarjat) {
    var s = x; 
    var p = document.createElement("p");
    var input = document.createElement("input");
    var label = document.createElement("label");

    input.setAttribute("type","radio");
    input.setAttribute("id",s.nimi);
    input.setAttribute("name","SARJA");
    input.setAttribute("value",s.nimi);

    label.textContent = s.nimi;
    label.setAttribute("for",s.nimi);

    p.appendChild(label);
    p.appendChild(input);
    
    sarjaDiv.appendChild(p);
    
    // Tapataan joukkueen sarja.
    if (x.id === sarja.id) { input.setAttribute('checked', true);}
  }
}

/***********************************************************************************************************************************************/

// Asettaa jasen-kentalle click tapahtuman. Eli paivitetaan globaalia jasenet kenttaa seka tarkistetaan virheet. Lisaksi lisataan 
// dynaamisesti lisaa kenttia, jos tila loppuu kesken.
function setEventsTojasenKentta(input) {
  hardDebug && console.debug(`setEventsTojasenKentta(${input}).`); 
  input.addEventListener('input',e => {
    var target = e.target; 
    // Kaivetaan jasenen positio ottamalla sen id: esim. jasen3 ja poistamalla siita merkkijono 'jasen'. Vahan kehno ratkaisu, mutta toimii tassa.
    var index = Number.parseInt(target.id.replace(/jasen/gi,''));
    // Paivitetaan jasenen nimi sille varatulle paikalle.
    jasenet[index] = target.value;

    // Jasen kentat kaikki kaytetty. Paivitetaan jasenet globalJoukkueeseen ja paivitetaan jasen-kentat.
    if (jasenet.every(x => x.trim().length > 0)) { globalJoukkue.jasenet = jasenet.slice(); updateJasenKentat(globalJoukkue);}   

    // Jos ei-tyhia jasenien nimia on alla 2 niin valitetaan.
    if (jasenet.filter(x => x.trim().length > 0).length < 2) {
      target.setCustomValidity("Täytyy olla vähintään 2 jäsentä.");
    }
    else 
      target.setCustomValidity("");
  });
}

/***********************************************************************************************************************************************/

// Funktio, joka luo jasen-kentat jasen olion perusteella. @joukkue taytyy olla joukkue-olio. 
function updateJasenKentat(joukkue) {
    
  hardDebug && console.debug(`updateJasenKentat(${joukkue}).`); 
  // Asetetaan nyt muokattava joukkue globaaliin muuttujaan. Pisto sydamessa kun nain tehdaan....
  globalJoukkue = joukkue;

  var jasenFieldset = document.querySelector(".jasenet");
  var jasenLegend = document.querySelector(".jasenet legend");

  // Tyhjennetaan lapset.
  clearAllChildren(jasenFieldset); 

  // Jasen kenttien lukumaara. Vahintaan 5.
  var fieldLkm = Math.max(5, joukkue.jasenet.length+1);  

  // Tyhjennetaan edelliset nimet.
  jasenet.splice(0,jasenet.length);

  // Lisataan jasenet globaaliin muuttujaan jasenet.
  for (let i=0; i<fieldLkm; i++) jasenet.push(""); 
  for (let i=0; i<joukkue.jasenet.length; i++) {
    jasenet[i] = joukkue.jasenet[i];
  }
   
  // Luodaan kentat.
  for (let x=0 ; x<fieldLkm ; x++) {
    var p = document.createElement("p");
    var input = document.createElement("input");
    var label = document.createElement("label");

    var id = `jasen${x}`;
    
    input.setAttribute("type","text");
    input.setAttribute("value",jasenet[x]);
    input.setAttribute("id",id);
    input.setAttribute("size",35);
    setEventsTojasenKentta(input);

    label.textContent = `Jasen ${x+1}`;
    label.setAttribute("for",id);

    p.appendChild(label);
    p.appendChild(input);
    jasenFieldset.appendChild(p);
  }

  jasenFieldset.insertBefore(jasenLegend,jasenFieldset.children[0]);
}

/***********************************************************************************************************************************************/

// Luo joukkueita varten listaukset ja paivittaa listan.
function listaaJoukkueet() {
  hardDebug && console.debug(`listaaJoukkueet().`); 
  var joukkueetDiv = document.getElementById("joukkueetDiv");
  clearAllChildren(joukkueetDiv);
  var header = document.createElement("p");
  header.textContent = "Joukkueet";
  header.setAttribute("class", "joukkueetHeader");
  joukkueetDiv.appendChild(header);
  joukkueetDiv.appendChild(luoJoukkueetListaus());
}

/***********************************************************************************************************************************************/

// Paivittaa kisatAlasvetovalikon. 
function updateKisat() {
  hardDebug && console.debug(`updateKisat().`); 
  var kisat = getKisat();
  var select = document.getElementById('kisaSelect');
  //var nykyisetSarjaValinnat = document.querySelectorAll('#sarja p input');
  clearAllChildren(select); 
  var nykyinenKisa = getKisa(globalSarja); 
  for (let x of kisat) {
    var option = document.createElement('option'); 
    option.value = `${x.nimi}`;
    option.textContent = `${x.nimi}`;
    if (nykyinenKisa.nimi.trim() === x.nimi.trim()) { option.selected = true;}
    select.appendChild(option);
  }
}

/***********************************************************************************************************************************************/

// Asettaa kisanvalinta selectille tapahtuman. Kun kisaa vaihtaa, niin samalla globalKisa muuttuu valitun kisan mukaiseksi.
// Tama on tarkeaa, silla kun joukkuetta tallennetaan, niin talloin sarja tallennetaan sen mukaan, mika kisa on valittu.
function addEventsToKisaSelect() {
  var select = document.getElementById('kisaSelect');
  select.addEventListener('change', e => {
    var target = e.target;
    for (let x of target.childNodes) {
      if (x.selected === true) {
        // Paivitetaan globalKisa.
        globalKisa = getKisa(x.value);
	break;
      }
    }
  });
}

/***********************************************************************************************************************************************/

// Functio, joka luo joukkueista listan htmlRakenteeltaan <ul> <li>joukkue1</li> <li>joukkue2</<li> ... </ul> ja palauttaa luodun htmlelementin.
// Joukkuelistaus aakkosjarjestyksen mukaisesti. Lisaksi asetetaan kuhunkin joukkueeseen click tapahtuma.
function luoJoukkueetListaus() {
  hardDebug && console.debug(`luoJoukkueetListaus().`); 
  var joukkueet = getJoukkueet().sort((x,y) => x.nimi.localeCompare(y.nimi));
  var ul = document.createElement("ul");
  for (let x of joukkueet) {
    var li = document.createElement("li");
    var p = document.createElement("p");
    var a = document.createElement("a");
    p.appendChild(a);
    li.appendChild(p);
    a.textContent=x.nimi;
    a.href = "#joukkueLomake";
    a.addEventListener('click', e => {
      var joukkueNimi = e.target.childNodes[0].data;
      var joukkue = getJoukkue(joukkueNimi);
      luoRastileimaukset(joukkue);
      updateJoukkueLomake(joukkue);
    });
    ul.appendChild(li);
  }
  return ul;
}

/***********************************************************************************************************************************************/

// Kaytannossa tyhjentaa kisalomakkeen.
function updateKisaLomake() {
  hardDebug && console.debug(`updateKisaLomake().`); 
  document.querySelector("#kisaLomake").setAttribute("novalidate","novalidate");
  var kisalomakeInputit = document.querySelectorAll(".kisalomakeTiedot input");   
  for (let x of kisalomakeInputit) {
    x.value = "";
  }
}

/***********************************************************************************************************************************************/

// Luodaan kisalomakkeelle tarkistus tapahtumat seka tallenna nappulan toiminta.
function addEventsToKisaLomake() {

  hardDebug && console.debug(`addEventsToKisaLomake().`); 
  // Asetetaan aika-inputeille tarkistukset.
  var alkuaika = document.getElementById("alkuaika");
  var loppuaika = document.getElementById("loppuaika");

  // Input callback funktio aika-inputeille.
  var aikaEvent = function(e) {
    var aikaValue = e.target;

    // Jos on totaalisen tyhja.
    if (aikaValue.validity.valueMissing === true) {
      aikaValue.setCustomValidity("Sinun taytyy antaa validi aika.");
      return;
    }

    // Jos annettu aika on vaaraa muotoa.
    else if (aikaValue.validity.patternMismatch === true) {
      aikaValue.setCustomValidity("Ajan täytyy olla muotoa pp.kk.vvvv hh:mm");
      return;
    }

    // Tamanhetkinen aika datena.
    let date = parsiAikaCustomMuodosta(aikaValue.value); 
 
    if (date.toString() === 'Invalid Date') {
      aikaValue.setCustomValidity("Annettu aika ei ole kelvollinen aika.");
      return;
    }

    // Jos nyt kasitellaan alkuaikaa, niin tsekataan sen maksimi. 
    if (aikaValue.id === alkuaika.id) {
      var parsedMaxTime = new Date(Date.parse(aikaValue.max));
      
      // Tarkistetaan ylittaako aika maksimiarvon.
      if (parsedMaxTime.getTime() < date.getTime()) {
        // Luodaan virheilmoitus.
        var virheIlmoitus = `Ajan täytyy olla pienempi kuin ${convertoiDateToCustomAika(parsedMaxTime.toISOString())}.`;
        aikaValue.setCustomValidity(virheIlmoitus);
        return;
      }
    }
    // Jos taas kasitellaan loppuaikaa, niin tarkistetaan, ettei se ole pienemki kuin alkuajan maximi.
    // jos kaikki on hyvin, niin paivitetaan alkuajan maksimi loppuajaksi.
    if (aikaValue.id === loppuaika.id) {
  
      let alkuaikadate = parsiAikaCustomMuodosta(alkuaika.value); 
      var kisaKesto = document.getElementById("kesto");
      var kisaKestoValue = parseInt(kisaKesto.value.trim(),10);
      // Tarkistetaan alittaako aika alkuajan minimin.
      if (alkuaikadate.getTime() > date.getTime()) {
        // Luodaan virheilmoitus.
        var virheIlmoitus = `Ajan täytyy olla suurempi kuin ${alkuaika.value}.`;
        aikaValue.setCustomValidity(virheIlmoitus);
        return;
      }
      // Loppuajan on oltava suurempi kuin alkuaika + kesto.
      else if (!isNaN(kisaKestoValue) && alkuaikadate.getTime() + 1000*60*60*kisaKestoValue > date.getTime()) {
        aikaValue.setCustomValidity(`Loppuaika taytyy oltava suurempi kuin alkuaika + kesto.`);
	return;
      }
      else alkuaika.max = date.toUTCString(); 
    }
    
    // Kaikki kunnossa.
    aikaValue.setCustomValidity("");
  };

  alkuaika.addEventListener('input', aikaEvent);
  loppuaika.addEventListener('input', aikaEvent);

  // Asetetaan kisan nimi eventit.
  var kisaNimi = document.getElementById("kisaNimi");
  kisaNimi.addEventListener('input', e => {
    var target = e.target; 

    // Jos ei ole mitaan kirjoitettu.
    if (target.validity.patternMismatch === true) {
      target.setCustomValidity("Kisan nimi ei voi olla tyhjä.");
      return;
    }

    // Jos on totaalisen tyhja.
    else if (target.validity.valueMissing === true) {
      target.setCustomValidity("Kisan nimi ei voi olla tyhjä.");
      return;
    }
    // Yritetaan ottaa uudelle joukkueelle sellainen nimi, joka on jo jollakin toisella joukkueella.
    for (let x of getKisat()) {
      if (x.nimi === kisaNimi.value.trim()) {
        target.setCustomValidity("Et voi valita tätä nimeä, sillä se nimi on jo varattu toiselle kisalle.");
        return;
      }
    }
    target.setCustomValidity("");
  });

  // Asetetaan kesto-kenttaan input-event.
  var kesto = document.getElementById("kesto");
  kesto.addEventListener('input', e => {
    var target = e.target;

    // Jos on totaalisen tyhja.
    if (target.validity.valueMissing === true) {
      target.setCustomValidity("kesto ei saa olla tyhjä.");
      return;
    }
    var value = target.value.trim();
    if (value.length === 0) {
      target.setCustomValidity("kesto ei saa olla tyhjä.");
      return;
    }
    // Jos annettu kesto on vaaraa muotoa.
    if (target.validity.patternMismatch === true) {
      target.setCustomValidity("Kesto taytyy olla positiivinen kokokaisluku.");
      return;
    }
    // Arvon on oltava yli 1.
    if (parseInt(value) < 1) {
      target.setCustomValidity("Matkan pituus taytyy olla vähintään 1.");
      return;
    }
    target.setCustomValidity("");
  });

  // Asetetaan Tallenna nappulan tapahtuma.
  var tButton = document.getElementById("tallennaKisaButton");
    tButton.addEventListener('click', e => {
      e.preventDefault();
      var kisaLomake = document.getElementById("kisaLomake");
  
      fireKisaTapahtumat();
  
      // Tarkistetaan tuliko virheita. jos tuli, niin poistutaan.
      if (kisaLomake.reportValidity() === false) {
        return;
      }
      // Tallennetaan joukkue ja paivitetaan listaukset.
      else {
        tallennaKisa();  
        updateKisat();
      }
  });
}

/***********************************************************************************************************************************************/

// Tallentaa uuden kisan ja tyhjentaa kisalomakkeen.
function tallennaKisa() {
  hardDebug && console.debug(`tallennaKisa().`); 

  // Haetaan kentat.
  var kisaNimi = document.getElementById("kisaNimi");
  var kesto = document.getElementById("kesto");
  var alkuaika = document.getElementById("alkuaika");
  var loppuaika = document.getElementById("loppuaika");
  
  var uusiKisa = createNewKisa();
  uusiKisa.alkuaika = convertoiCustomAikaToDate(alkuaika.value.trim());
  uusiKisa.loppuaika = convertoiCustomAikaToDate(loppuaika.value.trim());
  uusiKisa.kesto = kesto.value.trim();
  uusiKisa.nimi = kisaNimi.value.trim();

  data.kisat.push(uusiKisa);

  // Tama taytyy tehda pushin jalkeen.
  uusiKisa.sarjat = createSarjat(uusiKisa.id);

  // Tyhjennetaan kentat.
  kisaNimi.value = "";
  kesto.value = "";
  alkuaika.value = "";
  loppuaika.value = "";

  // Asetetaan sarjojen kisaId:ksi nyt luotavan kisan id.
//  for (let x of uusiKisa.sarjat) {
//    x.kisa = uusiKisa.id;
//  }

  // Paivitetaan sarjojen alku- ja loppuajat.
  aikaLeimaaSarjat();
}

/***********************************************************************************************************************************************/

// Functio, joka palauttaa kaikki kunnolliset koodit settina. (kunnollinen koodi alkaa numerolla!). Olisi voinnut tehda tarkempikin tarkistus, mutta toimii nyt.
function getAllKoodit() {
  var koodit = new Set();
  for (let x of data.rastit) {
    if (!x.koodi.match(/^\d/)) continue; 
    else koodit.add(x.koodi);
  }
  return koodit;
}

/***********************************************************************************************************************************************/

// Palauttaa kaikki valittavana olevat koodit.
function getVapaatKoodit() {
  hardDebug && console.debug(`getVapaatKoodit().`); 
  var rastiLeimausInputit = document.querySelectorAll('#rastileimaukset input');

  // Haetaan kaikki mahdolliset koodit.
  var kaikkiKoodit = getAllKoodit();

  // Poistetaan nyt kaytossa olevat.
  for (let x of rastiLeimausInputit) {
    kaikkiKoodit.delete(x.value);
  }

  return kaikkiKoodit;
}

/***********************************************************************************************************************************************/

function getKaytetytKoodit() {
  hardDebug && console.debug(`getKaytetytKoodit().`); 
  var all = getAllKoodit();
  var vapaat = getVapaatKoodit();
  for (let x of vapaat) {
    all.delete(x);
  }
  return all;
}

/***********************************************************************************************************************************************/

// Funktio, joka laskee kuinka monta kertaa annettu merkkijono esiintyy rasti-inputeissa. 
function isUniqueKoodi(str) {
  var rastiLeimausInputit = document.querySelectorAll('#rastileimaukset input');
  var lkm = Array.prototype.slice.call(rastiLeimausInputit).filter(x => x.value.trim() === str.trim()).length; 
  if (lkm === 1) return true;
  else return false;
}

/***********************************************************************************************************************************************/

function paivitaDatalist() {
  hardDebug && console.debug(`paivitaDatalist().`); 
  var kaikkiKoodit = getVapaatKoodit();
  var datalist = document.getElementById('koodit');

  // Puhdistetaan datalist ja laitetaan sinne vain sellaiset koodit jotka eivat ole kaytossa.
  clearAllChildren(datalist);
/*
  var select = document.querySelector('#koodit select');
  if (select === null) {
    select = document.createElement('select');
    datalist.appendChild(select);
  }
*/

  for (let x of kaikkiKoodit) {
    var opt = document.createElement('option');
    opt.value = x;
    opt.textContent = x;
    datalist.appendChild(opt);
  }
}

/***********************************************************************************************************************************************/

// Functio, joka luo yhden rastileimausrivin. Hubbabubba paukkuu taas ja komeasti.
function luoRastileimausTr(rasti,empty) {
    var tr = document.createElement('tr');
    // Luodaan koodi-kentta.
    var tdKoodi = document.createElement('td');
    var tdAika = document.createElement('td');
    var tdPoista = document.createElement('td');
    tr.appendChild(tdKoodi);
    tr.appendChild(tdAika);
    tr.appendChild(tdPoista);

    var input = document.createElement('input');
    input.type = "text";
    input.setAttribute("list", "koodit");
    input.class = 'koodiInput';
    if (empty === true) { input.value = ""; input.class = 'viimeinenInput'; }
    else input.value = rasti.dataRasti.koodi;
    tdKoodi.appendChild(input);
 
    // Luodaan aika-kentta.
    var aikaInput = document.createElement('input'); 
    aikaInput.type = 'text'; // TODO: muutettu
    aikaInput.placeholder = 'pp.kk.vvvv --:--:--';
    aikaInput.class = 'aikaInput';
    var sarja = getSarja(globalSarja);
    aikaInput.min = sarja.alkuaika.trim().replace(/ /gi, 'T');
    aikaInput.max = sarja.loppuaika.trim().replace(/ /gi, 'T');

    // Ei ole viimeinen inputti rivi.
    if (empty === false) {
      aikaInput.requred = 'required';
      aikaInput.value = convertoiViivaMuotoToPisteMuodo(rasti.joukkueRasti.aika); // TODO: 
      aikaInput.pattern='^[0-9]{2}\.[0-9]{2}\.[0-9]{4} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$'; // TODO: muutettu
    }
    else aikaInput.class = 'viimeinenInput';

    tdAika.appendChild(aikaInput);

    // Luodaan poistanappi
    var poistaInput = document.createElement('input'); 
    poistaInput.type = 'checkbox';
    poistaInput.class = 'poistaCheckbox'; // TURHA?
    if (empty === true) { input.value = ""; poistaInput.class = 'viimeinenInput'; }

    tdPoista.appendChild(poistaInput);

    // Luodaan eri tapahtumat viimeiselle ja ei-viimeisille.
    if (empty === false) {
      addEventsToRastileimaus(input,aikaInput,poistaInput);
    }
    else addEventsToRastileimausEmpty(input, aikaInput,poistaInput);
    return tr;
}

/***********************************************************************************************************************************************/

function luoRastileimaukset(joukkue) {
  hardDebug && console.debug(`luoRastileimaukset(${joukkue}.`); 
  var joukkueTallennettu = false;

  // Tarkistetaan onko joukkue jo tallennettu.
  if (getJoukkue(joukkue.id) !== null) joukkueTallennettu = true;

  // if (joukkueTallennettu === true) globalJoukkueenRastit = getRastit(joukkue.id); 
  var table = document.getElementById("rastileimausTable");
  clearAllChildren(table);

  // Luodaan otsikot.
  var headers = document.createElement('tr');
  var headerRasti = document.createElement('th');
  var headerAika = document.createElement('th');
  var headerPoista = document.createElement('th');

  headerRasti.textContent = "Rasti";
  headerAika.textContent = "Aika";
  headerPoista.textContent = "Poista";
  
  headers.appendChild(headerRasti);
  headers.appendChild(headerAika);
  headers.appendChild(headerPoista);

  table.appendChild(headers);

  // Luodaan datalist.
  if (document.getElementById('koodit') === null) {
    var datalist = document.createElement('datalist');
    datalist.id = "koodit";
    datalist.class = "datalist";
    document.getElementById('rastileimaukset').appendChild(datalist);
  }

  // Paivitetaan datalist.
  paivitaDatalist();

  // Jos joukkue ei ole tallennettu, niin luodaan yksi tyhja rastileimaus. 
  if (joukkueTallennettu === false) {
     table.appendChild(luoRastileimausTr(null,true));
     return;
  }

  // Luodaan rastit.
  var rastit = getRastit(joukkue.id);

  // Luodaan rastileimauksia n+1 kappaletta, missa on rastileimausten lkm.
  for (let i=0; i<rastit.length+1 ; i++) {
    
     var rastiTr = undefined;
     if (i === rastit.length) rastiTr = luoRastileimausTr(null,true); 
     else rastiTr = luoRastileimausTr(rastit[i],false); 
     table.appendChild(rastiTr);
  }


}

/***********************************************************************************************************************************************/

function addEventsToRastileimaus(koodiInput, aikaInput, poistaCheckBox) {
  hardDebug && console.debug(`addEventsToRastileimaus(${koodiInput},${aikaInput},${poistaCheckBox}).`); 

    koodiInput.addEventListener('input', e => {
      paivitaDatalist();
      var target = e.target;
      var all = getAllKoodit();
      var value = target.value.trim();
      if (!all.has(value)){
        target.setCustomValidity("Koodi ei ole kaytossa. Valitse sellainen koodi, joka on valittavana.");
	return;
      }
      if (!isUniqueKoodi(value)){
        target.setCustomValidity("Antamasi koodia ei saa esiintyä kahdessa tai useammassa kohdassa.");
	return;
      }
      target.setCustomValidity("");
    });

    aikaInput.addEventListener('input', e => {
      
      var aikaValue = e.target;
  
      // Jos on totaalisen tyhja.
      if (aikaValue.validity.valueMissing === true) {
        aikaValue.setCustomValidity("Sinun taytyy antaa validi aika.");
        return;
      }
  
      // Jos annettu aika on vaaraa muotoa.
      else if (aikaValue.validity.patternMismatch === true) {
        aikaValue.setCustomValidity("Ajan täytyy olla muotoa pp.kk.vvvv hh:mm(:ss)");
        return;
      }
      let date = parsiAikaCustomMuodosta(aikaValue.value); 
  
      if (date.toString() === 'Invalid Date') {
        aikaValue.setCustomValidity("Annettu aika ei ole kelvollinen aika.");
        return;
      }
  
      var parsedMaxTime = new Date(Date.parse(aikaValue.max));
      var parsedMinTime = new Date(Date.parse(aikaValue.min));
      
      // Tarkistetaan ylittaako aika maksimiarvon.
      if (parsedMaxTime.getTime() < date.getTime()) {
        // Luodaan virheilmoitus.
        var virheIlmoitus = `Ajan täytyy olla pienempi kuin ${convertoiDateToCustomAika(aikaValue.max)}.`;
        aikaValue.setCustomValidity(virheIlmoitus);
        return;
      }
      
      // Tarkistetaan alittaako minimiarvon.
      if (parsedMinTime.getTime() > date.getTime()) {
        // Luodaan virheilmoitus.
        var virheIlmoitus = `Ajan täytyy olla suurempi kuin ${convertoiDateToCustomAika(aikaValue.min)}.`;
        aikaValue.setCustomValidity(virheIlmoitus);
        return;
      }

      // Kaikki kunnossa.
      aikaValue.setCustomValidity("");
      });
}

/***********************************************************************************************************************************************/

// Rastileimaukset viimeisen tyhjan rivin kuuntelija. Kun jotain tehdaan, niin lisataan tahan tarkistuseventit ja luodaan uusi tyhja 
// rastileimausrivi.
function addEventsToRastileimausEmpty(koodiInput, aikaInput, poistaCheckBox) {
  hardDebug && console.debug(`addEventsToRastileimaus(${koodiInput},${aikaInput},${poistaCheckBox}).`); 

  var tapahtuma = e => {
    var target = e.target.parentNode.parentNode;
    var koodi = target.childNodes[0].childNodes[0];  
    var aika = target.childNodes[1].childNodes[0];  
    var poista = target.childNodes[2].childNodes[0];  


    // Kloonataan inputit, jotta paastaan niiden eventlistenereista eroon.
    var koodiClone = koodi.cloneNode();
    var aikaClone = aika.cloneNode();
    var poistaClone = poista.cloneNode();

    koodiClone.class = "";
    aikaClone.class = "";
    poistaClone.class = "";
    // Korvataan vanhat inputit klooneilla.
    koodi.parentNode.replaceChild(koodiClone,koodi);
    aika.parentNode.replaceChild(aikaClone,aika);
    poista.parentNode.replaceChild(poistaClone,poista);


    aikaClone.requred = 'required';
    aikaClone.pattern='^[0-9]{2}\.[0-9]{2}\.[0-9]{4} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$'; // TODO: muutettu

    addEventsToRastileimaus(koodiClone, aikaClone,poistaClone);
    var table = document.getElementById('rastileimausTable');
    var rastiTr = luoRastileimausTr(null,true); 
    table.appendChild(rastiTr);
  };
  koodiInput.addEventListener('input',tapahtuma);
  aikaInput.addEventListener('input',tapahtuma);
  poistaCheckBox.addEventListener('change',tapahtuma);
}
