// data-muuttuja on sama kuin viikkotehtävässä 1.
//

"use strict";


/* Demo 2. Pitaisi olla 5 tasoinen (aina jotain jaa kuitenkin huomaamatta). Hirvea koodi hassakka. Purkkaakin on kaytetty. Taytyy olla myos helpompiakin tapoja koodata javascriptilla 
 * kuin nain, vai onko? Kayttoliittyma on hirvean nakoinen, mutta siihen ei tainnut olla paljon vaatimuksiakaan. Jatkossa lupaan koodata hiukan selveampia javascript ohjelmia. 
 * Rasteja voi lisata, mutta pisteita laskettaessa rastien monikerrat poistetaan, joten joukkueen pisteet muuttuu vasta jos lisataan sellainen rasti, jota ei aikaisemmin ole.
 * Tosin matka voi muuttua, riippuen siita missa leimaus sijaitsee datassa.
 *
 * Bugit joita ei jaksettu enaa korjata:
 *
 * (1) Leimauksia voi lisata myos sellaiselle joukkueelle, jota ei ole tallennetu dataan. Rastileimaus kylla tallentuu. Taman olisi voinnut korjata, mutta 
 *     ehka sitten joskus toiste.
 * */


// Debuggausta varten. Saataneen olla turha.
const DEBUG = true;

// Enum lajittelua varten.
const SortMethod = { SARJA: 0, JOUKKUEET: 1, PISTEET: 2, MATKA: 3, KOKONAISAIKA: 4 }; 

// Globaali muuttuja, joka kertoo sen mika tulosten jarjestely on nyt voimassa. 
// Globaalit muuttujat ovat vaarallisia, mutta olkoon tassa nyt taman kerran. 
// Jatkossa sitten jotain fiksumpaa. Muuttamalla tata muuten kuin koodin kautta aiheuttaa todennakoisesti poikkeuksen jossakin vaiheessa.
var GlobalLajitteluPeruste = [SortMethod.SARJA, SortMethod.JOUKKUEET];

/***********************************************************************************************************************************************/

// Polkaistaan hommat vauhtiin vasta kun sivu on taysin latautunut.
window.onload = function() { createTupaTable();
                             createLisaaRasti();
			     createJoukkueForm();
			     createRastiLeimaukset();};

console.log(data);


/***********************************************************************************************************************************************/

/* Funkctio, joka testaa onko @obj null tai obj. Heittaa poikkeuksen, jos obj on undefined tai null. Lienee turha.*/
function testUN(obj) {
  if (obj === null || obj === null) throw `testUndefinedOrNull(obj): obj === ${obj}`; 
}

/***********************************************************************************************************************************************/

// Funktio, joka palauttaa sarjan joukkueen nimen perusteella tai null, jos joukkuetta ei loydy.
function getSarjaByJoukkueName(joukkueName) {
  for (let sarja of data.sarjat) {
    for (let joukkue of sarja.joukkueet) {
      if (joukkueName === joukkue.nimi) {
        return sarja;
      }
    }
  }
  return null;
}

/***********************************************************************************************************************************************/

/* Funktio, joka tuhoaa @htmlElement lapset. */
function clearChildrens(htmlElement) {
    if (DEBUG === true) {
      testUN(htmlElement);
    }

    while (htmlElement.lastChild) htmlElement.removeChild(htmlElement.lastChild);
}

/***********************************************************************************************************************************************/

/* Funktio, joka etsii joukkueen nimen perusteella, ja palauttaa ensimmaisen joukkueen, jolla on @name nimi.  Muutoin palauttaa undefined.*/
function getJoukkueByName(name) {
  // Haetaan kaikki joukkueet.
  var joukkueet = getJoukkueet(data);
  var joukkue = joukkueet.find(x => x.nimi === name);
  // if (joukkue === undefined) throw `getJoukkueByName: ei loytynyt joukkuetta nimella ${name}`;
  return joukkue;
}

/***********************************************************************************************************************************************/

/* Funktio, joka etsii joukkueen id perusteella, ja palauttaa ensimmaisen joukkueen, jolla on @id id. Muutoin palauttaa undefined.  */
function getJoukkueById(id) {
  // Haetaan kaikki joukkueet.
  var joukkueet = getJoukkueet(data);
  var joukkue = joukkueet.find(x => x.id === id);
  // if (joukkue === undefined) throw `getJoukkueById: ei loytynyt joukkuetta id:lla ${id}`;
  return joukkue;
}

/***********************************************************************************************************************************************/

/* Luo <p><label><input></input></lable></p> muokaisen elementin.
 * @labelText on labelin teksti.
 * @iName on inputin name-attribuutti.
 * @iId on inputin id-attibuutti.
 * @iType on inputin type-attibuutti.
 * @iSize on inputin size-attribuutti.
 * */
function createVt2Input(labelText, iName, iId, iType, iValue, iSize) {
  let p = document.createElement("p");
  let label = document.createElement("label");
  label.textContent = labelText;
  let input = document.createElement("input");
  input.setAttribute("name",iName);
  input.setAttribute("id", iId);
  input.setAttribute("type", iType);
  input.setAttribute("size", iSize);
  input.value = iValue;
  label.appendChild(input);
  p.appendChild(label);
  return p; 
}

/***********************************************************************************************************************************************/

/* Apufunktio, joka lisaa eventListenerin inputiin. Parametrin p taytyy olla muotoa <p><label><input></input></label></p>. 
 * Helpompi olisi ollut vain etsia haluttu elementti selectorilla ja sitten lisata kuuntelija, mutta olkoon nyt nain.
 * Parametri p on elementti, jonka sisalle halutaan asettaa kuuntelija. Kts. esim. createVt2Input funktio.
 * Parametri ev on eventin nimi.
 * Parametri f on eventlisteneriun callbackfunktio funktio.
 * Palauttaa truen jos onnistuu, muutoin tulostaa consoliin virheen ja palauttaa falsen. */
function addListenerP(p, ev, f) {
  
  if (typeof f !== "function") {
    console.error("addListener: f ei ole funktio");
    return false;
  }

  if (typeof ev !== "string") {
    console.error("addListener: ev ei ole string");
    return false;
  }

  if (typeof p !== "object") {
    console.error("addListener: p ei ole object");
    return false;
  }

  // Haetaan input.
  var input = p.firstChild.childNodes[1];
  if (input === undefined) {
    console.error("addListener: input === undefined.");
    return false;
  }
  input.addEventListener(ev,f);
  return true;
}

/***********************************************************************************************************************************************/

/* Funktio, joka luo sellaisen id:n, jota ei viela ole kaytossa kenellakaan joukkueella. */
function createJoukkueId() {

   // Haetaan joukkueiden idt.
   var joukkueIDt = getJoukkueet(data).map(x => x.id); 
   
   // Etsitaan uniikki id. Kaipa tuo 500000 riittaa ainakin tassa tehtavassa.
   let uniqueID = 0;
   while (joukkueIDt.includes(uniqueID)) {
     uniqueID = Math.round(Math.random() * 500000);
   }
   return uniqueID;
}

