
const fs = require('fs');
const file = fs.createWriteStream('./getCategories/tmp.tsv');

const list = require('./travel_items.json');
const list_room = require('./rooms.json');

const exec = require('child_process').exec;

list.forEach((elem, index) => {
    let elemP = JSON.parse(elem.item_details);
    ["accommodation", "restaurant", "activity", "transport"].forEach(type => {
        if(typeof elemP[type] !== 'undefined' && elemP[type].category){
            file.write(type + '\t' + elemP[type].category + '\n');
        }
    })
});

list_room.forEach((elem, index) => {
    let elemP = JSON.parse(elem.room_details);
    elemP.amenities.forEach(tag => {
        file.write('room-amenities' + '\t' + tag + '\n');
    })
    
    if(typeof elemP.alerts !== 'undefined'){
        elemP.alerts.forEach(alert => {
            file.write('room-alerts' + '\t' + alert + '\n');
        })
    }
})

let cmd = exec("sort -u tmp.tsv", (err, stdout, stderr) => {
    fs.writeFile('./getCategories/result.tsv', stdout, result => {
        console.log('done!');
    })
});
