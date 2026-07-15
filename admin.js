// ===================================================
// ส่วนที่ 1: ตั้งค่า Firebase และตัวแปรระบบ
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

// ซ่อนเนื้อหาทั้งหมดก่อนจนกว่าจะยืนยันตัวตนสำเร็จ (ป้องกันหน้าเว็บกระพริบให้เห็นข้อมูล)
document.body.style.display = 'none';

auth.onAuthStateChanged(user => {
    if (!user) {
        // ถ้าไม่มีข้อมูลการล็อกอิน ให้เตะกลับไปหน้าแรกทันที
        window.location.replace('index.html');
    } else {
        // ถ้ายืนยันตัวตนผ่าน ให้แสดงหน้าเว็บและโหลดข้อมูล
        document.body.style.display = 'block';
    }
});

// ฟังก์ชันสำหรับปุ่มออกจากระบบ
window.logoutAdmin = function() {
    auth.signOut().then(() => {
        window.location.replace('index.html');
    });
};
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbybFQuMn_Yn_mUzx7469NSsV7srIkAuoCUE4nSPfgj2VlTsG8YmoFPLC-Vy5yobYn2I/exec";
const GAS_UPLOAD_URL = "https://script.google.com/macros/s/AKfycby2cJQpCNoeUpJSq8Mb_Hiwz2Yb3ak43wJiYGaqtAUvwYivkBqmaS1OvbvZgr5u0t4U/exec"; 

const tabTitles = { 
    dashboard: 'ภาพรวมระบบ', banner: 'จัดการแบนเนอร์', portfolio: 'จัดการผลงาน', work: 'จัดการด้านการปฏิบัติงาน', files: 'จัดการไฟล์', profile: 'จัดการข้อมูลโปรไฟล์',
    visit_dashboard: 'สถิติการเยี่ยมบ้าน', students: 'ข้อมูลนักเรียน', visit: 'บันทึกแบบเยี่ยมบ้าน', screening: 'คัดกรองความเสี่ยง', 
    map: 'แผนที่พิกัดบ้านนักเรียน', reports: 'รายงานผลการเยี่ยมบ้าน', visit_settings: 'ตั้งค่าระบบเยี่ยมบ้าน', studentForm: 'จัดการข้อมูลนักเรียน'
};

