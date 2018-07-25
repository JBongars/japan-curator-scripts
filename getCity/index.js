
// ===========================================================
// START OF PROGRAM
// ===========================================================

const fs = require('fs');
// const file = fs.createWriteStream('./result.tsv');

let saveJSON = (fileName, json, cb) => fs.writeFile(fileName, JSON.stringify(json), 'utf8', cb);
let sterilizeString = (a) => {
    if(a == null) return 'null';
    if(typeof a == 'undefined') return 'undefined'
    else return a.replace(/[^a-zA-Z]/g, '').toLowerCase();
}
let compareString = (a, b) => sterilizeString(a) == sterilizeString(b);

const prefectures = require('./prefecture.json');
const cities = require('./cities.json');

//terminal bash
const exec = require('child_process').exec;

let result = {};
let result_unordered = {};

// ===========================================================
// By City - adds 'undefined field'
// ===========================================================
// cities.forEach(city => {
//     let key = city.prefecture_en;
//     if(typeof key !== 'string') key = 'Miscellaneous';
//     if(typeof result_unordered[key] == 'undefined'){
//         result_unordered[key] = Object.assign({}, prefectures[key]);
//         result_unordered[key].cities = [];
//     }
//     delete city.prefecture_en;
//     result_unordered[key].cities.push(city);
// });

// Object.keys(prefectures).filter(key => typeof result_unordered[key] == 'undefined').forEach(key => result_unordered[key] = prefectures[key])

// Object.keys(result_unordered).sort().forEach(key => {
//     result[key] = result_unordered[key];
// })

// ===========================================================
// By City - change city name ending to shi, ku, cho, mura
// ===========================================================
let newAppendStr = 'shi';
cities.forEach(city => {
    switch (city.city_ja_full.charAt(city.city_ja_full.length - 1)) {
        case "市":
            newAppendStr = 'shi';
            break;
        case "町":
            newAppendStr = 'cho';
            break;
        case "村":
            newAppendStr = 'mura';
            break;
        case "区":
            newAppendStr = 'ku';
            break;
    }

    let cityEnArr = city.city_en.split('-');
    if (cityEnArr[cityEnArr.length-1] == 'ku') {
        cityEnArr.splice(cityEnArr.length-1, 1);
        city.city_en = cityEnArr.join('-');
    }

    city.city_full_en = city.city_en + '-' + newAppendStr;
});

// ===========================================================
// By Prefecture - missing cities
// ===========================================================

Object.keys(prefectures).sort().forEach(key => {
    result[key] = prefectures[key];
    result[key].cities = cities.
        filter(elem => compareString(elem.prefecture_en, key)).
        sort((a, b) => a.city_en > b.city).
        map(elem => {
            delete elem.prefecture_en;
            return elem;
        });
})


// ===========================================================
// END OF PROGRAM
// ===========================================================

saveJSON('./getCity/result.json', result, () => {
     console.log('done!');
})
