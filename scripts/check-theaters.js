const { MongoClient, ObjectId } = require('mongodb');

async function checkTheaters() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGO_DB || 'BookMovie';

  const client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);

  const staffId = '68dcc760b8432e9b169949f9'; // replace if needed
  const managerObjectId = new ObjectId(staffId);

  console.log('Querying theaters with manager_id:', managerObjectId.toString());
  const theaters = await db.collection('theaters').find({ manager_id: managerObjectId }, { projection: { _id: 1, name: 1, location: 1 } }).toArray();
  console.log('Found theaters:', theaters);

  await client.close();
}

checkTheaters().catch(err => {
  console.error(err);
  process.exit(1);
});