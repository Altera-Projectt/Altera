const mockUpload = async (filePath, options = {}) => {
  // Return the source path/URI as the secure URL
  return {
    secure_url: filePath,
    public_id: 'mock_public_id_' + Math.random().toString(36).substring(2, 9)
  };
};

const mockDestroy = async (publicId) => {
  return { result: 'ok' };
};

const v2 = {
  config: () => {},
  uploader: {
    upload: mockUpload,
    destroy: mockDestroy
  }
};

module.exports = {
  v2,
  uploader: {
    upload: mockUpload,
    destroy: mockDestroy
  },
  config: () => {}
};