// ===================================================
// ส่วนที่ 2: ระบบจัดการแอดมิน (UI & Events)
// ===================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- ฟังก์ชัน Utility ---
    function showToast(msg, isError = false) {
        const toast = document.getElementById('toast') || document.getElementById('toastAdmin');
        if(!toast) return;
        const toastMsg = toast.querySelector('span') || document.getElementById('toastMsgAdmin');
        const icon = toast.querySelector('i');
        toastMsg.textContent = msg;
        toast.className = 'toast' + (isError ? ' error' : '');
        icon.className = isError ? 'fas fa-times-circle' : 'fas fa-check-circle';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    // --- ระบบ Toggle เมนูเยี่ยมบ้านนักเรียน ---
    const visitToggle = document.getElementById('homeVisitToggle');
    const visitSubMenu = document.getElementById('homeVisitSubMenu');
    const visitChevron = document.getElementById('visitChevron');

    if (visitToggle && visitSubMenu) {
        visitToggle.addEventListener('click', () => {
            const isCollapsed = visitSubMenu.classList.toggle('collapsed');
            
            // หมุนลูกศร
            if (isCollapsed) {
                visitChevron.classList.remove('rotate');
            } else {
                visitChevron.classList.add('rotate');
            }
        });
    }

    // แก้ไขฟังก์ชัน showPage เพิ่มเติม: ถ้ากดเมนูที่อยู่ในกลุ่มที่ยุบอยู่ ให้มันกางออกอัตโนมัติ
    const originalShowPage = window.showPage;
    window.showPage = function(id) {
        // เรียกฟังก์ชันเดิม
        originalShowPage(id);
        
        // ตรวจสอบว่าแท็บที่เลือก อยู่ในกลุ่มระบบเยี่ยมบ้านหรือไม่
        const targetNav = document.querySelector(`.sub-menu-container li[data-tab="${id}"]`);
        if (targetNav) {
            visitSubMenu.classList.remove('collapsed');
            visitChevron.classList.add('rotate');
        }
    };

    // ฟังก์ชัน เปิด-ปิด ส่วนหัวรายงานใน Modal
    window.toggleEvalHeader = function(forceClose = null) {
        const content = document.getElementById('evalHeaderContent');
        const chevron = document.getElementById('evalHeaderChevron');
        if (!content) return;

        const isHidden = forceClose !== null ? forceClose : !content.classList.contains('hidden');
        
        if (isHidden) {
            content.classList.add('hidden');
            chevron.style.transform = 'rotate(0deg)';
        } else {
            content.classList.remove('hidden');
            chevron.style.transform = 'rotate(180deg)';
        }
    };

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && overlay.id === 'modalConfirmDelete') overlay.classList.remove('open');
        });
    });

    const compressImage = (file, scale = 0.7) => new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image(); img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas'); canvas.width = img.width * scale; canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });

    async function uploadImageToDrive(file) {
        const compressed = await compressImage(file, 0.7);
        const res = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ base64: compressed, name: 'img_' + Date.now() + '.jpg', type: 'image/jpeg' })
        });
        const result = await res.json();
        if (result.status === 'success') return result.url;
        throw new Error(result.message || 'อัปโหลดล้มเหลว');
    }

    function previewFromUrl(url, boxId) {
        const box = document.getElementById(boxId); if (!box) return;
        if (url && url.trim()) box.innerHTML = `<img src="${url.trim()}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-broken-image placeholder-icon\\'></i>'">`;
        else box.innerHTML = `<i class="fas fa-image placeholder-icon"></i>`;
    }

    function setupUploadTabs(containerSelector) {
        document.querySelectorAll(containerSelector + ' [data-pane]').forEach(btn => {
            btn.addEventListener('click', () => {
                const parent = btn.closest('.input-group') || btn.closest('.modal-box') || document.querySelector('.form-card');
                parent.querySelectorAll('.upload-tab-btn').forEach(b => b.classList.remove('active'));
                parent.querySelectorAll('.upload-tab-pane').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const pane = document.getElementById(btn.dataset.pane);
                if (pane) pane.classList.add('active');
            });
        });
    }
    setupUploadTabs('#bannerForm');
    setupUploadTabs('#modalPortfolio');

    function loadDashboardStats() {
        db.collection('portfolio').onSnapshot(snap => { 
            if(document.getElementById('stat-portfolio')) document.getElementById('stat-portfolio').textContent = snap.size; 
        });
        
        // ✅ เปลี่ยนมาดึงข้อมูลจากคอลเลกชัน albums เพื่อคำนวณยอดไฟล์ภายในโฟลเดอร์ทั้งหมด
        db.collection('albums').onSnapshot(snap => {
            if(document.getElementById('stat-files')) document.getElementById('stat-files').textContent = snap.size;
            
            let totalPdfs = 0;
            let totalImages = 0;
            
            snap.forEach(doc => {
                const data = doc.data();
                const files = data.files || [];
                
                // วนลูปนับประเภทไฟล์ที่บันทึกอยู่ภายในโฟลเดอร์นั้นๆ
                files.forEach(f => {
                    if (f.type === 'pdf') {
                        totalPdfs++;
                    } else if (f.type === 'image') {
                        totalImages++;
                    }
                });
            });
            
            if(document.getElementById('stat-docs')) document.getElementById('stat-docs').textContent = totalPdfs;
            if(document.getElementById('stat-media')) document.getElementById('stat-media').textContent = totalImages;
        });
    }

    function loadBannerData() {
        db.collection('settings').doc('main_banner').get().then(doc => {
            if (doc.exists) {
                const d = doc.data();
                if (d.heading && document.getElementById('bannerHeading')) document.getElementById('bannerHeading').value = d.heading;
                if (d.subtext && document.getElementById('bannerSubtext')) document.getElementById('bannerSubtext').value = d.subtext;
                if (d.imageUrl && document.getElementById('bannerImageUrl')) { document.getElementById('bannerImageUrl').value = d.imageUrl; previewFromUrl(d.imageUrl, 'bannerPreviewBox'); }
                
                const info = document.getElementById('bannerCurrentInfo');
                const infoText = document.getElementById('bannerCurrentText');
                if(info && infoText) {
                    info.style.display = 'block';
                    infoText.textContent = `"${d.heading || '(ไม่มีหัวข้อ)'}" — อัปเดตล่าสุด: ${d.updatedAt?.toDate?.()?.toLocaleDateString('th-TH') || 'ไม่ทราบ'}`;
                }
            }
        });
    }

    function loadProfileData() {
        db.collection('settings').doc('profile').get().then(doc => {
            if (doc.exists) {
                const d = doc.data();
                if(document.getElementById('profInputName')) document.getElementById('profInputName').value = d.name || '';
                if(document.getElementById('profInputPosition')) document.getElementById('profInputPosition').value = d.position || '';
                if(document.getElementById('profInputBio')) document.getElementById('profInputBio').value = d.bio || '';
                if(document.getElementById('profInputJob')) document.getElementById('profInputJob').value = d.job || '';
                if(document.getElementById('profInputOthers')) document.getElementById('profInputOthers').value = d.others || '';
                if(document.getElementById('profInputImageUrl')) document.getElementById('profInputImageUrl').value = d.imageUrl || '';
            }
        });
    }

    let portSearchQuery = '';
    const colorMap = { c1: '#3dcbb1', c2: '#ae62e3', c3: '#ffb84d', c4: '#60b0ff', c5: '#8572ff', c6: '#ff8b60', c7: '#ff6e91', c8: '#c962ff', c9: '#3fd4e5', c10: '#3cd4a0' };
    
    function loadPortfolioList() {
        const list = document.getElementById('portList'); if(!list) return;
        list.innerHTML = '<div class="loading-row"><div class="spinner"></div> กำลังโหลดข้อมูล...</div>';
        db.collection('portfolio').orderBy('order', 'asc').get().then(snap => {
            if (snap.empty) { list.innerHTML = '<div class="empty-state"><i class="fas fa-palette"></i><p>ยังไม่มีผลงาน กด "+ เพิ่มผลงานใหม่" เพื่อเริ่มต้น</p></div>'; return; }
            const items = []; snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
            renderPortfolioList(items);
        });
    }
    
    function renderPortfolioList(items) {
        const list = document.getElementById('portList');
        const query = portSearchQuery.toLowerCase();
        const filtered = query ? items.filter(i => (i.title || '').toLowerCase().includes(query) || (i.desc || '').toLowerCase().includes(query)) : items;
        if (filtered.length === 0) { list.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>ไม่พบผลงานที่ค้นหา</p></div>'; return; }
        
        list.innerHTML = filtered.map(item => {
            const color = colorMap[item.color] || colorMap.c2;
            const thumbHtml = item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : `<span style="color:${color};font-size:1.5rem;"><i class="fas fa-palette"></i></span>`;
            return `
            <div class="portfolio-item-row" data-id="${item.id}">
                <div class="portfolio-thumb" style="border:2px solid ${color}20;">${thumbHtml}</div>
                <div class="portfolio-item-info"><h4 style="color:${color}">${item.title || '(ไม่มีชื่อ)'}</h4><p>${item.desc || '—'}</p></div>
                ${item.badge ? `<span class="badge badge-${item.color || 'c2'}">${item.badge}</span>` : ''}
                <span style="color:var(--text-muted);font-size:0.8rem;flex-shrink:0;">#${item.order || 99}</span>
                <button class="btn-icon btn-edit" onclick="editPortfolio('${item.id}')"><i class="fas fa-pen"></i></button>
                <button class="btn-icon btn-del" onclick="deleteItemAdmin('portfolio','${item.id}','${(item.title || '').replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
            </div>`;
        }).join('');
    }

   

    const fileIconMap = { pdf: { icon: 'fa-file-pdf', cls: 'icon-pdf' }, document: { icon: 'fa-file-word', cls: 'icon-doc' }, image: { icon: 'fa-file-image', cls: 'icon-img' }, video: { icon: 'fa-file-video', cls: 'icon-vid' }, zip: { icon: 'fa-file-archive', cls: 'icon-zip' }, other: { icon: 'fa-file', cls: 'icon-other' } };
    

    // --- สร้างฟังก์ชันโกลบอล (Global) เพื่อจัดการเมนู ---
    // โดยนำไปฝังไว้ในหน้าต่างเพื่อให้ฝั่ง HTML หาเจอ แต่ยังคงมองเห็นฟังก์ชันข้างบนได้
    window.showPage = function(id) {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const target = document.getElementById(id);
        if(target) target.classList.add('active');
        
        document.querySelectorAll('.nav-links li').forEach(n => n.classList.remove('active'));
        const navItem = document.querySelector(`.nav-links li[data-tab="${id}"]`);
        if(navItem) navItem.classList.add('active');
        
        const topbarTitle = document.getElementById('topbarTitle');
        if (topbarTitle && tabTitles[id]) topbarTitle.textContent = tabTitles[id];

        if (window.innerWidth <= 992) {
            const sidebar = document.getElementById('sidebar');
            if(sidebar) sidebar.classList.remove('show');
        }

        // โหลดข้อมูลตามหน้าแท็บที่กด
        if (id === 'portfolio') loadPortfolioList();
        if (id === 'files') { 
            loadAdminAlbumsList(); 
        }
        if (id === 'banner') loadBannerData();
        if (id === 'dashboard') loadDashboardStats();
        if (id === 'profile') loadProfileData();
        
        // จัดการแผนที่ในส่วนเยี่ยมบ้าน
        if (id === 'map') {
            setTimeout(() => { if(typeof leafletMap !== 'undefined' && leafletMap) leafletMap.invalidateSize(); updateMap(); }, 200);
        }
    };

    // --- การจัดการ Event เมนูด้านซ้ายและเมนูมือถือ ---
    document.querySelectorAll('.nav-links li').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            window.showPage(tab);
        });
    });

    const menuToggle = document.getElementById('menu-toggle');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) menuToggle.addEventListener('click', () => sidebar.classList.add('show'));
    if (closeSidebarBtn && sidebar) closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('show'));

    // --- กิจกรรมของแอดมินต่างๆ (Forms, Clicks, Deletes) ---
    
    // BANNER
    document.getElementById('bannerImageUrl')?.addEventListener('input', (e) => previewFromUrl(e.target.value, 'bannerPreviewBox'));
    document.getElementById('bannerFile')?.addEventListener('change', function () { if (this.files[0]) { document.getElementById('bannerFileName').textContent = this.files[0].name; previewFromUrl(URL.createObjectURL(this.files[0]), 'bannerPreviewBox'); } });
    document.getElementById('bannerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault(); const btn = document.getElementById('btnSaveBanner'); btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...'; btn.disabled = true;
        try {
            const activePane = e.target.querySelector('.upload-tab-pane.active');
            let finalImageUrl = null;
            if (activePane?.id === 'url-pane' && document.getElementById('bannerImageUrl').value.trim()) finalImageUrl = document.getElementById('bannerImageUrl').value.trim();
            else if (activePane?.id === 'file-pane' && document.getElementById('bannerFile')?.files[0]) finalImageUrl = await uploadImageToDrive(document.getElementById('bannerFile').files[0]);
            
            const data = { heading: document.getElementById('bannerHeading').value.trim(), subtext: document.getElementById('bannerSubtext').value.trim(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
            if (finalImageUrl !== null) data.imageUrl = finalImageUrl; else data.imageUrl = firebase.firestore.FieldValue.delete();
            await db.collection('settings').doc('main_banner').set(data, { merge: true });
            showToast('อัปเดตแบนเนอร์เรียบร้อยแล้ว!'); loadBannerData();
        } catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message, true); } finally { btn.innerHTML = '<i class="fas fa-save"></i> บันทึกแบนเนอร์'; btn.disabled = false; }
    });

    // PROFILE
    document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault(); const btn = e.target.querySelector('button'); const originalText = btn.innerHTML; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...'; btn.disabled = true;
        try {
            const data = { name: document.getElementById('profInputName').value.trim(), position: document.getElementById('profInputPosition').value.trim(), bio: document.getElementById('profInputBio').value.trim(), job: document.getElementById('profInputJob').value.trim(), others: document.getElementById('profInputOthers').value.trim(), imageUrl: document.getElementById('profInputImageUrl').value.trim(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
            await db.collection('settings').doc('profile').set(data, { merge: true }); showToast('บันทึกโปรไฟล์สำเร็จ!');
        } catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message, true); } finally { btn.innerHTML = originalText; btn.disabled = false; }
    });

    document.getElementById('btnProfUpload')?.addEventListener('click', () => document.getElementById('profUploadFile').click());
    document.getElementById('profUploadFile')?.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file || !file.type.startsWith('image/')) { showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น', true); return; }
        const status = document.getElementById('profUploadStatus'); const btn = document.getElementById('btnProfUpload');
        status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังอัปโหลด...'; btn.disabled = true; btn.style.opacity = '0.7';
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const response = await fetch(GAS_UPLOAD_URL, { method: 'POST', body: JSON.stringify({ filename: "profile_" + Date.now() + "_" + file.name, mimeType: file.type, base64: event.target.result.split(',')[1] }) });
                const result = await response.json();
                if (result.status === "success") { document.getElementById('profInputImageUrl').value = result.url; status.innerHTML = '<i class="fas fa-check-circle" style="color:var(--c10-green);"></i> อัปโหลดสำเร็จ!'; showToast('อัปโหลดรูปภาพสำเร็จ'); } 
                else throw new Error(result.message);
            } catch (err) { status.innerHTML = '<i class="fas fa-exclamation-circle" style="color:#ef4444;"></i> ผิดพลาด: ' + err.message; showToast('อัปโหลดไม่สำเร็จ', true); } 
            finally { btn.disabled = false; btn.style.opacity = '1'; document.getElementById('profUploadFile').value = ''; }
        };
        reader.readAsDataURL(file);
    });

    // PORTFOLIO
    document.getElementById('portSearch')?.addEventListener('input', (e) => { portSearchQuery = e.target.value; loadPortfolioList(); });
    document.querySelectorAll('.color-dot').forEach(dot => dot.addEventListener('click', () => { document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected')); dot.classList.add('selected'); document.getElementById('portColor').value = dot.dataset.color; }));
    document.getElementById('portImageUrl')?.addEventListener('input', (e) => previewFromUrl(e.target.value, 'portPreviewBox'));
    document.getElementById('portFile')?.addEventListener('change', function () { if (this.files[0]) { document.getElementById('portFileName').textContent = this.files[0].name; previewFromUrl(URL.createObjectURL(this.files[0]), 'portPreviewBox'); } });

    document.getElementById('btnAddPortfolio')?.addEventListener('click', () => {
        document.getElementById('modalPortTitle').innerHTML = '<i class="fas fa-palette c2-text"></i> เพิ่มผลงานใหม่'; document.getElementById('portfolioForm').reset();
        document.getElementById('portId').value = ''; document.getElementById('portPreviewBox').innerHTML = '<i class="fas fa-image placeholder-icon"></i>'; 
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected')); document.querySelector('.color-dot[data-color="c2"]').classList.add('selected'); document.getElementById('portColor').value = 'c2';
        openModal('modalPortfolio');
    });

    document.getElementById('portfolioForm')?.addEventListener('submit', async (e) => {
        e.preventDefault(); const btn = document.getElementById('btnSavePortfolio'); btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...'; btn.disabled = true;
        try {
            const portId = document.getElementById('portId').value; const file = document.getElementById('portFile')?.files[0]; const activePane = document.querySelector('#modalPortfolio .upload-tab-pane.active');
            let imageUrl = null;
            if (activePane?.id === 'port-url-pane') imageUrl = document.getElementById('portImageUrl').value.trim(); else if (activePane?.id === 'port-file-pane' && file) imageUrl = await uploadImageToDrive(file);
            const data = { title: document.getElementById('portTitle').value.trim(), desc: document.getElementById('portDesc').value.trim(), portLongDesc: document.getElementById('portLongDesc').value.trim(), color: document.getElementById('portColor').value, badge: document.getElementById('portBadge').value.trim(), btn1: document.getElementById('portBtn1').value.trim(), btn1Link: document.getElementById('portBtn1Link').value.trim() || '#', btn2: document.getElementById('portBtn2').value.trim(), btn2Link: document.getElementById('portBtn2Link').value.trim() || '#', order: parseInt(document.getElementById('portOrder').value) || 99, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
            if (imageUrl) data.imageUrl = imageUrl;
            if (portId) { await db.collection('portfolio').doc(portId).update(data); showToast('แก้ไขสำเร็จ!'); } else { data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('portfolio').add(data); showToast('เพิ่มสำเร็จ!'); }
            closeModal('modalPortfolio'); loadPortfolioList(); loadDashboardStats();
        } catch (err) { showToast('ผิดพลาด: ' + err.message, true); } finally { btn.innerHTML = '<i class="fas fa-save"></i> บันทึกผลงาน'; btn.disabled = false; }
    });

    window.editPortfolio = function (id) {
        db.collection('portfolio').doc(id).get().then(doc => {
            if (!doc.exists) return; const d = doc.data();
            document.getElementById('modalPortTitle').innerHTML = '<i class="fas fa-pen c4-text"></i> แก้ไขผลงาน'; document.getElementById('portId').value = id;
            ['Title', 'Desc', 'LongDesc', 'Badge', 'Btn1', 'Btn1Link', 'Btn2', 'Btn2Link', 'Order', 'ImageUrl'].forEach(f => { if(document.getElementById('port'+f)) document.getElementById('port'+f).value = d[f.charAt(0).toLowerCase() + f.slice(1)] || ''; });
            document.getElementById('portColor').value = d.color || 'c2'; previewFromUrl(d.imageUrl || '', 'portPreviewBox');
            document.querySelectorAll('.color-dot').forEach(dot => dot.classList.toggle('selected', dot.dataset.color === (d.color || 'c2')));
            document.querySelectorAll('#modalPortfolio .upload-tab-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('#modalPortfolio .upload-tab-pane').forEach(p => p.classList.remove('active')); document.querySelector('#modalPortfolio [data-pane="port-url-pane"]').classList.add('active'); document.getElementById('port-url-pane').classList.add('active');
            openModal('modalPortfolio');
        });
    };



   

    // DELETE (Admin System)
    let pendingDeleteAdmin = { collection: null, id: null };
    window.deleteItemAdmin = function (col, id, label) { pendingDeleteAdmin = { collection: col, id }; document.getElementById('confirmDeleteMsg').textContent = `ยืนยันลบ "${label}" ?`; openModal('modalConfirmDelete'); };
    document.getElementById('btnConfirmDelete')?.addEventListener('click', async () => {
    if (!pendingDeleteAdmin.collection) return;
    const btn = document.getElementById('btnConfirmDelete'); 
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 
    btn.disabled = true;
    try { 
        await db.collection(pendingDeleteAdmin.collection).doc(pendingDeleteAdmin.id).delete(); 
        showToast('ลบสำเร็จ'); 
        closeModal('modalConfirmDelete'); 
        
        // --- เพิ่มเงื่อนไขให้รีเฟรชระบบประเมินครูผู้ช่วย ---
        if (pendingDeleteAdmin.collection === 'portfolio') {
            loadPortfolioList(); 
        } else if (pendingDeleteAdmin.collection === 'evaluations') {
            if (typeof loadEvalBlocks === 'function') loadEvalBlocks(); // รีเฟรชตารางประเมินทันที
        } else {
            loadFileList(); 
        }
        
        loadDashboardStats(); 
    } 
    catch (err) { showToast('ลบล้มเหลว', true); } 
    finally { 
        btn.innerHTML = '<i class="fas fa-trash"></i> ลบเลย'; 
        btn.disabled = false; 
        pendingDeleteAdmin = { collection: null, id: null }; 
    }
});

    // เริ่มต้นระบบ (หน้าแรกของแอดมิน)
    loadDashboardStats();

    // --- Album import handlers (จาก UI ที่แทรกในหน้า files) ---
    function extractDriveIdFromUrl(url){ const m = url.match(/\/d\/([\w-]{25,})/) || url.match(/id=([\w-]{25,})/) || url.match(/([\w-]{25,})/); return m? (m[1]||m[2]||m[0]) : null; }
    function detectTypeFromUrl(url){ const u = url.split('?')[0].split('#')[0]; if(/\.(jpe?g|png|gif)$/i.test(u)) return 'image'; if(/\.pdf$/i.test(u)) return 'pdf'; return 'other'; }

   
}); // สิ้นสุดบล็อกของแอดมิน


// ===================================================
// ส่วนที่ 3: ระบบเยี่ยมบ้านนักเรียน (Home Visit Logic)
// ===================================================
let appSettings = JSON.parse(localStorage.getItem('appSettings')) || { schoolName: 'โรงเรียนตัวอย่างวิทยา', teacherName: '', apiURL: '', schoolGPS: '13.736717, 100.523186' };

function applySettings() {
    if(document.getElementById('set_school')) document.getElementById('set_school').value = appSettings.schoolName;
    if(document.getElementById('set_teacher')) document.getElementById('set_teacher').value = appSettings.teacherName;
    if(document.getElementById('set_api')) document.getElementById('set_api').value = appSettings.apiURL;
    if(document.getElementById('set_school_gps')) document.getElementById('set_school_gps').value = appSettings.schoolGPS;
    if(document.getElementById('vf_visitor')) document.getElementById('vf_visitor').value = appSettings.teacherName;
}

async function loadEvalVisibilitySetting() {
    const toggle = document.getElementById('evalSectionToggle');
    if (!toggle) return;
    try {
        const doc = await db.collection('settings').doc('eval_visibility').get();
        const enabled = doc.exists ? (doc.data().enabled !== false) : true;
        toggle.checked = enabled;
    } catch (err) {
        console.warn('ไม่สามารถโหลดสถานะการแสดงผลประเมินครูผู้ช่วยได้', err);
        toggle.checked = true;
    }
}

async function saveSettings() {
    appSettings.schoolName = document.getElementById('set_school').value.trim();
    appSettings.teacherName = document.getElementById('set_teacher').value.trim();
    appSettings.apiURL = document.getElementById('set_api').value.trim();
    appSettings.schoolGPS = document.getElementById('set_school_gps').value.trim();
    localStorage.setItem('appSettings', JSON.stringify(appSettings));

    const evalEnabled = document.getElementById('evalSectionToggle')?.checked ?? true;
    try {
        await db.collection('settings').doc('eval_visibility').set({ enabled: evalEnabled }, { merge: true });
    } catch (err) {
        console.warn('ไม่สามารถบันทึกสถานะการแสดงผลประเมินครูผู้ช่วยได้', err);
    }

    applySettings();
    toast('✅ บันทึกตั้งค่าระบบเยี่ยมบ้านแล้ว');
}

function getDriveThumbnail(url) { if (!url) return ''; const match = url.match(/id=([a-zA-Z0-9_-]+)/); return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800` : url; }

let allData = [];

// เปลี่ยนระบบดาต้าเบสเป็น Firebase Firestore (Realtime)
window.dataSdk = {
    init: async (handler) => { 
        window._dbHandler = handler; 
        // ดึงข้อมูลแบบ Realtime ทันทีที่มีการเปลี่ยนแปลง
        db.collection('home_visit_data').onSnapshot(snap => {
            allData = [];
            snap.forEach(doc => {
                allData.push({ ...doc.data(), __backendId: doc.id });
            });
            window._dbHandler.onDataChanged(allData);
        }, err => {
            console.error("Firebase Home Visit Error:", err);
        });
        return { isOk: true }; 
    },
    create: async (data) => { 
        const submitData = { ...data };
        delete submitData.__backendId; 
        await db.collection('home_visit_data').add(submitData);
        return { isOk: true }; 
    },
    update: async (data) => { 
        const id = data.__backendId;
        const submitData = { ...data };
        delete submitData.__backendId;
        await db.collection('home_visit_data').doc(id).update(submitData);
        return { isOk: true }; 
    },
    delete: async (data) => { 
        await db.collection('home_visit_data').doc(data.__backendId).delete();
        return { isOk: true }; 
    }
};

const dataHandler = { onDataChanged() { updateDashboard(); updateStudentList(); updateVisitStudentDropdown(); updateScreening(); updateReports(); renderMapCheckboxes(); updateMap(); } };

document.addEventListener('DOMContentLoaded', async () => { 
   await loadEvalVisibilitySetting();
   // เริ่มต้นระบบ TinyMCE สำหรับช่องประเมิน (ฉบับแสดงแถบเหมือน Word + แก้ช่องว่าง Enter)
tinymce.init({
    selector: '#evalContent',
    height: 600,
    
    // เปิดแถบเมนูด้านบน (File, Edit, Format ฯลฯ)
    menubar: 'file edit view insert format tools table help',
    
    plugins: 'advlist autolink lists link image charmap preview searchreplace visualblocks code fullscreen insertdatetime table wordcount',
    
    // เพิ่มปุ่มในแถบเครื่องมือให้ครบเหมือน Word
    toolbar: 'undo redo | styles | fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | lineheight | table charmap | removeformat fullscreen',
    
    font_family_formats: 'Sarabun=Sarabun,sans-serif; Prompt=Prompt,sans-serif; Kanit=Kanit,sans-serif;',
    
    // คงเมนู Dropdown สำหรับปรับช่องไฟและระยะบรรทัดของคุณครูไว้
    style_formats: [
        {
            title: 'ระยะช่องไฟ (Letter Spacing)',
            items: [
                { title: 'ปกติ (Default)', inline: 'span', styles: { 'letter-spacing': 'normal' } },
                { title: 'บีบให้ชิดขึ้น (-0.5pt)', inline: 'span', styles: { 'letter-spacing': '-0.5pt' } },
                { title: 'บีบมาก (-1pt)', inline: 'span', styles: { 'letter-spacing': '-1pt' } },
                { title: 'ขยายให้ห่าง (0.5pt)', inline: 'span', styles: { 'letter-spacing': '0.5pt' } },
                { title: 'ขยายมาก (1pt)', inline: 'span', styles: { 'letter-spacing': '1pt' } }
            ]
        },
        {
            title: 'ระยะห่างบรรทัด (Line Spacing)',
            items: [
                { title: 'แคบ (1.2)', block: 'p', styles: { 'line-height': '1.2' } },
                { title: 'ปกติ (1.5)', block: 'p', styles: { 'line-height': '1.5' } },
                { title: 'กว้าง (1.8)', block: 'p', styles: { 'line-height': '1.8' } }
            ]
        }
    ],
    
    // เพิ่ม p { margin: 0; padding: 0; } ต่อท้ายเพื่อแก้ปัญหาช่องว่างห่างเวลากด Enter
    content_style: "@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap'); body { font-family: 'Sarabun', sans-serif; font-size: 14pt; line-height: 1.5; text-align: left; } p { margin: 0; padding: 0; }"
});

    // โค้ดส่วนระบบเยี่ยมบ้านของคุณครู (ไม่ต้องลบออก)
    applySettings(); if(typeof lucide !== 'undefined') lucide.createIcons(); buildRiskToggles(); initSignature(); initMap(); await window.dataSdk.init(dataHandler); 
});

function toast(msg, color = '#0f766e') { const t = document.createElement('div'); t.className = 'toast-msg'; t.style.background = color; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }
function riskBadge(lvl) { const m = {'ปกติ':['🟢 ปกติ','bg-emerald-100 text-emerald-700'],'เฝ้าระวัง':['🟡 เฝ้าระวัง','bg-amber-100 text-amber-700'],'เร่งด่วน':['🔴 เร่งด่วน','bg-rose-100 text-rose-700']}; return `<span class="risk-badge ${m[lvl]?m[lvl][1]:'bg-slate-100'}">${m[lvl]?m[lvl][0]:'ไม่ระบุ'}</span>`; }

function updateDashboard() {
    const stds = allData.filter(d=>d.type==='student'), visits = allData.filter(d=>d.type==='visit');
    if(document.getElementById('statTotal')) document.getElementById('statTotal').textContent = stds.length; 
    if(document.getElementById('statVisited')) document.getElementById('statVisited').textContent = visits.length;
    if(document.getElementById('statWarning')) document.getElementById('statWarning').textContent = visits.filter(v=>v.risk_level==='เฝ้าระวัง').length; 
    if(document.getElementById('statUrgent')) document.getElementById('statUrgent').textContent = visits.filter(v=>v.risk_level==='เร่งด่วน').length;
    if(document.getElementById('visitRate')) document.getElementById('visitRate').textContent = stds.length ? Math.round((visits.length/stds.length)*100)+'%' : '0%';
    if(document.getElementById('avgRisk')) document.getElementById('avgRisk').textContent = visits.length ? (visits.reduce((s,v)=>s+(Number(v.risk_score)||0),0)/visits.length).toFixed(1) : '0';
    
    let needsHelpCount = 0; visits.forEach(v => { if(v.needs_scholarship || v.needs_lunch || (v.needs_other && v.needs_other.trim()!=='')) needsHelpCount++; });
    if(document.getElementById('needsHelp')) document.getElementById('needsHelp').textContent = needsHelpCount + ' คน';

    if(document.getElementById('recentVisits')) {
        document.getElementById('recentVisits').innerHTML = visits.sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0, 5).map(v=>`
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div><p class="font-medium text-sm text-slate-800">${v.student_name}</p><p class="text-xs text-slate-400">${(v.visit_date||'').split('T')[0]}</p></div>${riskBadge(v.risk_level)}
        </div>`).join('') || '<p class="text-sm text-slate-400 text-center py-4">ยังไม่มีประวัติเยี่ยมบ้าน</p>';
    }
}

const riskItems = [ {id: 'r_health', label: 'ร่างกายไม่แข็งแรง/มีโรคประจำตัว'}, {id: 'r_safe1', label: 'พ่อแม่แยกทาง/ไม่มีผู้ดูแล'}, {id: 'r_safe2', label: 'ความรุนแรงในครอบครัว/ทารุณกรรม'}, {id: 'r_drug', label: 'ข้องเกี่ยวกับยาเสพติด/การพนัน'}, {id: 'r_behav', label: 'ก้าวร้าว/ทะเลาะวิวาท'}, {id: 'r_sex', label: 'พฤติกรรมเสี่ยงทางเพศ/ตั้งครรภ์'}, {id: 'r_game', label: 'ติดเกมเกิน 2 ชม./วัน/เก็บตัว'} ];
function buildRiskToggles() {
    const c = document.getElementById('riskTogglesContainer'); if(!c) return;
    c.innerHTML = riskItems.map(r => `
        <label class="relative flex justify-between items-center cursor-pointer p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition">
            <span class="text-sm font-medium text-slate-700 pr-2">${r.label}</span><input type="checkbox" id="${r.id}" class="sr-only peer risk-checkbox">
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[14px] after:right-[26px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
        </label>`).join('');
}

let editingStudentId = null, currentProfileUrl = '';
window.openStudentForm = function(bid = null) {
    editingStudentId = bid; document.getElementById('studentDataForm').reset(); document.getElementById('photoPreviewContainer').classList.add('hidden'); currentProfileUrl = '';
    if(bid) {
        const s = allData.find(d => d.__backendId === bid); document.getElementById('sf_title').textContent = 'แก้ไขข้อมูลนักเรียน'; document.getElementById('saveStudentBtn').textContent = 'อัปเดตข้อมูลนักเรียน';
        ['name', 'nickname', 'class', 'number', 'id', 'phone', 'line', 'facebook'].forEach(f => { if(document.getElementById('sf_'+f)) document.getElementById('sf_'+f).value = s[f==='name'?'student_name':f==='class'?'class_level':f==='number'?'student_no':f==='id'?'student_id':f==='line'?'line_id':f] || ''; });
        if(s.student_photo) { currentProfileUrl = s.student_photo; document.getElementById('photo_preview').src = getDriveThumbnail(s.student_photo); document.getElementById('photoPreviewContainer').classList.remove('hidden'); }
    } else { document.getElementById('sf_title').textContent = 'เพิ่มนักเรียนใหม่'; document.getElementById('saveStudentBtn').textContent = 'บันทึกข้อมูล'; }
    window.showPage('studentForm');
};

window.saveStudent = async function() {
    const p = { type: 'student', student_name: document.getElementById('sf_name').value, nickname: document.getElementById('sf_nickname').value, class_level: document.getElementById('sf_class').value, student_no: document.getElementById('sf_number').value, student_id: document.getElementById('sf_id').value, phone: document.getElementById('sf_phone').value, line_id: document.getElementById('sf_line').value, facebook: document.getElementById('sf_facebook').value, student_photo: currentProfileUrl, updated_at: new Date().toISOString() };
    if(!p.student_name || !p.student_id || !p.class_level) return toast('กรุณากรอกฟิลด์ที่มี *', '#ef4444');
    document.getElementById('saveStudentBtn').disabled = true;
    if(editingStudentId) { p.__backendId = editingStudentId; await window.dataSdk.update(p); toast('✅ อัปเดตข้อมูลแล้ว'); } else { p.created_at = p.updated_at; await window.dataSdk.create(p); toast('✅ บันทึกนักเรียนแล้ว'); }
    document.getElementById('saveStudentBtn').disabled = false; window.showPage('students');
};

function updateStudentList() {
    if(!document.getElementById('studentList')) return;
    document.getElementById('studentList').innerHTML = allData.filter(d=>d.type==='student').map(s => `
        <div class="flex flex-col p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition">
            <div class="flex gap-4 items-center mb-4"><img src="${s.student_photo ? getDriveThumbnail(s.student_photo) : 'https://ui-avatars.com/api/?name='+s.student_name+'&background=0D8B9&color=fff'}" class="w-14 h-14 rounded-full object-cover shadow-sm"><div><h4 class="font-semibold text-slate-800 leading-tight" style="font-family:'Kanit';">${s.student_name}</h4><p class="text-xs text-slate-500 mt-1">ชั้น ${s.class_level} | เลขที่ ${s.student_no||'-'} | รหัส ${s.student_id}</p></div></div>
            <div class="grid grid-cols-2 gap-2 mt-auto"><button onclick="openStudentForm('${s.__backendId}')" class="px-3 py-2 bg-sky-50 text-sky-700 border-none cursor-pointer hover:bg-sky-100 rounded-xl text-sm font-medium transition flex justify-center items-center gap-1"><i data-lucide="pencil" class="w-4 h-4"></i> แก้ไข</button><button onclick="askDeleteVisit('${s.__backendId}', 'ลบข้อมูลนักเรียน: ${s.student_name}')" class="px-3 py-2 bg-rose-50 text-rose-600 border-none cursor-pointer hover:bg-rose-100 rounded-xl text-sm font-medium transition flex justify-center items-center gap-1"><i data-lucide="trash" class="w-4 h-4"></i> ลบ</button></div>
        </div>`).join('') || '<div class="col-span-full text-center py-8 text-slate-400">ยังไม่มีข้อมูลนักเรียน</div>';
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

window.filterStudents = function() {
    const q = document.getElementById('studentSearch').value.toLowerCase();
    document.getElementById('studentList').innerHTML = allData.filter(d=>d.type==='student').filter(s => (s.student_name||'').toLowerCase().includes(q) || (s.student_id||'').toLowerCase().includes(q) || (s.class_level||'').toLowerCase().includes(q)).map(s => `
        <div class="flex flex-col p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition">
            <div class="flex gap-4 items-center mb-4"><img src="${s.student_photo ? getDriveThumbnail(s.student_photo) : 'https://ui-avatars.com/api/?name='+s.student_name+'&background=0D8B9&color=fff'}" class="w-14 h-14 rounded-full object-cover shadow-sm"><div><h4 class="font-semibold text-slate-800 leading-tight" style="font-family:'Kanit';">${s.student_name}</h4><p class="text-xs text-slate-500 mt-1">ชั้น ${s.class_level} | เลขที่ ${s.student_no||'-'} | รหัส ${s.student_id}</p></div></div>
            <div class="grid grid-cols-2 gap-2 mt-auto"><button onclick="openStudentForm('${s.__backendId}')" class="px-3 py-2 bg-sky-50 text-sky-700 border-none cursor-pointer hover:bg-sky-100 rounded-xl text-sm font-medium transition flex justify-center items-center gap-1"><i data-lucide="pencil" class="w-4 h-4"></i> แก้ไข</button><button onclick="askDeleteVisit('${s.__backendId}', 'ลบข้อมูลนักเรียน: ${s.student_name}')" class="px-3 py-2 bg-rose-50 text-rose-600 border-none cursor-pointer hover:bg-rose-100 rounded-xl text-sm font-medium transition flex justify-center items-center gap-1"><i data-lucide="trash" class="w-4 h-4"></i> ลบ</button></div>
        </div>`).join('') || '<div class="col-span-full text-center py-8 text-slate-400">ไม่พบนักเรียนที่ค้นหา</div>';
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

function updateVisitStudentDropdown() { if(document.getElementById('vf_student')) document.getElementById('vf_student').innerHTML = '<option value="">-- เลือกนักเรียน --</option>' + allData.filter(d=>d.type==='student').map(s=>`<option value="${s.__backendId}">${s.student_name} (${s.class_level})</option>`).join(''); }

let currentGPS = { lat: '', lng: '' }; let extPhotoUrl = '', intPhotoUrl = '';
function calculateDistance(lat1, lon1, lat2, lon2) { const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180; const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2); return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); }
async function getRouteOSRM(lat1, lon1, lat2, lon2) { try { const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`); const data = await res.json(); if(data.code === 'Ok' && data.routes.length > 0) return { distanceKm: (data.routes[0].distance / 1000).toFixed(2), durationMin: Math.round(data.routes[0].duration / 60), coordinates: data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]) }; } catch(e) {} return null; }

