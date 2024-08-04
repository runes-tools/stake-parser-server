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

    const verified = stake_tx.verify()

    if( verified !== true ) {
      ctx.body = {
        code: 4002,
        message: `Check faild.`
      }
      return 
    }

    if( !stake_tx.stake ) {
      ctx.body = {
        code: 4001, 
        message: 'Not stake tx'
      }
      return 
    } 

    const { stake, witness_script, p2tr } = stake_tx

    delete stake['internalPubkey']
    ctx.body = {
      code: 0 , 
      message: 'Ok.',
      data: {
        stake, 
        // script: BytesToHex(witness_script), 
        // witness_script: BytesToHex(p2tr.witness),
        script: BytesToHex(p2tr.hash),
        address: p2tr.address
      }
    }

  }
}

module.exports = HomeController
