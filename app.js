// Configuration - Multiple fallback layers
// Priority: 1. window.CONFIG (from config.js) -> 2. Hardcoded default
const CONFIG = window.CONFIG || {
    PROXY_URL: 'https://proxyscore.mctran2005.workers.dev'
};

console.log('🚀 App starting with PROXY_URL:', CONFIG.PROXY_URL);

// State management
let allRecords = [];
let currentRecord = null;
let currentStudent = null;
let isEditMode = false;
let scoreColumns = ['Điểm giữa kỳ', 'Điểm cuối kỳ']; // Default columns

// DOM Elements - will be initialized after DOM loads
let cardsContainer, detailModal, studentModal, batchModal, searchInput;
let errorPopup, errorPopupMsg, errorPopupIcon, errorPopupClose, loadingPopup, loadingPopupMsg;
let confirmPopup, confirmPopupMsg, confirmPopupYes, confirmPopupNo;
let confirmCallback = null;

// Popup functions
function showErrorPopup(msg, isSuccess = false) {
    if (errorPopupMsg && errorPopup && errorPopupIcon) {
        errorPopupMsg.textContent = msg;
        if (isSuccess) {
            errorPopupIcon.textContent = '✅';
            errorPopupIcon.style.color = 'var(--secondary-color)';
            // Auto hide after 2 seconds for success messages
            setTimeout(() => {
                hideErrorPopup();
            }, 2000);
        } else {
            errorPopupIcon.textContent = '❌';
            errorPopupIcon.style.color = 'var(--danger-color)';
        }
        errorPopup.classList.add('active');
    }
}
function hideErrorPopup() {
    if (errorPopup) {
        errorPopup.classList.remove('active');
    }
}
function showLoadingPopup(msg) {
    if (loadingPopupMsg && loadingPopup) {
        loadingPopupMsg.textContent = msg || 'Đang xử lý...';
        loadingPopup.classList.add('active');
    }
}
function hideLoadingPopup() {
    if (loadingPopup) {
        loadingPopup.classList.remove('active');
    }
}

