const list = [{
    id: 383151141,
    first_name: '逾期款機器人',
    username: 'overdueMonitorBot',
    token: '383151141:AAHPQdaLrJgA3Jgi7PONEnPjKDCu3FG3IJ8',
    functionList: [],
    joinedGroupIDList: []
}, {
    id: 388573242,
    first_name: '氣泡數機器人',
    username: 'seedCountBot',
    token: '388573242:AAElyz7iaW_pS2EyNAzP6wftaduBYVI8JSM',
    functionList: [],
    joinedGroupIDList: []
}, {
    id: 296411532,
    first_name: 'UPGI註冊機器人',
    username: 'upgiRegisterBot',
    token: '296411532:AAF9U92K7LLKB7g-jvvG4remdHGi90ph2fI',
    functionList: [],
    joinedGroupIDList: []
}, {
    id: 278943684,
    first_name: '產品開發機器人',
    username: 'productDevelopmentBot',
    token: '278943684:AAHQDQMZrI2_3jPKnrY8tdrhn-2mKN9CwpI',
    functionList: [],
    joinedGroupIDList: []
}, {
    id: 260542039,
    first_name: '測試機器人',
    username: 'testBot',
    token: '260542039:AAEOxo0MbczouifWwQKDyIyJKBN6Iy43htk',
    functionList: [],
    joinedGroupIDList: []
}, {
    id: 313994181,
    first_name: 'UPGI IT Bot',
    username: 'upgiItBot',
    token: '313994181:AAHTIPRVfLeJ_YW4LSSfGx-Y7G5p_8_sC64',
    functionList: [],
    joinedGroupIDList: []
}];

function getToken(botUsername) {
    let token;
    list.forEach(function(botObject) {
        if (botObject.username === botUsername) {
            token = botObject.token;
        }
    });
    return token;
}

module.exports = {
    list: list,
    getToken: getToken
};
