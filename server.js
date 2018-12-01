const envs = {
    dev: {
        url: "http://localhost",
        port: "3004"
    },
    prod: {
        url: "http://18.223.26.231",
        port: "3000"
    }
};
const PORT_NUMBER = process.env.PORT || envs.dev.port;
const BIDLIST_FILE_PATH = 'houses/blHousing.pdf';
const POSTPENMENTS_FILE_PATH = 'houses/psHousing.pdf';
const BIDLIST_JSON_FILE_PATH = './pdf2json/blHousing.json';
const POSTPENMENTS_JSON_FILE_PATH = './pdf2json/psHousing.json';
const LAW_FIRMS_EXCEL = 'lawFirms/lawFirms.xlsx';
const LAW_FIRMS_JSON = 'lawFirms/lawFirms.json';
const BIDLIST_PDF_URL = 'http://www.sheriffalleghenycounty.com/pdfs/bid_list/bid_list.pdf';
const POSTPONEMENTS_PDF_URL = 'http://www.sheriffalleghenycounty.com/pdfs/bid_list/postpone.pdf';
const JUDGMENTS_URL = 'http://www.pittsburghlegaljournal.org/subscribe/pn_sheriffsale.php';
//const SALE_RESULTS_PDF_URL = 'http://www.sheriffalleghenycounty.com/pdfs/bid_list/sale_results.pdf';
const ZILLOW_API_TOKEN = 'X1-ZWz18uacwnt823_728x4';
const ZILLOW_API_TOKEN2 = 'X1-ZWz1grxccbbthn_3tnpx';
const ZILLOW_API_TOKEN_YOTAM = 'X1-ZWz1f5h9rt9de3_47pen';
const ZILLOW_API_TOKEN_YOTAM2 = 'X1-ZWz19sgwikp5or_a1050';
var express = require('express');
var http = require('http');
var fs = require('fs');
var bodyParser = require('body-parser');
var moment = require('moment');
var PDFParser = require("pdf2json");
var Zillow = require('node-zillow');
var exceljs = require('exceljs');
var forEach = require('foreach');
var Math = require('mathjs');
var formatCurrency = require('format-currency');
var excelAsJson = require('excel-as-json').processFile;
var cheerio = require('cheerio');
var tinyReq = require('tinyreq');
var log = require('./api/log');
var path = require('path');
var app = express();
var zillow = new Zillow(ZILLOW_API_TOKEN);

app.set('etag', false); // This will disable cache for all http request headers - no 304 code anymore
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(express.static(__dirname + './../client'));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function (req, res) {
    res.send('hello world');
});

app.get('/getHouses/', function (req, res) {
    
    try {
        fs.unlinkSync(BIDLIST_FILE_PATH);
        fs.unlinkSync(POSTPENMENTS_FILE_PATH);
    } catch (err) {
        console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') Failed to delete PDF files');
    }

    console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') Downloading pdf files to server...');

    var blFile = fs.createWriteStream(BIDLIST_FILE_PATH);
    var psFile = fs.createWriteStream(POSTPENMENTS_FILE_PATH);

    var bidListRequest = http.get(BIDLIST_PDF_URL, function (response) {
        console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') Bid List pdf file was downloaded!');
        response.pipe(blFile);

        var postponementsRequest = http.get(POSTPONEMENTS_PDF_URL, function (response) {

            console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') Postponements pdf file was downloaded!');
            response.pipe(psFile);
            res.send('Files downloaded successfully!');
        });

    });
});

app.get('/parseHouses', function (req, res) {
    
    console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') Parsing houses from pdf to json...');

    let blPdfParser = new PDFParser();
    let psPdfParser = new PDFParser();

    blPdfParser.on("pdfParser_dataError", errData => {
        console.error(errData.parserError);
        res.send({
            error: true,
            message: "An error occured while reading the pdf files, please reload the page! If the error repeat try to close all open PDF reader windows and try again."
        });
    });
    blPdfParser.on("pdfParser_dataReady", blPdfData => {
        fs.unlinkSync(BIDLIST_JSON_FILE_PATH);
        fs.writeFile(BIDLIST_JSON_FILE_PATH, JSON.stringify(blPdfData));
        psPdfParser.loadPDF("./houses/psHousing.pdf");

    });
    psPdfParser.on("pdfParser_dataError", errData => {
        console.error(errData.parserError);
        res.send({
            error: true,
            message: "An error occured while reading the pdf files, please reload the page! If the error repeat try to close all open PDF reader windows and try again."
        });
    });
    psPdfParser.on("pdfParser_dataReady", psPdfData => {
        fs.unlinkSync(POSTPENMENTS_JSON_FILE_PATH);
        fs.writeFile(POSTPENMENTS_JSON_FILE_PATH, JSON.stringify(psPdfData));
        res.send({
            error: false,
            message: "Success!"
        });
    });

    blPdfParser.loadPDF(__dirname + "/houses/blHousing.pdf");

});

