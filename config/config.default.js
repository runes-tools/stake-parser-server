/* eslint valid-jsdoc: "off" */

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {
    bodyParser: {
      jsonLimit: '1mb',
      formLimit: '1mb',
    },
    security: {
      csrf: {
        enable: false,
      },
    },
  }

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1720093829555_6853'

  // add your middleware config here
  config.middleware = []

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  }

  return {
    ...config,
    ...userConfig,
  }
}
