# 🐛 Bug Fix: Excel Import File Input Reset

## Problem
**Issue:** Khi import Excel file, lần thứ 2 chọn cùng file không hoạt động, phải F5 refresh page.

**Root Cause:** File input không được reset sau khi import. Browser cache file value, nên khi chọn lại cùng file, event `change` không trigger vì value không thay đổi.

## Reproduction Steps
1. Import file `students.xlsx`
2. Close modal
3. Click "Import Excel" lại
4. Chọn cùng file `students.xlsx`
5. ❌ Không có gì xảy ra (không trigger event change)

## Solution

### Fix 1: Reset file input in `resetExcelModal()`
```javascript
function resetExcelModal() {
    excelWorkbook = null;
    excelData = null;
    detectedMapping = { nameColumn: null, classColumn: null, scoreColumns: [] };
    
    // Reset file input to allow re-selecting the same file
    const excelFileInput = document.getElementById('excelFileInput');
    if (excelFileInput) {
        excelFileInput.value = ''; // Clear input value
    }
    
    // ... rest of reset code
}
```

**When called:**
- Khi đóng Excel modal (close button)
- Khi reset modal

### Fix 2: Reset after successful import
```javascript
function importExcelData() {
    try {
        // ... import logic ...
        
        // Open detail modal with imported data
        document.getElementById('excelModal').style.display = 'none';
        
        // Reset file input for next import
        const excelFileInput = document.getElementById('excelFileInput');
        if (excelFileInput) {
            excelFileInput.value = '';
        }
        
        openRecordModal(newRecord);
        // ...
    }
}
```

**When called:**
- Ngay sau khi import thành công

## Technical Details

### Why `input.value = ''` works?
```javascript
// Browser behavior:
// 1. User selects file → input.value = "C:\fakepath\students.xlsx"
// 2. Change event fires
// 3. User selects same file again → value unchanged → no event

// Solution:
// 1. After processing, set input.value = ''
// 2. User selects file → value changes from '' to path → event fires!
```

### Alternative approaches (not used)
```javascript
// Method 2: Clone and replace node
const newInput = excelFileInput.cloneNode(true);
excelFileInput.parentNode.replaceChild(newInput, excelFileInput);

// Method 3: Use click event instead of change
// But this requires manual file selection tracking
```

## Testing

### Test Cases
- [x] Import file lần 1 → Success
- [x] Import cùng file lần 2 → Success (không cần F5)
- [x] Import file khác → Success
- [x] Đóng modal giữa chừng → Reset đúng
- [x] Import → Cancel → Import lại → Success

### Verification
```javascript
// Before fix
console.log(excelFileInput.value); // "C:\fakepath\students.xlsx"
// Select same file → No event

// After fix
console.log(excelFileInput.value); // "" (empty)
// Select same file → Event fires!
```

## Impact
- ✅ Không còn phải F5 để import lại cùng file
- ✅ User experience tốt hơn
- ✅ No breaking changes
- ✅ All existing features work

## Files Modified
- `app.js`: 
  - `resetExcelModal()` - Added input reset
  - `importExcelData()` - Added input reset after success

## Related Issues
- Similar to common file upload bugs
- Standard pattern for resetting file inputs

---

**Fixed by:** Performance optimization session  
**Date:** 2025-10-15  
**Impact:** Low complexity, high UX improvement
