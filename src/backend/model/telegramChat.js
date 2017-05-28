const list = [{
    id: -224820909,
    title: '統義業務部',
    type: 'group'
}, {
    id: -224420315,
    title: '統義生產部',
    type: 'group'
}, {
    id: -164742782,
    title: '產品開發群組',
    type: 'group'
}, {
    id: -246916365,
    title: '統義研發部',
    type: 'group'
}, {
    id: -225498734,
    title: '統義原料控管系統群組',
    type: 'group'
}];

function getChatID(title) {
    let chat_id;
    list.forEach(function(chatObject) {
        if (chatObject.title === title) {
            chat_id = chatObject.id;
        }
    });
    return chat_id;
}

module.exports = {
    getChatID: getChatID,
    list: list
};
