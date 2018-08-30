!function () {

// Requirements
const http = require('http');
const fs = require('fs');
const scrapeIt = require("scrape-it")
const stringify = require('csv-stringify');

// Declarations of constants and variables.
const dir = './data';
let errorName;
let fileName;
let time;
let data = [];
let linkList = {};
let shirtData = [];
let columns = {
  title: 'Title',
  price: 'Price',
  imageURL: 'Image URL',
  url: 'URL',
  time: 'Time'
};

// Checks to see if a data folder exists. If not, it creates one.
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// This function updates the date information everytime that the data is pulled and assigns
// the correct date/time characteristics to certain variables.
function createDate() {
  const weekDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'];
  const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const newDate = new Date();
  const offset = newDate.getTimezoneOffset()/60;
  const day = newDate.getDay();
  const date = newDate.getDate();
  const month = newDate.getMonth();
  const fileMonth = (month+1<10?'0':'') + (month+1);
  const fileDay = (date<10?'0':'') + (date);
  const year = newDate.getFullYear();
  const hour = newDate.getHours();
  const minute = (newDate.getMinutes()<10?'0':'') + (newDate.getMinutes());
  const second = (newDate.getSeconds()<10?'0':'') + (newDate.getSeconds());
  errorName = `${weekDay[day]} ${monthName[month]} ${date} ${year} ${hour}:${minute}:${second} GMT-0${offset}00`;
  fileName = `${year}-${fileMonth}-${fileDay}`;
  time = `${hour}:${minute}:${second} GMT-0${offset}00`;
}

// This function logs errors to the scraper-error.log file. It also logs an error message to the
// console if http://shirts4mike.com cannot be found.
function errorHandler(error) {
  if (error.code === 'ENOTFOUND') {
    console.log(`There’s been a 404 error. Cannot connect to http://shirts4mike.com`);
  }
  createDate();
  fs.appendFile('scraper-error.log', `${errorName} | ${error.name}: ${error.message}\n` , function (err) {
    if (err) {
      errorHandler(err);
    }
  });
}

// This function takes the data collected from the website, and creates a csv file.
function createCSV() {
  for (var i = 0; i < shirtData.length; i++) {
    data.push([shirtData[i][0], shirtData[i][1], shirtData[i][2], shirtData[i][3], time]);
  }
  stringify(data, { header: true, columns: columns }, (err, output) => {
    if (err) {
      errorHandler(err);
    } else {
      fs.writeFile(`./data/${fileName}.csv`, output, (err) => {
        if (err) {
          errorHandler(err);
        }
      });
    }
  });
}

// This function makes a small removal from a string scraped from the website.
function remove(string) {
  return string.slice(4, string.length);
}

// This is the scraper module function that collects the data from the website.
try {
  scrapeIt("http://shirts4mike.com/shirts.php", {
    shirts: {
      listItem: ".products li",
      name: "shirts",
      data: {
        url: {
          selector: "a",
          attr: "href"
        }
      }
    }
  })
    .then(({ data, response }) => {
      response.on('error', error => errorHandler(error));
      let counter = 0;
      linkList = data;
      for (let i = 0; i < linkList.shirts.length; i+=1) {
        try {
          scrapeIt(`http://shirts4mike.com/${linkList.shirts[i].url}`, {
            shirt: {
              selector: ".wrapper",
              name: "shirt",
              data: {
                title: {
                  selector: ".shirt-details h1",
                  convert: x => remove(x)
                },
                price: ".shirt-details span",
                imageURL: {
                  selector: ".shirt-picture span img",
                  attr: "src"
                }
              }
            }
          })
          .then(({ data, response }) => {
            response.on('error', error => errorHandler(error));
            const shirtArray = [
              data.shirt.title,
              data.shirt.price,
              data.shirt.imageURL,
              `http://shirts4mike.com/${linkList.shirts[i].url}`
            ]
            shirtData.push(shirtArray);
            counter += 1;
            if (counter === linkList.shirts.length) {
              createDate();
              createCSV();
            }
          }).catch(function(error) {
            console.log('three');
            errorHandler(error);
          });
        } catch (error) {
          console.log('four');
          errorHandler(error);
        }
      }
  }).catch(function(error) {
    errorHandler(error);
  });
} catch (error) {
  console.log('six');
  errorHandler(error);
}

}();