/***********************************************************************************************************************************************/

/* Funktio, joka luo uuden taulukon, missa nakyy joukkueiden nimet, sarjat, pisteet ym. Asettaa taulukon html tupa divin sisaan. */
function createTupaTable() {
  
  // Haetaan elementti nimeltaan tupa.
  let tupa = document.getElementById("tupa"); 
   
  // Etsitaan entuudestaan olevaa taulukkoa.
  let table = document.getElementById("tupaTable");

  // Jos taulukko oli jo olemassa, tuhotaan sen lapset.
  if (table !== null) 
    clearchildrens(table)

  else  {
    // Luodaan uusi taulukko bodyn ensimmaiseksi elementiksi.
    table = document.createElement("table");
    table.setAttribute("id", "tupaTable");
  }
  tupa.appendChild(table);

  // Luodaan headerit.
  addHeadersToTable();

  // Paivetaan data.
  updateTable();

  // Lajitellaan taulukon sisalto.
  sortTable(GlobalLajitteluPeruste);
}

/***********************************************************************************************************************************************/

/* Luo legendin ja headerit tupaTablelle. */
function addHeadersToTable() {

  var tupaTaulukko = document.getElementById("tupaTable");

  // Luodaan taulukon legend.
  var legend = document.createElement("legend");
  legend.textContext = "Tulokset"; 
  tupaTaulukko.appendChild(legend);

  // Luodaan taulukon solujen otsikot.
  let tr = document.createElement("tr"); 

  // Luodaan Sarjat otsikko.
  let th_sarjat = document.createElement("th");
  th_sarjat.textContent = "Sarja";

  // Huom. Aina kun lajitellaan jonkun sarakkeen perusteella, niin laitetaan kyseenomainen lajitteluperuste talteen GlobalLajitteluPeruste muuttujaan. 
  // Nain ohjelma muistaa mika lajitteluperuste on kaytossa, kun esim muokataan rastileimauksia ja joudutaan paivittaa tulostaulukkoa. 

  // Rekisteroidaan tapahtuma taulukon "Sarja" kohtaan. Eli jarjestetaan taulukko ensisijaisesti sarjan mukaan, sitten pisteiden mukaan, sitten nimen mukaan.
  th_sarjat.addEventListener("click", e => { GlobalLajitteluPeruste = [SortMethod.SARJA, SortMethod.PISTEET,SortMethod.JOUKKUEET];
					     sortTable(GlobalLajitteluPeruste);}, false); 
  let th_joukkueet = document.createElement("th");
  th_joukkueet.textContent = "Joukkueet";

  // Rekisteroidaan tapahtuma taulukon "Joukkue" kohtaan. Eli jarjestetaan joukkueen nimen mukaan.
  th_joukkueet.addEventListener("click", e => { GlobalLajitteluPeruste = [SortMethod.JOUKKUEET]; sortTable(GlobalLajitteluPeruste);}, false);
  let th_pisteet = document.createElement("th");
  th_pisteet.textContent = "Pisteet";

  // Rekisteroidaan tapahtuma taulukon "Pisteet" kohtaan. Eli jarjestetaan taulukko pisteiden mukaan.
  th_pisteet.addEventListener("click", e => { GlobalLajitteluPeruste = [SortMethod.PISTEET]; sortTable(GlobalLajitteluPeruste);}, false);
  let th_matka = document.createElement("th");
  th_matka.textContent = "Matka";

  // Rekisteroidaan tapahtuma taulukon "Matka" kohtaan. Eli jarjestetaan taulukko ensisijaisesti matkan mukaan, sitten joukkueen nimen mukaan.
  th_matka.addEventListener("click", e => { GlobalLajitteluPeruste = [SortMethod.MATKA, SortMethod.JOUKKUEET]; sortTable(GlobalLajitteluPeruste);}, false);
  let th_aika = document.createElement("th");
  th_aika.textContent = "Kokonaisaika";

  // Rekisteroidaan tapahtuma taulukon "Aika" kohtaan. Eli jarjestetaan taulukko ensisijaisesti ajan mukaan, sitten joukkueen nimen mukaan.
  th_aika.addEventListener("click", e => { GlobalLajitteluPeruste = [SortMethod.KOKONAISAIKA, SortMethod.JOUKKUEET]; sortTable(GlobalLajitteluPeruste); }, false);

  tr.appendChild(th_sarjat);
  tr.appendChild(th_joukkueet);
  tr.appendChild(th_pisteet);
  tr.appendChild(th_matka);
  tr.appendChild(th_aika);

  // Lisataan solujen otsikot taulukkoon.
  tupaTaulukko.appendChild(tr);
}

/***********************************************************************************************************************************************/

/* Funktio,joka paivittaa datan taulukkoon. */ 
function updateTable() {

  // Haetaan taulukkoa varten data.
  let taulukkoData = getTableData();

  // Haetaan taulukko. Oletetaan etta se on jo luotu.
  var tupaTaulukko = document.getElementById("tupaTable");

  // Otetaan talteen legend ja headeri.
  var legend = tupaTaulukko.childNodes[0];
  var headers = tupaTaulukko.childNodes[1];
  
  // Tyhjennetaan tupaTaulukko.
  clearChildrens(tupaTaulukko);

  // Palautetaan seka legend etta header.
  tupaTaulukko.appendChild(legend);
  tupaTaulukko.appendChild(headers);
 
  // Kaydaan lapi taulukkoData luodaan rivit.
  for (let x of taulukkoData) {

      let tr_taulukko = document.createElement("tr");

      // Sarjan nimi.
      let td_sarja = document.createElement("td");
      td_sarja.textContent = x.sarjanNimi;

      // Joukkuen nimi ja jasenet.
      let td_joukkue = document.createElement("td");

      let a = document.createElement("a");
      a.setAttribute("href", "#joukkue");
      a.textContent = x.joukkue.nimi;
      // Tapahtuman kasittelija joukkueen nimen painamiselle.
      // Lataa joukueen tiedot joukkue-formiin ja paivittaa rastileimaukset.
      a.addEventListener("click",(e) => { let joukkue = getJoukkueByName(e.target.firstChild.data); 
                                          document.getElementById("lisaaJoukkueForm").joukkue = joukkue;
                                          updateJoukkueForm(joukkue);
					  updateRastiLeimaukset(joukkue);
                                        });
      
      // Selvitetaan joukkueen osallistujien nimet,
      let nimet = x.joukkue["jasenet"].join(', ');

      td_joukkue.appendChild(a);
      td_joukkue.appendChild(document.createElement("br"));
      td_joukkue.appendChild(document.createTextNode(nimet));

      // Joukkueen pisteet.
      let td_pisteet = document.createElement("td");
      td_pisteet.textContent = x.pisteet;

      // Joukkueen matka.
      let td_matka = document.createElement("td");
      td_matka.textContent = Math.round(x.matka*Math.pow(10,0)/Math.pow(10,0)).toString();
 
      // Joukkueen kokonaisaika.
      let td_aika = document.createElement("td");
      td_aika.textContent = aikaToString(x.aika);

      // Muodostetaan rivi ja lisataan taulukkoon.
      tr_taulukko.appendChild(td_sarja);
      tr_taulukko.appendChild(td_joukkue);
      tr_taulukko.appendChild(td_pisteet);
      tr_taulukko.appendChild(td_matka);
      tr_taulukko.appendChild(td_aika);
      
      // Lisataan rivi taulukkoon.
      tupaTaulukko.appendChild(tr_taulukko);
    }

    // Lajitellaan tulokset uudestaan nykyisen lajitteluperusteen mukaisesti.
    sortTable(GlobalLajitteluPeruste);
}

