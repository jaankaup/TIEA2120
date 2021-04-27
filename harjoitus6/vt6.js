"use strict";

console.log(data);

////////////////////////////////////////////////////////////////////////////////////////////////

const InputTyyppi = {nimikentta: 0, jasenkentta: 1, sarjaKentta: 2, leimaustapaKentta: 3};
// vvvv-kk-pp hh:mm(:ss) => pp.kk.vvv hh:mm(:ss)
function convertoiViivaMuotoToPisteMuodo(str) {
  if (str.length === 0) return "";
  const patternMax = /^(\d\d\d\d)-(\d\d)-(\d\d) (\d\d):(\d\d)(:\d\d\.\d\d\d)?$/
  let [x,y,month,d,hour,min,sek] = patternMax.exec(str) || []; 
  if (sek === undefined) sek = "";
    return `${d}.${month}.${y} ${hour}:${min}`;
}

////////////////////////////////////////////////////////////////////////////////////////////////

// pp.kk.vvvv hh:mm => vvvv-kk-pp hh:mm 
function convertoiPisteMuotoToViiva(str) {
  const pattern = /^(\d\d)\.(\d\d)\.(\d\d\d\d) (\d\d):(\d\d)$/; 
  let [_,p,kk,v,h,m,s] = pattern.exec(str) || []; 
  return `${v}-${kk}-${p} ${h}:${m}`;
}

////////////////////////////////////////////////////////////////////////////////////////////////

// Luo ja palauttaa listan, jossa on sarjan id ja sita vastaava nimi. Tama on nyt reactin ulkopuolella, silla kisoja ei ainakaa nyt muutella.
function createSarjaMappings() {
  var mappings = [];
  for (let x of data.kisat[0].sarjat) {
    mappings.push({id: x.id, nimi: x.nimi});
  }
  return mappings.sort((x,y) => x.nimi.localeCompare(y.nimi));
}

////////////////////////////////////////////////////////////////////////////////////////////////

function poistaRastienMonikerrat(joukkue) {
     
    var arrayNoMonikerta = [];
    var idArray = joukkue.rastit.map(e => e.id.toString()); 
    var noMonikerta = Array.from(new Set(idArray));  
    for (let k of noMonikerta) {
      var firstInstance = joukkue.rastit.find(h => h.id.toString() === k.toString());
      arrayNoMonikerta.push(firstInstance);
      joukkue.rastit = joukkue.rastit.filter(h => h.id.toString() !== k.toString());
    }
    joukkue.rastit = arrayNoMonikerta;
}

////////////////////////////////////////////////////////////////////////////////////////////////

/* Funktio, joka etsii joukkueen rastia vastaavan data.rastin. */
function rastiTorasti(jRasti, rastit) {
  var jRastiToString = jRasti.id.toString();
  var oikeaRasti = rastit.find(x => jRastiToString === x.id.toString());
  if (oikeaRasti === undefined) console.error(`rastiTorasti: jRasti.id === ${jRasti.id} ei loydy vastaavaa rastia!`);
  return oikeaRasti;
}

////////////////////////////////////////////////////////////////////////////////////////////////

function laskeMatkaJaPisteet(joukkue, rastit) {
  
  /* Poistetaan rasteista sellaiset rastit, joilla ei ole koordinaatteja. Taman olisi voinnut tehda kerralla jossakin muualla, mutta olkoon nyt tassa. */
  let rastit_with_koordinates = joukkue.rastit.filter(x => x.lat !== NaN && x.lon !== NaN);
  /* Kaydaan lapi kukin joukkueen rasti, ja lasketaan aina edellisen tuvan rastin ja seuraavan rastin koordinaattien etaisyydet yhteen. */
  var tuvat_no_monikerta = [];
  for (let b of joukkue.rastit) tuvat_no_monikerta.push(rastiTorasti(b,rastit));

  let matka = 0.0;
  let pisteet = 0;
  let edellinenRasti = undefined; 
  for (let t of tuvat_no_monikerta)
  {
    var rasti_now = t;
    if (rasti_now.koodi.match(/^\d/)) pisteet = pisteet + parseInt(rasti_now["koodi"][0],10)
    if (edellinenRasti === undefined) { edellinenRasti = t; continue; }  
    matka = matka + getDistanceFromLatLonInKm(edellinenRasti.lat,edellinenRasti.lon,rasti_now.lat,rasti_now.lon);
    edellinenRasti = rasti_now;
  }

  return {matka: matka, pisteet: pisteet};
}

