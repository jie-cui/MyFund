///**
// * Created by jcui on 2015-12-31.
// */

var cheerio = require('cheerio');
var rp = require('request-promise');

const BASE_URL = "https://research.tdwaterhouse.ca";

function fetchPage(url) {
  return rp(
    {
      uri: url,
      //transform the html to allow cheerio parsing
      transform: function(body) {
        return cheerio.load(body);
      },
      //the td website only allows mozilla, safaria and chrome to visit
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
  });
}

var url = "https://research.tdwaterhouse.ca/research/public/Stocks/Overview/us/FISV";

//fetch the change percent of a stock or mutual fund given the corresponding url
function fetchChangePercent(url) {
  return fetchPage(url)
  .then( ($) => {
    var changePercent = $('.changePercent').text().replace(/\(|\)|%/g, '');
    return Number(changePercent);
  })
  .catch( (err) => {
    console.log(err);
    return NaN;
  });
}


fetchChangePercent(url)
  .then((percent)=> {console.log(percent)});



var mutualFundURL = "https://research.tdwaterhouse.ca/research/public/MutualFundsProfile/Holdings/ca/cib496"

//fetch the top holdings for a particular mutual fund given the corresponding url
function fetchTopHoldings(url) {
  var topHoldings = [];

  return fetchPage(url)
  .then( ($) => {
    var holdings = $('.Top10HoldingsView tbody tr');

    holdings.each((i, elem)=> {
      var data_cols = $('td', elem);

      var company_col = data_cols.eq(0).children();
      var company_name = company_col.filter('a').text();
      var url = BASE_URL + company_col.filter('a').attr('href');
      var symbol = company_col.filter('.symbol').text();

      var allocation = Number(data_cols.eq(2).attr('tsraw'));
      //console.log(company_name + ": " + symbol + " " + url + " " + allocation);
      topHoldings.push({company_name, symbol, url, allocation});
    });

    //fetch the change percent of each holdings and add it as the "change_percent"
    var getChangePercents = topHoldings.map(function(holding) {
      return fetchChangePercent(holding.url)
      .then( (percent)=> {
        //console.log("percent: " + percent);
        holding.change_percent = percent;
      });
    });

    return Promise.all(getChangePercents) //wait for all change percents
    .then(() => {return topHoldings;});
  })
}


fetchTopHoldings(mutualFundURL)
.then((holdings) => {
  console.log(JSON.stringify(holdings, null, 2));
});


