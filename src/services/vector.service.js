const {Pinecone} = require("@pinecone-database/pinecone");

const pc = new Pinecone({apiKey: process.env.PINECONE_API_KEY});

const chatgptIndex = pc.Index("chatgpt-project");

async function createMemory({vectors, metadata,messageId}) {

    await chatgptIndex.upsert({
        records:[{
            id:messageId,
            values:vectors,
            metadata
        }]
        
    })
}

async function queryMemory({queryVector,limit=5 ,metadata}) {

    const data= await chatgptIndex.query({
        vector:queryVector,
        topK:limit,
        filter:metadata ? metadata:undefined,
        includemetadata:true
    })

    return data.matches;
}

module.exports = {
    createMemory,
    queryMemory
}