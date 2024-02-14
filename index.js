const util = require('util');

const app = require('./app');

(async () => {
  let plugin;
  try {
    const opt = getOptFromArgs();
    const pluginapi = opt && opt.pluginapi ? opt.pluginapi : 'ih-plugin-api';
    plugin = require(pluginapi + '/index.js')();

    plugin.log('Sms plugin has started (use gammu service).', 0);

    // Получить параметры
    plugin.params.data = await plugin.params.get();
    plugin.log('Received params ' + util.inspect(plugin.params.data));

    app.start(plugin);
  } catch (err) {
    plugin.exit(8, `Error: ${util.inspect(err)}`);
  }
})();

function getOptFromArgs() {
  let opt;
  try {
    opt = JSON.parse(process.argv[2]); //
  } catch (e) {
    opt = {};
  }
  return opt;
}