// Confirm popup with Promise
function showConfirmPopup(msg) {
    return new Promise((resolve) => {
        if (confirmPopupMsg && confirmPopup) {
            confirmPopupMsg.textContent = msg;
            confirmPopup.classList.add('active');
            
            confirmCallback = (result) => {
                confirmPopup.classList.remove('active');
                resolve(result);
            };
        } else {
            // Fallback to native confirm if popup not available
            resolve(confirm(msg));
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    cardsContainer = document.getElementById('cardsContainer');
    detailModal = document.getElementById('detailModal');
    studentModal = document.getElementById('studentModal');
    batchModal = document.getElementById('batchModal');
    searchInput = document.getElementById('searchInput');
    
    // Initialize popup elements
    errorPopup = document.getElementById('errorPopup');
    errorPopupMsg = document.getElementById('errorPopupMsg');
    errorPopupIcon = document.getElementById('errorPopupIcon');
    errorPopupClose = document.getElementById('errorPopupClose');
    loadingPopup = document.getElementById('loadingPopup');
    loadingPopupMsg = document.getElementById('loadingPopupMsg');
    confirmPopup = document.getElementById('confirmPopup');
    confirmPopupMsg = document.getElementById('confirmPopupMsg');
    confirmPopupYes = document.getElementById('confirmPopupYes');
    confirmPopupNo = document.getElementById('confirmPopupNo');
    
    // Setup popup close button
    if (errorPopupClose) {
        errorPopupClose.onclick = hideErrorPopup;
    }
    
    // Setup confirm buttons
    if (confirmPopupYes) {
        confirmPopupYes.onclick = () => {
            if (confirmCallback) confirmCallback(true);
        };
    }
    if (confirmPopupNo) {
        confirmPopupNo.onclick = () => {
            if (confirmCallback) confirmCallback(false);
        };
    }
    
    setupEventListeners();
    loadRecords();
});

// Event Listeners
function setupEventListeners() {
    // Add record button
    document.getElementById('addRecordBtn').addEventListener('click', () => {
        openRecordModal(null);
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadRecords();
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        filterRecords(e.target.value);
    });

    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Record modal buttons
    document.getElementById('saveBtn').addEventListener('click', saveRecord);
    document.getElementById('deleteBtn').addEventListener('click', deleteRecord);
    document.getElementById('cancelBtn').addEventListener('click', () => {
        detailModal.style.display = 'none';
    });

    // Add column button
    document.getElementById('addColumnBtn').addEventListener('click', addScoreColumn);

    // Add student button
    document.getElementById('addStudentBtn').addEventListener('click', () => {
        openStudentModal(null);
    });

    // Student modal buttons
    document.getElementById('saveStudentBtn').addEventListener('click', saveStudent);
    document.getElementById('cancelStudentBtn').addEventListener('click', () => {
        studentModal.style.display = 'none';
    });

    // Batch import buttons
    document.getElementById('batchImportBtn').addEventListener('click', () => {
        batchModal.style.display = 'block';
    });
    document.getElementById('processBatchBtn').addEventListener('click', processBatchImport);
    document.getElementById('cancelBatchBtn').addEventListener('click', () => {
        batchModal.style.display = 'none';
    });
}

// Load records from backend via proxy
async function loadRecords() {
    try {
        cardsContainer.innerHTML = `
            <div class="initial-loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">Đang tải dữ liệu...</div>
                <div class="loading-subtext">Vui lòng đợi trong giây lát</div>
            </div>
        `;
        
        console.log('🔍 Fetching from:', `${CONFIG.PROXY_URL}/records`);

        const response = await fetch(`${CONFIG.PROXY_URL}/records`);
        
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu');
        }
        
        const data = await response.json();
        console.log('📦 Received data:', data);
        
        allRecords = data.records || [];
        
        // Mark all records as existing in database
        allRecords.forEach(record => {
            record.existsInDatabase = true;
        });
        
        console.log('✅ Loaded', allRecords.length, 'records');
        
        displayCards(allRecords);
    } catch (error) {
        console.error('❌ Error loading records:', error);
        cardsContainer.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-title">Không thể tải dữ liệu</div>
                <div class="error-message">${error.message}</div>
                <div class="error-actions">
                    <button onclick="loadRecords()" class="btn-primary">🔄 Thử lại</button>
                    <a href="config-test.html" target="_blank" class="btn-secondary">🔧 Kiểm tra cấu hình</a>
                </div>
            </div>
        `;
    }
}

// Display cards
function displayCards(records) {
    console.log('🎨 displayCards called with:', records.length, 'records');
    
    if (!records || records.length === 0) {
        cardsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-title">Chưa có bản ghi nào</div>
                <div class="empty-message">Bắt đầu bằng cách thêm bản ghi mới hoặc import từ Excel</div>
                <div class="empty-actions">
                    <button onclick="document.getElementById('addRecordBtn').click()" class="btn-primary">
                        ➕ Thêm bản ghi mới
                    </button>
                    <button onclick="document.getElementById('importExcelBtn').click()" class="btn-secondary">
                        📊 Import Excel
                    </button>
                </div>
            </div>
        `;
        return;
    }

    const cardsHTML = records.map(record => {
        const studentCount = record.students ? record.students.length : 0;
        return `
        <div class="card" data-id="${record.id}" onclick="openRecordModalById('${record.id}')">
            <div class="card-title">${record.recordName || 'Chưa đặt tên'}</div>
            ${record.recordClass ? `<div class="card-class">${record.recordClass}</div>` : ''}
            <div class="card-class">${studentCount} học sinh</div>
            <div class="card-date">${formatDate(record.lastModified)}</div>
        </div>
    `;
    }).join('');
    
    cardsContainer.innerHTML = cardsHTML;
    console.log('✅ Cards rendered');
}

// Filter records
function filterRecords(searchTerm) {
    if (!searchTerm.trim()) {
        displayCards(allRecords);
        return;
    }

    const filtered = allRecords.filter(record => {
        const searchLower = searchTerm.toLowerCase();
        const matchRecord = (record.recordName || '').toLowerCase().includes(searchLower) ||
                           (record.recordClass || '').toLowerCase().includes(searchLower);
        
        // Search in students too
        const matchStudent = record.students && record.students.some(student =>
            (student.name || '').toLowerCase().includes(searchLower)
        );
        
        return matchRecord || matchStudent;
    });

    displayCards(filtered);
}

// Open record modal
function openRecordModalById(id) {
    const record = allRecords.find(r => r.id === id);
    openRecordModal(record);
}

function openRecordModal(record) {
    // Check if this is an edit of existing record (not null AND explicitly marked as existing)
    isEditMode = record !== null && record.existsInDatabase === true;
    currentRecord = record || {
        id: generateId(),
        recordName: '',
        recordClass: '',
        students: [],
        scoreColumns: ['Điểm giữa kỳ', 'Điểm cuối kỳ'],
        lastModified: new Date().toISOString()
    };

    // Set score columns from record or use default
    scoreColumns = currentRecord.scoreColumns || scoreColumns;

    // Fill form
    document.getElementById('modalTitle').textContent = 
        isEditMode ? 'Chỉnh sửa bản ghi' : 'Thêm bản ghi mới';
    document.getElementById('recordName').value = currentRecord.recordName || '';
    document.getElementById('recordClass').value = currentRecord.recordClass || '';
    document.getElementById('lastModified').textContent = formatDate(currentRecord.lastModified);
    document.getElementById('studentCount').textContent = currentRecord.students.length;

    // Render students table
    renderStudentsTable();

    // Show/hide delete button
    document.getElementById('deleteBtn').style.display = isEditMode ? 'block' : 'none';

    detailModal.style.display = 'block';
}

// Render students table
function renderStudentsTable() {
    const studentsTable = document.getElementById('studentsTable');
    const students = currentRecord.students || [];

    if (students.length === 0) {
        studentsTable.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Chưa có học sinh. Nhấn "Thêm học sinh" hoặc "Import hàng loạt".</p>';
        return;
    }

    let tableHTML = `
        <div class="students-table-wrapper">
            <table class="students-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>Họ và tên</th>
    `;

    // Add score column headers
    scoreColumns.forEach(col => {
        tableHTML += `<th>${col} <button class="btn-icon delete" onclick="removeScoreColumn('${col}')" title="Xóa cột">×</button></th>`;
    });

    tableHTML += `
                        <th style="width: 100px;">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Add student rows
    students.forEach((student, index) => {
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.name}</td>
        `;

        // Add score inputs
        scoreColumns.forEach(col => {
            const score = student.scores[col] || '';
            tableHTML += `
                <td>
                    <input type="number" 
                           step="0.1" 
                           min="0" 
                           max="10"
                           value="${score}"
                           data-student-index="${index}"
                           data-column="${col}"
                           onchange="updateStudentScore(${index}, '${col}', this.value)"
                           placeholder="0-10">
                </td>
            `;
        });

        tableHTML += `
                <td class="student-actions">
                    <button class="btn-icon edit" onclick="openStudentModal(${index})" title="Sửa">✏️</button>
                    <button class="btn-icon delete" onclick="deleteStudent(${index})" title="Xóa">🗑️</button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    studentsTable.innerHTML = tableHTML;
}

// Update student score
function updateStudentScore(studentIndex, column, value) {
    if (!currentRecord.students[studentIndex].scores) {
        currentRecord.students[studentIndex].scores = {};
    }
    currentRecord.students[studentIndex].scores[column] = value;
    console.log('Updated score:', studentIndex, column, value);
}

// Add score column
function addScoreColumn() {
    const columnName = prompt('Nhập tên cột điểm:', 'Điểm thực hành');
    if (!columnName || !columnName.trim()) return;

    const trimmedName = columnName.trim();
    if (scoreColumns.includes(trimmedName)) {
        showErrorPopup('Cột này đã tồn tại!');
        return;
    }

    scoreColumns.push(trimmedName);
    currentRecord.scoreColumns = scoreColumns;
    renderStudentsTable();
}

// Remove score column
async function removeScoreColumn(columnName) {
    const confirmed = await showConfirmPopup(`Xóa cột "${columnName}"?`);
    if (!confirmed) return;

    scoreColumns = scoreColumns.filter(col => col !== columnName);
    currentRecord.scoreColumns = scoreColumns;

    // Remove scores in this column from all students
    currentRecord.students.forEach(student => {
        if (student.scores) {
            delete student.scores[columnName];
        }
    });

    renderStudentsTable();
}

// Open student modal
function openStudentModal(studentIndex) {
    const isEdit = studentIndex !== null && studentIndex !== undefined;
    currentStudent = isEdit ? { index: studentIndex, ...currentRecord.students[studentIndex] } : null;

    document.getElementById('studentModalTitle').textContent = 
        isEdit ? 'Chỉnh sửa học sinh' : 'Thêm học sinh';
    
    // Fill name
    document.getElementById('studentName').value = isEdit ? currentStudent.name : '';

    // Render score inputs
    let scoresHTML = '<div class="scores-grid">';
    scoreColumns.forEach(col => {
        const score = isEdit && currentStudent.scores ? (currentStudent.scores[col] || '') : '';
        scoresHTML += `
            <div class="score-item">
                <label>${col}:</label>
                <input type="number" 
                       step="0.1" 
                       min="0" 
                       max="10"
                       value="${score}"
                       data-column="${col}"
                       class="student-score-input"
                       placeholder="0-10">
            </div>
        `;
    });
    scoresHTML += '</div>';

    document.getElementById('studentScores').innerHTML = scoresHTML;
    studentModal.style.display = 'block';
}

// Save student
function saveStudent() {
    const name = document.getElementById('studentName').value.trim();
    if (!name) {
        showErrorPopup('Vui lòng nhập tên học sinh');
        return;
    }

    // Collect scores
    const scores = {};
    document.querySelectorAll('.student-score-input').forEach(input => {
        const column = input.dataset.column;
        const value = input.value;
        if (value) {
            scores[column] = value;
        }
    });

    if (currentStudent && currentStudent.index !== undefined) {
        // Edit existing student
        currentRecord.students[currentStudent.index] = { name, scores };
    } else {
        // Add new student
        currentRecord.students.push({ name, scores });
    }

    document.getElementById('studentCount').textContent = currentRecord.students.length;
    renderStudentsTable();
    studentModal.style.display = 'none';
}

// Delete student
async function deleteStudent(index) {
    const confirmed = await showConfirmPopup('Xóa học sinh này?');
    if (!confirmed) return;

    currentRecord.students.splice(index, 1);
    document.getElementById('studentCount').textContent = currentRecord.students.length;
    renderStudentsTable();
}

// Batch import
function processBatchImport() {
    const data = document.getElementById('batchData').value.trim();
    if (!data) {
        showErrorPopup('Vui lòng nhập dữ liệu');
        return;
    }

    const lines = data.split('\n');
    let imported = 0;

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        const parts = line.split(',').map(p => p.trim());
        if (parts.length === 0) return;

        const name = parts[0];
        const scores = {};

        // Map scores to columns
        for (let i = 1; i < parts.length && i - 1 < scoreColumns.length; i++) {
            const column = scoreColumns[i - 1];
            scores[column] = parts[i];
        }

        currentRecord.students.push({ name, scores });
        imported++;
    });

    showErrorPopup(`Đã import ${imported} học sinh`, true);
    document.getElementById('batchData').value = '';
    document.getElementById('studentCount').textContent = currentRecord.students.length;
    renderStudentsTable();
    batchModal.style.display = 'none';
}

// Save record
async function saveRecord() {
    try {
        // Validate
        const recordName = document.getElementById('recordName').value.trim();
        if (!recordName) {
            showErrorPopup('Vui lòng nhập tên bản ghi');
            return;
        }

        showLoadingPopup('Đang lưu bản ghi...');

        // Update current record
        currentRecord.recordName = recordName;
        currentRecord.recordClass = document.getElementById('recordClass').value.trim();
        currentRecord.scoreColumns = scoreColumns;
        currentRecord.lastModified = new Date().toISOString();

        // Remove internal flag before sending to server
        const recordToSave = { ...currentRecord };
        delete recordToSave.existsInDatabase;

        console.log('💾 Saving record:', recordToSave);
        console.log('📤 Method:', isEditMode ? 'PUT' : 'POST');
        console.log('🔑 Edit mode:', isEditMode);

        // Save to backend
        const response = await fetch(`${CONFIG.PROXY_URL}/records`, {
            method: isEditMode ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recordToSave)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Save error:', errorText);
            hideLoadingPopup();
            showErrorPopup('Không thể lưu dữ liệu');
            return;
        }

        console.log('✅ Save successful!');

        // Reload records
        await loadRecords();
        detailModal.style.display = 'none';
        hideLoadingPopup();
        showErrorPopup('Lưu thành công!', true);
    } catch (error) {
        console.error('❌ Error saving record:', error);
        hideLoadingPopup();
        showErrorPopup('Lỗi: ' + error.message);
    }
}

// Delete record
async function deleteRecord() {
    showLoadingPopup('Đang xóa bản ghi...');
    try {
        const response = await fetch(`${CONFIG.PROXY_URL}/records/${currentRecord.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            hideLoadingPopup();
            showErrorPopup('Không thể xóa dữ liệu');
            return;
        }

        await loadRecords();
        detailModal.style.display = 'none';
        hideLoadingPopup();
        showErrorPopup('Xóa thành công!', true);
    } catch (error) {
        console.error('Error deleting record:', error);
        hideLoadingPopup();
        showErrorPopup('Lỗi: ' + error.message);
    }
}