////////////////////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////////////////////

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

////////////////////////////////////////////////////////////////////////////////////////////////

/**************************************************************
 *
 * App definition.
 *
 **************************************************************/

// App luokka on koko ohjelman aivot. Se hallitsee kaikkia muita componentteja ja yllapitaa dataa. En tieda pitaisiko tata oikeasti hajauttaa useampaan aivoon, mutta nyt 
// kuitenkin on nain.
class App extends React.Component {
    constructor(props) {
      super(props);
        // tehdään kopio tietorakenteen joukkueista
        // Tämä on tehtävä näin, että saadaan oikeasti aikaan kopio eikä vain viittausta samaan tietorakenteeseen. Objekteja ja taulukoita ei voida kopioida vain sijoitusoperaattorilla
        // päivitettäessä React-komponentin tilaa on aina vanha tila kopioitava uudeksi tällä tavalla
        // kts. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
        let joukkueet = this.cloneJoukkueet(data.joukkueet);
        let rastit = this.cloneRastit(data.rastit, true);

	// Poistetaan joukkueilta rastien monikerrat.
	for (let x of joukkueet) poistaRastienMonikerrat(x);
	var uusiJoukkue = this.createNewJoukkue(joukkueet)
	// Pidetaan statessa joukkueet, muokattavissa oleva joukkue ja viite alkuperaiseen muokattavissa olevaan joukueeseen.
        this.state = { 
	    "rastit" : rastit, 
            "joukkueet" : joukkueet,
	    "joukkueNow": uusiJoukkue, // Annetaan argumenttina joukkueet, silla this.state on viela undefined.
	    "oldJoukkueViite": uusiJoukkue
        };
    }

    // Kloonaa joukkueet. Olisi voinnut olla myos erillinen funktio, mutta olkoon nyt app-functio.
    cloneJoukkueet(src) {
        let joukkueet = Array.from( src, function(j) {
            // luodaan uusijoukkue
            let uusij = {};
            // kopioidaan tavalliset kentät
            let kentat = ["nimi", "sarja", "seura", "id","luontiaika"];
	    // Trimmataan ainakin joukkueen nimet. Siella on naas tyhjia merkkeja, mitka aieuttaa kompleksisuutta myohemmin.
            for( let i of kentat )
	        if (typeof j[i] === 'string') {
                  uusij[i] = j[i].trim();
		}
		else uusij[i] = j[i];
            // taulukot on kopioitava erikseen. Nyt riittää pelkkä array.from, koska tauluiden
            // sisällä ei ole muita taulukoita tai objekteja
            let uusijasenet = Array.from( j["jasenet"] );
            let uusirastit = Array.from( j["rastit"] );
            let uusileimaustapa = Array.from( j["leimaustapa"] );
            uusij["jasenet"] = uusijasenet;
            uusij["rastit"] = uusirastit;
            uusij["leimaustapa"] = uusileimaustapa;
            return uusij;
        });
	return joukkueet;
    }

    // Kloonaa rastit. Ekalla kerralla luodaan active property, joka kertoo sen onko rasti klikattu aktiiviseksi.
    cloneRastit(src, ekanKerran) {
        if (ekanKerran) return src.map(x => Object.assign({active: false}, x));
        return src.map(x => Object.assign({}, x)); 
    }

    // Kopioidaan joukkue. Pitaisi onnistua nain, silla joukueen data on yksitasoista.
    cloneJoukkue(src) {
      return Object.assign({}, src);
    }

    // Luo uuden joukkueen, mutta ei tallenna sita. @joukkueet tarvitaan, jotta saadaan luotua uniikki id.
    // Tasta olisi voinnut luoda oman reactin ulkopuolisen funktion, mutta olkoon nyt "metodi".
    createNewJoukkue(joukkueet) {
      var joukkueIDt = joukkueet.map(x => x.id);
      let uniqueID = 0;
      while (joukkueIDt.includes(uniqueID)) {
        uniqueID = Math.round(Math.random() * 500000);
      }
      return {nimi: "", sarja: createSarjaMappings()[0].id, seura: null, id: uniqueID, jasenet: [], rastit: [], leimaustapa: [],luontiaika: null};
    }

