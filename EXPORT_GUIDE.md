# 📤 Hướng dẫn Export dữ liệu

## ✨ Tính năng Export

CloudScore hỗ trợ export dữ liệu sang 2 định dạng:
- 📊 **Excel** (.xlsx) - Để tiếp tục chỉnh sửa và phân tích
- 📄 **PDF** - Để in ấn và lưu trữ chính thức

## 📊 Export sang Excel

### Cách sử dụng:
1. Mở bản ghi cần export
2. Click nút **"📊 Export Excel"**
3. File Excel sẽ được tự động tải xuống

### Định dạng file:
- **Tên file**: `[TênBảnGhi]_[NgàyThángNăm].xlsx`
- **Sheet name**: "Điểm học sinh"
- **Cấu trúc**:
  ```
  | STT | Họ và tên | Điểm giữa kỳ | Điểm cuối kỳ | ... |
  |-----|-----------|--------------|--------------|-----|
  |  1  | Nguyễn A  |     8.5      |     9.0      | ... |
  |  2  | Trần B    |     7.5      |     8.5      | ... |
  ```

### Độ rộng cột tự động:
- **STT**: 5 ký tự
- **Họ và tên**: 25 ký tự
- **Cột điểm**: 12 ký tự mỗi cột

### Lợi ích:
- ✅ Dễ dàng chỉnh sửa tiếp
- ✅ Import lại vào hệ thống
- ✅ Phân tích dữ liệu với Excel
- ✅ Tích hợp với các công cụ khác

## 📄 Export sang PDF

### Cách sử dụng:
1. Mở bản ghi cần export
2. Click nút **"📄 Export PDF"**
3. Cửa sổ in sẽ mở ra
4. Chọn **"Save as PDF"** hoặc **"Print to PDF"**
5. Chọn vị trí lưu và click **Save**

### Định dạng PDF:
- **Kích thước**: A4 ngang (landscape)
- **Font chữ**: Times New Roman (chuyên nghiệp)
- **Bao gồm**:
  - Tiêu đề: "Bảng điểm học sinh"
  - Tên bản ghi
  - Lớp học
  - Ngày xuất
  - Bảng điểm với viền rõ ràng
  - Chữ ký: Giáo viên chủ nhiệm và Hiệu trưởng

### Layout chuyên nghiệp:
```
┌─────────────────────────────────────────┐
│       BẢNG ĐIỂM HỌC SINH                │
│     [Tên bản ghi] - Lớp [X]             │
│       Ngày xuất: DD/MM/YYYY             │
├─────────────────────────────────────────┤
│ STT │ Họ và tên  │ Điểm 1 │ Điểm 2 │   │
├─────┼────────────┼────────┼────────┤   │
│  1  │ Nguyễn A   │  8.5   │  9.0   │   │
│  2  │ Trần B     │  7.5   │  8.5   │   │
├─────────────────────────────────────────┤
│ GV chủ nhiệm          Hiệu trưởng       │
│ (Ký và ghi rõ)        (Ký và đóng dấu)  │
└─────────────────────────────────────────┘
```

### Lợi ích:
- ✅ Định dạng chính thức, chuyên nghiệp
- ✅ Sẵn sàng in ấn
- ✅ Không thể chỉnh sửa (bảo mật)
- ✅ Có chỗ ký tên và đóng dấu

## 🔢 Làm tròn điểm (Auto Format)

### Khi Import Excel:
Hệ thống tự động làm tròn điểm đến **2 chữ số thập phân**:

**Ví dụ:**
- `8.567` → `8.57`
- `9.1234` → `9.12`
- `7.999` → `8.00`
- `10` → `10`
- `8.5` → `8.5`

### Quy tắc làm tròn:
1. Nếu giá trị là số → Làm tròn đến 2 chữ số thập phân
2. Nếu không phải số → Giữ nguyên (ví dụ: "Đ", "K", "M")
3. Sử dụng phép làm tròn chuẩn (≥0.5 thì tăng)

### Code:
```javascript
const numValue = parseFloat(scoreValue);
if (!isNaN(numValue)) {
    processedScore = String(Math.round(numValue * 100) / 100);
}
```

## 📋 Checklist trước khi Export

### Cho Excel:
- ✅ Đã nhập đủ tên học sinh
- ✅ Đã nhập điểm cho các cột cần thiết
- ✅ Kiểm tra tên bản ghi (sẽ dùng làm tên file)

### Cho PDF:
- ✅ Đã nhập đủ thông tin (tên, lớp)
- ✅ Kiểm tra điểm đã chính xác
- ✅ Chuẩn bị máy in (nếu cần in ngay)

## 🛠️ Xử lý lỗi

### Lỗi: "Không có dữ liệu để export"
**Nguyên nhân**: Bản ghi chưa có học sinh nào  
**Giải pháp**: Thêm học sinh trước khi export

### Lỗi: "Lỗi khi export Excel"
**Nguyên nhân**: Thư viện SheetJS chưa load  
**Giải pháp**: Refresh trang và thử lại

### Lỗi: "Cửa sổ in bị chặn"
**Nguyên nhân**: Browser chặn popup  
**Giải pháp**: Cho phép popup từ localhost/domain

## 💡 Tips & Tricks

### Export nhanh:
- Dùng **Excel** khi cần chỉnh sửa tiếp
- Dùng **PDF** khi cần nộp chính thức

### Tùy chỉnh PDF:
- Sau khi mở cửa sổ in, có thể:
  - Thay đổi orientation (ngang/dọc)
  - Điều chỉnh margins
  - Chọn trang cụ thể
  - Thêm header/footer

### Lưu trữ:
- **Excel**: Lưu vào Google Drive để sync
- **PDF**: Lưu vào hệ thống quản lý tài liệu

## 🎯 Demo

### Export Excel:
```
Bước 1: Mở bản ghi "6A8 - Học kỳ 1"
Bước 2: Click "📊 Export Excel"
Bước 3: File "6A8 - Học kỳ 1_2025-10-15.xlsx" được tải xuống
Bước 4: Mở bằng Excel/Google Sheets
```

### Export PDF:
```
Bước 1: Mở bản ghi "6A8 - Học kỳ 1"
Bước 2: Click "📄 Export PDF"
Bước 3: Cửa sổ in mở ra
Bước 4: Ctrl+P → Save as PDF → Chọn vị trí → Save
```

## 🔒 Bảo mật

- ✅ Export chỉ dữ liệu hiện tại (không có sensitive info)
- ✅ File Excel có thể mã hóa thêm nếu cần
- ✅ PDF có thể thêm password protection (sau khi export)

## 📚 Tài liệu liên quan

- [EXCEL_IMPORT_GUIDE.md](./EXCEL_IMPORT_GUIDE.md) - Hướng dẫn Import Excel
- [README.md](./README.md) - Tài liệu tổng quan
- [CONFIG_README.md](./CONFIG_README.md) - Cấu hình hệ thống

---

**Phiên bản**: 2.0  
**Cập nhật**: 15/10/2025  
**Tác giả**: CloudScore Team
