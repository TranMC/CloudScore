// ============================================
// CONFIGURATION - Centralized in app.js
// ============================================
const CONFIG = {
    PROXY_URL: 'https://proxyscore.mctran2005.workers.dev'
};

console.log('🚀 App starting with PROXY_URL:', CONFIG.PROXY_URL);

// State management
let allRecords = [];
let currentRecord = null;
let currentStudent = null;
let isEditMode = false;
let scoreColumns = ['Điểm giữa kỳ', 'Điểm cuối kỳ']; // Default columns
let visibleColumns = []; // Track visible columns (empty means all visible)
let autoSaveTimer = null;
let hasUnsavedChanges = false;
let isStatsCollapsed = false;

// DOM Elements - will be initialized after DOM loads
let cardsContainer, detailModal, studentModal, batchModal, searchInput;
let errorPopup, errorPopupMsg, errorPopupIcon, errorPopupClose, loadingPopup, loadingPopupMsg;
let confirmPopup, confirmPopupMsg, confirmPopupYes, confirmPopupNo;
let columnVisibilityModal, columnCheckboxList;
let columnModal, columnNameInput, columnModalTitle, columnModalIcon, columnModalTitleText;
let oldColumnInfo, oldColumnName, columnNameError, confirmColumnAction, confirmColumnText, confirmColumnIcon;
let saveStatusElement, toggleStatsBtn, toggleStatsIcon, statsContent;
let currentEditingColumn = null; // Track if we're editing or adding
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
    
    // Initialize column visibility modal elements
    columnVisibilityModal = document.getElementById('columnVisibilityModal');
    columnCheckboxList = document.getElementById('columnCheckboxList');
    
    // Initialize column modal elements
    columnModal = document.getElementById('columnModal');
    columnNameInput = document.getElementById('columnNameInput');
    columnModalTitle = document.getElementById('columnModalTitle');
    columnModalIcon = document.getElementById('columnModalIcon');
    columnModalTitleText = document.getElementById('columnModalTitleText');
    oldColumnInfo = document.getElementById('oldColumnInfo');
    oldColumnName = document.getElementById('oldColumnName');
    columnNameError = document.getElementById('columnNameError');
    confirmColumnAction = document.getElementById('confirmColumnAction');
    confirmColumnText = document.getElementById('confirmColumnText');
    confirmColumnIcon = document.getElementById('confirmColumnIcon');
    
    // Initialize auto-save status
    saveStatusElement = document.getElementById('saveStatus');
    
    // Initialize statistics toggle
    toggleStatsBtn = document.getElementById('toggleStatsBtn');
    toggleStatsIcon = document.getElementById('toggleStatsIcon');
    statsContent = document.getElementById('statsContent');
    
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
    
    // Statistics toggle
    if (toggleStatsBtn) {
        toggleStatsBtn.addEventListener('click', toggleStatistics);
    }
    
    setupEventListeners();
    loadRecords();
    
    // Load auto-save draft if exists
    loadAutoSaveDraft();
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
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    document.getElementById('exportPdfBtn').addEventListener('click', exportToPdf);
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

    // Student search/filter controls
    const studentSearchInput = document.getElementById('studentSearchInput');
    const columnVisibilityBtn = document.getElementById('columnVisibilityBtn');
    const filterByScore = document.getElementById('filterByScore');
    const filterColumn = document.getElementById('filterColumn');

    if (studentSearchInput) {
        studentSearchInput.addEventListener('input', () => {
            renderStudentsTable();
        });
    }

    if (columnVisibilityBtn) {
        columnVisibilityBtn.addEventListener('click', toggleColumnVisibility);
    }

    if (filterByScore) {
        filterByScore.addEventListener('change', () => {
            const filterColumnSelect = document.getElementById('filterColumn');
            if (filterByScore.value === 'all') {
                filterColumnSelect.style.display = 'none';
            } else {
                filterColumnSelect.style.display = 'inline-block';
                // Populate column dropdown
                populateFilterColumnDropdown();
            }
            renderStudentsTable();
        });
    }

    if (filterColumn) {
        filterColumn.addEventListener('change', () => {
            renderStudentsTable();
        });
    }

    // Filter by score range
    const filterByRange = document.getElementById('filterByRange');
    if (filterByRange) {
        filterByRange.addEventListener('change', () => {
            renderStudentsTable();
        });
    }
    
    // Column visibility modal controls
    const selectAllColumns = document.getElementById('selectAllColumns');
    const deselectAllColumns = document.getElementById('deselectAllColumns');
    const applyColumnVisibility = document.getElementById('applyColumnVisibility');
    const cancelColumnVisibility = document.getElementById('cancelColumnVisibility');
    
    if (selectAllColumns) {
        selectAllColumns.addEventListener('click', () => {
            document.querySelectorAll('#columnCheckboxList input[type="checkbox"]').forEach(cb => {
                cb.checked = true;
                cb.closest('.column-checkbox-item').classList.add('checked');
            });
        });
    }
    
    if (deselectAllColumns) {
        deselectAllColumns.addEventListener('click', () => {
            document.querySelectorAll('#columnCheckboxList input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
                cb.closest('.column-checkbox-item').classList.remove('checked');
            });
        });
    }
    
    if (applyColumnVisibility) {
        applyColumnVisibility.addEventListener('click', applyColumnVisibilityChanges);
    }
    
    if (cancelColumnVisibility) {
        cancelColumnVisibility.addEventListener('click', () => {
            columnVisibilityModal.style.display = 'none';
        });
    }
    
    // Column modal controls
    const cancelColumnAction = document.getElementById('cancelColumnAction');
    
    if (confirmColumnAction) {
        confirmColumnAction.addEventListener('click', handleColumnAction);
    }
    
    if (cancelColumnAction) {
        cancelColumnAction.addEventListener('click', () => {
            columnModal.style.display = 'none';
            currentEditingColumn = null;
        });
    }
    
    if (columnNameInput) {
        // Clear error on input
        columnNameInput.addEventListener('input', () => {
            columnNameInput.classList.remove('error');
            columnNameError.style.display = 'none';
        });
        
        // Submit on Enter key
        columnNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleColumnAction();
            }
        });
    }
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
        const visibilityBadge = record.isPublic 
            ? '<span class="visibility-badge public">🌐 Công khai</span>' 
            : '<span class="visibility-badge private">🔒 Riêng tư</span>';
        return `
        <div class="card" data-id="${record.id}" onclick="openRecordModalById('${record.id}')">
            <div class="card-header-section">
                <div class="card-title">${record.recordName || 'Chưa đặt tên'}</div>
                ${visibilityBadge}
            </div>
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
        lastModified: new Date().toISOString(),
        isPublic: false // Mặc định là riêng tư
    };

    // Set score columns from record or use default
    scoreColumns = currentRecord.scoreColumns || scoreColumns;
    
    // Reset filters and column visibility
    visibleColumns = [];
    const studentSearchInput = document.getElementById('studentSearchInput');
    const filterByScore = document.getElementById('filterByScore');
    const filterColumn = document.getElementById('filterColumn');
    
    if (studentSearchInput) studentSearchInput.value = '';
    if (filterByScore) filterByScore.value = 'all';
    if (filterColumn) {
        filterColumn.value = '';
        filterColumn.style.display = 'none';
    }

    // Fill form
    document.getElementById('modalTitle').textContent = 
        isEditMode ? 'Chỉnh sửa bản ghi' : 'Thêm bản ghi mới';
    document.getElementById('recordName').value = currentRecord.recordName || '';
    document.getElementById('recordClass').value = currentRecord.recordClass || '';
    document.getElementById('lastModified').textContent = formatDate(currentRecord.lastModified);
    document.getElementById('studentCount').textContent = currentRecord.students.length;
    
    // Set visibility toggle
    const isPublicToggle = document.getElementById('isPublicToggle');
    if (isPublicToggle) {
        isPublicToggle.checked = currentRecord.isPublic === true;
    }

    // Render students table
    renderStudentsTable();

    // Show/hide delete button
    document.getElementById('deleteBtn').style.display = isEditMode ? 'block' : 'none';

    detailModal.style.display = 'block';
}

// Filter students based on search and filter criteria
function getFilteredStudents() {
    const students = currentRecord.students || [];
    const searchTerm = document.getElementById('studentSearchInput')?.value.toLowerCase().trim() || '';
    const filterType = document.getElementById('filterByScore')?.value || 'all';
    const filterCol = document.getElementById('filterColumn')?.value || '';
    const filterRange = document.getElementById('filterByRange')?.value || 'all';

    let filtered = students;

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(student => 
            student.name.toLowerCase().includes(searchTerm)
        );
    }

    // Apply score filter
    if (filterType !== 'all' && filterCol) {
        filtered = filtered.filter(student => {
            const hasValue = student.scores && student.scores[filterCol] && 
                             String(student.scores[filterCol]).trim() !== '';
            return filterType === 'has-value' ? hasValue : !hasValue;
        });
    }

    // Apply score range filter (based on average score)
    if (filterRange !== 'all') {
        filtered = filtered.filter(student => {
            const avg = calculateStudentAverage(student, scoreColumns);
            if (avg === null) return false;

            switch(filterRange) {
                case 'excellent':
                    return avg >= 8.0 && avg <= 10;
                case 'good':
                    return avg >= 6.5 && avg < 8.0;
                case 'average':
                    return avg >= 5.0 && avg < 6.5;
                case 'weak':
                    return avg < 5.0;
                default:
                    return true;
            }
        });
    }

    return filtered;
}

// Get visible columns (respects column visibility settings)
function getVisibleColumns() {
    // If visibleColumns is empty, show all columns
    if (visibleColumns.length === 0) {
        return scoreColumns;
    }
    // Otherwise, only show selected columns
    return scoreColumns.filter(col => visibleColumns.includes(col));
}

// Populate filter column dropdown with current score columns
function populateFilterColumnDropdown() {
    const filterColumnSelect = document.getElementById('filterColumn');
    if (!filterColumnSelect) return;

    filterColumnSelect.innerHTML = '<option value="">-- Chọn cột --</option>';
    scoreColumns.forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        filterColumnSelect.appendChild(option);
    });
}

// Toggle column visibility modal/dropdown
function toggleColumnVisibility() {
    if (!columnVisibilityModal || !columnCheckboxList) {
        console.error('Column visibility modal not initialized');
        return;
    }
    
    // Populate checkbox list
    columnCheckboxList.innerHTML = '';
    
    scoreColumns.forEach((col, idx) => {
        const isVisible = visibleColumns.length === 0 || visibleColumns.includes(col);
        
        const item = document.createElement('div');
        item.className = 'column-checkbox-item' + (isVisible ? ' checked' : '');
        
        const indexSpan = document.createElement('span');
        indexSpan.className = 'column-index';
        indexSpan.textContent = idx + 1;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `colVis_${idx}`;
        checkbox.value = col;
        checkbox.checked = isVisible;
        
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                item.classList.add('checked');
            } else {
                item.classList.remove('checked');
            }
        });
        
        const label = document.createElement('label');
        label.htmlFor = `colVis_${idx}`;
        label.textContent = col;
        
        item.addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
        
        item.appendChild(indexSpan);
        item.appendChild(checkbox);
        item.appendChild(label);
        columnCheckboxList.appendChild(item);
    });
    
    // Show modal
    columnVisibilityModal.style.display = 'block';
}

// Apply column visibility changes
function applyColumnVisibilityChanges() {
    const checkedBoxes = document.querySelectorAll('#columnCheckboxList input[type="checkbox"]:checked');
    
    if (checkedBoxes.length === 0) {
        // No columns selected = show all
        visibleColumns = [];
        showErrorPopup('✅ Hiển thị tất cả các cột', true);
    } else if (checkedBoxes.length === scoreColumns.length) {
        // All columns selected = show all
        visibleColumns = [];
        showErrorPopup('✅ Hiển thị tất cả các cột', true);
    } else {
        // Some columns selected
        visibleColumns = Array.from(checkedBoxes).map(cb => cb.value);
        showErrorPopup(`✅ Hiển thị ${checkedBoxes.length}/${scoreColumns.length} cột`, true);
    }
    
    // Re-render table
    renderStudentsTable();
    
    // Close modal
    columnVisibilityModal.style.display = 'none';
}

// Render students table
function renderStudentsTable() {
    const studentsTable = document.getElementById('studentsTable');
    const students = getFilteredStudents();
    const visibleCols = getVisibleColumns();

    if (students.length === 0) {
        studentsTable.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Không tìm thấy học sinh phù hợp.</p>';
        updateStatistics();
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

    // Add score column headers (only visible ones)
    visibleCols.forEach(col => {
        tableHTML += `<th>${col} <button class="btn-icon edit" onclick="editScoreColumn('${col}')" title="Sửa tên cột">✏️</button> <button class="btn-icon delete" onclick="removeScoreColumn('${col}')" title="Xóa cột">×</button></th>`;
    });
    
    // Add average column
    tableHTML += `<th style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(16, 185, 129, 0.2));">📊 Điểm TB</th>`;

    tableHTML += `
                        <th style="width: 100px;">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Add student rows
    students.forEach((student, index) => {
        // Find original index in full student list for editing
        const originalIndex = currentRecord.students.indexOf(student);
        
        // Calculate average
        const avg = calculateStudentAverage(student, scoreColumns);
        const avgClass = getAverageClass(avg);
        const avgDisplay = avg !== null ? avg.toFixed(2) : '-';
        
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.name}</td>
        `;

        // Add score inputs (only visible columns)
        visibleCols.forEach(col => {
            const score = student.scores[col] || '';
            // If column is a 'điểm cộng' column, treat it as text (allow 'x' or notes)
            if (isColumnText(currentRecord, col)) {
                tableHTML += `
                <td>
                    <input type="text"
                           value="${score}"
                           data-student-index="${originalIndex}"
                           data-column="${col}"
                           onchange="updateStudentScore(${originalIndex}, '${col}', this.value)"
                           placeholder="VD: x hoặc ghi chú">
                </td>
            `;
            } else {
                tableHTML += `
                <td>
                    <input type="number" 
                           step="0.1" 
                           min="0" 
                           max="10"
                           value="${score}"
                           data-student-index="${originalIndex}"
                           data-column="${col}"
                           onchange="updateStudentScore(${originalIndex}, '${col}', this.value)"
                           placeholder="0-10">
                </td>
            `;
            }
        });
        
        // Add average cell
        tableHTML += `
                <td class="avg-score-cell ${avgClass}">${avgDisplay}</td>
        `;

        tableHTML += `
                <td class="student-actions">
                    <button class="btn-icon edit" onclick="openStudentModal(${originalIndex})" title="Sửa">✏️</button>
                    <button class="btn-icon delete" onclick="deleteStudent(${originalIndex})" title="Xóa">🗑️</button>
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
    
    // Update statistics after rendering
    updateStatistics();
}

// Update student score
function updateStudentScore(studentIndex, column, value) {
    if (!currentRecord.students[studentIndex].scores) {
        currentRecord.students[studentIndex].scores = {};
    }
    currentRecord.students[studentIndex].scores[column] = value;
    console.log('Updated score:', studentIndex, column, value);
    
    // Mark as unsaved and trigger auto-save
    markAsUnsaved();
    triggerAutoSave();
    
    // Update statistics
    updateStatistics();
}

// Helper: normalize string and remove accents to compare column names
function normalizeForCompare(s) {
    if (!s) return '';
    // remove diacritics
    // Use NFD and strip combining marks (covers accents) for broader browser support
    const normalized = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.toLowerCase().trim();
}

// Check if a score column should be treated as text (e.g., contains "điểm cộng")
function isTextScoreColumn(columnName) {
    const key = normalizeForCompare(columnName || '');
    // match 'điểm cộng' in many forms, without accent and case-insensitive
    return key.includes('diem cong') || key.includes('điem cong') || key.includes('điểm cộng');
}

// Determine if a column should be treated as text based on name OR existing data
function isColumnText(record, columnName) {
    // If column name explicitly indicates text, return true
    if (isTextScoreColumn(columnName)) return true;

    // If record not provided, fallback to name-based detection
    if (!record || !record.students) return isTextScoreColumn(columnName);

    // If any student has a non-numeric value for this column, treat as text
    for (const student of record.students) {
        if (!student || !student.scores) continue;
        const v = student.scores[columnName];
        if (v === undefined || v === null || String(v).trim() === '') continue;
        const s = String(v).trim();
        // Allow numbers like '8', '8.5', '7,5'
        const numeric = !isNaN(parseFloat(s.replace(',', '.')));
        if (!numeric) return true;
        // If numeric but contains letters, treat as text (defensive)
        if (/[a-zA-Z]/.test(s)) return true;
    }

    return false;
}

// Add score column
function addScoreColumn() {
    openColumnModal('add', null);
}

// Open column modal for add or edit
function openColumnModal(mode, oldName = null) {
    if (!columnModal || !columnNameInput) {
        console.error('Column modal not initialized');
        return;
    }
    
    currentEditingColumn = oldName;
    
    // Reset error state
    columnNameInput.classList.remove('error');
    columnNameError.style.display = 'none';
    
    if (mode === 'edit' && oldName) {
        // Edit mode
        columnModalIcon.textContent = '✏️';
        columnModalTitleText.textContent = 'Sửa tên cột điểm';
        columnNameInput.value = oldName;
        columnNameInput.placeholder = 'Nhập tên cột mới...';
        document.getElementById('columnModalHint').textContent = 'Nhập tên mới cho cột điểm. Tên cột phải là duy nhất.';
        confirmColumnText.textContent = 'Cập nhật';
        confirmColumnIcon.textContent = '💾';
        
        // Show old column info
        oldColumnInfo.style.display = 'block';
        oldColumnName.textContent = oldName;
    } else {
        // Add mode
        columnModalIcon.textContent = '➕';
        columnModalTitleText.textContent = 'Thêm cột điểm mới';
        columnNameInput.value = '';
        columnNameInput.placeholder = 'VD: Điểm giữa kỳ, Điểm cuối kỳ...';
        document.getElementById('columnModalHint').textContent = 'Nhập tên cột điểm. Ví dụ: Điểm giữa kỳ, Điểm cuối kỳ, Điểm thực hành...';
        confirmColumnText.textContent = 'Thêm';
        confirmColumnIcon.textContent = '✔️';
        
        // Hide old column info
        oldColumnInfo.style.display = 'none';
    }
    
    // Show modal and focus input
    columnModal.style.display = 'block';
    setTimeout(() => {
        columnNameInput.focus();
        columnNameInput.select();
    }, 100);
}

// Handle column action (add or edit)
function handleColumnAction() {
    const newName = columnNameInput.value.trim();
    
    // Validate
    if (!newName) {
        showColumnError('Vui lòng nhập tên cột');
        return;
    }
    
    if (currentEditingColumn === null) {
        // Add mode
        if (scoreColumns.includes(newName)) {
            showColumnError('Tên cột này đã tồn tại!');
            return;
        }
        
        // Add new column
        scoreColumns.push(newName);
        currentRecord.scoreColumns = scoreColumns;
        
        columnModal.style.display = 'none';
        renderStudentsTable();
        showErrorPopup('✅ Đã thêm cột mới thành công!', true);
        
        // Mark as unsaved and trigger auto-save
        markAsUnsaved();
        triggerAutoSave();
    } else {
        // Edit mode
        const oldName = currentEditingColumn;
        
        // Check if name unchanged
        if (newName === oldName) {
            columnModal.style.display = 'none';
            return;
        }
        
        // Check if new name already exists
        if (scoreColumns.includes(newName)) {
            showColumnError('Tên cột này đã tồn tại!');
            return;
        }
        
        // Update column name in scoreColumns array
        const columnIndex = scoreColumns.indexOf(oldName);
        if (columnIndex !== -1) {
            scoreColumns[columnIndex] = newName;
            currentRecord.scoreColumns = scoreColumns;
        }
        
        // Update column name in all students' scores
        currentRecord.students.forEach(student => {
            if (student.scores && student.scores.hasOwnProperty(oldName)) {
                student.scores[newName] = student.scores[oldName];
                delete student.scores[oldName];
            }
        });
        
        // Update visible columns if applicable
        if (visibleColumns.length > 0) {
            const visibleIndex = visibleColumns.indexOf(oldName);
            if (visibleIndex !== -1) {
                visibleColumns[visibleIndex] = newName;
            }
        }
        
        // Re-render the table
        renderStudentsTable();
        
        // Update filter column dropdown if it's visible
        const filterColumn = document.getElementById('filterColumn');
        if (filterColumn && filterColumn.style.display !== 'none') {
            populateFilterColumnDropdown();
        }
        
        columnModal.style.display = 'none';
        currentEditingColumn = null;
        showErrorPopup('✅ Đã đổi tên cột thành công!', true);
        
        // Mark as unsaved and trigger auto-save
        markAsUnsaved();
        triggerAutoSave();
    }
}

// Show column error
function showColumnError(message) {
    columnNameInput.classList.add('error');
    columnNameError.querySelector('.error-text').textContent = message;
    columnNameError.style.display = 'flex';
    columnNameInput.focus();
}

// Edit score column name
function editScoreColumn(oldColumnName) {
    openColumnModal('edit', oldColumnName);
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
    
    // Mark as unsaved and trigger auto-save
    markAsUnsaved();
    triggerAutoSave();
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
        if (isColumnText(currentRecord, col)) {
            scoresHTML += `
            <div class="score-item">
                <label>${col}:</label>
                <input type="text"
                       value="${score}"
                       data-column="${col}"
                       class="student-score-input"
                       placeholder="VD: x hoặc ghi chú">
            </div>
        `;
        } else {
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
        }
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
    
    // Mark as unsaved and trigger auto-save
    markAsUnsaved();
    triggerAutoSave();
}

// Delete student
async function deleteStudent(index) {
    const confirmed = await showConfirmPopup('Xóa học sinh này?');
    if (!confirmed) return;

    currentRecord.students.splice(index, 1);
    document.getElementById('studentCount').textContent = currentRecord.students.length;
    renderStudentsTable();
    
    // Mark as unsaved and trigger auto-save
    markAsUnsaved();
    triggerAutoSave();
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
    
    // Mark as unsaved and trigger auto-save
    markAsUnsaved();
    triggerAutoSave();
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
        
        // Update visibility status
        const isPublicToggle = document.getElementById('isPublicToggle');
        currentRecord.isPublic = isPublicToggle ? isPublicToggle.checked : false;

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
        
        // Clear auto-save after successful save
        clearAutoSave();
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
        
        // Clear auto-save after delete
        clearAutoSave();
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

// ============================================
// EXPORT FUNCTIONALITY
// ============================================

// Export to Excel
function exportToExcel() {
    if (!currentRecord || !currentRecord.students || currentRecord.students.length === 0) {
        showErrorPopup('Không có dữ liệu để export!');
        return;
    }
    
    try {
        showLoadingPopup('Đang tạo file Excel...');
        
        // Prepare data for export
        const headers = ['STT', 'Họ và tên', ...scoreColumns];
        const data = [headers];
        
        currentRecord.students.forEach((student, index) => {
            const row = [
                index + 1,
                student.name,
                ...scoreColumns.map(col => student.scores[col] || '')
            ];
            data.push(row);
        });
        
        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Set column widths
        const colWidths = [
            { wch: 5 },  // STT
            { wch: 25 }, // Họ và tên
            ...scoreColumns.map(() => ({ wch: 12 })) // Score columns
        ];
        ws['!cols'] = colWidths;
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Điểm học sinh');
        
        // Generate filename
        const fileName = `${currentRecord.recordName || 'BangDiem'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Download
        XLSX.writeFile(wb, fileName);
        
        hideLoadingPopup();
        showErrorPopup('✅ Export Excel thành công!', true);
        
    } catch (error) {
        console.error('❌ Export Excel error:', error);
        hideLoadingPopup();
        showErrorPopup('Lỗi khi export Excel: ' + error.message);
    }
}