/***********************************************************************************************************************************************/

/* Funktio, joka jarjestaa taulukon alkiot. sortMethods pitaa olla taulukko inteja, jotka ovat peraisin SortMethod oliosta. Kts. SortMethod maarittely.
 * Esim. sortTable([SortMethod.Sarja, SortMethod.Joukkue]) jarjestaa taulukon alkiot ensisijaisesti sarjan mukaan, sitten joukkueen mukaan.
 * TODO: Nyt puutteelinen virhekasittely. Tee joskun virheenkasittelya. 
 * */

function sortTable(sortMethods) {

  // Kloonataan lajitteluperusteet, silla tama funktio syo sortMethods taulukon tyhiin, jolloin myos GlobalLajitteluPerusteestakin tulisi muutoin [].
  GlobalLajitteluPeruste = sortMethods.slice();

  var tableTrT = document.querySelectorAll("#tupaTable tr");

  // Jos taulukossa on vain otsikko tai ei sitakaan jaljella, niin ei ole mitaan jarjestettavaakaan.
  if (tableTrT.lengt < 2) return;

  // Lajittelu-funktiot. Lajittelu siis taulukossa olevien arvojen perusteella, ei alkuperaisten olioiden perusteella. 
  // Eli ei ihan niin tarkka, silla esim. matkan arvo on pyoristetty taulukkoon, mutta menkoon taman kerran.
  // Toinen vaihtoehto olisi ollut tuoda listana oliot, tai hakea joukkueen nimella tiedot. Ehka joku toinen kerta.
  const sortSarja = (a,b) => a.childNodes[0].textContent.localeCompare(b.childNodes[0].textContent);
  const sortJoukkue = (a,b) => a.childNodes[1].textContent.localeCompare(b.childNodes[1].textContent);
  const sortPisteet = (a,b) => parseInt(b.childNodes[2].textContent)-parseInt(a.childNodes[2].textContent);
  const sortMatka = (a,b) => parseInt(b.childNodes[3].textContent)-parseInt(a.childNodes[3].textContent);
  const sortAika = (a,b) => b.childNodes[4].textContent.localeCompare(a.childNodes[4].textContent);

  // Kasataan tahan lajittelufunktiot.
  var sortFunctions = [];

  //const SortMethod = { SARJA: 0, JOUKKUEET: 1, PISTEET: 2, MATKA: 3, KOKONAISAIKA: 4 }; 
   
  // Lisataan listaan lajittelu-funktiot prioriteettijarjestytksessa, eli sortMehdods:in ensimmainen alkio ensimmaisena jne.
  while (sortMethods.length > 0) {
    let x = sortMethods.shift();
    switch (x) {
      case SortMethod.SARJA:
        sortFunctions.push(sortSarja); 
        break;
      case SortMethod.JOUKKUEET:
        sortFunctions.push(sortJoukkue); 
        break;
      case SortMethod.PISTEET:
        sortFunctions.push(sortPisteet); 
        break;
      case SortMethod.MATKA:
        sortFunctions.push(sortMatka); 
        break;
      case SortMethod.KOKONAISAIKA:
        sortFunctions.push(sortAika); 
        break;
      default:
        throw `sortTable: Viallinen sortMethods alkio: ${x}.`; 
      }
  }

  // Haetaan taulukko.
  var table = document.getElementById("tupaTable");

  // Otetaan talteen taulukon legend. 
  var legend = table.firstChild;

  // Suoritetaan varsinainen jarjestely.
  var sortedNodeArray = Array.from(tableTrT);

  // Otetaan taulukon otsikko talteen.
  var tableHeader = sortedNodeArray.shift();

  // Jaljelle jaaneet rivit jarjestetaan.
  sortedNodeArray = sortedNodeArray.sort((a,b) => { for (let sf of sortFunctions) {
                                                      let result = sf(a,b);    
				         	      // Jarjestys loytyi, muussa tapauksessa otetaan seuraava verailu funktio kayttoon.
						      if (result !== 0) return result;
                                                    }
						    // Tanne varmaankin paadytaan silloin, kun alkiot ovat kaikkien 
						    // vertailufunktioiden jalkeen saman arvoiset.
						    return 0;
						   });

  // Tuhotaan tautukon sisalto.
  clearChildrens(table);

  // Palautetaan legend ja otsikko taulukkoon.
  table.appendChild(legend);
  table.appendChild(tableHeader);

  // Lisataan taulukkoon jarjestetyt rivit.
  for (let i of sortedNodeArray) {
    table.appendChild(i);
  }
}

/***********************************************************************************************************************************************/

/* Funktio, joka luo lisaa rasti lomakkeen. */
function createLisaaRasti() {
  let lomake = document.querySelector("form");
  let fieldset = document.createElement("fieldset"); 
  let legend =  document.createElement("legend");

  legend.textContent = "Rastin tiedot";
  fieldset.appendChild(legend);

  // Parseri-funktio floateja varten. parseFloat hyvaksyy myos sellaiset merkkijonot, joiden alussa on float ja loppu on jotain muuta.
  // Nyt hyvaksytaan ainoastaan puhtaat flotarit.
  const testFloat = function(x) {
    if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(x)) {
      return Number(x);
    }
    return NaN;
  }

  let button = document.createElement("button");

  // Lisataan painikkeeseen rastinlisays toiminto.
  button.addEventListener("click", (e) => { e.preventDefault();
                                            let id = document.querySelector("#rasti_id");
                                            let kilpailu = document.querySelector("#kilpailu_id");
                                            let koodi = document.querySelector("#koodi");
                                            let lat = document.querySelector("#lat");
                                            let lon = document.querySelector("#lon");
					    let lat_float = testFloat(lat.value.trim());
					    let lon_float = testFloat(lon.value.trim());
					    // Jos koodia ei ole annettu tai jos lat tai lon eivat ole floateja.
					    if ((koodi.value.trim()).length == 0 || isNaN(lat_float) || isNaN(lon_float)) return;
					    else {
					      data["rastit"].push({id: parseInt(id.value), kilpailu: parseInt(kilpailu.value), lon: lon_float, koodi: koodi.value, lat: lat_float});
					      for (let k of data["rastit"]) {
                                                console.log(`${k.koodi} : ${k.lat} : ${k.lon}`);
					      }
					    }
                                          });
  button.textContent = "Tallenna";


 
  // Luodaan input-labelit.
  let id_labeli = createVt2Input("id","rasti_id","rasti_id","number",0,20);
  let kilpailu_labeli = createVt2Input("kilpailu","kilpailu_id","kilpailu_id","number",0,20);
  let koodi_labeli = createVt2Input("koodi","koodi","koodi","text","0",20);
  let lat_labeli = createVt2Input("lat","lat","lat","text",0.0,20);
  let lon_labeli = createVt2Input("lon","lon","lon","text",0.0,20);

  fieldset.appendChild(id_labeli);
  fieldset.appendChild(kilpailu_labeli);
  fieldset.appendChild(koodi_labeli);
  fieldset.appendChild(lat_labeli);
  fieldset.appendChild(lon_labeli);

  lomake.appendChild(fieldset);
  lomake.appendChild(button);

}

