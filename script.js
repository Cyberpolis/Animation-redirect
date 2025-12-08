// ----------------- لینک‌های مجاز -----------------
const siteLinks = {
    youtube: "https://youtube.com",
    project1: "https://example1.com",
    project2: "https://example2.com",
    dashboard: "https://example3.com",
    portal: "https://example4.com"
};

// ----------------- ورودی -----------------
const input = document.getElementById("siteInput");
const display = document.getElementById("displayName");

input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        const name = input.value.trim().toLowerCase();
        display.textContent = name;

        if (siteLinks[name]) {
            morphToText(name, siteLinks[name]);
        } else {
            display.textContent = "Not allowed!";
        }
    }
});

// ----------------- انیمیشن اصلی Three.js -----------------
let scene, camera, renderer, particles;
let currentState = 'sphere';
let count = 12000;

function init() {
    scene = new THREE.Scene();

    // تنظیم دوربین ریسپانسیو
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

    // تنظیم فاصله دوربین بر اساس دستگاه
    adjustCameraAndParticles();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    document.getElementById('container').appendChild(renderer.domElement);

    createParticles();
    animate();
}

// ----------------- تابع ایجاد پارتیکل -----------------
function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);
        positions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

        const color = new THREE.Color();
        const depth = Math.sqrt(point.x*point.x + point.y*point.y + point.z*point.z)/8;
        color.setHSL(0.5 + depth*0.2, 0.7, 0.4 + depth*0.3);

        colors[i*3] = color.r;
        colors[i*3 + 1] = color.g;
        colors[i*3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });

    if (particles) scene.remove(particles);
    particles = new THREE.Points(geometry, material);
    particles.rotation.set(0,0,0);
    scene.add(particles);
}

// ----------------- Morph به متن -----------------
function createTextPoints(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 100;
    const padding = 20;
    ctx.font = `bold ${fontSize}px Arial`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    canvas.width = textWidth + padding*2;
    canvas.height = fontSize + padding*2;
    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width/2, canvas.height/2);
    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const pixels = imageData.data;
    const points = [];
    const threshold = 128;
    for (let i=0;i<pixels.length;i+=4){
        if(pixels[i]>threshold){
            const x = (i/4)%canvas.width;
            const y = Math.floor((i/4)/canvas.width);
            if(Math.random()<0.3){
                points.push({x:(x-canvas.width/2)/(fontSize/10),y:-(y-canvas.height/2)/(fontSize/10)});
            }
        }
    }
    return points;
}

function morphToText(text, redirectUrl=null){
    currentState='text';
    const textPoints = createTextPoints(text);
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count*3);

    gsap.to(particles.rotation,{x:0,y:0,z:0,duration:0.5});

    for(let i=0;i<count;i++){
        if(i<textPoints.length){
            targetPositions[i*3] = textPoints[i].x;
            targetPositions[i*3+1] = textPoints[i].y;
            targetPositions[i*3+2] = 0;
        }else{
            const angle = Math.random()*Math.PI*2;
            const radius = Math.random()*20+10;
            targetPositions[i*3] = Math.cos(angle)*radius;
            targetPositions[i*3+1] = Math.sin(angle)*radius;
            targetPositions[i*3+2] = (Math.random()-0.5)*10;
        }
    }

    for(let i=0;i<positions.length;i+=3){
        gsap.to(particles.geometry.attributes.position.array,{
            [i]: targetPositions[i],
            [i+1]: targetPositions[i+1],
            [i+2]: targetPositions[i+2],
            duration:2,
            ease:"power2.inOut",
            onUpdate:()=>{particles.geometry.attributes.position.needsUpdate=true;}
        });
    }

    setTimeout(() => { morphToCircle(); }, 3000);

    if(redirectUrl){
        setTimeout(() => { window.location.href = redirectUrl; }, 6000);
    }
}

function morphToCircle() {
    currentState = 'sphere';
    const positions = particles.geometry.attributes.position.array;
    const targetPositions = new Float32Array(count*3);
    const colors = particles.geometry.attributes.color.array;

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        return { x: 8*Math.cos(theta)*Math.sin(phi), y:8*Math.sin(theta)*Math.sin(phi), z:8*Math.cos(phi) };
    }

    for(let i=0;i<count;i++){
        const point = sphericalDistribution(i);
        targetPositions[i*3] = point.x + (Math.random()-0.5)*0.5;
        targetPositions[i*3+1] = point.y + (Math.random()-0.5)*0.5;
        targetPositions[i*3+2] = point.z + (Math.random()-0.5)*0.5;

        const depth = Math.sqrt(point.x*point.x+point.y*point.y+point.z*point.z)/8;
        const color = new THREE.Color();
        color.setHSL(0.5 + depth*0.2, 0.7, 0.4 + depth*0.3);
        colors[i*3] = color.r;
        colors[i*3+1] = color.g;
        colors[i*3+2] = color.b;
    }

    for(let i=0;i<positions.length;i+=3){
        gsap.to(particles.geometry.attributes.position.array,{
            [i]: targetPositions[i],
            [i+1]: targetPositions[i+1],
            [i+2]: targetPositions[i+2],
            duration:2,
            ease:"power2.inOut",
            onUpdate:()=>{particles.geometry.attributes.position.needsUpdate=true;}
        });
    }

    for(let i=0;i<colors.length;i+=3){
        gsap.to(particles.geometry.attributes.color.array,{
            [i]: colors[i],
            [i+1]: colors[i+1],
            [i+2]: colors[i+2],
            duration:2,
            ease:"power2.inOut",
            onUpdate:()=>{particles.geometry.attributes.color.needsUpdate=true;}
        });
    }
}

function animate(){
    requestAnimationFrame(animate);
    if(currentState==='sphere'){particles.rotation.y+=0.002;}
    renderer.render(scene,camera);
}

window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);

    // تنظیم مجدد دوربین و پارتیکل‌ها هنگام تغییر سایز
    adjustCameraAndParticles();
});

init();


// ------------------------------------------------------------
// 🔥 اضافه شدن دکمه فلش جهت ارسال
// ------------------------------------------------------------

const sendBtn = document.getElementById("sendBtn");

sendBtn.addEventListener("click", () => {
    const name = input.value.trim().toLowerCase();
    display.textContent = name;

    if (siteLinks[name]) {
        morphToText(name, siteLinks[name]);
    } else {
        display.textContent = "Not allowed!";
    }
});

// ------------------------------------------------------------
// 🔥 توابع جدید برای ریسپانسیو
// ------------------------------------------------------------
function adjustCameraAndParticles() {
    const width = window.innerWidth;

    if(width < 600){ // موبایل
        camera.position.set(0,0,30);
        count = 7000;
    } else if(width < 1024){ // تبلت
        camera.position.set(0,0,28);
        count = 10000;
    } else { // دسکتاپ
        camera.position.set(0,0,25);
        count = 12000;
    }

    // اگر پارتیکل‌ها قبلا ایجاد شده‌اند، دوباره بساز
    if(scene && particles){
        createParticles();
    }
}
