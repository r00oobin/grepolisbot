let body = document.getElementsByTagName('body')[0];
body.onload = function() {
  setTimeout(function () {
    getGlobalData();

    setTimeout(function () {
        for (let townId of getTownIdList()) {
            startGlobalDataInterval(townId);
        }
    }, 5000);
    modVisibility();
    createSearchElement();
  }, 2000);
};

let conf = {
  modConfig: {
    menu: [
    {
      id: "citymanagment",
      name:"City Managment"
    }
    ]
  },
  playerconfig: {
    banditAttack: {
      enable: true,
      useAward: true,
      unitsToUse: {
        sword: true,
        slinger: true,
        archer: true,
        hoplite: true,
        rider: false,
        chariot: false,
        harpy: false,
        medusa: false,
        godsent: true
      }
    }
  }
}

let townUntis = [];

let farmIntervalCollection = [];
let instantBuyCollection = [];
let globalDataCollection = [];
let banditCampAttackCollection = [];
let claimRewardCollection = [];

function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}
/* get Unit Count */

/* set global data */
var globalData = [];
function setGlobalData(data, town = Game.townId){
  globalData[town] = data;
}
function getGlobalData(town = Game.townId) {
  console.log("global data - loaded");
  fetch("https://de134.grepolis.com/game/data?town_id=" + town + "&action=get&h=" +  Game.csrfToken, {
    "headers": {
      "accept": "text/plain, */*; q=0.01",
      "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-ch-ua": "\"Google Chrome\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },

    "body": "json=" + encodeURIComponent('{"types":[{"type":"bar"},{"type":"backbone"}],"town_id":' + town + ',"nl_init":false}'),
    "method": "POST"
  }).then((response) => response.json()).then((data) => setGlobalData(data.json, town));
}


/* get research */
function getResearches(town = Game.townId) {
  getGlobalData(town);
  return globalData[town].backbone.collections[4].data[0].d;
}

/* get BanditCamp Id */
function getBanditCampId(town = Game.townId) {
  getGlobalData(town);
  return globalData[town].backbone.models[21].data.id;
}

/* get Bandit Camp Units*/
function getBanditCampUnits(town = Game.townId) {
  getGlobalData(town);
  return globalData[town].backbone.models[21].data.units;
}

function calculateUnitsAttackPower(units) {
  let power = 0;
  Object.keys(units).forEach(key => {
    power += (GameData.units[key].attack * units[key]);
  });
  return power;
}

function getUnitsToUse(town = Game.townId) {
  let unitsToUse = [];
  let confUnitsToUse = conf.playerconfig.banditAttack.unitsToUse;
  for (let banditAttackUnits in confUnitsToUse) {
    if (confUnitsToUse[banditAttackUnits]) {
      unitsToUse.push(banditAttackUnits);
    }
  }
  let unitsToUseString = "{";
  let townUnits = townUntis[town];
  for (let unitToUse of unitsToUse) {
    if (townUnits[unitToUse] != 0) {
      unitsToUseString += '"' + unitToUse + '":'+townUnits[unitToUse]+",";
    }
  }
  unitsToUseString = unitsToUseString.slice(0, -1);
  unitsToUseString += "}";
 return unitsToUseString;
}

function getUnitCountsFromHtml(town, data) {
  let searchElement = document.getElementById('searchElement');
  searchElement.innerHTML = data;
  townUntis[town] = {
    sword: document.getElementById('unit_order_count_sword').innerHTML,
    slinger: document.getElementById('unit_order_count_slinger').innerHTML,
    archer: document.getElementById('unit_order_count_archer').innerHTML,
    hoplite: document.getElementById('unit_order_count_hoplite').innerHTML,
    rider: document.getElementById('unit_order_count_rider').innerHTML,
    chariot: document.getElementById('unit_order_count_chariot').innerHTML,
    harpy: (document.getElementById('unit_order_count_harpy') != null) ? document.getElementById('unit_order_count_harpy').innerHTML : 0,
    medusa: (document.getElementById('unit_order_count_medusa') != null) ? document.getElementById('unit_order_count_medusa').innerHTML : 0,
    godsent: (document.getElementById('unit_order_count_godsent') != null) ? document.getElementById('unit_order_count_godsent').innerHTML : 0
  };
}

function getBarrackInfoJson(town = Game.townId) {
  return encodeURIComponent('{"building_type":"barracks","town_id":' + town + ',"nl_init":true}');
}

function getUnitsCounts(town = Game.townId) {
  fetch("https://de134.grepolis.com/game/building_barracks?town_id=" + town + "&action=index&h=" +  Game.csrfToken + "&json=" + getBarrackInfoJson(town), {
    "headers": {
      "accept": "text/plain, */*; q=0.01",
      "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-ch-ua": "\"Google Chrome\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "method": "GET"
  }).then((response) => response.json()).then((data) => getUnitCountsFromHtml(town, data.plain.html));
}

/* get Unit Count */

function getUnits(town = Game.townId) {
  return globalData[town].backbone.models[11].data;
}

function tryToAttackBanditCamp(town = Game.townId) {
  let units = getUnitsToUse(town)
  let banditPower = calculateUnitsAttackPower(getBanditCampUnits(town));
  let townPower = 0;
  if (units.length == 1) {
    units = "{}";
    console.log("no units");
  } else {
    townPower = calculateUnitsAttackPower(JSON.parse(units));
  }

  if (banditPower < townPower) {
    if (globalData[town].backbone.models[21].data.cooldown_at < getCurrentTimestamp()) {
      let isAttackSpot = false;
      for (let movement of globalData[town].backbone.collections[40].data) {
        if (movement.destination_is_attack_spot) {
          isAttackSpot = true;
          break;
        }
      }
      if (!isAttackSpot) {
        fetch("https://de134.grepolis.com/game/frontend_bridge?town_id=" + town + "&action=execute&h=" + Game.csrfToken, {
          "headers": {
            "accept": "text/plain, */*; q=0.01",
            "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\"Google Chrome\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "Referrer-Policy": "strict-origin-when-cross-origin"
          },
          "body": "json=" + encodeURIComponent('{"model_url":"PlayerAttackSpot/' + Game.player_id + '","action_name":"attack","arguments":' + units + ',"town_id":' + town + ',"nl_init":true}'),
          "method": "POST"
        });
        console.log("attack spot - attack started");
      } else {
        console.log('attack spot - attack failed, already attacking');
      }
    } else {
      console.log("attack spot - attack failed, cooldown")
    }
  } else {
    console.log("attack spot - attack failed, army too weak");
  }
}

function tryToClaimBanditReward(town = Game.townId) {
  if (globalData[town].backbone.models[21].data.reward_available) {
    fetch("https://de134.grepolis.com/game/frontend_bridge?town_id=" + town + "&action=execute&h=" + Game.csrfToken, {
      "headers": {
        "accept": "text/plain, */*; q=0.01",
        "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua": "\"Google Chrome\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": "json=" + encodeURIComponent('{"model_url":"PlayerAttackSpot/' + Game.player_id + '","action_name":"useReward","arguments":{},"town_id":' + town + ',"nl_init":true}'),
      "method": "POST"
    });
    console.log("attack spot reward - reward used")
  } else {
    console.log("attack spot reward - reward not available");
  }
}

/* farm FarmTowns */
function tryToFarmTowns(town = Game.townId) {
  let data = globalData[town].backbone.collections[29].data
  for (let townData of data) {
    if (townData.d.lootable_at < getCurrentTimestamp()) {
      fetch("https://de134.grepolis.com/game/frontend_bridge?town_id=" + town + "&action=execute&h=" + Game.csrfToken, {
        "headers": {
          "accept": "text/plain, */*; q=0.01",
          "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "sec-ch-ua": "\"Google Chrome\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": "json=" + encodeURIComponent('{"model_url":"FarmTownPlayerRelation/' + townData.d.id + '","action_name":"claim","arguments":{"farm_town_id":' + townData.d.farm_town_id + ',"type":"resources","option":1},"town_id":' + town + ',"nl_init":true}'),
        "method": "POST"
      });
      console.log("farm town claim - success");
    } else {
      console.log("farm town claim - failed, cooldown");
    }
  }
}

function tryToInstantBuy(town = Game.townId) {
  for(let order of ITowns.all_building_orders.fragments[town].models) {
    if((order.attributes.to_be_completed_at - getCurrentTimestamp())/60 < 5) {
        fetch("https://de134.grepolis.com/game/frontend_bridge?town_id=" + town + "&action=execute&h=" + Game.csrfToken, {
          "headers": {
            "accept": "text/plain, */*; q=0.01",
            "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\"Google Chrome\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "Referrer-Policy": "strict-origin-when-cross-origin"
          },
          "body": "json=" + encodeURIComponent('{"model_url":"BuildingOrder/' + order.id + '","action_name":"buyInstant","arguments":{"order_id":' + order.id + '},"town_id":'+ town + ',"nl_init":true}'),
          "method": "POST"
        });
        console.log("instant buy - success");
    } else {
        console.log("instant buy - failed, not ready ");
    }
  }
}

/* set intervals */

function startBanditCampAttackInterval(town = Game.townId, intervalTime = 10000) {
  tryToAttackBanditCamp(town);
  tryToClaimBanditReward(town);
  banditCampAttackCollection[town] = setInterval(function () {
    tryToAttackBanditCamp(town);
  }, intervalTime);
  claimRewardCollection[town] = setInterval(function () {
    tryToClaimBanditReward(town);
  }, intervalTime);
}

function stopBanditCampAttackInterval(town = Game.townId) {
  clearInterval(banditCampAttackCollection[town]);
  banditCampAttackCollection[town] = null;
  clearInterval(claimRewardCollection[town]);
  claimRewardCollection[town] = null;
}

function startFarmInterval(town = Game.townId, intervalTime = 30000) {
  tryToFarmTowns(town);
  farmIntervalCollection[town] = setInterval(function () {
    tryToFarmTowns(town);
  }, intervalTime);
}

function stopFarmInterval(town = Game.townId) {
  clearInterval(farmIntervalCollection[town]);
  farmIntervalCollection[town] = null;
}

function startInstantBuyInterval(town = Game.townId, intervalTime = 10000) {
  tryToInstantBuy(town);
  instantBuyCollection[town] = setInterval(function () {
    tryToInstantBuy(town);
  }, intervalTime);
}

function stopInstantBuyInterval(town = Game.townId) {
  clearInterval(instantBuyCollection[town]);
  instantBuyCollection[town] = null;
}

function startGlobalDataInterval(town = Game.townId, intervalTime = 5000) {
  getGlobalData(town);
  globalDataCollection[town] = setInterval(function () {
    getUnitsCounts(town);
    getGlobalData(town);
  }, intervalTime);
}

function stopGlobalDataInterval(town = Game.townId) {
  clearInterval(globalDataCollection[town]);
  globalDataCollection[town] = null;
}

function modVisibility() {
  let head  = document.getElementsByTagName('head')[0];
  let style  = document.createElement('style');
  style.innerHTML = ".toolbar_button.mod .icon {width: 28px;height: 28px;background-size: 23px !important;background: url('data:image/png;base64,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') no-repeat;}";
  head.appendChild(style);

  let toolbar_buttons = document.getElementsByClassName('toolbar_buttons')[0];

  let toolbar_button = document.createElement('div');
  toolbar_buttons.append(toolbar_button);

  toolbar_button.classList.add('toolbar_button');
  toolbar_button.classList.add('mod');

  let icon = document.createElement('div');
  icon.onclick = function() {
    let modUi = document.getElementsByClassName('modUi')[0];
    if (modUi.style.visibility == 'hidden') {
      modUi.style.visibility = '';
    } else {
      modUi.style.visibility = 'hidden';
    }
  };

  toolbar_button.append(icon);
  icon.classList.add('icon');

  let caption = document.createElement('div');
  icon.append(caption);

  caption.classList.add('js_caption');
  caption.classList.add('caption');

  displayModUi();
}

function displayModUi() {
  let head  = document.getElementsByTagName('head')[0];
  let style  = document.createElement('style');
  style.innerHTML = ".row {display: inline-table;width: 100%;} .menuItem { padding-top:4px;padding-bottom:4px;cursor:pointer;}.modUi .menu, .modUi .info {height:100%;} .closeModUi {cursor: pointer;} .titleDiv {float:left;display: inline-flex;} .modUi {    background: wheat;    width: 55%;    height: 70%;    z-index: 1001;    position: relative;    margin-left: auto;    margin-right: auto;    margin-top: 110px;}.container{display: grid;grid-template-columns: 17% 83%;} .header {padding:8px;display: grid;grid-template-columns: auto 20px;}";
  head.appendChild(style);

  let body = document.getElementsByTagName('body')[0];

  let modUi = document.createElement('div');
  body.append(modUi);

  modUi.classList.add('modUi');
  modUi.style.visibility = 'hidden';

  let header = document.createElement('div');
  modUi.append(header);

  header.classList.add('header');

  let titleDiv = document.createElement('div');
  header.append(titleDiv);

  titleDiv.classList.add('titleDiv');
  titleDiv.innerHTML = "Mod By Robin";

  let closeDiv = document.createElement('div');
  header.append(closeDiv);

  closeDiv.classList.add('closeModUi');
  closeDiv.innerHTML = "X";
  closeDiv.onclick = function () {
    modUi.style.visibility = 'hidden';
  }

  let contentDiv = document.createElement('div');
  modUi.append(contentDiv);

  contentDiv.classList.add('container');

  let menuDiv = document.createElement('div');
  contentDiv.append(menuDiv);

  menuDiv.classList.add('menu');

  for (let menuItem of conf.modConfig.menu) {
    let menuItemDiv = document.createElement('div');
    menuItemDiv.classList.add('menuItem');
    menuItemDiv.innerHTML = menuItem.name;

    menuItemDiv.onclick = function() {
      switch(menuItem.id) {
        case "citymanagment":
          displayCM();
          break;
        case "citymanagment2":
          displayCM2();
          break;

      }
    }
    menuDiv.append(menuItemDiv);
  }

  let infoDiv = document.createElement('div');
  contentDiv.append(infoDiv);

  infoDiv.classList.add('info');
  infoDiv.id = 'modInfo';
}

function displayCM(townId = Game.townId) {
  let modInfo = document.getElementById('modInfo');
  modInfo.innerHTML = "";
  let infoContainer = document.createElement('infoContainer');

  modInfo.append(infoContainer);

  let actionsDiv = document.createElement('div');
  modInfo.append(actionsDiv);
  actionsDiv.classList.add('actions');

  let row = document.createElement('div');
  row.classList.add('row');
  actionsDiv.append(row);

  let actionTitle = document.createElement('div');
  row.append(actionTitle);
  actionTitle.style.float = "left";
  actionTitle.style.marginRight = "20px";
  actionTitle.innerHTML = "City";

  let townIdSelect = document.createElement('select')
  townIdSelect.id = "townIdSelect";
  townIdSelect.style.marginBottom = "10px";
  townIdSelect.style.marginRight = "80%";
  townIdSelect.style.float = "left";
  row.append(townIdSelect);

//Create and append the options
  for (let townId of getTownIdList()) {
      var option = document.createElement("option");
      option.value = townId;
      option.text = townId;
      townIdSelect.appendChild(option);
  }
  townIdSelect.value = townId;

  townIdSelect.onchange = function () {
    displayCM(townIdSelect.value);
  };


  row = document.createElement('div');
  row.classList.add('row');
  actionsDiv.append(row);

  actionTitle = document.createElement('div');
  row.append(actionTitle);
  actionTitle.style.float = "left";
  actionTitle.style.marginRight = "20px";
  actionTitle.innerHTML = "FarmTown Auto Claim";

  let actionButton = document.createElement('button');
  actionButton.style.float = "left";
  row.append(actionButton);
  if (farmIntervalCollection[townId] != null) {
    actionButton.innerHTML = "Stop";
    actionButton.onclick = function() {
      let selectedTownId = document.getElementById('townIdSelect');
      stopFarmInterval(selectedTownId.value);
      displayCM(selectedTownId.value);
    }
  } else {
    actionButton.innerHTML = "Start";
    actionButton.onclick = function() {
      let selectedTownId = document.getElementById('townIdSelect');
      startFarmInterval(selectedTownId.value);
      displayCM(selectedTownId.value);
    }
  }

  row = document.createElement('div');
  row.classList.add('row');
  actionsDiv.append(row);

  actionTitle = document.createElement('div');
  row.append(actionTitle);
  actionTitle.style.float = "left";
  actionTitle.style.marginTop = "8px";
  actionTitle.style.marginRight = "20px";
  actionTitle.innerHTML = "Instant Buy Auto";

  actionButton = document.createElement('button');
  actionButton.style.float = "left";
  row.append(actionButton);
  if (instantBuyCollection[townId] != null) {
    actionButton.innerHTML = "Stop";
    actionButton.onclick = function() {
      let selectedTownId = document.getElementById('townIdSelect');
      stopInstantBuyInterval(selectedTownId.value);
      displayCM(selectedTownId.value);
    }
  } else {
    actionButton.innerHTML = "Start";
    actionButton.onclick = function() {
      let selectedTownId = document.getElementById('townIdSelect');
      startInstantBuyInterval(selectedTownId.value);
      displayCM(selectedTownId.value);
    }
  }

   row = document.createElement('div');
  row.classList.add('row');
  actionsDiv.append(row);

  actionTitle = document.createElement('div');
  row.append(actionTitle);
  actionTitle.style.float = "left";
  actionTitle.style.marginTop = "8px";
  actionTitle.style.marginRight = "20px";
  actionTitle.innerHTML = "Auto Attack Bandit Camp (only on win)";

  actionButton = document.createElement('button');
  actionButton.style.float = "left";
  row.append(actionButton);
  if (banditCampAttackCollection[townId] != null) {
    actionButton.innerHTML = "Stop";
    actionButton.onclick = function() {
      let selectedTownId = document.getElementById('townIdSelect');
      stopBanditCampAttackInterval(selectedTownId.value);
      displayCM(selectedTownId.value);
    }
  } else {
    actionButton.innerHTML = "Start";
    actionButton.onclick = function() {
      let selectedTownId = document.getElementById('townIdSelect');
      startBanditCampAttackInterval(selectedTownId.value);
      displayCM(selectedTownId.value);
    }
  }
}

function displayCM2() {
  let modInfo = document.getElementById('modInfo');
  modInfo.innerHTML = "helloo2";
}

function getTownIdList() {
  return globalData[getCurrentTownId()].backbone.models[0].data.town_ids;
}

function getCurrentTownId() {
  return Game.townId;
}

function createSearchElement() {
  let body = document.getElementsByTagName('body')[0];
  let searchElement = document.createElement('div');
  searchElement.id = 'searchElement';
  searchElement.style.display = "none";
  body.append(searchElement);
}