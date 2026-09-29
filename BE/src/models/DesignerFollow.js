const mongoose = require('mongoose');
const DesignerFollowSchema = new mongoose.Schema({ followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DesignerProfile', required: true } }, { timestamps: true });
DesignerFollowSchema.index({ followerId: 1, designerId: 1 }, { unique: true });
module.exports = mongoose.model('DesignerFollow', DesignerFollowSchema);
