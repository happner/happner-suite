var MongoClient = require('mongodb').MongoClient;

module.exports = async function (url, collectionName) {
  // return new Promise((resolve, reject) => {
  //   const resolveInternal = (result) => {
  //     if (callback) callback(null, result);
  //     resolve(result);
  //   };
  //   const rejectInternal = (err) => {
  //     if (callback) callback(err);
  //     reject(err);
  //   };\tey {}
  try {
   let client = await MongoClient.connect(url) //, function (err, client) {
    //   if (err) return rejectInternal(err);
      var db = client.db(collectionName);
      var collection = db.collection(collectionName);
      await collection.drop()
//       function (err) 
        await client.close()
  } catch (e){
            if (err && err.message !== 'ns not found')
              //eslint-disable-next-line
              console.log("error clearing mongodb: " + err.message);
  }
        //  function (err) {
//           if (err)
//             //eslint-disable-next-line
//           console.log("error closing mongodb: " + err.message);
//           resolveInternal();
//         });
//       });
//     });
//   });
};