app.get('/getBidListJson', function (req, res) {

    var file = "./pdf2json/blHousing.json";
    var housing = require(file);

    res.send(housing);
    console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') Downloaded Bid List JSON');
});
app.get('/getPostponementsJson', function (req, res) {

    var file = "./pdf2json/psHousing.json";
    var housing = require(file);

    res.send(housing);
    console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') Downloaded Postponements JSON');
});
app.get('/downloadPostponementsJson', function (req, res) {

    //We can use this if we want to download the JSON in the client - Currently not in use.
    console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') sending postponements JSON...');

    fs.readFile('./pdf2json/housing.json', function (err, content) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(content));
    });
});

app.get('/downloadExcel/:fileName', function (req, res) {

    const url = path.join(__dirname, `/exports/${req.params.fileName}.xlsx`);
    res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.sendFile(url);

});

app.get('/downloadBackup', function (req, res) {

    const url = path.join(__dirname, `/backup/houses_db.xlsx`);
    res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.sendFile(url);

})

app.get('/getZillowHouseDetails', function (req, res) {
    try {

        var parameters = {
            'address': req.query.address,
            'citystatezip': req.query.zipCode
        }

        console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') Grabbing Zillow details...');

        zillow.get('GetDeepSearchResults', parameters)
            .then(function (results) {
                console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') ' + results.message.text);
                res.send(results);
            });
    } catch (ex) {
        console.log(ex.stack);
        res.send(ex.message);
    }
});

app.post('/exportExcel', function (req, res) {

    let timeStamp = moment(Date.now());
    console.log('(' + timeStamp.format('DD/MM/YYYY HH:mm:ss') + ') Exporting houses to Excel...');

    let workbook = new exceljs.Workbook();
    let sheet = workbook.addWorksheet(timeStamp.format('MMMM YYYY'));

    sheet.columns = [{
            header: 'Auction #',
            key: 'auctionNumber',
            width: 11
        },
        {
            header: 'Address',
            key: 'address',
            width: 56
        },
        {
            header: 'Judgement',
            key: 'judgement',
            width: 11
        },
        {
            header: 'Tax',
            key: 'tax',
            width: 8
        },
        {
            header: 'Zillow Estimate',
            key: 'zillowEstimate',
            width: 10
        },
        {
            header: 'Sqft',
            key: 'sqft',
            width: 6
        },
        {
            header: 'Rooms',
            key: 'rooms',
            width: 4
        },
        {
            header: 'Baths',
            key: 'baths',
            width: 4
        },
        {
            header: 'Last Sold Price',
            key: 'lastSoldPrice',
            width: 8
        },
        {
            header: 'Last Sold Date',
            key: 'lastSoldDate',
            width: 13
        },
        {
            header: 'Plaintiff Name',
            key: 'plaintiffName',
            width: 20
        },
        {
            header: 'Sale Type',
            key: 'saleType',
            width: 4
        },
        {
            header: 'Law Firm - Representative',
            key: 'lawFirmRep',
            width: 41
        },
        {
            header: 'Law Firm - Contact Details',
            key: 'lawFirmContact',
            width: 50
        }

    ];

    //%s: symbol %v: value %c: currency code (i.e: USD)
    let currencyOptions = {
        format: '%s%v',
        symbol: '$'
    };
    let numberOptions = {
        format: '%v'
    };
    forEach(req.body, function (house, key) {
        sheet.addRow({
            auctionNumber: house.auctionNumber,
            address: house.address,
            judgement: house.judgment && house.judgment !== "" ? formatCurrency(parseInt(house.judgment.replace(new RegExp(',', 'g'), '')), numberOptions) : "",
            tax: house.taxAssessment && house.taxAssessment !== "" ? formatCurrency(parseInt(house.taxAssessment), numberOptions) : "",
            zillowEstimate: house.zillowEstimate && house.zillowEstimate !== "" ? formatCurrency(parseInt(house.zillowEstimate), numberOptions) : "",
            sqft: house.sqft && house.sqft !== "" ? formatCurrency(house.sqft, numberOptions) : "",
            rooms: house.rooms,
            baths: house.bath,
            lastSoldPrice: house.lastSoldPrice && house.lastSoldPrice !== "" ? formatCurrency(parseInt(house.lastSoldPrice), numberOptions) : "",
            lastSoldDate: house.lastSoldDate,
            plaintiffName: house.plaintiffName,
            saleType: house.isFC ? "FC" : house.saleType,
            lawFirmRep: house.firmName,
            lawFirmContact: house.contactEmail
        });
    });

    const fileName = timeStamp.format('DD-MM-YYYY_HH-mm') + '_export.xlsx';
    workbook.xlsx.writeFile(`./exports/${fileName}`).then(function () {
        console.log('(' + timeStamp.format('DD/MM/YYYY HH:mm:ss') + ') Excel file was exported!');
        res.send(fileName.replace('.xlsx', ''));
    }, function () {
        res.send('failed');
    });

});
app.get('/getLawFirmJson', function (req, res) {

    options = {
        sheet: '1',
        isColOriented: false,
        omitEmtpyFields: false
    };

    excelAsJson(LAW_FIRMS_EXCEL, LAW_FIRMS_JSON, options, (err, data) => {
        if (err) {
            console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') JSON conversion failure:');
            console.log(err);
        } else {

            res.send(data);
            console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') Downloaded Law Firm JSON');
        }

    });
});