window.getGPS = async function() {
    navigator.geolocation.getCurrentPosition(async p => { 
        currentGPS = {lat: p.coords.latitude, lng: p.coords.longitude}; document.getElementById('gpsInfo').textContent = `${currentGPS.lat.toFixed(6)}, ${currentGPS.lng.toFixed(6)}`; 
        if(appSettings.schoolGPS) {
            const [sLat, sLng] = appSettings.schoolGPS.split(',').map(Number);
            if(sLat && sLng) {
                toast('📍 กำลังคำนวณเส้นทางจริง...', '#0ea5e9'); const route = await getRouteOSRM(sLat, sLng, currentGPS.lat, currentGPS.lng);
                if(route) { document.getElementById('vf_distance').value = route.distanceKm; document.getElementById('vf_travel_time').value = route.durationMin; toast('📍 ดึงพิกัดและคำนวณระยะทางสำเร็จ'); } 
                else { const dist = calculateDistance(sLat, sLng, currentGPS.lat, currentGPS.lng); document.getElementById('vf_distance').value = dist.toFixed(2); document.getElementById('vf_travel_time').value = Math.round((dist / 40) * 60); toast('📍 ดึงพิกัดสำเร็จ (เส้นตรง)'); }
            }
        } else { toast('📍 ดึงพิกัดสำเร็จ (ใส่พิกัดโรงเรียนเพื่อคำนวณระยะทาง)'); }
    }, () => toast('❌ ไม่สามารถดึงพิกัดได้','#ef4444')); 
};

function resetVisitForm() {
    document.getElementById('visitForm').reset(); document.getElementById('vf_visitor').value = appSettings.teacherName; document.getElementById('saveVisitBtnText').textContent = 'บันทึกข้อมูลเยี่ยมบ้าน';
    document.getElementById('preview_ext').classList.add('hidden'); document.getElementById('preview_int').classList.add('hidden'); document.getElementById('gpsInfo').textContent = 'ยังไม่มีข้อมูลพิกัด'; clearSignature();
    extPhotoUrl = ''; intPhotoUrl = ''; currentGPS = {lat:'', lng:''};
}

