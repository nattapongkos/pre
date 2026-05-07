document.addEventListener('DOMContentLoaded', () => {

    // ===================================================
    // 0. FIREBASE SETUP
    // ===================================================
    const firebaseConfig = {
        apiKey: "AIzaSyBDQxNxfjBamjOVfdqrVUy6J5feBlbIL9I",
        authDomain: "profilentk.firebaseapp.com",
        projectId: "profilentk",
        storageBucket: "profilentk.firebasestorage.app",
        messagingSenderId: "8292476285",
        appId: "1:8292476285:web:50bb213feaeab6be4ed814",
        measurementId: "G-WX1NLE1YV3"
    };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();

    // เช็คว่าถ้าล็อกอินค้างไว้อยู่แล้ว ให้เด้งไปหน้าแอดมินเลย
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'admin.html';
        }
    });

    // ระบบ Login Modal
    window.openLoginModal = function() {
        document.getElementById('loginModal').classList.add('open');
    }
    window.closeLoginModal = function() {
        document.getElementById('loginModal').classList.remove('open');
        document.getElementById('loginError').style.display = 'none';
        document.getElementById('loginForm').reset();
    }

    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const pass = document.getElementById('adminPassword').value;
        const btn = e.target.querySelector('button');
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
        btn.disabled = true;

        auth.signInWithEmailAndPassword(email, pass)
            .then(() => {
                // ล็อกอินสำเร็จ auth.onAuthStateChanged จะทำงานและพาไปหน้า admin.html เอง
            })
            .catch(err => {
                document.getElementById('loginError').style.display = 'block';
                btn.innerHTML = 'เข้าสู่ระบบ';
                btn.disabled = false;
            });
    });
    // ===================================================
    // 1. HERO — Character Navigation
    // ===================================================
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');
    const heroChars = document.querySelectorAll('.char-img');
    let currentIndex = 1;

    function updateHeroCharacters() {
        if (!heroChars.length) return;
        heroChars.forEach((char, idx) => char.classList.toggle('char-center', idx === currentIndex));
    }

    rightArrow?.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % heroChars.length;
        updateHeroCharacters();
    });
    leftArrow?.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + heroChars.length) % heroChars.length;
        updateHeroCharacters();
    });


    

    // ===================================================
    // 2. BANNER — Realtime จาก Firebase
    // ===================================================
    db.collection('settings').doc('main_banner').onSnapshot((doc) => {
        const headingEl = document.getElementById('heroHeading');
        const subtextEl = document.getElementById('heroSubtext');
        const heroSection = document.getElementById('heroSection');

        if (doc.exists) {
            const data = doc.data();

            if (data.heading && headingEl) headingEl.textContent = data.heading;
            if (data.subtext && subtextEl) subtextEl.innerHTML = data.subtext.replace(/\n/g, '<br>');

            if (data.imageUrl && heroSection) {
                heroSection.style.backgroundImage = `url('${data.imageUrl}')`;
                heroSection.style.backgroundSize = 'cover';
                heroSection.style.backgroundPosition = 'center';
                heroSection.style.setProperty('--hero-overlay', 'rgba(244,247,254,0.82)');
                heroSection.style.boxShadow = 'inset 0 0 0 2000px rgba(255,255,255,0.1)';
            } else if (heroSection) {
                heroSection.style.backgroundImage = '';
                heroSection.style.boxShadow = '';
            }
        }
    }, (err) => console.warn('Banner load error:', err));

    // ===================================================
    // NEW: PROFILE — Realtime จาก Firebase
    // ===================================================
    db.collection('settings').doc('profile').onSnapshot((doc) => {
        if (doc.exists) {
            const d = doc.data();
            if (d.name) document.getElementById('profName').textContent = d.name;
            if (d.position) document.getElementById('profPosition').textContent = d.position;
            if (d.bio) document.getElementById('profBio').innerHTML = d.bio.replace(/\n/g, '<br>');
            if (d.job) document.getElementById('profJob').innerHTML = d.job.replace(/\n/g, '<br>');
            if (d.others) document.getElementById('profOthers').innerHTML = d.others.replace(/\n/g, '<br>');
            if (d.imageUrl) document.getElementById('profImg').src = d.imageUrl;
        }
    });
    // ===================================================
    // 3. PORTFOLIO (TIMELINE) — โหลด + Render Cards
    // ===================================================
    const portfolioCards = document.getElementById('portfolioCards');

    const defaultImages = {
        c2: 'https://api.dicebear.com/9.x/bottts/svg?seed=Project3D&backgroundColor=transparent',
        c4: 'https://api.dicebear.com/9.x/bottts/svg?seed=LessonPlan&backgroundColor=transparent',
        c7: 'https://api.dicebear.com/9.x/bottts/svg?seed=Reward&backgroundColor=transparent',
        c1: 'https://api.dicebear.com/9.x/bottts/svg?seed=Nature&backgroundColor=transparent',
        c5: 'https://api.dicebear.com/9.x/bottts/svg?seed=Tech&backgroundColor=transparent',
        c3: 'https://api.dicebear.com/9.x/bottts/svg?seed=Art&backgroundColor=transparent',
        c6: 'https://api.dicebear.com/9.x/bottts/svg?seed=Sport&backgroundColor=transparent',
        c10: 'https://api.dicebear.com/9.x/bottts/svg?seed=Science&backgroundColor=transparent',
    };

    function buildPortfolioCard(item) {
        const c = item.color || 'c2';
        // อ้างอิงรูปภาพตามที่ตั้งไว้ หรือใช้รูปค่าเริ่มต้น
        const imgSrc = item.imageUrl || (typeof defaultImages !== 'undefined' ? (defaultImages[c] || defaultImages.c2) : 'https://api.dicebear.com/9.x/bottts/svg?seed=Default');

        return `
        <div class="portfolio-card" style="animation: fadeCardIn 0.5s ease both;">
            <div class="card-accent-bar bg-${c}-btn"></div>
            <div class="card-img-bg">
                <img src="${imgSrc}" alt="${item.title || ''}" onerror="this.src='https://api.dicebear.com/9.x/bottts/svg?seed=Default&backgroundColor=transparent'">
            </div>
            <div class="card-info">
                <h3 class="${c}-text">${item.title || '(ไม่มีชื่อ)'}</h3>
                <p>${item.desc || ''}</p>
                <div class="card-actions">
                    <button onclick="openPortDetail('${item.id}')" class="btn-view bg-${c}-btn" style="border:none; width: 100%; text-align:center; display:flex; align-items:center; justify-content:center; padding:12px; border-radius:12px; font-weight:600; font-size:.85rem; cursor:pointer; color:white; font-family: var(--font-main);">
                        <i class="fas fa-search-plus" style="margin-right: 8px;"></i> ดูรายละเอียดผลงาน
                    </button>
                </div>
            </div>
        </div>`;
    }

    let allPortfolios = [];
    db.collection('portfolio').orderBy('order', 'asc').onSnapshot((snap) => {
        if (!portfolioCards) return;
        if (snap.empty) {
            portfolioCards.innerHTML = `
                <div class="port-empty">
                    <i class="fas fa-palette"></i>
                    <p>ยังไม่มีผลงาน</p>
                </div>`;
            return;
        }
        allPortfolios = [];
        snap.forEach(doc => allPortfolios.push({ id: doc.id, ...doc.data() }));
        renderPortfolioCards(6);
    });

    window.renderPortfolioCards = function(limit) {
        const displayCards = allPortfolios.slice(0, limit);
        portfolioCards.innerHTML = displayCards.map(buildPortfolioCard).join('');
        
        // แอนิเมชัน
        portfolioCards.querySelectorAll('.portfolio-card').forEach((card, i) => {
            card.style.animationDelay = `${(i % 6) * 0.1}s`;
        });

        if (allPortfolios.length > limit) {
            portfolioCards.innerHTML += `
                <div style="width: 100%; text-align: center; margin-top: 40px; grid-column: 1/-1;">
                    <button onclick="renderPortfolioCards(${limit + 6})" class="btn-signin" style="cursor:pointer; border:none; padding: 12px 35px; font-family: var(--font-main); display:inline-flex; align-items:center; gap:8px;">
                        <i class="fas fa-chevron-down"></i> ดูสื่อและผลงานเพิ่มเติม
                    </button>
                </div>
            `;
        }
    };

   // ==========================================
    // ฟังก์ชันสำหรับเปิด/ปิด Popup รายละเอียดผลงาน
    // ==========================================
    window.openModal = function(id) {
        document.getElementById(id).classList.add('open');
    };
    
    window.closeModal = function(id) {
        document.getElementById(id).classList.remove('open');
    };

    window.openPortDetail = function(id) {
        const item = allPortfolios.find(p => p.id === id);
        if (!item) return;

        // นำข้อมูลไปใส่ใน Popup (แก้ไข ID ให้ตรงกับ index.html)
        document.getElementById('detailTitle').textContent = item.title || 'ไม่มีชื่อ';
        
        // แยกระหว่างคำอธิบายสั้นและยาวให้ตรงกับ Layout ใหม่
        document.getElementById('detailDesc').textContent = item.desc || '';
        document.getElementById('detailLongDesc').textContent = item.portLongDesc || 'ไม่มีรายละเอียดเพิ่มเติม';
        
        document.getElementById('detailImg').src = item.imageUrl || 'https://api.dicebear.com/9.x/bottts/svg?seed=Default';
        
        const badge = document.getElementById('detailBadge');
        badge.textContent = item.badge || 'ผลงาน';
        // เปลี่ยนสีป้ายให้ตรงกับธีมการ์ด
        badge.className = `detail-badge bg-${item.color || 'c5'}-btn`;

        // จัดการลิงก์ปุ่มภายใน Popup (แก้ไข ID ให้ตรงกับ index.html)
        const link1 = document.getElementById('detailBtn1');
        const link2 = document.getElementById('detailBtn2');
        
        link1.href = item.btn1Link || '#';
        link1.innerHTML = `<i class="fas fa-external-link-alt"></i> <span>${item.btn1 || 'ดูรายละเอียด'}</span>`;
        link1.style.display = (item.btn1Link && item.btn1Link !== '#') ? 'flex' : 'none';

        link2.href = item.btn2Link || '#';
        link2.innerHTML = `<i class="fas fa-images"></i> <span>${item.btn2 || 'แกลลอรี'}</span>`;
        link2.style.display = (item.btn2Link && item.btn2Link !== '#') ? 'flex' : 'none';

        // สั่งเปิด Popup
        openModal('modalPortDetail');
    };

    // ===================================================
    // 4. FILES — โหลดไฟล์ + Filter Tabs (Light Theme Update)
    // ===================================================
    const publicFileGrid = document.getElementById('publicFileGrid');
    const filesTabs = document.getElementById('filesTabs');
    let allFiles = [];
    let activeFileTab = '';

    const fileIconMap = {
        pdf: { icon: 'fa-file-pdf', cls: 'icon-pdf' },
        document: { icon: 'fa-file-word', cls: 'icon-doc' },
        image: { icon: 'fa-file-image', cls: 'icon-img' },
        video: { icon: 'fa-file-video', cls: 'icon-vid' },
        zip: { icon: 'fa-file-archive', cls: 'icon-zip' },
        other: { icon: 'fa-file', cls: 'icon-other' }
    };

   window.renderPublicFiles = function(cat, limit = 6) {
        if (!publicFileGrid) return;
        const filtered = cat ? allFiles.filter(f => f.cat === cat || f.type === cat) : allFiles;

        if (filtered.length === 0) {
            publicFileGrid.innerHTML = `<div class="files-empty"><i class="fas fa-folder-open"></i><p>ไม่มีไฟล์ในหมวดนี้</p></div>`;
            return;
        }

        const displayFiles = filtered.slice(0, limit);
        publicFileGrid.innerHTML = displayFiles.map((item, i) => {
            const fi = fileIconMap[item.type] || fileIconMap.other;
            
            // เช็คประเภทไฟล์และกำหนด Class สีมาตรฐาน
            let typeClass = "file-other";
            if(item.type === 'pdf') typeClass = "file-pdf";
            else if(item.type === 'document') typeClass = "file-doc";
            else if(item.type === 'image') typeClass = "file-img";
            else if(item.type === 'video') typeClass = "file-vid";
            else if(item.type === 'zip') typeClass = "file-zip";

            return `
            <a href="${item.url || '#'}" target="_blank" class="file-card-public ${typeClass}" style="animation:fadeCardIn 0.4s ease ${(i%6) * 0.05}s both;">
                <div class="file-card-icon"><i class="fas ${fi.icon} ${fi.cls}"></i></div>
                <div class="file-card-info">
                    <div class="file-card-name">${item.name || '(ไม่มีชื่อ)'}</div>
                    ${item.cat ? `<span class="file-card-cat">${item.cat}</span>` : ''}
                </div>
                <div class="icon-download-btn"><i class="fas fa-download"></i></div>
            </a>`;
        }).join('');

        if (filtered.length > limit) {
            publicFileGrid.innerHTML += `
                <div style="width: 100%; text-align: center; margin-top: 30px; grid-column: 1/-1;">
                    <button onclick="renderPublicFiles('${cat}', ${limit + 6})" class="btn-signin" style="cursor:pointer; border:none; padding:12px 35px; font-family: var(--font-main); display:inline-flex; align-items:center; gap:8px;">
                        <i class="fas fa-chevron-down"></i> ดูเอกสารเพิ่มเติม
                    </button>
                </div>
            `;
        }
    };

    function buildFileTabs(files) {
        if (!filesTabs) return;
        const cats = [...new Set(files.map(f => f.cat).filter(Boolean))];

        filesTabs.innerHTML = `<button class="files-tab-btn active" data-cat="">ทั้งหมด</button>` +
            cats.map(cat => `<button class="files-tab-btn" data-cat="${cat}">${cat}</button>`).join('');

        filesTabs.querySelectorAll('.files-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                filesTabs.querySelectorAll('.files-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFileTab = btn.dataset.cat;
                renderPublicFiles(activeFileTab);
            });
        });
    }

    // Realtime listener ไฟล์ (เปลี่ยนมาเรียงตามลำดับ order จากน้อยไปมาก)
    db.collection('files').orderBy('order', 'asc').onSnapshot((snap) => {
        allFiles = [];
        snap.forEach(doc => allFiles.push({ id: doc.id, ...doc.data() }));
        buildFileTabs(allFiles);
        renderPublicFiles(activeFileTab);
    }, (err) => {
        console.warn('Files load error:', err);
        if (publicFileGrid) publicFileGrid.innerHTML = `
            <div class="files-empty" style="grid-column:1/-1;">
                <i class="fas fa-exclamation-circle"></i>
                <p>โหลดไฟล์ไม่สำเร็จ</p>
            </div>`;
    });

    // ===================================================
    // 5. CARD ACTIONS — click effect
    // ===================================================
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.card-actions a');
        if (!btn) return;
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = '', 150);
    });

    // ===================================================
    // 6. MOBILE MENU TOGGLE
    // ===================================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');

    mobileMenuBtn?.addEventListener('click', () => navMenu?.classList.toggle('show-mobile'));

    // ===================================================
    // 7. SMOOTH SCROLL
    // ===================================================
    document.querySelectorAll('#mainNavMenu a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                navMenu?.classList.remove('show-mobile');
                document.querySelectorAll('#mainNavMenu a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // ===================================================
    // 8. CSS Animation Setup
    // ===================================================
    if (!document.querySelector('#runtime-anim')) {
        const s = document.createElement('style');
        s.id = 'runtime-anim';
        s.textContent = `
            @keyframes fadeCardIn {
                from { opacity: 0; transform: translateY(20px); }
                to   { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(s);
    }


    // ===================================================
    // 9. MAP FRONT-END (แผนที่การเยี่ยมบ้านหน้าแรก)
    // ===================================================
    async function initFrontMap() {
        const mapCanvas = document.getElementById('frontMapCanvas');
        if (!mapCanvas || typeof L === 'undefined') return;

        // ดึงพิกัดและชื่อโรงเรียน
        let appSettings = JSON.parse(localStorage.getItem('appSettings')) || { schoolGPS: '13.736717, 100.523186', schoolName: 'โรงเรียน' };
        
        let sLat = 13.736717, sLng = 100.523186;
        if(appSettings.schoolGPS) { 
            const parts = appSettings.schoolGPS.split(','); 
            if(parts.length === 2) { 
                sLat = parseFloat(parts[0].trim()); 
                sLng = parseFloat(parts[1].trim()); 
            } 
        }

        // สร้างแผนที่
        const frontMap = L.map('frontMapCanvas').setView([sLat, sLng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(frontMap);

        // ระบบปุ่ม เปิด-ปิด แผนที่
        const toggleBtn = document.getElementById('toggleMapBtn');
        const mapContainer = document.getElementById('homeVisitMap');
        
        if(toggleBtn && mapContainer) {
            toggleBtn.addEventListener('click', () => {
                mapContainer.classList.toggle('collapsed');
                
                if(mapContainer.classList.contains('collapsed')) {
                    toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> เปิดดูแผนที่';
                } else {
                    toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i> ซ่อนแผนที่';
                    // บังคับให้ Leaflet คำนวณขนาดใหม่เมื่อเปิดออก (ป้องกันปัญหากรอบเทา)
                    setTimeout(() => {
                        frontMap.invalidateSize();
                    }, 500);
                }
            });
        }

        // ปักหมุดโรงเรียน
        const schoolIcon = L.divIcon({ 
            className: 'custom-school-icon', 
            html: `<div style="background-color:#4f46e5; width:28px; height:28px; border-radius:50%; border:3px solid white; box-shadow:0 0 15px rgba(0,0,0,0.3); display:flex; justify-content:center; align-items:center;"><span style="font-size:14px;">🏫</span></div>`, 
            iconSize: [28, 28], 
            iconAnchor: [14, 14] 
        });
        
        L.marker([sLat, sLng], {icon: schoolIcon})
            .addTo(frontMap)
            .bindPopup(`<b style="font-family:'Prompt'; color:#4f46e5; font-size:15px;">🏫 ${appSettings.schoolName}</b>`);

        const bounds = [[sLat, sLng]];

        // โหลดข้อมูลจาก Firebase
        db.collection('home_visit_data').get().then(async (snap) => {
            if(snap.empty) return;
            
            for(let doc of snap.docs) {
                const v = doc.data();
                if(v.type === 'visit' && v.gps_lat && v.gps_lng) {
                    const lat = parseFloat(v.gps_lat);
                    const lng = parseFloat(v.gps_lng);
                    bounds.push([lat, lng]);

                    const color = v.risk_level === 'เร่งด่วน' ? '#e11d48' : v.risk_level === 'เฝ้าระวัง' ? '#f59e0b' : '#10b981'; 
                    let popupContent = `<b style="font-family:'Prompt'; font-size:14px;">${v.student_name}</b><br><span style="font-family:'Prompt'; font-size:12px; color:#64748b;">ชั้น: ${v.class_level || '-'}</span>`;
                    
                    L.circleMarker([lat, lng], {
                        color: color, fillColor: color, fillOpacity: 0.8, radius: 8
                    }).addTo(frontMap).bindPopup(popupContent);

                    try {
                        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${lng},${lat}?overview=full&geometries=geojson`);
                        const data = await res.json();
                        if(data.code === 'Ok' && data.routes.length > 0) {
                            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                            L.polyline(coords, { color: color, weight: 3, opacity: 0.6 }).addTo(frontMap);
                        } else {
                            L.polyline([[sLat, sLng], [lat, lng]], { color: color, weight: 2, opacity: 0.5, dashArray: '5, 5' }).addTo(frontMap);
                        }
                    } catch(e) {
                        L.polyline([[sLat, sLng], [lat, lng]], { color: color, weight: 2, opacity: 0.5, dashArray: '5, 5' }).addTo(frontMap);
                    }
                }
            }
            if(bounds.length > 0) frontMap.fitBounds(bounds, {padding: [50, 50]});
        });
    }

    setTimeout(initFrontMap, 500);




});