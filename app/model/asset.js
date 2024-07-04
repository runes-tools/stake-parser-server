
const AssetType = [
    'btc', 'rune', 'ordinals',
]

class AssetValue {

    constructor(v) {
        this.value = 0
        this.type = []
        if( typeof(v) === 'number') {
            this.decode(v)
        } else {
            this.parse(v)
        }
    }

    decode(v) {
        const type = []
        AssetType.forEach(( key, index) => {
            const check = v >> index & 0x01
            if( check === 0x01 ) {
                type.push({
                    text: key, 
                    value: index
                })
            }
        })
        this.value = v 
        this.type = type 
    }

    parse(v) {
        this.value = 0 
        for( const t of v ) {
            const { value } = t 
            this.value = this.value & ( 0x01 << value )
            this.type.push({
                text: AssetType[value],
                value
            })
        }
    }

    encode() {
        return this.value 
    }

}

module.exports = {
    AssetType,
    AssetValue
}