window.checkExistingVisit = function(studentBid) {
    if(!studentBid) { resetVisitForm(); return; }
    const st = allData.find(d => d.__backendId === studentBid); const existing = allData.find(d => d.type === 'visit' && (d.student_backend_id === studentBid || d.student_id === st.student_id));
    if(existing) {
        toast('📝 พบข้อมูลเดิม ระบบอยู่ในโหมดอัปเดตข้อมูล', '#0ea5e9'); document.getElementById('saveVisitBtnText').textContent = 'อัปเดตข้อมูลเยี่ยมบ้าน (ทับของเดิม)';
        let vDate = existing.visit_date || ''; if (vDate && vDate.includes('T')) vDate = vDate.split('T')[0]; document.getElementById('vf_date').value = vDate;
        ['term', 'visit_status', 'house_type', 'distance', 'travel_time', 'commute', 'house_cond', 'house_order'].forEach(f => { if(document.getElementById('vf_'+f)) document.getElementById('vf_'+f).value = existing[f] || existing[f.replace('term','visit_term')] || ''; });
        document.getElementById('vf_util_elec').checked = existing.util_elec !== false; document.getElementById('vf_util_water').checked = existing.util_water !== false; document.getElementById('vf_util_toilet').checked = existing.util_toilet !== false;
        ['fam_members', 'fam_relation', 'fam_income', 'job', 'job_income'].forEach(f => { if(document.getElementById('vf_'+f)) document.getElementById('vf_'+f).value = existing[f] || existing[f.replace('fam_members','family_members').replace('fam_income','income')] || ''; });
        if(existing.risk_states) { try { const rs = JSON.parse(existing.risk_states); Object.keys(rs).forEach(id => { const cb = document.getElementById(id); if(cb) cb.checked = rs[id]; }); } catch(e) {} } else { document.querySelectorAll('.risk-checkbox').forEach(cb => cb.checked = false); }
        document.getElementById('vf_help_edu').checked = !!existing.needs_scholarship; document.getElementById('vf_help_econ').checked = !!existing.needs_lunch; document.getElementById('vf_help_behav').checked = !!existing.needs_behav;
        if(document.getElementById('vf_otherHelp')) document.getElementById('vf_otherHelp').value = existing.needs_other || ''; document.getElementById('vf_concern').value = existing.concern || '';
        extPhotoUrl = existing.photo_ext || ''; intPhotoUrl = existing.photo_int || '';
        if(extPhotoUrl) { document.getElementById('preview_ext').src = getDriveThumbnail(extPhotoUrl); document.getElementById('preview_ext').classList.remove('hidden'); }
        if(intPhotoUrl) { document.getElementById('preview_int').src = getDriveThumbnail(intPhotoUrl); document.getElementById('preview_int').classList.remove('hidden'); }
        if(existing.gps_lat && existing.gps_lng) { currentGPS = {lat: existing.gps_lat, lng: existing.gps_lng}; document.getElementById('gpsInfo').textContent = `${currentGPS.lat}, ${currentGPS.lng}`; } else { document.getElementById('gpsInfo').textContent = 'ยังไม่มีข้อมูลพิกัด'; }
    } else { const sid = document.getElementById('vf_student').value; resetVisitForm(); document.getElementById('vf_student').value = sid; toast('✨ เริ่มบันทึกข้อมูลใหม่', '#10b981'); }
};

let sigDrawing = false, sigCtx = null;
function initSignature() { const c=document.getElementById('sigCanvas'); if(!c)return; sigCtx=c.getContext('2d'); sigCtx.lineWidth=2; const draw=e=>{if(!sigDrawing)return; e.preventDefault(); const r=c.getBoundingClientRect(), t=e.touches?e.touches[0]:e; sigCtx.lineTo(t.clientX-r.left, t.clientY-r.top); sigCtx.stroke();}; c.addEventListener('mousedown',e=>{sigDrawing=true;sigCtx.beginPath();draw(e);}); c.addEventListener('mousemove',draw); c.addEventListener('mouseup',()=>sigDrawing=false); c.addEventListener('touchstart',e=>{sigDrawing=true;sigCtx.beginPath();draw(e);},{passive:false}); c.addEventListener('touchmove',draw,{passive:false}); c.addEventListener('touchend',()=>sigDrawing=false); }
window.clearSignature = function() { if(sigCtx) sigCtx.clearRect(0,0,1000,300); };

window.saveVisit = async function() {
    const sid = document.getElementById('vf_student').value; if(!sid) return toast('กรุณาเลือกนักเรียน', '#ef4444'); const st = allData.find(d=>d.__backendId===sid);
    let score = 0; const riskStates = {}; document.querySelectorAll('.risk-checkbox').forEach(cb => { riskStates[cb.id] = cb.checked; if(cb.checked) score += 2; });
    const inc = Number(document.getElementById('vf_fam_income').value); if(inc < 5000 && inc > 0) score += 2; const lvl = score >= 6 ? 'เร่งด่วน' : score >= 2 ? 'เฝ้าระวัง' : 'ปกติ';

    const payload = {
        type: 'visit', student_backend_id: st.__backendId, student_id: st.student_id, student_name: st.student_name, class_level: st.class_level,
        visit_date: document.getElementById('vf_date').value, visit_term: document.getElementById('vf_term').value, visitor_name: appSettings.teacherName, visit_status: document.getElementById('vf_visit_status').value, house_type: document.getElementById('vf_house_type').value, distance: document.getElementById('vf_distance').value, travel_time: document.getElementById('vf_travel_time').value, commute: document.getElementById('vf_commute').value, house_cond: document.getElementById('vf_house_cond').value, house_order: document.getElementById('vf_house_order').value, util_elec: document.getElementById('vf_util_elec').checked, util_water: document.getElementById('vf_util_water').checked, util_toilet: document.getElementById('vf_util_toilet').checked, family_members: document.getElementById('vf_fam_members').value, fam_relation: document.getElementById('vf_fam_relation').value, income: inc, job: document.getElementById('vf_job').value, job_income: document.getElementById('vf_job_income').value,
        needs_scholarship: document.getElementById('vf_help_edu').checked, needs_lunch: document.getElementById('vf_help_econ').checked, needs_behav: document.getElementById('vf_help_behav').checked, needs_other: document.getElementById('vf_otherHelp')?.value || '', concern: document.getElementById('vf_concern').value, risk_score: score, risk_level: lvl, risk_states: JSON.stringify(riskStates), gps_lat: currentGPS.lat, gps_lng: currentGPS.lng, signature: document.getElementById('sigCanvas').toDataURL(), updated_at: new Date().toISOString()
    };
    
    document.getElementById('saveVisitBtn').disabled = true;
    const existingVisit = allData.find(d => d.type === 'visit' && (d.student_backend_id === st.__backendId || d.student_id === st.student_id));
    if(existingVisit) { payload.__backendId = existingVisit.__backendId; payload.created_at = existingVisit.created_at; payload.photo_ext = extPhotoUrl || existingVisit.photo_ext; payload.photo_int = intPhotoUrl || existingVisit.photo_int; await window.dataSdk.update(payload); toast('✅ อัปเดตข้อมูลเยี่ยมบ้านทับของเดิมสำเร็จ', '#10b981'); } 
    else { payload.created_at = payload.updated_at; payload.photo_ext = extPhotoUrl; payload.photo_int = intPhotoUrl; await window.dataSdk.create(payload); toast('✅ บันทึกข้อมูลเยี่ยมบ้านใหม่สำเร็จ', '#10b981'); }
    resetVisitForm(); document.getElementById('saveVisitBtn').disabled = false; window.showPage('visit_dashboard');
};

async function uploadVisitImageToDrive(file, statusId, previewId) {
    return new Promise((resolve) => {
        document.getElementById(statusId).textContent = "กำลังอัปโหลด..."; 
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const base64Data = e.target.result.split(',')[1]; 
                // ดึง API ของแอดมินมาใช้แทน (ไม่ต้องตั้งค่า API ใหม่ในระบบเยี่ยมบ้าน)
                const res = await fetch(GAS_UPLOAD_URL, { 
                    method: 'POST', 
                    body: JSON.stringify({ 
                        filename: "visit_" + Date.now() + "_" + file.name, 
                        mimeType: file.type, 
                        base64: base64Data 
                    }) 
                });
                const json = await res.json();
                if (json.status === 'success') { 
                    document.getElementById(statusId).textContent = "✅ สำเร็จ"; 
                    document.getElementById(previewId).src = e.target.result; 
                    document.getElementById(previewId).classList.remove('hidden'); 
                    resolve(json.url); 
                } else throw new Error();
            } catch(err) { 
                document.getElementById(statusId).textContent = "❌ ล้มเหลว"; 
                resolve(null); 
            }
        }; 
        reader.readAsDataURL(file);
    });
}

document.getElementById('sf_photo')?.addEventListener('change', async e => { if(e.target.files[0]) { document.getElementById('photoPreviewContainer').classList.remove('hidden'); currentProfileUrl = await uploadVisitImageToDrive(e.target.files[0], 'photo_status', 'photo_preview'); } });
document.getElementById('vf_photo_ext')?.addEventListener('change', async e => { if(e.target.files[0]) extPhotoUrl = await uploadVisitImageToDrive(e.target.files[0], 'status_ext', 'preview_ext'); });
document.getElementById('vf_photo_int')?.addEventListener('change', async e => { if(e.target.files[0]) intPhotoUrl = await uploadVisitImageToDrive(e.target.files[0], 'status_int', 'preview_int'); });

function updateScreening() { if(document.getElementById('screeningList')) document.getElementById('screeningList').innerHTML = allData.filter(d=>d.type==='visit').sort((a,b)=>b.risk_score-a.risk_score).map(v=>`<div class="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl" style="box-shadow: 0 4px 15px rgba(0,0,0,0.03);"><div><b class="text-slate-800" style="font-family:'Kanit';">${v.student_name}</b> <span class="text-sm text-slate-500 ml-2">ชั้น ${v.class_level}</span><p class="text-xs text-slate-400 mt-1">คะแนนความเสี่ยง: ${v.risk_score}</p></div>${riskBadge(v.risk_level)}</div>`).join(''); }

let leafletMap, mapMarkers;
function initMap() {
    if(document.getElementById('mapCanvas') && typeof L !== 'undefined') {
        let startLat = 13.736717, startLng = 100.523186; if(appSettings.schoolGPS) { const parts = appSettings.schoolGPS.split(','); if(parts.length === 2) { startLat = Number(parts[0]); startLng = Number(parts[1]); } }
        leafletMap = L.map('mapCanvas').setView([startLat, startLng], 12); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap); mapMarkers = L.layerGroup().addTo(leafletMap);
    }
}

function renderMapCheckboxes() {
    const container = document.getElementById('mapStudentCheckboxes'); if(!container) return;
    const visits = allData.filter(d => d.type === 'visit' && d.gps_lat); if(document.getElementById('mapStudentTotal')) document.getElementById('mapStudentTotal').textContent = visits.length;
    const currentSelected = Array.from(document.querySelectorAll('.map-filter-cb:checked')).map(cb => cb.value); const isFirstLoad = document.querySelectorAll('.map-filter-cb').length === 0;
    container.innerHTML = visits.map(v => {
        const isChecked = isFirstLoad ? 'checked' : (currentSelected.includes(v.__backendId) ? 'checked' : '');
        return `<label class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition"><input type="checkbox" value="${v.__backendId}" class="map-filter-cb w-4 h-4 text-teal-600 rounded" ${isChecked} onchange="updateMap()"><div class="flex-1"><div class="text-sm font-medium text-slate-800" style="font-family:'Kanit';">${v.student_name}</div><div class="text-xs text-slate-500">ชั้น ${v.class_level || '-'}</div></div>${riskBadge(v.risk_level)}</label>`;
    }).join('') || '<div class="text-center text-sm text-slate-400 py-4">ไม่มีข้อมูลพิกัด GPS</div>';
}
window.mapSelectAll = function(isSelect) { document.querySelectorAll('.map-filter-cb').forEach(cb => cb.checked = isSelect); updateMap(); };

async function updateMap() {
    if(!leafletMap || !mapMarkers) return; 
    const selectedIds = Array.from(document.querySelectorAll('.map-filter-cb:checked')).map(cb => cb.value); 
    const visits = allData.filter(d => d.type === 'visit' && d.gps_lat && selectedIds.includes(d.__backendId));
    
    if(document.getElementById('mapGpsCount')) document.getElementById('mapGpsCount').textContent = visits.length; 
    if(document.getElementById('mapWarningCount')) document.getElementById('mapWarningCount').textContent = visits.filter(v => v.risk_level === 'เฝ้าระวัง').length; 
    if(document.getElementById('mapUrgentCount')) document.getElementById('mapUrgentCount').textContent = visits.filter(v => v.risk_level === 'เร่งด่วน').length;
    
    mapMarkers.clearLayers(); 
    const bounds = []; 
    let sLat = null, sLng = null; 
    
    // ดึงพิกัดโรงเรียน
    if(appSettings.schoolGPS) { 
        const parts = appSettings.schoolGPS.split(','); 
        if(parts.length === 2) { 
            sLat = parseFloat(parts[0].trim()); 
            sLng = parseFloat(parts[1].trim()); 
        } 
    }
    
    // ปักหมุดโรงเรียน
    if(sLat && sLng) { 
        const schoolIcon = L.divIcon({ className: 'custom-school-icon', html: `<div style="background-color:#4f46e5; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 0 8px rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center;"><span style="font-size:10px;">🏫</span></div>`, iconSize: [20, 20], iconAnchor: [10, 10] }); 
        mapMarkers.addLayer(L.marker([sLat, sLng], {icon: schoolIcon}).bindPopup(`<b style="font-family:'Kanit'; color:#4f46e5; font-size:14px;">🏫 โรงเรียน${appSettings.schoolName}</b>`)); 
        bounds.push([sLat, sLng]); 
    }

    // หากมีการเลือกนักเรียนมากกว่า 0 ให้แสดงแจ้งเตือนว่ากำลังโหลดเส้นทาง
    if (visits.length > 0 && visits.length <= 20) {
        toast('กำลังประมวลผลเส้นทางจริงบนแผนที่...', '#0ea5e9');
    }

    // วนลูปวาดหมุดและเส้นทางของนักเรียนแต่ละคน
    for(const v of visits) { 
        // กำหนดสีตามความเสี่ยง
        const color = v.risk_level === 'เร่งด่วน' ? '#e11d48' : v.risk_level === 'เฝ้าระวัง' ? '#f59e0b' : '#10b981'; 
        let popupContent = `<b style="font-family:'Kanit'">${v.student_name}</b><br><span style="font-family:'Kanit'">สถานะ: ${v.risk_level}</span>`; 
        if(v.distance) popupContent += `<br><span style="font-family:'Kanit'; font-size:12px; color:#666;">ระยะทาง: ${v.distance} กม.</span>`; 
        
        // ปักหมุดบ้านนักเรียน
        mapMarkers.addLayer(L.circleMarker([v.gps_lat, v.gps_lng], {color: color, fillColor: color, fillOpacity: 0.8, radius: 8}).bindPopup(popupContent)); 
        bounds.push([v.gps_lat, v.gps_lng]); 
        
        // วาดเส้นทางจากโรงเรียนไปบ้าน
        if(sLat && sLng) {
            try {
                // เรียก API นำทางเพื่อหาเส้นทางตามถนนจริง
                const route = await getRouteOSRM(sLat, sLng, v.gps_lat, v.gps_lng);
                
                if(route && route.coordinates) {
                    // วาดเส้นทางตามแนวถนน (เส้นทึบ)
                    mapMarkers.addLayer(L.polyline(route.coordinates, { color: color, weight: 4, opacity: 0.7 })); 
                } else {
                    // ถ้าพื้นที่นั้น Google/OSRM ไม่มีข้อมูลถนน ให้ตีเป็นเส้นประตรงๆ แทน
                    mapMarkers.addLayer(L.polyline([[sLat, sLng], [v.gps_lat, v.gps_lng]], { color: color, weight: 2, opacity: 0.5, dashArray: '5, 5' }));
                }
            } catch (e) {
                // กรณีเน็ตหลุดหรือ API มีปัญหา ให้กลับไปใช้เส้นประ
                mapMarkers.addLayer(L.polyline([[sLat, sLng], [v.gps_lat, v.gps_lng]], { color: color, weight: 2, opacity: 0.5, dashArray: '5, 5' }));
            }
        } 
    }
    
    // ปรับมุมกล้องให้เห็นครอบคลุมทุกหมุด
    if(bounds.length > 0) leafletMap.fitBounds(bounds, {padding: [50, 50]}); 
}