/***********************************************************************************************************************************************/

function createJoukkueForm() {

  // Haetaan Uusi joukkue lomake.
  let lomake = document.querySelectorAll("body form")[1];

  /* Tyhjennetaan taulukon edelliset elementit. */
  //clearChildrens(lomake); 

  // Lisataan lomakkeelle id. Helpottaa jatkossa.
  lomake.setAttribute("id","lisaaJoukkueForm");

  // Luodaan fieldsetit.
  let fieldset = document.createElement("fieldset"); 
  let fieldset_jasenet = document.createElement("fieldset"); 
  let legend =  document.createElement("legend");
  legend.textContent = "Lisaa Joukkue";

  // Nimikentta (joukkue).
  let nimi_label = createVt2Input("Nimi ", "", "", "text","",20);
  nimi_label.setAttribute("id","joukkueNimi");

  // Lisataan joukkuenimi labeliin nappuan tarkistus tapahtuman kasittelija.
  addListenerP(nimi_label, "input", e => { e.preventDefault(); checkJoukkueForm(); });
  fieldset.appendChild(legend);
  fieldset.appendChild(nimi_label);
  fieldset.appendChild(fieldset_jasenet);

  // Sisemman fieldsetin sisalto.
  let legend_jasenet = document.createElement("legend");
  fieldset_jasenet.setAttribute("id","fieldset_jasenet");
  legend_jasenet.textContent = "Jäsenet"; 
  fieldset_jasenet.appendChild(legend_jasenet);
  let jasen1 = createVt2Input("Jasen 1 ", "", "", "text","",20);
  let jasen2 = createVt2Input("Jasen 2 ", "", "", "text","",20);

  lomake.appendChild(fieldset);

  fieldset_jasenet.appendChild(jasen1);
  fieldset_jasenet.appendChild(jasen2);
  
  fieldset_jasenet.appendChild(createLisaaJoukkueButton());
  fieldset_jasenet.appendChild(createUusiJoukkueButton());
  fieldset_jasenet.appendChild(createMuokkaaJoukkueButton());

  updateJoukkueForm(createDefaultJoukkue());
}

/***********************************************************************************************************************************************/

// Apufunktio jasen labelin luontia varten.
function luoJasenLabel(indexNro,jasNimi) {
  let lab = createVt2Input("Jasen " + (indexNro+1), "", "", "",jasNimi,20);
  lab.setAttribute("class","jasen");
  addListenerP(lab, "input", e => { checkJoukkueForm(); } );
  return lab;
}

/***********************************************************************************************************************************************/

// Tassa funktiossa paivitetaan Joukkue form. @joukkue on joukkue-olio.
function updateJoukkueForm(joukkue) {

  // Haetaan fieldset.  
  var fieldset = document.getElementById("fieldset_jasenet"); 

  // Haetaan legend.
  var legend = fieldset.childNodes[0];

  // Haetaan nappulat. 
  var lisaaNappula = document.getElementById("lisaaJoukkueButton");
  var uusiNappula = document.getElementById("uusiJoukkueButton");
  var muokkaaNappula =  document.getElementById("tallennaMuutoksetButton");

  // Asetetaan joukkueen viite muokkaa nappulaan. Hubbabubba meininki. Yritetaan nyt selvita tasta demosta jotenkin. 
  // TODO : poista!!!
  //document.querySelector("#tallennaMuutoksetButton button").joukkue = joukkue;

  // Lisataan joukkueen viite joukkueformiin. Fiksumpiakin tapoja varmasti on, mutta tama toimii nyt tassa.
  document.getElementById("lisaaJoukkueForm").joukkue = joukkue;

  // Testataan loytyyko ko. joukkue datasta.
//  var joukkueExist = true;
//  try {
//    getJoukkueByName(joukkue.nimi);
//  }
//  catch(e) {
//    joukkueExist = false;  
//  }
  
  // jos joukkue looytyi, niin laitetaan joukkueen viite talteen muokkaanappulaa varten. Hubba bubba meininki, mutta olkoon nyt nain.
//  if (joukkueExist === true) {
//    var mButton = document.querySelector("#tallennaMuutoksetButton button");
//    mButton.joukkue = joukkue;
//  }
  // Ei loytynyt joukkuetta datasta, joten asetetaan muokkaaNappulan joukkue property varmuuden vuoksi nulliksi.
//  else muokkaaNappula.joukkue = null;

  // Piilotetaan nappuloiden nakyvyys.
  lisaaNappula.style.display = "none";
  uusiNappula.style.display = "none";
  muokkaaNappula.style.display = "none";

  // Tyhjennetaan fieldset kaikesta.
  clearChildrens(fieldset);

  // Lisataan uudet jasenet joukkueesta, tai ainakin 2 tyhjaa jasenta, jos joukkueessa ei ole tarpeeksi jasenia.
  let jasenLkm = Math.max(joukkue.jasenet.length,2); 
  let tyhjia = 0;
  for (let x=0; x<jasenLkm; x++) {
    let nimi = joukkue.jasenet[x]; 
    if (nimi === undefined) { nimi = ""; tyhjia = tyhjia + 1; } // Jos joukkueella ei ole jasenen nimea, niin korvataan se tyhjalla merkkijonolla.
    var lisattavaLabel = luoJasenLabel(x,nimi);
    fieldset.appendChild(lisattavaLabel);
  }

  // Jos kaikki nimikentat ovat ei tyhjia, niin lisataan yksi ylimaarainen tyhja nimikentta valmiiksi. Helpottaa nimien lisaamista.
  if (tyhjia === 0) {
    fieldset.appendChild(luoJasenLabel(jasenLkm, ""));
  }
  
  // Muutetaan joukkueen nimi sille varatulle labelille.
  var joukkueNimiLabel = document.querySelector("#joukkueNimi input");
  if (joukkue.nimi !== "") joukkueNimiLabel.value = joukkue.nimi;
  else joukkueNimiLabel.value = "";
 
  // Lisataan nappulat.
  fieldset.appendChild(lisaaNappula);
  fieldset.appendChild(uusiNappula);
  fieldset.appendChild(muokkaaNappula);

  // Katsotaan mitka nappulat tulevat nakyviin.

  // Jos funktiolle tuotu joukkuenimi ei ole tyhja, niin talloin asetetaan lomake muokkaustilaan.
  var paaLegend = document.querySelector("#lisaaJoukkueForm legend");
  if (joukkue.nimi !== "") {
    paaLegend.textContent = "Muokkaa Joukkuetta";
    muokkaaNappula.style.display = "inline-block";
    uusiNappula.style.display = "inline-block";
  }
  // Muussa tapauksessa mennaan uusi joukkue tilaan.
  else {
    paaLegend.textContent = "Uusi joukkue";
    lisaaNappula.style.display = "inline-block";
  }

  // Katsotaan mitka nappulat disabloituvat tai enablotuvat.
  checkJoukkueForm();
}

