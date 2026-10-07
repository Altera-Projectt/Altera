const thumbnail = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><path d="M72 38 96 28h48l24 10 48 32-27 48-27-16v190H78V102l-27 16-27-48z" fill="#ffffff" stroke="#d1d5db" stroke-width="3"/><image href="some-logo.jpg" /></svg>');
const productPreview = 'https://res.cloudinary.com/altera/image.jpg';

function escapeXml(value) {
    return value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]);
}

function enhanceThumbnail(thumbnail, productPreview) {
  if (!productPreview || !thumbnail.startsWith('data:image/svg+xml')) return 'FAIL START';
  try {
    const decoded = decodeURIComponent(thumbnail.replace(/^data:image\/svg\+xml;(charset=utf-8,)?/, ''));
    const replaced = decoded.replace(
      /<path d="M72 38 96 28[^>]+>/,
      `<image href="${escapeXml(productPreview)}" x="0" y="0" width="240" height="320" preserveAspectRatio="xMidYMid slice" style="mix-blend-mode: multiply;"/>`
    );
    if (replaced === decoded) return 'FAIL REGEX';
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(replaced)}`;
  } catch (e) {
    return 'FAIL CATCH';
  }
}

console.log(enhanceThumbnail(thumbnail, productPreview));