function updateReports() {
    const v = allData.filter(d=>d.type==='visit'); if(document.getElementById('individualReports')) document.getElementById('individualReports').innerHTML = v.map(d=>`<div class="flex justify-between border-b border-slate-100 py-3"><span class="text-sm font-medium" style="font-family:'Kanit';">${d.student_name}</span>${riskBadge(d.risk_level)}</div>`).join('');
    const classMap = {}; v.forEach(visit => { const cls = visit.class_level || 'ไม่ระบุ'; if (!classMap[cls]) classMap[cls] = { total: 0, urgent: 0, warn: 0 }; classMap[cls].total++; if (visit.risk_level === 'เร่งด่วน') classMap[cls].urgent++; if (visit.risk_level === 'เฝ้าระวัง') classMap[cls].warn++; });
    if(document.getElementById('classSummary')) document.getElementById('classSummary').innerHTML = Object.keys(classMap).length ? Object.keys(classMap).map(k => `<div class="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200"><span class="font-medium text-sm text-slate-900">${k}</span><span class="text-xs text-slate-500">เยี่ยม ${classMap[k].total} • 🟡${classMap[k].warn} • 🔴${classMap[k].urgent}</span></div>`).join('') : '<p class="text-slate-400 italic">ยังไม่มีข้อมูล</p>';
}

let customPdfCoverBase64 = null;
document.getElementById('pdfCoverUpload')?.addEventListener('change', function(e) { if(!e.target.files[0]) return; const reader = new FileReader(); reader.onload = (ev) => { customPdfCoverBase64 = ev.target.result; toast('เตรียมหน้าปกพร้อมใช้งานแล้ว', '#10b981'); }; reader.readAsDataURL(e.target.files[0]); });
function createAvatarBase64(name) { const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="#f1f5f9"/><text x="50" y="50" font-family="sans-serif" font-size="40" font-weight="bold" fill="#475569" text-anchor="middle" dominant-baseline="central">${name?name.charAt(0):'?'}</text></svg>`; return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))); }
async function urlToBase64(url) { if (!url) return null; let targetUrl = url; if(url.includes('drive.google.com/thumbnail')) { const match = url.match(/id=([a-zA-Z0-9_-]+)/); if(match) targetUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`; } try { const res = await fetch('https://images.weserv.nl/?url=' + encodeURIComponent(targetUrl)); if (!res.ok) throw new Error(); const blob = await res.blob(); return await new Promise((resolve) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.readAsDataURL(blob); }); } catch (e) { return null; } }

