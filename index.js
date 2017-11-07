#!/usr/bin/env node

const puppeteer = require('puppeteer');
const _ = require('lodash')
const program = require('commander');
const inquirer = require('inquirer');

program.command('start')
              .description('监控价格，进行保价')
              .option('-u --username [username]', '京东账号')
              .option('-p --password [password]', '京东密码')
              .option('-t --time [time]', "多场时间查询一次，单位分钟")
              .option('-h --headless [headless]', 'chrome浏览器是否采用无头模式')
              .option('-path --path [path]', 'chrome路径')
              .action(option => {
                  const promps = [];
                  if(!option.username){
                      promps.push({
                        type: 'input',
                        name: 'username',
                        message: '请输入京东账号',
                        validate: function(input){
                          if(!input){
                            return '账号不能为空';
                          }
                          return true;
                        }
                      })
                  }
                  if(!option.password){
                    promps.push({
                      type: 'input',
                      name: 'password',
                      message: '请输入京东密码',
                      validate: function(input){
                        if(!input){
                          return '密码不能为空';
                        }
                        return true;
                      }
                    })
                  }
                  if(!option.path){
                    promps.push({
                      type: 'input',
                      name: 'path',
                      message: '请输入chrome路径'
                    })
                  }
                  if(!option.time){
                    promps.push({
                      type: 'input',
                      name: 'time',
                      default: 10,
                      message: '输入间隔时间，单位分钟'
                    })
                  }
                  if(!option.headless){
                    promps.push({
                      type: 'list',
                      name: 'headless',
                      default: 'false',
                      choices: ['true', 'false'],
                      message: '是否采用无头模式'
                    })
                  inquirer.prompt(promps).then(answer => {
                    var config = Object.assign(option, answer);
                    start(config);
                  })
                }
              })

program.parse(process.argv);

const loginUrl = 'https://passport.jd.com/new/login.aspx';
const indexUrl = 'https://sitepp-fm.jd.com/';

async function init(config){
  config.headless = config.headless === 'true' ? true : false;
  config.time = parseInt(config.time) * 60 * 1000;
  const brower = await puppeteer.launch(config);
  return {brower : brower};
}
async function login(config, brower){
  const page = await brower.newPage();
  await page.goto(loginUrl);
  await page.click('.login-tab-r');

  const usernameHandler = await page.$('#loginname');
  const passwordHandler = await page.$('#nloginpwd');
  const submitHandler = await page.$('#loginsubmit');

  await usernameHandler.type(config.username);
  await passwordHandler.type(config.password);
  await submitHandler.click();
  return page;
}

async function priceAsk(config, brower){
  const  page = await brower.newPage();
  await page.goto(indexUrl);

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

    var price = _.min(_.remove(prices, function(price){
      return price;
    }))

    if(formatPrice(product.price) > price){
      console.log(JSON.stringify(product), '现在价格'+price);
      let applyBtn = await page.$('#'+product.btnId)
       await applyBtn.click();
    }
    currentProductDetailPage.close();
  }

  page.close();
}

async function start(config){
  let {brower} = await init(config);
  try{
    var loginPage = await login(config, brower);
    const needAutoCode = await loginPage.evaluate(() => {
      return document.querySelector('#o-authcode').getAttribute('class').indexOf('hide') != -1
    })
    if(needAutoCode){
      await loginPage.evaluate(() => {
        alert('自动登录失败,请手动登录,登录成功之后监控程序会自动运行');
      })
    }
  }catch(e){
    console.log(e, '自动登录失败,请手动登录,登录成功之后监控程序会自动运行');
  }
  
  async function work(){
    try{
      await priceAsk(config, brower)
    }catch(e){
      console.log(new Date(), '查询失败');
    }  
  }

  setTimeout(work, 30*1000);

  setInterval(work, config.time);
}

function formatPrice(str){
  var match = str.match(/\d+\.\d+/);
  return match ? Number(match[0]) : 0;
}



