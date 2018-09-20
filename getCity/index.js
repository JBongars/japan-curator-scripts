
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

let genAddressObj = (elem) => (type, obj) => Object.assign(obj, 
    type == 'prefecture' ? { } : { postal_code: elem.postal_code }, { 
        [type + '_en']: elem[type + '_en'], 
        [type + '_jp']: elem[type + '_jp']
    }
);

getCSV(path.join(__dirname, "../jp_postal_codes.csv"), data => {
    
    let elem = {
        postal_code: data.postal_code,
        
        //english
        prefecture_en: capFirstLetter(data.prefecture_en || ""),
        city_en: capFirstLetter(matchStr(data.city_district_en, /.*(?= SHI)/g)),
        district_en: capFirstLetter(matchStr(data.city_district_en, /.*(?= KU)/g)),
        township_en: capFirstLetter(data.township_en || ""),

        //japanese
        prefecture_jp: data.prefecture_jp || "",
        city_jp: data.city_district_jp.split(' ')[0],
        district_jp: data.city_district_jp.split(' ')[1] || "",
        township_jp: data.township_jp || ""
    }

    //there was literally no cleaner way I thought how to do this...
    let gen = genAddressObj(elem);
    if(typeof city_prefecture[elem.prefecture_en] == 'undefined') {
        city_prefecture[elem.prefecture_en] = 
            gen('prefecture', {
                cities: gen('city', {
                    districts: gen('disctrict', {}),
                    townships: gen('township', {})
        })})

    } else {
        if(typeof city_prefecture[elem.prefecture_en] == 'undefined') city_prefecture[elem.prefecture_en] = {}
        if(!Array.isArray(city_prefecture[elem.prefecture_en].cities)) city_prefecture[elem.prefecture_en].cities = [];
        let city_i = city_prefecture[elem.prefecture_en].cities.findIndex(i => i.city_jp == elem.city_jp)

        if(city_i < 0){
            city_prefecture[elem.prefecture_en].cities.push(gen('city', { districts: gen('district', { townships: gen('township', {})})}))
        } else {
            if(!Array.isArray(city_prefecture[elem.prefecture_en].cities[city_i].districts)) city_prefecture[elem.prefecture_en].cities[city_i].districts = [];
            if(!Array.isArray(city_prefecture[elem.prefecture_en].cities[city_i].townships)) city_prefecture[elem.prefecture_en].cities[city_i].townships = [];

            if(city_prefecture[elem.prefecture_en].cities[city_i].districts.findIndex(i => i.district_jp == elem.district_jp) < 0){
                city_prefecture[elem.prefecture_en].cities[city_i].districts.push(gen('district', {}))
            }
            if(city_prefecture[elem.prefecture_en].cities[city_i].townships.findIndex(i => i.township_jp == elem.township_jp) < 0){
                city_prefecture[elem.prefecture_en].cities[city_i].townships.push(gen('township', {}))
            }
        }
    }
    postal_code.push(data)


}).then(() => {
    Promise.all([
        saveJSON('./getCity/city_prefecture.json', city_prefecture),
        saveJSON('./getCity/city_prefecture_sample.json', sliceObj(city_prefecture, 1, 2)),
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