/***********************************************************************************************************************************************/

/* Luodaan rastileimausloota joukkue-formiin. */
function createRastiLeimaukset() {
  var joukkueForm = document.getElementById("lisaaJoukkueForm"); 
  var leimausFieldset = document.createElement("fieldset");
  leimausFieldset.setAttribute("id","leimausFieldset");
  joukkueForm.appendChild(leimausFieldset);
  var leimausLegend = document.createElement("legend");
  leimausLegend.textContent = "Rastileimaukset";
  leimausFieldset.appendChild(leimausLegend);

  // Luodaan div, joka sisaltaa selectin ja uusi leimaus buttonin.
  var div = document.createElement('div');
  div.setAttribute('id','leimausDiv');

  // Luodaan select.
  var select = document.createElement("select"); 
  div.appendChild(select);

  // Luodaan selectionin vaihtoon oma tapahtuma.
  select.addEventListener('change', e => updateLeimausLoota());
  
  // Luodaan uuden rastileimauksen mahdollistava buttoni.
  var luoUusiLeimausButton = document.createElement("button");
  luoUusiLeimausButton.textContent = "Luo uusi leimaus";
  luoUusiLeimausButton.setAttribute("id","uusiLeimausButton");
  luoUusiLeimausButton.addEventListener('click', e => { e.preventDefault(); 
                                                        // Haetaan leimauksen muokkaus loota.
                                                        var loota = document.getElementById("leimausLoota");
							var select = document.querySelector("#leimausDiv select");
							var rastitOptions = document.querySelectorAll(".rastiOption");
							var uusiLeimaus = {aika:"",joukkue: document.getElementById("lisaaJoukkueForm").joukkue.id,rasti: 0};
							var uusiOpt = luoRastileimausOption(uusiLeimaus);
							// Eli rasti lisataan siihen kohtaan jossa edellinen rastin on. 
							// Ei ehka kaytannon kannalta jarkevaa, mutta tehdaan nyt talla kertaa nain.
							// Lisaksi joukkue haetaan tallenna muutokset nappulasta, mika on idioottimaista, mutta 
							// ajansaaston vuoksi ei muuteta sita, silla muutoin pitaisi muokata ohjelma koodia 
							// monesta muusta eri kohdasta. Jatkossa koodataan sitten fiksummin.
							//
						        if (rastitOptions.length === 0) {
                                                          select.appendChild(uusiOpt);
							  uusiOpt.selected = true;
							  // Lisataan uusi leimaus data.tupa hannille. 
							  data.tupa.push(uusiLeimaus);
                                                          updateLeimausLoota();
							  return;
							}
							//
							//
							looppi:
							for (let i=0; i<rastitOptions.length; i++) {
                                                          if (rastitOptions[i].selected === true) {
							    // Lisataan lisatty rasti-option indeksoituun paikkaan. Itseasiassa itse indeksi i on nyt ihan turha.
							    // Oltaisiin voitu menna ihan indeksoimattomallakin loopilla...
                                                            rastitOptions[i].parentNode.insertBefore(uusiOpt, rastitOptions[i].nextSibling);
							    // Laitetaan uusi leimaus valituksi.
							    for (let b of rastitOptions) b.selected = false;
							    uusiOpt.selected = true;
                                                            updateLeimausLoota();
							    // Lisataan uusi leimaus muos dataan vastaavaan paikkaan.
							    // Paikalla ei nyt ole niinkaan valia, silla rastit kuitenkin jarjestetaan myohemmin ajan mukaan.
							    for (let y=0; y<data.tupa.length;y++){
                                                              if (rastitOptions[i].rasti === data.tupa[y]) {
                                                                data.tupa.splice(y,0,uusiLeimaus);
								break looppi;
							      }
							    }
							  }
							}
                                                      },false);
  div.appendChild(luoUusiLeimausButton);
  leimausFieldset.appendChild(div);
  // TODO: tee buttonille tapahtuma.

  // Luodaan rastileimauksen muokkaus loota.
  var leimausLoota = document.createElement("p");
  leimausLoota.setAttribute("id","leimausLoota");

  // Voitaisiin kayttaa css:aa mutta tehdaan nyt taman kerran nain.
  leimausLoota.setAttribute('class','hidden');

  // Luodaan leimauksen muokkaus inputit.
  var aika = createVt2Input("Aika", "", "", "text","",20); 
  aika.setAttribute("id","leimausAika");
  var rasti = createVt2Input("Rasti", "", "", "text","",20); 
  rasti.setAttribute("id","leimausRasti");
  var poista = createVt2Input("Poista", "", "", "checkbox","",5); 
  poista.setAttribute("id","leimausPoista");
  var tallenna = document.createElement('button');
  tallenna.textContent = "Tallenna";
  tallenna.setAttribute('id',"leimausTallenna");

  // Lisataan Tallenna nappulaan klikkaustapahtuma. Eli painamalla tallenna nappulaa muutokset tallentuu 
  // rastileimausolioon (tupa-olio). Jos poista check box on valittuna, niin poistetaan ko. rastileimaus.
  // Lopuksi paivitetaan rastileimaukset. Vahan turhan pitka funktio labdaksi... Jos jaa aikaa, niin ....
  tallenna.addEventListener('click', e => { e.preventDefault();
					    var lAika = document.querySelector("#leimausAika input");
					    var lRasti = document.querySelector("#leimausRasti input");
					    var lPoistaCheckBox = document.querySelector("#leimausPoista input");
					    var joukkue = document.getElementById("lisaaJoukkueForm").joukkue;
					    
					    // Checkbox 'Poista' on ruksittu, joten poistetaan rastileimaus.
					    if (lPoistaCheckBox.checked === true) {
                                              poistaTupa(tallenna.rasti);
					    }
					    // Tallennetaan muokattu rastileimaus ja paivitetaan tulokset. Hieman epailyttaa tallentaa jotain nappulaan...
					    else {
					      tallenna.rasti.aika = lAika.value;
					      tallenna.rasti.rasti = lRasti.value;
					    }
					    // Paivitetaan rastileimaukset.
					    updateRastiLeimaukset(joukkue);
					    // Paivitetaan tulokset.
					    updateTable();
					  });
  leimausLoota.appendChild(aika);
  leimausLoota.appendChild(rasti);
  leimausLoota.appendChild(poista);
  leimausLoota.appendChild(tallenna);
  leimausFieldset.appendChild(leimausLoota);
}

