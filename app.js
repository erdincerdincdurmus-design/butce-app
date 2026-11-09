// Verileri al, yoksa varsayılan boş dizi oluştur
let transactions = JSON.parse(localStorage.getItem('monthly_transactions')) || [];

const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

let savedPassword = localStorage.getItem('app_password');

function checkPasswordSetup() {
    const title = document.getElementById('loginTitle');
    const desc = document.getElementById('loginDesc');
    const btn = document.getElementById('loginBtn');
    if (!savedPassword) {
        if(title) title.textContent = "İlk Kurulum";
        if(desc) desc.textContent = "Uygulamanız için yeni bir giriş şifresi belirleyin.";
        if(btn) btn.textContent = "Şifreyi Kaydet";
    }
}

function checkPassword() {
    const inputEl = document.getElementById('passwordInput');
    const input = inputEl ? inputEl.value : '';
    const errorEl = document.getElementById('errorMsg');
    
    if (!input.trim()) return;

    if (!savedPassword) {
        localStorage.setItem('app_password', input);
        savedPassword = input;
        unlockApp();
    } else {
        if (input === savedPassword) {
            unlockApp();
        } else {
            if (errorEl) errorEl.style.display = 'block';
            if (inputEl) inputEl.value = '';
        }
    }
}

function unlockApp() {
    const overlay = document.getElementById('loginOverlay');
    const appContainer = document.getElementById('appContainer');
    
    if (overlay) overlay.style.display = 'none';
    if (appContainer) appContainer.classList.add('show');
    
    initMonthSelectors();
    updateUI();
}

// Sayfa tamamen yüklendiğinde çalıştır
window.onload = function() {
    checkPasswordSetup();
    const pwdInput = document.getElementById('passwordInput');
    if (pwdInput) {
        pwdInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') checkPassword();
        });
    }
};

// ŞİFRE DEĞİŞTİRME FONKSİYONU
function changePassword() {
    const currentInput = prompt("Şifrenizi değiştirmek için lütfen MEVCUT şifrenizi girin:");
    if (currentInput === null) return;

    if (currentInput !== savedPassword) {
        alert("Hata: Mevcut şifre yanlış!");
        return;
    }

    const newPassword = prompt("Yeni şifrenizi girin (en az 1 karakter):");
    if (!newPassword || !newPassword.trim()) {
        alert("İşlem iptal edildi veya geçersiz şifre girildi.");
        return;
    }

    localStorage.setItem('app_password', newPassword.trim());
    savedPassword = newPassword.trim();
    alert("Şifreniz başarıyla güncellendi!");
}

