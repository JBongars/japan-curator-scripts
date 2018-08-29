
// ===========================================================
// START OF PROGRAM
// ===========================================================

const fs = require('fs');
// const file = fs.createWriteStream('./result.tsv');

let saveJSON = (fileName, json, cb) => fs.writeFile(fileName, JSON.stringify(json, null, 4), 'utf8', cb);
const cities = require('./cities_old.json');

let result = cities.map(elem => {
    // assignments
    elem.city_full_jp = elem.city_ja_full;
    elem.city_jp = elem.city_ja;

    // unassignments
    // delete elem.city_ja_full;
    // delete elem.city_ja;

    return elem;
})

saveJSON('./cleanCity/cities.json', result, () => {
    console.log('done!');
})