/***********************************************************************************************************************************************/

/* Funktio, joka poistaa tuvan datasta. @tupa on tupa-olio. */
function poistaTupa(tupa) {
  for (let i=0; i<data.tupa.length; i++) {
    if (data.tupa[i] === tupa) {
      data.tupa.splice(i,1);
      break;
    }
  }
}

/***********************************************************************************************************************************************/

/* Funktio, joka luo rastioptionin. Rastiolion valueksi asetetaan @rasti rasti-olio.
 * Huom. luodaan tassa optionille uusi property rasti, joka on rastileimausta vastaan rasti-olio.*/
function luoRastileimausOption(rasti) {
    let opt = document.createElement("option"); 
    opt.setAttribute("class","rastiOption");
    opt.rasti = rasti;
    opt.textContent = `Aika : ${rasti.aika} Rasti : ${rasti.rasti}`;
    return opt;
}

/***********************************************************************************************************************************************/

/* Functio, jota kutsutaan kun halutaan asettaa rastileimauksien silla hetkella valittuna olevan optionin eli rastileimauksen 
 * tiedot rastileimauksien muokkauskenttiin. Huom. rastimuokkaus laatikon Button omistaa nyt rasti-propertyn, joka on viite valittuna olevaan rasti-olioon. */
function updateLeimausLoota() {

  // Haetaan joukkue-formin select.
  var select = document.querySelector("#leimausFieldset select");

  // Haetaan leimausloota.
  var leimausLoota = document.getElementById("leimausLoota");

  // Haetaan leimauslootan inputit ja tallenna nappula.
  var aeka = document.querySelector("#leimausAika input");
  var rastiId = document.querySelector("#leimausRasti input");
  var tallennaButton = document.querySelector("#leimausTallenna");

  // Jos ei ole rastileimauksia, niin piilotetaan leimausLoota ja tyhjennetaan sen valuet.
  if (select.childNodes.length === 0) {
    aeka.value = "";
    rastiId.value = "";
    tallennaButton.rasti = null;
    //leimausLoota.setAttribute('class','hidden');
    leimausLoota.style.display = 'none';
    return;
  }
  // Muutoin palautetaan nakyviin.
  leimausLoota.style.display = 'block';

  // Etsitaan mika leimaus on valittuna ja paivitetaan sen tiedot leimauksen muokkaus inputteihin.
  for (let x of select.childNodes) {
    if (x.selected === true) {
      leimausLoota.style.display = "table-row";
      aeka.value = x.rasti.aika;
      rastiId.value = x.rasti.rasti;
      // Lisataan rastileumauksen muokkauksen Tallenna nappulaan viite rastiin. On vahan purkkameininki, mutta yritetaan saada tama nain toimimaan.
      tallennaButton.rasti = x.rasti;
    }
  }
}

/***********************************************************************************************************************************************/

/* Funktio, joka paivittaa joukkueen rastileimaukset. */
function updateRastiLeimaukset(joukkue) {

  // Otetaan joukkue-formissa olevat leimaukset.
  var leimaukset = document.querySelectorAll(".rastiOption");

  // Haetaan joukkue-formin select.
  var select = document.querySelector("#leimausFieldset select");

  // Poistetaan leimaus optioinit.
  for (let x of leimaukset) {
    select.removeChild(x); 
  }

  // Haetaan joukkueen rastileimaukset.
  var rastiLeimaukset = haeTuvatByJoukkue(joukkue); 

  // Lisataan parametrin @joukkue rastileimaukset.
  for (let x of rastiLeimaukset) {
    select.appendChild(luoRastileimausOption(x));  
  }

  // Paivitetaan leimausloota.
  updateLeimausLoota();

}

/***********************************************************************************************************************************************/

// Luo tyhman joukkueen.
function createDefaultJoukkue() {
  return {id: createJoukkueId(), jasenet: [], last: "2017-01-01 01:01:01", nimi: ""};
}

/***********************************************************************************************************************************************/

/* Luo Lisaa joukkue buttonin. */
function createLisaaJoukkueButton() {
  var p = document.createElement("p");
  var button = document.createElement("button");

  button.textContent = "Lisää joukkue";

  // Lisataan joukkueen lisays tapahtuma. Nyt siis uusi joukkue lisataan dataan, paivitetaan taulukko ja tyhjennetaan joukkuue-from. 
  button.addEventListener("click", e => { e.preventDefault(); 
                                          var joukkue = createDefaultJoukkue();  
                                          var jasenet = document.querySelectorAll("#fieldset_jasenet p label input") 
					  for (let x of jasenet) if (x.value.trim().length !== 0) joukkue.jasenet.push(x.value);
                                          joukkue.nimi = document.querySelector("#joukkueNimi input").value;
					  addJoukkue(joukkue,"2h");
					  var uusiJoukkue = createDefaultJoukkue();
					  updateJoukkueForm(uusiJoukkue);
					  updateTable();
					  updateRastiLeimaukset(uusiJoukkue);
                                        });
  p.appendChild(button);
  p.setAttribute("id","lisaaJoukkueButton");
  p.style.display = "none";

  return p;
}

/***********************************************************************************************************************************************/

/* Funktio, joka lisaa annettuun sarjaan joukkueen. @joukkue on joukkue-object. @sarja on merkkijono, joka kertoo sarjan nimen.
 * Jos annettua sarjaa ei loydy, niin heittaa poikkeuksen. Saman nimisia joukkueita voi lisata.
 */
function addJoukkue(joukkue, sarja) {
  let pSarja = undefined;
  for (let s of data.sarjat) {
    if (s.nimi === sarja) {
       pSarja = s; 
    }
  }
  if (pSarja === undefined) throw "addJoukkue: sarja === undefined";
  pSarja.joukkueet.push(joukkue);
}

/***********************************************************************************************************************************************/