// ÖZEL TARİH KUTUSUNU AÇ/KAPAT
function toggleCustomDate() {
    const box = document.getElementById('customDateBox');
    const dateInput = document.getElementById('txCustomDate');
    
    if (!box || !dateInput) return;

    if (box.style.display === 'flex') {
        box.style.display = 'none';
        dateInput.value = '';
    } else {
        box.style.display = 'flex';
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

function initMonthSelectors() {
    const checkboxContainer = document.getElementById('monthCheckboxContainer');
    const targetMonthSelect = document.getElementById('txTargetMonth');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    let checkedMonths = new Set();
    document.querySelectorAll('#monthCheckboxContainer input:checked').forEach(cb => {
        checkedMonths.add(cb.value);
    });

    let availableMonths = new Set();
    for (let m = 12; m >= 1; m--) {
        if (m > currentMonth) continue; 
        availableMonths.add(`${currentYear}-${String(m).padStart(2, '0')}`);
    }
    
    transactions.forEach(tx => {
        if (tx.date) availableMonths.add(tx.date);
    });
    
    const sortedMonths = Array.from(availableMonths).sort().reverse();
    
    if (checkboxContainer) {
        checkboxContainer.innerHTML = '';
        sortedMonths.forEach((mVal, index) => {
            const [year, month] = mVal.split('-');
            const mText = `${monthNames[parseInt(month) - 1]} ${year}`;
            const label = document.createElement('label');
            label.className = 'month-checkbox-item';
            const isChecked = checkedMonths.size === 0 ? (index === 0) : checkedMonths.has(mVal);
            label.innerHTML = `
                <input type="checkbox" value="${mVal}" ${isChecked ? 'checked' : ''} onchange="updateUI()">
                <span>${mText}</span>
            `;
            checkboxContainer.appendChild(label);
        });
    }

    if (targetMonthSelect) {
        const savedTargetSelection = targetMonthSelect.value;
        targetMonthSelect.innerHTML = '';
        sortedMonths.forEach(mVal => {
            const [year, month] = mVal.split('-');
            const opt = document.createElement('option');
            opt.value = mVal;
            opt.textContent = `${monthNames[parseInt(month) - 1]} ${year}`;
            targetMonthSelect.appendChild(opt);
        });
        if(savedTargetSelection) targetMonthSelect.value = savedTargetSelection;
    }
}

// İŞLEMİ DÜZENLEME MODUNA GETİRME
function editTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const editIdEl = document.getElementById('txEditId');
    const titleEl = document.getElementById('txTitle');
    const amountEl = document.getElementById('txAmount');
    const typeEl = document.getElementById('txType');
    const targetMonthEl = document.getElementById('txTargetMonth');
    const customDateBox = document.getElementById('customDateBox');
    const txCustomDate = document.getElementById('txCustomDate');
    const saveBtn = document.getElementById('saveButton');

    if (editIdEl) editIdEl.value = tx.id;
    if (titleEl) titleEl.value = tx.title;
    if (amountEl) amountEl.value = tx.amount;
    if (typeEl) typeEl.value = tx.type;
    if (targetMonthEl) targetMonthEl.value = tx.date;

    if (tx.createdDate && customDateBox && txCustomDate) {
        customDateBox.style.display = 'flex';
        txCustomDate.value = tx.createdDate;
    }

    if (saveBtn) {
        saveBtn.textContent = "Değişikliği Güncelle";
        saveBtn.style.background = "#FF9500";
    }
    
    if (titleEl) titleEl.focus();
}

function addTransaction() {
    const editIdInp = document.getElementById('txEditId');
    const titleInp = document.getElementById('txTitle');
    const amountInp = document.getElementById('txAmount');
    const typeInp = document.getElementById('txType');
    const targetMonthSelect = document.getElementById('txTargetMonth');
    const customDateInp = document.getElementById('txCustomDate');
    const saveBtn = document.getElementById('saveButton');

    if (!titleInp || !amountInp || !targetMonthSelect) return;
    if (!titleInp.value.trim() || !amountInp.value || !targetMonthSelect.value) return;

    let selectedDate;
    if (customDateInp && customDateInp.value) {
        selectedDate = customDateInp.value;
    } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        selectedDate = `${year}-${month}-${day}`;
    }

    const [sYear, sMonth] = selectedDate.split('-');
    const derivedMonth = `${sYear}-${sMonth}`;

    const editId = editIdInp && editIdInp.value ? parseInt(editIdInp.value) : null;

    if (editId) {
        transactions = transactions.map(tx => {
            if (tx.id === editId) {
                return {
                    ...tx,
                    title: titleInp.value,
                    amount: parseFloat(amountInp.value),
                    type: typeInp.value,
                    date: derivedMonth,
                    createdDate: selectedDate
                };
            }
            return tx;
        });

        if (editIdInp) editIdInp.value = '';
        if (saveBtn) {
            saveBtn.textContent = "Yeni İşlemi Kaydet";
            saveBtn.style.background = "#007AFF";
        }
    } else {
        const newTx = {
            id: Date.now(),
            title: titleInp.value,
            amount: parseFloat(amountInp.value),
            type: typeInp.value,
            date: derivedMonth,        
            createdDate: selectedDate 
        };
        transactions.unshift(newTx);
    }

    // 📌 OTOMATİK TARİH SIRALAMASI (En yeni tarih üstte yer alır)
    transactions.sort((a, b) => {
        const dateA = a.createdDate || (a.date + "-01");
        const dateB = b.createdDate || (b.date + "-01");
        return new Date(dateB) - new Date(dateA);
    });

    titleInp.value = '';
    amountInp.value = '';
    if (customDateInp) customDateInp.value = '';
    const dateBox = document.getElementById('customDateBox');
    if (dateBox) dateBox.style.display = 'none';
    
    initMonthSelectors();
    updateUI();
}

