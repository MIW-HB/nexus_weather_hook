/**
 *  Base class for all hooks
 *  @author Marc Fiedler
 *  @copyright 2017 Blackout Technologies
 */

// Use Strict mode ECMA Script 5+
"use_strict";

// 3rd party includes
const rp = require('request-promise');
const findRoot = require('find-root');

// system includes
const fs = require('fs');

// local includes
const LanguageDict = require('./languageDict.js');

module.exports = class Hook {
    constructor(path, language){
        this.json = undefined;  
        this.path = path || findRoot(process.cwd());
        language = language||'de-DE';

        // load the hook's cpnfig
        this.config = JSON.parse(fs.readFileSync(this.path+'/package.json', 'utf-8'));
        this.captions = new LanguageDict(path, language);
        console.log(this.config.title+" v"+this.config.version+" loaded");

        //Ein paar Dinge für die Kinder des BundesligaHook
        this.BLH = {
            "host" : this.captions.get('Host'), //Url OpenLigaDB
            "myClubId" : this.captions.get('MeinClubId'), //ClubId laut OpenLigaDB"
            "currentSeason" :  new Date().getFullYear(), //Aktuelle Saison i.e. 2018
            "liga" : this.captions.get('MeinClubLiga'),  //In welcher Liga spielt mein Club laut Openliga i.e. bl1
            "currentLeagueID" : null, //Ändert sich mit jeder Saison in OpenLigaDb
            "currentMatchDay" : null,//aktueller Spieltag i.e. 1-34
            "avgGoalsGot" : null, //Durchscnittstorverhältnis bekommen aller Teams
            "avgGoalsShot" : null, //Durchscnittstorverhältnis geschossen aller Teams
            "callback" : null //Funktion -> Gibt die Antwort an Nexus zurück in index.js::exit();
        };
    }

    loadTraining(intent, phrase, position, complete){
        if( this.prepareTraining != undefined ){
            this.prepareTraining(phrase, (intents) => {
                complete(position, intents);
            });
        }else{
            // return empty state since, anyway this hook doesn't
            // create any training data.
            complete(position, []);
        }
    }

    request(method, url, body, complete){
        rp({
            method: method,
            uri: url,
            body: body,
            json: true // Automatically stringifies the body to JSON
        }).then((resp) => {
            complete(resp);
        });
    }

    handleMessage(intent, text, session, complete){
        try {
            this.process(intent, text, session, complete);
        } catch (e) {
            console.dir(e);
            complete({
                answer: "Error in hook: "+JSON.stringify(e),
                platform: {}
            })
        }
    }
}
