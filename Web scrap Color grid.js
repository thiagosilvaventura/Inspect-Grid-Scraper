(function () {
  // ============================================================
  // INSPECT GRID SCRAPER (CORS & PERMISSIONS-POLICY PROOF)
  // ============================================================

  // 1. CLEAN PREVIOUS INSTANCES
  const oldModal = document.getElementById('__ig_modal');
  if (oldModal) oldModal.remove();

  const oldFullscreen = document.getElementById('__ig_fullscreen');
  if (oldFullscreen) oldFullscreen.remove();

  const oldStyle = document.getElementById('__ig_styles');
  if (oldStyle) oldStyle.remove();

  // 2. NATIVE PURE JAVASCRIPT ZIP BUILDER
  class PureZip {
    constructor() {
      this.files = [];
    }

    addFile(name, content) {
      const u8Data =
        typeof content === 'string'
          ? new TextEncoder().encode(content)
          : content;

      this.files.push({
        name: new TextEncoder().encode(name),
        data: u8Data
      });
    }

    generateBlob() {
      let parts = [];
      let dirParts = [];
      let offset = 0;

      for (let file of this.files) {
        const nameLen = file.name.length;
        const dataLen = file.data.length;
        const crc = this.crc32(file.data);

        const header = new Uint8Array(30 + nameLen);
        const view = new DataView(header.buffer);

        view.setUint32(0, 0x04034b50, true);
        view.setUint16(4, 10, true);
        view.setUint16(6, 0, true);
        view.setUint16(8, 0, true);
        view.setUint32(14, crc, true);
        view.setUint32(18, dataLen, true);
        view.setUint32(22, dataLen, true);
        view.setUint16(26, nameLen, true);

        header.set(file.name, 30);
        parts.push(header, file.data);

        const dirHeader = new Uint8Array(46 + nameLen);
        const dView = new DataView(dirHeader.buffer);

        dView.setUint32(0, 0x02014b50, true);
        dView.setUint16(4, 10, true);
        dView.setUint16(6, 10, true);
        dView.setUint32(16, crc, true);
        dView.setUint32(20, dataLen, true);
        dView.setUint32(24, dataLen, true);
        dView.setUint16(28, nameLen, true);
        dView.setUint32(42, offset, true);

        dirHeader.set(file.name, 46);
        dirParts.push(dirHeader);

        offset += header.length + dataLen;
      }

      const dirOffset = offset;
      const dirSize = dirParts.reduce((acc, p) => acc + p.length, 0);

      const eocd = new Uint8Array(22);
      const eView = new DataView(eocd.buffer);

      eView.setUint32(0, 0x06054b50, true);
      eView.setUint16(8, this.files.length, true);
      eView.setUint16(10, this.files.length, true);
      eView.setUint32(12, dirSize, true);
      eView.setUint32(16, dirOffset, true);

      return new Blob([...parts, ...dirParts, eocd], {
        type: 'application/zip'
      });
    }

    crc32(r) {
      let c = -1;
      for (let i = 0; i < r.length; i++) {
        c = (c >>> 8) ^ PureZip.table[(c ^ r[i]) & 0xff];
      }
      return (c ^ -1) >>> 0;
    }
  }

  PureZip.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[i] = c;
    }
    return t;
  })();

  // 3. COLOR ACTIONS
  const COLOR_TYPES = {
    BLUE: 'rgba(59, 130, 246, 0.5)',
    GREEN: 'rgba(34, 197, 94, 0.5)',
    RED: 'rgba(239, 68, 68, 0.5)',
    YELLOW: 'rgba(234, 179, 8, 0.5)',
    PURPLE: 'rgba(168, 85, 247, 0.5)'
  };

  // 4. DYNAMIC STYLES
  const style = document.createElement('style');
  style.id = '__ig_styles';
  style.innerHTML = `
    #__ig_fullscreen {
      position: fixed; top: 0; left: 0;
      width: 100vw; height: 100vh;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      pointer-events: none;
      z-index: 2147483640;
    }
    .__ig_fs_quadrant {
      border: 1px dashed rgba(255,255,255,0.25);
      transition: background-color 0.3s ease;
    }
    #__ig_modal * { box-sizing: border-box; }
    #__ig_modal {
      position: fixed; top: 20px; right: 20px;
      width: 380px; height: 520px;
      background: rgba(15,23,42,0.92);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      border-radius: 10px;
      display: flex; flex-direction: column;
      resize: both; overflow: hidden;
      z-index: 2147483647;
      font-family: Arial, sans-serif;
      color: #fff;
    }
    .__ig_header {
      padding: 10px 12px;
      background: rgba(0,0,0,0.6);
      color: white; cursor: move;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 12px; font-weight: bold;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .__ig_controls { display: flex; gap: 6px; }
    .__ig_btn {
      border: none; padding: 4px 8px; border-radius: 4px;
      color: white; cursor: pointer; font-size: 11px; font-weight: 600;
    }
    .__ig_btn_export { background: #16a34a; }
    .__ig_btn_clean { background: #64748b; }
    .__ig_btn_close { background: #dc2626; }
    .__ig_palette_wrapper {
      padding: 10px; background: rgba(0,0,0,0.4);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .__ig_palette {
      display: flex; gap: 10px; align-items: center; justify-content: center;
      margin-bottom: 10px;
    }
    .__ig_swatch {
      width: 22px; height: 22px; border-radius: 50%;
      border: 2px solid white; cursor: pointer;
      transition: transform 0.2s;
    }
    .__ig_swatch:hover { transform: scale(1.2); }
    .__ig_legend_grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px;
      background: rgba(255,255,255,0.05); padding: 8px 10px;
      border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);
    }
    .__ig_legend_item {
      display: flex; align-items: center; gap: 6px;
      font-size: 10px; color: #cbd5e1;
    }
    .__ig_legend_badge {
      width: 10px; height: 10px; border-radius: 50%;
      border: 1px solid #fff; flex-shrink: 0;
    }
    .__ig_mini_grid {
      flex: 1; display: grid;
      grid-template-columns: repeat(3,1fr);
      grid-template-rows: repeat(3,1fr);
      gap: 4px; padding: 8px;
    }
    .__ig_mini_quadrant {
      background: rgba(255,255,255,0.05);
      border: 1px dashed rgba(255,255,255,0.3);
      border-radius: 4px; cursor: pointer; transition: all 0.2s;
    }
    .__ig_mini_quadrant.__ig_selected {
      border: 2px solid #38bdf8;
      box-shadow: 0 0 8px rgba(56,189,248,0.5);
    }
  `;
  document.head.appendChild(style);

  // 5. FULLSCREEN OVERLAY
  const fullscreenGrid = document.createElement('div');
  fullscreenGrid.id = '__ig_fullscreen';

  for (let i = 0; i < 9; i++) {
    const div = document.createElement('div');
    div.className = '__ig_fs_quadrant';
    fullscreenGrid.appendChild(div);
  }
  document.body.appendChild(fullscreenGrid);

  // 6. CONTROLLER MODAL
  const modal = document.createElement('div');
  modal.id = '__ig_modal';
  modal.innerHTML = `
    <div class="__ig_header" id="__ig_header">
      <span>🔍 Inspect Grid Controller</span>
      <div class="__ig_controls">
        <button class="__ig_btn __ig_btn_export" id="__ig_btn_export">Run Scrap</button>
        <button class="__ig_btn __ig_btn_clean" id="__ig_btn_clean">Clean</button>
        <button class="__ig_btn __ig_btn_close" id="__ig_btn_close">X</button>
      </div>
    </div>
    <div class="__ig_palette_wrapper">
      <div class="__ig_palette">
        <div class="__ig_swatch" style="background: ${COLOR_TYPES.BLUE}" data-color="${COLOR_TYPES.BLUE}" title="Text -> CSV"></div>
        <div class="__ig_swatch" style="background: ${COLOR_TYPES.GREEN}" data-color="${COLOR_TYPES.GREEN}" title="Screenshot -> ZIP"></div>
        <div class="__ig_swatch" style="background: ${COLOR_TYPES.RED}" data-color="${COLOR_TYPES.RED}" title="Text + Screenshot -> ZIP"></div>
        <div class="__ig_swatch" style="background: ${COLOR_TYPES.YELLOW}" data-color="${COLOR_TYPES.YELLOW}" title="HTML / Links"></div>
        <div class="__ig_swatch" style="background: ${COLOR_TYPES.PURPLE}" data-color="${COLOR_TYPES.PURPLE}" title="Google Search + Lens"></div>
        <div class="__ig_swatch" style="background: transparent" data-color="transparent" title="Clear"></div>
      </div>
      <div class="__ig_legend_grid">
        <div class="__ig_legend_item"><span class="__ig_legend_badge" style="background: ${COLOR_TYPES.BLUE}"></span><span>Blue: Text -> CSV</span></div>
        <div class="__ig_legend_item"><span class="__ig_legend_badge" style="background: ${COLOR_TYPES.GREEN}"></span><span>Green: Screenshot -> ZIP</span></div>
        <div class="__ig_legend_item"><span class="__ig_legend_badge" style="background: ${COLOR_TYPES.RED}"></span><span>Red: Text + Screenshot</span></div>
        <div class="__ig_legend_item"><span class="__ig_legend_badge" style="background: ${COLOR_TYPES.YELLOW}"></span><span>Yellow: HTML/Links</span></div>
        <div class="__ig_legend_item"><span class="__ig_legend_badge" style="background: ${COLOR_TYPES.PURPLE}"></span><span>Purple: Google Search/Lens</span></div>
        <div class="__ig_legend_item"><span class="__ig_legend_badge" style="background: transparent"></span><span>Clear: Remove Action</span></div>
      </div>
    </div>
    <div class="__ig_mini_grid">
      ${Array(9).fill('<div class="__ig_mini_quadrant"></div>').join('')}
    </div>
  `;
  document.body.appendChild(modal);

  // DRAG LOGIC
  const header = document.getElementById('__ig_header');
  let isDragging = false, startX = 0, startY = 0;
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - modal.offsetLeft;
    startY = e.clientY - modal.offsetTop;
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    modal.style.left = `${e.clientX - startX}px`;
    modal.style.top = `${e.clientY - startY}px`;
    modal.style.right = 'auto';
  });
  document.addEventListener('mouseup', () => { isDragging = false; });

  // GRID STATE
  let activeIndex = null;
  const miniQuadrants = modal.querySelectorAll('.__ig_mini_quadrant');
  const fsQuadrants = fullscreenGrid.querySelectorAll('.__ig_fs_quadrant');
  const quadrantColors = Array(9).fill('transparent');

  miniQuadrants.forEach((mq, index) => {
    mq.addEventListener('click', () => {
      miniQuadrants.forEach(q => q.classList.remove('__ig_selected'));
      mq.classList.add('__ig_selected');
      activeIndex = index;
    });
  });

  modal.querySelectorAll('.__ig_swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      if (activeIndex === null) return;
      const color = swatch.getAttribute('data-color').trim();
      miniQuadrants[activeIndex].style.backgroundColor = color;
      fsQuadrants[activeIndex].style.backgroundColor = color;
      quadrantColors[activeIndex] = color;
    });
  });

  document.getElementById('__ig_btn_clean').addEventListener('click', () => {
    miniQuadrants.forEach(q => { q.style.backgroundColor = 'transparent'; q.classList.remove('__ig_selected'); });
    fsQuadrants.forEach(q => { q.style.backgroundColor = 'transparent'; });
    quadrantColors.fill('transparent');
    activeIndex = null;
  });

  document.getElementById('__ig_btn_close').addEventListener('click', () => {
    modal.remove();
    fullscreenGrid.remove();
    if (style) style.remove();
  });

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function getElementsInRect(rect) {
    const elements = [];
    const all = document.body.querySelectorAll('*');
    all.forEach(el => {
      if (modal.contains(el) || fullscreenGrid.contains(el)) return;
      const r = el.getBoundingClientRect();
      if (r.top < rect.bottom && r.bottom > rect.top && r.left < rect.right && r.right > rect.left && r.width > 0 && r.height > 0) {
        elements.push(el);
      }
    });
    return elements;
  }

  // 7. SAFE SCREEN CAPTURE WITH PERMISSIONS-POLICY BYPASS
  async function captureScreen() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser', frameRate: 30 },
        audio: false
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const track = stream.getVideoTracks()[0];
      if (track) track.stop();
      video.srcObject = null;

      return { canvas, width: canvas.width, height: canvas.height };
    } catch (err) {
      console.warn('Screen Capture API blocked by Permissions-Policy. Switching to DOM Fallback Rendering.', err);
      return null; // Retorna null para disparar a renderização por Fallback
    }
  }

  // FALLBACK RENDERER (Para quando getDisplayMedia for bloqueado pelo site)
  async function captureQuadrantFallback(rect) {
    const w = Math.max(Math.round(rect.width), 10);
    const h = Math.max(Math.round(rect.height), 10);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Fundo padrão
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, h);

    const els = getElementsInRect(rect);
    for (const el of els) {
      const elRect = el.getBoundingClientRect();
      const rx = elRect.left - rect.left;
      const ry = elRect.top - rect.top;
      const rw = elRect.width;
      const rh = elRect.height;

      // Desenha imagens
      if (el.tagName === 'IMG' && el.src) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = el.src;
          await new Promise(res => { if (img.complete) res(); else img.onload = img.onerror = res; });
          ctx.drawImage(img, rx, ry, rw, rh);
        } catch (e) {}
      }

      // Desenha textos
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 && el.innerText.trim()) {
        const compStyle = window.getComputedStyle(el);
        ctx.font = `${compStyle.fontWeight} 13px Arial`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(el.innerText.trim().substring(0, 60), rx, ry + 15);
      }
    }

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }

  async function captureQuadrant(screenCapture, rect) {
    if (!screenCapture) {
      return await captureQuadrantFallback(rect);
    }

    const sourceCanvas = screenCapture.canvas;
    const scaleX = screenCapture.width / window.innerWidth;
    const scaleY = screenCapture.height / window.innerHeight;

    let sx = Math.round(rect.left * scaleX);
    let sy = Math.round(rect.top * scaleY);
    let sw = Math.round(rect.width * scaleX);
    let sh = Math.round(rect.height * scaleY);

    sx = Math.max(0, Math.min(sx, screenCapture.width));
    sy = Math.max(0, Math.min(sy, screenCapture.height));
    sw = Math.min(sw, screenCapture.width - sx);
    sh = Math.min(sh, screenCapture.height - sy);

    if (sw <= 0 || sh <= 0) return await captureQuadrantFallback(rect);

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = sw;
    outputCanvas.height = sh;
    const outputCtx = outputCanvas.getContext('2d');
    outputCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not create PNG.')), 'image/png', 1);
    });
  }

  function extractQuadrantText(rect) {
    const els = getElementsInRect(rect);
    const texts = els.map(e => e.innerText ? e.innerText.trim() : '').filter(t => t.length > 0);
    return [...new Set(texts)].join(' | ');
  }

  function openGoogleSearch(text) {
    if (!text) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(text.substring(0, 2000))}`, '_blank');
  }

  async function openGoogleLens(imageBlob, quadrantIndex) {
    if (!imageBlob) return;
    const file = new File([imageBlob], `quadrant_${quadrantIndex}_search.png`, { type: 'image/png' });
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://lens.google.com/v3/upload';
    form.enctype = 'multipart/form-data';
    form.target = '_blank';
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'file';
    input.name = 'encoded_image';

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 3000);
  }

  function extractYellowData(rect, quadrantIndex) {
    const els = getElementsInRect(rect);
    const quadrantData = { quadrantIndex, links: [], buttons: [], htmlSnippets: [] };

    els.forEach(el => {
      if (el.tagName === 'A') {
        quadrantData.links.push({ href: el.href, text: el.innerText ? el.innerText.trim() : '' });
      } else if (el.tagName === 'BUTTON') {
        quadrantData.buttons.push({ text: el.innerText ? el.innerText.trim() : '', id: el.id || null });
      }
      if (el.outerHTML && el.outerHTML.length < 500) {
        quadrantData.htmlSnippets.push(el.outerHTML);
      }
    });
    return quadrantData;
  }

  // EXPORT HANDLER
  document.getElementById('__ig_btn_export').addEventListener('click', async () => {
    const activeTypes = new Set(quadrantColors.filter(c => c !== 'transparent'));

    if (activeTypes.size === 0) {
      alert('Please select and color at least one quadrant before running scrap.');
      return;
    }

    const quadrantRects = Array.from(fsQuadrants).map(fsq => fsq.getBoundingClientRect());

    modal.style.display = 'none';
    fullscreenGrid.style.display = 'none';

    try {
      // BLUE
      if (activeTypes.has(COLOR_TYPES.BLUE)) {
        let csvLines = ["\uFEFFRow,Col,Extracted Text"];
        fsQuadrants.forEach((fsq, idx) => {
          if (quadrantColors[idx] !== COLOR_TYPES.BLUE) return;
          const rect = quadrantRects[idx];
          const r = Math.floor(idx / 3) + 1;
          const c = (idx % 3) + 1;
          const text = extractQuadrantText(rect);
          csvLines.push(`"Row ${r}","Col ${c}","${text.replace(/"/g, '""')}"`);
        });

        downloadBlob(new Blob([csvLines.join("\n")], { type: 'text/csv;charset=utf-8;' }), `blue_text_export_${Date.now()}.csv`);
      }

      // CAPTURE SCREEN
      let screenCapture = null;
      const needsScreenshot =
        activeTypes.has(COLOR_TYPES.GREEN) ||
        activeTypes.has(COLOR_TYPES.RED) ||
        activeTypes.has(COLOR_TYPES.PURPLE);

      if (needsScreenshot) {
        screenCapture = await captureScreen();
      }

      // GREEN
      if (activeTypes.has(COLOR_TYPES.GREEN)) {
        const zip = new PureZip();
        for (let idx = 0; idx < fsQuadrants.length; idx++) {
          if (quadrantColors[idx] !== COLOR_TYPES.GREEN) continue;
          const rect = quadrantRects[idx];
          const blob = await captureQuadrant(screenCapture, rect);
          const buffer = await blob.arrayBuffer();
          zip.addFile(`quadrant_${idx + 1}_screenshot.png`, new Uint8Array(buffer));
        }
        downloadBlob(zip.generateBlob(), `green_images_export_${Date.now()}.zip`);
      }

      // RED
      if (activeTypes.has(COLOR_TYPES.RED)) {
        const zip = new PureZip();
        for (let idx = 0; idx < fsQuadrants.length; idx++) {
          if (quadrantColors[idx] !== COLOR_TYPES.RED) continue;
          const rect = quadrantRects[idx];
          const text = extractQuadrantText(rect);
          zip.addFile(`quadrant_${idx + 1}_text.txt`, text || 'No text found.');

          const imageBlob = await captureQuadrant(screenCapture, rect);
          const imageBuffer = await imageBlob.arrayBuffer();
          zip.addFile(`quadrant_${idx + 1}_screenshot.png`, new Uint8Array(imageBuffer));
        }
        downloadBlob(zip.generateBlob(), `red_full_scrap_${Date.now()}.zip`);
      }

      // YELLOW
      if (activeTypes.has(COLOR_TYPES.YELLOW)) {
        const yellowResults = [];
        fsQuadrants.forEach((fsq, idx) => {
          if (quadrantColors[idx] !== COLOR_TYPES.YELLOW) return;
          yellowResults.push(extractYellowData(quadrantRects[idx], idx + 1));
        });
        downloadBlob(new Blob([JSON.stringify(yellowResults, null, 2)], { type: 'application/json' }), `yellow_elements_data_${Date.now()}.json`);
      }

      // PURPLE
      if (activeTypes.has(COLOR_TYPES.PURPLE)) {
        for (let idx = 0; idx < fsQuadrants.length; idx++) {
          if (quadrantColors[idx] !== COLOR_TYPES.PURPLE) continue;
          const rect = quadrantRects[idx];
          const text = extractQuadrantText(rect);
          if (text) openGoogleSearch(text);

          const imageBlob = await captureQuadrant(screenCapture, rect);
          await openGoogleLens(imageBlob, idx + 1);
        }
      }
    } catch (err) {
      console.error('Scrap execution error:', err);
      alert('Scrap error: ' + (err && err.message ? err.message : err));
    } finally {
      modal.style.display = 'flex';
      fullscreenGrid.style.display = 'grid';
    }
  });

  console.log('🚀 Inspect Grid loaded with automatic Permissions-Policy Bypass!');
})();