    // Tapahtuman kasittelija sille, kun klikataan joukkueen nimea Joukkueet listassa.
    // Hetaan joukkueen nimen perusteella joukkue App:sta. Asetetaan ko. joukkueen klooni joukkueNow:iksi.
    joukkueClick(e) {
      e.preventDefault();
      var joukkue = this.state.joukkueet.find(x => x.nimi === e.target.textContent);
      var joukkueClone = Object.assign({}, joukkue);
      console.log(joukkueClone.luontiaika);
      if (joukkueClone.luontiaika !== null) joukkueClone.luontiaika = convertoiViivaMuotoToPisteMuodo(joukkueClone.luontiaika);
      this.setState((oldState) => ({rastit: oldState.rastit, joukkueet: oldState.joukkueet, joukkueNow: joukkueClone, oldJoukkueViite: joukkue}));
    }

    // Vahan kompeloa ja kankeaa, mutta tehdaan nyt tallinen ratkaisu jotta saadaan ohjelma valmiiksi joskus. Validointi kannattaisi laittaa 
    // komponentteihin itseensa, mutta koska toteutin komponentit hieman hassusti, niin tama on nyt helpompaa.
    validateInputs() {
      var jNimiInput = $('#joukkueNimi');
      var luontiaikaInput = $('#luontiaika');

      // Ei validoida.
//      var GPS = $('#2H');
//      var NFC = $('#4H');
//      var QR = $('#8H');


      var jasenetInputs = $('#jasenet').find('input:not(:last)'); 

      const tarkistaLeimausTapa = i => {
        var leimaukset = $('#leimaustapaBoxit input');
	var leimauksia = [];
        leimaukset.each((i,elem) => {
          if (elem.checked) leimauksia.push(elem); 
	});
	if (leimauksia.length === 0) {
          i.setCustomValidity("Sinun täytyy valita ainakin yksi leimaustapa.");
	  return false;
	}
	else {
          i.setCustomValidity("");
	  return true;
	}
      };

      // Funktio, joka tarkastaa sen, onko elementin value tyhja.
      const nonEmpty = i => {
        if (i.value.trim().length !== 0) { i.setCustomValidity(""); return true; } 
	i.setCustomValidity("Sinun täytyy antaa validi nimi. (ei ainoastaan tyhjiä merkkejä).");
	return false;
      };

      // Funtio, joka tarkastaa sen, onko elementien valuemissin true.
      const req = i => {
        if (i.validity.valueMissing === true) { i.setCustomValidity("Kentta ei saa olla tyhjä."); return false; } 
	i.setCustomValidity("");
	return true;
      };

      // Tsekkaat patternin.
      const patternCheck = i => {
        if (i.validity.patternMismatch === true) { i.setCustomValidity("Ajan taytyy olla muotoa pp.kk.vvvv --:--."); return false; } 
	else { i.setCustomValidity(""); return true; }
      };

      // Tsekkaa onko parsittu aika kunnollinen aika.
      const pvmCheck = i => {
        const pattern = /(\d\d)\.(\d\d)\.(\d\d\d\d) (\d\d):(\d\d)/; 
	let [_,p,kk,v,h,m] = pattern.exec(i.value) || []; 
	var aika = new Date(`${v}-${kk}-${p}T${h}:${m}:00`);
        if (i.validity.patternMismatch === true) { i.setCustomValidity("Ajan taytyy olla muotoa pp.kk.vvvv --:--."); return false; } 
        else if (aika.toString() === 'Invalid Date') { i.setCustomValidity("Aika on oikeaa muotoa, mutta muuten vain kelvoton."); return false; } 
	else { i.setCustomValidity(""); return true; }
      };

      // Funtio, joka tarkistaa onko annetussa jquery is joukossa vahintaan n kappaletta valueita, jotka eivat ole tyhjia.
      const nNonEmpties = (is, n) => {
        var nonEmpty = [];
	// Lasketaan ei tyhjia inputelementteja.
        is.each((i,elem) => {
	  if (elem.value.trim().length !== 0) nonEmpty.push(elem);
	});
        is.each((i, elem) => {
	  if (nonEmpty.length < n) {
            elem.setCustomValidity(`Sinun täytyy antaa vähintään ${n} jäsentä.`);
	    return false;
	  }
	  else elem.setCustomValidity("");
	  return true;
	});
      };
      
      /* Nimi-input tarkistus */
      var nimi = jNimiInput.get(0);
      req(nimi) && nonEmpty(nimi);

      /* Jasenten tarkistus */
      nNonEmpties(jasenetInputs,2);

      /* Luontiajan tarkistus. */
      var luontiaika = $('#luontiaika').get(0);
      if (luontiaika.value.trim().length !== 0) { patternCheck(luontiaika) && pvmCheck(luontiaika);}
      else luontiaika.setCustomValidity("");

      /* Leimausten tarkistus. */
        var leimaukset = $('#leimaustapaBoxit input');
	leimaukset.each((i,elem) => {
          if (!tarkistaLeimausTapa(elem)) return false;
	});
    }
    
