
// ===========================================================
// START OF PROGRAM
// ===========================================================

const fs = require('fs');
const path = require('path');
const csvProcessor = require('fast-csv'); //csv processor
const exec = require('child_process').exec; //terminal bash
const _ = require('lodash');


let getCSV = (file, cb) => new Promise((resolve, reject) => {
    fs.createReadStream(file).pipe(csvProcessor({ headers: true }))
        .on("data", cb)
        .on("end", resolve)
});

let saveJSON = (fileName, json, pretty=false) => new Promise((resolve, reject) => fs.writeFile(fileName, JSON.stringify(json, null, pretty ? 4 : undefined), 'utf8', resolve));
let sterilizeString = (a) => {
    if(a == null) return 'null';
    if(typeof a == 'undefined') return 'undefined'
    else return a.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

let sliceObj = (obj, start=0, end=false) => {
    end = end || Object.keys(obj).length;
    result = {}
    Object.keys(obj).slice(start, end).forEach(key => {
        result[key] = obj[key];
    })
    return result;
}

let capFirstLetter = s => s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
let compareString = (a, b) => sterilizeString(a) == sterilizeString(b);
let matchStr = (s, reg) => Array.isArray(s.match(reg)) ? s.match(reg) : [];


let city_prefecture = {};
let postal_code = [];
let cities = [];

getCSV(path.join(__dirname, "../jp_postal_codes.csv"), data => {

    let city_d = data.city_district_en.split(' ');
    
    let item = {
        postal_code: data.postal_code,
        
        //english
        prefecture_en: capFirstLetter(data.prefecture_en.split(' ')[0] || ""),
        cities_en: matchStr(data.city_district_en, /[\w]+ (SHI|GUN|KU)/gi),

        //japanese
        prefecture_jp: data.prefecture_jp || "",
        // \u3000 = japanese space
        cities_jp: matchStr(data.city_district_jp, /([\u3001-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2190-\u2195]|\u203B)+(市|郡|区)/g),

    }

    item.cities = [];

    // create prefecture
    if(Object.keys(city_prefecture).findIndex(elem => elem == item.prefecture_en) < 0){
        city_prefecture[item.prefecture_en] = {
            en: item.prefecture_en,
            jp: item.prefecture_jp,
            cities: []
        }
    }
    
    // get item.cities
    for(let i = 0; i < item.cities_en.length; i++){
        item.cities.push({
            city_en: capFirstLetter(item.cities_en[i].split(' ')[0]),
            city_full_en: capFirstLetter(item.cities_en[i]),
            city_type_en: item.cities_en[i].split(' ')[1].toUpperCase(),
            city_ja: item.cities_jp[i]
        })
    }

    if(item.cities.length > 1 && new RegExp(/(SHI|GUN|KU)/gi).test(item.cities[0].city_type_en)){
        // console.log('rejected city is: ', item.cities);
        item.cities.pop(); // remove the second city if the first city is a 'SHI', 'GUN' or 'KU'
    }

    // upload cities in item.cities
    for(let i = 0; i < item.cities.length; i++){
        // if(cities.findIndex(elem => elem.city_en == item.cities[i].city_en) < 0){
            
        // }

        if(city_prefecture[item.prefecture_en].cities.findIndex(elem => elem.city_en == item.cities[i].city_en) < 0){
            
            cities.push(item.cities[i]);

            //push to city_prefecture
            city_prefecture[item.prefecture_en].cities.push({
                city_en: item.cities[i].city_en,
                city_ja: item.cities[i].city_jp,
                type_en: item.cities[i].city_type_en,
                // districts: []
            })

        }
    }

    postal_code.push(data)


}).then(() => {
    Promise.all([
        saveJSON('./getCity/city_prefecture.json', city_prefecture),
        saveJSON('./getCity/cities.json', cities),
        saveJSON('./getCity/postal_code.json', postal_code),
        saveJSON('./getCity/sample/cities_sample.json', cities.slice(0,10), true),
        saveJSON('./getCity/sample/city_prefecture_sample.json', sliceObj(city_prefecture, 10, 11), true),
        saveJSON('./getCity/sample/city_prefecture_tokyo.json', city_prefecture['Tokyo'], true),

    ]).then(() => {
        console.log('done!');
    })
});

// ===========================================================
// By City - change city name ending to shi, ku, cho, mura
// ===========================================================
// let newAppendStr = 'shi';
// cities.forEach(city => {
//     switch (city.city_ja_full.charAt(city.city_ja_full.length - 1)) {
//         case "市":
//             newAppendStr = 'shi';
//             break;
//         case "町":
//             newAppendStr = 'cho';
//             break;
//         case "村":
//             newAppendStr = 'mura';
//             break;
//         case "区":
//             newAppendStr = 'ku';
//             break;
//     }

//     city.city_en = city.city_en.charAt(0).toUpperCase() + city.city_en.substr(1);
//     let cityEnArr = city.city_en.split('-');
//     if (cityEnArr[cityEnArr.length-1] == 'ku') {
//         cityEnArr.splice(cityEnArr.length-1, 1);
//         city.city_en = cityEnArr.join('-');
//     }

//     city.city_full_en = city.city_en + '-' + newAppendStr;
// });




// ===========================================================
// By Prefecture - missing cities
// ===========================================================

// Object.keys(prefectures).sort().forEach(key => {
//     result[key] = prefectures[key];
//     result[key].cities = cities.
//         filter(elem => compareString(elem.prefecture_en, key)).
//         sort((a, b) => a.city_en > b.city).
//         map(elem => {
//             delete elem.prefecture_en;
//             return elem;
//         });
// })
