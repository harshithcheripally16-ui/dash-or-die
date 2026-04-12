export let canvas;
export let ctx;

export function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas ? canvas.getContext('2d') : null;

    if (ctx && !ctx.roundRect) {
        ctx.roundRect = function (x, y, w, h, r) {
            if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
            else r = { tl: r[0], tr: r[1], br: r[2], bl: r[3] };
            this.beginPath();
            this.moveTo(x + r.tl, y);
            this.lineTo(x + w - r.tr, y);
            this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
            this.lineTo(x + w, y + h - r.br);
            this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
            this.lineTo(x + r.bl, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
            this.lineTo(x, y + r.bl);
            this.quadraticCurveTo(x, y, x + r.tl, y);
            this.closePath();
            return this;
        };
    }
}

export function resizeCanvas() {
    if (!canvas) return;
    const padding = 40;
    let targetWidth = window.innerWidth - padding;
    let targetHeight = window.innerHeight - padding;
    const maxWidth = 800;
    const maxHeight = 1000;
    
    canvas.width = Math.min(targetWidth, maxWidth);
    canvas.height = Math.min(targetHeight, maxHeight);
}

export function drawGrid() {
    if (!ctx || !canvas) return;
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Static Grid
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Arena Boundary
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // Glowing corners
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#8b5cf6';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 0;
}
