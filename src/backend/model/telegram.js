const getBotListQuery = 'SELECT * FROM telegram.dbo.bot;';
const getChatListQuery = 'SELECT * FROM telegram.dbo.chat;';
const getUserListQuery = 'SELECT a.*,b.NAME,b.DEP,c.NAME AS DEP_NAME,b.POS_NAME,b.ID_NO,b.CNT_TEL2 FROM telegram.dbo.[user] a LEFT JOIN DB_U105.dbo.MF_YG b ON a.erpID=b.YG_NO LEFT JOIN DB_U105.dbo.DEPT c ON b.DEP=c.DEP WHERE b.OUT_DAY IS NULL AND b.YG_NO IS NOT NULL;';

module.exports = {
    getBotListQuery: getBotListQuery,
    getChatListQuery: getChatListQuery,
    getUserListQuery: getUserListQuery
};