    // Tapahtuman kasittelija sille, kun sarjan checkboxia klikataan. 
    // Nyt itse e on nullified kts. synthetic events, mutta esim. e.target toimii.
    // Eli sarjan radiobuttonin painallus luo uuden joukkueNow olion, johon on paivitetty sarja, ja setState 
    // hoitaa piirron paivityksen. Pitaisi olla Reactin mukainen ajatusmalli.
    handleCheckChange(e) {
      // Selvtetaan sarjaa vastaava id.
      var sarjaID = createSarjaMappings().find(x => x.nimi === e.target.id).id;
      this.setState((oldState) => { 
        
        // Paivitetaan statea. Vanha joukkueet pidetaan samana, mutta joukkueNow kloonataan siten, etta sarja muuttuu. 
        // Nyt Object.assing toimii, silla Joukkue-olion propertyt ovat yksitasoisia/simppeleita. TODO: testaa onko nain.
        return {rastit: oldState.rastit, 
	        joukkueet: oldState.joukkueet,
                joukkueNow: Object.assign({}, oldState.joukkueNow, {sarja: sarjaID}),
		oldJoukkueViite: oldState.oldJoukkueViite}}); 
    }

    // Tapahtuman kasittelija leimaustapa checkbokseille.
    handleLeimaustapaCheck(e) {
      var checked = e.target.checked;
      var leimaustapa = e.target.id;
      var leimaustapaClone = Array.from(this.state.joukkueNow.leimaustapa);
      // Uncheckattiin leimaus tapa, joten poistetaan se leimaustapa listasta.
      if (checked === false) {
        leimaustapaClone.splice(leimaustapaClone.indexOf(e.target.id),1);
      }
      // Muussa tapauksessa lisataan leimaustapa listaan.
      else leimaustapaClone.push(e.target.id);

      // Muutetaan tilaa joukkueNowin osalta.
      this.setState((oldState) => { 
        return {rastit: oldState.rastit, 
	        joukkueet: oldState.joukkueet,
                joukkueNow: Object.assign({}, oldState.joukkueNow, {leimaustapa: leimaustapaClone}),
		oldJoukkueViite: oldState.oldJoukkueViite}}); 
        
      // Poistetaan validoinnit, muuten jaavat kummittelemaan.
      var leimaukset = $('#leimaustapaBoxit input');
      leimaukset.each((i,elem) => {
        elem.setCustomValidity("");
      });
    }

    // Kasitellaan rastikoodin klikkaus.
    handleRastileimausClick(e) {
      // TODO
      var item = e.target;
      // Selvitetaan indeksi, jossa koodi asustaa html-rakentessa.
      var itemParent = $(item).parents('.rastiDiv').get(0);
      var ind = $('.rastiDiv').index(itemParent);
      var rastitClone = this.cloneRastit(this.state.rastit, false);
      for (let x of rastitClone) x.active = false;
      rastitClone[ind].active = true; 
      this.setState((oldState) => ({rastit: rastitClone, joukkueet: oldState.joukkueet, joukkueNow: oldState.joukkueNow, oldJoukkueViite: oldState.oldJoukkueViite}));
    }

    koodiChanged(e) {
       console.log(e.target);
    }

    // Tapahtuman kasittelija jasenkentan muokkausta varten.
    handleJasenKenttaInput(e) {
      var jasenetClone = Array.from(this.state.joukkueNow.jasenet);
      var index = parseInt(e.target.id.replace('Jasen','',10))-1;
      var value = e.target.value;
      jasenetClone[index] = value;

      this.setState((oldState) => { 
        return {rastit: oldState.rastit, 
	        joukkueet: oldState.joukkueet,
                joukkueNow: Object.assign({}, oldState.joukkueNow, {jasenet: jasenetClone}), oldJoukkueViite: oldState.oldJoukkueViite}});
    }

