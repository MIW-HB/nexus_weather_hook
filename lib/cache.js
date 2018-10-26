/**
 *  Legt eine cache.json im filesystem an.
 *  Kann zum cachen benutzt werden.
 * 
 *  @author Michael Töpfer
 *  @copyright 2018 Michael Töpfer
 */

// Use Strict mode ECMA Script 5+
"use_strict";

module.exports = class cache {
    constructor(path){
        //
        this.fs = require('fs');
        this.findRoot = require('find-root');
        this.time = Math.floor(new Date().getTime()/1000);

        this.fileName = "/cache.json";
        this.path = path||this.findRoot(process.cwd());
        this.cache = {
            "alive" :0,
            "data" : {}
        };
        try {
            if (this.fs.existsSync(this.path+this.fileName)) {
                try{
                    this.cache = JSON.parse(this.fs.readFileSync(this.path+this.fileName, 'utf-8'));
                } catch(e){
                    this.setAlive();
                }
            } else {
                if (this.fs.existsSync(this.path)){
                    this.fs.writeFile(this.path+this.fileName, "", (err) => {
                        if (err) throw err;
                    });
                } else {
                    throw "Unable to create cache.json in: "+this.path+". Error in cache.js::constructor()";
                }
            }
            if(!this.isAlive()){
                this.destroy();
            }
        } catch(e){
            throw e;
        }
    }
    /**
     * 
     * @param {String} key 
     * @param {obejct} value
     * cached unter einem Key ein Value
     */
    set(key, value){
        if(!key){
            return false;
        }
        value = value||"";
        this.cache.data[key] = value;
        this._writecache();
    }
    /**
     * 
     * @param {Integer} timestampInSecs 
     * Legt fest, wann der Cache gelöscht wird.
     * (PHP/Unixtimestamp in Sekunden)
     */
    setAlive(timestampInSecs){
        this.cache.alive = parseInt(timestampInSecs)||parseInt(new Date().getTime()/1000)+86400;
        this._writecache();
    }
    /**
     * @return {Integer} 
     * Gibt zurück, bis wann der Cache gültig ist
     * Unix-Timestamp in Sekunden
     */
    getAlive(){
        return this.cache.alive;
    }
    /**
     * @return {boolean}
     * Ist der Cache noch am Leben?
     */
    isAlive() {
        return this.cache.alive > this.time ? true : false;
    }
    /**
     * 
     * @param {String} key
     * @return {Object}
     * Gibt einen Value aus dem Cache zurück 
     */
    get (key){
        if(key && this.cache.data[key]){
            return this.cache.data[key];
        }
        if(key === null || typeof(key)=="undefined"){
            return this.cache.data;
        }
        return "";
    }
    /**
     * 
     * @param {String} key
     * Löscht einen Key + Value aus dem Cache 
     */
    remove(key){
        if(key && this.cache.data[key]){
            delete this.cache.data[key];
            this._writecache();
        }
    }
    /**
     * Löscht den gesamten Cache
     */
    destroy(){
       delete this.cache;
        this.cache = {
            "alive" : 0,
            "data" : {}
        };
        this.cache.alive = this.setAlive();
    }
    _writecache(){
        try {
            this.fs.writeFile(this.path+this.fileName, JSON.stringify(this.cache), (err) => {
                if (err) throw err;
            });
        } catch (e) {
            console.log('Error: '+this.path+this.fileName+" is not writeable");
        }
        
    }
}