/* Funktio, joka tarkastaa sen onko Joukkue formissa Nimi, Jasen 1 ja Jasen 2 kentassa jotain. Jos ei ole, niin tama disabloi 
 * tai enabloi Lisaa joukkue ja tallenna muutokset nappulat sen mukaan ovatko labelit tyhjia vai ei. Kaikissa edella mainituissa 
 * labelien inputeissa pitaa olla jotain muuta kuin tyhjia merkkeja. Lisaksi funktio luo tarpeen mukaan uusia tyhjia nimi-labeleita.*/
function checkJoukkueForm() {

  // Haetaan jasenet.
  var jasenetLabels = document.querySelectorAll(".jasen label input");

  // Haetaan nappuloita. 
  var lisaaNappula = document.querySelector("#lisaaJoukkueButton button");
  var muokkaaNappula =  document.querySelector("#tallennaMuutoksetButton button");

  // Haetaan joukkuenimi labeli.
  var joukkueNimiLabel = document.querySelector("#joukkueNimi input");

  // Tarkistetaan inputtien sisalto ja joko enabloidaan tai disabloidaan.
  if (jasenetLabels[0].value.trim().length !== 0  && jasenetLabels[1].value.trim().length !== 0 && joukkueNimiLabel.value.trim().length !== 0) {
    lisaaNappula.disabled = false;
    muokkaaNappula.disabled = false;
  }
  else {
    lisaaNappula.disabled = true;
    muokkaaNappula.disabled = true;
  }

  // Lisataan yksi tyhja jasen kentta, jos kaikki jasenkentat ovat epatyhjia ja jos kenttia on enemman kuin kaksi.
  var tyhjiaJasenKenttia = false;
  for (let x of jasenetLabels) {
   if (x.value.trim().length === 0) {
     tyhjiaJasenKenttia = true;
     break;
   }
  }
  if (tyhjiaJasenKenttia === false) {
     var fieldsetJasenet = document.getElementById("fieldset_jasenet");
     fieldsetJasenet.insertBefore(luoJasenLabel((jasenetLabels.length),""),fieldsetJasenet.children[jasenetLabels.length]);
  }
}

/***********************************************************************************************************************************************/

/* Luo Uusi joukkue buttonin. */
function createUusiJoukkueButton() {
  var p = document.createElement("p");
  var button = document.createElement("button");

  button.textContent = "Uusi joukkue";
  button.addEventListener("click", e => { e.preventDefault();  
					  var uusiJoukkue = createDefaultJoukkue();
					  updateJoukkueForm(uusiJoukkue);
					  updateRastiLeimaukset(uusiJoukkue);
					});
  p.setAttribute("id","uusiJoukkueButton");
  p.appendChild(button);
  p.style.display = "none";

  return p;
}

/***********************************************************************************************************************************************/

/* Luo tallenna muutokset buttonin. */
function createMuokkaaJoukkueButton() {
  var p = document.createElement("p");
  var button = document.createElement("button");
  //Object.defineProperty(button,'joukkue', {value: null, writable: true});

  button.textContent = "Tallenna muutokset";

  // Tallentaa joukkueen, paivittaa taulukon ja tyhjentaa joukkue-formin.
  button.addEventListener("click", e => { e.preventDefault();
					  saveJoukkue(document.getElementById("lisaaJoukkueForm").joukkue);
                                          updateTable();  
					  var uusiJoukkue = createDefaultJoukkue();
					  updateJoukkueForm(uusiJoukkue);
					  //updateTable();
					  updateRastiLeimaukset(uusiJoukkue);
                                        }); 
  p.setAttribute("id","tallennaMuutoksetButton");
  p.appendChild(button);
  p.style.display = "none";

  return p;
}

/***********************************************************************************************************************************************/

/* Funtio, joka keraa joukkue-formista tiedot ja muokkaa niilla parametrin @joukkue arvoja */
function saveJoukkue(joukkue) {
  // Haetaan jasenet.
  var jasenetLabels = document.querySelectorAll(".jasen label input");

  // Haetaan joukkuenimi labeli.
  var joukkueNimiLabel = document.querySelector("#joukkueNimi input");

  joukkue.jasenet = [];
  for (let x of jasenetLabels) {
    if (x.value.trim() !== "") {
      joukkue.jasenet.push(x.value);
    }
  }
  joukkue.nimi = joukkueNimiLabel.value;
}

/********** Demon 1 funktioita ym lisattyja juttuja. *******/

/* Funktio, joka palauttaa merkkijonosta parsitun Date-olion. Jos parsinta epaonnistuu, niin funktio palauttaa null.
 * Merkkijonon taytyy olla muotoa dddd-dd-dd dd:dd:dd. */
function parsiAika(aikaStr)
{
  const pattern = /(\d\d\d\d)-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)/;
  let [_, v, k, p, h,m,s] = pattern.exec(aikaStr) || []; 
  let date = new Date(`${v}-${k}-${p}T${h}:${m}:${s}+0000`);
  /* Testataan onko parsittu aika jarkeva. Jos ei ole, niin palautetaan null. */
  if (isNaN(date.getTime()))
  {
    return null;
  }
  // Hmmm. Mikatan tama teki. TODO: Tarkista onko tarpeellinen.
  let userTimezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + userTimezoneOffset);
}

/***********************************************************************************************************************************************/

/* Funktio, joka palauttaa listan kaikista mallidatan joukkueista. */
function getJoukkueet(malliData)
{
  let joukkueet = []; 
  for (let sarja of malliData["sarjat"])
  {
    for (let joukkue of sarja["joukkueet"])
    {
      joukkueet.push(joukkue);
    }
  }
  return joukkueet;
}

/***********************************************************************************************************************************************/

/* Funktio, joka palauttaa mallidatan rastit datan siten, etta kuhunkin objektiin on lisatty property piste, joka on tehtavanannon mukaan
 * laskettu piste koodista (ensimmainen koodin numero muuttuu pisteeksi, kaikki muut koodit 0:ksi.). Lisaksi lon ja lat muutetaan floatiksi tai NaN jos 
 * konvertointi epaonnistuu. id on muutettu stringiksi.*/
function getRastitData(malliData)
{
  return malliData["rastit"].map(x => { let k=0; if (x["koodi"].match(/^\d/)) k = parseInt(x["koodi"][0],10);
                                        return {kilpailu: x.kilpailu, 
       	 			                lon: parseFloat(x.lon),
       	 				        koodi: x.koodi,
       	 				        lat: parseFloat(x.lat),
       	 				        id: x["id"].toString(),
       	 				        piste: k};
                		       });
}

/***********************************************************************************************************************************************/

/* Funktio joka ottaa malliDatasta tupadatan ja konvertoi sen siten, etta aika on joko Date tai null, rasti on konvertoitu stringiksi ja joukkue pysyy sellaisenaan */
function getTupaData(malliData)
{
   return malliData["tupa"].map(x => { return {aika: x.aika, aika_date: parsiAika(x.aika), rasti: x["rasti"].toString(), joukkue: x.joukkue}; }); 
}