window.exportOfficialPDF = async function() {
    const visits = allData.filter(d=>d.type==='visit'); if(!visits.length) return toast('ไม่มีข้อมูลเยี่ยมบ้าน', '#ef4444'); toast('⏳ กำลังโหลดรูปภาพและสร้าง PDF...', '#0ea5e9');
    const div = document.createElement('div'); div.style.fontFamily = "'Sarabun', sans-serif"; div.style.fontSize = '8pt'; div.style.color = '#334155'; div.style.lineHeight = '1.4';
    let html = '';
    
    if(customPdfCoverBase64) html += `<div style="page-break-after: always; margin: 0; padding: 0; width: 210mm; height: 297mm; overflow:hidden;"><img src="${customPdfCoverBase64}" style="width: 100%; height: 100%; object-fit: cover; margin: 0; padding: 0; display: block;"></div>`;
    else html += `<div style="padding: 40px; text-align: center; height: 297mm; page-break-after: always; display:flex; flex-direction:column; justify-content:center;"><h1 style="font-size: 16pt; font-weight: bold; margin-bottom: 20px; color: #0f766e;">รายงานผลการเยี่ยมบ้านนักเรียน</h1><h2 style="font-size: 12pt; margin-bottom: 50px;">ปีการศึกษา .....................</h2><div style="margin: 50px 0;"><p style="font-size: 10pt;">จัดทำโดย</p><p style="font-size: 12pt; font-weight: bold; margin-top:10px;">${appSettings.teacherName}</p><p style="font-size: 10pt;">ตำแหน่ง ครูประจำชั้น</p></div><div style="margin-top: 50px;"><p style="font-size: 12pt; font-weight:bold;">โรงเรียน${appSettings.schoolName}</p></div></div>`;

    const urgent = visits.filter(v=>v.risk_level==='เร่งด่วน').length, warn = visits.filter(v=>v.risk_level==='เฝ้าระวัง').length, normal = visits.filter(v=>v.risk_level==='ปกติ').length;
    html += `<div style="padding: 1.5cm 2cm; page-break-after: always; text-align:left; color: black;"><h1 style="font-size: 12pt; font-weight: bold; text-align: center; margin-bottom: 15px;">บันทึกข้อความ</h1><div style="display:flex; justify-content:space-between; margin-bottom: 10px; font-size:8pt;"><div><b>ส่วนราชการ</b> โรงเรียน${appSettings.schoolName}</div></div><div style="display:flex; justify-content:space-between; margin-bottom: 10px; font-size:8pt;"><div style="width: 50%;"><b>ที่</b> .....................................................</div><div style="width: 50%;"><b>วันที่</b> ${new Date().toLocaleDateString('th-TH')}</div></div><div style="margin-bottom: 10px; font-size:8pt;"><b>เรื่อง</b> รายงานผลการเยี่ยมบ้านนักเรียน</div><hr style="border: 1px solid black; margin-bottom: 15px;"><div style="margin-bottom: 15px; font-size:8pt;"><b>เรียน</b> ผู้อำนวยการโรงเรียน${appSettings.schoolName}</div><p style="text-indent: 1.5cm; margin-bottom: 10px; font-size:8pt; text-align:justify;">ด้วยข้าพเจ้า ${appSettings.teacherName} ตำแหน่ง ครูประจำชั้น ได้ดำเนินการออกเยี่ยมบ้านนักเรียนในความดูแล เพื่อรับทราบข้อมูลพื้นฐาน สภาพครอบครัว และคัดกรองนักเรียน บัดนี้การปฏิบัติงานได้เสร็จสิ้นแล้ว จึงขอรายงานผล ดังนี้</p><p style="margin-bottom: 5px; font-size:8pt;">สรุปผลการเยี่ยมบ้าน จำนวนนักเรียนทั้งหมด <b>${visits.length}</b> คน จำแนกเป็น:</p><ul style="margin-left: 1.5cm; margin-bottom: 15px; font-size:8pt;"><li>กลุ่มปกติ จำนวน ${normal} คน</li><li>กลุ่มเฝ้าระวัง จำนวน ${warn} คน</li><li>กลุ่มเร่งด่วน จำนวน ${urgent} คน</li></ul><p style="text-indent: 1.5cm; font-size:8pt;">จึงเรียนมาเพื่อโปรดทราบ</p><div style="margin-top: 2cm; text-align: center; margin-left: 50%; font-size:8pt;"><p>(ลงชื่อ) .......................................................</p><p>(${appSettings.teacherName})</p><p>ตำแหน่ง ครูประจำชั้น</p></div></div>`;

    for (let i = 0; i < visits.length; i++) {
        const v = visits[i]; toast(`⏳ กำลังเตรียมหน้าของ ${v.student_name} (${i+1}/${visits.length})...`, '#0ea5e9');
        const studentObj = allData.find(s => s.type === 'student' && (s.__backendId === v.student_backend_id || s.student_id === v.student_id));
        let profilePic = createAvatarBase64(v.student_name); if (studentObj && studentObj.student_photo) { const b64 = await urlToBase64(getDriveThumbnail(studentObj.student_photo)); if(b64) profilePic = b64; }
        const extPic = v.photo_ext ? await urlToBase64(getDriveThumbnail(v.photo_ext)) : null; const intPic = v.photo_int ? await urlToBase64(getDriveThumbnail(v.photo_int)) : null;
        const riskColor = v.risk_level === 'เร่งด่วน' ? '#e11d48' : v.risk_level === 'เฝ้าระวัง' ? '#d97706' : '#059669'; const riskBg = v.risk_level === 'เร่งด่วน' ? '#ffe4e6' : v.risk_level === 'เฝ้าระวัง' ? '#fef3c7' : '#d1fae5'; const riskBorder = v.risk_level === 'เร่งด่วน' ? '#fda4af' : v.risk_level === 'เฝ้าระวัง' ? '#fcd34d' : '#6ee7b7';
        let utilArray = []; if(v.util_elec) utilArray.push('ไฟฟ้า'); if(v.util_water) utilArray.push('น้ำประปา'); if(v.util_toilet) utilArray.push('สุขา');
        let needsArray = []; if(v.needs_scholarship) needsArray.push('การศึกษา'); if(v.needs_behav) needsArray.push('พฤติกรรม'); if(v.needs_lunch) needsArray.push('อาหาร');
        
        html += `<div style="padding: 1.5cm; page-break-after: always; font-size: 8pt; box-sizing: border-box;">
            <div style="border-bottom: 2px solid #0f766e; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div><h2 style="font-size: 11pt; font-weight: bold; color: #0f766e; margin: 0;">แบบบันทึกการเยี่ยมบ้านนักเรียน</h2><p style="margin: 4px 0 0 0; color: #64748b; font-size: 8pt;">โรงเรียน${appSettings.schoolName} | วันที่เยี่ยม: ${v.visit_date}</p></div>
                <div style="text-align: right;"><span style="background-color: ${riskBg}; color: ${riskColor}; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 8pt; border: 1px solid ${riskBorder};">กลุ่ม${v.risk_level} (คะแนน: ${v.risk_score||0})</span></div>
            </div>
            <div style="display: flex; gap: 15px; margin-bottom: 12px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; align-items: center;"><img src="${profilePic}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;"><div style="flex: 1;"><h3 style="font-size: 9pt; font-weight: bold; margin: 0 0 6px 0; color: #1e293b;">${v.student_name}</h3><div style="display: flex; gap: 15px; font-size: 8pt;"><div style="flex: 1;"><b style="color:#64748b;">รหัสประจำตัว:</b> ${v.student_id||'-'}</div><div style="flex: 1;"><b style="color:#64748b;">ระดับชั้น:</b> ${v.class_level||'-'}</div><div style="flex: 1;"><b style="color:#64748b;">สถานะเยี่ยม:</b> <span style="color:#0f766e; font-weight:bold;">${v.visit_status||'-'}</span></div></div></div></div>
            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;"><h4 style="font-size: 8pt; font-weight: bold; color: #0f766e; margin: 0 0 6px 0; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">สภาพที่อยู่อาศัยและการเดินทาง</h4><table style="width: 100%; font-size: 8pt; border-collapse: collapse;"><tr><td style="padding: 2px 0; color:#64748b; width: 45%;">ลักษณะบ้าน:</td><td style="padding: 2px 0; font-weight: 500; color:#1e293b;">${v.house_type||'-'}</td></tr><tr><td style="padding: 2px 0; color:#64748b;">สภาพตัวบ้าน:</td><td style="padding: 2px 0; font-weight: 500; color:#1e293b;">${v.house_cond||'-'}</td></tr><tr><td style="padding: 2px 0; color:#64748b;">ความเป็นระเบียบ:</td><td style="padding: 2px 0; font-weight: 500; color:#1e293b;">${v.house_order||'-'}</td></tr><tr><td style="padding: 2px 0; color:#64748b;">การเดินทาง:</td><td style="padding: 2px 0; font-weight: 500; color:#1e293b;">${v.commute||'-'}</td></tr><tr><td style="padding: 2px 0; color:#64748b;">ระยะทาง / เวลา:</td><td style="padding: 2px 0; font-weight: 500; color:#1e293b;">${v.distance||'-'} กม. / ${v.travel_time||'-'} นาที</td></tr></table></div>
                <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;"><h4 style="font-size: 8pt; font-weight: bold; color: #0f766e; margin: 0 0 6px 0; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">ข้อมูลครอบครัวและรายได้</h4><table style="width: 100%; font-size: 8pt; border-collapse: collapse;"><tr><td style="padding: 2px 0; color:#64748b; width: 45%;">จำนวนสมาชิก:</td><td style="padding: 2px 0; font-weight: 500; color:#1e293b;">${v.family_members||'-'} คน</td></tr><tr><td style="padding: 2px 0; color:#64748b;">ความสัมพันธ์:</td><td style="padding: 2px 0; font-weight: 500; color:#1e293b;">${v.fam_relation||'-'}</td></tr><tr><td style="padding: 2px 0; color:#64748b;">รายได้ครอบครัว:</td><td style="padding: 2px 0; font-weight: 500; color:#1e293b;">${v.income||'-'} บ./ด.</td></tr><tr><td style="padding: 2px 0; color:#64748b;">นร.หารายได้:</td><td style="padding: 2px 0; font-weight: 500; color:#1e293b;">${v.job ? v.job+' ('+(v.job_income||'-')+')' : '-'}</td></tr><tr><td style="padding: 2px 0; color:#64748b;">สาธารณูปโภค:</td><td style="padding: 2px 0; font-weight: 500; color:#1e293b;">${utilArray.length ? utilArray.join(', ') : '-'}</td></tr></table></div>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 15px; background: #fff;"><h4 style="font-size: 8pt; font-weight: bold; color: #0f766e; margin: 0 0 6px 0; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">ข้อห่วงใยและการขอรับความช่วยเหลือ</h4><div style="display: flex; gap: 15px;"><div style="flex: 1;"><div style="color:#64748b; margin-bottom: 2px;">ข้อห่วงใยจากผู้ปกครอง:</div><div style="font-weight: 500; color:#1e293b;">${v.concern || '-'}</div></div><div style="flex: 1;"><div style="color:#64748b; margin-bottom: 2px;">ด้านที่ต้องการให้โรงเรียนช่วยเหลือ:</div><div style="font-weight: 500; color:#1e293b;">${needsArray.length ? needsArray.join(', ') : '-'} ${v.needs_other ? '('+v.needs_other+')' : ''}</div></div></div></div>
            <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom: 20px;">
                <div style="flex:1;"><p style="margin: 0 0 4px 0; font-size:8pt; color:#64748b; font-weight:bold; text-align:center;">ภาพภายนอกบ้าน</p><div style="width:100%; height:160px; border:1px solid #e2e8f0; border-radius: 8px; display:flex; align-items:center; justify-content:center; overflow: hidden; background: #f8fafc;">${extPic ? `<img src="${extPic}" style="width:100%; height:100%; object-fit:contain;">` : '<span style="color:#cbd5e1;">ไม่มีภาพ</span>'}</div></div>
                <div style="flex:1;"><p style="margin: 0 0 4px 0; font-size:8pt; color:#64748b; font-weight:bold; text-align:center;">ภาพภายใน/ครอบครัว</p><div style="width:100%; height:160px; border:1px solid #e2e8f0; border-radius: 8px; display:flex; align-items:center; justify-content:center; overflow: hidden; background: #f8fafc;">${intPic ? `<img src="${intPic}" style="width:100%; height:100%; object-fit:contain;">` : '<span style="color:#cbd5e1;">ไม่มีภาพ</span>'}</div></div>
            </div>
            <div style="display: flex; justify-content: space-around; margin-top: auto; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
                <div><div style="height:35px; margin-bottom: 5px;">${v.signature ? `<img src="${v.signature}" style="height:100%; display:block; margin:auto;">` : ''}</div><p style="margin:0;">(ลงชื่อ) .......................................................</p><p style="margin:2px 0 0 0; color:#64748b;">ผู้ปกครองนักเรียน</p></div>
                <div><div style="height:35px; margin-bottom: 5px;"></div><p style="margin:0;">(ลงชื่อ) .......................................................</p><p style="margin:2px 0 0 0; color:#64748b;">(${v.visitor_name})</p><p style="margin:2px 0 0 0; color:#64748b;">ครูประจำชั้น / ผู้เยี่ยมบ้าน</p></div>
            </div>
        </div>`;
    }

    div.innerHTML = html; toast('✅ โหลดภาพเสร็จสิ้น กำลังประกอบไฟล์ PDF...', '#10b981');
    html2pdf().set({ margin: 0, filename: `รายงานเยี่ยมบ้าน_${appSettings.schoolName}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(div).save().then(() => toast('✅ ดาวน์โหลด PDF สำเร็จแล้ว!', '#10b981'));
};

let pendingDeleteVisitRecord = null;
window.askDeleteVisit = function(bid, msg) { pendingDeleteVisitRecord = allData.find(d=>d.__backendId===bid); document.getElementById('deleteMsg').textContent=msg; document.getElementById('deleteOverlay').classList.remove('hidden'); };
window.cancelDelete = function() { pendingDeleteVisitRecord = null; document.getElementById('deleteOverlay').classList.add('hidden'); };
window.confirmDelete = async function() { await window.dataSdk.delete(pendingDeleteVisitRecord); window.cancelDelete(); toast('✅ ลบข้อมูลแล้ว'); };

let pickerMap = null, pickerMarker = null, tempGPS = { lat: 13.736717, lng: 100.523186 };
window.openMapPicker = function() {
    document.getElementById('mapPickerModal').classList.remove('hidden');
    let centerLat = currentGPS.lat || (appSettings.schoolGPS ? Number(appSettings.schoolGPS.split(',')[0]) : 13.736717); let centerLng = currentGPS.lng || (appSettings.schoolGPS ? Number(appSettings.schoolGPS.split(',')[1]) : 100.523186);
    tempGPS = { lat: centerLat, lng: centerLng }; document.getElementById('pickerCoords').textContent = `พิกัด: ${tempGPS.lat.toFixed(6)}, ${tempGPS.lng.toFixed(6)}`;
    if (!pickerMap) {
        setTimeout(() => { pickerMap = L.map('pickerMapCanvas').setView([centerLat, centerLng], 15); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pickerMap); pickerMarker = L.marker([centerLat, centerLng], { draggable: true }).addTo(pickerMap); pickerMarker.on('dragend', function() { const pos = pickerMarker.getLatLng(); tempGPS = { lat: pos.lat, lng: pos.lng }; document.getElementById('pickerCoords').textContent = `พิกัด: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`; }); pickerMap.on('click', function(e) { pickerMarker.setLatLng(e.latlng); tempGPS = { lat: e.latlng.lat, lng: e.latlng.lng }; document.getElementById('pickerCoords').textContent = `พิกัด: ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`; }); }, 100);
    } else { setTimeout(() => { pickerMap.invalidateSize(); pickerMap.setView([centerLat, centerLng], 15); pickerMarker.setLatLng([centerLat, centerLng]); }, 100); }
};
window.closeMapPicker = function() { document.getElementById('mapPickerModal').classList.add('hidden'); };
window.confirmMapPicker = async function() {
    currentGPS = { lat: tempGPS.lat, lng: tempGPS.lng }; document.getElementById('gpsInfo').textContent = `${currentGPS.lat.toFixed(6)}, ${currentGPS.lng.toFixed(6)}`;
    if(appSettings.schoolGPS) {
        const [sLat, sLng] = appSettings.schoolGPS.split(',').map(Number);
        if(sLat && sLng) { toast('📍 กำลังคำนวณเส้นทางจริง...', '#0ea5e9'); const route = await getRouteOSRM(sLat, sLng, currentGPS.lat, currentGPS.lng); if(route) { document.getElementById('vf_distance').value = route.distanceKm; document.getElementById('vf_travel_time').value = route.durationMin; } else { const dist = calculateDistance(sLat, sLng, currentGPS.lat, currentGPS.lng); document.getElementById('vf_distance').value = dist.toFixed(2); document.getElementById('vf_travel_time').value = Math.round((dist / 40) * 60); } }
    } window.closeMapPicker(); toast('📍 ปักหมุดและคำนวณระยะทางสำเร็จ', '#4f46e5');
};


// ===================================================
// ส่วนต่อขยาย: ระบบประเมินครูผู้ช่วย (Assistant Teacher Evaluation)
// ===================================================
let currentEvalRound = 1;
let evalDataList = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. จัดการเมนู Dropdown แถบประเมินครูผู้ช่วย
    const evalToggle = document.getElementById('evalToggle');
    const evalSubMenu = document.getElementById('evalSubMenu');
    const evalChevron = document.getElementById('evalChevron');

    if (evalToggle && evalSubMenu) {
        evalToggle.addEventListener('click', () => {
            const isCollapsed = evalSubMenu.classList.toggle('collapsed');
            if (isCollapsed) evalChevron.classList.remove('rotate');
            else evalChevron.classList.add('rotate');
        });
    }

    // 2. ดักการเปลี่ยนหน้าต่าง (Override window.showPage แบบแนบเนียน)
    const originalShowPageFunc = window.showPage;
    window.showPage = function(id) {
        
        // --- จุดนี้คือตัวแก้ Error: ถ้าคลิกแล้วไม่มี ID ส่งมา (เช่นคลิกหัวข้อเมนู) ให้หยุดทำงานทันที ---
        if (!id || typeof id !== 'string') return; 

        let targetId = id;
        
        // ถ้าเป็นการกดเมนูประเมินครูผู้ช่วย (eval_1 ถึง eval_4)
        if (id.startsWith('eval_')) {
            currentEvalRound = parseInt(id.split('_')[1]);
            document.getElementById('evalMainTitle').textContent = `ประเมินครูผู้ช่วย ครั้งที่ ${currentEvalRound}`;
            targetId = 'eval_main';
            if (typeof loadEvalBlocks === 'function') loadEvalBlocks();
            
            // กางเมนูย่อยให้ค้างไว้
            const evalSubMenu = document.getElementById('evalSubMenu');
            const evalChevron = document.getElementById('evalChevron');
            if(evalSubMenu) {
                evalSubMenu.classList.remove('collapsed');
                if(evalChevron) evalChevron.classList.add('rotate');
            }
        }

        // เรียกฟังก์ชันเปลี่ยนหน้าหลัก
        originalShowPageFunc(targetId);
        
        // ตรวจสอบและ Highlight เมนูให้ถูกต้อง
        document.querySelectorAll('.nav-links li').forEach(n => n.classList.remove('active'));
        const navItem = document.querySelector(`.nav-links li[data-tab="${id}"]`);
        if(navItem) navItem.classList.add('active');
    };
    
    // 3. ระบบอัปโหลดรูปภาพเฉพาะบล็อคประเมิน
    document.getElementById('evalImageUpload')?.addEventListener('change', async (e) => {
        if(e.target.files[0]) {
            const file = e.target.files[0];
            const status = document.getElementById('evalImageStatus');
            const previewContainer = document.getElementById('evalImagePreviewContainer');
            const previewImg = document.getElementById('evalImagePreview');
            const urlInput = document.getElementById('evalImageUrl');
            
            status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังอัปโหลดรูปภาพ...';
            document.getElementById('btnSaveEvalBlock').disabled = true;
            
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const base64Data = ev.target.result.split(',')[1]; 
                    const res = await fetch(GAS_UPLOAD_URL, { 
                        method: 'POST', body: JSON.stringify({ filename: "eval_" + Date.now() + ".jpg", mimeType: file.type, base64: base64Data }) 
                    });
                    const json = await res.json();
                    if (json.status === 'success') { 
                        status.innerHTML = '<i class="fas fa-check-circle text-teal-600"></i> อัปโหลดสำเร็จ'; 
                        urlInput.value = json.url;
                        previewImg.src = json.url; // ใน GAS อาจจะดึงภาพมาแสดงไม่ได้ทันที ให้ใช้ Base64 ของตัวเครื่องแสดงแทน
                        previewImg.src = ev.target.result;
                        previewContainer.classList.remove('hidden');
                    } else throw new Error();
                } catch(err) { 
                    status.innerHTML = '<i class="fas fa-times-circle text-rose-600"></i> ล้มเหลว'; 
                } finally {
                    document.getElementById('btnSaveEvalBlock').disabled = false;
                }
            }; 
            reader.readAsDataURL(file);
        }
    });

    // 4. บันทึกข้อมูลแบบฟอร์มบล็อค
    document.getElementById('evalBlockForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSaveEvalBlock');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
        btn.disabled = true;

        try {
            const blockId = document.getElementById('evalBlockId').value;
            const data = {
                round: currentEvalRound,
                title: document.getElementById('evalTitle').value.trim(),
                content: tinymce.get('evalContent') ? tinymce.get('evalContent').getContent() : document.getElementById('evalContent').value.trim(),
                startDate: document.getElementById('evalStartDate').value.trim(), // เพิ่ม
                endDate: document.getElementById('evalEndDate').value.trim(),     // เพิ่ม
                schoolName: document.getElementById('evalSchoolName').value.trim(), // เพิ่ม
                imageUrl: document.getElementById('evalImageUrl').value,
                order: parseInt(document.getElementById('evalOrder').value) || 1,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (blockId) {
                await db.collection('evaluations').doc(blockId).update(data);
                toast('✅ อัปเดตบล็อคข้อมูลสำเร็จ', '#10b981');
            } else {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('evaluations').add(data);
                toast('✅ เพิ่มบล็อคข้อมูลใหม่สำเร็จ', '#10b981');
            }
            
            document.getElementById('modalEvalBlock').classList.remove('open');
            loadEvalBlocks();
        } catch (err) {
            toast('❌ ผิดพลาด: ' + err.message, '#ef4444');
        } finally {
            btn.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูลบล็อคนี้';
            btn.disabled = false;
        }
    });

});

// ฟังก์ชันดึงและแสดงข้อมูล (ฉบับแก้ไขหลีกเลี่ยง Index Error)
function loadEvalBlocks() {
    const container = document.getElementById('evalBlocksContainer');
    if(!container) return;
    
    container.innerHTML = '<div class="text-center p-8 text-slate-400"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br>กำลังโหลดข้อมูล...</div>';
    
    // เอา .orderBy() ออก เพื่อไม่ให้ติด Error จาก Firebase
    db.collection('evaluations').where('round', '==', currentEvalRound).get().then(snap => {
        evalDataList = [];
        if (snap.empty) {
            container.innerHTML = '<div class="bg-white rounded-2xl p-8 text-center border border-slate-200"><i class="fas fa-box-open text-4xl text-slate-300 mb-3"></i><p class="text-slate-500">ยังไม่มีบล็อคข้อมูลในครั้งนี้ กด "เพิ่มบล็อคข้อมูล" เพื่อเริ่มต้น</p></div>';
            return;
        }
        
        snap.forEach(doc => {
            const d = doc.data();
            evalDataList.push({id: doc.id, ...d});
        });

        // ใช้ JavaScript เรียงลำดับจากน้อยไปมากแทน
        evalDataList.sort((a, b) => (a.order || 99) - (b.order || 99));

        let html = '';
        evalDataList.forEach(d => {
            html += `
            <div class="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row gap-6 relative" style="box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                <div class="absolute top-4 right-4 flex gap-2">
                    <button onclick="editEvalBlock('${d.id}')" class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white flex items-center justify-center transition border-none cursor-pointer"><i class="fas fa-pen text-xs"></i></button>
                    <button onclick="deleteItemAdmin('evaluations','${d.id}','${d.title}')" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white flex items-center justify-center transition border-none cursor-pointer"><i class="fas fa-trash text-xs"></i></button>
                </div>
                ${d.imageUrl ? `<div class="w-full md:w-1/4 flex-shrink-0"><img src="${getDriveThumbnail(d.imageUrl)}" class="w-full h-auto rounded-xl border border-slate-100 object-cover"></div>` : ''}
                <div class="flex-1">
                    <div class="text-xs font-bold text-indigo-500 mb-1 tracking-wider">ลำดับที่ ${d.order || '-'}</div>
                    <h3 class="text-lg font-bold text-slate-800 mb-2" style="font-family:'Kanit'">${d.title}</h3>
                    <div class="text-slate-600 text-sm leading-relaxed" style="font-family:'Sarabun', sans-serif;">${d.content}</div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }).catch(err => {
        console.error("Eval Load Error:", err);
        container.innerHTML = '<div class="text-center p-8 text-rose-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>';
    });
}

