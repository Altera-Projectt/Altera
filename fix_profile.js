const fs = require('fs');
const file = 'BE/src/controllers/designer.controller.js';
let content = fs.readFileSync(file, 'utf8');

// Fix getProfile
content = content.replace(
/    const pipeline = \[\s*{\s*\$match:\s*match\s*},\s*{\s*\$project:\s*{\s*frontDesign:\s*0,\s*backDesign:\s*0\s*}\s*},\s*{\s*\$sort:\s*sort\s*},\s*{\s*\$skip:\s*\(page - 1\) \* limit\s*},\s*{\s*\$limit:\s*limit\s*},\s*\];/m,
`    const pipeline = [
      { $match: match },
      { $project: { createdAt: 1, likesCount: 1, salesCount: 1, price: 1 } },
      { $sort: sort }, { $skip: (page - 1) * limit }, { $limit: limit },
      { $lookup: { from: 'marketplacedesigns', localField: '_id', foreignField: '_id', as: 'fullDesign' } },
      { $unwind: '$fullDesign' },
      { $replaceRoot: { newRoot: '$fullDesign' } },
      { $project: { frontDesign: 0, backDesign: 0 } }
    ];`
);

fs.writeFileSync(file, content);
