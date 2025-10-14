// Configuration loaded from config.js
// const CONFIG = { PROXY_URL: '...' }

// State management
let allRecords = [];
let currentRecord = null;
let currentStudent = null;
let isEditMode = false;
let scoreColumns = ['Điểm giữa kỳ', 'Điểm cuối kỳ']; // Default columns

// DOM Elements
const cardsContainer = document.getElementById('cardsContainer');
const detailModal = document.getElementById('detailModal');
const studentModal = document.getElementById('studentModal');
const batchModal = document.getElementById('batchModal');
const searchInput = document.getElementById('searchInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
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
        cardsContainer.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';
        
        console.log('🔍 Fetching from:', `${CONFIG.PROXY_URL}/records`);
        const response = await fetch(`${CONFIG.PROXY_URL}/records`);
        
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu');
        }
        
        const data = await response.json();
        console.log('📦 Received data:', data);
        
        allRecords = data.records || [];
        console.log('✅ Loaded', allRecords.length, 'records');
        
        displayCards(allRecords);
    } catch (error) {
        console.error('❌ Error loading records:', error);
        cardsContainer.innerHTML = `
            <div class="error-message">
                <strong>Lỗi:</strong> ${error.message}
                <br><small>Vui lòng kiểm tra cấu hình và thử lại.</small>
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
                <h3>Chưa có dữ liệu</h3>
                <p>Nhấn "Thêm bản ghi mới" để bắt đầu</p>
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
    isEditMode = record !== null;
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
        alert('Cột này đã tồn tại!');
        return;
    }

    scoreColumns.push(trimmedName);
    currentRecord.scoreColumns = scoreColumns;
    renderStudentsTable();
}

// Remove score column
function removeScoreColumn(columnName) {
    if (!confirm(`Xóa cột "${columnName}"?`)) return;

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
        alert('Vui lòng nhập tên học sinh');
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
function deleteStudent(index) {
    if (!confirm('Xóa học sinh này?')) return;

    currentRecord.students.splice(index, 1);
    document.getElementById('studentCount').textContent = currentRecord.students.length;
    renderStudentsTable();
}

// Batch import
function processBatchImport() {
    const data = document.getElementById('batchData').value.trim();
    if (!data) {
        alert('Vui lòng nhập dữ liệu');
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

    alert(`Đã import ${imported} học sinh`);
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
            alert('Vui lòng nhập tên bản ghi');
            return;
        }

        // Update current record
        currentRecord.recordName = recordName;
        currentRecord.recordClass = document.getElementById('recordClass').value.trim();
        currentRecord.scoreColumns = scoreColumns;
        currentRecord.lastModified = new Date().toISOString();

        // Save to backend
        const response = await fetch(`${CONFIG.PROXY_URL}/records`, {
            method: isEditMode ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentRecord)
        });

        if (!response.ok) {
            throw new Error('Không thể lưu dữ liệu');
        }

        // Reload records
        await loadRecords();
        detailModal.style.display = 'none';
        
        alert('Lưu thành công!');
    } catch (error) {
        console.error('Error saving record:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Delete record
async function deleteRecord() {
    if (!confirm('Bạn có chắc muốn xóa bản ghi này? Tất cả học sinh trong bản ghi sẽ bị xóa.')) {
        return;
    }

    try {
        const response = await fetch(`${CONFIG.PROXY_URL}/records/${currentRecord.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Không thể xóa dữ liệu');
        }

        await loadRecords();
        detailModal.style.display = 'none';
        
        alert('Xóa thành công!');
    } catch (error) {
        console.error('Error deleting record:', error);
        alert('Lỗi: ' + error.message);
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
