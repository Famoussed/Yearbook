document.addEventListener("DOMContentLoaded", () => {
    // 1. Tab Tıklamalarını Dinle
    setupMemoryTabListeners();

    // 2. Arama Fonksiyonunu Başlat
    setupSearch();

    // 3. Modal ve Form İşlemlerini Başlat
    setupMemoryModal();

    // 4. Filtre Butonlarını Başlat (Gelen/Giden)
    setupMemoryFilterButtons();

    // 5. Düzenleme Formunu Başlat (YENİ EKLENEN)
    const editForm = document.getElementById('editMemoryForm');
    if (editForm) {
        editForm.addEventListener('submit', handleUpdateMemory);
    }
});

// --- GÜVENLİK FONKSİYONU ---
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}

// --- GLOBAL FONKSİYON: Onaylama/Reddetme (Gelen Anılar İçin) ---
async function updateMemoryStatus(memoryId, decision) {
    const actionName = decision === 'approved' ? "Yıllığa eklemek" : "Reddetmek";
    if (!confirm(`Bu anı yazısını ${actionName} istediğine emin misin?`)) return;

    try {
        const response = await fetch('/api/memory/approve-student', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-access-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ memory_id: memoryId, decision: decision })
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ " + result.message);
            loadMemories('received'); 
        } else {
            alert("❌ Hata: " + result.message);
        }
    } catch (error) {
        console.error("İşlem hatası:", error);
        alert("Sunucuyla iletişim kurulamadı.");
    }
}

// --- DÜZENLEME İŞLEMLERİ (YENİ EKLENENLER) ---

// 1. Modalı Aç ve Verileri Doldur
function openEditModal(memoryId, receiverName) {
    // Gizli div'den içeriği güvenli şekilde al
    const contentStorage = document.getElementById(`content-storage-${memoryId}`);
    const currentContent = contentStorage ? contentStorage.innerText : "";

    // Modal içindeki inputları doldur
    document.getElementById('editMemoryId').value = memoryId;
    document.getElementById('editModalTargetName').innerText = receiverName;
    document.getElementById('editMemoryContent').value = currentContent;

    // Modalı Göster
    const modalEl = document.getElementById('editMemoryModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// 2. Güncelleme İsteğini Gönder (PUT)
async function handleUpdateMemory(e) {
    e.preventDefault();

    const memoryId = document.getElementById('editMemoryId').value;
    const newContent = document.getElementById('editMemoryContent').value;

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    // Butonu kilitle
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Güncelleniyor...';

    try {
        const response = await fetch(`/api/memories/${memoryId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-access-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ content: newContent })
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ Anı başarıyla güncellendi ve tekrar onaya gönderildi!");

            // Modalı Kapat
            const modalEl = document.getElementById('editMemoryModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            modalInstance.hide();

            // Listeyi Yenile
            loadMemories('sent');
        } else {
            alert("⚠️ Hata: " + result.message);
        }

    } catch (error) {
        console.error("Güncelleme hatası:", error);
        alert("Bir bağlantı hatası oluştu.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}


// --- TAB DİNLEYİCİLERİ ---
function setupMemoryTabListeners() {
    const writeTab = document.querySelector('[data-target="panel-write"]');
    if (writeTab) {
        writeTab.addEventListener('click', loadClassmates);
    }

    const readTab = document.querySelector('[data-target="panel-memories"]');
    if (readTab) {
        readTab.addEventListener('click', () => {
            const btnReceived = document.getElementById('btnShowReceived');
            const btnSent = document.getElementById('btnShowSent');
            if(btnReceived && btnSent) {
                toggleMemoryButtons(btnReceived, btnSent);
            }
            loadMemories('received');
        });
    }
}

// --- FİLTRE BUTONLARI ---
function setupMemoryFilterButtons() {
    const btnReceived = document.getElementById('btnShowReceived');
    const btnSent = document.getElementById('btnShowSent');

    if(btnReceived && btnSent) {
        btnReceived.addEventListener('click', () => {
            toggleMemoryButtons(btnReceived, btnSent);
            loadMemories('received');
        });

        btnSent.addEventListener('click', () => {
            toggleMemoryButtons(btnSent, btnReceived);
            loadMemories('sent');
        });
    }
}

function toggleMemoryButtons(activeBtn, inactiveBtn) {
    activeBtn.classList.remove('btn-outline-primary');
    activeBtn.classList.add('btn-primary');
    
    inactiveBtn.classList.remove('btn-primary');
    inactiveBtn.classList.add('btn-outline-primary');
}

// --- 1. ARKADAŞ LİSTESİ ---
async function loadClassmates() {
    const listContainer = document.getElementById('classmatesList');
    listContainer.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin"></i> Liste Yükleniyor...</div>';

    try {
        const response = await fetch('/api/memory/classmates', { 
            headers: { 'x-access-token': localStorage.getItem('token') }
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Liste çekilemedi");
        }
        
        const classmates = await response.json();
        listContainer.innerHTML = ''; 

        if (!Array.isArray(classmates) || classmates.length === 0) {
            listContainer.innerHTML = '<div class="text-center text-muted">Henüz kayıtlı başka öğrenci yok.</div>';
            return;
        }

        classmates.forEach(student => {
            const safeFullname = escapeHTML(student.fullname);
            const safeClassInfo = escapeHTML(student.class_info || "");
            const safeStudentNumber = escapeHTML(student.student_number || "");

            const card = document.createElement('div');
            card.className = "glass-card p-3 d-flex justify-content-between align-items-center friend-card mb-3";
            card.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" style="width:50px; height:50px;">
                        <i class="fas fa-user-graduate text-muted"></i>
                    </div>
                    <div>
                        <h6 class="fw-bold mb-0 friend-name">${safeFullname}</h6>
                        <small class="text-muted">${safeStudentNumber} - ${safeClassInfo}</small>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-primary rounded-pill px-3 write-btn" 
                        data-id="${student.student_id}" 
                        data-name="${safeFullname}">
                    <i class="fas fa-pen-fancy me-1"></i> Yıllığına Yaz
                </button>
            `;
            listContainer.appendChild(card);
        });

        document.querySelectorAll('.write-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                openWriteModal(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
            });
        });

    } catch (error) {
        listContainer.innerHTML = `<div class="text-center text-danger">Hata: ${error.message}</div>`;
    }
}