window.openEvalModal = function() {
    if(tinymce.get('evalContent')) tinymce.get('evalContent').setContent('');
    document.getElementById('evalBlockForm').reset();
    document.getElementById('evalBlockId').value = '';
    document.getElementById('evalImageUrl').value = '';
    document.getElementById('evalImagePreviewContainer').classList.add('hidden');
    document.getElementById('evalImageStatus').textContent = '';
    
    // --- New Logic: ดึงข้อมูลหัวกระดาษจากบล็อคที่มีอยู่แล้วในรอบนี้ ---
    const existingHeader = evalDataList.find(d => d.startDate || d.schoolName);
    
    if (existingHeader) {
        document.getElementById('evalStartDate').value = existingHeader.startDate || '';
        document.getElementById('evalEndDate').value = existingHeader.endDate || '';
        document.getElementById('evalSchoolName').value = existingHeader.schoolName || '';
        // ถ้ามีข้อมูลอยู่แล้ว ให้ "ย่อเก็บ" ทันที จะได้ไม่รกสายตา
        toggleEvalHeader(true); 
    } else {
        // ถ้าเป็นบล็อคแรกของรอบ ให้ "กางออก" เพื่อให้กรอกข้อมูล
        toggleEvalHeader(false);
    }
    
    document.getElementById('modalEvalTitle').innerHTML = `<i class="fas fa-plus-circle c1-text"></i> เพิ่มบล็อคข้อมูล (ครั้งที่ ${currentEvalRound})`;
    const nextOrder = evalDataList.length > 0 ? Math.max(...evalDataList.map(o => o.order || 0)) + 1 : 1;
    document.getElementById('evalOrder').value = nextOrder;
    
    document.getElementById('modalEvalBlock').classList.add('open');
};

// ดึงข้อมูลมาแก้ไข
window.editEvalBlock = function(id) {
    const item = evalDataList.find(d => d.id === id);
    if(!item) return;
    
    document.getElementById('evalBlockId').value = item.id;
    document.getElementById('evalTitle').value = item.title || '';
    if(tinymce.get('evalContent')) tinymce.get('evalContent').setContent(item.content || '');
    else document.getElementById('evalContent').value = item.content || '';
    document.getElementById('evalOrder').value = item.order || 1;
    document.getElementById('evalImageUrl').value = item.imageUrl || '';
    document.getElementById('evalImageStatus').textContent = '';
    document.getElementById('evalStartDate').value = item.startDate || ''; 
    document.getElementById('evalEndDate').value = item.endDate || '';     
    document.getElementById('evalSchoolName').value = item.schoolName || '';
    // ถ้าบล็อคนี้มีข้อมูลวันที่/โรงเรียน ให้กางออกเพื่อให้เห็นและแก้ไขได้
    if (item.startDate || item.schoolName) toggleEvalHeader(false);
    else toggleEvalHeader(true); // ถ้าไม่มีก็ย่อไว้เหมือนเดิม

    if(item.imageUrl) {
        document.getElementById('evalImagePreview').src = getDriveThumbnail(item.imageUrl);
        document.getElementById('evalImagePreviewContainer').classList.remove('hidden');
    } else {
        document.getElementById('evalImagePreviewContainer').classList.add('hidden');
    }
    
    document.getElementById('modalEvalTitle').innerHTML = '<i class="fas fa-pen c4-text"></i> แก้ไขบล็อคข้อมูล';
    document.getElementById('modalEvalBlock').classList.add('open');
};


