const mongoose = require('mongoose');

const workspaceStateSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    unique: true,
  },
  pageData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  builderData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WorkspaceState', workspaceStateSchema);
