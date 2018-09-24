
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
let matchStr = (s, reg) => Array.isArray(s.match(reg)) ? s.match(reg)[0] : "";


let city_prefecture = {};
let postal_code = [];


getCSV(path.join(__dirname, "../jp_postal_codes.csv"), data => {

    let city_d = data.city_district_en.split(' ');
    
    let item = {
        postal_code: data.postal_code,
        
        //english
        prefecture_en: capFirstLetter(data.prefecture_en.split(' ')[0] || ""),
        city_en: capFirstLetter(matchStr(data.city_district_en, /.*(?= SHI|GUN)/gi)),
        city_type_en: data.city_district_en.split(' ')[1].toUpperCase(),
        district_en: capFirstLetter(data.city_district_en.split(' ').splice(2).join(' ')),
        // township_en: capFirstLetter(data.township_en || ""),

        //japanese
        prefecture_jp: data.prefecture_jp || "",
        city_jp: data.city_district_jp.split(' ')[0],
        district_jp: data.city_district_jp.split('　')[1] || "",
        // township_jp: data.township_jp || ""
    }

    if(Object.keys(city_prefecture).findIndex(elem => elem == item.prefecture_en) < 0){
        city_prefecture[item.prefecture_en] = {
            en: item.prefecture_en,
            jp: item.prefecture_jp,
            cities: []
        }
    }

    if(item.city_en){
        if(city_prefecture[item.prefecture_en].cities.findIndex(elem => elem.city_en == item.city_en) < 0){
            city_prefecture[item.prefecture_en].cities.push({
                city_en: item.city_en,
                city_ja: item.city_jp,
                type_en: item.city_type_en,
                districts: []
            })
        }
        // allow only 'ku' and not 'mura'
        if(item.district_en && new RegExp(/(?= ku)/gi).test(item.district_en)){
            if(city_prefecture[item.prefecture_en].cities.find(elem => elem.city_en == item.city_en).districts.findIndex(elem => elem.district_en == item.district_en) < 0){
                let index = city_prefecture[item.prefecture_en].cities.findIndex(elem => elem.city_en == item.city_en);
                city_prefecture[item.prefecture_en].cities[index].districts.push({
                    district_en: item.district_en,
                    district_ja: item.district_jp
                })
            }
        }
    }

    postal_code.push(data)


}).then(() => {
    Promise.all([
        saveJSON('./getCity/city_prefecture.json', city_prefecture),
        saveJSON('./getCity/city_prefecture_sample.json', sliceObj(city_prefecture, 10, 11), true),
        saveJSON('./getCity/city_prefecture_tokyo.json', city_prefecture['Tokyo'], true),
        saveJSON('./getCity/postal_code.json', postal_code),

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