// Utility functions
function generateId() {
    return 'record_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
}

// ============================================
// EXCEL IMPORT FUNCTIONALITY
// ============================================

let excelWorkbook = null;
let excelData = null;
let detectedMapping = {
    nameColumn: null,
    classColumn: null,
    scoreColumns: []
};

// Setup Excel Import Event Listeners
function setupExcelImportListeners() {
    const importExcelBtn = document.getElementById('importExcelBtn');
    const excelModal = document.getElementById('excelModal');
    const cancelExcelBtn = document.getElementById('cancelExcelBtn');
    const excelFileInput = document.getElementById('excelFileInput');
    const uploadArea = document.getElementById('uploadArea');
    const sheetSelector = document.getElementById('sheetSelector');
    const importExcelDataBtn = document.getElementById('importExcelDataBtn');

    // Open modal
    importExcelBtn.addEventListener('click', () => {
        excelModal.style.display = 'block';
        resetExcelModal();
    });

    // Close modal
    cancelExcelBtn.addEventListener('click', () => {
        excelModal.style.display = 'none';
        resetExcelModal();
    });

    // File input change
    excelFileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            processExcelFile(file);
        }
    });

    // Sheet selector change
    sheetSelector.addEventListener('change', (e) => {
        displaySheetData(e.target.value);
    });

    // Import button
    importExcelDataBtn.addEventListener('click', importExcelData);

    // Mapping selectors
    document.getElementById('nameColumnMap').addEventListener('change', updateMapping);
    document.getElementById('classColumnMap').addEventListener('change', updateMapping);
}