    handleNimiInput(e) {
      var target = e.target;
      var value = e.target.value;

      // Muutetaan tilaa joukkueNowin osalta.
      this.setState((oldState) => { 
        return {rastit: oldState.rastit, 
	        joukkueet: oldState.joukkueet,
                joukkueNow: Object.assign({}, oldState.joukkueNow, {nimi: value}), oldJoukkueViite: oldState.oldJoukkueViite}});
    }

    handleAikainput(e) {
      var target = e.target;
      var value = e.target.value;
      console.log("handleAikainput");
      console.log(value);

      // Muutetaan tilaa joukkueNowin osalta.
      this.setState((oldState) => { 
        return {rastit: oldState.rastit, 
	        joukkueet: oldState.joukkueet,
                joukkueNow: Object.assign({}, oldState.joukkueNow, {luontiaika: value}), oldJoukkueViite: oldState.oldJoukkueViite}});
    }

    // Tarkistetaan lomakkeen virheet.
    handleTallennaButton(e) {
      e.preventDefault();
      this.validateInputs(); 
      var form = $("#lisaaJoukkueForm").get(0);
      // Jos on virheita, niin poistutaan.
      if ($("#lisaaJoukkueForm").get(0).reportValidity() === false) return;
      // Tallennetaan muutokset.

      // Kloonaataan edelliset joukkueet.
      var joukkueet = this.cloneJoukkueet(this.state.joukkueet);

      // Tutkitaan sita, ollaanko muokkaamassa olemassaolevaa joukkuetta vai kasitellaanko ihan uutta joukkuetta.
      var indeksi = this.state.joukkueet.indexOf(this.state.oldJoukkueViite);
      var j1 = this.cloneJoukkue(this.state.joukkueNow);
      // Siivoillaan jasenia.
      j1.jasenet = j1.jasenet.filter(x => x.trim().length !== 0).map(z => z.trim());
      if (typeof j1.luontiaika === 'string' && j1.luontiaika.length > 0) {
        j1.luontiaika = convertoiPisteMuotoToViiva(j1.luontiaika);
      }

      // Ei ollut entuudestaan.
      if (indeksi === -1) {
	joukkueet.push(j1);
      }

      // Oli entuudestaan.
      else {
        joukkueet[indeksi] = j1;
      }

      console.log("j1");
      console.log(j1);

      var uusiJoukkue = this.createNewJoukkue(joukkueet)

      // Asetetaan uusi state.
      this.setState((oldState) => {console.log(oldState.joukkueet); console.log(joukkueet);return {
            rastit  : oldState.rastit, 
	    joukkueet : joukkueet,
	    joukkueNow: uusiJoukkue, // Annetaan argumenttina joukkueet, silla this.state on viela undefined.
	    oldJoukkueViite: uusiJoukkue};});
    }

    koodilostfocus(e) {
      var item = e.target;
      // Selvitetaan indeksi, jossa koodi asustaa html-rakentessa.
//      var itemParent = $(item).parents('.rastiDiv').get(0);
//      var ind = $('.rastiDiv').index(itemParent);
      var rastitClone = this.cloneRastit(this.state.rastit, false);
      for (let x of rastitClone) x.active = false;
//      rastitClone[ind].active = true; 
      this.setState((oldState) => ({rastit: rastitClone, joukkueet: oldState.joukkueet, joukkueNow: oldState.joukkueNow, oldJoukkueViite: oldState.oldJoukkueViite}));

    }

    // Piirretaan koko sivusto. Leimaustavas olisi voinnut hakea datasta. Jos aikaa jaa, niin tehdaan oma funktio, joka palauttaa leimaustavat.
    // Ei taman tehtavan kannalta kovinkaan tarkea asia. Tapahtuman kasittelijat laitetaan labmda funktiona, niin this otetaan sulkeuman ulkopuolelta. 
    // Ei tarvitse bindailla.
    render () {
      return (
        <div className="kokohoska">
          <LisaaJoukkue joukkueNow={this.state.joukkueNow} 
	                leimaustavat={["GPS","NFC","QR","Lomake"]}
			handleCheckChange={(e)=>this.handleCheckChange(e)}
			handleLeimaustapaCheck={(e) => this.handleLeimaustapaCheck(e)}
			kenttaChanged={(e) => this.handleJasenKenttaInput(e)}
			nimikenttaChanged={(e) => this.handleNimiInput(e)}
			aikakenttaChanged={(e) => this.handleAikainput(e)}
			handleTallennaButton={(e) => this.handleTallennaButton(e)}/>
          <Joukkuelistaus joukkueet={this.state.joukkueet} clickHandler={(e) => this.joukkueClick(e)} rastit={this.state.rastit}/>
	  <RastiListaus rastit={this.state.rastit} lostfocus = {(e) => this.koodilostfocus(e)} handleRastileimausClick = {(e) => this.handleRastileimausClick(e)} koodiChanged = {(e) => {this.koodiChanged(e)}}/>
        </div>
      )
    }
}


