let transactions = JSON.parse(localStorage.getItem('monthly_transactions')) || [
    { id: 1, title: 'Kasım Maaşı', amount: 25000, type: 'gelir', date: '2026-11', createdDate: '2026-11-01' },
    { id: 2, title: 'Aylık Market', amount: 1500, type: 'gider', date: '2026-11', createdDate: '2026-11-01' }
];

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
        title.textContent = "İlk Kurulum";
        desc.textContent = "Uygulamanız için yeni bir giriş şifresi belirleyin.";
        btn.textContent = "Şifreyi Kaydet";
    }
}

function checkPassword() {
    const input = document.getElementById('passwordInput').value;
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
            errorEl.style.display = 'block';
            document.getElementById('passwordInput').value = '';
        }
    }
}

function unlockApp() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('appContainer').classList.add('show');
    initMonthSelectors();
    updateUI();
}

document.getElementById('passwordInput').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') checkPassword();
});

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
    
    if (box.style.display === 'flex') {
        box.style.display = 'none';
        dateInput.value = '';
    } else {
        box.style.display = 'flex';
        // Açıldığında varsayılan olarak bugünün tarihini doldur
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

    const savedTargetSelection = targetMonthSelect ? targetMonthSelect.value : null;
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

    list.innerHTML = '';
    let gelir = 0;
    let gider = 0;

    const filteredTx = transactions.filter(tx => {
        const matchesMonth = selectedMonths.includes(tx.date);
        const matchesSearch = searchText === '' || tx.title.toLowerCase().includes(searchText);
        return matchesMonth && matchesSearch;
    });

    listCountEl.textContent = `${filteredTx.length} işlem`;

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
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="item-amount ${tx.type}">${tx.type === 'gelir' ? '+' : '-'}${tx.amount.toLocaleString('tr-TR')} ₺</span>
                    <button class="delete-btn" onclick="deleteTransaction(${tx.id})">✕</button>
                </div>
            `;
            list.appendChild(li);
        });
    }

    const bakiye = gelir - gider;
    netBakiyeEl.textContent = `${bakiye.toLocaleString('tr-TR')} ₺`;
    netBakiyeEl.style.color = bakiye >= 0 ? '#4CD964' : '#FF3B30';
    toplamGelirEl.textContent = `+${gelir.toLocaleString('tr-TR')} ₺`;
    toplamGiderEl.textContent = `-${gider.toLocaleString('tr-TR')} ₺`;

    localStorage.setItem('monthly_transactions', JSON.stringify(transactions));
}

function addTransaction() {
    const titleInp = document.getElementById('txTitle');
    const amountInp = document.getElementById('txAmount');
    const typeInp = document.getElementById('txType');
    const targetMonthSelect = document.getElementById('txTargetMonth');
    const customDateInp = document.getElementById('txCustomDate');

    if (!titleInp.value.trim() || !amountInp.value || !targetMonthSelect.value) return;

    // Özel bir tarih seçilmişse onu, seçilmemişse bugünün tarihini al
    let selectedDate;
    if (customDateInp && customDateInp.value) {
        selectedDate = customDateInp.value; // "YYYY-AA-GG"
    } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        selectedDate = `${year}-${month}-${day}`;
    }

    // Seçilen tarihin yıl-ay bilgisinden tx.date türet
    const [sYear, sMonth] = selectedDate.split('-');
    const derivedMonth = `${sYear}-${sMonth}`;

    const newTx = {
        id: Date.now(),
        title: titleInp.value,
        amount: parseFloat(amountInp.value),
        type: typeInp.value,
        date: derivedMonth,        
        createdDate: selectedDate 
    };

    transactions.unshift(newTx);
    titleInp.value = '';
    amountInp.value = '';
    
    // Özel tarih kutusu açıksa temizle ve gizle
    if (customDateInp) customDateInp.value = '';
    document.getElementById('customDateBox').style.display = 'none';

    initMonthSelectors();
    updateUI();
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

checkPasswordSetup();