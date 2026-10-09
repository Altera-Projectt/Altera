const uploadsRes = { status: 'fulfilled', value: { data: { data: { images: [] } } } };
const designsRes = { status: 'fulfilled', value: { data: { data: { designs: [
  { _id: '1', previewImage: 'img1.png', prompt: 'cat', createdAt: '2026-10-08T00:00:00Z' },
  { _id: '2', customImage: 'img2.png', prompt: 'dog', createdAt: '2026-10-08T01:00:00Z' }
] } } } };

let fetchedImages = [];
if (uploadsRes.status === 'fulfilled') fetchedImages = uploadsRes.value.data.data.images || [];

if (designsRes.status === 'fulfilled') {
  const aiDesigns = designsRes.value.data.data.designs || [];
  const aiImages = aiDesigns
    .filter(d => d.previewImage || d.customImage)
    .map(d => ({
      _id: d._id,
      url: d.previewImage || d.customImage || '',
      thumbnailUrl: d.previewImage || d.customImage || '',
      filename: `ai-design-${d._id}.png`,
      mimeType: 'image/png',
      size: 0,
      source: 'AI',
      prompt: d.prompt,
      designId: d._id,
      createdAt: d.createdAt || new Date().toISOString()
    }));

  for (const aiImg of aiImages) {
    if (!fetchedImages.some(img => img.url === aiImg.url)) {
      fetchedImages.push(aiImg);
    }
  }
}

let prev = [];
const merged = [...prev];
for (const img of fetchedImages) {
  if (!merged.some(m => m.url === img.url || m._id === img._id)) {
    merged.push(img);
  }
}
merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

console.log(merged);
