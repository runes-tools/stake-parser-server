const { Controller } = require('egg')
const { StakeTx } = require('../model/stake')
const { BytesToHex } = require('../util/hash')

const buffer2hex = (v) => {
  return Buffer.from(v).toString('hex')
}

class HomeController extends Controller {
  async index() {
    const { ctx } = this

    const tx = ctx.request.body 

    const stake_tx = new StakeTx(tx)
    stake_tx.try_decode()

    if( !stake_tx.stake ) {
      ctx.body = {
        code: 4001, 
        message: 'Not stake tx'
      }
      return 
    } 

    const { stake, witness_script, p2wsh } = stake_tx

    ctx.body = {
      code: 0 , 
      message: 'Ok.',
      data: {
        stake, 
        // script: BytesToHex(witness_script), 
        witness_script: BytesToHex(p2wsh.witnessScript),
        script: BytesToHex(p2wsh.script),
        address: p2wsh.address
      }
    }

  }
}

module.exports = HomeController