// Export to PDF
function exportToPdf() {
    if (!currentRecord || !currentRecord.students || currentRecord.students.length === 0) {
        showErrorPopup('Không có dữ liệu để export!');
        return;
    }
    
    try {
        showLoadingPopup('Đang tạo file PDF...');
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Build HTML content
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${currentRecord.recordName || 'Bảng điểm'}</title>
                <style>
                    @page { size: A4 landscape; margin: 15mm; }
                    body {
                        font-family: 'Times New Roman', serif;
                        margin: 0;
                        padding: 20px;
                        font-size: 13px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 25px;
                    }
                    .header h1 {
                        font-size: 20px;
                        margin: 5px 0;
                        text-transform: uppercase;
                        font-weight: bold;
                    }
                    .header .subtitle {
                        font-size: 14px;
                        margin: 5px 0;
                        font-style: italic;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    th, td {
                        border: 1px solid #333;
                        padding: 8px;
                        text-align: center;
                    }
                    th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                        font-size: 13px;
                    }
                    td:nth-child(2) {
                        text-align: left;
                        padding-left: 12px;
                    }
                    .footer {
                        margin-top: 30px;
                        display: flex;
                        justify-content: space-between;
                        font-size: 13px;
                    }
                    .signature {
                        text-align: center;
                        width: 200px;
                    }
                    .signature .title {
                        font-weight: bold;
                        margin-bottom: 60px;
                    }
                    @media print {
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Bảng điểm học sinh</h1>
                    <div class="subtitle">${currentRecord.recordName || ''}</div>
                    <div class="subtitle">Lớp: ${currentRecord.recordClass || ''}</div>
                    <div class="subtitle">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th style="width: 50px;">STT</th>
                            <th style="width: 200px;">Họ và tên</th>
                            ${scoreColumns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${currentRecord.students.map((student, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${student.name}</td>
                                ${scoreColumns.map(col => `<td>${student.scores[col] || ''}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <div class="signature">
                        <div class="title">Giáo viên chủ nhiệm</div>
                        <div>(Ký và ghi rõ họ tên)</div>
                    </div>
                    <div class="signature">
                        <div class="title">Hiệu trưởng</div>
                        <div>(Ký và đóng dấu)</div>
                    </div>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    };
                    
                    window.onafterprint = function() {
                        window.close();
                    };
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        hideLoadingPopup();
        showErrorPopup('✅ Đang mở cửa sổ in PDF...', true);
        
    } catch (error) {
        console.error('❌ Export PDF error:', error);
        hideLoadingPopup();
        showErrorPopup('Lỗi khi export PDF: ' + error.message);
    }
}

// ============================================
// STATISTICS & ANALYTICS
// ============================================

// Calculate average score for a student
function calculateStudentAverage(student, columns) {
    if (!student.scores) return null;
    
    const numericScores = [];
    columns.forEach(col => {
        const score = student.scores[col];
        if (score !== undefined && score !== null && score !== '') {
            const numValue = parseFloat(String(score).replace(',', '.'));
            if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
                numericScores.push(numValue);
            }
        }
    });
    
    if (numericScores.length === 0) return null;
    
    const sum = numericScores.reduce((acc, val) => acc + val, 0);
    return sum / numericScores.length;
}

// Get CSS class for average score
function getAverageClass(avg) {
    if (avg === null) return '';
    if (avg >= 8.0) return 'avg-excellent';
    if (avg >= 6.5) return 'avg-good';
    if (avg >= 5.0) return 'avg-average';
    return 'avg-weak';
}

// Update statistics display
function updateStatistics() {
    if (!currentRecord || !currentRecord.students) return;
    
    const students = currentRecord.students;
    const columns = scoreColumns;
    
    // Calculate all averages
    const averages = students.map(student => calculateStudentAverage(student, columns)).filter(avg => avg !== null);
    
    if (averages.length === 0) {
        // No scores yet
        document.getElementById('statExcellent').textContent = '0';
        document.getElementById('statExcellentPercent').textContent = '0%';
        document.getElementById('statGood').textContent = '0';
        document.getElementById('statGoodPercent').textContent = '0%';
        document.getElementById('statAverage').textContent = '0';
        document.getElementById('statAveragePercent').textContent = '0%';
        document.getElementById('statWeak').textContent = '0';
        document.getElementById('statWeakPercent').textContent = '0%';
        document.getElementById('classAverage').textContent = '-';
        document.getElementById('highestScore').textContent = '-';
        document.getElementById('lowestScore').textContent = '-';
        return;
    }
    
    // Count by category
    const excellent = averages.filter(avg => avg >= 8.0).length;
    const good = averages.filter(avg => avg >= 6.5 && avg < 8.0).length;
    const average = averages.filter(avg => avg >= 5.0 && avg < 6.5).length;
    const weak = averages.filter(avg => avg < 5.0).length;
    
    const total = averages.length;
    
    // Update UI
    document.getElementById('statExcellent').textContent = excellent;
    document.getElementById('statExcellentPercent').textContent = `${((excellent / total) * 100).toFixed(1)}%`;
    
    document.getElementById('statGood').textContent = good;
    document.getElementById('statGoodPercent').textContent = `${((good / total) * 100).toFixed(1)}%`;
    
    document.getElementById('statAverage').textContent = average;
    document.getElementById('statAveragePercent').textContent = `${((average / total) * 100).toFixed(1)}%`;
    
    document.getElementById('statWeak').textContent = weak;
    document.getElementById('statWeakPercent').textContent = `${((weak / total) * 100).toFixed(1)}%`;
    
    // Calculate class statistics
    const classAvg = averages.reduce((acc, val) => acc + val, 0) / total;
    const highest = Math.max(...averages);
    const lowest = Math.min(...averages);
    
    document.getElementById('classAverage').textContent = classAvg.toFixed(2);
    document.getElementById('highestScore').textContent = highest.toFixed(2);
    document.getElementById('lowestScore').textContent = lowest.toFixed(2);
}

// Toggle statistics section
function toggleStatistics() {
    isStatsCollapsed = !isStatsCollapsed;
    
    if (isStatsCollapsed) {
        statsContent.classList.add('collapsed');
        toggleStatsIcon.classList.add('collapsed');
    } else {
        statsContent.classList.remove('collapsed');
        toggleStatsIcon.classList.remove('collapsed');
    }
}

// ============================================
// AUTO-SAVE FUNCTIONALITY
// ============================================

const AUTO_SAVE_KEY = 'cloudscore_autosave';
const AUTO_SAVE_DELAY = 3000; // 3 seconds after last change

// Mark record as having unsaved changes
function markAsUnsaved() {
    hasUnsavedChanges = true;
    updateSaveStatus('unsaved');
}

// Update save status display
function updateSaveStatus(status) {
    if (!saveStatusElement) return;
    
    saveStatusElement.classList.remove('saved', 'saving', 'error');
    
    switch (status) {
        case 'saved':
            saveStatusElement.classList.add('saved');
            saveStatusElement.textContent = 'Đã lưu';
            break;
        case 'saving':
            saveStatusElement.classList.add('saving');
            saveStatusElement.textContent = 'Đang lưu...';
            break;
        case 'unsaved':
            saveStatusElement.classList.add('saving');
            saveStatusElement.textContent = 'Chưa lưu';
            break;
        case 'error':
            saveStatusElement.classList.add('error');
            saveStatusElement.textContent = 'Lỗi lưu';
            break;
    }
}

// Trigger auto-save (debounced)
function triggerAutoSave() {
    // Clear existing timer
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    
    // Set new timer
    autoSaveTimer = setTimeout(() => {
        performAutoSave();
    }, AUTO_SAVE_DELAY);
}

// Perform auto-save to localStorage
function performAutoSave() {
    if (!currentRecord || !hasUnsavedChanges) return;
    
    try {
        updateSaveStatus('saving');
        
        // Save to localStorage
        const autoSaveData = {
            record: currentRecord,
            timestamp: new Date().toISOString(),
            isEditMode: isEditMode
        };
        
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoSaveData));
        
        hasUnsavedChanges = false;
        
        setTimeout(() => {
            updateSaveStatus('saved');
        }, 500);
        
        console.log('✅ Auto-saved successfully');
        
    } catch (error) {
        console.error('❌ Auto-save error:', error);
        updateSaveStatus('error');
    }
}

// Load auto-save draft
function loadAutoSaveDraft() {
    try {
        const savedData = localStorage.getItem(AUTO_SAVE_KEY);
        if (!savedData) return;
        
        const autoSaveData = JSON.parse(savedData);
        const savedTime = new Date(autoSaveData.timestamp);
        const now = new Date();
        const diffMinutes = (now - savedTime) / 1000 / 60;
        
        // Only load if saved within last 24 hours
        if (diffMinutes > 60 * 24) {
            localStorage.removeItem(AUTO_SAVE_KEY);
            return;
        }
        
        // Ask user if they want to restore
        const message = `Phát hiện bản nháp đã lưu từ ${formatDate(autoSaveData.timestamp)}.\n\nBạn có muốn khôi phục không?`;
        
        showConfirmPopup(message).then(confirmed => {
            if (confirmed) {
                // Restore the draft
                openRecordModal(autoSaveData.record);
                isEditMode = autoSaveData.isEditMode;
                showErrorPopup('✅ Đã khôi phục bản nháp!', true);
            } else {
                // Clear the draft
                localStorage.removeItem(AUTO_SAVE_KEY);
            }
        });
        
    } catch (error) {
        console.error('❌ Error loading auto-save:', error);
        localStorage.removeItem(AUTO_SAVE_KEY);
    }
}

// Clear auto-save draft
function clearAutoSave() {
    localStorage.removeItem(AUTO_SAVE_KEY);
    hasUnsavedChanges = false;
    updateSaveStatus('saved');
}