/**************************************************************
 *
 * Joukkuelistaaus definition.
 *
 **************************************************************/

/* Lisaa joukkue componentti. */
class Joukkuelistaus extends React.Component {
    constructor(props) {
      super(props);
    }

    render () {
      return (
        <div id="joukkuelistausDiv">
          <p id="joukkueetP">Joukkueet</p>
            <JListaus joukkueet={this.props.joukkueet} clickHandler={this.props.clickHandler} rastit={this.props.rastit}/>            
        </div>
      )
    }
}

/**************************************************************
 *
 * RastiListaus definition.
 *
 **************************************************************/

/* Lisaa joukkue componentti. */
class RastiListaus extends React.Component {
    constructor(props) {
      super(props);
    }

    render () {
      return (
        <div id="rastilistausDiv">
          <p id="rastilistausP">Rastit</p>
            <RListaus rastit={this.props.rastit} lostfocus = {this.props.lostfocus} koodiChanged = {this.props.koodiChanged} handleRastileimausClick={this.props.handleRastileimausClick}/>            
        </div>
      )
    }
}

/**************************************************************
 *
 * RListaus definition. 
 *
 **************************************************************/

/* Rasti-listaus komponenti. */
class RListaus extends React.Component {
    constructor(props) {
      super(props);
    }

    render () {
      return (
        <ul>
        {this.props.rastit.map((x) => <Rasti key={x.id + "r"} lostfocus = {this.props.lostfocus} rasti={x} koodiChanged = {this.props.koodiChanged} handleRastileimausClick={this.props.handleRastileimausClick}/>)}
        </ul>
      )
    }
}

/**************************************************************
 *
 * Rasti definition. 
 *
 **************************************************************/

/* Rasti komponenti. */
class Rasti extends React.Component {
    constructor(props) {
      super(props);
      this.componentDidUpdate = this.update;
    }

    // Kun paivitetaan, niin asetetaan input-kentta aktiiviseksi.
    update() {
      var input = $('.rastiDiv input').get(0);
      if (input !== undefined) input.select();
    }

    laskePiste(rasti) {
      var p = parseInt(rasti["koodi"][0],10);
      if (isNaN(p)) return "0";
      return p;
    }

    createRastiKoodi() {
      console.log(this.props.rasti.active);
      if (this.props.rasti.active) {
        return (
          <TietoLabel iName="" type="text" size={10} content="" lostfocus = {this.props.lostfocus} kenttaValue={this.props.rasti.koodi} nimikenttaChanged = {this.props.koodiChanged} select={true}/>
	)
      }
      else return (
	    <label className="koodi">
	      {this.props.rasti.koodi}
	    </label>
      )
    }
    

    render () {
      return (
        <li className="rastiDiv" onClick={this.props.handleRastileimausClick}>
	  <div>
	    {this.createRastiKoodi()}
	    <label>
	      {` ( ${this.laskePiste(this.props.rasti)} )`}
	    </label>
	  </div>
	  <div>
            <label>
	      {`${this.props.rasti.lat}, ${this.props.rasti.lon}`}
	    </label>
	  </div>
        </li>
      )
    }
}
/**************************************************************
 *
 * JListaus definition. 
 *
 **************************************************************/

/* Lisaa joukkue componentti. */
class JListaus extends React.Component {
    constructor(props) {
      super(props);
    }

    render () {
      return (
        <ul>
        {this.props.joukkueet.map(x => {return <JoukkueListItem key={x.id} joukkue={x} rastit={this.props.rastit} klikkaus={this.props.clickHandler}>{x.nimi}</JoukkueListItem>})}
        </ul>
      )
    }
}

/**************************************************************
 *
 * JoukkueListItem definition. 
 *
 **************************************************************/