// ส่งออก PDF รูปแบบราชการไทย (ใช้วิธี Native Print เพื่อแก้ปัญหาสระลอยและตัดหน้า)
window.exportEvalPDF = function() {
    if(evalDataList.length === 0) return toast('ไม่มีข้อมูลสำหรับพิมพ์', '#ef4444');
    
    // ดึงข้อมูลหัวกระดาษ
    const headerInfo = evalDataList.find(d => d.startDate || d.schoolName) || {};
    let rawSchool = headerInfo.schoolName || appSettings.schoolName || '.......';
    const displaySchool = rawSchool.startsWith('โรงเรียน') ? rawSchool : 'โรงเรียน' + rawSchool;
    const dStart = headerInfo.startDate || '.... เดือน ..... พ.ศ. .....';
    const dEnd = headerInfo.endDate || '.... เดือน ..... พ.ศ. .....';

    toast('⏳ กำลังเตรียมเอกสาร PDF...', '#0ea5e9');
    
    const printWindow = window.open('', '_blank');
    
    // จัดการเนื้อหา Loop แยกออกมาต่างหาก เพื่อป้องกัน Error จากการซ้อนเครื่องหมาย
    let blocksHtml = '';
    evalDataList.forEach((b) => {
        let cleanTitle = b.title || '';
        cleanTitle = cleanTitle.replace(/^[0-9]+(\.[0-9]+)*\.?\s*/, '');
        
        let imgHtml = '';
        if (b.imageUrl) {
            imgHtml = `<div class="pdf-image"><img src="${getDriveThumbnail(b.imageUrl)}" crossorigin="anonymous"></div>`;
        }
        
        blocksHtml += `
        <div class="pdf-section">
            <div class="pdf-section-title">${b.order}. ${cleanTitle}</div>
            <div class="pdf-section-content">${b.content}</div>
            ${imgHtml}
        </div>`;
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>รายงานประเมินครูผู้ช่วย_ครั้งที่_${currentEvalRound}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        <style>
            /* ตั้งค่าหน้ากระดาษ PDF */
            @page { 
                size: A4 portrait; 
                margin: 20mm 15mm 20mm 20mm; /* ขอบกระดาษ บน ขวา ล่าง ซ้าย */
            }
            body {
                font-family: 'Sarabun', sans-serif;
                font-size: 10pt; /* ขนาด 10pt */
                color: #000;
                line-height: 1.6;
                background: #fff;
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                word-wrap: break-word;
            }
            
            .pdf-header { text-align: center; margin-bottom: 20pt; }
            .pdf-header .h1 { font-size: 14pt; font-weight: bold; margin-bottom: 6pt; line-height: 1.3; }
            .pdf-header .h2 { font-size: 12pt; font-weight: bold; margin-bottom: 4pt; }
            .pdf-header .h3 { font-size: 10pt; margin-bottom: 4pt; }
            
            .pdf-section { 
                margin-bottom: 15pt; 
                page-break-inside: avoid; /* ป้องกันการตัดเนื้อหาข้ามหน้า */
            }
            .pdf-section-title { font-size: 10pt; font-weight: bold; margin-bottom: 6pt; }
            
            .pdf-section-content { 
                font-size: 10pt;
                margin-bottom: 8pt; 
            }
            
            .pdf-section-content p { 
                margin-top: 0; 
                margin-bottom: 8pt; 
                text-align: left; 
                white-space: pre-wrap;
            }
            
            .pdf-image { 
                text-align: center; 
                margin-top: 10pt; 
                page-break-inside: avoid; /* ป้องกันรูปภาพถูกหั่นครึ่ง */
            }
            .pdf-image img { 
                max-width: 85%; 
                max-height: 350px; 
                border: 1px solid #ddd; 
                border-radius: 8px; 
            }
        </style>
    </head>
    <body>
        <div class="pdf-header">
            <div class="h1">รายงานผลการปฏิบัติงานการเตรียมความพร้อมและพัฒนาอย่างเข้ม</div>
            <div class="h2">ตำแหน่งครูผู้ช่วย</div>
            <div class="h3">ครั้งที่ ${currentEvalRound} ตั้งแต่วันที่ ${dStart} ถึง วันที่ ${dEnd}</div>
            <div class="h3">${displaySchool} สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาเชียงราย</div>
            <div class="h3">สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน</div>
            <div class="h3">กระทรวงศึกษาธิการ</div>
        </div>
        
        ${blocksHtml}
        
    </body>
    </html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // รอ 1.5 วินาทีให้ฟอนต์ Sarabun และรูปภาพโหลดเสร็จ แล้วจึงเรียกหน้าต่าง Print
    setTimeout(() => {
        toast('✅ พร้อมบันทึก PDF', '#10b981');
        printWindow.print();
    }, 1500);
};


// ฟังก์ชันสำหรับโหลดรายการโฟลเดอร์เอกสารมาแสดงและจัดการในระบบหลังบ้าน
function loadAdminAlbumsList() {
    const listDiv = document.getElementById('adminAlbumList');
    if(!listDiv) return;
    
    // ดึงข้อมูลคอลเลกชัน albums เรียงตามเวลาล่าสุด
    db.collection('albums').orderBy('createdAt', 'desc').onSnapshot(snap => {
        if(snap.empty) {
            listDiv.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem; text-align:center; padding:15px 0;">ยังไม่มีโฟลเดอร์เอกสารในระบบ</p>';
            return;
        }
        
        let html = '';
        snap.forEach(doc => {
            const data = doc.data();
            html += `
            <div class="portfolio-item-row" style="border-left: 4px solid var(--c3-yellow); margin-bottom: 10px; padding: 15px 20px;">
                <div class="portfolio-thumb" style="border:2px solid var(--c3-yellow)20; font-size:1.5rem; color:var(--c3-yellow);">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="portfolio-item-info">
                    <h4 style="color:var(--text-main); font-weight:700;">${data.name || 'โฟลเดอร์ไม่มีชื่อ'}</h4>
                    <p style="font-size:0.8rem; color:var(--text-muted);">จำนวนลิงก์ภายในโฟลเดอร์: ${data.files ? data.files.length : 0} รายการ</p>
                </div>
                <button class="btn-icon btn-edit" onclick="editAdminAlbum('${doc.id}')" style="margin-right: 5px;">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon btn-del" onclick="deleteItemAdmin('albums','${doc.id}','${(data.name || '').replace(/'/g, "\\'")}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>`;
        });
        listDiv.innerHTML = html;
    }, err => {
        listDiv.innerHTML = '<p style="color:#ef4444; font-size:0.9rem;">ไม่สามารถโหลดข้อมูลได้ (ตรวจเช็ค Firebase Index)</p>';
    });
}



// ===================================================
// ระบบจัดการโฟลเดอร์เอกสาร (Google Drive API + เรียงลำดับ)
// ===================================================
let allAdminAlbums = [];

// ฟังก์ชันสำหรับดึง ID ของไฟล์หรือโฟลเดอร์จากลิงก์ Google Drive
function extractDriveIdFromUrl(url) {
    const m = url.match(/\/folders\/([\w-]{25,})/) || url.match(/\/d\/([\w-]{25,})/) || url.match(/id=([\w-]{25,})/) || url.match(/([\w-]{25,})/);
    return m ? (m[1] || m[2] || m[3] || m[4] || m[0]) : null;
}

async function fetchDriveFolderName(folderId, apiKey) {
    if (!folderId || !apiKey) return null;
    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=name,mimeType&key=${apiKey}`);
        const data = await response.json();
        if (data && data.name) return data.name;
    } catch (err) {
        console.warn('ไม่สามารถดึงชื่อโฟลเดอร์จาก Google Drive ได้:', err);
    }
    return null;
}

// โหลดข้อมูลคลังโฟลเดอร์
function loadAdminAlbumsList() {
    const listDiv = document.getElementById('adminAlbumList');
    if(!listDiv) return;
    
    db.collection('albums').onSnapshot(snap => {
        allAdminAlbums = [];
        snap.forEach(doc => { allAdminAlbums.push({ id: doc.id, ...doc.data() }); });
        allAdminAlbums.sort((a, b) => (a.order || 99) - (b.order || 99));
        renderAdminAlbumsList(15);
    }, err => {
        listDiv.innerHTML = '<p style="color:#ef4444; font-size:0.9rem;">ไม่สามารถโหลดข้อมูลโฟลเดอร์ได้</p>';
    });
}

function renderAdminAlbumsList(limit = 15) {
    const listDiv = document.getElementById('adminAlbumList');
    if(!listDiv) return;
    
    if(allAdminAlbums.length === 0) {
        listDiv.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem; text-align:center; padding:15px 0;">ยังไม่มีโฟลเดอร์เอกสารในระบบ</p>';
        return;
    }
    
    const displayAlbums = allAdminAlbums.slice(0, limit);
    let html = displayAlbums.map(album => `
        <div class="portfolio-item-row" style="border-left: 4px solid var(--c3-yellow); margin-bottom: 10px; padding: 15px 20px; position: relative;">
            <div style="position:absolute; top:12px; left:15px; background:#f1f5f9; padding:4px 10px; border-radius:10px; font-size:0.75rem; font-weight:700;">#${album.order || 99}</div>
            <div class="portfolio-thumb" style="border:2px solid var(--c3-yellow)20; font-size:1.5rem; color:var(--c3-yellow); margin-top:10px;">
                <i class="fas fa-folder"></i>
            </div>
            <div class="portfolio-item-info">
                <h4 style="color:var(--text-main); font-weight:700;">${album.name || 'โฟลเดอร์ไม่มีชื่อ'}</h4>
                <p style="font-size:0.8rem; color:var(--text-muted);">จำนวนไฟล์ภายในโฟลเดอร์: ${album.files ? album.files.length : 0} รายการ</p>
            </div>
            <button class="btn-icon btn-edit" onclick="editAdminAlbum('${album.id}')" style="margin-right: 5px;"><i class="fas fa-pen"></i></button>
            <button class="btn-icon btn-del" onclick="deleteItemAdmin('albums','${album.id}','${(album.name || '').replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
        </div>`
    ).join('');
    
    if (allAdminAlbums.length > limit) {
        html += `
        <div style="width: 100%; text-align: center; margin-top: 20px; margin-bottom: 10px;">
            <button onclick="renderAdminAlbumsList(${limit + 15})" class="btn-submit bg-c4" style="width:auto; padding:10px 25px; border-radius:10px; border:none; color:#fff; cursor:pointer; font-family:var(--font-main); font-weight:600;">
                <i class="fas fa-chevron-down"></i> ดูโฟลเดอร์เอกสารเพิ่มเติม
            </button>
        </div>`;
    }
    listDiv.innerHTML = html;
}

// ฟังก์ชันล้างค่าฟอร์ม
function resetAlbumForm() {
    if(document.getElementById('editingAlbumId')) document.getElementById('editingAlbumId').value = '';
    if(document.getElementById('impAlbumName')) document.getElementById('impAlbumName').value = '';
    if(document.getElementById('impFolderLink')) document.getElementById('impFolderLink').value = ''; 
    if(document.getElementById('albumOrder')) document.getElementById('albumOrder').value = '1'; 
    if(document.getElementById('albumLinkStatus')) document.getElementById('albumLinkStatus').textContent = 'กรุณากรอกลิงก์โฟลเดอร์และระบบจะตรวจสอบให้โดยอัตโนมัติ';
    if(document.getElementById('albumFormTitle')) document.getElementById('albumFormTitle').textContent = 'สร้างโฟลเดอร์เอกสารจากลิงก์';
    if(document.getElementById('btnSaveAlbum')) document.getElementById('btnSaveAlbum').innerHTML = 'บันทึกโฟลเดอร์ลงระบบ';
    if(document.getElementById('btnCancelEditAlbum')) document.getElementById('btnCancelEditAlbum').style.display = 'none';
}

// ดึงข้อมูลโฟลเดอร์เก่ามากางเพื่อแก้ไขอัปเดต
window.editAdminAlbum = function(id) {
    db.collection('albums').doc(id).get().then(doc => {
        if(!doc.exists) return;
        const data = doc.data();
        document.getElementById('editingAlbumId').value = id;
        document.getElementById('impAlbumName').value = data.name || '';
        if(document.getElementById('albumOrder')) document.getElementById('albumOrder').value = data.order || '1'; 
        if(document.getElementById('impFolderLink')) document.getElementById('impFolderLink').value = data.folderUrl || '';
        
        document.getElementById('albumFormTitle').textContent = 'แก้ไขโฟลเดอร์เอกสาร';
        document.getElementById('btnSaveAlbum').innerHTML = '<i class="fas fa-sync-alt"></i> อัปเดตและดึงไฟล์ใหม่';
        document.getElementById('btnCancelEditAlbum').style.display = 'inline-block';
        document.getElementById('albumFormTitle').scrollIntoView({ behavior: 'smooth' });
    }).catch(err => toast('ไม่สามารถดึงข้อมูลมาแก้ไขได้', '#ef4444'));
};

// ==========================================
// Event Listener บันทึกข้อมูลผ่าน Google Drive API
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const albumLinkInput = document.getElementById('impFolderLink');
    const albumLinkStatus = document.getElementById('albumLinkStatus');
    const albumOrderInput = document.getElementById('albumOrder');

    document.getElementById('btnCancelEditAlbum')?.addEventListener('click', resetAlbumForm);

    const workCategoryNameInput = document.getElementById('workCategoryName');
    const workCategoryLinkInput = document.getElementById('workCategoryLink');
    const workCategoryStatus = document.getElementById('workCategoryStatus');
    const workCategoryOrderInput = document.getElementById('workCategoryOrder');

    function resetWorkCategoryForm() {
        if (document.getElementById('editingWorkCategoryId')) document.getElementById('editingWorkCategoryId').value = '';
        if (workCategoryNameInput) workCategoryNameInput.value = '';
        if (document.getElementById('workCategoryDesc')) document.getElementById('workCategoryDesc').value = '';
        if (workCategoryLinkInput) workCategoryLinkInput.value = '';
        if (workCategoryOrderInput) workCategoryOrderInput.value = '1';
        if (workCategoryStatus) workCategoryStatus.textContent = 'กรุณากรอกลิงก์โฟลเดอร์และระบบจะตรวจสอบให้โดยอัตโนมัติ';
        if (workCategoryStatus) workCategoryStatus.style.color = '#64748b';
        if (document.getElementById('btnCancelEditWorkCategory')) document.getElementById('btnCancelEditWorkCategory').style.display = 'none';
        if (document.getElementById('workFormTitle')) document.getElementById('workFormTitle').textContent = 'สร้างบล็อคด้านการปฏิบัติงานจากลิงก์';
    }

    window.editWorkCategory = function(id) {
        db.collection('work_categories').doc(id).get().then(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            document.getElementById('editingWorkCategoryId').value = id;
            if (workCategoryNameInput) workCategoryNameInput.value = data.name || '';
            if (document.getElementById('workCategoryDesc')) document.getElementById('workCategoryDesc').value = data.description || '';
            if (workCategoryLinkInput) workCategoryLinkInput.value = data.folderUrl || '';
            if (workCategoryOrderInput) workCategoryOrderInput.value = data.order || '1';
            if (document.getElementById('workFormTitle')) document.getElementById('workFormTitle').textContent = 'แก้ไขบล็อคด้านการปฏิบัติงาน';
            document.getElementById('btnCancelEditWorkCategory').style.display = 'inline-block';
            document.getElementById('workCategoryLink').scrollIntoView({ behavior: 'smooth' });
        }).catch(() => toast('ไม่สามารถโหลดข้อมูลหมวดงานได้', '#ef4444'));
    };

    async function loadAdminWorkCategoriesList() {
        const listDiv = document.getElementById('adminWorkCategoryList');
        if (!listDiv) return;
        try {
            const snap = await db.collection('work_categories').orderBy('order', 'asc').get();
            if (snap.empty) {
                listDiv.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem; text-align:center; padding:15px 0;">ยังไม่มีหมวดงานในระบบ</p>';
                return;
            }
            let html = '';
            snap.forEach(doc => {
                const data = doc.data();
                const items = data.items || [];
                html += `
                <div class="portfolio-item-row" style="border-left: 4px solid var(--c4-blue); margin-bottom: 10px; padding: 15px 20px;">
                    <div class="portfolio-thumb" style="border:2px solid rgba(96,176,255,0.2); font-size:1.4rem; color:var(--c4-blue);">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div class="portfolio-item-info">
                        <h4 style="color:var(--text-main); font-weight:700;">${data.name || 'หมวดงานไม่มีชื่อ'}</h4>
                        <p style="font-size:0.8rem; color:var(--text-muted);">${items.length} รายการ • ${data.description || 'ไม่ระบุคำอธิบาย'}</p>
                    </div>
                    <button class="btn-icon btn-edit" onclick="editWorkCategory('${doc.id}')" style="margin-right: 5px;"><i class="fas fa-pen"></i></button>
                    <button class="btn-icon btn-del" onclick="deleteItemAdmin('work_categories','${doc.id}','${(data.name || '').replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                </div>`;
            });
            listDiv.innerHTML = html;
        } catch (err) {
            listDiv.innerHTML = '<p style="color:#ef4444; font-size:0.9rem;">ไม่สามารถโหลดรายการด้านการปฏิบัติงานได้</p>';
        }
    }

    document.getElementById('btnCancelEditWorkCategory')?.addEventListener('click', resetWorkCategoryForm);

    workCategoryLinkInput?.addEventListener('input', async () => {
        const link = workCategoryLinkInput.value.trim();
        const folderId = extractDriveIdFromUrl(link);
        if (!link) {
            workCategoryStatus.textContent = 'กรุณากรอกลิงก์โฟลเดอร์และระบบจะตรวจสอบให้โดยอัตโนมัติ';
            workCategoryStatus.style.color = '#64748b';
            return;
        }
        if (!folderId) {
            workCategoryStatus.textContent = 'ลิงก์ไม่ถูกต้อง กรุณาใช้ลิงก์ Google Drive โฟลเดอร์';
            workCategoryStatus.style.color = '#ef4444';
            return;
        }
        workCategoryStatus.textContent = 'กำลังตรวจสอบลิงก์...';
        workCategoryStatus.style.color = '#3b82f6';
        const driveName = await fetchDriveFolderName(folderId, 'AIzaSyBLEfMAIUQy32xYV25JkHuQcj8LKvqjW2I');
        if (driveName && workCategoryNameInput && !workCategoryNameInput.value.trim()) {
            workCategoryNameInput.value = driveName;
        }
        workCategoryStatus.textContent = 'ลิงก์ถูกต้อง ระบบจะดึงรายการงานมาแสดงบนหน้าเว็บไซต์';
        workCategoryStatus.style.color = '#10b981';
    });

    document.getElementById('btnSaveWorkCategory')?.addEventListener('click', async () => {
        const GOOGLE_DRIVE_API_KEY = 'AIzaSyBLEfMAIUQy32xYV25JkHuQcj8LKvqjW2I';
        const id = document.getElementById('editingWorkCategoryId').value;
        const name = workCategoryNameInput?.value.trim();
        const description = document.getElementById('workCategoryDesc')?.value.trim() || '';
        const orderVal = parseInt(workCategoryOrderInput?.value) || 1;
        const folderUrl = workCategoryLinkInput?.value.trim();

        if (!name || !folderUrl) {
            toast('กรุณากรอกชื่อหมวดและวางลิงก์โฟลเดอร์ Google Drive', '#ef4444');
            return;
        }

        const folderId = extractDriveIdFromUrl(folderUrl);
        if (!folderId) {
            toast('รูปแบบลิงก์ Google Drive ไม่ถูกต้อง', '#ef4444');
            return;
        }

        const btn = document.getElementById('btnSaveWorkCategory');
        const ogText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูล...';
        btn.disabled = true;

        try {
            const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,webViewLink)&key=${GOOGLE_DRIVE_API_KEY}`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const items = (data.files || []).map(f => ({
                name: f.name,
                url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
                driveId: f.id,
                type: f.mimeType?.includes('image/') ? 'image' : f.mimeType?.includes('pdf') ? 'pdf' : 'other'
            }));

            const payload = {
                name,
                description,
                folderUrl,
                order: orderVal,
                items,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (id) {
                await db.collection('work_categories').doc(id).update(payload);
                toast('✅ อัปเดตหมวดงานเรียบร้อยแล้ว', '#10b981');
            } else {
                await db.collection('work_categories').add({
                    ...payload,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                toast('✅ เพิ่มหมวดงานเรียบร้อยแล้ว', '#10b981');
            }
            resetWorkCategoryForm();
            await loadAdminWorkCategoriesList();
        } catch (err) {
            console.error(err);
            toast('❌ ดึงข้อมูลล้มเหลว ตรวจสอบลิงก์หรือสิทธิ์แชร์', '#ef4444');
        } finally {
            btn.innerHTML = ogText;
            btn.disabled = false;
        }
    });

    loadAdminWorkCategoriesList();

    const updateAlbumOrderAuto = () => {
        if (!albumOrderInput || albumOrderInput.value) return;
        db.collection('albums').get().then(snapshot => {
            const orders = snapshot.docs.map(doc => Number(doc.data().order) || 0);
            const nextOrder = orders.length ? Math.max(...orders) + 1 : 1;
            albumOrderInput.value = nextOrder;
        }).catch(() => {
            albumOrderInput.value = '1';
        });
    };

    albumLinkInput?.addEventListener('input', async () => {
        const link = albumLinkInput.value.trim();
        const folderId = extractDriveIdFromUrl(link);
        const nameInput = document.getElementById('impAlbumName');
        if (!link) {
            albumLinkStatus.textContent = 'กรุณากรอกลิงก์โฟลเดอร์และระบบจะตรวจสอบให้โดยอัตโนมัติ';
            albumLinkStatus.style.color = '#64748b';
            return;
        }
        if (!folderId) {
            albumLinkStatus.textContent = 'ลิงก์ไม่ถูกต้อง กรุณาใช้ลิงก์ Google Drive โฟลเดอร์';
            albumLinkStatus.style.color = '#ef4444';
            return;
        }

        albumLinkStatus.textContent = 'กำลังดึงชื่อโฟลเดอร์จากลิงก์...';
        albumLinkStatus.style.color = '#3b82f6';

        const driveName = await fetchDriveFolderName(folderId, 'AIzaSyBLEfMAIUQy32xYV25JkHuQcj8LKvqjW2I');
        if (driveName && nameInput && !nameInput.value.trim()) {
            nameInput.value = driveName;
        }

        albumLinkStatus.textContent = 'ลิงก์ถูกต้อง ระบบจะตรวจสอบและดึงไฟล์ให้โดยอัตโนมัติ';
        albumLinkStatus.style.color = '#10b981';
    });

    albumLinkInput?.addEventListener('blur', updateAlbumOrderAuto);

    document.getElementById('btnSaveAlbum')?.addEventListener('click', async () => {
        // 🔑 ใส่ API Key ที่นี่
        const GOOGLE_DRIVE_API_KEY = 'AIzaSyBLEfMAIUQy32xYV25JkHuQcj8LKvqjW2I'; 
        
        const id = document.getElementById('editingAlbumId').value;
        const name = document.getElementById('impAlbumName').value.trim();
        const orderVal = parseInt(document.getElementById('albumOrder').value) || 1;
        const folderUrl = document.getElementById('impFolderLink')?.value.trim();
        
        if(!name || !folderUrl){ 
            toast('กรุณากรอกชื่อคลังและวางลิงก์โฟลเดอร์ Google Drive', '#ef4444'); 
            return; 
        }

        const folderId = extractDriveIdFromUrl(folderUrl);
        if(!folderId) {
            toast('รูปแบบลิงก์ Google Drive ไม่ถูกต้อง', '#ef4444'); 
            return;
        }

        const btn = document.getElementById('btnSaveAlbum');
        const ogText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูลไฟล์...';
        btn.disabled = true;

        try {
            const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,webViewLink)&key=${GOOGLE_DRIVE_API_KEY}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) throw new Error(data.error.message);

            const files = data.files.map(f => {
                let fileType = 'other';
                if (f.mimeType.includes('image/')) fileType = 'image';
                else if (f.mimeType.includes('pdf')) fileType = 'pdf';

                return {
                    url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
                    driveId: f.id,
                    type: fileType,
                    name: f.name
                };
            });

            if(files.length === 0) toast('ไม่พบไฟล์ในโฟลเดอร์นี้ หรือยังไม่ได้เปิดแชร์สาธารณะ', '#f59e0b');

            if(id) {
                await db.collection('albums').doc(id).update({
                    name: name, order: orderVal, folderUrl: folderUrl, files: files, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                toast('✅ อัปเดตข้อมูลโฟลเดอร์เรียบร้อยแล้ว', '#10b981');
            } else {
                const autoOrder = orderVal || 1;
                await db.collection('albums').add({
                    name: name, order: autoOrder, folderUrl: folderUrl, files: files, createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                toast('✅ บันทึกโฟลเดอร์ใหม่เรียบร้อยแล้ว', '#10b981');
            }
            resetAlbumForm();
        } catch (err) {
            console.error(err);
            toast('❌ ดึงข้อมูลล้มเหลว: ตรวจสอบ API Key หรือการแชร์โฟลเดอร์', '#ef4444');
        } finally {
            btn.innerHTML = ogText;
            btn.disabled = false;
        }
    });
});