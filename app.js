const util = require('util');
const fs = require('fs');
const path = require('path');

const defsign = 'IH';

module.exports = {
  start(plugin) {
    this.plugin = plugin;
    this.params = plugin.params.data;
    checkFolder(this.params.out_folder, 'outbox');
    checkFolder(this.params.in_folder, 'inbox');
    checkFolder(this.params.sent_folder, 'sent');
    checkFolder(this.params.fail_folder, 'error');

    plugin.onSub('sendinfo', message => {
      plugin.log('Sub sendinfo data=' + util.inspect(message));

      this.sendSms(message.txt, message.sendTo, this.params);
    });
  },

  sendSms(text, sendTo, opt) {
    console.log('sendSms START');
    if (!sendTo || !opt) return;

    sendText = text;

    const sendarr = formSendArray(sendTo);
    this.plugin.log('Sms to send:  ' + sendarr.length + util.inspect(sendarr));

    if (sendarr.length <= 0) return;

    sendarr.forEach(item => {
      try {
        const filename = path.join(this.params.out_folder, formSMSOutFileName(item.addr));
        this.plugin.log('write to file:  ' + filename);

        fs.writeFileSync(filename, sendText + ' ' + (item.sign || ''), (encoding = 'utf8')); //добавили подпись
      } catch (e) {
        this.plugin.log('Write error:  ' + util.inspect(e));
      }
    });
  }
};

function formSMSOutFileName(phoneNumber) {
  // Входящий номер - с +
  // OUT<A-Z><YYMMDD>_<HHMMSS>_<NN>_+73450000_<any str>.txt
  if (phoneNumber.charAt(0) != '+') {
    phoneNumber = '+' + phoneNumber;
  }
  // return 'OUT' + 'A' +  '_00_' + phoneNumber + '_00.txt';
  return 'OUT' + 'A' + getCurrentDateTimeForSms() + '_00_' + phoneNumber + '_00.txt';
}

function getCurrentDateTimeForSms() {
  //YYYYMMDD_HHMMSS
  const dt = new Date();
  return (
    String(dt.getFullYear()) +
    pad(dt.getMonth() + 1) +
    pad(dt.getDate()) +
    '_' +
    pad(dt.getHours()) +
    pad(dt.getMinutes()) +
    pad(dt.getSeconds())
  );
}

function pad(val, width = 2) {
  return String(val).padStart(width, '0');
}
/**
 *
 * @param {*} sendTo
 *          sendTo as object: { addr:'xx.gmail.com', sign:'With all my love'}
 *          sendTo as array:  [{ addr:'xx.gmail.com', sign:'Best' },{ addr:'zz.mail.com' },...]
 *          sendTo as string: 'xx.gmail.com'
 *
 * @return {Array} with items:{addr, sign}
 */
function formSendArray(sendTo) {
  if (typeof sendTo == 'object') {
    if (!util.isArray(sendTo)) sendTo = [sendTo];
  } else if (typeof sendTo == 'string') {
    sendTo = [{ addr: sendTo }];
  } else return [];

  return sendTo.filter(item => item.addr).map(item => ({ addr: item.addr, sign: item.sign || defsign }));
}

function allTrim(str) {
  return str && typeof str === 'string' ? str.replace(/^\s+/, '').replace(/\s+$/, '') : '';
}

function getErrorStr(error) {
  return typeof error == 'object' ? JSON.stringify(error.errno || error.message) : error;
}

function checkFolder(folder, title) {
  if (!folder) throw { message: 'Folder ' + title + ' not defined!' };
  if (!fs.existsSync(folder)) throw { message: 'Folder ' + title + ' not found!' };
}
