// Include a package.json file that will include this project's dependencies.
// The npm install should install the dependencies.
const http = require('http');
const fs = require('fs');
const scrapeIt = require("scrape-it")
const stringify = require('csv-stringify');

var dir = './data';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

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
  errorName = `${weekDay[day]} ${monthName[month]} ${date} ${year} ${hour-4}:${minute}:${second} GMT-0${offset}00`;
  fileName = `${year}-${fileMonth}-${fileDay}`;
  time = `${hour}:${minute}:${second} GMT-0${offset}00`;
}

let errorName;
let fileName;
let time;
let data = [];
let columns = {
  title: 'Title',
  price: 'Price',
  imageURL: 'Image URL',
  url: 'URL',
  time: 'Time'
};

function errorHandler(error) {
  console.log('This was called' + error.code);
  createDate();
  fs.appendFile('scraper-error.log', `${errorName} | ${error.name}: ${error.message}\n` , function (err) {
    if (err) {
      errorHandler(err);
    }
  });
}

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


let linkList = {};
let shirtData = [];


function remove(string) {
  return string.slice(4, string.length);
}

// Promise interface
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
            console.log('this one');
            errorHandler(error);
          });
        } catch (error) {
          console.log('now this one');
          errorHandler(error);
        }
      }
  }).catch(function(error) {
    errorHandler(error);
  });
} catch (error) {
  errorHandler(error);
}
// The application should check for a folder named 'data'. If it exists, do nothing,
// but if it does not exist, it should create one.

// Use third party npm modules for scraping and for creating the csv file.

// Your scraper should visit the website http://shirts4mike.com and use
// http://shirts4mike.com/shirts.php as single entry point to scrape information
// for 8 tee-shirts from the site, without using any hard-coded urls like
// http://www.shirts4mike.com/shirt.php?id=101.

// The scraper should get the price, title, url and image url from the product
// page and save this information into a CSV file.
// The information should be stored in an CSV file that is named for the date
// it was created, e.g. 2016-11-21.csv.
// Assume that the the column headers in the CSV need to be in a certain order
// to be correctly entered into a database.
// They should be in this order: Title, Price, ImageURL, URL, and Time
// The CSV file should be saved inside the ‘data’ folder.

// If the program is run twice in the same day, it should overwrite the file saved
// previously.

// If http://shirts4mike.com is down, an error message describing the issue
// should appear in the console.
// The error should be human-friendly, such as “There’s been a 404 error.
// Cannot connect to http://shirts4mike.com.”
// To test and make sure the error message displays as expected, you can disable
// the wifi on your computer or device.

// Extra Credit: Edit your package.json file so that your program runs when the
// npm start command is run.

// Extra Credit: When an error occurs, log it to a file named scraper-error.log.
// It should append to the bottom of the file with a time stamp and error e.g.
// [Tue Feb 16 2016 10:02:12 GMT-0800 (PST)] <error message>
