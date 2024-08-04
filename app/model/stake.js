const { AssetValue } = require('./asset')
const { BytesToHex, HexToBytes } = require('../util/hash')
const bitcoinjs = require('bitcoinjs-lib')
const ecc = require('tiny-secp256k1')
const { payments, networks, script, opcodes } = bitcoinjs

bitcoinjs.initEccLib(ecc)

class StakeInput {
    constructor( version, stake, reward, index) {
        this.version = version 
        this.stake = stake
        this.reward = reward 
        this.index = index
    }

    static try_decode( v ) {
        const x = this.decode(v)
        if(!x) throw new Error(`Can't decode.`)
        return x 
    }

    static decode(v) {
        const version = v[0]
        const stake = new AssetValue(v[1])
        const reward = new AssetValue(v[2])
        const index = v[3]

        return new StakeInput(
            version, stake, reward, index 
        )
    }

}

class StakeDetail {
    constructor( detail, pubkey, network ) {
        this.detail = detail 
        this.pubkey = pubkey
        this.internalPubkey = Buffer.from( this.pubkey, 'hex')
        this.network = network || networks.testnet
    }

    set_lock_time(time) {
        this.lock_time = time 
    }

    generate_op_return_script() {
        const { version, stake, reward, index } = this.detail 
        let num = 0 
        num += version 
        num += stake.value << 8
        num += reward.value << 16 
        num += index.value << 24
        
        return script.compile([
            'RETURN',
            'OP_16',
            opcodes.OP_RETURN,
            opcodes.OP_16,
            script.number.encode(num),
            // ScriptNum().encode(this.lock_time),
            HexToBytes(this.pubkey)
        ])
    }

    generate_witness_script() {
        return script.compile([
            // ScriptNum().encode( this.lock_time ),
            script.number.encode( this.lock_time ),
            opcodes.OP_CHECKLOCKTIMEVERIFY,
            opcodes.OP_DROP,
            // OP.CHECKLOCKTIMEVERIFY,
            // OP.DROP,
            this.internalPubkey,
            opcodes.OP_CHECKSIG
        ])
    }

    generate_p2tr() {
        const output_script = this.generate_witness_script()
        return payments.p2tr({
            internalPubkey: this.internalPubkey,
            scriptTree: {
                output: output_script
            },
            redeem: {
                output: output_script,
                redeemVersion: 192
            },
            network: this.network
        })
    }

    static try_decode( scriptpubkey_asm ) {
        const v = this.decode(scriptpubkey_asm)
        if( !v ) throw new Error(`Can't parse.`)
        return v 
    }

    static decode( scriptpubkey_asm ) {
        // const values = scriptpubkey_asm.split(' ')
        const { values } = scriptpubkey_asm
        const op_codes = values.reverse()

        if( op_codes.pop() !== 'OP_RETURN') return null 
        if( op_codes.pop() !== 'OP_PUSHNUM_16') return null 
        if( op_codes.pop() !== 'OP_PUSHBYTES_4') return null
        const detail = HexToBytes(op_codes.pop())

        // if( op_codes.pop() !== 'OP_PUSHBYTES_4') return null
        // const lock_time = HexToBytes(op_codes.pop())
        // const lock_time = Buffer.from(op_codes.pop(), 'hex').readUInt32LE(0)

        if( op_codes.pop() !== 'OP_PUSHBYTES_32') return null 
        // const pubkey = HexToBytes(op_codes.pop())
        const pubkey = op_codes.pop()

        const input = StakeInput.try_decode(detail)

        // console.log( input )
        // to int64
        return new StakeDetail(
            input, 
            pubkey
        )

    }

}


class StakeTx {

    constructor( tx ) {
        this.tx = tx 
        this.vout = tx.vout 
        this.stake = null 
        this.lock_time = tx.locktime
    }

    op_detail() {
        for(const v of this.vout ) {
            const { scriptpubkey_asm, scriptpubkey_type } = v 
            if( scriptpubkey_type === 'op_return') {
                return {
                    text: scriptpubkey_asm, 
                    values: scriptpubkey_asm.split(' ')
                }
            }
        }

        return null 
    }

    stake_detail() {
        const op_detail = this.op_detail()
        if( !op_detail ) return 

    }

    try_decode() {
        const op_detail = this.op_detail()
        const detail = StakeDetail.decode( op_detail)

        detail.set_lock_time( this.lock_time)

        this.stake = detail 
        this.witness_script = detail.generate_witness_script()
        // this.p2wsh = detail.generate_p2wsh()
        this.p2tr = detail.generate_p2tr()
        // console.log( detail )

        // console.log( detail.generate_op_return_script() )
        // console.log( detail.generate_p2wsh() )
    }

    verify() {
        if( !this.stake ) return false 
        const p2tr = this.stake.generate_p2tr()
        
        const output = this.vout[ this.stake.detail.index - 1]

        return p2tr.address === output.scriptpubkey_address
    }

}

module.exports = {
    StakeInput,
    StakeDetail,
    StakeTx
}