function resetExcelModal() {
    excelWorkbook = null;
    excelData = null;
    detectedMapping = { nameColumn: null, classColumn: null, scoreColumns: [] };
    
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('mappingSection').style.display = 'none';
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('importExcelDataBtn').style.display = 'none';
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processExcelFile(file);
    }
}

function processExcelFile(file) {
    console.log('📊 Processing file:', file.name);
    
    // Show file info
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileInfo').style.display = 'block';

    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            excelWorkbook = XLSX.read(data, { type: 'array' });
            
            console.log('✅ Workbook loaded:', excelWorkbook.SheetNames);
            
            // Populate sheet selector
            const sheetSelector = document.getElementById('sheetSelector');
            sheetSelector.innerHTML = '';
            excelWorkbook.SheetNames.forEach(sheetName => {
                const option = document.createElement('option');
                option.value = sheetName;
                option.textContent = sheetName;
                sheetSelector.appendChild(option);
            });
            
            // Display first sheet
            displaySheetData(excelWorkbook.SheetNames[0]);
            
        } catch (error) {
            console.error('❌ Error reading Excel:', error);
            showErrorPopup('Lỗi đọc file Excel: ' + error.message);
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function displaySheetData(sheetName) {
    console.log('📋 Displaying sheet:', sheetName);
    
    const worksheet = excelWorkbook.Sheets[sheetName];
    excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('📊 Data rows:', excelData.length);
    
    if (excelData.length === 0) {
        showErrorPopup('Sheet trống!');
        return;
    }
    
    // Show preview
    displayPreviewTable(excelData);
    
    // Auto-detect columns
    autoDetectColumns(excelData);
    
    // Show sections
    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('mappingSection').style.display = 'block';
    document.getElementById('summarySection').style.display = 'block';
    document.getElementById('importExcelDataBtn').style.display = 'inline-flex';
}

function displayPreviewTable(data) {
    const previewTable = document.getElementById('previewTable');
    
    if (data.length === 0) return;
    
    let html = '<table class="preview-table"><thead><tr>';
    
    // Header row
    const headers = data[0];
    headers.forEach((header, idx) => {
        html += `<th>${header || 'Cột ' + (idx + 1)}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Data rows (show first 10)
    const maxRows = Math.min(10, data.length - 1);
    for (let i = 1; i <= maxRows; i++) {
        html += '<tr>';
        data[i].forEach(cell => {
            html += `<td>${cell !== undefined ? cell : ''}</td>`;
        });
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    
    if (data.length > 11) {
        html += `<p style="text-align: center; color: var(--text-secondary); margin-top: 10px;">
            ... và ${data.length - 11} dòng khác</p>`;
    }
    
    previewTable.innerHTML = html;
}

function autoDetectColumns(data) {
    console.log('🔍 Auto-detecting columns...');
    
    if (data.length < 2) {
        console.log('⚠️ Not enough data');
        return;
    }
    
    const headers = data[0].map((h, i) => ({
        index: i,
        name: String(h || `Cột ${i + 1}`).toLowerCase().trim()
    }));
    
    console.log('📌 Headers:', headers);
    
    // Detect name column (tên, họ tên, học sinh, name, student)
    const nameKeywords = ['tên', 'họ tên', 'học sinh', 'name', 'student', 'họ và tên'];
    detectedMapping.nameColumn = headers.find(h => 
        nameKeywords.some(kw => h.name.includes(kw))
    )?.index;
    
    // Detect class column (lớp, class)
    const classKeywords = ['lớp', 'class', 'nhóm', 'group'];
    detectedMapping.classColumn = headers.find(h => 
        classKeywords.some(kw => h.name.includes(kw))
    )?.index;
    
    // Detect score columns (điểm, score, test, kiểm tra, đ, numbers)
    const scoreKeywords = ['điểm', 'score', 'test', 'kiểm tra', 'bài', 'kỳ'];
    detectedMapping.scoreColumns = headers
        .filter((h, idx) => {
            // Check if column name contains score keywords
            const hasKeyword = scoreKeywords.some(kw => h.name.includes(kw));
            
            // Or check if most values in column are numbers
            const isNumeric = checkIfNumericColumn(data, idx);
            
            return hasKeyword || isNumeric;
        })
        .filter(h => h.index !== detectedMapping.nameColumn && h.index !== detectedMapping.classColumn)
        .map(h => h.index);
    
    console.log('✅ Detected mapping:', detectedMapping);
    
    // Populate mapping selectors
    populateMappingSelectors(headers);
    updateSummary(data);
}

function checkIfNumericColumn(data, colIndex) {
    if (data.length < 3) return false;
    
    let numericCount = 0;
    const checkRows = Math.min(10, data.length - 1);
    
    for (let i = 1; i <= checkRows; i++) {
        const value = data[i][colIndex];
        if (value !== undefined && value !== null && value !== '') {
            const num = parseFloat(String(value).replace(',', '.'));
            if (!isNaN(num) && num >= 0 && num <= 100) {
                numericCount++;
            }
        }
    }
    
    return numericCount / checkRows > 0.6; // 60% numeric = score column
}

function populateMappingSelectors(headers) {
    const nameSelect = document.getElementById('nameColumnMap');
    const classSelect = document.getElementById('classColumnMap');
    const scoreColumnsDiv = document.getElementById('scoreColumnsMap');
    
    // Populate name selector
    nameSelect.innerHTML = '';
    headers.forEach(h => {
        const option = document.createElement('option');
        option.value = h.index;
        option.textContent = excelData[0][h.index] || `Cột ${h.index + 1}`;
        if (h.index === detectedMapping.nameColumn) {
            option.selected = true;
        }
        nameSelect.appendChild(option);
    });
    
    // Populate class selector
    classSelect.innerHTML = '<option value="">-- Không có --</option>';
    headers.forEach(h => {
        const option = document.createElement('option');
        option.value = h.index;
        option.textContent = excelData[0][h.index] || `Cột ${h.index + 1}`;
        if (h.index === detectedMapping.classColumn) {
            option.selected = true;
        }
        classSelect.appendChild(option);
    });
    
    // Populate score columns checkboxes
    scoreColumnsDiv.innerHTML = '';
    headers.forEach(h => {
        if (h.index !== detectedMapping.nameColumn && h.index !== detectedMapping.classColumn) {
            const chip = document.createElement('div');
            chip.className = 'score-column-chip';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = h.index;
            checkbox.id = `scoreCol_${h.index}`;
            checkbox.checked = detectedMapping.scoreColumns.includes(h.index);
            checkbox.addEventListener('change', updateMapping);
            
            const label = document.createElement('label');
            label.htmlFor = `scoreCol_${h.index}`;
            label.textContent = excelData[0][h.index] || `Cột ${h.index + 1}`;
            label.style.cursor = 'pointer';
            
            chip.appendChild(checkbox);
            chip.appendChild(label);
            scoreColumnsDiv.appendChild(chip);
        }
    });
}

function updateMapping() {
    detectedMapping.nameColumn = parseInt(document.getElementById('nameColumnMap').value);
    
    const classValue = document.getElementById('classColumnMap').value;
    detectedMapping.classColumn = classValue ? parseInt(classValue) : null;
    
    detectedMapping.scoreColumns = Array.from(document.querySelectorAll('#scoreColumnsMap input[type="checkbox"]:checked'))
        .map(cb => parseInt(cb.value));
    
    console.log('🔄 Updated mapping:', detectedMapping);
    updateSummary(excelData);
}

function updateSummary(data) {
    const totalStudents = data.length - 1; // Exclude header
    const totalScores = detectedMapping.scoreColumns.length;
    
    // Detect class from data if class column exists
    let detectedClass = '-';
    if (detectedMapping.classColumn !== null && data.length > 1) {
        const classValues = data.slice(1)
            .map(row => row[detectedMapping.classColumn])
            .filter(v => v);
        
        // Get most common class
        const classCounts = {};
        classValues.forEach(c => {
            classCounts[c] = (classCounts[c] || 0) + 1;
        });
        
        if (Object.keys(classCounts).length > 0) {
            detectedClass = Object.keys(classCounts).reduce((a, b) => 
                classCounts[a] > classCounts[b] ? a : b
            );
        }
    }
    
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('totalScores').textContent = totalScores;
    document.getElementById('detectedClass').textContent = detectedClass;
}

function importExcelData() {
    console.log('📥 Importing Excel data...');
    
    if (!excelData || excelData.length < 2) {
        showErrorPopup('Không có dữ liệu để import!');
        return;
    }
    
    if (detectedMapping.nameColumn === null) {
        showErrorPopup('Vui lòng chọn cột tên học sinh!');
        return;
    }
    
    if (detectedMapping.scoreColumns.length === 0) {
        showErrorPopup('Vui lòng chọn ít nhất 1 cột điểm!');
        return;
    }
    
    try {
        // Build students array - Keep original Excel column names
        const students = [];
        const scoreColumnNames = detectedMapping.scoreColumns.map(idx => {
            const originalName = excelData[0][idx];
            return originalName ? String(originalName).trim() : `Điểm ${idx + 1}`;
        });
        
        for (let i = 1; i < excelData.length; i++) {
            const row = excelData[i];
            const studentName = row[detectedMapping.nameColumn];
            
            if (!studentName || String(studentName).trim() === '') continue;
            
            const scores = {};
            detectedMapping.scoreColumns.forEach((colIdx, idx) => {
                const scoreValue = row[colIdx];
                const columnName = scoreColumnNames[idx];
                
                // Round score to 2 decimal places if it's a number
                let processedScore = '';
                if (scoreValue !== undefined && scoreValue !== null && scoreValue !== '') {
                    const numValue = parseFloat(scoreValue);
                    if (!isNaN(numValue)) {
                        processedScore = String(Math.round(numValue * 100) / 100);
                    } else {
                        processedScore = String(scoreValue);
                    }
                }
                
                scores[columnName] = processedScore;
            });
            
            students.push({
                name: String(studentName).trim(),
                scores: scores
            });
        }
        
        console.log('✅ Parsed students:', students);
        
        // Detect class name
        let className = '';
        if (detectedMapping.classColumn !== null && excelData.length > 1) {
            const classValues = excelData.slice(1)
                .map(row => row[detectedMapping.classColumn])
                .filter(v => v);
            
            if (classValues.length > 0) {
                const classCounts = {};
                classValues.forEach(c => {
                    classCounts[c] = (classCounts[c] || 0) + 1;
                });
                className = Object.keys(classCounts).reduce((a, b) => 
                    classCounts[a] > classCounts[b] ? a : b
                );
            }
        }
        
        // Create new record
        const sheetName = document.getElementById('sheetSelector').value;
        const fileName = document.getElementById('fileName').textContent;
        
        const newRecord = {
            id: generateId(),
            recordName: `${fileName} - ${sheetName}`,
            recordClass: className || 'Import từ Excel',
            students: students,
            scoreColumns: scoreColumnNames,
            lastModified: new Date().toISOString(),
            existsInDatabase: false // Mark as new record from Excel import
        };
        
        console.log('📦 New record:', newRecord);
        
        // Open detail modal with imported data
        document.getElementById('excelModal').style.display = 'none';
        openRecordModal(newRecord);
        
        showErrorPopup(`✅ Import thành công ${students.length} học sinh với ${scoreColumnNames.length} cột điểm!\n\nVui lòng kiểm tra và nhấn "Lưu bản ghi" để lưu vào hệ thống.`, true);
        
    } catch (error) {
        console.error('❌ Import error:', error);
        showErrorPopup('Lỗi khi import dữ liệu: ' + error.message);
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Add Excel import listeners to setup
const originalSetupEventListeners = setupEventListeners;
setupEventListeners = function() {
    originalSetupEventListeners();
    setupExcelImportListeners();
};
