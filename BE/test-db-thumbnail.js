const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://altera:altera@cluster0.abcde.mongodb.net/altera?retryWrites=true&w=majority').then(async () => {
  const db = mongoose.connection.db;
  const design = await db.collection('marketplacedesigns').findOne({});
  console.log('Thumbnail length:', design?.thumbnail?.length);
  console.log('Thumbnail starts with:', design?.thumbnail?.substring(0, 100));
  if (design && design.thumbnail) {
    const decoded = decodeURIComponent(design.thumbnail.replace(/^data:image\/svg\+xml;(charset=utf-8,)?/, ''));
    console.log('Decoded start:', decoded.substring(0, 200));
    const match = decoded.match(/<path d="M72 38 96 28[^>]+>/);
    console.log('Regex Match:', !!match);
    if (!match) {
        console.log('Wait, what path is there?');
        const pathMatch = decoded.match(/<path[^>]+>/);
        console.log('First path:', pathMatch ? pathMatch[0] : 'None');
    }
  }
  process.exit(0);
}).catch(console.error);