/* Lisaa joukkue componentti. */
class JoukkueListItem extends React.Component {
    constructor(props) {
      super(props);
    }

    render () {
      const matkaJaAika = laskeMatkaJaPisteet(this.props.joukkue, this.props.rastit);
//      const ma = `(${matkaJaAika.pisteet} p, ${Math.round(matkaJaAika.matka*Math.pow(10,0)/Math.pow(9,0))} km)`;
      const ma = `(${matkaJaAika.pisteet} p, ${Number((matkaJaAika.matka).toFixed(1))} km)`;
      const tiedot = `${createSarjaMappings().find(x => x.id === this.props.joukkue.sarja).nimi} (${this.props.joukkue.leimaustapa.join()})`;
      const jasenet = this.props.joukkue.jasenet.map((x,i) => <li key={`${x}${i}`}>{x}</li>);
      return(
        <li>
          <div>
	    <p>
	      <a onClick={this.props.klikkaus} href="">{this.props.joukkue.nimi}</a>
	      <label>{ma}</label>
	    </p>
	    <div>
	      <label>{tiedot}</label>
	        <ul>
	          {jasenet}
	        </ul>
	    </div>
	  </div>
        </li>
      )
    }
}
/**************************************************************
 *
 * LisaaJoukkue definition. 
 *
 **************************************************************/

/* Lisaa joukkue componentti. */
class LisaaJoukkue extends React.Component {
    constructor(props) {
      super(props);
    }

    render () {
      const inputSize = 35;
      return (
        <form id="lisaaJoukkueForm" onSubmit={this.props.handleTallennaButton} noValidate="novalidate" >
          <p id="lisaaJoukkueP">Lisää joukkue</p>
          <JoukkueenTiedot iSize={inputSize} sarjat={this.props.sarjat} 
	                   joukkueNow={this.props.joukkueNow} 
			   leimaustavat={this.props.leimaustavat} 
			   handleCheckChange={this.props.handleCheckChange}
			   handleLeimaustapaCheck = {this.props.handleLeimaustapaCheck}
			   nimikenttaChanged = {this.props.nimikenttaChanged}
			   aikakenttaChanged={this.props.aikakenttaChanged}/>
          <Jasenet iSize={inputSize} jasenet={this.props.joukkueNow.jasenet} kenttaChanged={this.props.kenttaChanged}/>
          <input id="tallennaButton" value="Tallenna" type="submit"/>
        </form>
      )
    }
}

/**************************************************************
 *
 * JoukkueenTiedot definition. 
 *
 **************************************************************/

/* Lisaa joukkue componentti. */
class JoukkueenTiedot extends React.Component {
    constructor(props) {
      super(props);
    }

    // Luo sarja-komponentit. Asettaa sarja valinnan riippuen joukkueNow.sarjasta.
    createSarja() {
      var sarjat = createSarjaMappings();
      var sarjaComponents = [];
      for (let x of sarjat) {
        var checked = x.id === this.props.joukkueNow.sarja ? true : false;
        sarjaComponents.push(<TietoLabel key={x.nimi} iName={x.nimi} nName="SARJA" type="radio" size="2" content={x.nimi} isChecked={checked} handleCheckChange={this.props.handleCheckChange}
	                                 handleLeimaustapaCheck = {this.props.handleLeimaustapaCheck}/>);
      }
      return sarjaComponents; 
    }

    // Luo leimaustavat. Asettaa checked paikoilleen riippuen joukkueNow.leimaustavasta. 
    createLeimausTavat() {
      var leimaustavat = [];
      for (let x of this.props.leimaustavat) {
        var checked = this.props.joukkueNow.leimaustapa.find(y => x === y) === undefined ? false : true;
        leimaustavat.push(<TietoLabel key={x} iName={x} type="checkbox" size="2" content={x} isChecked={checked} handleLeimaustapaCheck={this.props.handleLeimaustapaCheck}/>);
      }
      return leimaustavat;
    }

