// 提供了 UDP 数据报套接字的实现
const dgram = require('dgram');
const { parseHost,copyBuffer} =require('./utils')
const server = dgram.createSocket('udp4')
// 只自己处理一部分域名，其余的域名还是交给别的本地 DNS 服务器处理
// 处理 DNS 协议的消息
server.on('message', (msg, rinfo) => {
    const host = parseHost(msg.subarray(12))
    console.log(`query:${host}`)
    if (/guangguangguang/.test(host)) {
        resolve(msg,rinfo)
    }else{
        forward(msg, rinfo)
    }
    // console.log(msg)
});

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`)
    server.close()
})
server.on('listening',()=>{
    // 当接收方地址确定时
    const address = server.address()
    console.log(`server listening ${address.address}:${address.port}`)
})

server.bind(53)

function resolve(msg, rinfo) {
    const queryInfo = msg.subarray(12)
    // 需要用 Buffer.alloc 创建一个 buffer 对象。
    const response = Buffer.alloc(28 + queryInfo.length)
    let offset = 0
    // Transaction ID 会话标识
    const id = msg.subarray(0, 2)
    copyBuffer(id, 0, response)
    offset += id.length
    // Flags 标志   
    response.writeUInt16BE(0x8180, offset)
    offset += 2

    // Questions 问题数
    response.writeUInt16BE(1, offset)
    offset += 2

    // Answer RRs 回答 资源记录数
    response.writeUInt16BE(1, offset)
    offset += 2
    // Authority RRs & Additional RRs 授权 附加 资源记录数
    response.writeUInt32BE(0, offset)
    offset += 4
    copyBuffer(queryInfo, offset, response)
    offset += queryInfo.length

    // offset to domain name
    response.writeUInt16BE(0xC00C, offset)
    offset += 2
    const typeAndClass = msg.subarray(msg.length - 4)
    copyBuffer(typeAndClass, offset, response)
    offset += typeAndClass.length

    // TTL, in seconds
    response.writeUInt32BE(600, offset)
    offset += 4
    // Length of IP
    response.writeUInt16BE(4, offset)
    offset += 2
    '11.22.33.44'.split('.').forEach(value => {
        response.writeUInt8(parseInt(value), offset)
        offset += 1
    })
    server.send(response, rinfo.port, rinfo.address, (err) => {
        if (err) {
            console.log(err)
            server.close()
        }
    })
}

function forward(msg,rinfo) {
    const client = dgram.createSocket('udp4')
    client.on('error',(err)=>{
        console.log(`client error:\n${err.stack}`);
        client.close()
    })
    client.on('message',(fbMsg,fbRinfo)=>{
        server.send(fbMsg, rinfo.port, rinfo.address,(err)=>{
            err&&console.log(err)
        })
        client.close()
    })
    client.send(msg, 53,'172.17.14.137',(err)=>{
        if (err) {
            console.log(err)
            client.close()
        }
    })
}


