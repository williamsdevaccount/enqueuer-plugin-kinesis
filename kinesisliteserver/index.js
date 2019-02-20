const kinesalite = require('kinesalite');
const kinesaliteServer = kinesalite({createStreamMs: 50,updateStreamMs: 50});

// Listen on port 4567
kinesaliteServer.listen(4567, (err)=> {
    if (err){
        console.error(`error trying to start kinesis lite server : ${err}`);
        throw err;
    } else {
        console.log('Kinesalite started on port 4567');
    }
});