    render () {
      const joukkue = this.props.joukkueNow;
      var luontiaika = joukkue.luontiaika;
      var kValue = "";
      if (luontiaika !== null && luontiaika !== undefined) kValue = luontiaika;
      return (
        <fieldset id="joukkueenTiedotFieldSet">
          <legend>Joukkueen tiedot</legend>
          <TietoLabel iName="joukkueNimi" type="text" size={this.props.iSize} content="Nimi" kenttaValue={joukkue.nimi} nimikenttaChanged = {this.props.nimikenttaChanged}/>
          <TietoLabel iName="luontiaika" type="text" pPattern='[0-9]{2}\.[0-9]{2}\.[0-9]{4} [0-9]{2}:[0-9]{2}' size={this.props.iSize-5} content="Luontiaika" kenttaValue={kValue} pHolder="pp.kk.vvvv --:--" aikakenttaChanged = {this.props.aikakenttaChanged}/>
          <div id="leimaustavatDiv">
            <div id="leimaustapaText">Leimaustapa</div>
            <div id="leimaustapaBoxit">
	      {this.createLeimausTavat()}
            </div>
          </div>
          <div id="sarjatDiv">
            <div id="sarjaText">Sarja</div>
              <div id="sarjaBoxit">
	      {this.createSarja()}
              </div>
          </div> 
        </fieldset>
      )
    }
}

/**************************************************************
 *
 * Jasenet. Huom. jos laitat inputin valueksi null tai undefined, niin talloin mennaan uncotrolled tilaan ainakin reactin varoitusten mukaan. 
 *
 **************************************************************/

/* Lisaa joukkue componentti. */
class Jasenet extends React.Component {
    constructor(props) {
      super(props);
    }

    // Luo jasen kentat, vahintaan 2 mutta maksimissaan 5. Ja luo valmiiksi yhden tyhjan kentan, jos jasenia on vahemman kuin 5.
    createJasenet() {
      var jasenet = [];
      var length = Math.min(this.props.jasenet.length,4)+1;
      if (length < 2) length = 2;
      for (let i=0; i<length; i++) {
        var genKey = `Jasen${i+1}`;
	var empty = "kauko";
	var nimi = undefined;
	if (this.props.jasenet[i] === undefined) nimi = "";
	else nimi = this.props.jasenet[i];
			  
        jasenet.push(<TietoLabel key={genKey} iName={genKey} type="text" size={this.props.iSize} content={genKey} kenttaValue={nimi}
	                         kenttaChanged={this.props.kenttaChanged} />);
      }
      return jasenet;
    }

    render () {
      return (
        <fieldset id="jasenet">
          <legend>Jasenet</legend>
	  {this.createJasenet()}
        </fieldset>
      )
    }
}


/**************************************************************
 *
 * TietoLabel. 
 *
 **************************************************************/

/* Lisaa joukkue componentti. Ehka olisi kannattanut luoda erikseen erityyppiset kompnentit text/checkbox/radiolle. */
/* HUOM: React laittaa onInput tapahtumankasittelijan myos onChangeen. */
class TietoLabel extends React.Component {
    constructor(props) {
      super(props);
    }

    render () {
      // Oletuksena annetaan kasittelija, joka ei tee mitaan. Jos jattaa nulliksi, niin heittaa toisinaan herjaa!
      var onchangeCallBack = x => {} ;
      var onInputCallBack = null;
      var req = "";
      // Riippuen inputin tyypista valitaan oikea tapahtumankasittelija.
      if (this.props.type === "checkbox") onchangeCallBack = this.props.handleLeimaustapaCheck;
      else if (this.props.type === "radio") onchangeCallBack = this.props.handleCheckChange;

      if (this.props.iName === "joukkueNimi") {
        onInputCallBack = this.props.nimikenttaChanged;
        //onchangeCallBack = this.props.nimikenttaChanged;
        req = "required";	
      }
      else if (this.props.iName.startsWith("Jasen")) {
        onInputCallBack = this.props.kenttaChanged;
        //onchangeCallBack = this.props.kenttaChanged;
      }
      else if (this.props.iName === "luontiaika")
        onInputCallBack = this.props.aikakenttaChanged;
      return (
        <p>
          <label htmlFor={this.props.iName} >{this.props.content}</label>
          <input id={this.props.iName}
	         value={this.props.kenttaValue}
	         type={this.props.type}
		 required={req}
		 name={this.props.nName}
		 size={this.props.size}
		 pattern={this.props.pPattern}
		 placeholder={this.props.pHolder}
		 checked={this.props.isChecked}
		 onChange={onchangeCallBack}
		 onBlur={this.props.lostfocus}
		 onInput={onInputCallBack}/>
        </p>
      )
    }
}

/*****************************************************************************************************************************************/

ReactDOM.render(
    <App />,
  document.getElementById('root')

);