function updateUI() {
    const list = document.getElementById('txList');
    const netBakiyeEl = document.getElementById('netBakiye');
    const toplamGelirEl = document.getElementById('toplamGelir');
    const toplamGiderEl = document.getElementById('toplamGider');
    const listCountEl = document.getElementById('listCount');
    const searchInput = document.getElementById('searchFilter');
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let selectedMonths = [];
    document.querySelectorAll('#monthCheckboxContainer input:checked').forEach(cb => {
        selectedMonths.push(cb.value);
    });

    if (!list) return;
    list.innerHTML = '';
    let gelir = 0;
    let gider = 0;

    const filteredTx = transactions.filter(tx => {
        const matchesMonth = selectedMonths.includes(tx.date);
        const matchesSearch = searchText === '' || tx.title.toLowerCase().includes(searchText);
        return matchesMonth && matchesSearch;
    });

    if (listCountEl) listCountEl.textContent = `${filteredTx.length} işlem`;

    if (filteredTx.length === 0) {
        list.innerHTML = '<p class="empty-text">Arama kriterine veya seçilen döneme ait işlem bulunamadı.</p>';
    } else {
        filteredTx.forEach(tx => {
            if (tx.type === 'gelir') gelir += tx.amount;
            else gider += tx.amount;

            const dateSource = tx.createdDate || (tx.date + "-01");
            const parts = dateSource.split('-');
            const pYear = parts[0];
            const pMonth = parts[1];
            const pDay = parts[2] || "01";
            
            const fullDateBadge = `${pDay} ${monthNames[parseInt(pMonth) - 1]} ${pYear}`;

            const li = document.createElement('li');
            li.className = `transaction-item ${tx.type}`;
            li.innerHTML = `
                <div class="item-info">
                    <span class="item-title">${tx.title}</span>
                    <span class="item-date">📅 ${fullDateBadge}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="item-amount ${tx.type}">${tx.type === 'gelir' ? '+' : '-'}${tx.amount.toLocaleString('tr-TR')} ₺</span>
                    <button class="edit-btn" onclick="editTransaction(${tx.id})" title="Düzenle">✏️</button>
                    <button class="delete-btn" onclick="deleteTransaction(${tx.id})" title="Sil">✕</button>
                </div>
            `;
            list.appendChild(li);
        });
    }

    const bakiye = gelir - gider;
    if (netBakiyeEl) {
        netBakiyeEl.textContent = `${bakiye.toLocaleString('tr-TR')} ₺`;
        netBakiyeEl.style.color = bakiye >= 0 ? '#4CD964' : '#FF3B30';
    }
    if (toplamGelirEl) toplamGelirEl.textContent = `+${gelir.toLocaleString('tr-TR')} ₺`;
    if (toplamGiderEl) toplamGiderEl.textContent = `-${gider.toLocaleString('tr-TR')} ₺`;

    localStorage.setItem('monthly_transactions', JSON.stringify(transactions));
}

function deleteTransaction(id) {
    transactions = transactions.filter(tx => tx.id !== id);
    initMonthSelectors();
    updateUI();
}

function exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cuzdanim_yedek_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                if (confirm("Bu yedeği yüklemek istediğinize emin misiniz? Mevcut verilerinizle birleştirilecektir.")) {
                    const combined = [...importedData, ...transactions];
                    const uniqueMap = new Map();
                    combined.forEach(item => uniqueMap.set(item.id, item));
                    transactions = Array.from(uniqueMap.values());
                    
                    transactions.sort((a, b) => {
                        const dateA = a.createdDate || (a.date + "-01");
                        const dateB = b.createdDate || (b.date + "-01");
                        return new Date(dateB) - new Date(dateA);
                    });
                    
                    initMonthSelectors();
                    updateUI();
                    alert("Yedek başarıyla yüklendi ve bütçeniz güncellendi!");
                }
            } else {
                alert("Hata: Geçersiz yedek dosyası formatı!");
            }
        } catch (error) {
            alert("Yedek dosyası okunurken bir hata oluştu.");
        }
    };
    reader.readAsText(file);
}