// --- 2. MODAL İŞLEMLERİ ---
function openWriteModal(studentId, studentName) {
    document.getElementById('modalTargetName').innerText = studentName;
    document.getElementById('modalTargetId').value = studentId;
    
    const modalElement = document.getElementById('writeMemoryModal');
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();
}

function setupMemoryModal() {
    const form = document.getElementById('memoryForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/memory/create', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-access-token': localStorage.getItem('token')
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    alert("🎉 " + result.message);
                    form.reset();
                    const modalElement = document.getElementById('writeMemoryModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    modalInstance.hide();
                    
                    const btnSent = document.getElementById('btnShowSent');
                    if(btnSent) btnSent.click();
                } else {
                    alert("⚠️ Uyarı: " + result.message);
                }
            } catch (error) {
                console.error(error);
                alert("Bir hata oluştu.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
}

// --- 3. ANILARI LİSTELEME ---
async function loadMemories(type) {
    const container = document.getElementById('myMemoriesList');
    const charCountContainer = document.getElementById('memoryCharacterCount');
    const charCountVal = document.getElementById('charCountVal');

    container.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin"></i> Yükleniyor...</div>';
    
    // Sayaç Görünürlüğü (Sadece bana gelenlerde göster)
    if (type === 'received') {
        if(charCountContainer) charCountContainer.classList.remove('d-none');
    } else {
        if(charCountContainer) charCountContainer.classList.add('d-none');
    }

    const apiURL = type === 'received' ? '/api/memory/my-memories' : '/api/memory/sent-memories';

    try {
        const response = await fetch(apiURL, { 
            headers: { 'x-access-token': localStorage.getItem('token') }
        });

        if (!response.ok) {
             const err = await response.json();
             throw new Error(err.message || "Veri çekilemedi.");
        }
        
        const memories = await response.json();
        container.innerHTML = '';

        // KARAKTER SAYACI HESAPLAMA
        let totalChars = 0;
        if (type === 'received') {
            memories.forEach(m => {
                // Sadece onaylanmış veya bekleyenleri sayalım (Reddedilenler yıllıkta yer almaz genelde)
                // Ancak kullanıcı hepsini görüyorsa hepsini saymak daha doğru olabilir.
                // İsteğe göre: Sadece 'approved' olanlar da sayılabilir. 
                // Şimdilik hepsini sayıyorum.
                if (m.content) totalChars += m.content.length;
            });

            if (charCountVal) {
                charCountVal.innerText = totalChars;
                // Limit Kontrolü
                if (totalChars > 13000) {
                    charCountContainer.classList.remove('text-success', 'text-dark');
                    charCountContainer.classList.add('text-danger');
                } else {
                    charCountContainer.classList.remove('text-danger', 'text-dark');
                    charCountContainer.classList.add('text-success');
                }
            }
        }

        if (!Array.isArray(memories) || memories.length === 0) {
            const msg = type === 'received' ? "Henüz kimse sana yazmamış." : "Henüz kimseye yazmamışsın.";
            container.innerHTML = `<div class="text-center py-5 text-muted"><i class="fas fa-envelope-open-text fa-3x mb-3 opacity-25"></i><p>${msg}</p></div>`;
            return;
        }

        memories.forEach(memory => {
            const date = new Date(memory.createdAt).toLocaleDateString('tr-TR');
            let personName = "Bilinmiyor";
            let iconColor = "bg-primary"; 
            let headerText = "Kimden:";
            let footerActions = ""; 

            // --- DURUM 1: BANA YAZILANLAR (Received) ---
            if (type === 'received') {
                personName = memory.sender ? memory.sender.user.fullname : "Gizli";
                
                if (memory.student_status === 'pending') {
                    // ... (footerActions aynı kalacak) ...
                    footerActions = `
                        <div class="mt-3 d-flex gap-2 justify-content-end border-top pt-3" style="border-color: rgba(0,0,0,0.05) !important;">
                            <button class="btn btn-sm btn-outline-danger rounded-pill px-3" 
                                    onclick="updateMemoryStatus(${memory.id}, 'rejected')">
                                <i class="fas fa-times me-1"></i>Reddet
                            </button>
                            <button class="btn btn-sm btn-success rounded-pill px-3" 
                                    onclick="updateMemoryStatus(${memory.id}, 'approved')">
                                <i class="fas fa-check me-1"></i>Yıllığa Ekle
                            </button>
                        </div>
                    `;
                } else if (memory.student_status === 'approved') {
                    footerActions = `<div class="mt-3 text-end"><span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Yıllığa Eklendi</span></div>`;
                } else {
                    footerActions = `<div class="mt-3 text-end"><span class="badge bg-danger"><i class="fas fa-ban me-1"></i>Reddedildi</span></div>`;
                }

            } 
            // --- DURUM 2: BENİM YAZDIKLARIM (Sent) ---
            else {
                personName = memory.receiver ? memory.receiver.user.fullname : "Silinmiş Kullanıcı";
                iconColor = "bg-success"; 
                headerText = "Kime:";
                
                let badges = "";
                
                // Öğretmen Durumu
                if(memory.teacher_status === 'pending') badges += '<span class="badge bg-warning text-dark me-1">Öğretmen: Bekliyor</span>';
                else if(memory.teacher_status === 'rejected') badges += '<span class="badge bg-danger me-1">Öğretmen: Reddetti</span>';
                else badges += '<span class="badge bg-success me-1">Öğretmen: Onayladı</span>';

                // Arkadaş Durumu
                if(memory.student_status === 'pending') badges += '<span class="badge bg-info text-dark">Arkadaş: Bekliyor</span>';
                else if(memory.student_status === 'rejected') badges += '<span class="badge bg-danger">Arkadaş: Reddetti</span>';
                else badges += '<span class="badge bg-success">Arkadaş: Onayladı</span>';

                const safePersonNameForModal = escapeHTML(personName).replace(/'/g, "\\'"); // Modal için ekstra kaçış

                // 👇 YENİ EKLENEN KISIM: DÜZENLEME BUTONU 👇
                let editButtonHtml = '';
                // Sadece 'Reddedildi' veya 'Bekliyor' ise düzenlenebilir olsun
                
                    editButtonHtml = `
                        <button class="btn btn-sm btn-outline-secondary rounded-pill ms-2" 
                            onclick="openEditModal(${memory.id}, '${safePersonNameForModal}')">
                            <i class="fas fa-edit me-1"></i>Düzenle
                        </button>
                    `;

                // Badges ve Butonu birleştir
                footerActions = `<div class="mt-3 text-end d-flex align-items-center justify-content-end">${badges} ${editButtonHtml}</div>`;
            }

            const safePersonName = escapeHTML(personName);
            const safeContent = escapeHTML(memory.content);

            const item = document.createElement('div');
            item.className = "glass-card p-4 mb-3"; 
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="d-flex align-items-center">
                        <div class="${iconColor} text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width:40px; height:40px;">
                            <i class="fas ${type === 'received' ? 'fa-user' : 'fa-paper-plane'}"></i>
                        </div>
                        <div>
                            <small class="text-muted" style="font-size:0.7rem;">${headerText}</small>
                            <h6 class="fw-bold mb-0">${safePersonName}</h6>
                            <small class="text-muted" style="font-size:0.8rem;">${date}</small>
                        </div>
                    </div>
                </div>
                <p class="mb-0 text-dark memory-text" style="font-style: italic; word-wrap: break-word; white-space: pre-wrap;">"${safeContent}"</p>
                ${footerActions}
                <div id="content-storage-${memory.id}" class="d-none">${safeContent}</div>
            `;
            container.appendChild(item);
        });

    } catch (error) {
        console.error("Hata:", error);
        container.innerHTML = `<div class="text-center text-danger">Hata: ${error.message}</div>`;
    }
}

// --- 4. ARAMA ---
function setupSearch() {
    const searchInput = document.getElementById('searchFriend');
    if(searchInput) {
        searchInput.addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const cards = document.querySelectorAll('.friend-card');
            cards.forEach(card => {
                const name = card.querySelector('.friend-name').innerText.toLowerCase();
                if (name.includes(filter)) card.classList.remove('d-none');
                else card.classList.add('d-none');
            });
        });
    }
}