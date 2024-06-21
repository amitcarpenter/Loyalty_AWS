module.exports = {
    connection: {
        createConnection: 'start_connection',
        connectionReady: 'connection_ready_',
        cashierConnection: 'cashierConnection',
        cashierconnectRes: 'receive_Bussness_Response',
        status: 'ACTIVE'
    },
    twilio_Auth: {
        // twilio live account credentials
        accountSid: process.env.ACCOUNT_SID,
        authToken: process.env.ACCOUNT_TOKEN,
        from: '+18888354708',
        to: '+18777804236'
    }
}