app.get('/getJudgments', function (req, res) {

    let judgments = {};

    tinyReq(JUDGMENTS_URL, function (err, body) {

        if (err) {
            console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') Failed to get Judgments: ' + err.message);
            res.send('failed');
        }

        const $ = cheerio.load(body); // Parse the HTML 
        const dockets = $('span#notice_case_number');
        const judgmentSums = $('#notice_appraised_amount');
        let index = 0;

        dockets.each(function (key, docket) {
            try {
                if (docket.firstChild.data.length < 10) {
                    judgments[docket.prev.data + docket.firstChild.data] = judgmentSums[index].children[0].data;
                } else {
                    judgments[docket.firstChild.data] = judgmentSums[index].children[0].data;
                }
                index++;
            } catch (err) {
                console.log(err.message);
                index++;
            }
        })

        console.log('(' + moment(Date.now()).format('DD/MM/YYYY HH:mm:ss') + ') Downloaded Judgments!');
        res.send(judgments);

        // let workbook = new exceljs.Workbook();
        // workbook.xlsx.readFile('./backup/houses_db.xlsx').then(function () {
        //     let worksheet = workbook.getWorksheet(1);
        //     worksheet.spliceRows(0, 1);
        //     worksheet.eachRow(function (row, rowNumber) {
        //         try {
        //             judgments[row.getCell(13).value] = row.getCell(5).value;
        //         } catch (error) {

        //         }
        //     });

        // });
    });
});

app.post('/backupHouses', function (req, res) {

    let timeStamp = moment(Date.now());
    console.log('(' + timeStamp.format('DD/MM/YYYY HH:mm:ss') + ') Backing up houses to Excel...');

    let workbook = new exceljs.Workbook();
    workbook.xlsx.readFile('./backup/houses_db.xlsx').then(function () {

        let worksheet = workbook.getWorksheet(1);
        let rows = [];

        forEach(req.body, function (house, key) {

            let rowNumbers = findRowByDocketID(worksheet, house.docketNumber);
            if (rowNumbers !== -1) {
                rows = rows.concat(rowNumbers);
            }

        });

        deleteDuplicateRows(worksheet, rows);

        forEach(req.body, function (house, key) {
            addBackupRow(worksheet, house);
        });

        workbook.xlsx.writeFile('./backup/houses_db.xlsx').then(function () {
            console.log("Houses were backed up!");
            res.send('success');
        });

    });

});

app.listen(PORT_NUMBER);
console.log("Now serving on port: " + PORT_NUMBER);


//*** Utility Function ***//

var findRowByDocketID = function (worksheet, docketID) {

    let rows = [];

    worksheet.eachRow(function (row, rowNumber) {
        if (row.getCell(12).value === docketID) {
            rows.push(rowNumber);
        }
    });

    return rows.length > 0 ? rows : -1;
};
var deleteDuplicateRows = function (worksheet, dupRows) {

    if (dupRows === -1) return;

    dupRows = dupRows.sort(sortRowNumbers);
    dupRows = dupRows.reverse();

    forEach(dupRows, function (rowNumber, index) {
        worksheet.spliceRows(rowNumber, 1);
    });

    return;

};
var addBackupRow = function (worksheet, house) {

    let row = [];

    row.push(house && house.auctionNumber && house.auctionNumber !== "" ? house.auctionNumber : "");
    row.push(house && house.address && house.address !== "" ? house.address : "");
    row.push(""); //Remarks
    row.push(house && house.judgment && house.judgment !== "" ? house.judgment : "");
    row.push(house && house.taxAssessment && house.taxAssessment !== "" ? parseInt(house.taxAssessment).toString() : "");
    row.push(house && house.zillowEstimate && house.zillowEstimate !== "" ? house.zillowEstimate : "");
    row.push(house && house.sqft && house.sqft !== "" ? house.sqft : "");
    row.push(house && house.rooms && house.rooms !== "" ? house.rooms : "");
    row.push(house && house.bath && house.bath !== "" ? house.bath : "");
    row.push(house && house.lastSoldPrice && house.lastSoldPrice !== "" ? house.lastSoldPrice : "");
    row.push(house && house.lastSoldDate && house.lastSoldDate !== "" ? house.lastSoldDate : "");
    row.push(house && house.docketNumber && house.docketNumber !== "" ? house.docketNumber : "");
    row.push(house && house.zillowLink && house.zillowLink !== "" ? house.zillowLink : "");
    row.push(house && house.description && house.description !== "" ? house.description : "");
    row.push(house && house.zillowID && house.zillowID !== "" ? house.zillowID : "");

    worksheet.addRow(row);
};

var sortRowNumbers = function (a, b) {
    return a - b;
}