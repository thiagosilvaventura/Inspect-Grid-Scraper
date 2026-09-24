(function() {
    // 1. UI CREATION (Floating Panel)
    const panel = document.createElement('div');
    panel.id = 'thiago-mouse-tracker';
    panel.style.cssText = `
        position: fixed; top: 20px; right: 20px; width: 400px; height: 350px;
        background: #f4f4f9; border: 1px solid #ccc; z-index: 999999;
        display: flex; flex-direction: column; resize: both; overflow: hidden;
        box-shadow: 0 8px 16px rgba(0,0,0,0.3); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        border-radius: 8px; box-sizing: border-box;
    `;

    // Header (Draggable Area)
    const header = document.createElement('div');
    header.textContent = 'mouse behavior - created by Thiago ventura';
    header.style.cssText = `
        background: #2c3e50; color: #fff; padding: 12px; cursor: move;
        font-weight: bold; font-size: 14px; user-select: none; text-align: center;
        border-top-left-radius: 8px; border-top-right-radius: 8px;
    `;
    panel.appendChild(header);

    // Controls (Buttons)
    const controls = document.createElement('div');
    controls.style.cssText = 'padding: 10px; display: flex; gap: 10px; background: #fff; border-bottom: 1px solid #eee;';
    
    const btnStart = document.createElement('button');
    btnStart.textContent = '▶ Start';
    btnStart.style.cssText = 'flex: 1; padding: 8px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;';
    
    const btnStop = document.createElement('button');
    btnStop.textContent = '⏹ Stop';
    btnStop.disabled = true;
    btnStop.style.cssText = 'flex: 1; padding: 8px; background: #c0392b; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; opacity: 0.5;';
    
    controls.appendChild(btnStart);
    controls.appendChild(btnStop);
    panel.appendChild(controls);

    // Canvas Area (Cartesian Plane)
    const canvasContainer = document.createElement('div');
    canvasContainer.style.cssText = 'flex-grow: 1; background: #fff; padding: 10px; overflow: hidden; display: flex; justify-content: center; align-items: center;';
    
    const canvas = document.createElement('canvas');
    // Internal canvas resolution matches the real screen size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Scaled view to fit inside the panel
    canvas.style.cssText = 'width: 100%; height: 100%; object-fit: contain; border: 1px solid #ddd; background: #fff; background-image: linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px); background-size: 20px 20px;';
    
    canvasContainer.appendChild(canvas);
    panel.appendChild(canvasContainer);
    document.body.appendChild(panel);

    // 2. DRAGGABLE PANEL LOGIC
    let isDragging = false, startX, startY, initialLeft, initialTop;
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = panel.offsetLeft;
        initialTop = panel.offsetTop;
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            panel.style.left = `${initialLeft + (e.clientX - startX)}px`;
            panel.style.top = `${initialTop + (e.clientY - startY)}px`;
            panel.style.right = 'auto'; // Removes right-side anchoring
        }
    });
    document.addEventListener('mouseup', () => isDragging = false);

    // 3. MAPPING AND DATA CAPTURE LOGIC
    const ctx = canvas.getContext('2d');
    let isRecording = false;
    let trackingData = [];
    let startTime = 0;

    // Initial Canvas setup to ensure the JPG exports with a white background
    function resetCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(41, 128, 185, 0.6)'; // Mouse trail color
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
    }
    resetCanvas();

    function recordEvent(e) {
        if (!isRecording) return;
        
        // Prevents capturing clicks and movements over the tracker panel itself
        if (panel.contains(e.target)) return;

        const timeElapsed = Date.now() - startTime;
        const x = e.clientX;
        const y = e.clientY;
        const type = e.type;

        trackingData.push({ time: timeElapsed, x, y, type });

        if (type === 'mousemove') {
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (type === 'mousedown' || type === 'click') {
            // Draws a red dot to indicate a click
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(231, 76, 60, 0.8)'; // Red
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    }

    const eventsToTrack = ['mousemove', 'mousedown', 'click'];

    // 4. START AND STOP BUTTON ACTIONS
    btnStart.addEventListener('click', () => {
        isRecording = true;
        trackingData = [];
        startTime = Date.now();
        
        btnStart.disabled = true;
        btnStart.style.opacity = '0.5';
        btnStop.disabled = false;
        btnStop.style.opacity = '1';

        resetCanvas();
        eventsToTrack.forEach(evt => document.addEventListener(evt, recordEvent));
    });

    btnStop.addEventListener('click', () => {
        isRecording = false;
        
        btnStart.disabled = false;
        btnStart.style.opacity = '1';
        btnStop.disabled = true;
        btnStop.style.opacity = '0.5';

        eventsToTrack.forEach(evt => document.removeEventListener(evt, recordEvent));

        downloadCSV();
        downloadJPG();
    });

    // 5. EXPORT FUNCTIONS
    function downloadCSV() {
        let csvContent = "Time Elapsed (ms),X,Y,Action\n";
        trackingData.forEach(row => {
            csvContent += `${row.time},${row.x},${row.y},${row.type}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `mouse_behavior_data_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function downloadJPG() {
        const link = document.createElement('a');
        link.download = `mouse_behavior_map_${Date.now()}.jpg`;
        // Exports with a white background at maximum quality
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.click();
    }
})();
