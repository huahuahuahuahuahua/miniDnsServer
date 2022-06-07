
/**
 * @param {*} msg
 * @returns {*}
 * @Date: 2022-06-07 14:18:55
 * @description 从buffer中解析出host
 */
function parseHost(msg) {
    // 当前域长度 + 当前域内容 + 当前域长度 + 当前域内容 + 当前域长度 + 当前域内容 + 0
    // 此方法接受单个参数偏移量，该偏移量指定缓冲区对象的位置。它表示开始读取之前要跳过的字节数。  
    let num = msg.readUInt8(0)
    let offset = 1
    let host = "";
    while (num!==0) {
        host += msg.subarray(offset,offset+num).toString()
        offset += num;
        num = msg.readUInt8(offset)
        offset+=1
        if (num!==0) {
            host+="."
        }
    }
        return host
}

function copyBuffer(src,offset,dst) {
    for (let i = 0; i < src.length; i++) {
        dst.writeUInt8(src.readUInt8(i),offset+i)
    }
}


module.exports={
    parseHost,
    copyBuffer
}