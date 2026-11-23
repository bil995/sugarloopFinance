const mongoose = require('./node_modules/mongoose');
const uri = process.env.MONGO_URI;
const t1 = Date.now();
mongoose.connect(uri).then(async () => {
  console.log('Connect:', Date.now() - t1, 'ms');
  const t2 = Date.now();
  await mongoose.connection.db.admin().ping();
  console.log('Ping:', Date.now() - t2, 'ms');
  process.exit(0);
});