/* Funktio, joka ottaa argumenttina joukkueen ja getTupaDatan mukaisen tuparakenteen. Funktio etsii joukkuetta vastaavat 
 * tuvat. */
function etsiTuvat(joukkue, uusiTupaData)
{
  /* Etsitaan ne tuvat, jotka matsaavat joukkueen id:n kanssa. */
  return uusiTupaData.filter(x => x["joukkue"] === joukkue.id);
}

/* Laskee argumenttina annetun joukkueen pisteet ja palauttaa sen paluuarvona. */
function laskePisteet(joukkue, uusiTupaData, uusiRastiData)
{
  /* Haetaan joukkuetta vastaavat tuvat. */
  let joukkueenTuvat = etsiTuvat(joukkue, uusiTupaData);
  /* otetaan joukkueen rastit talteen ja poistetaan monikerrat. */
  let rastienIdt = new Set(joukkueenTuvat.map(x => x.rasti));

  let pointsit = 0;
  for (let r of rastienIdt)
  {
    for (let rasti of uusiRastiData)
    {
      if (rasti.id === r)
      {
        pointsit += rasti.piste;
	break;
      }
    }
  }
  return pointsit;
}

/***********************************************************************************************************************************************/

/* Demo2 taso5 apufunktio. Haetaan joukkueen kaikki rastileimaukset, eli tuvat. */
function haeTuvatByJoukkue(joukkue) {
  return data.tupa.filter(x => joukkue.id === x.joukkue); 
}

/***********************************************************************************************************************************************/

/* Funktio, joka laskee argumenttina annetun joukkueen ajan, matkan ja pisteet. Palauttaa olion {joukkue: joukkue, aika: number, matka: number, pisteet: number} */
function laske_matka_aika_pisteet(joukkue, uusiTupaData, uusiRastiData)
{
  /* Tahan tulee joukkueiden tuvat, josta on poistettu kaikki monikerrat. */
  let tuvat_no_monikerta = [];
  /* Haetaan joukkuetta vastaavat tuvat ja poistetaan sellaiset tuvat, jossa ei ole kunnollista aikaa. */
  let joukkueenTuvat = (etsiTuvat(joukkue, uusiTupaData)).filter(x => x.aika_date !== null);
  /* otetaan joukkueen rastit talteen ja poistetaan monikerrat. */
  let rastienIdt = Array.from(new Set(joukkueenTuvat.map(x => x.rasti)));
  /* Kaydaan kunkin joukkueen tupaData lapi siten, etta otetaan talteen aina ensimmainen rastin id sisaltama tupa talteen ja unohdetaan sita seuraavat vastaavat tuvat. */ 
  for (let x of rastienIdt)
  {
    tuvat_no_monikerta.push(joukkueenTuvat.find(y => y.rasti === x));  
  }
  /* Jarjestetaan tuvat viela varmuuden vuoksi ajan mukaan. */
  tuvat_no_monikerta.sort((x,y) => (x.aika_date).getTime() - (y.aika_date).getTime());
  let kokonaisAika = undefined;
  /* Lasketaan kokonaisaika viimeisimman ja ensimmaisen ajan erotuksena. */
  if (tuvat_no_monikerta.length > 1) 
  {
    kokonaisAika = tuvat_no_monikerta[tuvat_no_monikerta.length-1].aika_date -  tuvat_no_monikerta[0].aika_date;
  }
  
  /* Jos ei pystyta maarittamaan kokonaisaikaa, niin asetetaan kokonaisajaksi 0. */
  if (kokonaisAika === undefined) {
    kokonaisAika = 0;
  }

  /* Lasketaan matka. */

  /* Poistetaan rasteista sellaiset rastit, joilla ei ole koordinaatteja. Taman olisi voinnut tehda kerralla jossakin muualla, mutta olkoon nyt tassa. */
  let rastit_with_koordinates = uusiRastiData.filter(x => x.lat !== NaN && x.lon !== NaN);
  let matka = 0.0;
  let edellinenRasti = undefined; 
  /* Kaydaan lapi kukin joukkueen tupa, ja lasketaan aina edellisen tuvan rastin ja seuraavan rastin koordinaattien etaisyydet yhteen. */
  for (let t of tuvat_no_monikerta)
  {
    let rasti_now = rastit_with_koordinates.find(x => x.id === t.rasti);
    /* Jos rastia ei loydy id:n perusteella, niin skipataan se. */
    if (rasti_now === undefined) continue;
    if (edellinenRasti === undefined) { edellinenRasti = rasti_now; }  
    matka = matka + getDistanceFromLatLonInKm(edellinenRasti.lat,edellinenRasti.lon,rasti_now.lat,rasti_now.lon);
    edellinenRasti = rasti_now;
  }
  /* Palautetaan data. */
  return {joukkue: joukkue, matka: matka, aika: kokonaisAika, pisteet: laskePisteet(joukkue, uusiTupaData, uusiRastiData)};
}

/***********************************************************************************************************************************************/

/* Funktio, palauttaa ajan merkkijonona "dd:dd:dd"t tai "00:00:00", jos ei saada parsittua mitaan kunnollista. Funktio ei varmista onko date todellakin aika. */
function aikaToString(date)
{
  if (date === undefined) return "00:00:00";
  const p = /\d\d:\d\d:\d\d/;
  /* Kaytetaan toUTCString, silla perinteinen toString tekee kaikkea kikkailuja kuten lisaa 2 tuntia, koska aikavyohykkeemme on GTM+2. */
  let pDate = p.exec((new Date(date)).toUTCString());
  return pDate[0];
}

/***********************************************************************************************************************************************/

/* Muuttaa integerin paivamaaraksi. */
function intToDateStr(i) {
  return (new Date(i).toUTCString());
}

/***********************************************************************************************************************************************/

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

/***********************************************************************************************************************************************/

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

/***********************************************************************************************************************************************/

// Hakee datan tehtavan 2. taulukkoa varten.
function getTableData() {

  // Kerataan tahan kunkin rivin tiedot {sarja:string, joukkue:joukkue, pisteet:number, matka:number, aika:number} 
  let tableData = [];

  for (let sarja of data["sarjat"]) {

    for (let joukkue of sarja.joukkueet) {
      /* Haetaan rastidata muunnoksineen. Tarvitaan kun laskestaan pisteet, matka ja aika. */
      let rastiData = getRastitData(data);
      /* Haetaan tupadata muunnoksineen. Tarvitaan kun laskestaan pisteet, matka ja aika.*/
      let tupaData  = getTupaData(data);

      let joukkueData = laske_matka_aika_pisteet(joukkue, tupaData, rastiData); 
      tableData.push({sarjanNimi: sarja.nimi, joukkue:joukkue, pisteet: joukkueData.pisteet, matka: joukkueData.matka, aika: joukkueData.aika}); 
    }
  }
  
  return tableData;
}

