const puppeteer = require('puppeteer');
const _ = require('lodash')



async function start(){
  const brower = await puppeteer.launch({
    headless: false
  });
  
  const page = await brower.newPage();

  await page.goto('https://sitepp-fm.jd.com/');  

  await page.click('.login-tab-r');

  const usernameHandler = await page.$('#loginname');
  const passwordHandler = await page.$('#nloginpwd');
  const submitHandler = await page.$('#loginsubmit');

  await usernameHandler.type('****');
  await passwordHandler.type('***');
  await submitHandler.click();



  setTimeout(async function(){
    let products = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#priceApplyForm .order-tb>tbody>tr.tr-bd')).map(function(product){
        var productLink = product.querySelector('.p-name a');
        var price = product.querySelector('.goods-repair strong');
        var priceProtectBtn = product.querySelector('.operate a');
        return {
          url: productLink.href,
          name: productLink.text,
          price: price.innerText,
          btnId: priceProtectBtn.getAttribute('id')
        }
      })
    })
      
    for(var i = 0, len = products.length; i < len; i++){
      let product = products[i];
      let currentProductDetailPage = await brower.newPage();
      await currentProductDetailPage.goto(product.url);
      
      let prices = await currentProductDetailPage.evaluate(() => {
        var prices = document.querySelectorAll('.summary-first .summary-price-wrap .price');
        var selector1 = document.querySelectorAll('#summary-price .p-price');
        return Array.from(prices).concat(Array.from(selector1)).map(function(price){
          return price.innerText;
        })
      })

      
      prices = prices.map(function(price){
        return formatPrice(price);
      })

      console.log(prices)

      var price = _.min(_.remove(prices, function(price){
        return price;
      }))

      if(formatPrice(product.price) > price){
        let applyBtn = await page.$('#'+product.btnId)
        applyBtn.click();
      }
    }
  }, 2000)
  

}

function formatPrice(str){
  var match = str.match(/\d+\.\d+/);
  return match ? Number(match[0]) : 0;
}

start();


